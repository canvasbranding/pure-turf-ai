// Pure Turf AI — Settings (Supabase key-value store)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_EMAIL  = 'dhamby@pureturfllc.com';

export const handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{"error":"POST only"}' };

  try {
    const { action, key, value, email } = JSON.parse(event.body || '{}');

    if (action === 'get') {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/pt_settings?key=eq.${encodeURIComponent(key)}&select=value`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }, signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) throw new Error(`Supabase GET ${res.status}`);
      const rows = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify({ value: rows[0]?.value || null }) };
    }

    if (action === 'set') {
      if (email !== ADMIN_EMAIL) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Admin only' }) };
      // Upsert: insert or update on conflict
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/pt_settings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'resolution=merge-duplicates,return=minimal',
          },
          body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
          signal: AbortSignal.timeout(5000),
        }
      );
      if (!res.ok) throw new Error(`Supabase UPSERT ${res.status}: ${await res.text()}`);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'action must be get or set' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
