// Pure Turf AI — Operating Items aggregator (GET). The shared spine that powers the
// Today feed, briefing, decision center and meeting mode. Computes items ON READ from
// live data via multiple "providers" (Phase 1: Sales/Rescue + Goals), normalizes them
// to the operating-item model, applies persisted user state, and returns a role-scoped,
// priority-sorted feed. No derived data is stored — only user action-state (pt-operating-state).
import { getStore } from '@netlify/blobs';
import {
  ACTIVE_PIPELINES, PIPELINE_2026_SALES, PIPELINE_2026_COMMERCIAL,
  DEAL_STAGES_WON, DEAL_STAGES_LOST, OWNER_NAMES, NON_SALES_STAFF, leadSourceOf, fetchDealsInPipelines,
} from './_shared/crm.mjs';
import { DEFAULT_WEIGHTS, OPEN_STAGES, scoreDeal, toRescueItem, parseDealName } from './_shared/rescue.mjs';
import { makeItem, confidence, applyState, sortItems } from './_shared/operating.mjs';

const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
const MANAGERS = ['david@pureturfllc.com', 'rbone@pureturfllc.com', 'kdryden@pureturfllc.com', 'dhamby@pureturfllc.com'];

function ownerNameForEmail(email) {
  const local = (email || '').split('@')[0].toLowerCase();
  if (!local) return null;
  for (const name of Object.values(OWNER_NAMES)) if (name.split(' ')[0].toLowerCase() === local) return name;
  return null;
}

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS });
  try {
    const url = new URL(req.url);
    const email = (url.searchParams.get('requester_email') || '').toLowerCase();
    const isManager = MANAGERS.includes(email);
    const myName = isManager ? null : ownerNameForEmail(email);
    const role = isManager ? 'leadership' : (myName ? 'rep' : 'viewer');

    const props = [
      'dealname', 'amount', 'dealstage', 'pipeline', 'hubspot_owner_id', 'createdate',
      'notes_last_contacted', 'num_notes', 'closedate', 'hs_analytics_source', 'true_lead_source',
      'hs_v2_date_entered_1271775084', 'hs_v2_date_entered_1308218008', 'hs_v2_date_entered_1271775085',
    ];
    const [{ rows }, stateBlob, configBlob, goalsBlob] = await Promise.all([
      fetchDealsInPipelines(HUBSPOT_TOKEN, ACTIVE_PIPELINES, props),
      getStore({ name: 'pt-operating-state', consistency: 'strong' }).get('all', { type: 'json' }).catch(() => null),
      getStore({ name: 'pt-rescue-config', consistency: 'strong' }).get('config', { type: 'json' }).catch(() => null),
      getStore({ name: 'pt-goals', consistency: 'strong' }).get('goals', { type: 'json' }).catch(() => null),
    ]);
    const state = stateBlob || {};
    const weights = { ...DEFAULT_WEIGHTS, ...(configBlob?.weights || {}) };
    const now = Date.now();
    const items = [];

    // ── Scoring context (mirrors rescue.mjs; kept local so the Revenue Rescue endpoint
    //    stays untouched. A later phase can extract a shared computeRescue()). ──
    const priorWonAddresses = new Set();
    const openAddressCounts = new Map();
    const srcAgg = {};
    let wonRevenueYTD = 0, wonCountYTD = 0;
    const yr = new Date(now).getUTCFullYear();
    for (const d of rows) {
      const p = d.properties;
      const { addressKey } = parseDealName(p.dealname);
      if (DEAL_STAGES_WON.includes(p.dealstage)) {
        if (addressKey) priorWonAddresses.add(addressKey);
        if (p.pipeline === PIPELINE_2026_SALES && (p.closedate || '').slice(0, 4) === String(yr)) {
          wonRevenueYTD += parseFloat(p.amount) || 0; wonCountYTD += 1;
        }
      }
      if (OPEN_STAGES.includes(p.dealstage) && addressKey) openAddressCounts.set(addressKey, (openAddressCounts.get(addressKey) || 0) + 1);
      if (DEAL_STAGES_WON.includes(p.dealstage) || DEAL_STAGES_LOST.includes(p.dealstage)) {
        const { source } = leadSourceOf(p);
        const a = srcAgg[source] || (srcAgg[source] = { won: 0, lost: 0 });
        if (DEAL_STAGES_WON.includes(p.dealstage)) a.won++; else a.lost++;
      }
    }
    const sources = Object.entries(srcAgg).map(([s, a]) => ({ s, vol: a.won + a.lost, cr: a.won + a.lost > 0 ? a.won / (a.won + a.lost) : 0 }));
    const totV = sources.reduce((t, x) => t + x.vol, 0);
    const avgCr = totV > 0 ? sources.reduce((t, x) => t + x.cr * x.vol, 0) / totV : 0;
    const sourceRank = {};
    for (const x of sources) { if (x.vol < 15) continue; if (x.cr >= avgCr + 0.05) sourceRank[x.s] = 'high'; else if (x.cr <= avgCr - 0.10) sourceRank[x.s] = 'low'; }
    const ctx = { now, commercialPipeline: PIPELINE_2026_COMMERCIAL, priorWonAddresses, openAddressCounts, sourceRank };

    // ── Provider: SALES (Revenue Rescue) ──────────────────────────────────────
    // Reps get their own individual follow-ups; leadership gets the few biggest deals to
    // know about PLUS per-rep coaching rollups (1,000 individual cards isn't a leadership
    // priority — the rollup is). Both draw from the same rescue scoring.
    const byRep = {};
    const salesScored = [];
    for (const d of rows) {
      const p = d.properties;
      if (!OPEN_STAGES.includes(p.dealstage)) continue;
      if (!p.hubspot_owner_id || !OWNER_NAMES[p.hubspot_owner_id]) continue;
      const scored = scoreDeal(d, ctx, weights);
      if (scored.flags.length === 0 && scored.score < 6) continue;
      const r = toRescueItem(scored);
      const R = byRep[scored.ownerName] || (byRep[scored.ownerName] = { name: scored.ownerName, ownerId: p.hubspot_owner_id, count: 0, stale: 0, neverContacted: 0, atRisk: 0 });
      R.count++;
      if (scored.flags.includes('staleEstimate')) R.stale++;
      if (!scored.everTouched) R.neverContacted++;
      if (r.revenueImpact !== 'Low') R.atRisk += r.value;
      salesScored.push({ scored, r });
    }
    salesScored.sort((a, b) => b.scored.score - a.scored.score);

    const indItem = ({ scored, r }, roleScope) => makeItem({
      id: `rescue:${r.dealId}`,
      type: r.flags.includes('existingUpsell') ? 'opportunity' : (r.urgency === 'high' ? 'priority' : 'action'),
      category: 'sales',
      title: `Follow up: ${r.customer || r.name}`,
      summary: r.reason,
      priorityScore: r.priorityScore,
      ownerName: r.ownerName,
      roleScope,
      estimatedImpact: r.value,
      recommendedAction: r.recommendedAction,
      whyItMatters: r.reason,
      riskIfIgnored: r.flags.includes('staleEstimate') ? 'Estimate is going cold — likely lost if it sits another week.' : null,
      confidence: confidence({ note: 'live HubSpot deal', sample: 1 }),
      sourceTrail: { system: 'HubSpot', dateRange: 'open pipeline (all)', lastSync: new Date(now).toISOString(), basis: 'Deal-level: stage, time-in-stage, logged activity, value', dataState: 'live' },
      links: { hubspotUrl: r.hubspotUrl },
      related: { dealId: r.dealId, source: r.source },
    });

    if (myName) {
      for (const x of salesScored.filter(x => x.scored.ownerName === myName).slice(0, 25)) items.push(indItem(x, 'rep'));
    } else {
      for (const x of salesScored.slice(0, 10)) items.push(indItem(x, 'manager')); // biggest deals to know about
      for (const R of Object.values(byRep)) {
        if (NON_SALES_STAFF.has(R.ownerId)) continue; // only real sales reps get coaching rollups
        if (R.stale + R.neverContacted === 0) continue;
        items.push(makeItem({
          id: `coach:${R.name.replace(/\s+/g, '')}`,
          type: 'coaching_note', category: 'sales', roleScope: 'manager',
          title: `${R.name}: follow-up health`,
          summary: `${R.count} open · ${R.stale} stale estimate${R.stale === 1 ? '' : 's'} · ${R.neverContacted} never contacted · $${Math.round(R.atRisk).toLocaleString()} at risk`,
          priorityScore: Math.min(90, 25 + Math.round(R.atRisk / 20000) + R.stale),
          ownerName: R.name,
          estimatedImpact: R.atRisk,
          recommendedAction: `Review ${R.name.split(' ')[0]}'s rescue queue; prioritize the stale estimates first.`,
          whyItMatters: 'Stale estimates and never-contacted leads are the fastest revenue leak on the team.',
          confidence: confidence({ note: 'live HubSpot', sample: R.count }),
          sourceTrail: { system: 'HubSpot', dateRange: 'open pipeline', lastSync: new Date(now).toISOString(), basis: 'Per-rep open deals: stale estimates, never-contacted, value at risk', dataState: 'live' },
          related: { repName: R.name },
        }));
      }
    }

    // ── Provider: GOALS (pacing risk) — manager/leadership only ───────────────
    if (isManager || role === 'viewer') {
      const g = goalsBlob || {};
      const dayOfYear = Math.floor((now - Date.UTC(yr, 0, 1)) / 864e5) + 1;
      const yearFrac = Math.min(1, dayOfYear / 365);
      const GOAL_DEFS = [
        { key: 'revenue', label: 'Annual Revenue', area: g.company, target: g.company?.revenue, actual: wonRevenueYTD, fmt: 'currency' },
        { key: 'dealsWon', label: 'Deals Won', area: g.sales, target: g.sales?.dealsWon, actual: wonCountYTD, fmt: 'number' },
      ];
      for (const gd of GOAL_DEFS) {
        if (!gd.target) continue;
        const expected = gd.target * yearFrac;
        if (expected <= 0) continue;
        const pace = gd.actual / expected; // <1 = behind
        if (pace >= 0.92) continue;        // only surface when meaningfully behind
        const gapPct = Math.round((1 - pace) * 100);
        const score = Math.min(95, 30 + gapPct);
        const fmt = v => gd.fmt === 'currency' ? `$${Math.round(v).toLocaleString()}` : Math.round(v).toLocaleString();
        items.push(makeItem({
          id: `goal:sales:${gd.key}`,
          type: 'risk',
          category: 'goals',
          title: `${gd.label} behind pace`,
          summary: `${fmt(gd.actual)} of ${fmt(gd.target)} target — ~${gapPct}% behind where we should be today.`,
          priorityScore: score,
          roleScope: 'leadership',
          estimatedImpact: gd.fmt === 'currency' ? Math.round(expected - gd.actual) : null,
          recommendedAction: 'Review the team rescue queue and rep goal coverage; decide where to push this week.',
          whyItMatters: `Pacing to ${Math.round(pace * 100)}% of the expected ${fmt(expected)} by today.`,
          riskIfIgnored: 'Year-end target slips further out of reach each week the gap holds.',
          confidence: confidence({ note: 'live closed-won deals vs set target', sample: wonCountYTD }),
          sourceTrail: { system: 'HubSpot + Goals', dateRange: `YTD ${yr}`, lastSync: new Date(now).toISOString(), basis: 'Closed-won deal amount/count vs annual target, straight-line paced', dataState: 'live' },
          related: { metric: gd.key },
        }));
      }
    }

    // ── Apply persisted state, scope, sort ────────────────────────────────────
    const withState = items.map(it => applyState(it, state[it.id]));
    const active = sortItems(withState.filter(it => it.active));
    const counts = {
      total: withState.length,
      active: active.length,
      byCategory: active.reduce((m, it) => { m[it.category] = (m[it.category] || 0) + 1; return m; }, {}),
      byType: active.reduce((m, it) => { m[it.type] = (m[it.type] || 0) + 1; return m; }, {}),
    };

    return new Response(JSON.stringify({
      ok: true, role, repName: myName, items: active, counts,
      providers: ['sales', ...(isManager || role === 'viewer' ? ['goals'] : [])],
      fetchedAt: new Date(now).toISOString(),
    }), { status: 200, headers: { ...CORS, 'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=300, stale-while-revalidate=900' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message, items: [] }), { status: 200, headers: CORS });
  }
};
