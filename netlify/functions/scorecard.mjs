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

// Count engagements (calls/emails) per owner for the period, via the Search API.
async function activityByOwner(objectType, fromEpochMs) {
  const counts = {};
  let after = 0;
  for (let page = 0; page < 60; page++) {
    const res = await hubspotGet(
      `https://api.hubapi.com/crm/v3/objects/${objectType}/search`,
      HUBSPOT_TOKEN,
      { timeoutMs: 9000, init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filterGroups: [{ filters: [
            { propertyName: 'hs_timestamp', operator: 'GTE', value: String(fromEpochMs) },
            { propertyName: 'hubspot_owner_id', operator: 'IN', values: SALES_REP_IDS },
          ] }],
          properties: ['hubspot_owner_id'],
          limit: 100,
          ...(after ? { after: String(after) } : {}),
        }),
      } },
    );
    if (!res.ok) throw new Error(`${objectType} ${res.status}: ${await res.text()}`);
    const data = await res.json();
    (data.results || []).forEach(r => {
      const o = r.properties?.hubspot_owner_id;
      if (o) counts[o] = (counts[o] || 0) + 1;
    });
    const total = data.total || 0;
    after += 100;
    if (after >= total || after >= 10000) break;
  }
  return counts;
}

export default async (req) => {
  const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS });

  const url = new URL(req.url);
  const rangeKey = url.searchParams.get('range') || 'mtd';
  const { date_from, date_to } = getDateRange(rangeKey);
  const fromEpoch = new Date(`${date_from}T00:00:00Z`).getTime();

  try {
    const [calls, emails] = await Promise.all([
      activityByOwner('calls', fromEpoch),
      activityByOwner('emails', fromEpoch),
    ]);
    const reps = SALES_REP_IDS.map(id => ({
      ownerId: id,
      name: OWNER_NAMES[id],
      calls: calls[id] || 0,
      emails: emails[id] || 0,
      activity: (calls[id] || 0) + (emails[id] || 0),
    })).sort((a, b) => b.activity - a.activity);

    return new Response(JSON.stringify({ dateRange: rangeKey, dateFrom: date_from, dateTo: date_to, fetchedAt: new Date().toISOString(), reps }), {
      status: 200,
      headers: { ...CORS, 'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=300, stale-while-revalidate=900' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: { ...CORS, 'Cache-Control': 'no-store' } });
  }
};
