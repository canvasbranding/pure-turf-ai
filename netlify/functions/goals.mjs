// Pure Turf AI — shared company/finance/sales goals (Netlify Blobs).
// Goals used to live in each person's localStorage (per-browser, not shared). This makes
// them team-wide: David Patton sets Company goals, Kurt Dryden sets Finance goals, Dave
// Turner sets Sales goals — and everyone tracks against the same numbers.
import { getStore } from '@netlify/blobs';

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers });

// Who can edit each area's targets (dhamby = admin, can edit all). Server-authoritative
// so nobody can save goals they're not allowed to, regardless of the client.
const EDITORS = {
  company: ['david@pureturfllc.com', 'rbone@pureturfllc.com', 'dhamby@pureturfllc.com'],
  finance: ['kdryden@pureturfllc.com', 'dhamby@pureturfllc.com'],
  sales:   ['dturner@pureturfllc.com', 'dhamby@pureturfllc.com'],
};

// Seed targets so tracking has sensible numbers before anyone sets them.
const DEFAULTS = {
  company: { revenue: 10000000, newCustomers: 1500, activeCustomers: 3000, closeRate: 70 },
  finance: { revenue: 10000000, grossProfit: 6000000, netIncome: 2000000, netMargin: 20 },
  sales:   { dealsWon: 1000, newLeads: 400, closeRate: 70, pipelineValue: 2000000 },
};

function store() { return getStore({ name: 'pt-goals', consistency: 'strong' }); }
async function readGoals() {
  try { return (await store().get('goals', { type: 'json' })) || {}; } catch { return {}; }
}
function withDefaults(g) {
  return {
    company: { ...DEFAULTS.company, ...(g.company || {}) },
    finance: { ...DEFAULTS.finance, ...(g.finance || {}) },
    sales:   { ...DEFAULTS.sales,   ...(g.sales   || {}) },
    updatedBy: g.updatedBy || null,
    updatedAt: g.updatedAt || null,
  };
}

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers });

  if (req.method === 'GET') {
    return json(200, { ok: true, goals: withDefaults(await readGoals()) });
  }

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch { return json(400, { error: 'Invalid JSON' }); }
    const { area, targets, requester_email } = body;
    const email = (requester_email || '').toLowerCase();
    if (!EDITORS[area]) return json(400, { error: `Unknown goal area: ${area}` });
    if (!EDITORS[area].includes(email)) return json(403, { error: 'You are not authorized to set these goals.' });
    if (!targets || typeof targets !== 'object') return json(400, { error: 'targets object required' });

    const g = await readGoals();
    // Keep only numeric values; ignore junk.
    const clean = {};
    for (const [k, v] of Object.entries(targets)) {
      const n = Number(v);
      if (Number.isFinite(n)) clean[k] = n;
    }
    g[area] = { ...(g[area] || {}), ...clean };
    g.updatedBy = email;
    g.updatedAt = new Date().toISOString();
    await store().setJSON('goals', g);
    return json(200, { ok: true, goals: withDefaults(g) });
  }

  return json(405, { error: 'Method not allowed' });
};
