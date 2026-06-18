// Pure Turf AI — Scorecard follow-up health (Phase 2).
// Per-rep "needs follow-up" intelligence: OPEN deals that have gone cold (no logged
// activity in N days) and estimate-stage deals that have stalled. Powers the rep's
// "what to do today" list and grounds the AI coach in specific deals. Loaded lazily
// when the scorecard opens (own CDN cache), like scorecard.mjs.
import { PIPELINE_2026_SALES, ACTIVE_PIPELINES, OWNER_NAMES, NON_SALES_STAFF, DEAL_STAGE_NAMES, fetchDealsInPipelines } from './_shared/crm.mjs';

const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
// Tunables. The actionable "chase" list = open deals old enough to be overdue (>= MIN_AGE)
// but not ancient (<= ANCIENT), that have had no deal-level touch in FOLLOWUP_STALE days.
// Deals older than ANCIENT are a separate "review / close-out" pile (this absorbs the March
// bulk-import cohort and genuinely-dead estimates) — surfaced honestly, not as "neglect."
const FOLLOWUP_STALE_DAYS = 21; // no logged touch in this many days → needs a nudge
const MIN_AGE_DAYS = 10;        // brand-new deals aren't "overdue" yet
const ANCIENT_DAYS = 75;        // older than this → review/close pile, not the active chase list

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
    // hs_last_sales_activity_timestamp rolls up activity logged on the deal OR its
    // associated contacts (so Aircall calls that attach to contacts still count). We use
    // the most recent of it + notes_last_contacted as "last touch", and never flag a deal
    // younger than the threshold (a 2-day-old deal isn't "cold").
    const props = 'dealname,amount,dealstage,pipeline,hubspot_owner_id,createdate,notes_last_contacted,hs_last_sales_activity_timestamp';
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

      const lastTouch = Math.max(ms(p.notes_last_contacted), ms(p.hs_last_sales_activity_timestamp));
      const ageDays = daysAgo(ms(p.createdate));               // how old the deal is
      const ds = lastTouch ? daysAgo(lastTouch) : null;        // days since last logged touch (null = never)
      const sinceTouch = lastTouch ? daysAgo(lastTouch) : ageDays; // never touched → fall back to age
      const isEstimate = stage.toLowerCase().includes('estimate');

      const R = reps[owner] || (reps[owner] = { name: OWNER_NAMES[owner], open: 0, chaseable: 0, needsFollowUp: 0, staleOld: 0, deals: [] });
      R.open++;
      if (ageDays != null && ageDays > ANCIENT_DAYS) {
        R.staleOld++;                                          // ancient/dead — review or close-lost (not active follow-up)
      } else if (ageDays != null && ageDays >= MIN_AGE_DAYS) {
        R.chaseable++;                                         // in the active window
        if (sinceTouch != null && sinceTouch >= FOLLOWUP_STALE_DAYS) {
          R.needsFollowUp++;
          R.deals.push({ name: p.dealname || 'Unnamed deal', amount: Math.round(parseFloat(p.amount) || 0), stage, daysSince: ds, ageDays, isEstimate });
        }
      }
    }

    // Per rep: rank the chase list (biggest $ first), cap, and compute a follow-up rate
    // over the ACTIVE window only (not the ancient pile).
    const byName = {};
    for (const R of Object.values(reps)) {
      R.deals.sort((a, b) => b.amount - a.amount);
      R.topDeals = R.deals.slice(0, 8);
      R.followUpRate = R.chaseable > 0 ? Math.round(((R.chaseable - R.needsFollowUp) / R.chaseable) * 100) : null;
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
