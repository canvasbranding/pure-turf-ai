// Pure Turf AI — Operating Item actions (POST). Persists per-item user state
// (done / dismiss / snooze / assign / note / add-to-meeting) plus an append-only event
// log — the accountability foundation ("which recommendations were acted on, ignored,
// snoozed"). Items themselves are computed on read; only these human decisions are stored.
import { getStore } from '@netlify/blobs';

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers });

const stateStore  = () => getStore({ name: 'pt-operating-state', consistency: 'strong' });
const eventStore  = () => getStore({ name: 'pt-operating-events', consistency: 'strong' });

const VALID = { done: 1, dismiss: 1, undismiss: 1, snooze: 1, reopen: 1, assign: 1, note: 1, add_to_meeting: 1, view: 1 };

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers });
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'Invalid JSON' }); }
  const { action } = body;
  const email = (body.requester_email || '').toLowerCase();
  const id = String(body.item_id || body.id || '');
  if (!VALID[action]) return json(400, { error: `Unknown action: ${action}` });
  if (!id) return json(400, { error: 'item_id required' });
  const now = new Date().toISOString();

  try {
    const all = (await stateStore().get('all', { type: 'json' }).catch(() => null)) || {};
    const prev = all[id] || {};
    let next = { ...prev, item_id: id, updated_by: email, updated_at: now };

    if (action === 'done')            next = { ...next, status: 'done', completed_at: now };
    else if (action === 'dismiss')    next = { ...next, status: 'dismissed', dismissed_at: now };
    else if (action === 'undismiss' || action === 'reopen') next = { ...next, status: 'open', dismissed_at: null, snoozed_until: null, completed_at: null };
    else if (action === 'snooze')     next = { ...next, status: 'snoozed', snoozed_until: new Date(Date.now() + (Number(body.days) || 3) * 864e5).toISOString() };
    else if (action === 'assign')     next = { ...next, assigned_to: body.assignee || null };
    else if (action === 'note')       next = { ...next, notes: [...(prev.notes || []), { by: email, at: now, text: String(body.text || '').slice(0, 500) }] };
    else if (action === 'add_to_meeting') next = { ...next, meeting: body.meeting || 'sales' };
    // 'view' records an event only (no state change)

    if (action !== 'view') { all[id] = next; await stateStore().setJSON('all', all); }

    // Append-only event log (bounded ring of the most recent 2,000 events).
    try {
      const log = (await eventStore().get('log', { type: 'json' }).catch(() => null)) || [];
      log.unshift({ item_id: id, event_type: action, by: email, at: now, data: { days: body.days, assignee: body.assignee, meeting: body.meeting, text: body.text } });
      await eventStore().setJSON('log', log.slice(0, 2000));
    } catch { /* event logging is best-effort */ }

    return json(200, { ok: true, state: action === 'view' ? null : next });
  } catch (err) {
    return json(500, { error: err.message });
  }
};
