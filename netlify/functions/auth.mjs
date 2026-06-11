const SUPABASE_URL     = process.env.SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function hashPin(pin, salt) {
  const s = salt || crypto.randomUUID();
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s + pin + 'pt-salt-2026'));
  const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  return { hash: `${s}:${hash}` };
}
async function verifyPin(pin, stored) {
  const [salt] = stored.split(':');
  const { hash } = await hashPin(pin, salt);
  return hash === stored;
}
async function sb(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: { 'apikey': SUPABASE_SERVICE, 'Authorization': `Bearer ${SUPABASE_SERVICE}`, 'Content-Type': 'application/json', 'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}
async function logEvent(email, event, actor) {
  await sb('POST', '/pt_user_events', { user_email: email, event, actor }).catch(() => {});
}
function getInitials(name) { return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0,2); }
function isAdmin(role) { return ['admin','marketing','executive'].includes(role); }

const ALLOWED_EMAIL = 'dhamby@pureturfllc.com';

// Server-authoritative team roster. Identity + role come from here (never from the
// client) so nobody can grant themselves a role. Roster members are pre-approved and
// self-claim a PIN on first login.
const ROSTER = {
  'dhamby@pureturfllc.com':    { name: 'David Hamby',     role: 'admin',     title: 'Director of Marketing',  initials: 'DH' },
  'david@pureturfllc.com':     { name: 'David Patton',    role: 'owner',     title: 'Owner',                  initials: 'DP' },
  'sbuchanan@pureturfllc.com': { name: 'Sean Buchanan',   role: 'executive', title: 'Director of Operations', initials: 'SB' },
  'kdryden@pureturfllc.com':   { name: 'Kurt Dryden',     role: 'executive', title: 'VP of Finance',          initials: 'KD' },
  'rbone@pureturfllc.com':     { name: 'Ronnie Bone',     role: 'executive', title: 'COO',                    initials: 'RB' },
  'dturner@pureturfllc.com':   { name: 'Dave Turner',     role: 'executive', title: 'Executive',              initials: 'DT' },
  'kaley@pureturfllc.com':     { name: 'Kaley Brownlee',  role: 'sales',     title: 'Sales',                  initials: 'KB' },
  'chris@pureturfllc.com':     { name: 'Chris Kleeman',   role: 'sales',     title: 'Sales',                  initials: 'CK' },
  'daniel@pureturfllc.com':    { name: 'Daniel Anderson', role: 'sales',     title: 'Sales',                  initials: 'DA' },
  'wyatt@pureturfllc.com':     { name: 'Wyatt Raines',    role: 'sales',     title: 'Sales',                  initials: 'WR' },
  'lauren@canvasbranding.com': { name: 'Lauren Hamby',    role: 'marketing', title: 'Marketing',              initials: 'LH' },
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
  const { action } = body;

  if (action === 'signup') {
    const { email, name, pin } = body;
    if (!email || !name || !pin) return { statusCode: 400, headers, body: JSON.stringify({ error: 'email, name, and pin required' }) };
    if (email.toLowerCase() !== ALLOWED_EMAIL) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Access is currently restricted' }) };
    if (!/^\d{4}$/.test(pin)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'PIN must be 4 digits' }) };
    const existing = await sb('GET', `/pt_users?email=eq.${encodeURIComponent(email.toLowerCase())}&select=id,status`);
    if (existing.ok && existing.data?.length > 0) {
      const u = existing.data[0];
      if (u.status === 'pending')  return { statusCode: 409, headers, body: JSON.stringify({ error: 'Account request already submitted — awaiting approval.' }) };
      if (u.status === 'active')   return { statusCode: 409, headers, body: JSON.stringify({ error: 'An account with this email already exists.' }) };
      if (u.status === 'disabled') return { statusCode: 409, headers, body: JSON.stringify({ error: 'This account has been disabled. Contact your admin.' }) };
    }
    const { hash } = await hashPin(pin);
    const result = await sb('POST', '/pt_users', { email: email.toLowerCase(), name: name.trim(), pin_hash: hash, role: 'pending', status: 'pending', initials: getInitials(name.trim()), title: 'Team Member' });
    if (!result.ok) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not create account. Try again.' }) };
    await logEvent(email, 'signup', email);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, message: 'Account request submitted. An admin will approve your access shortly.' }) };
  }

  if (action === 'login') {
    const { email, pin } = body;
    if (!email || !pin) return { statusCode: 400, headers, body: JSON.stringify({ error: 'email and pin required' }) };
    const e = email.toLowerCase();
    const roster = ROSTER[e];
    const result = await sb('GET', `/pt_users?email=eq.${encodeURIComponent(e)}&select=*`);
    const user = (result.ok && result.data?.length) ? result.data[0] : null;

    // No PIN on file yet → first-time setup (roster members are pre-approved).
    if (!user || !user.pin_hash) {
      if (roster || user) return { statusCode: 200, headers, body: JSON.stringify({ ok: false, needsPinSetup: true }) };
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Access is restricted. Ask an admin to add you.' }) };
    }
    if (!roster && user.status === 'pending')  return { statusCode: 403, headers, body: JSON.stringify({ error: 'Your account is awaiting approval.' }) };
    if (user.status === 'disabled')            return { statusCode: 403, headers, body: JSON.stringify({ error: 'Your account has been disabled.' }) };
    const valid = await verifyPin(pin, user.pin_hash);
    if (!valid) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Incorrect PIN.' }) };
    await sb('PATCH', `/pt_users?id=eq.${user.id}`, { last_login: new Date().toISOString() });
    await logEvent(e, 'login', e);
    // Identity/role from the roster when present (authoritative), else from the row.
    const r = roster || user;
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, user: { email: e, name: r.name, role: r.role, initials: r.initials, title: r.title } }) };
  }

  // First-time PIN claim (or completing a reset). Allowed for roster members or rows
  // that have no PIN yet; refuses to overwrite an already-set PIN (admin must reset).
  if (action === 'set-pin') {
    const { email, pin } = body;
    if (!email || !pin) return { statusCode: 400, headers, body: JSON.stringify({ error: 'email and pin required' }) };
    if (!/^\d{4}$/.test(pin)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'PIN must be 4 digits' }) };
    const e = email.toLowerCase();
    const roster = ROSTER[e];
    const existing = await sb('GET', `/pt_users?email=eq.${encodeURIComponent(e)}&select=*`);
    const user = (existing.ok && existing.data?.length) ? existing.data[0] : null;
    if (!roster && !user) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Access is restricted.' }) };
    if (user && user.pin_hash && user.status !== 'disabled') return { statusCode: 409, headers, body: JSON.stringify({ error: 'A PIN is already set. Ask an admin to reset it.' }) };
    const { hash } = await hashPin(pin);
    if (user) {
      await sb('PATCH', `/pt_users?id=eq.${user.id}`, { pin_hash: hash, status: 'active', last_login: new Date().toISOString(), ...(roster ? { name: roster.name, role: roster.role, title: roster.title, initials: roster.initials } : {}) });
    } else {
      const res = await sb('POST', '/pt_users', { email: e, name: roster.name, role: roster.role, title: roster.title, initials: roster.initials, pin_hash: hash, status: 'active', last_login: new Date().toISOString() });
      if (!res.ok) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not create account. Try again.' }) };
    }
    await logEvent(e, 'set-pin', e);
    const r = roster || user;
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, user: { email: e, name: r.name, role: r.role, initials: r.initials, title: r.title } }) };
  }

  // Admin clears a user's PIN so they set a new one on next login (forgot-PIN path).
  if (action === 'reset-pin') {
    const { requester_email, user_id, email } = body;
    const req = await sb('GET', `/pt_users?email=eq.${encodeURIComponent((requester_email || '').toLowerCase())}&select=role,status`);
    if (!req.ok || !req.data?.length || req.data[0].status !== 'active' || !isAdmin(req.data[0].role)) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    const target = user_id ? `id=eq.${user_id}` : `email=eq.${encodeURIComponent((email || '').toLowerCase())}`;
    await sb('PATCH', `/pt_users?${target}`, { pin_hash: null });
    await logEvent(email || user_id, 'reset-pin', requester_email);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  if (action === 'list-pending') {
    const { requester_email } = body;
    const req = await sb('GET', `/pt_users?email=eq.${encodeURIComponent(requester_email)}&select=role,status`);
    if (!req.ok || !req.data?.length || req.data[0].status !== 'active' || !isAdmin(req.data[0].role)) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    const pending = await sb('GET', '/pt_users?status=eq.pending&select=id,email,name,initials,title,created_at&order=created_at.asc');
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, pending: pending.data || [] }) };
  }

  if (action === 'approve') {
    const { requester_email, user_id, role } = body;
    const req = await sb('GET', `/pt_users?email=eq.${encodeURIComponent(requester_email)}&select=role,status`);
    if (!req.ok || !req.data?.length || req.data[0].status !== 'active' || !isAdmin(req.data[0].role)) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    const approvedRole = ['sales','executive','marketing','admin'].includes(role) ? role : 'sales';
    const userRes = await sb('GET', `/pt_users?id=eq.${user_id}&select=email`);
    await sb('PATCH', `/pt_users?id=eq.${user_id}`, { status: 'active', role: approvedRole, approved_at: new Date().toISOString(), approved_by: requester_email });
    await logEvent(userRes.data?.[0]?.email, 'approved', requester_email);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  if (action === 'reject' || action === 'disable') {
    const { requester_email, user_id } = body;
    const req = await sb('GET', `/pt_users?email=eq.${encodeURIComponent(requester_email)}&select=role,status`);
    if (!req.ok || !req.data?.length || req.data[0].status !== 'active' || !isAdmin(req.data[0].role)) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    const userRes = await sb('GET', `/pt_users?id=eq.${user_id}&select=email`);
    await sb('PATCH', `/pt_users?id=eq.${user_id}`, { status: 'disabled' });
    await logEvent(userRes.data?.[0]?.email, action, requester_email);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  if (action === 'list-users') {
    const { requester_email } = body;
    const req = await sb('GET', `/pt_users?email=eq.${encodeURIComponent(requester_email)}&select=role,status`);
    if (!req.ok || !req.data?.length || req.data[0].status !== 'active' || !isAdmin(req.data[0].role)) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    const all = await sb('GET', '/pt_users?select=id,email,name,initials,title,role,status,created_at,last_login&order=created_at.asc');
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, users: all.data || [] }) };
  }

  return { statusCode: 400, headers, body: JSON.stringify({ error: `Unknown action: ${action}` }) };
};
