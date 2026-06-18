// Pure Turf AI — Revenue Rescue AI follow-up assistant (POST). For a single lead/deal,
// generates grounded, ready-to-use follow-up copy (call angle, SMS, email, voicemail,
// objection handling) + why-it-matters. Structured JSON, mirrors scorecard-coach.mjs.
// GENERATION ONLY — never sends anything (no sending integration exists).
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: CORS });

const SCHEMA = `{
  "priorityLevel": "Hot | High Priority | Needs Fast Follow-Up | At Risk | Going Cold | Low Priority",
  "whyItMatters": "1-2 sentences, specific, citing the actual deal facts provided",
  "bestNextAction": "one concrete next step (e.g. 'Call now, then SMS if no answer')",
  "talkTrack": "2-4 sentence phone opener tailored to this deal",
  "sms": "a ready-to-send SMS (<=320 chars), warm and specific, signed by the rep",
  "email": "a short follow-up email with subject line on the first line as 'Subject: ...'",
  "voicemail": "a 15-20 second voicemail script",
  "objectionHandling": "the single most likely objection here + a one-line response",
  "programPositioning": "which Pure Turf program/angle to lead with and why",
  "addOnSuggestion": "one relevant add-on to mention, or 'none' if not appropriate",
  "riskIfIgnored": "what revenue/opportunity is lost if this sits another week",
  "dataUsed": ["the specific data points you used"],
  "dataMissing": ["data that would sharpen this but wasn't provided"]
}`;

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'POST only' });
  if (!process.env.ANTHROPIC_API_KEY) return json(500, { error: 'ANTHROPIC_API_KEY not set' });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'Invalid JSON' }); }
  const { deal = {}, repName = 'the rep' } = body;

  const system =
    `You are Pure Turf AI, an internal sales assistant for Pure Turf, a lawn-care company in Middle Tennessee. ` +
    `Use ONLY the provided CRM/pipeline/lead/deal data. Identify why this opportunity deserves attention and write ` +
    `practical, revenue-aware, ready-to-use follow-up copy for ${repName}. Be specific and natural — sound like a real ` +
    `Middle-TN lawn-care salesperson, not a template. Do NOT invent numbers, lawn sizes, programs, or facts that ` +
    `weren't provided; if something useful is missing, list it under dataMissing rather than guessing. ` +
    `Lead with timing/urgency relevant to the season when appropriate (e.g. summer weed/disease pressure, fall aeration & overseeding). ` +
    `Respond with ONLY valid JSON (no markdown fences, no prose) matching exactly this shape:\n${SCHEMA}`;

  try {
    const resp = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system,
      messages: [{ role: 'user', content: `Generate follow-up for this deal:\n\n${JSON.stringify(deal, null, 2)}` }],
    });
    const text = (resp.content?.find(b => b.type === 'text')?.text || '{}').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    let result;
    try { result = JSON.parse(text); } catch { result = { raw: text }; }
    return json(200, { ok: true, result });
  } catch (err) {
    return json(500, { error: err.message });
  }
};
