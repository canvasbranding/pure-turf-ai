import { getStore } from '@netlify/blobs';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers });

// ── Storage: Netlify Blobs (built into the site — no external DB) ────────────
// One blob per user, keyed by lowercased email. id === email everywhere.
function store() { return getStore({ name: 'pt-users', consistency: 'strong' }); }

// ── Session epoch (force-logout) ─────────────────────────────────────────────
// Any session whose baseline (server time at login) is older than the epoch is
// forced to sign out. BUILD_EPOCH is a hard floor bumped at deploy time, so a
// deploy can invalidate every session in flight; an admin can also bump it live
// via the force-logout action (stored in Blobs). Sessions are compared in SERVER
// time (returned at login) to avoid client-clock skew.
const BUILD_EPOCH = 1781731833708; // 2026-06-17T21:30:33Z — bump to force everyone to re-login on deploy
function metaStore() { return getStore({ name: 'pt-meta', consistency: 'strong' }); }
async function getSessionEpoch() {
  try { const v = await metaStore().get('session_epoch', { type: 'json' }); return Math.max(BUILD_EPOCH, v?.epoch || 0); }
  catch { return BUILD_EPOCH; }
}
async function bumpSessionEpoch() {
  const epoch = Date.now();
  try { await metaStore().setJSON('session_epoch', { epoch }); } catch {}
  return Math.max(BUILD_EPOCH, epoch);
}
async function getUser(email) {
  if (!email) return null;
  try { return await store().get(email.toLowerCase(), { type: 'json' }); } catch { return null; }
}
async function putUser(email, data) { await store().setJSON(email.toLowerCase(), data); }
async function listAllUsers() {
  const s = store();
  const { blobs } = await s.list();
  const users = [];
  for (const b of blobs) {
    const u = await s.get(b.key, { type: 'json' });
    if (u) users.push(u);
  }
  return users.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
}

async function hashPin(pin, salt) {
  const s = salt || crypto.randomUUID();
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s + pin + 'pt-salt-2026'));
  const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return { hash: `${s}:${hash}` };
}
async function verifyPin(pin, stored) {
  const [salt] = stored.split(':');
  const { hash } = await hashPin(pin, salt);
  return hash === stored;
}
// Brute-force protection. A 4-digit PIN is only 10k combinations, so throttle
// guesses: after MAX_ATTEMPTS consecutive misses, lock the account for LOCKOUT_MS.
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
function lockedFor(user) {
  if (!user?.lockout_until) return 0;
  const remaining = new Date(user.lockout_until).getTime() - Date.now();
  return remaining > 0 ? remaining : 0;
}

function getInitials(name) { return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2); }
function isAdmin(role) { return ['admin', 'marketing', 'executive'].includes(role); }
async function requireAdmin(email) {
  const u = await getUser(email);
  return !!(u && u.status === 'active' && isAdmin(u.role));
}
function publicUser(u) {
  return { id: u.email, email: u.email, name: u.name, role: u.role, initials: u.initials, title: u.title, status: u.status, created_at: u.created_at, last_login: u.last_login };
}

// Server-authoritative team roster. Identity + role come from here (never from the
// client) so nobody can grant themselves a role. Roster members are pre-approved and
// self-claim a PIN on first login.
const ROSTER = {
  'dhamby@pureturfllc.com':    { name: 'David Hamby',     role: 'executive', title: 'Director of Marketing',  initials: 'DH' }, // executive role; full admin tooling retained via SUPER_ADMIN allowlist in the client
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

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers });
  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'Invalid JSON' }); }
  const { action } = body;
  const now = new Date().toISOString();

  try {
    // ── STATUS: does this person need to create a PIN? (no PIN required) ──────
    if (action === 'status') {
      const e = (body.email || '').toLowerCase();
      const roster = ROSTER[e];
      const user = await getUser(e);
      if (!user && !roster) return json(200, { ok: true, known: false, needsPinSetup: false });
      if (user && user.status === 'disabled') return json(200, { ok: true, known: true, disabled: true });
      return json(200, { ok: true, known: true, needsPinSetup: !user || !user.pin_hash });
    }

    // ── LOGIN ──────────────────────────────────────────────────────────────
    if (action === 'login') {
      const { email, pin } = body;
      if (!email || !pin) return json(400, { error: 'email and pin required' });
      const e = email.toLowerCase();
      const roster = ROSTER[e];
      const user = await getUser(e);

      // No PIN on file yet → first-time setup (roster members are pre-approved).
      if (!user || !user.pin_hash) {
        if (roster || user) return json(200, { ok: false, needsPinSetup: true });
        return json(403, { error: 'Access is restricted. Ask an admin to add you.' });
      }
      if (!roster && user.status === 'pending') return json(403, { error: 'Your account is awaiting approval.' });
      if (user.status === 'disabled')           return json(403, { error: 'Your account has been disabled.' });

      // Locked out from too many wrong PINs?
      const lockMs = lockedFor(user);
      if (lockMs > 0) {
        const mins = Math.ceil(lockMs / 60000);
        return json(429, { error: `Too many incorrect PINs. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` });
      }

      const valid = await verifyPin(pin, user.pin_hash);
      if (!valid) {
        const attempts = (user.failed_attempts || 0) + 1;
        const locked = attempts >= MAX_ATTEMPTS;
        await putUser(e, {
          ...user,
          failed_attempts: locked ? 0 : attempts,
          lockout_until: locked ? new Date(Date.now() + LOCKOUT_MS).toISOString() : (user.lockout_until || null),
        });
        if (locked) return json(429, { error: 'Too many incorrect PINs. Your account is locked for 15 minutes.' });
        const left = MAX_ATTEMPTS - attempts;
        return json(401, { error: `Incorrect PIN. ${left} attempt${left === 1 ? '' : 's'} left.` });
      }

      const r = roster || user;
      // Successful login clears any failed-attempt / lockout state.
      await putUser(e, { ...user, name: r.name, role: r.role, title: r.title, initials: r.initials, last_login: now, failed_attempts: 0, lockout_until: null });
      return json(200, { ok: true, server_time: Date.now(), user: { email: e, name: r.name, role: r.role, initials: r.initials, title: r.title } });
    }

    // ── SET PIN (first-time claim, or after an admin reset) ──────────────────
    if (action === 'set-pin') {
      const { email, pin } = body;
      if (!email || !pin) return json(400, { error: 'email and pin required' });
      if (!/^\d{4}$/.test(pin)) return json(400, { error: 'PIN must be 4 digits' });
      const e = email.toLowerCase();
      const roster = ROSTER[e];
      const user = await getUser(e);
      if (!roster && !user) return json(403, { error: 'Access is restricted.' });
      if (user && user.pin_hash && user.status !== 'disabled') return json(409, { error: 'A PIN is already set. Ask an admin to reset it.' });
      const { hash } = await hashPin(pin);
      const ident = roster || user || {};
      const merged = {
        email: e,
        name: ident.name || user?.name,
        role: ident.role || user?.role || 'sales',
        title: ident.title || user?.title || 'Team Member',
        initials: ident.initials || user?.initials || getInitials(ident.name || e),
        pin_hash: hash,
        status: 'active',
        created_at: user?.created_at || now,
        last_login: now,
      };
      await putUser(e, merged);
      return json(200, { ok: true, server_time: Date.now(), user: { email: e, name: merged.name, role: merged.role, initials: merged.initials, title: merged.title } });
    }

    // ── SESSION EPOCH: clients poll this to know if they've been force-logged-out ──
    if (action === 'session-epoch') {
      return json(200, { ok: true, epoch: await getSessionEpoch() });
    }

    // ── ADMIN: force everyone to re-login (bumps the session epoch) ───────────
    if (action === 'force-logout') {
      const { requester_email } = body;
      if (!(await requireAdmin(requester_email))) return json(403, { error: 'Unauthorized' });
      return json(200, { ok: true, epoch: await bumpSessionEpoch() });
    }

    // ── ADMIN: reset a user's PIN (they re-claim on next login) ───────────────
    if (action === 'reset-pin') {
      const { requester_email, user_id, email } = body;
      if (!(await requireAdmin(requester_email))) return json(403, { error: 'Unauthorized' });
      const target = (user_id || email || '').toLowerCase();
      const u = await getUser(target);
      if (u) await putUser(target, { ...u, pin_hash: null, failed_attempts: 0, lockout_until: null });
      return json(200, { ok: true });
    }

    // ── ADMIN: list all users (roster + claimed) ─────────────────────────────
    if (action === 'list-users') {
      const { requester_email } = body;
      if (!(await requireAdmin(requester_email))) return json(403, { error: 'Unauthorized' });
      const stored = await listAllUsers();
      const byEmail = new Map(stored.map(u => [u.email, u]));
      for (const [e, r] of Object.entries(ROSTER)) {
        if (!byEmail.has(e)) byEmail.set(e, { email: e, name: r.name, role: r.role, title: r.title, initials: r.initials });
      }
      const users = [...byEmail.values()].map(u => ({ ...publicUser(u), status: u.status === 'disabled' ? 'disabled' : (u.pin_hash ? 'active' : 'not_set_up') }));
      return json(200, { ok: true, users });
    }

    // ── ADMIN: disable / re-enable a user ────────────────────────────────────
    if (action === 'disable' || action === 'reject') {
      const { requester_email, user_id, email } = body;
      if (!(await requireAdmin(requester_email))) return json(403, { error: 'Unauthorized' });
      const target = (user_id || email || '').toLowerCase();
      const u = await getUser(target);
      if (u) await putUser(target, { ...u, status: 'disabled' });
      return json(200, { ok: true });
    }
    if (action === 'enable') {
      const { requester_email, user_id, email } = body;
      if (!(await requireAdmin(requester_email))) return json(403, { error: 'Unauthorized' });
      const target = (user_id || email || '').toLowerCase();
      const u = await getUser(target);
      if (u) await putUser(target, { ...u, status: 'active' });
      return json(200, { ok: true });
    }

    // ── ADMIN: remove a user entirely ────────────────────────────────────────
    if (action === 'delete-user') {
      const { requester_email, user_id, email } = body;
      if (!(await requireAdmin(requester_email))) return json(403, { error: 'Unauthorized' });
      const target = (user_id || email || '').toLowerCase();
      try { await store().delete(target); } catch {}
      return json(200, { ok: true });
    }

    // ── Legacy actions kept as graceful no-ops (roster self-claim replaces them) ──
    if (action === 'list-pending') return json(200, { ok: true, pending: [] });
    if (action === 'approve')      return json(200, { ok: true });
    if (action === 'signup')       return json(200, { ok: true, message: 'Just tap your name on the sign-in screen and create your PIN.' });

    return json(400, { error: `Unknown action: ${action}` });
  } catch (err) {
    console.error('auth error:', err);
    return json(500, { error: err.message });
  }
};
