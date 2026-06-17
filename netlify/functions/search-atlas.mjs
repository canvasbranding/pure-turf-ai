// Pure Turf AI — Search Atlas (SEO / Local / AEO) data function.
// Calls the Search Atlas REST API (base https://api.searchatlas.com, auth via the
// X-API-Key header) and returns the data the Search & Visibility section needs.
//
// NOTE: this first pass probes a few endpoints and returns their raw shapes so we can
// map the real fields, then it'll be tightened into clean aggregates + caching.
// Each Search Atlas product lives on its own subdomain (per the OpenAPI `servers`).
const HOST = {
  gsc:     'https://gsc.searchatlas.com',
  keyword: 'https://keyword.searchatlas.com',
  gbp:     'https://sa.searchatlas.com',
  llmvis:  'https://llmvis.searchatlas.com',
};
const KEY = process.env.SEARCHATLAS_API_KEY;
const GSC_PROPERTY = 'sc-domain:pureturfllc.com';

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };

async function sa(url, accept = 'application/json') {
  try {
    const res = await fetch(url, { headers: { 'X-API-Key': KEY, 'Accept': accept }, signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    let body; try { body = JSON.parse(text); } catch { body = text.slice(0, 400); }
    return { status: res.status, body };
  } catch (e) { return { status: 0, error: e.message }; }
}

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS });
  if (!KEY) return new Response(JSON.stringify({ error: 'SEARCHATLAS_API_KEY not set' }), { status: 500, headers: CORS });

  const today = new Date();
  const iso = d => d.toISOString().slice(0, 10);
  const ago = n => { const d = new Date(today); d.setDate(d.getDate() - n); return iso(d); };
  const prop = encodeURIComponent(GSC_PROPERTY);
  const cc = '&country_code=US'; // this site's only active GSC country
  // GSC keyword/page endpoints compare two periods: last 28 days vs the prior 28.
  const periods = `&period1_start=${ago(28)}&period1_end=${iso(today)}&period2_start=${ago(56)}&period2_end=${ago(29)}`;

  const [perf, keywords, pages, gbp, rank] = await Promise.all([
    sa(`${HOST.gsc}/search-console/api/v2/site-property-performance/?selected_property=${prop}${cc}`),
    sa(`${HOST.gsc}/search-console/api/v2/keywords/?selected_property=${prop}${cc}${periods}&page_size=10&order_by=-clicks`),
    sa(`${HOST.gsc}/search-console/api/v2/pages/?selected_property=${prop}${cc}${periods}&page_size=10&order_by=-clicks`),
    sa(`${HOST.gbp}/api/gbp/v2/locations/`, 'application/vnd.api+json'),
    sa(`${HOST.keyword}/api/v1/rank-tracker/`),
  ]);

  const out = { fetchedAt: new Date().toISOString(), errors: {} };

  // ── GSC website search traffic (United States) ──────────────
  if (perf.status === 200) {
    const us = (perf.body?.performance_by_country || []).find(r => r.country === 'US') || perf.body?.performance_by_country?.[0];
    if (us) out.gsc = {
      clicks: us.clicks, impressions: us.impressions,
      ctr: Math.round((parseFloat(us.ctr) || 0) * 1000) / 10, // %
      position: Math.round((parseFloat(us.pos) || 0) * 10) / 10,
      periodDays: 90,
    };
  } else out.errors.gsc = `gsc ${perf.status}`;

  const rows = r => (r.status === 200 ? (Array.isArray(r.body) ? r.body : r.body?.results || r.body?.data || []) : []);
  out.gscTopKeywords = rows(keywords).slice(0, 10).map(k => ({ term: k.keyword || k.query || k.term, clicks: k.clicks, impressions: k.impressions, position: k.position ?? k.pos }));
  out.gscTopPages    = rows(pages).slice(0, 10).map(p => ({ page: p.page || p.url, clicks: p.clicks, impressions: p.impressions }));

  // ── Local rank tracker (map-grid heatmap project) ───────────
  const rt = rows(rank)[0];
  if (rt) {
    const leg = rt.position_legends || {};
    out.local = {
      name: rt.name || rt.hostname,
      avgPosition: leg.current_avg_position ?? rt.average_position,
      prevPosition: leg.previous_avg_position ?? null,
      delta: leg.position_delta ?? null,
      trackedKeywords: rt.tracked_keywords_count ?? rt.targeted_keywords_count,
      estimatedTraffic: rt.estimated_traffic,
      competitors: rt.competitors,
      locations: rt.locations,
    };
  } else if (rank.status !== 200) out.errors.local = `rank ${rank.status}`;

  // ── GBP locations (JSON:API) ────────────────────────────────
  if (gbp.status === 200) {
    out.gbpLocations = (gbp.body?.data || []).map(l => {
      const a = l.attributes || {};
      return { id: l.id, name: a.business_name || a.title || a.store_code, address: a.business_address, verified: a.is_verified, placeId: a.place_id, mapsCid: a.maps_cid };
    });
  } else out.errors.gbp = `gbp ${gbp.status}`;

  if (new URL(req.url).searchParams.get('debug') === '1') {
    const rt0 = rows(rank)[0] || {};
    return new Response(JSON.stringify({
      rt_keys: Object.keys(rt0),
      serps_overview: rt0.serps_overview,
      search_visibility_report: rt0.search_visibility_report,
      keywords_up_down_report: rt0.keywords_up_down_report,
      estimated_traffic_report: rt0.estimated_traffic_report,
      competitors: rt0.competitors,
      gbp_attr_keys: gbp.body?.data?.[0] ? Object.keys(gbp.body.data[0].attributes || {}) : null,
      gbp_attr_sample: gbp.body?.data?.[0]?.attributes || null,
    }, null, 0), { status: 200, headers: { ...CORS, 'Cache-Control':'no-store' } });
  }

  return new Response(JSON.stringify(out), { status: 200, headers: { ...CORS, 'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=3600, stale-while-revalidate=86400' } });
};
