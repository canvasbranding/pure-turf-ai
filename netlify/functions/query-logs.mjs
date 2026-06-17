// Pure Turf AI — Query Logs (DAVID HAMBY ONLY)
// Reads the rolling query log from Netlify Blobs. Modern function style so Blobs
// auto-configures (the classic `export const handler` style does not).
import { getStore } from '@netlify/blobs';

const ADMIN_EMAIL = 'dhamby@pureturfllc.com';
const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: CORS });

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  try {
    const { email, limit } = await req.json();
    // Hard gate: only David Hamby may read the logs.
    if ((email || '').toLowerCase() !== ADMIN_EMAIL) return json(403, { error: 'Admin only' });

    const store = getStore({ name: 'pt-query-logs', consistency: 'strong' });
    const log = (await store.get('log', { type: 'json' })) || [];
    const count = Math.min(limit || 100, 500);
    return json(200, { logs: log.slice(0, count) });
  } catch (err) {
    return json(500, { error: err.message });
  }
};
