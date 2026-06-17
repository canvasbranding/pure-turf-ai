// Pure Turf AI — Netlify Serverless Function
import Anthropic from '@anthropic-ai/sdk';
import {
  DEAL_STAGE_NAMES, OWNER_NAMES, getDateRange, fetchDealsInPipelines, leadSourceOf,
  PIPELINE_2026_SALES, PIPELINE_2026_COMMERCIAL, ACTIVE_PIPELINES,
} from './_shared/crm.mjs';

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
        description: 'Which pipeline to fetch: "Sales" (2026 Sales) or "Commercial" (2026 Commercial). Optional — if omitted, returns both 2026 pipelines. The legacy pipeline is never included.',
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

// Resolve a free-text pipeline name to the live pipeline id(s). Defaults to both
// 2026 pipelines; the legacy "Sales Pipeline (default)" is never included.
function resolvePipelines(pipeline_name) {
  const n = (pipeline_name || '').toLowerCase();
  if (n.includes('commercial')) return [PIPELINE_2026_COMMERCIAL];
  if (n.includes('sales'))      return [PIPELINE_2026_SALES];
  return ACTIVE_PIPELINES;
}

async function getPipelineDeals(pipeline_name = null, limit = 100, owner_name = null) {
  const props = 'dealname,amount,dealstage,pipeline,hubspot_owner_id,closedate,createdate,true_lead_source,hs_analytics_source';

  // Fetch the COMPLETE set of deals for the requested pipeline(s).
  const { rows: allResults } = await fetchDealsInPipelines(HUBSPOT_TOKEN, resolvePipelines(pipeline_name), props);
  let results = allResults;

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
    stage:       DEAL_STAGE_NAMES[deal.properties.dealstage] || deal.properties.dealstage,
    pipeline_id: deal.properties.pipeline,
    owner:       OWNER_NAMES[deal.properties.hubspot_owner_id] || 'Unassigned',
    source:      leadSourceOf(deal.properties).source,
    closedate:   deal.properties.closedate,
    createdate:  deal.properties.createdate,
  }));

  const byStage = {}, byOwner = {}, bySource = {};
  let totalAmount = 0;
  enriched.forEach(d => {
    if (d.stage) byStage[d.stage] = (byStage[d.stage] || 0) + 1;
    if (d.owner) byOwner[d.owner] = (byOwner[d.owner] || 0) + 1;
    bySource[d.source] = (bySource[d.source] || 0) + 1;
    if (d.amount) totalAmount += d.amount;
  });

  return {
    total_fetched: allResults.length,
    returned: enriched.length,
    filter: pipeline_name || 'all pipelines',
    byStage,
    byOwner,
    bySource,
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
    sales: `You are talking to ${name}, a salesperson on the Pure Turf team. When they say "I", "me", or "my", they mean THEIR OWN performance. For their PERSONAL numbers (deals, wins, losses, close rate, open pipeline), use ONLY their own row in liveStats.hubspot.repLeaderboard — match on the name "${name}". Do NOT use the company-wide totals or the stageBreakdown for their personal stats; those cover the whole company, not them. You may cite team-wide or other reps' numbers only as comparison, and label them clearly as such. Coach them: which deals to chase, what's stalling, how they're tracking to goal. Keep it personal and motivating.`,
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
- HubSpot CRM — deals, pipeline stages, rep performance, and lead-source attribution (True Lead Source)
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
- Lead source: "where did leads come from?" is answered by liveStats.hubspot.leadSources (or bySource from the pipeline tool). This BLENDS two signals: the rep-tagged True Lead Source (granular, e.g. "Google PPC - Search") when present, otherwise HubSpot's auto-captured Original Traffic Source (coarse: Paid Search, Paid Social, Direct Traffic, Organic Search, Offline / Manual Entry, Referrals). leadSources rows flagged autoOnly are auto-derived, not hand-tagged; taggedLeads is how many reps hand-tagged. Treat the blended breakdown as reliable for channel-level questions. "Offline / Manual Entry" means HubSpot couldn't auto-attribute it (usually a rep-entered lead) — encourage tagging True Lead Source for those. Only "Unknown" means no source at all.

Company context:
- Pure Turf LLC, Middle Tennessee. Services: lawn care, mosquito control.
- Google campaigns: PMax Lawn, PMax Mosquito, Search Brand, Search Lawn. Meta: awareness + retargeting.
- HubSpot pipelines: "2026 Sales" and "2026 Commercial". The dashboard tracks the 2026 Sales pipeline.
- Reps on the leaderboard: Kaley Brownlee, Chris Kleeman, Daniel Anderson (residential sales); Wyatt Raines (commercial sales, not residential). Kurt Dryden (VP Finance) is not shown as a sales rep. Owner: David Patton.`;
}

// ── HANDLER (streaming) ───────────────────────────────────────────────────
// Functions 2.0 streaming handler: tokens are sent to the browser as the model
// writes them, so the answer appears progressively instead of after a long wait.
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS });
  if (req.method !== 'POST')    return new Response('Method not allowed', { status: 405, headers: CORS });

  let payload;
  try { payload = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }); }

  const { messages, dateRange, userEmail, userName, userRole, liveStats } = payload;
  if (!messages?.length) return new Response(JSON.stringify({ error: 'messages required' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });

  // Log the user's latest message (fire-and-forget)
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  if (lastUserMsg) logQuery(userEmail, userName, lastUserMsg.content);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (t) => { try { controller.enqueue(encoder.encode(t)); } catch {} };
      try {
        let currentMessages = messages;
        let iterations = 0;
        const startTime = Date.now();
        const TIME_BUDGET = 22000; // 22s budget out of 26s timeout
        let producedText = false;

        while (iterations < 4) {
          iterations++;
          if (Date.now() - startTime > TIME_BUDGET) break;

          const ms = client.messages.stream({
            model: 'claude-sonnet-4-6', max_tokens: 4096,
            system: getSystemPrompt(userName, userRole, liveStats, dateRange), tools, messages: currentMessages,
          });
          // Forward text tokens to the browser as they arrive
          ms.on('text', (delta) => { producedText = true; send(delta); });
          const final = await ms.finalMessage();

          if (final.stop_reason !== 'tool_use') break;

          // Run tool calls in parallel, then continue the loop
          const toolUseBlocks = final.content.filter(b => b.type === 'tool_use');
          const toolResults = await Promise.all(toolUseBlocks.map(async (block) => {
            console.log(`[TOOL] ${block.name}: ${JSON.stringify(block.input).slice(0, 300)}`);
            const result = await executeTool(block.name, block.input, dateRange);
            return { type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) };
          }));
          currentMessages = [...currentMessages, { role: 'assistant', content: final.content }, { role: 'user', content: toolResults }];
        }

        if (!producedText) send('No response generated.');
        controller.close();
      } catch (err) {
        console.error('Chat error:', err);
        send(`\n\n_Something went wrong: ${err.message}_`);
        controller.close();
      }
    },
  });

  return new Response(stream, { status: 200, headers: { ...CORS, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' } });
};
