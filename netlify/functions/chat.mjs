// Pure Turf AI — Netlify Serverless Function
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const WINDSOR_KEY   = process.env.WINDSOR_API_KEY;
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY;

// Fire-and-forget query log to Supabase
function logQuery(email, name, message) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  fetch(`${SUPABASE_URL}/rest/v1/pt_chat_logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ user_email: email || 'unknown', user_name: name || 'Unknown', message: (message || '').slice(0, 2000) }),
  }).catch(() => {}); // silent fail — never block chat
}

// Stage & owner maps — kept for enrichment
const DEAL_STAGES = {
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

// ── TOOL DEFINITIONS ──────────────────────────────────────────────────────
const tools = [
  {
    name: 'get_google_ads',
    description: 'Fetch Google Ads performance (spend, conversions, CPA) from Windsor.ai.',
    input_schema: { type: 'object', properties: {
      date_from: { type: 'string', description: 'Start date YYYY-MM-DD. Default: first of current month.' },
      date_to:   { type: 'string', description: 'End date YYYY-MM-DD. Default: today.' },
    }, required: [] },
  },
  {
    name: 'get_meta_ads',
    description: 'Fetch Meta Ads performance from Windsor.ai.',
    input_schema: { type: 'object', properties: {
      date_from: { type: 'string' }, date_to: { type: 'string' },
    }, required: [] },
  },
  {
    name: 'get_gbp',
    description: 'Fetch Google Business Profile insights (views, calls, directions, clicks) from Windsor.ai.',
    input_schema: { type: 'object', properties: {
      date_from: { type: 'string' }, date_to: { type: 'string' },
    }, required: [] },
  },
  {
    name: 'get_pipeline_deals',
    description: 'Fetch HubSpot CRM deals. Returns deals by stage, by owner rep, and a sample of recent deals. Always use this for pipeline/deal/lead/closing questions.',
    input_schema: { type: 'object', properties: {
      pipeline_name: {
        type: 'string',
        description: 'Pipeline name substring to filter by, e.g. "Sales" or "Commercial". Optional — if omitted returns all deals.',
      },
      owner_name: {
        type: 'string',
        description: 'Filter by rep name, e.g. "Kaley" or "Chris Kleeman". Optional.',
      },
      limit: { type: 'number', description: 'Max deals to fetch (up to 200). Default 200.' },
    }, required: [] },
  },
  {
    name: 'get_all_pipelines',
    description: 'List all HubSpot pipelines and their stages. Use this to discover pipeline names and IDs.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
];

// ── TOOL IMPLEMENTATIONS ──────────────────────────────────────────────────
function getDateRange(rangeKey) {
  const today = new Date();
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const date_to = fmt(today);
  let date_from;
  switch (rangeKey) {
    case '7d':  { const d = new Date(today); d.setDate(d.getDate()-6); date_from = fmt(d); break; }
    case '30d': { const d = new Date(today); d.setDate(d.getDate()-29); date_from = fmt(d); break; }
    case '90d': { const d = new Date(today); d.setDate(d.getDate()-89); date_from = fmt(d); break; }
    case 'ytd': { date_from = `${today.getFullYear()}-01-01`; break; }
    default:    { date_from = `${today.getFullYear()}-${pad(today.getMonth()+1)}-01`; } // MTD
  }
  return { date_from, date_to };
}

// Campaigns to exclude from Google Ads data
const EXCLUDED_CAMPAIGNS = ['mosquito', 'pmax - mosquito', 'pmax mosquito'];

async function getWindsor(datasource, date_from, date_to, rangeKey) {
  const d = rangeKey ? getDateRange(rangeKey) : getDateRange('mtd');
  const from = date_from || d.date_from;
  const to   = date_to   || d.date_to;
  const fields = datasource === 'google_my_business'
    ? 'datasource,date,impressions,phone_calls,direction_requests,website_clicks'
    : 'datasource,date,campaign,spend,impressions,clicks,conversions,cost_per_conversion';
  const url = `https://connectors.windsor.ai/all?api_key=${WINDSOR_KEY}&fields=${fields}&date_from=${from}&date_to=${to}&datasource=${datasource}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Windsor error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data;
}

// Always use simple GET + client-side filter — avoids search endpoint 400 errors
async function getPipelineDeals(pipeline_name = null, limit = 100, owner_name = null) {
  const props = 'dealname,amount,dealstage,pipeline,hubspot_owner_id,closedate,createdate';

  // Paginate through deals (up to 3 pages = 300 deals — kept small for 26s timeout)
  let allResults = [];
  let after = undefined;
  for (let page = 0; page < 3; page++) {
    const url = `https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=${props}&archived=false${after ? `&after=${after}` : ''}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HubSpot GET error ${res.status}: ${err}`);
    }
    const data = await res.json();
    allResults = allResults.concat(data.results || []);
    if (data.paging?.next?.after) { after = data.paging.next.after; }
    else break;
  }

  let results = allResults;

  // Fetch pipeline definitions for name-based filtering
  let pipelinesRes = null;
  if (pipeline_name) {
    try {
      pipelinesRes = await fetch('https://api.hubapi.com/crm/v3/pipelines/deals', {
        headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}` },
      });
    } catch {}
  }

  // Client-side filter by pipeline name
  if (pipeline_name && pipelinesRes?.ok) {
    try {
      const plData = await pipelinesRes.json();
      const matched = (plData.results || []).filter(p =>
        p.label.toLowerCase().includes(pipeline_name.toLowerCase())
      );
      if (matched.length > 0) {
        const matchedIds = new Set(matched.map(p => p.id));
        results = results.filter(d => matchedIds.has(d.properties.pipeline));
      }
    } catch (e) { /* ignore, return unfiltered */ }
  }

  // Filter by owner name
  if (owner_name) {
    const ownerEntry = Object.entries(OWNER_NAMES).find(([, name]) =>
      name.toLowerCase().includes(owner_name.toLowerCase())
    );
    if (ownerEntry) results = results.filter(d => d.properties.hubspot_owner_id === ownerEntry[0]);
  }

  const enriched = results.map(deal => ({
    id:          deal.id,
    name:        deal.properties.dealname,
    amount:      deal.properties.amount ? parseFloat(deal.properties.amount) : null,
    stage:       DEAL_STAGES[deal.properties.dealstage] || deal.properties.dealstage,
    pipeline_id: deal.properties.pipeline,
    owner:       OWNER_NAMES[deal.properties.hubspot_owner_id] || 'Unassigned',
    closedate:   deal.properties.closedate,
    createdate:  deal.properties.createdate,
  }));

  const byStage = {}, byOwner = {};
  let totalAmount = 0;
  enriched.forEach(d => {
    if (d.stage) byStage[d.stage] = (byStage[d.stage] || 0) + 1;
    if (d.owner) byOwner[d.owner] = (byOwner[d.owner] || 0) + 1;
    if (d.amount) totalAmount += d.amount;
  });

  return {
    total_fetched: allResults.length,
    returned: enriched.length,
    filter: pipeline_name || 'all pipelines',
    byStage,
    byOwner,
    total_value: totalAmount > 0 ? `$${Math.round(totalAmount).toLocaleString()}` : 'N/A',
    sample_deals: enriched.slice(0, 15),
  };
}

async function getAllPipelines() {
  const res = await fetch('https://api.hubapi.com/crm/v3/pipelines/deals', {
    headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}` },
  });
  if (!res.ok) throw new Error(`HubSpot pipelines error ${res.status}`);
  const data = await res.json();
  // Return simplified view
  return (data.results || []).map(p => ({
    id:     p.id,
    label:  p.label,
    stages: (p.stages || []).map(s => ({ id: s.id, label: s.label })),
  }));
}

async function executeTool(name, input, dateRange) {
  try {
    switch (name) {
      case 'get_google_ads':    return await getWindsor('google_ads', input.date_from, input.date_to, dateRange);
      case 'get_meta_ads':      return await getWindsor('facebook_ads', input.date_from, input.date_to, dateRange);
      case 'get_gbp':           return await getWindsor('google_my_business', input.date_from, input.date_to, dateRange);
      case 'get_pipeline_deals':return await getPipelineDeals(input.pipeline_name, input.limit, input.owner_name);
      case 'get_all_pipelines': return await getAllPipelines();
      default: return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { error: err.message };
  }
}

// ── SYSTEM PROMPT ─────────────────────────────────────────────────────────
function getSystemPrompt(userName, userRole, liveStats, dateRange) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const name = userName || 'a Pure Turf team member';
  const role = userRole || 'sales';

  // Role-specific framing — who am I talking to, and what do they care about?
  const roleGuidance = {
    sales: `You are talking to ${name}, a salesperson on the Pure Turf team. When they say "I", "me", or "my", they mean THEIR OWN performance — find their row in the rep leaderboard (match on their name "${name}") and answer about their deals, their close rate, their pipeline. Coach them: which deals to chase, what's stalling, how they're tracking to goal. Keep it personal and motivating, not company-wide unless they ask.`,
    sales_manager: `You are talking to ${name}, the Sales Manager / VP of Sales. Focus on the whole team: the rep leaderboard, who's ahead and who's behind, coaching opportunities, pipeline health, and close-rate trends. Call out specific reps by name and be direct about who needs attention.`,
    executive: `You are talking to ${name}, a company executive. Give leadership-level answers: revenue, pipeline value, close rate, customer growth and churn, ad ROI. Lead with the bottom line and what needs a decision.`,
    owner: `You are talking to ${name}, an owner of Pure Turf. Give the big picture: revenue, pipeline, customer growth/churn, ad ROI, and the one or two things that need your attention this week.`,
    marketing: `You are talking to ${name} on the marketing team. Focus on ad performance (Google Ads, Meta, GBP), CPA, lead generation, and which campaigns to optimize, pause, or scale.`,
    admin: `You are talking to ${name}, who manages this tool. Answer whatever they ask across both marketing and sales.`,
  };
  const framing = roleGuidance[role] || roleGuidance.sales;

  const groundTruth = liveStats
    ? `\n\nLIVE DASHBOARD DATA — this is the EXACT data ${name} is looking at right now (period: "${dateRange || 'current'}"). Treat it as the single source of truth for all headline numbers:\n${JSON.stringify(liveStats)}\n\nUse these exact figures for spend, CPA, conversions, pipeline totals, close rate, revenue, customers, and per-rep stats. Your numbers MUST match what's on their screen. Only call a tool when they ask about a DIFFERENT time period, or for detail not present in this data.`
    : '\n\n(The dashboard data was not provided — fetch what you need with the tools.)';

  return `You are Pure Turf AI — the marketing & sales intelligence assistant for Pure Turf LLC, a lawn care company in Middle Tennessee.

Today is ${dateStr}.

${framing}

You have live access to:
- Google Ads (Windsor.ai) — spend, conversions, CPA by campaign
- Meta Ads (Windsor.ai) — spend, CPM, reach
- Google Business Profile (Windsor.ai) — views, calls, directions, clicks
- HubSpot CRM — deals, pipeline stages, rep performance
${groundTruth}

Rules:
- The dashboard data above is authoritative. Your numbers must MATCH the dashboard the user sees — NEVER contradict it. For other time periods or deeper detail, use the tools.
- Be specific. "$89 CPA, 108 conversions" not "performing well."
- Lead with the most important insight, not "here's your data."
- Always end with a clear recommendation — what should ${name} do next?
- Use **bold** for key metrics and names.
- Be concise but complete.
- Format with clear sections/headings when the answer is multi-topic.
- NEVER explain tool limitations, API constraints, or how you got the data. Just present the answer confidently.
- If data is incomplete, give the best answer from what's available without caveats.

Company context:
- Pure Turf LLC, Middle Tennessee. Services: lawn care, mosquito control.
- Google campaigns: PMax Lawn, PMax Mosquito, Search Brand, Search Lawn. Meta: awareness + retargeting.
- HubSpot pipelines: "2026 Sales" and "2026 Commercial". The dashboard tracks the 2026 Sales pipeline; close rate excludes the sales manager and commercial rep.
- Reps: Kaley Brownlee, Chris Kleeman, Daniel Anderson (sales); Wyatt Raines (commercial); Kurt Dryden (sales manager). Owner: David Patton.`;
}

// ── HANDLER ───────────────────────────────────────────────────────────────
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };

  try {
    const { messages, dateRange, userEmail, userName, userRole, liveStats } = JSON.parse(event.body || '{}');
    if (!messages?.length) return { statusCode: 400, headers, body: JSON.stringify({ error: 'messages required' }) };

    // Log the user's latest message (fire-and-forget)
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) logQuery(userEmail, userName, lastUserMsg.content);

    let currentMessages = messages;
    let response;
    let iterations = 0;
    const startTime = Date.now();
    const TIME_BUDGET = 22000; // 22s budget out of 26s timeout

    while (iterations < 4) {
      iterations++;
      if (Date.now() - startTime > TIME_BUDGET) break; // bail before timeout

      response = await client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4096,
        system: getSystemPrompt(userName, userRole, liveStats, dateRange), tools, messages: currentMessages,
      });
      if (response.stop_reason !== 'tool_use') break;

      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
      // Run tool calls in PARALLEL (biggest speed win)
      const toolResults = await Promise.all(toolUseBlocks.map(async (block) => {
        console.log(`[TOOL] ${block.name}: ${JSON.stringify(block.input).slice(0, 300)}`);
        const result = await executeTool(block.name, block.input, dateRange);
        return { type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) };
      }));
      currentMessages = [...currentMessages, { role: 'assistant', content: response.content }, { role: 'user', content: toolResults }];
    }

    const reply = response?.content?.find(b => b.type === 'text')?.text || 'No response generated.';
    return { statusCode: 200, headers, body: JSON.stringify({ reply }) };

  } catch (err) {
    console.error('Chat error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
