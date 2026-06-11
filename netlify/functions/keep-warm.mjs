// Scheduled function: pings the stats endpoint every few minutes so the
// HubSpot/Windsor data stays cached and the function instance stays warm.
// Result: users essentially never hit the slow (~10s) cold path.
export default async () => {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://pureturfai.netlify.app';
  const ranges = ['mtd', 'ytd']; // the two most-used dashboard ranges
  const results = await Promise.allSettled(
    ranges.map(r => fetch(`${base}/.netlify/functions/stats?range=${r}`))
  );
  const ok = results.filter(r => r.status === 'fulfilled').length;
  console.log(`[keep-warm] refreshed ${ok}/${ranges.length} ranges`);
  return new Response('warmed', { status: 200 });
};

// Every 4 minutes — stays ahead of the 5-minute cache TTL.
export const config = { schedule: '*/4 * * * *' };
