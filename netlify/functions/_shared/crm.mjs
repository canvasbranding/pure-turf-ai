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
export const CLOSE_RATE_EXCLUDED = {};

// Notes/badges shown next to a rep's name (does NOT exclude them from anything).
export const REP_NOTES = {
  '81719004': 'Commercial', // Wyatt Raines — commercial sales, not residential
};

// Non-sales staff — hidden entirely from the rep leaderboard.
export const NON_SALES_STAFF = new Set([
  '82036260', // Beth Dent (admin/scheduler)
  '82036368', // Ashley Thomas (admin)
  '83335372', // Nicole McCutcheon (admin)
  '82036049', // Stuart Chandler (CSM)
  '81693514', // Kurt Dryden (VP Finance / sales manager — not a residential rep)
]);

// Campaign name fragments excluded from ad totals (mosquito line of business).
export const EXCLUDED_CAMPAIGNS = ['mosquito', 'pmax - mosquito', 'pmax mosquito'];

// HubSpot Original Traffic Source (hs_analytics_source) enum → friendly label.
export const HS_SOURCE_LABELS = {
  ORGANIC_SEARCH: 'Organic Search',
  PAID_SEARCH: 'Paid Search',
  PAID_SOCIAL: 'Paid Social',
  SOCIAL_MEDIA: 'Organic Social',
  DIRECT_TRAFFIC: 'Direct Traffic',
  REFERRALS: 'Referrals',
  EMAIL_MARKETING: 'Email',
  OTHER_CAMPAIGNS: 'Other Campaigns',
  OFFLINE: 'Offline / Manual Entry',
};

// Normalize the many raw source strings into ONE clean set of channel buckets. The
// manual True Lead Source and the auto Original Traffic Source use different
// vocabularies ("Google PPC - Search" vs "Paid Search", "Organic Google" vs
// "Organic Search"), which fragments Google across 6+ tiny categories. Collapsing
// them lets Google read as the real driver it is. Order matters — most specific first.
// GBP and LSA share the same numbers/accounts at Pure Turf (never split), so they
// collapse to one "Google GBP + LSA" bucket. PPC is separate (dedicated numbers).
const CHANNEL_RULES = [
  [/ppc|paid.?search|google ?ads|adwords|\bsem\b/i,     'Google PPC'],
  [/\blsa\b|local service|business profile|\bgbp\b|\bgmb\b|google ?maps|\bmaps\b/i, 'Google GBP + LSA'],
  [/organic.?(google|search)|\bseo\b/i,                 'Organic Search'],
  [/direct.?mail|\bmail\b|postcard|\beddm\b/i,          'Direct Mail'],
  [/meta|facebook|instagram|\bfb\b|paid.?social/i,      'Paid Social'],
  [/social/i,                                           'Organic Social'],
  [/referr|word.?of.?mouth|\bwom\b/i,                   'Referral'],
  [/email/i,                                            'Email'],
  [/yard ?sign|lawn ?sign|truck|door|flyer|signage/i,  'Yard Signs'],
  [/other.?campaign/i,                                  'Other Campaign'],
  [/offline|manual/i,                                   'Phone / Offline'],
  [/direct.?traffic|^direct$|typed/i,                   'Website / Direct'],
];
export function normalizeChannel(s) {
  if (!s) return null;
  for (const [re, label] of CHANNEL_RULES) if (re.test(s)) return label;
  return null;
}

// Guard against junk lead-source tags (purely-numeric codes like "8", blanks, single
// chars) that leak in from misconfigured forms — they shouldn't show as a channel.
function isRealTag(s) {
  const v = (s || '').trim();
  return v.length > 1 && !/^\d+$/.test(v);
}

// Aircall tracking-number → lead source. Pure Turf runs a different phone number per
// channel, so the dialed number (CONTACT.last_used_aircall_phone_number) is the truest
// signal of where a PHONE lead came from. These calls are invisible to hs_analytics_source
// (web-session only — every call logs as OFFLINE), so this map is what surfaces the real mix.
// Source of truth: the Aircall Numbers dashboard (21 numbers). Extend as numbers change —
// no other code change needed.
//
// KEY NUANCE (confirmed by David, 2026-06): the 4 metro "local" numbers each serve as BOTH
// that location's Google Business Profile number AND its Local Services Ads number — GBP and
// LSA were never split, so a call on these can't be attributed to GBP vs LSA. They bucket to
// the combined "Google GBP + LSA". PPC, by contrast, has 4 dedicated per-campaign numbers, so
// PPC calls ARE cleanly separable. The standalone "LSA [City]" numbers in Aircall are unused.
export const PHONE_SOURCE_MAP = {
  // ── Google PPC (paid search) — dedicated per-campaign tracking numbers (active) ──
  '+16155993226': 'Google PPC',        // PPC Campaign 1 (Search)
  '+16152825083': 'Google PPC',        // PPC Campaign 2 (Branded)
  '+16158806451': 'Google PPC',        // PPC Campaign 3 (PMax)
  '+16158619024': 'Google PPC',        // PPC Campaign 4 (Mosquito)
  // ── Google GBP + LSA — one shared number per metro (GBP listing == LSA line) ──
  '+16157851849': 'Google GBP + LSA',  // Nashville / 445 Atlas Dr
  '+16156568772': 'Google GBP + LSA',  // Brentwood
  '+16294010924': 'Google GBP + LSA',  // Murfreesboro
  '+16152825118': 'Google GBP + LSA',  // Franklin
  // ── Direct Mail — per campaign/drop (some drops were never deployed) ──
  '+16158612262': 'Direct Mail',       // Campaign 1 · Drop 1B [11x14]
  '+16156148971': 'Direct Mail',       // Campaign 1 · Drop 3
  '+16155386612': 'Direct Mail',       // Campaign 3 · Drop 2
  '+16156567216': 'Direct Mail',       // Campaign 1 · Drop 1
  '+16157160390': 'Direct Mail',       // Campaign 1 · Drop 2
  '+16157161860': 'Direct Mail',       // Campaign 2 · Drop 1
  '+16153877041': 'Direct Mail',       // Campaign 2 · Drop 2
  '+16155446219': 'Direct Mail',       // Campaign 3 · Drop 1 [Welcome Neighbor]
  // ── Other channels ──
  '+16156160273': 'Yard Signs',        // Lawn Signs Number
  '+16158231146': 'Paid Social',       // Meta Ads
  // Unused (never deployed) split-LSA numbers, left unmapped on purpose:
  //   +16157161055 LSA Brentwood · +16292076897 LSA Murfreesboro · +16158618089 LSA Nashville
};

// Lead source for a CONTACT, normalized to a clean channel bucket. Priority:
//   1) Aircall tracking number (mapped)  — phone leads; biggest + most accurate signal
//   2) True Lead Source (rep-tagged)      — granular manual tag when present
//   3) Original Traffic Source (web)      — auto-captured web session (OFFLINE for calls)
// Returns { source, basis } where basis ∈ phone|manual|web|none.
export function contactSourceOf(props) {
  const num = (props.last_used_aircall_phone_number || '').trim();
  if (num && PHONE_SOURCE_MAP[num]) return { source: PHONE_SOURCE_MAP[num], basis: 'phone' };
  const manual = props.true_lead_source?.trim();
  if (isRealTag(manual)) return { source: normalizeChannel(manual) || manual, basis: 'manual' };
  const raw = props.hs_analytics_source?.trim();
  if (raw) {
    const label = HS_SOURCE_LABELS[raw] || raw.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    return { source: normalizeChannel(raw) || normalizeChannel(label) || label, basis: 'web' };
  }
  return { source: 'Unknown', basis: 'none' };
}

// Lead source for a deal, normalized to a clean channel bucket. Prefer the human-tagged
// True Lead Source when present (ground truth — it can name offline channels HubSpot's
// web tracking can't see), else fall back to the auto-captured Original Traffic Source
// (~100% populated). Returns { source, auto } where auto=true means it came from the
// automatic fallback. NOTE: ~68% of deals auto-capture as OFFLINE (phone/import with no
// web session) — Google-driven callers land there, so "Phone / Offline" is undercounted
// toward Google until call tracking is in place.
export function leadSourceOf(props) {
  const manual = props.true_lead_source?.trim();
  if (isRealTag(manual)) return { source: normalizeChannel(manual) || manual, auto: false };
  const raw = props.hs_analytics_source?.trim();
  if (raw) {
    const label = HS_SOURCE_LABELS[raw] || raw.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    return { source: normalizeChannel(raw) || normalizeChannel(label) || label, auto: true };
  }
  return { source: 'Unknown', auto: true };
}

// HubSpot GET with 429 retry/backoff. HubSpot enforces a rolling ~10-second request
// limit; when we paginate large objects (deals + RG services) this can trip it, so we
// wait (honoring Retry-After) and retry instead of failing the whole dashboard.
export async function hubspotGet(url, token, { timeoutMs = 9000, retries = 5, init = {} } = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      ...init,
      headers: { 'Authorization': `Bearer ${token}`, ...(init.headers || {}) },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status === 429 && attempt < retries) {
      const ra = parseFloat(res.headers.get('Retry-After'));
      const waitMs = Math.min((ra ? ra : 0.4 * Math.pow(2, attempt)) * 1000, 4000);
      await new Promise(r => setTimeout(r, waitMs));
      continue;
    }
    return res;
  }
}

// Fetch EVERY deal that belongs to the given pipeline(s), with NO truncation.
//
// We page through the regular GET /deals endpoint (which has a far more generous
// rate limit than the Search endpoint's ~4 req/s cap) until HubSpot stops
// returning a `next` cursor, then filter to the pipelines we care about. The old
// bug was a hard 30-page cap that dropped every deal past 3,000 — and since
// HubSpot returns oldest-first, the dropped deals were the most recent ones
// (this month's leads, recent closes). Removing the cap is the fix.
//
// Returns { rows, total } where total is the exact count in the target pipeline(s).
export async function fetchDealsInPipelines(token, pipelineIds, properties, { timeoutMs = 9000, maxPages = 120 } = {}) {
  const ids = new Set(Array.isArray(pipelineIds) ? pipelineIds : [pipelineIds]);
  const props = Array.isArray(properties) ? properties.join(',') : properties;
  let all = [];
  let after = undefined;
  for (let p = 0; p < maxPages; p++) {
    const url = `https://api.hubapi.com/crm/v3/objects/deals?limit=100&archived=false&properties=${props}${after ? `&after=${after}` : ''}`;
    const res = await hubspotGet(url, token, { timeoutMs });
    if (!res.ok) throw new Error(`HubSpot deals ${res.status}: ${await res.text()}`);
    const data = await res.json();
    all = all.concat(data.results || []);
    if (data.paging?.next?.after) after = data.paging.next.after;
    else break;
  }
  const rows = all.filter(d => ids.has(d.properties.pipeline));
  return { rows, total: rows.length };
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
