// Pure Turf AI — Dashboard Stats + Goals Data Function
const WINDSOR_KEY   = process.env.WINDSOR_API_KEY;
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

const EXCLUDED_CAMPAIGNS = ['mosquito', 'pmax - mosquito', 'pmax mosquito'];

const DEAL_STAGES_WON  = ['1271775089'];
const DEAL_STAGES_LOST = ['1271775090'];
const DEAL_STAGE_NAMES = {
  '1271775084': 'Ready to Contact',
  '1308218008': 'Attempting to Contact',
  '1271775085': 'Estimate Sent',
  '1271775089': 'Closed Won',
  '1271775090': 'Closed Lost',
};
const OWNER_NAMES = {
  '81719066': 'Chris Kleeman',  '82036260': 'Beth Dent',
  '82063761': 'Daniel Anderson','81847128': 'Kaley Brownlee',
  '82036049': 'Stuart Chandler','81693514': 'Kurt Dryden',
  '81719004': 'Wyatt Raines',   '82036368': 'Ashley Thomas',
  '83335372': 'Nicole McCutcheon',
};

// Reps excluded from aggregate close rate (still shown individually, flagged)
const CLOSE_RATE_EXCLUDED = {
  '81693514': 'Sales manager',       // Kurt Dryden
  '81719004': 'Commercial sales',    // Wyatt Raines
};

// Non-sales staff — completely hidden from rep leaderboard
const NON_SALES_STAFF = new Set([
  '82036260',  // Beth Dent (admin/scheduler)
  '82036368',  // Ashley Thomas (admin)
  '83335372',  // Nicole McCutcheon (admin)
  '82036049',  // Stuart Chandler (CSM)
]);

function getDateRange(rangeKey) {
  const today = new Date();
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const date_to = fmt(today);
  let date_from;
  switch (rangeKey) {
    case '7d':  { const d = new Date(today); d.setDate(d.getDate()-6);  date_from = fmt(d); break; }
    case '30d': { const d = new Date(today); d.setDate(d.getDate()-29); date_from = fmt(d); break; }
    case '90d': { const d = new Date(today); d.setDate(d.getDate()-89); date_from = fmt(d); break; }
    case 'ytd': { date_from = `${today.getFullYear()}-01-01`; break; }
    default:    { const t = today; date_from = `${t.getFullYear()}-${pad(t.getMonth()+1)}-01`; }
  }
  return { date_from, date_to };
}

async function fetchWindsor(datasource, from, to) {
  const fields = datasource === 'google_my_business'
    ? 'datasource,date,impressions,phone_calls,direction_requests,website_clicks'
    : 'datasource,date,campaign,spend,cost,impressions,clicks,conversions,cost_per_conversion';
  const url = `https://connectors.windsor.ai/all?api_key=${WINDSOR_KEY}&fields=${fields}&date_from=${from}&date_to=${to}&datasource=${datasource}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(9000) });
  if (!res.ok) throw new Error(`Windsor ${datasource} ${res.status}`);
  return await res.json();
}

async function fetchHubSpotDeals(date_from) {
  const PIPELINE_2026_SALES = '853190025';
  const props = 'dealname,amount,dealstage,pipeline,closedate,createdate,hubspot_owner_id';

  // Fetch pipeline stage definitions in parallel
  const stageMapPromise = fetch(`https://api.hubapi.com/crm/v3/pipelines/deals/${PIPELINE_2026_SALES}`, {
    headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}` },
    signal: AbortSignal.timeout(5000),
  }).then(async r => {
    if (!r.ok) return {};
    const data = await r.json();
    const map = {};
    (data.stages || []).forEach(s => { map[s.id] = s.label; });
    return map;
  }).catch(() => ({}));

  // Paginate through ALL deals using GET endpoint
  let allDeals = [];
  let after = undefined;
  for (let page = 0; page < 30; page++) {
    const url = `https://api.hubapi.com/crm/v3/objects/deals?limit=100&archived=false&properties=${props}${after ? `&after=${after}` : ''}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HubSpot deals ${res.status}: ${await res.text()}`);
    const data = await res.json();
    allDeals = allDeals.concat(data.results || []);
    if (data.paging?.next?.after) { after = data.paging.next.after; }
    else break;
  }

  // Filter to 2026 Sales pipeline only
  const deals = allDeals.filter(d => d.properties.pipeline === PIPELINE_2026_SALES);
  console.log(`[DEALS] Fetched ${allDeals.length} total deals, ${deals.length} in 2026 Sales pipeline`);
  const stageMap = await stageMapPromise;
  console.log(`[DEALS] Stage map:`, JSON.stringify(stageMap));
  const getStageName = (id) => stageMap[id] || DEAL_STAGE_NAMES[id] || id || 'Unknown';

  // Identify won/lost by checking stage labels
  const isWon  = (d) => {
    const name = getStageName(d.properties.dealstage).toLowerCase();
    return name.includes('closed won') || name.includes('closedwon') || DEAL_STAGES_WON.includes(d.properties.dealstage);
  };
  const isLost = (d) => {
    const name = getStageName(d.properties.dealstage).toLowerCase();
    return name.includes('closed lost') || name.includes('closedlost') || DEAL_STAGES_LOST.includes(d.properties.dealstage);
  };

  const newLeads    = deals.filter(d => d.properties.createdate >= date_from).length;
  // Active leads = deals in early stages (not yet won/lost) — useful when newLeads is 0 at start of period
  const EARLY_STAGES = new Set(['1271775084', '1308218008', '1271775085']); // Ready, Attempting, Estimate Sent
  const activeLeads = deals.filter(d => EARLY_STAGES.has(d.properties.dealstage)).length;
  const wonDeals    = deals.filter(isWon);
  const lostDeals   = deals.filter(isLost);
  const openDeals   = deals.filter(d => !isWon(d) && !isLost(d));

  // Period-filtered metrics
  const wonInRange    = wonDeals.filter(d => d.properties.closedate >= date_from);
  const lostInRange   = lostDeals.filter(d => d.properties.closedate >= date_from);
  const wonCount      = wonInRange.length;
  const lostCount     = lostInRange.length;
  const openCount     = openDeals.length;
  const revenue       = wonInRange.reduce((s, d) => s + (parseFloat(d.properties.amount) || 0), 0);

  // Close rate: won / (won + lost) for deals CLOSED in this period (excludes open deals and Kurt/Wyatt)
  const isExcludedOwner = (d) => CLOSE_RATE_EXCLUDED[d.properties.hubspot_owner_id];
  const coreWon   = wonInRange.filter(d => !isExcludedOwner(d)).length;
  const coreLost  = lostInRange.filter(d => !isExcludedOwner(d)).length;
  const closeRate = (coreWon + coreLost) > 0
    ? Math.round((coreWon / (coreWon + coreLost)) * 100) : null;

  // Per-stage breakdown with resolved names
  const byStage = {};
  deals.forEach(d => {
    const stageName = getStageName(d.properties.dealstage);
    if (!byStage[stageName]) byStage[stageName] = { count: 0, value: 0 };
    byStage[stageName].count++;
    byStage[stageName].value += parseFloat(d.properties.amount) || 0;
  });
  const stageBreakdown = Object.entries(byStage)
    .map(([stage, s]) => ({ stage, count: s.count, value: Math.round(s.value) }))
    .sort((a, b) => b.count - a.count);

  // Per-rep breakdown — period-filtered won/lost, skip non-sales admin staff
  const repStats = {};
  deals.forEach(d => {
    const ownerId = d.properties.hubspot_owner_id;
    if (NON_SALES_STAFF.has(ownerId)) return;
    const name = OWNER_NAMES[ownerId] || 'Unassigned';
    if (!repStats[name]) repStats[name] = { leads: 0, won: 0, lost: 0, revenue: 0, open: 0, ownerId };
    if (d.properties.createdate >= date_from) repStats[name].leads++;
    if (isWon(d) && d.properties.closedate >= date_from) {
      repStats[name].won++;
      repStats[name].revenue += parseFloat(d.properties.amount) || 0;
    } else if (isLost(d) && d.properties.closedate >= date_from) {
      repStats[name].lost++;
    } else if (!isWon(d) && !isLost(d)) {
      repStats[name].open++;
    }
  });
  const repLeaderboard = Object.entries(repStats)
    .map(([name, s]) => ({
      name, leads: s.leads, won: s.won, lost: s.lost, open: s.open,
      revenue: Math.round(s.revenue),
      closeRate: (s.won + s.lost) > 0 ? Math.round(s.won / (s.won + s.lost) * 100) : null,
      excluded: !!CLOSE_RATE_EXCLUDED[s.ownerId],
      excludeReason: CLOSE_RATE_EXCLUDED[s.ownerId] || null,
    }))
    .sort((a, b) => {
      if (a.excluded !== b.excluded) return a.excluded ? 1 : -1;
      return b.won - a.won;
    });

  // Recent deals
  const recentDeals = deals
    .filter(d => d.properties.createdate >= date_from)
    .sort((a, b) => (b.properties.createdate || '').localeCompare(a.properties.createdate || ''))
    .slice(0, 15)
    .map(d => ({
      name:   d.properties.dealname,
      stage:  getStageName(d.properties.dealstage),
      amount: d.properties.amount ? Math.round(parseFloat(d.properties.amount)) : null,
      owner:  OWNER_NAMES[d.properties.hubspot_owner_id] || 'Unassigned',
      created: d.properties.createdate?.slice(0, 10),
    }));

  return { total: deals.length, totalAll: allDeals.length, newLeads, activeLeads, revenue: Math.round(revenue), closeRate, wonCount, lostCount, openCount, stageBreakdown, repLeaderboard, recentDeals };
}

// In-memory result cache. Netlify reuses warm function instances, so this persists
// across requests and makes repeat dashboard loads instant instead of ~10s.
const STATS_CACHE = new Map(); // rangeKey -> { at: epochMs, body: string }
const CACHE_TTL_MS = 180000;   // 3 minutes

export const handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const rangeKey = event.queryStringParameters?.range || 'mtd';
  const { date_from, date_to } = getDateRange(rangeKey);

  // Fast path: serve a recent cached result if we have one.
  const cached = STATS_CACHE.get(rangeKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { statusCode: 200, headers: { ...headers, 'Cache-Control': 'public, max-age=0, must-revalidate', 'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=180, stale-while-revalidate=600' }, body: cached.body };
  }

  const [googleResult, metaResult, gbpResult, hubspotResult, rgResult] = await Promise.allSettled([
    fetchWindsor('google_ads', date_from, date_to),
    fetchWindsor('facebook_ads', date_from, date_to),
    fetchWindsor('google_my_business', date_from, date_to),
    fetchHubSpotDeals(date_from),
    fetchRGServices(HUBSPOT_TOKEN, date_from),
  ]);

  const stats = { dateRange: rangeKey, dateFrom: date_from, dateTo: date_to, fetchedAt: new Date().toISOString(), errors: {} };

  // ── Google Ads ──────────────────────────────────────────
  if (googleResult.status === 'fulfilled') {
    const allRows = googleResult.value?.data || [];
    // Filter: only google datasource rows, exclude mosquito campaigns
    const rows = allRows
      .filter(r => {
        const ds = (r.datasource || '').toLowerCase();
        if (!ds) return true;
        if (ds.includes('google')) return true;
        if (ds.includes('facebook') || ds.includes('meta')) return false;
        return true;
      })
      .filter(r => !EXCLUDED_CAMPAIGNS.some(ex => (r.campaign||'').toLowerCase().includes(ex)));
    const spend = rows.reduce((s, r) => s + (parseFloat(r.spend) || parseFloat(r.cost) || 0), 0);
    const convs = rows.reduce((s, r) => s + (parseFloat(r.conversions) || 0), 0);
    const clicks = rows.reduce((s, r) => s + (parseFloat(r.clicks) || 0), 0);
    const impressions = rows.reduce((s, r) => s + (parseFloat(r.impressions) || 0), 0);
    const cpa   = convs > 0 ? Math.round(spend / convs) : null;
    const cpc   = clicks > 0 ? (spend / clicks).toFixed(2) : null;
    const ctr   = impressions > 0 ? (clicks / impressions * 100).toFixed(2) : null;

    // Per-campaign breakdown (aggregate by campaign name)
    const campMap = {};
    rows.forEach(r => {
      const name = r.campaign || 'Unknown';
      if (!campMap[name]) campMap[name] = { spend: 0, conversions: 0, clicks: 0, impressions: 0 };
      campMap[name].spend       += parseFloat(r.spend) || parseFloat(r.cost) || 0;
      campMap[name].conversions += parseFloat(r.conversions) || 0;
      campMap[name].clicks      += parseFloat(r.clicks) || 0;
      campMap[name].impressions += parseFloat(r.impressions) || 0;
    });
    const campaigns = Object.entries(campMap).map(([name, d]) => ({
      name,
      spend:       Math.round(d.spend),
      conversions: Math.round(d.conversions),
      clicks:      Math.round(d.clicks),
      cpa:         d.conversions > 0 ? Math.round(d.spend / d.conversions) : null,
      ctr:         d.impressions > 0 ? (d.clicks / d.impressions * 100).toFixed(2) : null,
      sharePct:    spend > 0 ? Math.round(d.spend / spend * 100) : 0,
    })).sort((a, b) => b.spend - a.spend);

    stats.google = { spend: Math.round(spend), conversions: Math.round(convs), clicks: Math.round(clicks), impressions: Math.round(impressions), cpa, cpc, ctr, campaigns, sub: convs > 0 ? `↑ ${Math.round(convs)} conv · $${cpa} CPA` : `$${Math.round(spend).toLocaleString()} spend`, dir: 'up' };
  } else { stats.errors.google = googleResult.reason?.message; }

  // ── Meta Ads ────────────────────────────────────────────
  if (metaResult.status === 'fulfilled') {
    const allRows = metaResult.value?.data || [];
    // Debug: log what datasources Windsor is actually returning
    const datasources = [...new Set(allRows.map(r => r.datasource))];
    const campaignNames = [...new Set(allRows.map(r => r.campaign))];
    console.log(`[META] Windsor returned ${allRows.length} rows. Datasources: ${JSON.stringify(datasources)}. Campaigns: ${JSON.stringify(campaignNames.slice(0, 15))}`);
    // Filter: keep only rows that look like Meta/Facebook data (not Google leaking in)
    const rows = allRows.filter(r => {
      const ds = (r.datasource || '').toLowerCase();
      // If no datasource field, keep it (it came from the facebook_ads endpoint)
      if (!ds) return true;
      // Keep anything that says facebook or meta
      if (ds.includes('facebook') || ds.includes('meta')) return true;
      // Reject anything that says google
      if (ds.includes('google')) return false;
      // Keep anything else (unknown datasource)
      return true;
    });
    const spend = rows.reduce((s, r) => s + (parseFloat(r.spend) || parseFloat(r.cost) || 0), 0);
    const convs = rows.reduce((s, r) => s + (parseFloat(r.conversions) || 0), 0);
    const clicks = rows.reduce((s, r) => s + (parseFloat(r.clicks) || 0), 0);
    const impressions = rows.reduce((s, r) => s + (parseFloat(r.impressions) || 0), 0);
    const cpa   = convs > 0 ? Math.round(spend / convs) : null;
    const cpm   = impressions > 0 ? (spend / impressions * 1000).toFixed(2) : null;
    const campMap = {};
    rows.forEach(r => {
      const name = r.campaign || 'Unknown';
      if (!campMap[name]) campMap[name] = { spend: 0, conversions: 0, clicks: 0, impressions: 0 };
      campMap[name].spend       += parseFloat(r.spend) || parseFloat(r.cost) || 0;
      campMap[name].conversions += parseFloat(r.conversions) || 0;
      campMap[name].clicks      += parseFloat(r.clicks) || 0;
      campMap[name].impressions += parseFloat(r.impressions) || 0;
    });
    const campaigns = Object.entries(campMap).map(([name, d]) => ({
      name, spend: Math.round(d.spend), conversions: Math.round(d.conversions), clicks: Math.round(d.clicks),
      cpa: d.conversions > 0 ? Math.round(d.spend / d.conversions) : null,
      cpm: d.impressions > 0 ? (d.spend / d.impressions * 1000).toFixed(2) : null,
      sharePct: spend > 0 ? Math.round(d.spend / spend * 100) : 0,
    })).sort((a, b) => b.spend - a.spend);
    stats.meta = { spend: Math.round(spend), conversions: Math.round(convs), clicks: Math.round(clicks), impressions: Math.round(impressions), cpa, cpm, campaigns, sub: cpa ? `$${cpa} CPA` : `$${Math.round(spend).toLocaleString()} spend`, dir: 'dn' };
  } else { stats.errors.meta = metaResult.reason?.message; }

  // ── GBP ─────────────────────────────────────────────────
  if (gbpResult.status === 'fulfilled') {
    const rows = gbpResult.value?.data || [];
    const views     = rows.reduce((s, r) => s + (parseFloat(r.impressions) || 0), 0);
    const calls     = rows.reduce((s, r) => s + (parseFloat(r.phone_calls) || 0), 0);
    const directions= rows.reduce((s, r) => s + (parseFloat(r.direction_requests) || 0), 0);
    const webClicks = rows.reduce((s, r) => s + (parseFloat(r.website_clicks) || 0), 0);
    // Daily trend (last 14 days)
    const dailyMap = {};
    rows.forEach(r => {
      if (!r.date) return;
      const day = r.date.slice(0, 10);
      if (!dailyMap[day]) dailyMap[day] = { views: 0, calls: 0 };
      dailyMap[day].views += parseFloat(r.impressions) || 0;
      dailyMap[day].calls += parseFloat(r.phone_calls) || 0;
    });
    const trend = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, d]) => ({ date, views: Math.round(d.views), calls: Math.round(d.calls) }));
    stats.gbp = { views: Math.round(views), calls: Math.round(calls), directions: Math.round(directions), webClicks: Math.round(webClicks), trend, sub: calls > 0 ? `↑ ${Math.round(calls)} calls` : `${Math.round(views)} views`, dir: 'up' };
  } else { stats.errors.gbp = gbpResult.reason?.message; }

  // ── HubSpot ─────────────────────────────────────────────
  if (hubspotResult.status === 'fulfilled') {
    const h = hubspotResult.value;
    stats.pipeline = { total: h.total, sub: `deals · ${new Date().getFullYear()}`, dir: '' };
    stats.hubspot  = { newLeads: h.newLeads, revenue: h.revenue, closeRate: h.closeRate, wonCount: h.wonCount, lostCount: h.lostCount, stageBreakdown: h.stageBreakdown, repLeaderboard: h.repLeaderboard, recentDeals: h.recentDeals };
  } else { stats.errors.hubspot = hubspotResult.reason?.message; }

  const googleSpend = stats.google?.spend || 0;
  const metaSpend   = stats.meta?.spend   || 0;
  stats.adSpend = { total: googleSpend + metaSpend, google: googleSpend, meta: metaSpend };

  // ── RG Services KPIs ────────────────────────────────────────
  if (rgResult.status === 'fulfilled') {
    stats.rgServices = rgResult.value;
  } else {
    stats.errors.rgServices = rgResult.reason?.message;
  }

  // CDN caching: HubSpot/Windsor queries take ~10s, so serve the computed result
  // from Netlify's edge instead of re-querying on every page load. Only one request
  // every few minutes hits the slow APIs; everyone else gets an instant response.
  // stale-while-revalidate means the refresh happens in the background — users never wait.
  // Don't cache a response that had a fetch error (would pin broken data for minutes).
  const hasErrors = Object.keys(stats.errors).length > 0;
  const body = JSON.stringify(stats);
  // Only cache a clean response — never pin a partial/errored result.
  if (!hasErrors) STATS_CACHE.set(rangeKey, { at: Date.now(), body });
  const cacheHeaders = hasErrors
    ? { 'Cache-Control': 'no-store' }
    : {
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=180, stale-while-revalidate=600',
      };
  return { statusCode: 200, headers: { ...headers, ...cacheHeaders }, body };
};

// Appended: RG Services KPI fetch

// Fetch HubSpot property definition to get enum label mappings
async function fetchPropertyOptions(hubspotToken, objectType, propertyName) {
  try {
    const res = await fetch(
      `https://api.hubapi.com/crm/v3/properties/${objectType}/${propertyName}`,
      { headers: { 'Authorization': `Bearer ${hubspotToken}` }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return {};
    const data = await res.json();
    const map = {};
    (data.options || []).forEach(opt => { map[opt.value] = opt.label; });
    return map;
  } catch { return {}; }
}

async function fetchRGServices(hubspotToken, date_from) {
  const RG_OBJECT = '2-54724126';
  const STATUS_CANCELLED     = '7';
  const STATUS_CANCEL_PENDING = '6';
  const STATUS_ACTIVE        = '9';

  const props = 'program_status,program_code,cancel_reason,createdate,hs_lastmodifieddate';
  let allServices = [];
  let after = undefined;

  // Fetch property label mappings in parallel
  const [programCodeMap, cancelReasonMap] = await Promise.all([
    fetchPropertyOptions(hubspotToken, RG_OBJECT, 'program_code'),
    fetchPropertyOptions(hubspotToken, RG_OBJECT, 'cancel_reason'),
  ]);

  // Paginate through all RG services (HubSpot returns max 100 per page)
  for (let page = 0; page < 50; page++) {
    const url = `https://api.hubapi.com/crm/v3/objects/${RG_OBJECT}?limit=100&archived=false&properties=${props}${after ? `&after=${after}` : ''}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${hubspotToken}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`RG Services ${res.status}: ${await res.text()}`);
    const data = await res.json();
    allServices = allServices.concat(data.results || []);
    if (data.paging?.next?.after) { after = data.paging.next.after; }
    else break;
  }

  const p = (s) => s.properties || {};
  const resolveLabel = (code) => programCodeMap[code] || code || 'Unknown';

  function classifyTier(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('basic'))      return 'basic';
    if (l.includes('essential'))  return 'essential';
    if (l.includes('elite'))      return 'elite';
    if (l.includes('mosquito'))   return 'mosquito';
    return 'other';
  }

  const active         = allServices.filter(s => p(s).program_status === STATUS_ACTIVE);
  const cancelled      = allServices.filter(s => p(s).program_status === STATUS_CANCELLED);
  const cancelPending  = allServices.filter(s => p(s).program_status === STATUS_CANCEL_PENDING);

  // New customers this period (created_date >= date_from)
  const newCustomers   = active.filter(s => p(s).createdate >= date_from);
  const newCancels     = cancelled.filter(s => p(s).hs_lastmodifieddate >= date_from);

  // Program type breakdown for new customers
  const typeCount = { basic: 0, essential: 0, elite: 0, mosquito: 0, other: 0 };
  newCustomers.forEach(s => {
    const label = resolveLabel(p(s).program_code);
    const tier = classifyTier(label);
    typeCount[tier] = (typeCount[tier] || 0) + 1;
  });

  // Total active by tier (all active, not just new)
  const activeByTier = { basic: 0, essential: 0, elite: 0, mosquito: 0, other: 0 };
  active.forEach(s => {
    const label = resolveLabel(p(s).program_code);
    const tier = classifyTier(label);
    activeByTier[tier] = (activeByTier[tier] || 0) + 1;
  });

  // Cancel reasons breakdown (resolved to labels)
  const cancelReasons = {};
  newCancels.forEach(s => {
    const reason = cancelReasonMap[p(s).cancel_reason] || p(s).cancel_reason || 'Unknown';
    cancelReasons[reason] = (cancelReasons[reason] || 0) + 1;
  });
  const cancelReasonsList = Object.entries(cancelReasons)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalActive:      active.length,
    totalCancelled:   cancelled.length,
    cancelPending:    cancelPending.length,
    newCustomers:     newCustomers.length,
    newCancels:       newCancels.length,
    byType:           typeCount,
    activeByTier,
    cancelReasons:    cancelReasonsList,
  };
}
