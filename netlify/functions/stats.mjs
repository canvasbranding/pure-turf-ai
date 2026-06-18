// Pure Turf AI — Dashboard Stats + Goals Data Function
import {
  PIPELINE_2026_SALES, PIPELINE_2026_COMMERCIAL, ACTIVE_PIPELINES, DEAL_STAGE_NAMES, DEAL_STAGES_WON, DEAL_STAGES_LOST,
  OWNER_NAMES, CLOSE_RATE_EXCLUDED, REP_NOTES, NON_SALES_STAFF, EXCLUDED_CAMPAIGNS, getDateRange, fetchDealsInPipelines, leadSourceOf, contactSourceOf, hubspotGet,
} from './_shared/crm.mjs';
import { fetchQuickBooks } from './_shared/quickbooks.mjs';

const WINDSOR_KEY   = process.env.WINDSOR_API_KEY;
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

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
  const props = 'dealname,amount,dealstage,pipeline,closedate,createdate,hubspot_owner_id,true_lead_source,hs_analytics_source';

  // Fetch ALL pipelines' stage definitions once — covers both 2026 Sales and Commercial,
  // which have different stage ids. Flatten into one id→label map.
  const stageMapPromise = fetch(`https://api.hubapi.com/crm/v3/pipelines/deals`, {
    headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}` },
    signal: AbortSignal.timeout(5000),
  }).then(async r => {
    if (!r.ok) return {};
    const data = await r.json();
    const map = {};
    (data.results || []).forEach(p => (p.stages || []).forEach(s => { map[s.id] = s.label; }));
    return map;
  }).catch(() => ({}));

  // Fetch BOTH 2026 pipelines in one pass (no truncation), then split.
  const { rows: allRows } = await fetchDealsInPipelines(HUBSPOT_TOKEN, ACTIVE_PIPELINES, props);
  const stageMap = await stageMapPromise;
  const getStageName = (id) => stageMap[id] || DEAL_STAGE_NAMES[id] || id || 'Unknown';

  const salesDeals = allRows.filter(d => d.properties.pipeline === PIPELINE_2026_SALES);
  const commDeals  = allRows.filter(d => d.properties.pipeline === PIPELINE_2026_COMMERCIAL);
  console.log(`[DEALS] Fetched ${salesDeals.length} Sales + ${commDeals.length} Commercial deals`);

  return {
    sales:      computeDealMetrics(salesDeals, date_from, getStageName),
    commercial: computeDealMetrics(commDeals, date_from, getStageName),
    sourceQuality: computeSourceQuality(salesDeals),
  };
}

// Lead-source QUALITY (not just volume): judge each source by what its deals actually do —
// quote→close rate, avg deal value, revenue, revenue-per-quote — so we can tell cheap leads
// from good customers. Deal-based (deals carry true_lead_source/Original Traffic Source);
// ad cost (CPL/CPA) is joined later from stats.google where the source is paid. NOTE: deals
// are created at estimate-sent time, so a "lead" here is really a QUOTE — labeled honestly.
function computeSourceQuality(deals) {
  const agg = {};
  for (const d of deals) {
    const p = d.properties;
    const stage = p.dealstage;
    const { source } = leadSourceOf(p);
    if (source === 'Unknown') continue;
    const a = agg[source] || (agg[source] = { source, quotes: 0, closedWon: 0, closedLost: 0, open: 0, revenue: 0 });
    a.quotes++;
    if (DEAL_STAGES_WON.includes(stage)) { a.closedWon++; a.revenue += parseFloat(p.amount) || 0; }
    else if (DEAL_STAGES_LOST.includes(stage)) a.closedLost++;
    else a.open++;
  }
  return Object.values(agg)
    .filter(a => a.quotes >= 5) // ignore tiny-sample noise
    .map(a => {
      const decided = a.closedWon + a.closedLost;
      return {
        source: a.source,
        quotes: a.quotes,
        closedWon: a.closedWon,
        closedLost: a.closedLost,
        open: a.open,
        closeRate: decided > 0 ? Math.round((a.closedWon / decided) * 100) : null,
        revenue: Math.round(a.revenue),
        avgDealValue: a.closedWon > 0 ? Math.round(a.revenue / a.closedWon) : null,
        revenuePerQuote: a.quotes > 0 ? Math.round(a.revenue / a.quotes) : 0,
        cost: null, cpl: null, cpa: null, // joined for paid sources in assembly
      };
    })
    .sort((x, y) => y.revenue - x.revenue);
}

// Lead-source breakdown computed from CONTACTS (not deals), so it can read the Aircall
// tracking number — the only field that attributes phone leads to their real channel.
// Web/import contacts attribute via True Lead Source then Original Traffic Source. We
// exclude the RealGreen CSV import (source_data_1 = 'import') since that's the existing
// customer book being migrated, not newly-generated leads.
async function fetchLeadSources(date_from) {
  const url = 'https://api.hubapi.com/crm/v3/objects/contacts/search';
  const properties = ['last_used_aircall_phone_number', 'true_lead_source', 'hs_analytics_source', 'hs_analytics_source_data_1', 'createdate'];
  const bySource = {};
  const basis = { phone: 0, manual: 0, web: 0, none: 0 };
  let total = 0, after = undefined, capped = false;
  for (let page = 0; page < 25; page++) { // cap 2,500 most-recent leads to bound latency
    const body = {
      filterGroups: [{ filters: [{ propertyName: 'createdate', operator: 'GTE', value: String(new Date(date_from).getTime()) }] }],
      properties, sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }], limit: 100, ...(after ? { after } : {}),
    };
    const res = await hubspotGet(url, HUBSPOT_TOKEN, { init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } });
    const data = await res.json();
    const rows = data.results || [];
    for (const c of rows) {
      const p = c.properties || {};
      if ((p.hs_analytics_source_data_1 || '') === 'import') continue; // skip migrated existing-customer book
      const { source, basis: b } = contactSourceOf(p);
      bySource[source] = (bySource[source] || 0) + 1;
      basis[b] = (basis[b] || 0) + 1;
      total++;
    }
    after = data.paging?.next?.after;
    if (!after) break;
    if (page === 24) capped = true;
  }
  const sources = Object.entries(bySource)
    .map(([source, count]) => ({ source, count, pct: total ? Math.round(count / total * 100) : 0, unknown: source === 'Unknown' }))
    .sort((a, b) => (a.unknown !== b.unknown ? (a.unknown ? 1 : -1) : b.count - a.count));
  return { sources, total, basis, capped };
}

// Compute the full metric set for one pipeline's deals. Used for both 2026 pipelines.
function computeDealMetrics(deals, date_from, getStageName) {
  // Identify won/lost by checking stage labels (robust across pipelines with different ids)
  const isWon  = (d) => {
    const name = getStageName(d.properties.dealstage).toLowerCase();
    return name.includes('closed won') || name.includes('closedwon') || DEAL_STAGES_WON.includes(d.properties.dealstage);
  };
  const isLost = (d) => {
    const name = getStageName(d.properties.dealstage).toLowerCase();
    return name.includes('closed lost') || name.includes('closedlost') || DEAL_STAGES_LOST.includes(d.properties.dealstage);
  };

  const newLeads    = deals.filter(d => d.properties.createdate >= date_from).length;
  const wonDeals    = deals.filter(isWon);
  const lostDeals   = deals.filter(isLost);
  const openDeals   = deals.filter(d => !isWon(d) && !isLost(d));
  // Active leads = still-open deals — useful as a fallback when newLeads is 0 early in a period
  const activeLeads = openDeals.length;

  // Period-filtered metrics
  const wonInRange    = wonDeals.filter(d => d.properties.closedate >= date_from);
  const lostInRange   = lostDeals.filter(d => d.properties.closedate >= date_from);
  const wonCount      = wonInRange.length;
  const lostCount     = lostInRange.length;
  const openCount     = openDeals.length;
  const openValue     = openDeals.reduce((s, d) => s + (parseFloat(d.properties.amount) || 0), 0);
  const revenue       = wonInRange.reduce((s, d) => s + (parseFloat(d.properties.amount) || 0), 0);

  // Close rate: won / (won + lost) for deals CLOSED in this period (excludes open deals and Kurt/Wyatt)
  const isExcludedOwner = (d) => CLOSE_RATE_EXCLUDED[d.properties.hubspot_owner_id];
  const coreWon   = wonInRange.filter(d => !isExcludedOwner(d)).length;
  const coreLost  = lostInRange.filter(d => !isExcludedOwner(d)).length;
  const closeRate = (coreWon + coreLost) > 0
    ? Math.round((coreWon / (coreWon + coreLost)) * 100) : null;

  // Per-stage breakdown with resolved names. Open stages = current pipeline (point in
  // time). Closed Won/Lost are PERIOD-FILTERED to deals closed in the range — otherwise
  // an MTD view would show all-time closed-won (e.g. 2,500+ / $3.8M), which is wrong.
  const byStage = {};
  deals.forEach(d => {
    if ((isWon(d) || isLost(d)) && !(d.properties.closedate >= date_from)) return;
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
      note: REP_NOTES[s.ownerId] || null,
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

  // Lead source attribution for leads created this period. Blends the human-tagged
  // True Lead Source (granular) with HubSpot's auto-captured Original Traffic Source
  // (fills the gaps), so attribution is near-complete instead of mostly "Unassigned".
  const newLeadDeals = deals.filter(d => d.properties.createdate >= date_from);
  const bySource = {};
  let manualTagged = 0, attributed = 0;
  newLeadDeals.forEach(d => {
    const { source, auto } = leadSourceOf(d.properties);
    if (!auto) manualTagged++;
    if (source !== 'Unknown') attributed++;
    if (!bySource[source]) bySource[source] = { count: 0, autoCount: 0 };
    bySource[source].count++;
    if (auto) bySource[source].autoCount++;
  });
  const leadSources = Object.entries(bySource)
    .map(([source, s]) => ({
      source,
      count: s.count,
      pct: newLeadDeals.length ? Math.round((s.count / newLeadDeals.length) * 100) : 0,
      autoOnly: s.autoCount === s.count, // no human tag in this bucket — auto-attributed
      unknown: source === 'Unknown',
    }))
    .sort((a, b) => {
      if (a.unknown !== b.unknown) return a.unknown ? 1 : -1; // Unknown last
      return b.count - a.count;
    });
  const taggedLeads = manualTagged;             // leads a rep hand-tagged
  const attributedLeads = attributed;           // leads with ANY source (manual or auto)

  // Deals WON per month (by close date) — a sales-momentum curve for the pipeline
  // view. Uses closes (not createdate, which is dominated by the bulk pipeline import)
  // so it reads as real velocity. Period-independent; ignores stray pre-2026 closes.
  const wonByMonth = {};
  wonDeals.forEach(d => {
    const cd = d.properties.closedate;
    if (!cd || cd.slice(0, 7) < '2026-01') return;
    const m = cd.slice(0, 7); // YYYY-MM
    wonByMonth[m] = (wonByMonth[m] || 0) + 1;
  });
  const createdTrend = Object.entries(wonByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([month, count]) => ({ month, count }));

  return { total: deals.length, newLeads, activeLeads, revenue: Math.round(revenue), closeRate, wonCount, lostCount, openCount, openValue: Math.round(openValue), stageBreakdown, repLeaderboard, recentDeals, leadSources, taggedLeads, attributedLeads, createdTrend };
}

// In-memory result cache. Netlify reuses warm function instances, so this persists
// across requests and makes repeat dashboard loads instant instead of ~10s.
const STATS_CACHE = new Map(); // rangeKey -> { at: epochMs, body: string }
const CACHE_TTL_MS = 300000;   // 5 minutes (kept warm by keep-warm.mjs every 4 min)

// Last good deal total per range — baseline for the data-sanity guard. Survives across
// requests on a warm instance; resets on a cold start (guard simply skips the first read).
const LAST_GOOD_TOTAL = new Map(); // rangeKey -> total

export const handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };



  const rangeKey = event.queryStringParameters?.range || 'mtd';
  const isWarm = event.queryStringParameters?.warm === '1'; // keep-warm forces a real recompute
  const { date_from, date_to } = getDateRange(rangeKey);
  const cdnHeaders = { 'Cache-Control': 'public, max-age=0, must-revalidate', 'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=180, stale-while-revalidate=600' };


  // Fast path: recent in-memory result on this warm instance. Steady-state speed comes
  // from Netlify's durable CDN cache (headers below) — kept fresh by keep-warm's warm=1
  // recompute every 4 min — so real users are served from the edge and almost never wait
  // for the ~11s HubSpot fetch. warm=1 bypasses this to force the refresh.
  const cached = STATS_CACHE.get(rangeKey);
  if (!isWarm && cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { statusCode: 200, headers: { ...headers, ...cdnHeaders }, body: cached.body };
  }

  // Meta (facebook_ads) disabled — that Windsor connector slot was reallocated to
  // QuickBooks. Re-add fetchWindsor('facebook_ads', …) here to restore Meta.
  const [googleResult, gbpResult, hubspotResult, rgResult, financeResult, leadSrcResult] = await Promise.allSettled([
    fetchWindsor('google_ads', date_from, date_to),
    fetchWindsor('google_my_business', date_from, date_to),
    fetchHubSpotDeals(date_from),
    fetchRGServices(HUBSPOT_TOKEN, date_from),
    fetchQuickBooks(WINDSOR_KEY, 'this_year'), // finance tiles are always YTD (P&L is annual)
    fetchLeadSources(date_from),
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
    // LSA (Local Services Ads) is a separate pay-per-lead channel that stays always-on
    // even when the PPC campaigns (Search/PMax) are paused. Windsor returns it as a
    // system-generated "LocalServices..." campaign. Split so the two channels can be
    // reported independently (PPC ramps down into the seasonal pause; LSA keeps running).
    const isLsa = r => (r.campaign || '').toLowerCase().includes('localservices');

    // Aggregate KPIs + daily trend for an arbitrary subset of rows.
    const summarize = (subset) => {
      const spend = subset.reduce((s, r) => s + (parseFloat(r.spend) || parseFloat(r.cost) || 0), 0);
      const convs = subset.reduce((s, r) => s + (parseFloat(r.conversions) || 0), 0);
      const clicks = subset.reduce((s, r) => s + (parseFloat(r.clicks) || 0), 0);
      const impressions = subset.reduce((s, r) => s + (parseFloat(r.impressions) || 0), 0);
      const dayMap = {};
      subset.forEach(r => {
        if (!r.date) return;
        const day = r.date.slice(0, 10);
        if (!dayMap[day]) dayMap[day] = { spend: 0, conversions: 0, clicks: 0 };
        dayMap[day].spend       += parseFloat(r.spend) || parseFloat(r.cost) || 0;
        dayMap[day].conversions += parseFloat(r.conversions) || 0;
        dayMap[day].clicks      += parseFloat(r.clicks) || 0;
      });
      const trend = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-90)
        .map(([date, dd]) => ({ date, spend: Math.round(dd.spend), conversions: Math.round(dd.conversions), clicks: Math.round(dd.clicks) }));
      return {
        spend: Math.round(spend), conversions: Math.round(convs), clicks: Math.round(clicks), impressions: Math.round(impressions),
        cpa: convs > 0 ? Math.round(spend / convs) : null,
        cpc: clicks > 0 ? (spend / clicks).toFixed(2) : null,
        ctr: impressions > 0 ? (clicks / impressions * 100).toFixed(2) : null,
        trend,
      };
    };

    // Per-campaign breakdown (aggregate by campaign name), tagged PPC vs LSA.
    const spend = rows.reduce((s, r) => s + (parseFloat(r.spend) || parseFloat(r.cost) || 0), 0);
    const campMap = {};
    rows.forEach(r => {
      const name = r.campaign || 'Unknown';
      if (!campMap[name]) campMap[name] = { spend: 0, conversions: 0, clicks: 0, impressions: 0, lsa: isLsa(r) };
      campMap[name].spend       += parseFloat(r.spend) || parseFloat(r.cost) || 0;
      campMap[name].conversions += parseFloat(r.conversions) || 0;
      campMap[name].clicks      += parseFloat(r.clicks) || 0;
      campMap[name].impressions += parseFloat(r.impressions) || 0;
    });
    const campaigns = Object.entries(campMap).map(([name, d]) => ({
      name,
      channel:     d.lsa ? 'LSA' : 'PPC',
      spend:       Math.round(d.spend),
      conversions: Math.round(d.conversions),
      clicks:      Math.round(d.clicks),
      cpa:         d.conversions > 0 ? Math.round(d.spend / d.conversions) : null,
      ctr:         d.impressions > 0 ? (d.clicks / d.impressions * 100).toFixed(2) : null,
      sharePct:    spend > 0 ? Math.round(d.spend / spend * 100) : 0,
    })).sort((a, b) => b.spend - a.spend);

    const all = summarize(rows);
    const ppc = summarize(rows.filter(r => !isLsa(r)));
    const lsa = summarize(rows.filter(isLsa));

    stats.google = {
      ...all, campaigns,
      ppc, lsa,
      sub: all.conversions > 0 ? `↑ ${all.conversions} conv · $${all.cpa} CPA` : `$${all.spend.toLocaleString()} spend`,
      dir: 'up',
    };
  } else { stats.errors.google = googleResult.reason?.message; }

  // ── Meta Ads — DISABLED (Windsor slot reallocated to QuickBooks) ──────────

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
    const { sales: s, commercial: c } = hubspotResult.value;
    // Primary tile + dashboard = 2026 Sales (residential). Commercial is exposed
    // alongside so the Pipeline view can toggle to it.
    stats.pipeline = { total: s.total, sub: 'open + closed (all years)', dir: '' };
    stats.hubspot  = { total: s.total, newLeads: s.newLeads, activeLeads: s.activeLeads, revenue: s.revenue, closeRate: s.closeRate, wonCount: s.wonCount, lostCount: s.lostCount, openValue: s.openValue, stageBreakdown: s.stageBreakdown, repLeaderboard: s.repLeaderboard, recentDeals: s.recentDeals, leadSources: s.leadSources, taggedLeads: s.taggedLeads, attributedLeads: s.attributedLeads, createdTrend: s.createdTrend };
    stats.hubspotCommercial = { total: c.total, newLeads: c.newLeads, activeLeads: c.activeLeads, revenue: c.revenue, closeRate: c.closeRate, wonCount: c.wonCount, lostCount: c.lostCount, stageBreakdown: c.stageBreakdown, repLeaderboard: c.repLeaderboard, recentDeals: c.recentDeals, leadSources: c.leadSources, taggedLeads: c.taggedLeads, attributedLeads: c.attributedLeads, createdTrend: c.createdTrend };
    stats.sourceQuality = hubspotResult.value.sourceQuality || [];
    // Join paid-media cost so the "Google Ads" bucket shows CPL/CPA, not just revenue.
    // Spend is range-scoped; deal outcomes are all-time, so treat CPL/CPA as directional.
    const gSpend = stats.google?.spend || 0;
    stats.sourceQuality.forEach(sq => {
      if (sq.source === 'Google Ads' && gSpend > 0) {
        sq.cost = gSpend;
        sq.cpl = sq.quotes > 0 ? Math.round(gSpend / sq.quotes) : null;
        sq.cpa = sq.closedWon > 0 ? Math.round(gSpend / sq.closedWon) : null;
      }
    });
  } else { stats.errors.hubspot = hubspotResult.reason?.message; }

  // ── Lead sources (contact-level, Aircall-aware) ─────────────
  if (leadSrcResult.status === 'fulfilled') {
    stats.leadSources = leadSrcResult.value;
  } else { stats.errors.leadSources = leadSrcResult.reason?.message; }

  const googleSpend = stats.google?.spend || 0;
  stats.adSpend = { total: googleSpend, google: googleSpend, meta: 0 };

  // ── RG Services KPIs ────────────────────────────────────────
  if (rgResult.status === 'fulfilled') {
    stats.rgServices = rgResult.value;
  } else {
    stats.errors.rgServices = rgResult.reason?.message;
  }

  // ── Finance (QuickBooks P&L · YTD) ──────────────────────────
  if (financeResult.status === 'fulfilled') {
    stats.finance = financeResult.value;
  } else {
    stats.errors.finance = financeResult.reason?.message;
  }

  // Data-sanity guard: if the deal count collapsed versus the last good reading, the
  // fetch is probably incomplete (exactly the failure mode of the old truncation bug).
  // Flag it for the dashboard banner — and DON'T persist it, so a bad reading can't
  // poison the cache; the durable snapshot keeps serving last-good to everyone else.
  const prevTotal = LAST_GOOD_TOTAL.get(rangeKey) || 0;
  const newTotal  = stats.pipeline?.total || 0;
  let suspicious = false;
  if (prevTotal > 100 && newTotal < prevTotal * 0.6) {
    suspicious = true;
    stats.warnings = [`Deal count dropped from ${prevTotal.toLocaleString()} to ${newTotal.toLocaleString()} since the last reading — figures may be incomplete.`];
  }

  // CDN caching: the HubSpot fetch takes ~11s, so serve the computed result from
  // Netlify's durable edge cache instead of re-querying on every load. Don't cache a
  // response that errored or looks incomplete (would pin broken data to the edge).
  const hasErrors = Object.keys(stats.errors).length > 0;
  const body = JSON.stringify(stats);
  if (!hasErrors && !suspicious) {
    STATS_CACHE.set(rangeKey, { at: Date.now(), body });
    if (newTotal > 0) LAST_GOOD_TOTAL.set(rangeKey, newTotal);
  }
  const cacheHeaders = (hasErrors || suspicious) ? { 'Cache-Control': 'no-store' } : cdnHeaders;
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

  const props = 'program_status,program_code,cancel_reason,createdate,hs_lastmodifieddate,sold_date,sold_by_1,name,route';
  let allServices = [];
  let after = undefined;

  // Fetch property label mappings in parallel
  const [programCodeMap, cancelReasonMap, soldByMap] = await Promise.all([
    fetchPropertyOptions(hubspotToken, RG_OBJECT, 'program_code'),
    fetchPropertyOptions(hubspotToken, RG_OBJECT, 'cancel_reason'),
    fetchPropertyOptions(hubspotToken, RG_OBJECT, 'sold_by_1'),
  ]);

  // Paginate through ALL RG services (HubSpot returns max 100 per page). No artificial
  // cap — a low cap dropped the newest records (oldest-first), zeroing recent sales.
  for (let page = 0; page < 200; page++) {
    const url = `https://api.hubapi.com/crm/v3/objects/${RG_OBJECT}?limit=100&archived=false&properties=${props}${after ? `&after=${after}` : ''}`;
    const res = await hubspotGet(url, hubspotToken, { timeoutMs: 10000 });
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
    if (l.includes('aeration') || l.includes('signature')) return 'aeration';
    return 'other';
  }
  const TIERS = ['basic', 'essential', 'elite', 'mosquito', 'aeration', 'other'];
  const emptyTiers = () => Object.fromEntries(TIERS.map(t => [t, 0]));

  const active         = allServices.filter(s => p(s).program_status === STATUS_ACTIVE);
  const cancelled      = allServices.filter(s => p(s).program_status === STATUS_CANCELLED);
  const cancelPending  = allServices.filter(s => p(s).program_status === STATUS_CANCEL_PENDING);

  // New customers this period — by SOLD DATE (when the deal was actually sold), NOT
  // createdate (which is the HubSpot import date, so it read 0). Count non-cancelled
  // services sold in the period. sold_date is a HubSpot `date` (ISO string or epoch ms).
  const soldDay = (s) => {
    const v = p(s).sold_date;
    if (!v) return null;
    return /^\d{12,}$/.test(String(v)) ? new Date(Number(v)).toISOString().slice(0, 10) : String(v).slice(0, 10);
  };
  const newCustomers   = allServices.filter(s => p(s).program_status !== STATUS_CANCELLED && (soldDay(s) || '') >= date_from);
  const newCancels     = cancelled.filter(s => p(s).hs_lastmodifieddate >= date_from);

  // Program type breakdown for new customers
  const typeCount = emptyTiers();
  newCustomers.forEach(s => {
    const tier = classifyTier(resolveLabel(p(s).program_code));
    typeCount[tier] = (typeCount[tier] || 0) + 1;
  });

  // Total active by tier (all active, not just new)
  const activeByTier = emptyTiers();
  active.forEach(s => {
    const tier = classifyTier(resolveLabel(p(s).program_code));
    activeByTier[tier] = (activeByTier[tier] || 0) + 1;
  });

  // Programs sold per rep this period (sold_by_1), broken down by tier — for the scorecard.
  const byRep = {};
  newCustomers.forEach(s => {
    const rep = soldByMap[p(s).sold_by_1] || p(s).sold_by_1;
    if (!rep) return;
    if (!byRep[rep]) byRep[rep] = { rep, total: 0, ...emptyTiers() };
    const tier = classifyTier(resolveLabel(p(s).program_code));
    byRep[rep][tier] = (byRep[rep][tier] || 0) + 1;
    byRep[rep].total++;
  });
  const programsByRep = Object.values(byRep).sort((a, b) => b.total - a.total);

  // Estimate UNIQUE customers. RG records are per-PROGRAM (a customer has ~1.7) with no
  // customer id/association. Best key = customer's last name (from the record name suffix)
  // + their route — this splits same-surname customers on different routes. Lands ~2,700,
  // matching the real ~2,500 book far better than name alone (~2,050).
  const custKey = s => {
    const n = (p(s).name || '').trim();
    if (!n) return null;
    const parts = n.split(' - ');
    const last = (parts.length > 1 ? parts.pop() : n).trim().toLowerCase();
    return last ? `${last}|${(p(s).route || '').trim().toLowerCase()}` : null;
  };
  const estActiveCustomers = new Set(active.map(custKey).filter(Boolean)).size;
  const estNewCustomers    = new Set(newCustomers.map(custKey).filter(Boolean)).size;

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
    programsByRep,
    estActiveCustomers,
    estNewCustomers,
    cancelReasons:    cancelReasonsList,
  };
}
