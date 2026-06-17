// Pure Turf AI — Finance (QuickBooks via Windsor). Powers the Finance section's
// period toggle (This Month / YTD / Last Year). The dashboard tiles use the YTD copy
// already baked into stats.finance; this exists so the section can switch periods.
import { fetchQuickBooks } from './_shared/quickbooks.mjs';

const WINDSOR_KEY = process.env.WINDSOR_API_KEY;
const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
const VALID = new Set(['this_month', 'this_year', 'last_year']);

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS });
  const period = new URL(req.url).searchParams.get('period');
  const datePreset = VALID.has(period) ? period : 'this_year';
  try {
    const data = await fetchQuickBooks(WINDSOR_KEY, datePreset);
    return new Response(JSON.stringify({ period: datePreset, ...data }), {
      status: 200,
      headers: { ...CORS, 'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=1800, stale-while-revalidate=3600' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: { ...CORS, 'Cache-Control': 'no-store' } });
  }
};
