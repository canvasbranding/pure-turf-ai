// Pure Turf AI — Query Logs (admin only)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_EMAIL  = 'dhamby@pureturfllc.com';

export const handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{"error":"POST only"}' };

  try {
    const { email, limit } = JSON.parse(event.body || '{}');
    if (email !== ADMIN_EMAIL) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Admin only' }) };

    const count = Math.min(limit || 100, 500);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pt_chat_logs?order=created_at.desc&limit=${count}`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    const logs = await res.json();
    return { statusCode: 200, headers, body: JSON.stringify({ logs }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
