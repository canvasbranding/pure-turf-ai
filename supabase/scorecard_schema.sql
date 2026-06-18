-- Pure Turf AI — Scorecard goals + tracking schema.
-- Run this once in the Supabase SQL editor (Project → SQL → New query → paste → Run).
-- The Netlify functions use the SERVICE key, which bypasses RLS, so no policies are
-- required for the app. (Add RLS policies later if you ever expose the anon key.)

-- ── Phase 1: per-rep sales goals ────────────────────────────────────────────
create table if not exists scorecard_goals (
  id            uuid primary key default gen_random_uuid(),
  rep_email     text not null,                 -- the rep this goal belongs to
  rep_name      text,
  metric_key    text not null,                 -- maps to a scorecard metric (see SC_METRICS)
  title         text,
  description   text,
  target_value  numeric not null,
  unit          text default 'count',          -- dollars | count | percentage | minutes
  period_type   text default 'monthly',        -- daily | weekly | monthly | quarterly | seasonal | custom
  start_date    date not null,
  end_date      date not null,
  status        text default 'active',         -- active | completed | missed | paused | archived
  visibility    text default 'team',           -- private | team | leadership
  assigned_by   text,                          -- email of whoever set it
  notes         text,
  source        text default 'manual',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists scorecard_goals_rep_idx    on scorecard_goals (rep_email);
create index if not exists scorecard_goals_status_idx on scorecard_goals (status);

-- ── Phase 2: progress history (point-in-time snapshots for trend lines) ──────
create table if not exists scorecard_goal_snapshots (
  id               uuid primary key default gen_random_uuid(),
  goal_id          uuid references scorecard_goals(id) on delete cascade,
  snapshot_date    date not null,
  current_value    numeric,
  percent_complete numeric,
  expected_value   numeric,
  pacing_gap       numeric,
  projected_finish numeric,
  pacing_status    text,
  created_at       timestamptz default now(),
  unique (goal_id, snapshot_date)
);

-- ── Phase 3: AI coaching insights ───────────────────────────────────────────
create table if not exists scorecard_coaching_insights (
  id                  uuid primary key default gen_random_uuid(),
  rep_email           text,
  goal_id             uuid references scorecard_goals(id) on delete set null,
  scorecard_period    text,
  insight_type        text,        -- daily_plan | weekly_review | monthly_recap | manager_1on1 | goal_rec
  title               text,
  summary             text,
  recommended_actions jsonb,
  source_data         jsonb,
  visibility          text default 'rep',
  created_at          timestamptz default now()
);

-- ── Phase 2: configurable metric → HubSpot property mapping ──────────────────
create table if not exists scorecard_metric_mappings (
  id                 uuid primary key default gen_random_uuid(),
  metric_key         text unique not null,
  source_system      text default 'hubspot',
  source_object      text,        -- deals | calls | emails | contacts | line_items
  source_property    text,
  calculation_method text,        -- sum | count | rate | speed | gap
  is_active          boolean default true,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);
