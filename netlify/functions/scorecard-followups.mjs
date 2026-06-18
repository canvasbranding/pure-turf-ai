// Pure Turf AI — Scorecard follow-up health (Phase 2).
// Per-rep "needs follow-up" intelligence: OPEN deals that have gone cold (no logged
// activity in N days) and estimate-stage deals that have stalled. Powers the rep's
// "what to do today" list and grounds the AI coach in specific deals. Loaded lazily
// when the scorecard opens (own CDN cache), like scorecard.mjs.
import { PIPELINE_2026_SALES, ACTIVE_PIPELINES, OWNER_NAMES, NON_SALES_STAFF, DEAL_STAGE_NAMES, fetchDealsInPipelines } from './_shared/crm.mjs';

const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const STALE_DAYS = 7;      // an open deal with no activity in this many days needs follow-up
const STALE_EST_DAYS = 10; // an estimate-stage deal cold this long is a stalled estimate

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
      const created = ms(p.createdate);
      const ageDays = daysAgo(created);                        // how old the deal is
      const ds = lastTouch ? daysAgo(lastTouch) : null;        // days since last touch (null = never)
      // Cold = no touch in N days, AND the deal is old enough to expect one.
      const sinceRef = lastTouch ? daysAgo(lastTouch) : ageDays;
      const cold = sinceRef != null && sinceRef >= STALE_DAYS;
      const isEstimate = stage.toLowerCase().includes('estimate');
      const estCold = isEstimate && sinceRef != null && sinceRef >= STALE_EST_DAYS;

      const R = reps[owner] || (reps[owner] = { name: OWNER_NAMES[owner], open: 0, needsFollowUp: 0, staleEstimates: 0, deals: [] });
      R.open++;
      if (cold) {
        R.needsFollowUp++;
        R.deals.push({ name: p.dealname || 'Unnamed deal', amount: Math.round(parseFloat(p.amount) || 0), stage, daysSince: ds, ageDays, isEstimate });
      }
      if (estCold) R.staleEstimates++;
    }

    // Per rep: rank cold deals (biggest $ first), cap, and compute a follow-up rate.
    const byName = {};
    for (const R of Object.values(reps)) {
      R.deals.sort((a, b) => b.amount - a.amount);
      R.topDeals = R.deals.slice(0, 8);
      R.followUpRate = R.open > 0 ? Math.round(((R.open - R.needsFollowUp) / R.open) * 100) : null;
      delete R.deals;
      byName[R.name] = R;
    }

    return new Response(JSON.stringify({ reps: byName, staleDays: STALE_DAYS, staleEstDays: STALE_EST_DAYS, fetchedAt: new Date().toISOString() }), {
      status: 200,
      headers: { ...CORS, 'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=300, stale-while-revalidate=900' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, reps: {} }), { status: 200, headers: CORS });
  }
};
