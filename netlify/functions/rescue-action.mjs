// Pure Turf AI — Revenue Rescue actions (POST). Persists per-deal user state
// (snooze / dismiss / mark-contacted / complete) and the configurable score weights
// to Netlify Blobs. Derived scores are NOT stored — only these user decisions.
import { getStore } from '@netlify/blobs';

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers });
const MANAGERS = ['david@pureturfllc.com', 'rbone@pureturfllc.com', 'kdryden@pureturfllc.com', 'dhamby@pureturfllc.com'];

const stateStore  = () => getStore({ name: 'pt-rescue-state', consistency: 'strong' });
const configStore = () => getStore({ name: 'pt-rescue-config', consistency: 'strong' });

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers });
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'Invalid JSON' }); }
  const { action } = body;
  const email = (body.requester_email || '').toLowerCase();
  const isManager = MANAGERS.includes(email);
  const now = new Date().toISOString();

  try {
    // ── Configurable weights (leadership/admin only) ──
    if (action === 'save_weights') {
      if (!isManager) return json(403, { error: 'Only leadership can change scoring weights.' });
      if (!body.weights || typeof body.weights !== 'object') return json(400, { error: 'weights object required' });
      const clean = {};
      for (const [k, v] of Object.entries(body.weights)) { const n = Number(v); if (Number.isFinite(n)) clean[k] = n; }
      await configStore().setJSON('config', { weights: clean, updatedBy: email, updatedAt: now });
      return json(200, { ok: true, weights: clean });
    }
    if (action === 'get_config') {
      const cfg = await configStore().get('config', { type: 'json' }).catch(() => null);
      return json(200, { ok: true, config: cfg || null });
    }

    // ── Per-deal state ──
    const VALID = { snooze: 1, dismiss: 1, undismiss: 1, mark_contacted: 1, complete: 1, reopen: 1 };
    if (!VALID[action]) return json(400, { error: `Unknown action: ${action}` });
    const id = String(body.dealId || body.id || '');
    if (!id) return json(400, { error: 'dealId required' });

    const all = (await stateStore().get('all', { type: 'json' }).catch(() => null)) || {};
    const prev = all[id] || {};
    let next = { ...prev, updated_by: email, updated_at: now };

    if (action === 'snooze') {
      const days = Number(body.days) || 3;
      const until = new Date(Date.now() + days * 864e5).toISOString();
      next = { ...next, status: 'snoozed', snoozed_until: until };
    } else if (action === 'dismiss') {
      next = { ...next, status: 'dismissed', dismissed_at: now };
    } else if (action === 'undismiss' || action === 'reopen') {
      next = { ...next, status: 'active', dismissed_at: null, snoozed_until: null, completed_at: null };
    } else if (action === 'mark_contacted') {
      next = { ...next, status: 'contacted', contacted_at: now, snoozed_until: null };
    } else if (action === 'complete') {
      next = { ...next, status: 'completed', completed_at: now };
    }

    all[id] = next;
    await stateStore().setJSON('all', all);
    return json(200, { ok: true, state: next });
  } catch (err) {
    return json(500, { error: err.message });
  }
};
