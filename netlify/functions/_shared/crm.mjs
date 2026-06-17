// Shared CRM constants + helpers for the Pure Turf functions.
// Single source of truth — both stats.mjs and chat.mjs import from here so the
// dashboard and the AI can never drift to different owner names, stage labels,
// pipeline ids, or date math. The `_shared` folder is ignored by Netlify's
// function bundler (leading underscore), so this is never deployed as an endpoint.

// The two live pipelines. The legacy "Sales Pipeline (default)" is never used.
export const PIPELINE_2026_SALES = '853190025';
export const PIPELINE_2026_COMMERCIAL = '878177085';
export const ACTIVE_PIPELINES = [PIPELINE_2026_SALES, PIPELINE_2026_COMMERCIAL];

// Deal stage id → human label.
export const DEAL_STAGE_NAMES = {
  '1271775084': 'Ready to Contact',
  '1308218008': 'Attempting to Contact',
  '1271775085': 'Estimate Sent',
  '1271775089': 'Closed Won',
  '1271775090': 'Closed Lost',
};
export const DEAL_STAGES_WON  = ['1271775089'];
export const DEAL_STAGES_LOST = ['1271775090'];
// Early-funnel stages (not yet won/lost) — used to count "active" leads.
export const EARLY_STAGES = new Set(['1271775084', '1308218008', '1271775085']);

// HubSpot owner id → rep name.
export const OWNER_NAMES = {
  '81719066': 'Chris Kleeman',  '82036260': 'Beth Dent',
  '82063761': 'Daniel Anderson','81847128': 'Kaley Brownlee',
  '82036049': 'Stuart Chandler','81693514': 'Kurt Dryden',
  '81719004': 'Wyatt Raines',   '82036368': 'Ashley Thomas',
  '83335372': 'Nicole McCutcheon',
};

// Reps excluded from the aggregate close rate (still shown individually, flagged).
export const CLOSE_RATE_EXCLUDED = {
  '81693514': 'Sales manager',    // Kurt Dryden
  '81719004': 'Commercial sales', // Wyatt Raines
};

// Non-sales staff — hidden entirely from the rep leaderboard.
export const NON_SALES_STAFF = new Set([
  '82036260', // Beth Dent (admin/scheduler)
  '82036368', // Ashley Thomas (admin)
  '83335372', // Nicole McCutcheon (admin)
  '82036049', // Stuart Chandler (CSM)
]);

// Campaign name fragments excluded from ad totals (mosquito line of business).
export const EXCLUDED_CAMPAIGNS = ['mosquito', 'pmax - mosquito', 'pmax mosquito'];

// Fetch EVERY deal in the given pipeline(s) via HubSpot's Search API.
// Filtering happens server-side, so we only pull the pipelines we want and never
// truncate them — unlike the old "GET all deals, then filter" approach, which
// silently dropped any deal past the page cap (and HubSpot returns oldest-first,
// so the dropped deals were the most recent — exactly the ones that matter).
//
// The first page reports the true `total`; remaining pages are fetched in
// parallel (bounded concurrency) using offset-based `after`, so several thousand
// deals come back in a couple of seconds instead of ~40 slow sequential round
// trips that would risk the function timeout. Returns { rows, total }.
export async function searchDeals(token, { pipelines, properties, sort = 'createdate', timeoutMs = 9000, concurrency = 4 }) {
  const pids = Array.isArray(pipelines) ? pipelines : [pipelines];
  const filters = pids.length === 1
    ? [{ propertyName: 'pipeline', operator: 'EQ', value: pids[0] }]
    : [{ propertyName: 'pipeline', operator: 'IN', values: pids }];
  const props = Array.isArray(properties) ? properties : properties.split(',');

  const page = async (after) => {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        filterGroups: [{ filters }],
        properties: props,
        sorts: [{ propertyName: sort, direction: 'DESCENDING' }],
        limit: 100,
        ...(after ? { after: String(after) } : {}),
      }),
    });
    if (!res.ok) throw new Error(`HubSpot deal search ${res.status}: ${await res.text()}`);
    return res.json();
  };

  const first = await page(0);
  const total = first.total || 0;
  const rows = [...(first.results || [])];

  // Remaining offsets (HubSpot caps search paging at 10,000 results).
  const offsets = [];
  for (let o = 100; o < total && o < 10000; o += 100) offsets.push(o);

  for (let i = 0; i < offsets.length; i += concurrency) {
    const batch = offsets.slice(i, i + concurrency);
    const pages = await Promise.all(batch.map(page));
    pages.forEach(p => rows.push(...(p.results || [])));
  }
  return { rows, total };
}

// Resolve a date range key ('7d' | '30d' | '90d' | 'ytd' | 'mtd'/default) to from/to dates.
export function getDateRange(rangeKey) {
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
    default:    { date_from = `${today.getFullYear()}-${pad(today.getMonth()+1)}-01`; } // MTD
  }
  return { date_from, date_to };
}
