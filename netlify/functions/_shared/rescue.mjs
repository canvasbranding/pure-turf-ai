// Pure Turf AI — Revenue Rescue scoring + rules core.
// The shared intelligence layer: scores every OPEN deal for priority and produces
// "rescue items" (what to do, why, urgency, revenue impact). Imported by rescue.mjs.
// `_shared` is ignored by Netlify's bundler, so this is never an endpoint itself.
//
// GROUNDING (verified against live HubSpot): the rich CRM inputs the ideal model
// would use — lawn sq-ft, selected program, lost reason, true speed-to-lead — are
// NOT populated in HubSpot today. So those weights ship "dark": their inputs come
// back null and contribute 0, and we surface them as "needs data" instead of
// fabricating. The model runs on what's real: value, stage, age, time-in-stage,
// days-since-contact, activity count, owner, lead source, address (parsed from the
// deal name). When the fields get populated, the dark weights light up automatically.
import { DEAL_STAGE_NAMES, OWNER_NAMES, leadSourceOf } from './crm.mjs';

const HS_PORTAL = '50278916'; // for record deep-links
export const OPEN_STAGES = ['1271775084', '1308218008', '1271775085']; // Ready, Attempting, Estimate Sent
const STAGE_ESTIMATE = '1271775085';
const STAGE_EARLY = new Set(['1271775084', '1308218008']);

// Every signal's points — configurable (overridden by pt-rescue-config in rescue.mjs).
export const DEFAULT_WEIGHTS = {
  // ── Active signals (real data available) ──
  newUncontacted: 25,      // early-stage lead, zero activity logged
  estimateNoFollowup: 20,  // estimate sent, no follow-up logged yet
  staleEstimate: 30,       // estimate sitting past the cold threshold
  openNoActivity: 15,      // open deal, no logged touch in rotDays
  highValueStuck: 20,      // big deal stuck in-stage too long
  highValue: 20,           // deal value above the per-pipeline threshold
  highConvSource: 15,      // came from a high-closing source
  lowQualitySource: -10,   // came from a low-closing source
  existingUpsell: 15,      // address matches a prior won deal (upsell)
  duplicate: -50,          // same address open more than once
  revival: 8,              // ancient open deal — low-priority revive pile
  // ── Dark-until-data (inputs empty in HubSpot today → contribute 0, shown as "needs data") ──
  propertySize: 25,        // large lawn (needs lawn sq-ft field)
  programCore: 20,         // requested core lawn program (needs program field)
  aosSeason: 20,           // aeration/overseeding during AOS season (needs service-interest field)
  mosquitoSeason: 15,      // mosquito during active route window (needs service-interest field)
  speedToLead: 25,         // no first contact within 15 min (needs lead-arrival timestamp)
  emailEngaged: 10,        // opened/clicked email, no rep follow-up (needs marketing-email data)
  // ── Thresholds (also configurable) ──
  highValueResidential: 900,
  highValueCommercial: 5000,
  stuckDays: 14,
  staleDays: 7,
  rotDays: 7,
  ancientDays: 75,
};

// The dark signals, for honest "needs data" disclosure in the UI.
export const DARK_SIGNALS = [
  { key: 'propertySize',  label: 'Property size',        needs: 'lawn square-footage field on the deal/contact' },
  { key: 'programCore',   label: 'Program requested',    needs: 'selected-program field (active_lawn_tier/program_size is blank)' },
  { key: 'aosSeason',     label: 'AOS season fit',       needs: 'service-interest field' },
  { key: 'mosquitoSeason',label: 'Mosquito season fit',  needs: 'service-interest field' },
  { key: 'speedToLead',   label: 'Speed-to-lead',        needs: 'lead-arrival timestamp (deals are created at estimate time)' },
  { key: 'emailEngaged',  label: 'Email engagement',     needs: 'marketing email open/click data' },
];

const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const ms = t => (t ? new Date(t).getTime() : 0);
const daysBetween = (a, b) => (a && b ? Math.floor((a - b) / 864e5) : null);

// Parse "Customer Name - 123 Some St 2026" → { customer, address }. Address is the key
// we use for duplicate + existing-customer matching (the structured address fields are blank).
export function parseDealName(name) {
  const raw = (name || '').trim();
  const dash = raw.indexOf(' - ');
  let customer = '', addr = raw;
  if (dash >= 0) { customer = raw.slice(0, dash).trim(); addr = raw.slice(dash + 3).trim(); }
  addr = addr.replace(/\s+20\d{2}\s*$/, '').trim(); // drop trailing season year
  const addressKey = addr.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  return { customer, address: addr, addressKey };
}

// Pull the real, available signals off a deal. ctx supplies `now` and stage-date lookup.
export function extractSignals(deal, ctx = {}) {
  const p = deal.properties || {};
  const now = ctx.now || ms(new Date().toISOString());
  const stageId = p.dealstage;
  const stage = DEAL_STAGE_NAMES[stageId] || 'Open';
  const enteredStage = ms(p[`hs_v2_date_entered_${stageId}`]);
  const lastContact = ms(p.notes_last_contacted);
  const created = ms(p.createdate);
  const { customer, address, addressKey } = parseDealName(p.dealname);
  const { source } = leadSourceOf(p);
  return {
    id: deal.id,
    name: p.dealname || 'Unnamed deal',
    customer, address, addressKey,
    pipeline: p.pipeline,
    stageId, stage,
    value: Math.round(num(p.amount)),
    owner: p.hubspot_owner_id,
    ownerName: OWNER_NAMES[p.hubspot_owner_id] || null,
    source,
    ageDays: daysBetween(now, created),
    daysInStage: enteredStage ? daysBetween(now, enteredStage) : daysBetween(now, created),
    daysSinceContact: lastContact ? daysBetween(now, lastContact) : null,
    activityCount: parseInt(p.num_notes) || 0,
    lastTouch: lastContact ? new Date(lastContact).toISOString() : null,
    everTouched: (parseInt(p.num_notes) || 0) > 0 || lastContact > 0,
  };
}

// Score a deal. Returns the full picture: numeric score, priority label, the breakdown
// (every applied rule), the matched rescue rules, and which signals are dark (needs data).
export function scoreDeal(deal, ctx = {}, weights = DEFAULT_WEIGHTS) {
  const w = { ...DEFAULT_WEIGHTS, ...(weights || {}) };
  const s = extractSignals(deal, ctx);
  const breakdown = [];
  const flags = [];
  const add = (key, label, points) => { if (points) { breakdown.push({ key, label, points }); } };

  const isEstimate = s.stageId === STAGE_ESTIMATE;
  const isEarly = STAGE_EARLY.has(s.stageId);
  const ancient = s.daysInStage != null && s.daysInStage > w.ancientDays;
  const hvThreshold = s.pipeline && ctx.commercialPipeline && s.pipeline === ctx.commercialPipeline
    ? w.highValueCommercial : w.highValueResidential;
  const highValue = s.value >= hvThreshold;

  // ── Active rules ──
  if (ancient) {
    add('revival', 'Older deal — revive or close', w.revival);
    flags.push('revival');
  } else {
    if (isEarly && !s.everTouched && (s.ageDays ?? 0) >= 1) { add('newUncontacted', 'New lead, no contact logged', w.newUncontacted); flags.push('newUncontacted'); }
    if (isEstimate && s.activityCount === 0 && (s.daysInStage ?? 0) >= 2) { add('estimateNoFollowup', 'Estimate sent, no follow-up logged', w.estimateNoFollowup); flags.push('estimateNoFollowup'); }
    if (isEstimate && (s.daysInStage ?? 0) > w.staleDays) { add('staleEstimate', `Estimate cold (${s.daysInStage}d in stage)`, w.staleEstimate); flags.push('staleEstimate'); }
    if (!isEstimate && s.daysSinceContact != null && s.daysSinceContact >= w.rotDays) { add('openNoActivity', `No activity in ${s.daysSinceContact}d`, w.openNoActivity); flags.push('openNoActivity'); }
    if (highValue && (s.daysInStage ?? 0) > w.stuckDays) { add('highValueStuck', `High-value deal stuck ${s.daysInStage}d`, w.highValueStuck); flags.push('highValueStuck'); }
  }
  if (highValue) add('highValue', `Deal value $${s.value.toLocaleString()}`, w.highValue);

  // Source quality (from computed close-rates passed in ctx.sourceRank)
  const rank = ctx.sourceRank?.[s.source];
  if (rank === 'high') add('highConvSource', `High-closing source (${s.source})`, w.highConvSource);
  else if (rank === 'low') add('lowQualitySource', `Low-closing source (${s.source})`, w.lowQualitySource);

  // Existing customer / upsell (prior won deal at same address)
  if (s.addressKey && ctx.priorWonAddresses?.has(s.addressKey)) { add('existingUpsell', 'Existing customer — upsell', w.existingUpsell); flags.push('existingUpsell'); }

  // Duplicate (same address open more than once)
  if (s.addressKey && (ctx.openAddressCounts?.get(s.addressKey) || 0) > 1) { add('duplicate', 'Possible duplicate (same address open >1×)', w.duplicate); flags.push('duplicate'); }

  const score = breakdown.reduce((t, b) => t + b.points, 0);
  const label = priorityLabel(score, flags);
  const darkSignals = DARK_SIGNALS; // all currently dark — fields empty in HubSpot

  return { ...s, score, label, breakdown, flags, highValue, ancient, darkSignals };
}

function priorityLabel(score, flags) {
  if (flags.includes('duplicate')) return 'Duplicate';
  if (score >= 55) return 'Hot';
  if (score >= 40) return 'High Priority';
  if (score >= 28) return 'Needs Fast Follow-Up';
  if (flags.includes('existingUpsell') && score < 28) return 'Existing Customer Upsell';
  if (score >= 16) return 'At Risk';
  if (score >= 6) return 'Going Cold';
  return 'Low Priority';
}

// The headline rule for a scored deal: highest-urgency match drives the recommended action.
const RULE_PLAYBOOK = {
  newUncontacted:     { urgency: 'high', action: 'Call now — new lead with no contact logged.' },
  staleEstimate:      { urgency: 'high', action: 'Estimate going cold — call to revive, then close or mark lost.' },
  highValueStuck:     { urgency: 'high', action: 'High-value deal stuck — get a real next step on the calendar.' },
  estimateNoFollowup: { urgency: 'high', action: 'Follow up on the estimate — none is logged yet. Call, then SMS.' },
  openNoActivity:     { urgency: 'medium', action: 'Re-engage — no activity logged recently.' },
  existingUpsell:     { urgency: 'low', action: 'Existing customer — pitch an add-on or program upgrade.' },
  revival:            { urgency: 'low', action: 'Old open deal — revive with a fresh angle or close it out.' },
  duplicate:          { urgency: 'low', action: 'Looks like a duplicate — verify and merge/clean up.' },
};
const RULE_PRIORITY = ['staleEstimate', 'newUncontacted', 'highValueStuck', 'estimateNoFollowup', 'openNoActivity', 'existingUpsell', 'revival', 'duplicate'];

// Turn a scored deal into a rescue item (the card the rep/manager acts on).
export function toRescueItem(scored) {
  const primary = RULE_PRIORITY.find(r => scored.flags.includes(r));
  const play = RULE_PLAYBOOK[primary] || { urgency: scored.score >= 28 ? 'high' : scored.score >= 16 ? 'medium' : 'low', action: 'Review and decide the next step.' };
  const impact = scored.highValue || scored.score >= 40 ? 'High' : scored.score >= 18 ? 'Medium' : 'Low';
  const reasonBits = [];
  if (scored.flags.includes('staleEstimate')) reasonBits.push(`Estimate ${scored.daysInStage}d in stage, no movement`);
  else if (scored.flags.includes('estimateNoFollowup')) reasonBits.push(`Estimate sent ${scored.daysInStage}d ago, no follow-up logged`);
  else if (scored.flags.includes('newUncontacted')) reasonBits.push(`New lead ${scored.ageDays}d old, no contact logged`);
  else if (scored.flags.includes('openNoActivity')) reasonBits.push(`No logged activity in ${scored.daysSinceContact}d`);
  if (scored.highValue) reasonBits.push(`$${scored.value.toLocaleString()} deal`);
  if (scored.source && scored.source !== 'Unknown') reasonBits.push(`source: ${scored.source}`);
  return {
    dealId: scored.id,
    name: scored.name,
    customer: scored.customer || null,
    owner: scored.owner,
    ownerName: scored.ownerName,
    value: scored.value,
    source: scored.source,
    stage: scored.stage,
    daysSinceCreated: scored.ageDays,
    daysInStage: scored.daysInStage,
    daysSinceActivity: scored.daysSinceContact,
    lastTouch: scored.lastTouch,
    activityCount: scored.activityCount,
    priorityScore: scored.score,
    priorityLevel: scored.label,
    urgency: play.urgency,
    recommendedAction: play.action,
    revenueImpact: impact,
    reason: reasonBits.join(' · ') || 'Open deal needing attention',
    breakdown: scored.breakdown,
    flags: scored.flags,
    hubspotUrl: `https://app.hubspot.com/contacts/${HS_PORTAL}/record/0-3/${scored.id}`,
  };
}
