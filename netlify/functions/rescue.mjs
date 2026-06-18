// Pure Turf AI — Revenue Rescue (GET). The core intelligence endpoint: scores every
// open deal, builds the rescue queue, per-rep follow-up health, and leadership
// revenue-at-risk — all computed on-demand from live HubSpot (no derived data is
// persisted; it would go stale vs. the CRM). Mirrors scorecard-followups.mjs.
import { getStore } from '@netlify/blobs';
import {
  ACTIVE_PIPELINES, PIPELINE_2026_COMMERCIAL, DEAL_STAGES_WON, DEAL_STAGES_LOST,
  OWNER_NAMES, NON_SALES_STAFF, leadSourceOf, fetchDealsInPipelines,
} from './_shared/crm.mjs';
import { DEFAULT_WEIGHTS, OPEN_STAGES, scoreDeal, toRescueItem, parseDealName } from './_shared/rescue.mjs';

const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
const MANAGERS = ['david@pureturfllc.com', 'rbone@pureturfllc.com', 'kdryden@pureturfllc.com', 'dhamby@pureturfllc.com'];

// Resolve a requester email to a rep owner-name (so a rep sees only their own queue).
function ownerNameForEmail(email) {
  const local = (email || '').split('@')[0].toLowerCase();
  if (!local) return null;
  for (const name of Object.values(OWNER_NAMES)) {
    if (name.split(' ')[0].toLowerCase() === local) return name;
  }
  return null;
}

const URGENCY_RANK = { high: 0, medium: 1, low: 2 };

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS });
  try {
    const url = new URL(req.url);
    const email = (url.searchParams.get('requester_email') || '').toLowerCase();
    const isManager = MANAGERS.includes(email);
    const myName = isManager ? null : ownerNameForEmail(email);

    const props = [
      'dealname', 'amount', 'dealstage', 'pipeline', 'hubspot_owner_id', 'createdate',
      'notes_last_contacted', 'num_notes', 'closedate', 'hs_analytics_source', 'true_lead_source',
      'hs_v2_date_entered_1271775084', 'hs_v2_date_entered_1308218008', 'hs_v2_date_entered_1271775085',
    ];
    const [{ rows }, stateBlob, configBlob] = await Promise.all([
      fetchDealsInPipelines(HUBSPOT_TOKEN, ACTIVE_PIPELINES, props),
      getStore({ name: 'pt-rescue-state', consistency: 'strong' }).get('all', { type: 'json' }).catch(() => null),
      getStore({ name: 'pt-rescue-config', consistency: 'strong' }).get('config', { type: 'json' }).catch(() => null),
    ]);
    const state = stateBlob || {};
    const weights = { ...DEFAULT_WEIGHTS, ...(configBlob?.weights || {}) };
    const now = Date.now();

    // ── Build context the scorer needs across the whole deal set ──
    const priorWonAddresses = new Set();
    const openAddressCounts = new Map();
    const srcAgg = {}; // source -> { won, lost }
    for (const d of rows) {
      const p = d.properties;
      const stage = p.dealstage;
      const { addressKey } = parseDealName(p.dealname);
      if (DEAL_STAGES_WON.includes(stage)) {
        if (addressKey) priorWonAddresses.add(addressKey);
      }
      if (OPEN_STAGES.includes(stage) && addressKey) {
        openAddressCounts.set(addressKey, (openAddressCounts.get(addressKey) || 0) + 1);
      }
      if (DEAL_STAGES_WON.includes(stage) || DEAL_STAGES_LOST.includes(stage)) {
        const { source } = leadSourceOf(p);
        const a = srcAgg[source] || (srcAgg[source] = { won: 0, lost: 0 });
        if (DEAL_STAGES_WON.includes(stage)) a.won++; else a.lost++;
      }
    }
    // Classify each source as high/low/mid converting (volume-gated) vs the overall average.
    const sourceRank = {};
    const sources = Object.entries(srcAgg).map(([s, a]) => ({ s, vol: a.won + a.lost, cr: a.won + a.lost > 0 ? a.won / (a.won + a.lost) : 0 }));
    const totW = sources.reduce((t, x) => t + x.cr * x.vol, 0), totV = sources.reduce((t, x) => t + x.vol, 0);
    const avgCr = totV > 0 ? totW / totV : 0;
    for (const x of sources) {
      if (x.vol < 15) continue; // not enough signal
      if (x.cr >= avgCr + 0.05) sourceRank[x.s] = 'high';
      else if (x.cr <= avgCr - 0.10) sourceRank[x.s] = 'low';
    }

    const ctx = { now, commercialPipeline: PIPELINE_2026_COMMERCIAL, priorWonAddresses, openAddressCounts, sourceRank };

    // ── Score open deals owned by real reps → rescue items ──
    const allItems = [];
    const byRep = {};
    for (const d of rows) {
      const p = d.properties;
      if (!OPEN_STAGES.includes(p.dealstage)) continue;
      const owner = p.hubspot_owner_id;
      if (!owner || !OWNER_NAMES[owner]) continue; // only named reps' deals

      const scored = scoreDeal(d, ctx, weights);
      const item = toRescueItem(scored);
      const st = state[item.dealId] || null;
      item.state = st;

      // Per-rep health (counts everything, even snoozed/contacted)
      const repName = scored.ownerName;
      const R = byRep[repName] || (byRep[repName] = { name: repName, assigned: 0, contacted: 0, staleEstimates: 0, neverContacted: 0, revenueAtRisk: 0, rescueCount: 0 });
      R.assigned++;
      if (scored.everTouched) R.contacted++; else R.neverContacted++;
      if (scored.flags.includes('staleEstimate')) R.staleEstimates++;

      // Active queue = flagged & not dismissed/snoozed-future/contacted-clear
      const dismissed = st?.status === 'dismissed';
      const snoozed = st?.snoozed_until && new Date(st.snoozed_until).getTime() > now;
      const contacted = st?.status === 'contacted';
      const inQueue = (scored.flags.length > 0 || scored.score >= 6) && !dismissed && !snoozed && !contacted;
      if (inQueue) {
        R.rescueCount++;
        if (item.revenueImpact !== 'Low') R.revenueAtRisk += item.value;
      }
      allItems.push({ ...item, _inQueue: inQueue, _repName: repName });
    }

    // Sort: urgency, then score, then value
    allItems.sort((a, b) =>
      (URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]) || (b.priorityScore - a.priorityScore) || (b.value - a.value));

    // Role scoping
    const scoped = myName ? allItems.filter(i => i._repName === myName) : allItems;
    const queue = scoped.filter(i => i._inQueue).map(({ _inQueue, _repName, ...rest }) => rest);
    const snoozedItems = scoped.filter(i => i.state?.snoozed_until && new Date(i.state.snoozed_until).getTime() > now).map(({ _inQueue, _repName, ...rest }) => rest);

    // Leadership rollup (full set)
    const leadership = {
      revenueAtRisk: allItems.filter(i => i._inQueue && i.revenueImpact !== 'Low').reduce((t, i) => t + i.value, 0),
      openRescue: allItems.filter(i => i._inQueue).length,
      newUncontacted: allItems.filter(i => i.flags.includes('newUncontacted')).length,
      staleEstimates: allItems.filter(i => i.flags.includes('staleEstimate')).length,
      highValueStuck: allItems.filter(i => i.flags.includes('highValueStuck')).length,
      openUntouchedValue: allItems.filter(i => !i.state && i.flags.includes('estimateNoFollowup')).reduce((t, i) => t + i.value, 0),
      duplicates: allItems.filter(i => i.flags.includes('duplicate')).length,
    };

    const repHealth = Object.values(byRep)
      .filter(r => !NON_SALES_STAFF.has(Object.keys(OWNER_NAMES).find(id => OWNER_NAMES[id] === r.name)))
      .map(r => ({ ...r, contactedRate: r.assigned > 0 ? Math.round((r.contacted / r.assigned) * 100) : null }))
      .sort((a, b) => b.revenueAtRisk - a.revenueAtRisk);

    return new Response(JSON.stringify({
      ok: true, role: isManager ? 'manager' : 'rep', repName: myName,
      queue, snoozed: snoozedItems,
      byRep: repHealth,
      leadership,
      weights,
      counts: { queue: queue.length, total: allItems.length },
      fetchedAt: new Date().toISOString(),
    }), { status: 200, headers: { ...CORS, 'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=300, stale-while-revalidate=900' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message, queue: [], byRep: [], leadership: {} }), { status: 200, headers: CORS });
  }
};
