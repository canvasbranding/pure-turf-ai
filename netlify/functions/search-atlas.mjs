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

  const [perf, keywords, pages, gbp, rank, reviews] = await Promise.all([
    sa(`${HOST.gsc}/search-console/api/v2/site-property-performance/?selected_property=${prop}${cc}`),
    sa(`${HOST.gsc}/search-console/api/v2/keywords/?selected_property=${prop}${cc}${periods}&page_size=10&order_by=-clicks`),
    sa(`${HOST.gsc}/search-console/api/v2/pages/?selected_property=${prop}${cc}${periods}&page_size=10&order_by=-clicks`),
    sa(`${HOST.gbp}/api/gbp/v2/locations/`, 'application/vnd.api+json'),
    sa(`${HOST.keyword}/api/v1/rank-tracker/`),
    sa(`${HOST.gbp}/api/gbp/v1/reviews/star-rating-count/`, 'application/json'),
  ]);

  if (new URL(req.url).searchParams.get('probe') === 'kw') {
    const eq = `&period1_start=${ago(35)}&period1_end=${ago(8)}&period2_start=${ago(63)}&period2_end=${ago(36)}`;
    const a = await sa(`${HOST.gsc}/search-console/api/v2/keywords/?selected_property=${prop}${cc}${eq}&page_size=15&ordering=position`);
    const a2 = await sa(`${HOST.gsc}/search-console/api/v2/keywords/?selected_property=${prop}${eq}&page_size=15`);
    return new Response(JSON.stringify({ withCC: a.status, withCC_s: JSON.stringify(a.body).slice(0,500), noCC: a2.status, noCC_s: JSON.stringify(a2.body).slice(0,700) }), { status: 200, headers: { ...CORS, 'Cache-Control':'no-store' } });
  }

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
    // Keyword wins (latest SERP snapshot) — the showcase numbers.
    const so = (rt.serps_overview || []);
    const cur = so[0] || {};
    const at1 = cur.serp_1 || 0;
    const top3 = at1 + (cur.serp_2_3 || 0);
    const page1 = top3 + (cur.serp_4_10 || 0);
    const ranked = page1 + (cur.serp_11_20 || 0) + (cur.serp_21_50 || 0) + (cur.serp_51_100 || 0);
    const ud = rt.keywords_up_down_report || {};
    out.keywordWins = { atTop1: at1, top3, page1, ranked, improved: ud.keywords_up ?? null, declined: ud.keywords_down ?? null };
    // The actual terms we rank best for — the showcase list.
    const tk = Array.isArray(rt.tracked_keywords) ? rt.tracked_keywords : [];
    out.topKeywords = tk
      .map(k => ({ term: k.keyword || k.term, position: k.position ?? k.rank ?? k.current_position, location: (k.location || '').split(',')[0] }))
      .filter(k => k.term && k.position != null && k.position > 0)
      .sort((a, b) => a.position - b.position)
      .slice(0, 12);
    out._tkSample = tk[0] || null;
    // Search-visibility trend (oldest→newest for a sparkline).
    out.visibilityTrend = (rt.search_visibility_report || []).slice(0, 21).map(p => p.sv).reverse();
  } else if (rank.status !== 200) out.errors.local = `rank ${rank.status}`;

  // ── GBP reviews (reputation) — array of { star_rating, count } ──────────
  if (reviews.status === 200) {
    const arr = Array.isArray(reviews.body) ? reviews.body : (reviews.body?.data || []);
    let total = 0, weighted = 0, fiveStar = 0;
    arr.forEach(r => { const s = +r.star_rating || 0, c = +r.count || 0; total += c; weighted += s * c; if (s === 5) fiveStar = c; });
    if (total > 0) out.reviews = { total, avgRating: Math.round((weighted / total) * 10) / 10, fiveStar };
  }

  // ── GBP locations (JSON:API) ────────────────────────────────
  if (gbp.status === 200) {
    out.gbpLocations = (gbp.body?.data || []).map(l => {
      const a = l.attributes || {};
      return { id: l.id, name: a.business_name || a.title || a.store_code, address: a.business_address, verified: a.is_verified, placeId: a.place_id, mapsCid: a.maps_cid };
    });
  } else out.errors.gbp = `gbp ${gbp.status}`;


  return new Response(JSON.stringify(out), { status: 200, headers: { ...CORS, 'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=3600, stale-while-revalidate=86400' } });
};
