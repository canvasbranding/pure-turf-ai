// Pure Turf AI — Search Atlas (SEO / Local / AEO) data function.
// Calls the Search Atlas REST API (base https://api.searchatlas.com, auth via the
// X-API-Key header) and returns the data the Search & Visibility section needs.
//
// NOTE: this first pass probes a few endpoints and returns their raw shapes so we can
// map the real fields, then it'll be tightened into clean aggregates + caching.
const API = 'https://api.searchatlas.com';
const KEY = process.env.SEARCHATLAS_API_KEY;
const GSC_PROPERTY = 'sc-domain:pureturfllc.com';

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };

async function sa(path) {
  try {
    const res = await fetch(`${API}${path}`, { headers: { 'X-API-Key': KEY, 'Accept': 'application/json' }, signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    let body; try { body = JSON.parse(text); } catch { body = text.slice(0, 600); }
    return { status: res.status, body };
  } catch (e) { return { status: 0, error: e.message }; }
}

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS });
  if (!KEY) return new Response(JSON.stringify({ error: 'SEARCHATLAS_API_KEY not set' }), { status: 500, headers: CORS });

  const today = new Date();
  const iso = d => d.toISOString().slice(0, 10);
  const ago = n => { const d = new Date(today); d.setDate(d.getDate() - n); return iso(d); };

  const probes = {
    gscSites:      `/search-console/api/v4/sites/?period1_start=${ago(30)}&period1_end=${iso(today)}&period2_start=${ago(60)}&period2_end=${ago(31)}`,
    gscPerf:       `/search-console/api/v2/site-property-performance/?selected_property=${encodeURIComponent(GSC_PROPERTY)}`,
    gscKeywords:   `/search-console/api/v2/keywords/?selected_property=${encodeURIComponent(GSC_PROPERTY)}&limit=10`,
    gscPages:      `/search-console/api/v2/pages/?selected_property=${encodeURIComponent(GSC_PROPERTY)}&limit=10`,
    gbpLocations:  `/api/gbp/v2/locations/`,
    rankTracker:   `/api/v1/rank-tracker/`,
  };

  const out = { _probedAt: new Date().toISOString() };
  for (const [k, p] of Object.entries(probes)) out[k] = { path: p, ...(await sa(p)) };
  return new Response(JSON.stringify(out), { status: 200, headers: CORS });
};
