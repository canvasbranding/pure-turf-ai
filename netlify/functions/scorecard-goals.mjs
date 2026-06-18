// Pure Turf AI — Scorecard goals. Per-rep sales goals powering the scorecard's goal
// cards + pacing. Reps manage their own; managers/leadership manage any.
//
// Storage: Netlify Blobs (the app's actual store — Supabase was referenced in settings.mjs
// but its env keys were never set). One blob holds the goals array. To migrate to Supabase
// later, run supabase/scorecard_schema.sql, set SUPABASE_URL/SUPABASE_SERVICE_KEY, and
// swap readAll/writeAll for REST calls — the handler logic stays the same.
import { getStore } from '@netlify/blobs';

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers });

// Leadership / managers who can set goals for ANY rep (reps can always manage their own).
const MANAGERS = ['david@pureturfllc.com', 'rbone@pureturfllc.com', 'kdryden@pureturfllc.com', 'dhamby@pureturfllc.com'];

function store() { return getStore({ name: 'pt-scorecard-goals', consistency: 'strong' }); }
async function readAll() { try { return (await store().get('all', { type: 'json' })) || []; } catch { return []; } }
async function writeAll(arr) { await store().setJSON('all', arr); }

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers });
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'Invalid JSON' }); }
  const { action } = body;
  const email = (body.requester_email || '').toLowerCase();
  const isManager = MANAGERS.includes(email);

  try {
    // ── LIST: managers see all goals; reps see only their own ────────────────
    if (action === 'list') {
      const all = await readAll();
      const goals = isManager ? all : all.filter(g => (g.rep_email || '').toLowerCase() === email);
      return json(200, { ok: true, goals, isManager });
    }

    // ── UPSERT: create or edit a goal (own, or any if manager) ───────────────
    if (action === 'upsert') {
      const g = body.goal || {};
      const targetRep = (g.rep_email || email).toLowerCase();
      if (!email) return json(400, { error: 'requester_email required' });
      if (!isManager && targetRep !== email) return json(403, { error: 'You can only set your own goals.' });
      if (!g.metric_key || g.target_value == null || !g.start_date || !g.end_date) {
        return json(400, { error: 'metric_key, target_value, start_date, end_date are required' });
      }
      const now = new Date().toISOString();
      const fields = {
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
        updated_at: now,
      };
      const all = await readAll();
      let saved;
      if (g.id) {
        const i = all.findIndex(x => x.id === g.id);
        if (i < 0) return json(404, { error: 'Goal not found' });
        if (!isManager && (all[i].rep_email || '').toLowerCase() !== email) return json(403, { error: 'Not allowed.' });
        all[i] = { ...all[i], ...fields };
        saved = all[i];
      } else {
        saved = { id: crypto.randomUUID(), ...fields, created_at: now };
        all.push(saved);
      }
      await writeAll(all);
      return json(200, { ok: true, goal: saved });
    }

    // ── DELETE ───────────────────────────────────────────────────────────────
    if (action === 'delete') {
      const id = body.id;
      if (!id) return json(400, { error: 'id required' });
      const all = await readAll();
      const g = all.find(x => x.id === id);
      if (!g) return json(200, { ok: true });
      if (!isManager && (g.rep_email || '').toLowerCase() !== email) return json(403, { error: 'Not allowed.' });
      await writeAll(all.filter(x => x.id !== id));
      return json(200, { ok: true });
    }

    return json(400, { error: `Unknown action: ${action}` });
  } catch (err) {
    return json(500, { error: err.message });
  }
};
