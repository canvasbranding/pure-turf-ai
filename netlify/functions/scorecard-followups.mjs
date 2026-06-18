// Pure Turf AI — Scorecard follow-up health (Phase 2).
// Per-rep "needs follow-up" intelligence: OPEN deals that have gone cold (no logged
// activity in N days) and estimate-stage deals that have stalled. Powers the rep's
// "what to do today" list and grounds the AI coach in specific deals. Loaded lazily
// when the scorecard opens (own CDN cache), like scorecard.mjs.
import { PIPELINE_2026_SALES, ACTIVE_PIPELINES, OWNER_NAMES, NON_SALES_STAFF, DEAL_STAGE_NAMES, fetchDealsInPipelines } from './_shared/crm.mjs';

const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
// NOTE: this is NOT the team's speed-to-lead SLA (contact within 1 hour) — that needs a
// lead-arrival timestamp that doesn't exist in HubSpot yet (deals are created at
// estimate-sent time, not lead-arrival). This is an estimate FOLLOW-UP worklist: open
// estimates with no follow-up logged on the deal, ranked by value. Deals older than
// ANCIENT are a separate review/close pile (auto-generated/import backlog).
const FOLLOWUP_STALE_DAYS = 2;  // ignore an estimate's first couple days before flagging
const MIN_AGE_DAYS = 2;         // a deal must be at least this old to be on the worklist
const ANCIENT_DAYS = 75;        // older than this → review/close pile, not the active list

async function fetchStageMap() {
  try {
    const r = await fetch('https://api.hubapi.com/crm/v3/pipelines/deals', {
      headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}` }, signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return {};
    const data = await r.json();
    const map = {};
    (data.results || []).forEach(p => (p.stages || []).forEach(s => { map[s.id] = s.label; }));
    return map;
  } catch { return {}; }
}

export default async (req) => {
  const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS });

  try {
    // notes_last_contacted = last logged call/email/meeting on the deal (reliable here —
    // real leads get a touch logged within minutes). num_notes = total logged activities
    // (0 = genuinely never touched on the deal).
    const props = 'dealname,amount,dealstage,pipeline,hubspot_owner_id,createdate,notes_last_contacted,num_notes';
    const [{ rows }, stageMap] = await Promise.all([
      fetchDealsInPipelines(HUBSPOT_TOKEN, ACTIVE_PIPELINES, props),
      fetchStageMap(),
    ]);
    const stageName = id => stageMap[id] || DEAL_STAGE_NAMES[id] || '';
    const now = Date.now();
    const ms = ts => (ts ? new Date(ts).getTime() : 0);
    const daysAgo = t => (t ? Math.floor((now - t) / 864e5) : null);

    const reps = {}; // ownerId -> stats
    for (const d of rows) {
      const p = d.properties;
      if (p.pipeline !== PIPELINE_2026_SALES) continue;        // residential sales pipeline
      const stage = stageName(p.dealstage);
      if (stage.toLowerCase().includes('closed')) continue;    // open deals only
      const owner = p.hubspot_owner_id;
      if (!owner || NON_SALES_STAFF.has(owner) || !OWNER_NAMES[owner]) continue;

      const ageDays = daysAgo(ms(p.createdate));               // how old the deal is
      const lastContact = ms(p.notes_last_contacted);
      const everTouched = (parseInt(p.num_notes) || 0) > 0 || lastContact > 0;
      const ds = lastContact ? daysAgo(lastContact) : null;    // days since last logged contact (null = never)
      const sinceTouch = lastContact ? daysAgo(lastContact) : ageDays; // never touched → fall back to age
      const isEstimate = stage.toLowerCase().includes('estimate');

      const R = reps[owner] || (reps[owner] = { name: OWNER_NAMES[owner], open: 0, chaseable: 0, neverContacted: 0, wentQuiet: 0, staleOld: 0, deals: [] });
      R.open++;
      if (ageDays != null && ageDays > ANCIENT_DAYS) {
        R.staleOld++;                                          // ancient/dead — review or close-lost
      } else if (ageDays != null && ageDays >= MIN_AGE_DAYS) {
        R.chaseable++;                                         // past the 48h SLA, still active
        if (!everTouched) {
          R.neverContacted++;                                 // 48h+ old with ZERO logged contact — the sharp miss
          R.deals.push({ name: p.dealname || 'Unnamed deal', amount: Math.round(parseFloat(p.amount) || 0), stage, daysSince: ds, ageDays, isEstimate });
        } else if (sinceTouch != null && sinceTouch >= FOLLOWUP_STALE_DAYS) {
          R.wentQuiet++;                                       // contacted once, but not in 48h (softer signal)
        }
      }
    }

    // Per rep: the call-list = never-contacted deals, biggest $ first. "Contacted rate"
    // = share of active deals that have at least had first contact (the trustworthy number).
    const byName = {};
    for (const R of Object.values(reps)) {
      R.deals.sort((a, b) => b.amount - a.amount);
      R.topDeals = R.deals.slice(0, 8);
      R.needsFollowUp = R.neverContacted; // back-compat: primary headline = never-contacted
      R.contactedRate = R.chaseable > 0 ? Math.round(((R.chaseable - R.neverContacted) / R.chaseable) * 100) : null;
      R.followUpRate = R.contactedRate;   // back-compat alias
      delete R.deals;
      byName[R.name] = R;
    }

    return new Response(JSON.stringify({ reps: byName, followupStaleDays: FOLLOWUP_STALE_DAYS, ancientDays: ANCIENT_DAYS, fetchedAt: new Date().toISOString() }), {
      status: 200,
      headers: { ...CORS, 'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=300, stale-while-revalidate=900' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, reps: {} }), { status: 200, headers: CORS });
  }
};
