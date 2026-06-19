// Scheduled function: keeps the heavy data endpoints warm so users essentially never hit
// the slow (~cold) path. Each of these pages through thousands of HubSpot deals, so a cold
// load is several seconds; pinging on a cadence keeps the Lambda instances hot AND refreshes
// the CDN snapshots they're served from (the s-maxage entries revalidate on these requests).
export default async () => {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://pureturfai.netlify.app';
  const mgr = 'dhamby@pureturfllc.com'; // manager email → warms the full-team compute path
  const urls = [
    // stats: warm=1 forces a real recompute + refreshes the durable snapshot users are served.
    `${base}/.netlify/functions/stats?range=mtd&warm=1`,
    `${base}/.netlify/functions/stats?range=ytd&warm=1`,
    // The other deal-heavy endpoints (each fetches all deals) — keep their caches + Lambdas warm.
    `${base}/.netlify/functions/rescue?requester_email=${mgr}`,
    `${base}/.netlify/functions/operating?requester_email=${mgr}`,
    `${base}/.netlify/functions/scorecard-followups`,
    `${base}/.netlify/functions/scorecard?range=mtd`,
    `${base}/.netlify/functions/scorecard?range=ytd`,
  ];
  const results = await Promise.allSettled(urls.map(u => fetch(u)));
  const ok = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
  console.log(`[keep-warm] warmed ${ok}/${urls.length} endpoints`);
  return new Response('warmed', { status: 200 });
};

// Every 4 minutes — stays ahead of the 5-minute cache TTL.
export const config = { schedule: '*/4 * * * *' };
