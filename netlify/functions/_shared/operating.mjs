// Pure Turf AI — Operating Item model (shared spine).
// The unified "what matters / why / what to do / who owns it / impact" object that the
// Today feed, morning briefing, decision center, and meeting mode all read. This is the
// GENERALIZATION of the Revenue Rescue item — rescue items are one provider of operating
// items (category: sales). Items are COMPUTED ON READ from live data (never materialized
// as stale rows); only user action-state + decisions are persisted (in Blobs).
//
// `_shared` is ignored by Netlify's bundler, so this is never an endpoint itself.

export const ITEM_TYPES = ['insight', 'priority', 'risk', 'opportunity', 'decision_needed', 'action', 'alert', 'coaching_note', 'meeting_prep'];
export const CATEGORIES = ['sales', 'marketing', 'finance', 'customer_service', 'operations', 'leadership', 'goals', 'pipeline', 'reputation', 'search_visibility'];
export const PRIORITY_LEVELS = ['critical', 'high', 'medium', 'low'];
export const ROLE_SCOPES = ['rep', 'manager', 'leadership', 'all'];

// Score → priority level. Same bands the Revenue Rescue cards use, lifted up a layer.
export function priorityBand(score) {
  if (score >= 70) return 'critical';
  if (score >= 45) return 'high';
  if (score >= 22) return 'medium';
  return 'low';
}

const PRIORITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 };
export function sortItems(items) {
  return [...items].sort((a, b) =>
    (PRIORITY_RANK[a.priorityLevel] - PRIORITY_RANK[b.priorityLevel]) ||
    (b.priorityScore - a.priorityScore) ||
    ((b.estimatedImpact || 0) - (a.estimatedImpact || 0)));
}

// Grounded confidence — NEVER a vibe. Built from real signals: data coverage, freshness,
// and sample size. Returns { level, reasons } so the UI can show an honest "why".
export function confidence({ coveragePct = null, ageMinutes = null, sample = null, note = null } = {}) {
  const reasons = [];
  let score = 3; // start High
  if (coveragePct != null) {
    reasons.push(`${coveragePct}% data coverage`);
    if (coveragePct < 60) score -= 1;
    if (coveragePct < 35) score -= 1;
  }
  if (ageMinutes != null) {
    reasons.push(ageMinutes < 60 ? `synced ${ageMinutes}m ago` : `synced ${Math.round(ageMinutes / 60)}h ago`);
    if (ageMinutes > 180) score -= 1;
  }
  if (sample != null) {
    reasons.push(`${sample} record${sample === 1 ? '' : 's'}`);
    if (sample < 10) score -= 1;
  }
  if (note) reasons.push(note);
  const level = score >= 3 ? 'High' : score === 2 ? 'Medium' : 'Low';
  return { level, reasons };
}

// Build a normalized operating item, filling safe defaults. Providers pass what they know.
export function makeItem(p) {
  const score = p.priorityScore ?? 0;
  return {
    id: p.id,
    type: p.type || 'priority',
    category: p.category || 'sales',
    title: p.title || '',
    summary: p.summary || '',
    priorityLevel: p.priorityLevel || priorityBand(score),
    priorityScore: Math.round(score),
    ownerName: p.ownerName ?? null,
    ownerEmail: p.ownerEmail ?? null,
    roleScope: p.roleScope || 'all',
    estimatedImpact: p.estimatedImpact ?? null,        // dollars, when known
    impactLabel: p.impactLabel || impactLabelFor(p.estimatedImpact, score),
    confidence: p.confidence || { level: 'Medium', reasons: [] },
    recommendedAction: p.recommendedAction || null,
    whyItMatters: p.whyItMatters || null,
    riskIfIgnored: p.riskIfIgnored || null,
    sourceTrail: p.sourceTrail || null,                // { system, dateRange, lastSync, basis, records, filters, dataState }
    links: p.links || {},                              // { hubspotUrl, ... }
    related: p.related || {},                          // { dealId, repEmail, metric, campaign }
    createdByType: p.createdByType || 'system',        // system | ai | user
    dueAt: p.dueAt || null,
  };
}

function impactLabelFor(value, score) {
  if (value != null) {
    if (value >= 5000) return 'High';
    if (value >= 1000) return 'Medium';
    return 'Low';
  }
  return score >= 45 ? 'High' : score >= 22 ? 'Medium' : 'Low';
}

// Apply persisted user state to a computed item. State lives in Blobs keyed by item.id.
// active = visible in the live feed (not dismissed, not snoozed-into-the-future, not done).
export function applyState(item, state) {
  const st = state || null;
  const now = Date.now();
  const snoozed = st?.snoozed_until && new Date(st.snoozed_until).getTime() > now;
  const status = st?.status || 'open';
  const active = !(status === 'dismissed' || status === 'done' || snoozed);
  return { ...item, status, state: st, active };
}
