// Pure Turf AI — Scorecard AI coach (Phase 3). Returns STRUCTURED coaching grounded in
// the rep's (or team's) real scorecard data — metrics, goal pacing, and specific cold
// deals — so it names exact deals/numbers instead of generic "make more calls" advice.
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: CORS });

const REP_SCHEMA = `{
  "status": "one of: Ahead | On Track | Slightly Behind | At Risk | Off Track",
  "statusReason": "one sentence citing the actual pacing numbers",
  "biggestRisk": "one sentence, specific",
  "bestOpportunity": "one sentence, specific (name a deal or number)",
  "actions": ["3-5 concrete actions for today, each naming an exact deal, dollar amount, or number"],
  "followFocus": "which 1-3 deals to follow up first and why (use the cold-deal list)",
  "coachingNote": "one honest, encouraging line"
}`;

const MGR_SCHEMA = `{
  "teamSummary": "2-3 sentences on overall team pacing vs goal, grounded in the numbers",
  "improved": "what is working, with names/numbers",
  "slipped": "what is slipping, with names/numbers",
  "coachingAngle": "the single biggest coaching theme right now",
  "dealsToDiscuss": ["specific reps + deals to raise in the sales meeting"],
  "oneOnOneQuestions": ["2-3 pointed 1:1 questions"],
  "commitment": "one concrete team commitment for next week"
}`;

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'POST only' });
  if (!process.env.ANTHROPIC_API_KEY) return json(500, { error: 'ANTHROPIC_API_KEY not set' });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'Invalid JSON' }); }
  const { role = 'rep', name = 'the rep', period = 'this month', context = {} } = body;
  const isManager = role === 'manager';
  const schema = isManager ? MGR_SCHEMA : REP_SCHEMA;

  const system = `You are a sharp, no-nonsense sales coach for Pure Turf, a lawn-care company in Middle Tennessee. ` +
    `Coach ${isManager ? 'the sales leader' : name} for ${period} using ONLY the data provided — never invent deals or numbers. ` +
    `Be specific and operational: reference exact deal names, dollar amounts, days-cold, close rate, and goal pacing. ` +
    `NEVER give generic advice like "make more calls" or "follow up more" — if a deal is cold, name it and say what to do. ` +
    `Prioritize the highest-dollar cold deals and the metrics furthest behind pace. ` +
    `Respond with ONLY valid JSON (no markdown fences, no prose) matching exactly this shape:\n${schema}`;

  try {
    const resp = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1100,
      system,
      messages: [{ role: 'user', content: `Here is ${isManager ? "the team's" : name + "'s"} scorecard data for ${period}:\n\n${JSON.stringify(context, null, 2)}` }],
    });
    const text = (resp.content?.find(b => b.type === 'text')?.text || '{}').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    let coaching;
    try { coaching = JSON.parse(text); } catch { coaching = { raw: text }; }
    return json(200, { ok: true, coaching });
  } catch (err) {
    return json(500, { error: err.message });
  }
};
