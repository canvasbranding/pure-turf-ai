// Pure Turf AI — Revenue Rescue AI follow-up assistant (POST). For a single lead/deal,
// generates grounded, ready-to-use follow-up copy (call angle, SMS, email, voicemail,
// objection handling) + why-it-matters. Uses Anthropic TOOL-USE so the output is ALWAYS a
// clean, validated structured object — no JSON-parsing of free text, no markdown, no raw
// code blobs leaking into the UI. GENERATION ONLY — never sends anything.
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: CORS });

const TOOL = {
  name: 'follow_up',
  description: 'Produce clean, ready-to-send follow-up copy for a single Pure Turf deal.',
  input_schema: {
    type: 'object',
    properties: {
      priorityLevel: { type: 'string', description: 'Hot | High Priority | Needs Fast Follow-Up | At Risk | Going Cold | Low Priority' },
      whyItMatters:  { type: 'string', description: '1-2 plain sentences citing the actual deal facts' },
      bestNextAction:{ type: 'string', description: 'one concrete next step, e.g. "Call now, then text if no answer"' },
      talkTrack:     { type: 'string', description: '2-4 sentence phone opener, conversational' },
      sms:           { type: 'string', description: 'ready-to-send SMS, <=320 chars, warm, signed by the rep' },
      emailSubject:  { type: 'string', description: 'a short email subject line (no "Subject:" prefix)' },
      emailBody:     { type: 'string', description: 'a short email body, real paragraphs separated by a blank line, signed by the rep' },
      voicemail:     { type: 'string', description: 'a 15-20 second voicemail script' },
      objectionHandling: { type: 'string', description: 'the most likely objection + a one-line response' },
      programPositioning:{ type: 'string', description: 'which Pure Turf program/angle to lead with and why' },
      addOnSuggestion:   { type: 'string', description: 'one relevant add-on to mention, or "none"' },
      riskIfIgnored: { type: 'string', description: 'what is lost if this sits another week' },
      dataUsed:      { type: 'array', items: { type: 'string' }, description: 'specific data points used' },
      dataMissing:   { type: 'array', items: { type: 'string' }, description: 'data that would sharpen this but was not provided' },
    },
    required: ['priorityLevel', 'whyItMatters', 'bestNextAction', 'talkTrack', 'sms', 'emailSubject', 'emailBody', 'voicemail', 'riskIfIgnored'],
  },
};

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'POST only' });
  if (!process.env.ANTHROPIC_API_KEY) return json(500, { error: 'ANTHROPIC_API_KEY not set' });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'Invalid JSON' }); }
  const { deal = {}, repName = 'the rep' } = body;

  const system =
    `You are Pure Turf AI, an internal sales assistant for Pure Turf, a lawn-care company in Middle Tennessee. ` +
    `Use ONLY the provided CRM/pipeline/lead/deal data to write practical, revenue-aware, ready-to-use follow-up copy for ${repName}. ` +
    `Sound like a real Middle-TN lawn-care salesperson — warm and specific, not a template. ` +
    `Do NOT invent numbers, lawn sizes, programs, or facts that weren't provided; if something useful is missing, put it in dataMissing. ` +
    `Lead with seasonal timing when it fits (summer weed/disease pressure, fall aeration & overseeding). ` +
    `CRITICAL FORMATTING: every text field is plain, ready-to-paste text — absolutely NO markdown, asterisks, bold, headers, bullet characters, emojis, or code. ` +
    `Write natural sentences; use real line breaks only inside the email body to separate paragraphs. ` +
    `Call the follow_up tool with your result.`;

  try {
    const resp = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'follow_up' },
      messages: [{ role: 'user', content: `Generate follow-up for this deal:\n\n${JSON.stringify(deal, null, 2)}` }],
    });
    const tu = resp.content?.find(b => b.type === 'tool_use');
    if (!tu?.input) return json(502, { error: 'No structured result' });
    return json(200, { ok: true, result: tu.input });
  } catch (err) {
    return json(500, { error: err.message });
  }
};
