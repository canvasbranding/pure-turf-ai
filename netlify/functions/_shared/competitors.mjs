// Pure Turf AI — Competitive snapshot (Search & Visibility → "Competitors").
//
// WHY A SNAPSHOT (not a live fetch): this data comes from Search Atlas's Local-SEO
// heatmaps + Site Explorer, which the live function can't reach over REST — and it only
// moves on a weekly-ish cadence anyway. So it's refreshed by hand via the Search Atlas
// MCP tools and committed here, with an honest `snapshotDate`. Never fabricate rows;
// every number below is pulled straight from Search Atlas. To refresh, re-pull:
//   • local map  → local_seo_heatmaps_get_heatmap_details (Nashville "Lawn care" grid)
//   • web/SEO    → se_list_sites  (+ se_create_project for any new competitor domain)
//   • gaps       → se_keyword_gap_analyze (pureturfllc.com vs competitor domains)
export const COMPETITORS = {
  snapshotDate: '2026-06-22',

  // ── Local map (Google) ── who actually ranks in our backyard, for "lawn care",
  // on the 39-point grid around 445 Atlas Dr, Nashville. Competitors here are
  // auto-detected by who shows up near us — the three big regional names
  // (Weed Man, Virginia Green, Second Nature) DON'T appear, i.e. we out-rank them locally.
  localMap: {
    market: 'Nashville · "lawn care"',
    radiusMiles: 3,
    us: { name: 'Pure Turf', avgRank: 1.8, top3: 34, pins: 39, rating: 5.0, reviews: 421 },
    rows: [
      { name: 'Depot Lawn Care',               avgRank: 2.8, top3: 26, pins: 39, rating: 4.2, reviews: 45 },
      { name: 'Nashville Lawn Care Solutions',  avgRank: 2.9, top3: 31, pins: 39, rating: 4.8, reviews: 115 },
      { name: 'Bryan Lawn Care',                avgRank: 5.2, top3: 0,  pins: 39, rating: 4.8, reviews: 106 },
      { name: 'Veragreen LLC',                  avgRank: 6.0, top3: 3,  pins: 39, rating: 5.0, reviews: 60 },
    ],
  },

  // ── Website / organic SEO ── Site Explorer index. `scope` flags whether they
  // actually compete in Middle TN, so the comparison stays honest.
  web: {
    us: { name: 'Pure Turf', domain: 'pureturfllc.com', keywords: 755, traffic: 1310, backlinks: 4723, domainPower: 28 },
    rows: [
      { name: 'Second Nature',        domain: 'secondnature.net',      scope: 'local',                keywords: 406,  traffic: 431,   backlinks: 1471, domainPower: 20 },
      { name: 'Weed Man Nashville',   domain: 'nashville.weedman.com', scope: 'local franchise',      keywords: 0,    traffic: 0,     backlinks: 0,    domainPower: null, note: 'No independent local site — rides national weedman.com' },
      { name: 'Music City Lawn Care', domain: 'musiccitylawncare.com', scope: 'local',                keywords: 229,  traffic: 239,   backlinks: 235,  domainPower: 24 },
      { name: 'LawnWise',             domain: 'yourlawnwise.com',      scope: 'local',                keywords: 452,  traffic: 1041,  backlinks: 6576, domainPower: 29 },
      { name: 'Virginia Green',       domain: 'virginiagreen.com',     scope: 'Mid-Atlantic · not TN', keywords: 8162, traffic: 22206, backlinks: 6623, domainPower: 41 },
    ],
  },

  // ── Keyword gaps ── terms competitors rank for that we don't (content/page openings).
  gaps: [
    { keyword: 'flea and tick treatment for the yard',                volume: 4400 },
    { keyword: 'how long does it take to aerate a lawn',              volume: 90 },
    { keyword: 'how long do greens take to recover from aeration',    volume: 70 },
    { keyword: 'lawn fertilizer program near me',                     volume: 30 },
    { keyword: 'tree and shrub spraying near me',                     volume: 30 },
    { keyword: 'how long does aeration take',                         volume: 20 },
  ],

  // What can't be obtained — surfaced honestly in the UI so nobody assumes we hid it.
  notAvailable: 'Competitor close rates and revenue are private to each company — no tool (Search Atlas included) can pull them. The data above is the real, obtainable competitive intel: local map rank, reputation, and organic SEO.',
};
