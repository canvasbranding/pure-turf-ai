// Pure Turf AI — Rep Scorecard activity data.
// Per-rep ACTIVITY (calls + emails logged this period) from HubSpot. The dashboard
// already has per-rep RESULTS (leads/won/close rate/revenue via stats.repLeaderboard);
// the Scorecard view merges these two so effort sits next to outcome.
//
// Loaded only when the Scorecard view opens (not on every dashboard load), with its own
// CDN cache, so it never slows the main dashboard.
import { OWNER_NAMES, NON_SALES_STAFF, getDateRange, hubspotGet } from './_shared/crm.mjs';

const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

// Sales reps = owners we have names for, minus admin/non-sales staff.
const SALES_REP_IDS = Object.keys(OWNER_NAMES).filter(id => !NON_SALES_STAFF.has(id));

// Count engagements (calls/emails) per owner for the period. HubSpot's Search API returns
// the matching `total` for free, so we run ONE tiny query per rep (limit:1, reading total)
// instead of paging through every engagement record. ~8 quick queries vs 120+ pages — this
// is what fixed the ~20s scorecard load.
async function activityByOwner(objectType, fromEpochMs) {
  const counts = {};
  await Promise.all(SALES_REP_IDS.map(async (id) => {
    const res = await hubspotGet(
      `https://api.hubapi.com/crm/v3/objects/${objectType}/search`,
      HUBSPOT_TOKEN,
      { timeoutMs: 9000, init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filterGroups: [{ filters: [
            { propertyName: 'hs_timestamp', operator: 'GTE', value: String(fromEpochMs) },
            { propertyName: 'hubspot_owner_id', operator: 'EQ', value: id },
          ] }],
          limit: 1,
        }),
      } },
    );
    if (!res.ok) throw new Error(`${objectType} ${res.status}: ${await res.text()}`);
    const data = await res.json();
    counts[id] = data.total || 0;
  }));
  return counts;
}

export default async (req) => {
  const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS });

  const url = new URL(req.url);
  const rangeKey = url.searchParams.get('range') || 'mtd';
  const { date_from, date_to } = getDateRange(rangeKey);
  const fromEpoch = new Date(`${date_from}T00:00:00Z`).getTime();

  // Fetch each activity type independently — a missing HubSpot scope on one (e.g.
  // emails) shouldn't blank the whole scorecard.
  const [callsR, emailsR] = await Promise.allSettled([
    activityByOwner('calls', fromEpoch),
    activityByOwner('emails', fromEpoch),
  ]);
  const calls  = callsR.status === 'fulfilled'  ? callsR.value  : {};
  const emails = emailsR.status === 'fulfilled' ? emailsR.value : {};
  const unavailable = [];
  if (callsR.status !== 'fulfilled')  unavailable.push('calls');
  if (emailsR.status !== 'fulfilled') unavailable.push('emails');

  const reps = SALES_REP_IDS.map(id => ({
    ownerId: id,
    name: OWNER_NAMES[id],
    calls: calls[id] || 0,
    emails: emails[id] || 0,
    activity: (calls[id] || 0) + (emails[id] || 0),
  })).sort((a, b) => b.activity - a.activity);

  const ok = unavailable.length < 2;
  return new Response(JSON.stringify({ dateRange: rangeKey, dateFrom: date_from, dateTo: date_to, fetchedAt: new Date().toISOString(), reps, unavailable }), {
    status: 200,
    headers: { ...CORS, ...(ok ? { 'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=300, stale-while-revalidate=900' } : { 'Cache-Control': 'no-store' }) },
  });
};
