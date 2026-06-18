// Pure Turf AI — Scorecard goals (Supabase). Per-rep sales goals that power the
// scorecard's goal cards + pacing. Reps manage their own; managers/leadership manage any.
// Uses the Supabase SERVICE key (bypasses RLS) — same pattern as settings.mjs.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Leadership / managers who can set goals for ANY rep. Reps can always manage their own.
// (Kept here server-side so access can't be spoofed from the client.)
const MANAGERS = ['david@pureturfllc.com', 'rbone@pureturfllc.com', 'kdryden@pureturfllc.com', 'dhamby@pureturfllc.com'];

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
const reply = (status, obj) => ({ statusCode: status, headers, body: JSON.stringify(obj) });

function sb(path, init = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
    signal: AbortSignal.timeout(7000),
  });
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (!SUPABASE_URL || !SUPABASE_KEY) return reply(500, { error: 'Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_KEY)' });
  if (event.httpMethod !== 'POST') return reply(405, { error: 'POST only' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'Invalid JSON' }); }
  const { action } = body;
  const email = (body.requester_email || '').toLowerCase();
  const isManager = MANAGERS.includes(email);

  try {
    // ── LIST: managers see all goals; reps see only their own ────────────────
    if (action === 'list') {
      const filter = isManager ? '' : `&rep_email=eq.${encodeURIComponent(email)}`;
      const res = await sb(`scorecard_goals?select=*&order=end_date.asc,created_at.desc${filter}`);
      if (!res.ok) throw new Error(`list ${res.status}: ${await res.text()}`);
      return reply(200, { ok: true, goals: await res.json(), isManager });
    }

    // ── UPSERT: create or edit a goal (own goal, or any goal if manager) ──────
    if (action === 'upsert') {
      const g = body.goal || {};
      const targetRep = (g.rep_email || email).toLowerCase();
      if (!email) return reply(400, { error: 'requester_email required' });
      if (!isManager && targetRep !== email) return reply(403, { error: 'You can only set your own goals.' });
      if (!g.metric_key || g.target_value == null || !g.start_date || !g.end_date) {
        return reply(400, { error: 'metric_key, target_value, start_date, end_date are required' });
      }
      const row = {
        rep_email: targetRep,
        rep_name: g.rep_name || null,
        metric_key: g.metric_key,
        title: g.title || null,
        description: g.description || null,
        target_value: Number(g.target_value),
        unit: g.unit || 'count',
        period_type: g.period_type || 'monthly',
        start_date: g.start_date,
        end_date: g.end_date,
        status: g.status || 'active',
        visibility: g.visibility || 'team',
        assigned_by: email,
        notes: g.notes || null,
        source: g.source || 'manual',
        updated_at: new Date().toISOString(),
      };
      let res;
      if (g.id) {
        res = await sb(`scorecard_goals?id=eq.${g.id}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(row) });
      } else {
        res = await sb('scorecard_goals', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(row) });
      }
      if (!res.ok) throw new Error(`upsert ${res.status}: ${await res.text()}`);
      const saved = await res.json();
      return reply(200, { ok: true, goal: Array.isArray(saved) ? saved[0] : saved });
    }

    // ── DELETE / ARCHIVE ─────────────────────────────────────────────────────
    if (action === 'delete') {
      const id = body.id;
      if (!id) return reply(400, { error: 'id required' });
      // fetch to check ownership
      const cur = await (await sb(`scorecard_goals?id=eq.${id}&select=rep_email`)).json();
      const ownerEmail = (cur[0]?.rep_email || '').toLowerCase();
      if (!isManager && ownerEmail !== email) return reply(403, { error: 'Not allowed.' });
      const res = await sb(`scorecard_goals?id=eq.${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`delete ${res.status}`);
      return reply(200, { ok: true });
    }

    return reply(400, { error: `Unknown action: ${action}` });
  } catch (err) {
    return reply(500, { error: err.message });
  }
};
