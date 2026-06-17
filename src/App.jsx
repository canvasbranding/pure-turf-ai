import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// ── SVG COMPONENTS ─────────────────────────────────────────────────────────
const PTMark = ({ size = 22, color = 'currentColor', style = {} }) => (
  <svg width={size} height={size} viewBox="2 1.5 25 23" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color, ...style }}>
    <path d="M17.4423 7.88908C16.3133 8.49745 15.6447 9.72989 15.1844 10.9323C14.8916 10.9378 13.8812 10.7232 13.5475 10.7091C11.571 10.6228 10.3298 11.5106 10.3691 12.8053C10.3738 12.9626 10.3676 13.1498 10.4953 13.2408C10.6477 13.3495 10.9208 13.3657 11.0266 13.153C11.1077 12.99 10.8593 12.7574 10.8752 12.5758C10.9992 11.1212 13.0994 10.717 15.0132 11.3505C14.88 11.5762 12.5334 17.423 11.215 18.7157C11.0171 18.9099 10.7554 19.0226 10.5107 19.165C10.4576 19.196 10.4331 19.2537 10.4545 19.3115C10.4829 19.3879 10.5762 19.4269 10.6455 19.3845C10.742 19.3256 10.8159 19.2817 10.9275 19.2198C12.8236 18.1717 15.3006 11.5762 15.4698 11.4572C17.8066 11.9589 19.0392 10.8654 19.3686 10.4545C20.8405 8.61882 19.2353 6.9229 17.4423 7.88908ZM15.611 11.0807C15.9108 10.0974 16.2303 9.16833 17.1312 8.46561C18.5042 7.39476 19.6592 8.07181 19.7246 8.92455C19.8263 10.2504 18.0181 11.8793 15.611 11.0801V11.0807Z" fill="currentColor" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M14.5426 23.2337C20.1368 23.2337 24.6718 18.6714 24.6718 13.0435C24.6718 7.41559 20.1368 2.85327 14.5426 2.85327C8.94835 2.85327 4.41333 7.41559 4.41333 13.0435C4.41333 18.6714 8.94835 23.2337 14.5426 23.2337Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);
const PTLockup = ({ width = 160, color = 'currentColor' }) => (
  <svg width={width} height={Math.round(width * 25 / 204)} viewBox="0 0 204 25" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color }}>
    <path d="M53.1113 7.21924V14.9507C53.1114 15.6081 53.2375 16.2065 53.6162 16.605L53.624 16.6138L53.6318 16.6206C54.0289 17.0025 54.6263 17.1304 55.2812 17.1304H58.6875C59.3472 17.1303 59.9548 17.0052 60.3447 16.6128L60.3438 16.6118C60.7329 16.2202 60.8574 15.6124 60.8574 14.9507V7.21924H61.9941V15.354C61.9941 16.3633 61.758 16.9979 61.3887 17.3696C61.0198 17.7407 60.3905 17.978 59.3887 17.978H54.5801C53.5783 17.978 52.949 17.7407 52.5801 17.3696C52.2106 16.9979 51.9737 16.3635 51.9736 15.354V7.21924H53.1113ZM90.9678 7.21924V8.01709H83.5537V12.0405H90.2998V12.7036H83.5537V17.1812H91.1348V17.978H82.417V7.21924H90.9678ZM74.7744 7.21924C75.6968 7.21924 76.2433 7.42757 76.541 7.72705L76.5449 7.73096C76.8371 8.01738 77.0468 8.56317 77.0469 9.50732V11.1538C77.0469 12.0846 76.8434 12.6367 76.5537 12.937C76.2653 13.2249 75.7304 13.4323 74.8193 13.4429L73.8643 13.4536L74.417 14.2319L77.0781 17.978H75.9209L73.0146 13.7915L72.8652 13.5767H68.4971V17.978H67.3604V7.21924H74.7744ZM44.8896 7.21924C45.8118 7.21927 46.3576 7.42759 46.6553 7.72705L46.6602 7.73096C46.9524 8.01738 47.1611 8.56317 47.1611 9.50732V11.6577C47.1611 12.598 46.9535 13.1527 46.6572 13.4526C46.3593 13.743 45.8124 13.9467 44.8896 13.9468H38.6123V17.978H37.4746V7.21924H44.8896ZM38.6123 13.3003H44.1045C44.6696 13.3003 45.2176 13.2095 45.5674 12.8774C45.927 12.5155 46.0244 11.9614 46.0244 11.3892V9.84326C46.0244 9.28126 45.9304 8.72637 45.5771 8.38232C45.2159 8.02924 44.6687 7.93311 44.1045 7.93311H38.6123V13.3003ZM68.4971 12.9644H73.9902C74.5554 12.9643 75.1034 12.8737 75.4531 12.5415C75.812 12.1796 75.9092 11.6256 75.9092 11.0532V9.77686C75.9092 9.20955 75.8135 8.64855 75.4521 8.30518C75.1017 7.96182 74.5544 7.86576 73.9902 7.86572H68.4971V12.9644Z" fill="currentColor" stroke="currentColor"/>
    <path d="M113.735 7.21924V14.9507C113.735 15.608 113.861 16.2065 114.24 16.605L114.248 16.6138L114.256 16.6206C114.653 17.0025 115.25 17.1304 115.905 17.1304H119.311C119.971 17.1304 120.578 17.0053 120.968 16.6128C121.357 16.2213 121.481 15.6129 121.481 14.9507V7.21924H122.619V15.354C122.619 16.3635 122.382 16.9979 122.012 17.3696C121.643 17.7407 121.014 17.978 120.012 17.978H115.204C114.202 17.978 113.572 17.7407 113.204 17.3696C112.834 16.9979 112.598 16.3633 112.598 15.354V7.21924H113.735ZM151.425 7.21924V8.10107H144.178V12.4438H150.757V13.2241H144.178V17.978H143.041V7.21924H151.425ZM135.399 7.21924C136.321 7.21926 136.867 7.4276 137.165 7.72705L137.169 7.73096C137.462 8.01738 137.67 8.56317 137.67 9.50732V11.1538C137.67 12.0817 137.469 12.6341 137.181 12.9351C136.893 13.2244 136.357 13.4323 135.443 13.4429L134.488 13.4536L135.042 14.2319L137.703 17.978H136.545L133.639 13.7915L133.49 13.5767H129.122V17.978H127.984V7.21924H135.399ZM108.062 7.21924V8.13428H103.753V17.978H102.616V8.13428H98.3081V7.21924H108.062ZM129.122 12.9644H134.614C135.179 12.9644 135.727 12.8735 136.077 12.5415C136.436 12.1796 136.534 11.6254 136.534 11.0532V9.77686C136.534 9.21462 136.44 8.65908 136.086 8.31494H136.076C135.725 7.96196 135.178 7.86572 134.614 7.86572H129.122V12.9644Z" fill="currentColor" stroke="currentColor"/>
    <path d="M17.4423 7.88908C16.3133 8.49745 15.6447 9.72989 15.1844 10.9323C14.8916 10.9378 13.8812 10.7232 13.5475 10.7091C11.571 10.6228 10.3298 11.5106 10.3691 12.8053C10.3738 12.9626 10.3676 13.1498 10.4953 13.2408C10.6477 13.3495 10.9208 13.3657 11.0266 13.153C11.1077 12.99 10.8593 12.7574 10.8752 12.5758C10.9992 11.1212 13.0994 10.717 15.0132 11.3505C14.88 11.5762 12.5334 17.423 11.215 18.7157C11.0171 18.9099 10.7554 19.0226 10.5107 19.165C10.4576 19.196 10.4331 19.2537 10.4545 19.3115C10.4829 19.3879 10.5762 19.4269 10.6455 19.3845C10.742 19.3256 10.8159 19.2817 10.9275 19.2198C12.8236 18.1717 15.3006 11.5762 15.4698 11.4572C17.8066 11.9589 19.0392 10.8654 19.3686 10.4545C20.8405 8.61882 19.2353 6.9229 17.4423 7.88908ZM15.611 11.0807C15.9108 10.0974 16.2303 9.16833 17.1312 8.46561C18.5042 7.39476 19.6592 8.07181 19.7246 8.92455C19.8263 10.2504 18.0181 11.8793 15.611 11.0801V11.0807Z" fill="currentColor" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M14.5426 23.2337C20.1368 23.2337 24.6718 18.6714 24.6718 13.0435C24.6718 7.41559 20.1368 2.85327 14.5426 2.85327C8.94835 2.85327 4.41333 7.41559 4.41333 13.0435C4.41333 18.6714 8.94835 23.2337 14.5426 23.2337Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="169.4" y="4.3" width="29.4" height="16.4" rx="4.7" fill="white" stroke="white" strokeWidth="0.6"/>
    <path d="M178.212 16H177.224L180.156 8.29785H181.29L184.217 16H183.196L182.38 13.9214H179.023L178.212 16ZM180.699 9.34521L179.313 13.0513H182.095L180.699 9.34521ZM187.177 16V8.29785H188.133V16H187.177Z" fill="#1A1A1A"/>
  </svg>
);

const SunIcon  = () => <svg viewBox="0 0 16 16" width="13" height="13" stroke="currentColor" strokeWidth="1.5" fill="none"><circle cx="8" cy="8" r="2.5"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M11.5 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1"/></svg>;
const MoonIcon = () => <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" stroke="none"><path d="M13.5 10.5A6 6 0 017 2a.5.5 0 00-.5.7A5 5 0 1013.3 11a.5.5 0 00.2-.5z"/></svg>;
const CollapseIcon = ({ collapsed }) => (
  <svg viewBox="0 0 16 16" width="14" height="14" stroke="currentColor" strokeWidth="1.5" fill="none">
    {collapsed ? <path d="M6 3l5 5-5 5"/> : <path d="M10 3L5 8l5 5"/>}
  </svg>
);

const Icon = ({ name, size = 16 }) => {
  const p = {
    home:     <path d="M2.5 8.5L10 2l7.5 6.5V18a.5.5 0 01-.5.5H13V13h-6v5.5H3a.5.5 0 01-.5-.5V8.5z" strokeLinejoin="round"/>,
    chart:    <path d="M2 14.5l4.5-5.5 3.5 4 4-5.5 4 3.5" strokeLinecap="round" strokeLinejoin="round"/>,
    briefing: <path d="M4 5.5h12M4 9.5h8M4 13.5h12M4 17.5h6" strokeLinecap="round"/>,
    pipeline: <><path d="M3 3h14l-3.5 6v5l-1.5 1.5h-4L6.5 14V9L3 3z" strokeLinejoin="round"/><path d="M6.5 9h7" /></>,
    gbp:      <><circle cx="10" cy="7.5" r="3.5"/><path d="M3.5 19c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" strokeLinecap="round"/></>,
    meta:     <><circle cx="10" cy="10" r="7.5"/><path d="M6.5 8h4l1.5 5h3" strokeLinecap="round" strokeLinejoin="round"/></>,
    finance:  <><path d="M10 2.5v15" strokeLinecap="round"/><path d="M13.5 5.5C13.5 4.2 11.9 3.5 10 3.5S6.5 4.2 6.5 6s1.6 2.3 3.5 2.8 3.5 1 3.5 2.7-1.6 2.5-3.5 2.5-3.5-.8-3.5-2.2" strokeLinecap="round" strokeLinejoin="round"/></>,
    admin:    <><rect x="2.5" y="2.5" width="6" height="6" rx="1.5"/><rect x="11.5" y="2.5" width="6" height="6" rx="1.5"/><rect x="2.5" y="11.5" width="6" height="6" rx="1.5"/><rect x="11.5" y="11.5" width="6" height="6" rx="1.5"/></>,
    send:     <path d="M17.5 10L3 10M17.5 10L11 3.5M17.5 10L11 16.5" strokeLinecap="round" strokeLinejoin="round"/>,
    arrowR:   <path d="M3.5 10h13M12 4.5L17.5 10 12 15.5" strokeLinecap="round" strokeLinejoin="round"/>,
    goals:    <><path d="M6.5 2.5h7v5a3.5 3.5 0 01-7 0v-5z" strokeLinejoin="round"/><path d="M6.5 4.5H4.5a1.5 1.5 0 000 3h2" strokeLinecap="round"/><path d="M13.5 4.5h2a1.5 1.5 0 010 3h-2" strokeLinecap="round"/><path d="M10 10.5v2M7.5 14.5h5" strokeLinecap="round"/><path d="M7 16.5h6" strokeLinecap="round"/></>,
    edit:     <><path d="M14.5 3.5l2 2L6 16H4v-2L14.5 3.5z" strokeLinejoin="round"/></>,
    check2:   <path d="M3.5 10l4.5 4.5 8.5-9" strokeLinecap="round" strokeLinejoin="round"/>,
    signout:  <path d="M12.5 6V4a1.5 1.5 0 00-1.5-1.5H5A1.5 1.5 0 003.5 4v12A1.5 1.5 0 005 17.5h6a1.5 1.5 0 001.5-1.5v-2M8 10h9.5M14 6.5L17.5 10 14 13.5" strokeLinecap="round" strokeLinejoin="round"/>,
  };
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.4">
      {p[name] || p.home}
    </svg>
  );
};

// ── USER REGISTRY ─────────────────────────────────────────────────────────
const USERS = [
  { email: 'dhamby@pureturfllc.com',  name: 'David Hamby',      role: 'admin',     initials: 'DH', title: 'Director of Marketing',  pin: '9853' },
  { email: 'david@pureturfllc.com',   name: 'David Patton',     role: 'owner',     initials: 'DP', title: 'Owner',                  pin: '1234' },
  { email: 'sbuchanan@pureturfllc.com', name: 'Sean Buchanan',  role: 'executive', initials: 'SB', title: 'Director of Operations', pin: '1234' },
  { email: 'kdryden@pureturfllc.com', name: 'Kurt Dryden',      role: 'executive', initials: 'KD', title: 'VP of Finance',          pin: '1234' },
  { email: 'rbone@pureturfllc.com',   name: 'Ronnie Bone',      role: 'executive', initials: 'RB', title: 'COO',                    pin: '1234' },
  { email: 'dturner@pureturfllc.com', name: 'Dave Turner',      role: 'executive', initials: 'DT', title: 'Executive',              pin: '1234' },
  { email: 'kaley@pureturfllc.com',   name: 'Kaley Brownlee',   role: 'sales',     initials: 'KB', title: 'Sales',                  pin: '1234' },
  { email: 'chris@pureturfllc.com',   name: 'Chris Kleeman',    role: 'sales',     initials: 'CK', title: 'Sales',                  pin: '1234' },
  { email: 'daniel@pureturfllc.com',  name: 'Daniel Anderson',  role: 'sales',     initials: 'DA', title: 'Sales',                  pin: '1234' },
  { email: 'wyatt@pureturfllc.com',    name: 'Wyatt Raines',    role: 'sales',     initials: 'WR', title: 'Sales',                  pin: '1234' },
  { email: 'lauren@canvasbranding.com', name: 'Lauren Hamby',   role: 'marketing', initials: 'LH', title: 'Marketing',              pin: '1234' },
];

const GOAL_ADMIN_EMAILS = ['david@pureturfllc.com', 'kdryden@pureturfllc.com', 'rbone@pureturfllc.com', 'dhamby@pureturfllc.com'];
const TEAM_GOALS_EMAILS = ['david@pureturfllc.com', 'kdryden@pureturfllc.com', 'rbone@pureturfllc.com', 'dhamby@pureturfllc.com'];

const DEFAULT_PERMISSIONS = {
  admin:        { googleAds: true,  metaAds: true,  gbp: true,  pipeline: true,  finance: true,  mondayBrief: true,  adminPanel: true,  goalAdmin: true,  teamGoals: true,  manageUsers: true  },
  owner:        { googleAds: true,  metaAds: false, gbp: true,  pipeline: true,  finance: true,  mondayBrief: true,  adminPanel: true,  goalAdmin: true,  teamGoals: true,  manageUsers: false },
  marketing:    { googleAds: true,  metaAds: true,  gbp: true,  pipeline: true,  finance: false, mondayBrief: true,  adminPanel: true,  goalAdmin: true,  teamGoals: true,  manageUsers: false },
  executive:    { googleAds: true,  metaAds: false, gbp: true,  pipeline: true,  finance: true,  mondayBrief: true,  adminPanel: false, goalAdmin: true,  teamGoals: true,  manageUsers: false },
  sales_manager:{ googleAds: false, metaAds: false, gbp: false, pipeline: true,  finance: false, mondayBrief: false, adminPanel: true,  goalAdmin: false, teamGoals: true,  manageUsers: false },
  sales:        { googleAds: false, metaAds: false, gbp: false, pipeline: true,  finance: false, mondayBrief: false, adminPanel: false, goalAdmin: false, teamGoals: false, manageUsers: false },
};
const MODULE_LABELS = { googleAds:'Google Ads', metaAds:'Meta Ads', gbp:'GBP', pipeline:'Pipeline', finance:'Finance', mondayBrief:'Mon. Brief', adminPanel:'Admin Panel', goalAdmin:'Goal Admin', teamGoals:'Team Goals', manageUsers:'Manage Users' };
const ROLE_LABELS = { admin:'Admin', owner:'Owner', marketing:'Marketing', executive:'Executive', sales_manager:'Sales Mgr', sales:'Sales' };

// Friendly names for data sources — used by the data-health banner and tile error states
// so users never see raw messages like "Windsor google_ads 500".
const SOURCE_LABELS = { google:'Google Ads', meta:'Meta Ads', gbp:'Google Business Profile', hubspot:'HubSpot pipeline', rgServices:'Customer data' };

// "Updated 3 min ago" from an ISO timestamp.
function relTime(iso) {
  if (!iso) return null;
  const secs = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

// Data-health strip: shows which sources failed to refresh, plus when the data was last updated.
// Silent failures are the worst outcome for a decision dashboard, so we make them visible.
function DataHealthBanner({ liveStats, statsLoading }) {
  if (!liveStats || statsLoading) return null;
  const failed = Object.keys(liveStats.errors || {});
  const warnings = liveStats.warnings || [];
  const updated = relTime(liveStats.fetchedAt);
  // Sanity-guard warnings (e.g. a sudden deal-count collapse) take priority — that's
  // exactly the silent-corruption signal we want surfaced loudest.
  if (warnings.length > 0) {
    return (
      <div className="data-health data-health-warn" role="status">
        <span className="dh-dot" aria-hidden="true">⚠</span>
        <span>{warnings.join(' ')} Double-check before relying on these figures.</span>
      </div>
    );
  }
  if (failed.length === 0) {
    return updated ? <div className="data-health data-health-ok">Live data · updated {updated}</div> : null;
  }
  const names = failed.map(k => SOURCE_LABELS[k] || k).join(', ');
  return (
    <div className="data-health data-health-warn" role="status">
      <span className="dh-dot" aria-hidden="true">⚠</span>
      <span>Couldn’t refresh <strong>{names}</strong> — showing the last good numbers where available{updated ? `, updated ${updated}` : ''}.</span>
    </div>
  );
}
const ROLE_COLORS = { admin:'#5E6AD2', owner:'#8B5CF6', marketing:'#0EA5E9', executive:'#10B981', sales_manager:'#F59E0B', sales:'var(--text-3)' };
const ROLE_OPTIONS = ['admin','owner','marketing','executive','sales_manager','sales'];


// ── GOALS ─────────────────────────────────────────────────
const GOAL_DEFS = [
  {
    id: 'revenue',    label: 'Annual Revenue',    unit: '$',  suffix: '',   format: 'currency',
    defaultTarget: 10000000,
    desc: 'Closed won deal value year to date',
    roles: ['admin','marketing','executive'],
    getActual: (stats) => stats?.hubspot?.revenue ?? null,
    aiPrompt: 'How is Pure Turf tracking toward annual revenue goals? Break down closed won deals and pipeline.',
  },
  {
    id: 'leads',      label: 'New Leads',         unit: '',   suffix: '/mo', format: 'number',
    defaultTarget: 500,
    desc: 'New deals created this period',
    roles: ['admin','marketing','executive','sales'],
    getActual: (stats) => stats?.hubspot?.newLeads ?? null,
    aiPrompt: 'How many new leads came in this period and how does that compare to our target?',
  },
  {
    id: 'closeRate',  label: 'Close Rate',        unit: '',   suffix: '%',  format: 'percent',
    defaultTarget: 70,
    desc: 'Won ÷ (won + lost) for deals closed this period',
    roles: ['admin','marketing','executive','sales'],
    getActual: (stats) => stats?.hubspot?.closeRate ?? null,
    aiPrompt: 'What is our close rate this period? Which reps are performing best and worst?',
  },
  {
    id: 'googleCPA',  label: 'Google CPA Target', unit: '$',  suffix: '',   format: 'currency-inv',
    defaultTarget: 75,
    desc: 'Target cost per conversion (lower is better)',
    roles: ['admin','marketing'],
    getActual: (stats) => stats?.google?.cpa ?? null,
    aiPrompt: 'What is our Google Ads CPA this period and what campaigns are dragging it up?',
  },
  {
    id: 'adSpend',    label: 'Ad Spend Budget',   unit: '$',  suffix: '/mo', format: 'currency',
    defaultTarget: 80000,  // March default — monthly schedule overrides this
    desc: 'Combined Google + Meta monthly spend',
    roles: ['admin','marketing'],
    getActual: (stats) => stats?.adSpend?.total ?? null,
    aiPrompt: 'How much have we spent on Google and Meta ads this period vs our budget?',
  },
];

function loadGoalTargets() {
  try { return JSON.parse(localStorage.getItem('pt_goal_targets') || '{}'); }
  catch { return {}; }
}
function saveGoalTargets(t) {
  try { localStorage.setItem('pt_goal_targets', JSON.stringify(t)); } catch {}
}
function getGoalTarget(id, overrides, monthlyBudgetOverrides) {
  // Ad spend uses monthly schedule
  if (id === 'adSpend') return getCurrentMonthBudget(monthlyBudgetOverrides || {});
  if (overrides[id] !== undefined) return overrides[id];
  return GOAL_DEFS.find(g => g.id === id)?.defaultTarget ?? 0;
}
// Monthly ad budget schedule (varies by month)
const DEFAULT_MONTHLY_BUDGET = {
  '2026-01': 90000, '2026-02': 85000, '2026-03': 80000, '2026-04': 130000,
  '2026-05': 70000, '2026-06': 65000, '2026-07': 60000, '2026-08': 60000,
  '2026-09': 65000, '2026-10': 70000, '2026-11': 75000, '2026-12': 80000,
};
function loadMonthlyBudget() { try { return JSON.parse(localStorage.getItem('pt_monthly_budget')||'{}'); } catch { return {}; } }
function saveMonthlyBudget(b) { try { localStorage.setItem('pt_monthly_budget', JSON.stringify(b)); } catch {} }
function getCurrentMonthBudget(overrides) {
  const key = new Date().toISOString().slice(0,7); // 'YYYY-MM'
  return overrides[key] ?? DEFAULT_MONTHLY_BUDGET[key] ?? 75000;
}

// Rep goals
function loadRepGoals() { try { return JSON.parse(localStorage.getItem('pt_rep_goals')||'{}'); } catch { return {}; } }
function saveRepGoals(g) { try { localStorage.setItem('pt_rep_goals', JSON.stringify(g)); } catch {} }

function goalStatus(actual, target, format) {
  if (actual === null || actual === undefined) return 'loading';
  const isInverse = format === 'currency-inv'; // lower = better
  const ratio = isInverse ? target / actual : actual / target;
  if (ratio >= 0.95) return 'on-track';
  if (ratio >= 0.75) return 'at-risk';
  return 'behind';
}
function fmtGoalVal(val, format, unit) {
  if (val === null || val === undefined) return '–';
  if (format === 'percent') return `${val}%`;
  if (format === 'currency' || format === 'currency-inv') {
    if (val >= 1000000) return `$${(val/1000000).toFixed(1)}M`;
    if (val >= 1000)    return `$${Math.round(val/1000)}k`;
    return `$${val.toLocaleString()}`;
  }
  return val.toLocaleString();
}
function loadPerms() { try { return JSON.parse(localStorage.getItem('pt_permissions')||'{}'); } catch { return {}; } }
function savePerms(p) { try { localStorage.setItem('pt_permissions', JSON.stringify(p)); } catch {} }
function savePermsRemote(p, email) {
  fetch('/.netlify/functions/settings', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'set', key: 'permissions', value: p, email }),
  }).catch(() => {}); // fire-and-forget
}
function getSavedEmail() { try { return localStorage.getItem('pt_last_user') || ''; } catch { return ''; } }
function saveLastUser(email) { try { localStorage.setItem('pt_last_user', email); } catch {} }
function getPerms(email, role, overrides) {
  const base = { ...(DEFAULT_PERMISSIONS[role]||DEFAULT_PERMISSIONS.sales) };
  // Specific users get elevated goal permissions regardless of role
  if (GOAL_ADMIN_EMAILS.includes(email))  base.goalAdmin  = true;
  if (TEAM_GOALS_EMAILS.includes(email))  base.teamGoals  = true;
  return { ...base, ...(overrides[email]||{}) };
}

const ALL_TILES = [
  { key:'google',    lbl:'Google Ads',   val:4821, prefix:'$', sub:'↑ 108 conv · $89 CPA',  dir:'up', perm:'googleAds', group:'Marketing' },
  // Meta Ads — disabled while the Windsor slot is reallocated to QuickBooks. Restore by
  // re-adding this tile + the facebook_ads fetch in stats.mjs once Meta is reconnected.
  // { key:'meta', lbl:'Meta Ads', val:1205, prefix:'$', sub:'↓ $484 CPA', dir:'dn', perm:'metaAds', group:'Marketing' },
  { key:'gbp',       lbl:'GBP Views',    val:2841, prefix:'',  sub:'↑ 47 calls this week',  dir:'up', perm:'gbp',       group:'Marketing' },
  { key:'pipeline',  lbl:'Pipeline',     val:1617, prefix:'',  sub:'deals · 2026',           dir:'',   perm:'pipeline',  group:'Sales' },
  // Business-outcome tiles — the funnel from leads → closes → customers → revenue.
  { key:'leads',      lbl:'New Leads',      val:0, prefix:'',  sub:'new this period',   dir:'up', perm:'pipeline', group:'Sales' },
  { key:'closeRate',  lbl:'Close Rate',     val:0, prefix:'',  suffix:'%', sub:'won vs lost', dir:'', perm:'pipeline', group:'Sales' },
  { key:'revenue',    lbl:'Revenue',        val:0, prefix:'$', sub:'closed won',        dir:'up', perm:'pipeline', group:'Sales' },
  { key:'newCustomers',lbl:'New Customers', val:0, prefix:'',  sub:'added this period', dir:'up', perm:'pipeline', group:'Customers' },
  { key:'activeCustomers',lbl:'Active Customers', val:0, prefix:'', sub:'total book',   dir:'',   perm:'pipeline', group:'Customers' },
  { key:'cancellations',lbl:'Cancellations',val:0, prefix:'', sub:'this period',        dir:'dn', perm:'pipeline', group:'Customers' },
  { key:'adSpend',    lbl:'Total Ad Spend', val:0, prefix:'$', sub:'paid search',       dir:'',   perm:'googleAds', group:'Marketing' },
  // Finance (QuickBooks P&L · YTD) — restricted to admin/owner/executive.
  { key:'qbRevenue',  lbl:'Revenue · YTD',   val:0, prefix:'$', sub:'QuickBooks income',  dir:'up', perm:'finance', group:'Finance' },
  { key:'qbGrossProfit',lbl:'Gross Profit · YTD', val:0, prefix:'$', sub:'revenue − COGS', dir:'',  perm:'finance', group:'Finance' },
  { key:'qbNetIncome',lbl:'Net Income · YTD',val:0, prefix:'$', sub:'bottom line',        dir:'',   perm:'finance', group:'Finance' },
  { key:'qbMargin',   lbl:'Net Margin · YTD',val:0, prefix:'',  suffix:'%', sub:'net ÷ revenue', dir:'', perm:'finance', group:'Finance' },
];
const ALL_ACTIONS = [
  { icon:'briefing', label:'Monday Briefing', sub:'Weekly performance overview',   perm:'mondayBrief', prompt:'Give me my Monday morning marketing briefing — Google Ads and GBP performance overview.' },
  { icon:'chart',    label:'Google Ads',      sub:'Campaign spend & CPA breakdown', perm:'googleAds',   prompt:'Break down Google Ads campaign performance this month — spend, conversions, and CPA by campaign.' },
  { icon:'gbp',      label:'GBP Insights',    sub:'Local search performance',       perm:'gbp',         prompt:'What does Google Business Profile look like this week — views, calls, directions, clicks?' },
  { icon:'pipeline', label:'Pipeline',        sub:'Deals by stage and rep',         perm:'pipeline',    prompt:'Give me a full pipeline breakdown — deals by stage, by rep, and what needs attention.' },
];
const SALES_ACTIONS = [
  { icon:'pipeline', label:'My Pipeline',   sub:'Deals assigned to me',  perm:'pipeline', prompt:'What deals are in the pipeline and what needs follow-up today?' },
  { icon:'pipeline', label:"Today's Leads", sub:'New inbound activity',  perm:'pipeline', prompt:'Are there any new leads or contacts created today I should know about?' },
];

// ══════════════════════════════════════════════════════════════════════════
const DATE_RANGES = {
  mtd:  { label: 'Month to date', desc: 'this month (MTD)' },
  '7d': { label: 'Last 7 days',   desc: 'the last 7 days' },
  '30d':{ label: 'Last 30 days',  desc: 'the last 30 days' },
  '90d':{ label: 'Last 90 days',  desc: 'the last 90 days' },
  ytd:  { label: 'Year to date',  desc: 'this year (YTD)' },
};

// ══ KPIs SECTION ══════════════════════════════════════════════════════════
function KpiCard({ label, value, sub, status, onClick, loading }) {
  return (
    <div className={`kpi-card${status ? ' kpi-'+status : ''}${onClick ? ' kpi-clickable' : ''}`} onClick={onClick}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{loading ? <span className="dv-skel"/> : value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function KPIsSection({ liveStats, statsLoading, rangeLabel, sendMessage }) {
  const h  = liveStats?.hubspot;
  const rg = liveStats?.rgServices;
  const g  = liveStats?.google;

  const totalLeads    = (h?.newLeads > 0 ? h.newLeads : h?.activeLeads) ?? null;
  const leadsLabel    = h?.newLeads > 0 ? 'new this period' : 'active in pipeline';
  const wonCount      = h?.wonCount   ?? null;
  const lostCount     = h?.lostCount  ?? null;
  const openCount     = h?.openCount  ?? null;
  const closeRate     = h?.closeRate  ?? null;
  const totalActive   = rg?.totalActive   ?? null;
  const newCustomers  = rg?.newCustomers  ?? null;
  const newCancels    = rg?.newCancels    ?? null;
  const cancelPending = rg?.cancelPending ?? null;
  const byType        = rg?.byType        ?? null;
  const cancelReasons = rg?.cancelReasons ?? [];
  const cpa           = g?.cpa   ?? null;
  const spend         = g?.spend ?? null;
  const costPerCust   = wonCount && spend ? Math.round(spend / wonCount) : null;

  const fmtN = v => (v === null || v === undefined) ? '–' : v.toLocaleString();
  const fmtD = v => (v === null || v === undefined) ? '–' : `$${v.toLocaleString()}`;

  return (
    <div className="kpi-sections">

      {/* Customers */}
      <div className="kpi-group">
        <div className="kpi-group-label">Customers · {rangeLabel}</div>
        <div className="kpi-grid">
          <KpiCard loading={statsLoading} label="Total Active" value={fmtN(totalActive)} sub="residential accounts" onClick={() => sendMessage(`How many total active customers do we have and how has that trended?`)}/>
          <KpiCard loading={statsLoading} label="New Customers" value={fmtN(newCustomers)} sub="added this period" onClick={() => sendMessage(`How many new customers did we add ${rangeLabel}?`)}/>
          <KpiCard loading={statsLoading} label="Cancels" value={fmtN(newCancels)} sub="this period" status={newCancels > 0 ? 'warn' : null} onClick={() => sendMessage(`How many customers cancelled this period and what were the reasons?`)}/>
          <KpiCard loading={statsLoading} label="Cancel Pending" value={fmtN(cancelPending)} sub="at risk" status={cancelPending > 5 ? 'warn' : null} onClick={() => sendMessage(`Who is cancel pending right now and what should we do?`)}/>
        </div>
      </div>

      {/* New by type */}
      {byType && (
        <div className="kpi-group">
          <div className="kpi-group-label">New Customers by Program Type</div>
          <div className="kpi-grid kpi-grid-3">
            <KpiCard loading={statsLoading} label="Basic" value={fmtN(byType.basic)} sub="new this period"/>
            <KpiCard loading={statsLoading} label="Essential" value={fmtN(byType.essential)} sub="new this period"/>
            <KpiCard loading={statsLoading} label="Elite" value={fmtN(byType.elite)} sub="new this period"/>
          </div>
        </div>
      )}

      {/* Cancel reasons */}
      {cancelReasons.length > 0 && (
        <div className="kpi-group">
          <div className="kpi-group-label">Cancel Reasons · {rangeLabel}</div>
          <div className="kpi-reason-list">
            {cancelReasons.slice(0, 6).map(r => {
              const pct = newCancels > 0 ? Math.round(r.count / newCancels * 100) : 0;
              return (
                <div key={r.reason} className="kpi-reason-row">
                  <div className="kpi-reason-name">{r.reason}</div>
                  <div className="kpi-reason-bar-wrap"><div className="kpi-reason-bar" style={{width:`${pct}%`}}/></div>
                  <div className="kpi-reason-count">{r.count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pipeline */}
      <div className="kpi-group">
        <div className="kpi-group-label">Sales Pipeline · {rangeLabel}</div>
        <div className="kpi-grid">
          <KpiCard loading={statsLoading} label="Total Leads" value={fmtN(totalLeads)} sub={leadsLabel} onClick={() => sendMessage(`How many leads came in this period and where are they in the pipeline?`)}/>
          <KpiCard loading={statsLoading} label="Close Rate" value={closeRate !== null ? `${closeRate}%` : '–'} sub={`${fmtN(wonCount)} won · ${fmtN(lostCount)} lost this period`} onClick={() => sendMessage(`What is our close rate this period and which reps are performing best?`)}/>
          <KpiCard loading={statsLoading} label="Cost to Acquire" value={fmtD(costPerCust)} sub="Google spend ÷ won deals" onClick={() => sendMessage(`What is our customer acquisition cost this period?`)}/>
          <KpiCard loading={statsLoading} label="Google CPA" value={cpa ? `$${cpa}` : '–'} sub="cost per conversion"/>
        </div>
      </div>

      {/* Close rate by rep */}
      {h?.repLeaderboard?.length > 0 && (
        <div className="kpi-group">
          <div className="kpi-group-label">Close Rate by Rep · {rangeLabel}</div>
          <div className="kpi-reason-list">
            {h.repLeaderboard.filter(r => !r.excluded && r.leads > 0).map(rep => {
              const pct = rep.closeRate ?? 0;
              return (
                <div key={rep.name} className="kpi-reason-row" style={{cursor:'pointer'}}
                  onClick={() => sendMessage(`How is ${rep.name.split(' ')[0]} performing? Leads, close rate, and pipeline status.`)}>
                  <div className="kpi-reason-name">{rep.name}{rep.note && <span className="rep-tag">{rep.note}</span>}</div>
                  <div className="kpi-reason-bar-wrap">
                    <div className="kpi-reason-bar" style={{width:`${pct}%`, background: pct >= 70 ? 'var(--green)' : pct >= 50 ? '#B8963E' : 'var(--red)'}}/>
                  </div>
                  <div className="kpi-reason-count">
                    {rep.closeRate !== null ? `${rep.closeRate}%` : '–'}
                    <span style={{color:'var(--text-3)',fontWeight:400}}> ({rep.leads} leads)</span>
                  </div>
                </div>
              );
            })}
            {h.repLeaderboard.some(r => r.excluded && (r.won + r.lost + r.open) > 0) && (
              <>
                <div className="rep-exclude-divider"/>
                {h.repLeaderboard.filter(r => r.excluded && (r.won + r.lost + r.open) > 0).map(rep => {
                  const pct = rep.closeRate ?? 0;
                  return (
                    <div key={rep.name} className="kpi-reason-row rep-excluded" style={{cursor:'pointer'}}
                      onClick={() => sendMessage(`How is ${rep.name.split(' ')[0]} performing? Leads, close rate, and pipeline status.`)}>
                      <div className="kpi-reason-name">{rep.name}</div>
                      <div className="kpi-reason-bar-wrap">
                        <div className="kpi-reason-bar" style={{width:`${pct}%`, background:'var(--text-4)'}}/>
                      </div>
                      <div className="kpi-reason-count">
                        {rep.closeRate !== null ? `${rep.closeRate}%` : '–'}
                        <span style={{color:'var(--text-3)',fontWeight:400}}> ({rep.won + rep.lost + rep.open} deals)</span>
                      </div>
                    </div>
                  );
                })}
                <div className="rep-exclude-note">Not included in avg — {h.repLeaderboard.filter(r => r.excluded).map(r => `${r.name.split(' ')[0]} (${r.excludeReason})`).join(', ')}</div>
              </>
            )}
          </div>
        </div>
      )}

      <button className="dv-ai-btn" onClick={() => sendMessage(`Give me a full Monday morning briefing — new customers, cancels by reason, pipeline, close rates by rep, and what needs attention this week.`)}>
        <span>Generate Monday morning briefing</span>
        <Icon name="arrowR" size={13}/>
      </button>
      <div style={{height:32}}/>
    </div>
  );
}

function RepGoalCard({ label, desc, actual, target, targetSuffix, format, prompt, sendMessage }) {
  const st  = goalStatus(actual, target, format);
  const pct = actual !== null ? Math.min(Math.round(actual / target * 100), 100) : null;
  const dispActual = format === 'percent' ? (actual !== null ? `${actual}%` : '–') : (actual ?? '–');
  return (
    <div className={`goal-card goal-${st}`} onClick={() => sendMessage(prompt)}>
      <div className="goal-card-top">
        <GoalArc pct={pct} status={st}/>
        <div className="goal-info">
          <div className="goal-label">{label}</div>
          <div className="goal-actual">{dispActual}</div>
          <div className="goal-of">of {target}{targetSuffix} target</div>
        </div>
      </div>
      <div className="goal-footer">
        <div className={`goal-status-chip goal-chip-${st}`}>{st === 'on-track' ? 'On track' : st === 'at-risk' ? 'At risk' : 'Behind'}</div>
        <div className="goal-desc">{desc}</div>
      </div>
    </div>
  );
}

// ══ GOALS VIEW ═══════════════════════════════════════════════════════════
function GoalArc({ pct, status }) {
  const r = 28, circ = 2 * Math.PI * r;
  const offset = pct !== null ? circ * (1 - Math.min(pct, 100) / 100) : circ;
  const color = status === 'on-track' ? 'var(--green)' : status === 'at-risk' ? '#B8963E' : 'var(--red)';
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" style={{flexShrink:0}}>
      <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border)" strokeWidth="4"/>
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 36 36)" style={{transition:'stroke-dashoffset 1s ease'}}/>
      <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="500"
        fill="var(--text)" fontFamily="var(--font)">
        {pct !== null ? `${Math.min(pct,100)}%` : '–'}
      </text>
    </svg>
  );
}

function CompanyGoalCard({ goal, actual, target, editingGoal, setEditingGoal, setGoalTargets, goalTargets, sendMessage }) {
  const status = goalStatus(actual, target, goal.format);
  const pct = actual !== null && target > 0
    ? Math.min(Math.round((goal.format === 'currency-inv' ? target / actual : actual / target) * 100), 100)
    : null;
  const isEditing = editingGoal === goal.id;
  return (
    <div className={`goal-card goal-${status}`} onClick={() => !isEditing && sendMessage(goal.aiPrompt)}>
      <div className="goal-card-top">
        <GoalArc pct={pct} status={status}/>
        <div className="goal-info">
          <div className="goal-label">{goal.label}</div>
          <div className="goal-actual">{fmtGoalVal(actual, goal.format)}<span className="goal-suffix">{goal.suffix}</span></div>
          <div className="goal-of">of {fmtGoalVal(target, goal.format)}{goal.suffix} target</div>
        </div>
        <button className="goal-edit-btn" title="Edit target"
          onClick={e => { e.stopPropagation(); setEditingGoal(isEditing ? null : goal.id); }}>
          <Icon name="edit" size={12}/>
        </button>
      </div>
      {isEditing && (
        <div className="goal-edit-row" onClick={e => e.stopPropagation()}>
          <span className="goal-edit-lbl">Target {goal.unit ? `(${goal.unit})` : ''}</span>
          <input className="goal-edit-input" type="number" defaultValue={target} autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) { const u = { ...goalTargets, [goal.id]: v }; setGoalTargets(u); saveGoalTargets(u); }
                setEditingGoal(null);
              }
              if (e.key === 'Escape') setEditingGoal(null);
            }}/>
          <span className="goal-edit-hint">Enter to save</span>
        </div>
      )}
      <div className="goal-footer">
        <div className={`goal-status-chip goal-chip-${status}`}>
          {status === 'on-track' ? 'On track' : status === 'at-risk' ? 'At risk' : status === 'behind' ? 'Behind' : 'Loading…'}
        </div>
        <div className="goal-desc">{goal.desc}</div>
      </div>
    </div>
  );
}

function GoalsView({ currentUser, liveStats, statsLoading, dateRange, goalTargets, monthlyBudget, repGoals, editingGoal, setEditingGoal, setGoalTargets, sendMessage }) {
  const isSales = currentUser?.role === 'sales';
  const isExecOrAdmin = ['admin','owner','marketing','executive'].includes(currentUser?.role);
  const rangeLabel = DATE_RANGES[dateRange]?.label || 'Month to date';
  const [goalsTab, setGoalsTab] = React.useState(isExecOrAdmin ? 'kpis' : 'goals');

  const repData = isSales
    ? (liveStats?.hubspot?.repLeaderboard || []).find(r =>
        r.name.toLowerCase().includes((currentUser?.name || '').split(' ')[0].toLowerCase()))
    : null;
  const repGoal = isSales ? (repGoals[currentUser?.email] || {}) : {};
  const leaderboard = liveStats?.hubspot?.repLeaderboard || [];
  const myRank = isSales ? leaderboard.findIndex(r =>
    r.name.toLowerCase().includes((currentUser?.name || '').split(' ')[0].toLowerCase())) + 1 : 0;

  return (
    <div className="goals-scroll">
      <div className="goals-header">
        <div>
          <div className="goals-eyebrow">{isSales ? `${currentUser?.name?.split(' ')[0]}'s Performance` : 'Company Performance'}</div>
          <h2 className="goals-title">Goals & KPIs</h2>
        </div>
      </div>

      {/* Tab nav — only show for exec/admin */}
      {isExecOrAdmin && (
        <div className="goals-tabs">
          <button className={`goals-tab${goalsTab==='kpis'?' active':''}`} onClick={()=>setGoalsTab('kpis')}>Monday KPIs</button>
          <button className={`goals-tab${goalsTab==='goals'?' active':''}`} onClick={()=>setGoalsTab('goals')}>Goal Tracking</button>
        </div>
      )}

      {/* ── KPI SECTION ── */}
      {goalsTab === 'kpis' && isExecOrAdmin && (
        <KPIsSection key={dateRange} liveStats={liveStats} statsLoading={statsLoading} rangeLabel={rangeLabel} sendMessage={sendMessage}/>
      )}

      {/* ── GOALS SECTION: Sales ── */}
      {(goalsTab === 'goals' || isSales) && isSales && (
        <div className="rep-goals-wrap">
          <div className="goals-grid">
            <RepGoalCard
              label="My Leads" desc="New deals created this period"
              actual={repData?.leads ?? null}
              target={repGoal.leads ?? 80}
              targetSuffix="/mo"
              format="number"
              prompt={`How many leads have I brought in this period vs my target of ${repGoal.leads ?? 80}?`}
              sendMessage={sendMessage}
            />
            <RepGoalCard
              label="Close Rate" desc="Won ÷ (won + lost) this period"
              actual={repData?.closeRate ?? null}
              target={repGoal.closeRate ?? 70}
              targetSuffix="%"
              format="percent"
              prompt={`What is my close rate this period vs my target of ${repGoal.closeRate ?? 70}%?`}
              sendMessage={sendMessage}
            />
          </div>

          {leaderboard.length > 0 && (
            <div className="leaderboard-section">
              <div className="section-lbl">Team Leaderboard · {rangeLabel}</div>
              <div className="leaderboard-table">
                <div className="lb-hdr">
                  <div className="lb-rank">#</div>
                  <div className="lb-name">Rep</div>
                  <div className="lb-val">Leads</div>
                  <div className="lb-val">Won</div>
                  <div className="lb-val">Close%</div>
                </div>
                {leaderboard.map((rep, idx) => {
                  const isMe = rep.name.toLowerCase().includes((currentUser?.name || '').split(' ')[0].toLowerCase());
                  return (
                    <div key={rep.name} className={`lb-row${isMe ? ' lb-me' : ''}`}>
                      <div className="lb-rank">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}</div>
                      <div className="lb-name">{rep.name.split(' ')[0]}</div>
                      <div className="lb-val">{rep.leads}</div>
                      <div className="lb-val">{rep.won}</div>
                      <div className="lb-val">{rep.closeRate !== null ? `${rep.closeRate}%` : '–'}</div>
                    </div>
                  );
                })}
              </div>
              {myRank > 0 && (
                <div className="lb-my-rank">You're ranked <strong>#{myRank}</strong> of {leaderboard.length} reps this period</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── GOALS SECTION: Exec ── */}
      {(goalsTab === 'goals') && !isSales && (
        <div className="goals-grid">
          {GOAL_DEFS.filter(g => g.roles.includes(currentUser?.role)).map(goal => (
            <CompanyGoalCard key={goal.id} goal={goal}
              actual={goal.getActual(liveStats)}
              target={getGoalTarget(goal.id, goalTargets, monthlyBudget)}
              editingGoal={editingGoal} setEditingGoal={setEditingGoal}
              setGoalTargets={setGoalTargets} goalTargets={goalTargets}
              sendMessage={sendMessage}
            />
          ))}
        </div>
      )}
      <div style={{ height: 32 }}/>
    </div>
  );
}

// ══ ADMIN PANEL ═══════════════════════════════════════════════════════════
// ══ GOOGLE ADS VIEW ══════════════════════════════════════════════════════
// Intentional Google Ads pause — context for execs. Auto-hides once the ramp-up date passes.
const GOOGLE_ADS_RESUME = '2026-07-15';
const adsPaused = () => new Date().toISOString().slice(0, 10) < GOOGLE_ADS_RESUME;

function GoogleAdsView({ liveStats, statsLoading, dateRange, sendMessage }) {
  const d = liveStats?.google;
  const rangeLabel = DATE_RANGES[dateRange]?.label || 'Month to date';

  const fmt$ = v => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v}`;
  const fmtN = v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(v);

  return (
    <div className="data-view-scroll">
      <div className="dv-header">
        <div>
          <div className="dv-eyebrow">Paid Search</div>
          <h2 className="dv-title">Google Ads</h2>
        </div>
        <div className="dv-period">{rangeLabel}</div>
      </div>

      {adsPaused() && (
        <div className="ads-notice">
          <span className="ads-notice-icon" aria-hidden="true">⏸</span>
          <span><strong>Campaigns intentionally paused</strong> — ramping back up <strong>July 15</strong> for Aeration season. Low spend &amp; conversions through then are by design, not neglect.</span>
        </div>
      )}

      {/* Summary KPI row */}
      <div className="dv-kpi-row">
        {[
          { label:'Spend',       val: d ? fmt$(d.spend) : '–',       sub: 'total' },
          { label:'Conversions', val: d ? fmtN(d.conversions) : '–', sub: 'total' },
          { label:'CPA',         val: d?.cpa ? `$${d.cpa}` : '–',    sub: 'cost/conv' },
          { label:'Clicks',      val: d ? fmtN(d.clicks) : '–',      sub: `${d?.ctr ?? '–'}% CTR` },
        ].map(k => (
          <div key={k.label} className="dv-kpi-card">
            <div className="dv-kpi-label">{k.label}</div>
            <div className="dv-kpi-val">{statsLoading ? <span className="dv-skel"/> : k.val}</div>
            <div className="dv-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Campaign breakdown */}
      <div className="dv-section-label">By Campaign</div>
      {statsLoading ? (
        <div className="dv-loading-rows">{[1,2,3].map(i => <div key={i} className="dv-row-skel"/>)}</div>
      ) : d?.campaigns?.length > 0 ? (
        <div className="dv-table">
          <div className="dv-table-hdr">
            <div className="dv-col-main">Campaign</div>
            <div className="dv-col-num">Spend</div>
            <div className="dv-col-num">Conv</div>
            <div className="dv-col-num">CPA</div>
            <div className="dv-col-num">Share</div>
          </div>
          {d.campaigns.map(camp => (
            <div key={camp.name} className="dv-table-row" onClick={() => sendMessage(`Break down the "${camp.name}" Google Ads campaign — what's the performance and what should we change?`)}>
              <div className="dv-col-main">
                <div className="dv-camp-name">{camp.name}</div>
                <div className="dv-camp-bar-wrap"><div className="dv-camp-bar" style={{width:`${camp.sharePct}%`}}/></div>
              </div>
              <div className="dv-col-num">{fmt$(camp.spend)}</div>
              <div className="dv-col-num">{camp.conversions}</div>
              <div className="dv-col-num">{camp.cpa ? `$${camp.cpa}` : '–'}</div>
              <div className="dv-col-num dv-share">{camp.sharePct}%</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dv-empty">{d ? 'No campaign data for this period' : liveStats?.errors?.google ? '⚠ Google Ads data couldn’t be loaded right now' : 'Loading…'}</div>
      )}

      <button className="dv-ai-btn" onClick={() => sendMessage(`Give me a full Google Ads analysis for ${rangeLabel} — spend, CPA by campaign, what's over-performing, what needs attention.`)}>
        <span>Ask AI for full analysis</span>
        <Icon name="arrowR" size={13}/>
      </button>
      <div style={{height:32}}/>
    </div>
  );
}

// ══ GBP VIEW ══════════════════════════════════════════════════════════════
function GBPView({ liveStats, statsLoading, dateRange, sendMessage }) {
  const d = liveStats?.gbp;
  const rangeLabel = DATE_RANGES[dateRange]?.label || 'Month to date';
  const fmtN = v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(v ?? '–');

  const metrics = d ? [
    { label:'Profile Views',      val: fmtN(d.views),      icon:'📍', desc:'Impressions on Google' },
    { label:'Phone Calls',        val: fmtN(d.calls),      icon:'📞', desc:'Calls from profile' },
    { label:'Direction Requests', val: fmtN(d.directions), icon:'🧭', desc:'Get directions taps' },
    { label:'Website Clicks',     val: fmtN(d.webClicks),  icon:'🔗', desc:'Clicks to website' },
  ] : [];

  // Find max views for bar scale
  const maxViews = d?.trend?.length > 0 ? Math.max(...d.trend.map(t => t.views), 1) : 1;

  return (
    <div className="data-view-scroll">
      <div className="dv-header">
        <div>
          <div className="dv-eyebrow">Local Presence</div>
          <h2 className="dv-title">Google Business Profile</h2>
        </div>
        <div className="dv-period">{rangeLabel}</div>
      </div>

      <div className="dv-kpi-row dv-kpi-row-2">
        {metrics.map(m => (
          <div key={m.label} className="dv-kpi-card">
            <div className="dv-kpi-label">{m.label}</div>
            <div className="dv-kpi-val">{statsLoading ? <span className="dv-skel"/> : m.val}</div>
            <div className="dv-kpi-sub">{m.desc}</div>
          </div>
        ))}
        {statsLoading && [1,2,3,4].map(i => (
          <div key={i} className="dv-kpi-card">
            <div className="dv-kpi-label">–</div>
            <div className="dv-kpi-val"><span className="dv-skel"/></div>
          </div>
        ))}
      </div>

      {/* 14-day trend */}
      {d?.trend?.length > 0 && (
        <>
          <div className="dv-section-label">14-Day View Trend</div>
          <div className="dv-sparkbar-wrap">
            {d.trend.map((t, i) => (
              <div key={t.date} className="dv-sparkbar-col" title={`${t.date}: ${t.views} views, ${t.calls} calls`}>
                <div className="dv-sparkbar" style={{height:`${Math.round(t.views / maxViews * 100)}%`}}/>
                {i % 3 === 0 && <div className="dv-sparkbar-label">{t.date.slice(5)}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      <button className="dv-ai-btn" onClick={() => sendMessage(`Analyze our Google Business Profile performance for ${rangeLabel} — views, calls, and what we should do to improve local search visibility.`)}>
        <span>Ask AI for analysis</span>
        <Icon name="arrowR" size={13}/>
      </button>
      <div style={{height:32}}/>
    </div>
  );
}

// ══ PIPELINE VIEW ══════════════════════════════════════════════════════════
function PipelineView({ liveStats, statsLoading, dateRange, sendMessage }) {
  const [pipeView, setPipeView] = useState('sales'); // 'sales' | 'commercial'
  const hasCommercial = !!liveStats?.hubspotCommercial;
  const h = pipeView === 'commercial' ? liveStats?.hubspotCommercial : liveStats?.hubspot;
  const pipeLabel = pipeView === 'commercial' ? 'Commercial' : 'Sales';
  const rangeLabel = DATE_RANGES[dateRange]?.label || 'Month to date';
  const fmt$ = v => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`;

  const STAGE_ORDER = ['ready to contact','attempting to contact','estimate sent','closed won','closed lost'];
  const stageRank = s => { const i = STAGE_ORDER.indexOf((s || '').toLowerCase()); return i === -1 ? 99 : i; };
  const stages = h?.stageBreakdown
    ? [...h.stageBreakdown].sort((a, b) => stageRank(a.stage) - stageRank(b.stage))
    : [];
  const maxCount = stages.length > 0 ? Math.max(...stages.map(s => s.count), 1) : 1;

  return (
    <div className="data-view-scroll">
      <div className="dv-header">
        <div>
          <div className="dv-eyebrow">HubSpot CRM · 2026 {pipeLabel}</div>
          <h2 className="dv-title">Pipeline</h2>
        </div>
        <div className="dv-period">{rangeLabel}</div>
      </div>

      {hasCommercial && (
        <div className="pipe-toggle">
          {['sales','commercial'].map(p => (
            <button key={p} className={`pipe-toggle-btn${pipeView === p ? ' active' : ''}`} onClick={() => setPipeView(p)}>
              {p === 'sales' ? 'Residential' : 'Commercial'}
            </button>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="dv-kpi-row">
        {[
          { label:'Total Deals',   val: h?.total ?? '–',  sub: 'in CRM' },
          { label:'New Leads',     val: (h?.newLeads > 0 ? h.newLeads : h?.activeLeads) ?? '–', sub: h?.newLeads > 0 ? 'new this period' : 'active in pipeline' },
          { label:'Close Rate',    val: h?.closeRate != null ? `${h.closeRate}%` : '–', sub: `${h?.wonCount ?? 0}W / ${h?.lostCount ?? 0}L closed` },
          { label:'Revenue',       val: h?.revenue ? fmt$(h.revenue) : '–', sub: 'closed won' },
        ].map(k => (
          <div key={k.label} className="dv-kpi-card">
            <div className="dv-kpi-label">{k.label}</div>
            <div className="dv-kpi-val">{statsLoading ? <span className="dv-skel"/> : k.val}</div>
            <div className="dv-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Stage funnel */}
      {stages.length > 0 && (
        <>
          <div className="dv-section-label">By Stage</div>
          <div className="dv-funnel">
            {stages.map(s => {
              const isWon  = s.stage === 'Closed Won';
              const isLost = s.stage === 'Closed Lost';
              return (
                <div key={s.stage} className={`dv-funnel-row${isWon?' dv-won':isLost?' dv-lost':''}`}
                  onClick={() => sendMessage(`Tell me about the "${s.stage}" stage — who's there, how long, and what needs follow-up?`)}>
                  <div className="dv-funnel-label">{s.stage}</div>
                  <div className="dv-funnel-bar-wrap">
                    <div className="dv-funnel-bar" style={{width:`${Math.round(s.count / maxCount * 100)}%`}}/>
                  </div>
                  <div className="dv-funnel-count">{s.count}</div>
                  {s.value > 0 && <div className="dv-funnel-val">{fmt$(s.value)}</div>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Rep leaderboard */}
      {h?.repLeaderboard?.length > 0 && (
        <>
          <div className="dv-section-label">By Rep</div>
          <div className="dv-table">
            <div className="dv-table-hdr">
              <div className="dv-col-main">Rep</div>
              <div className="dv-col-num">Leads</div>
              <div className="dv-col-num">Won</div>
              <div className="dv-col-num">Open</div>
              <div className="dv-col-num">Close%</div>
            </div>
            {h.repLeaderboard.filter(r => !r.excluded).map(rep => (
              <div key={rep.name} className="dv-table-row" onClick={() => sendMessage(`How is ${rep.name.split(' ')[0]} performing in the pipeline this period?`)}>
                <div className="dv-col-main dv-rep-name">{rep.name}{rep.note && <span className="rep-tag">{rep.note}</span>}</div>
                <div className="dv-col-num">{rep.leads}</div>
                <div className="dv-col-num dv-won-num">{rep.won}</div>
                <div className="dv-col-num">{rep.open}</div>
                <div className="dv-col-num">{rep.closeRate != null ? `${rep.closeRate}%` : '–'}</div>
              </div>
            ))}
            {h.repLeaderboard.filter(r => r.excluded && (r.won + r.lost + r.open) > 0).length > 0 && (
              <>
                <div className="rep-exclude-divider" style={{margin:'6px 0'}}/>
                {h.repLeaderboard.filter(r => r.excluded && (r.won + r.lost + r.open) > 0).map(rep => (
                  <div key={rep.name} className="dv-table-row rep-excluded" onClick={() => sendMessage(`How is ${rep.name.split(' ')[0]} performing in the pipeline this period?`)}>
                    <div className="dv-col-main dv-rep-name">{rep.name}</div>
                    <div className="dv-col-num">{rep.leads}</div>
                    <div className="dv-col-num dv-won-num">{rep.won}</div>
                    <div className="dv-col-num">{rep.open}</div>
                    <div className="dv-col-num">{rep.closeRate != null ? `${rep.closeRate}%` : '–'}</div>
                  </div>
                ))}
                <div className="rep-exclude-note" style={{padding:'4px 12px'}}>Not included in avg — {h.repLeaderboard.filter(r => r.excluded).map(r => `${r.name.split(' ')[0]} (${r.excludeReason})`).join(', ')}</div>
              </>
            )}
          </div>
        </>
      )}

      {/* Lead sources — True Lead Source (rep-tagged) blended with HubSpot's auto source */}
      {h?.leadSources?.length > 0 && (() => {
        const maxSrc = Math.max(...h.leadSources.map(s => s.count), 1);
        const attributed = h.attributedLeads ?? 0;
        const attributedPct = h.newLeads > 0 ? Math.round((attributed / h.newLeads) * 100) : 0;
        const taggedPct = h.newLeads > 0 ? Math.round((h.taggedLeads / h.newLeads) * 100) : 0;
        return (
          <>
            <div className="dv-section-label">
              By Source
              <span className="dv-section-note">{attributedPct}% attributed · {h.taggedLeads} rep-tagged</span>
            </div>
            {taggedPct < 50 && (
              <div className="data-health data-health-ok" role="status" style={{marginBottom:10, cursor:'pointer', paddingTop:0}}
                onClick={() => sendMessage(`Most of this period's lead sources are auto-detected from HubSpot's Original Traffic Source rather than rep-tagged True Lead Source. Which leads are auto-only, and how do we get reps to tag campaign-level detail?`)}>
                <span>Mostly auto-attributed — have reps set <strong>True Lead Source</strong> for campaign-level detail (e.g. which Google campaign). Tap for how.</span>
              </div>
            )}
            <div className="dv-funnel">
              {h.leadSources.map(s => (
                <div key={s.source} className={`dv-funnel-row${s.unknown ? ' dv-lost' : ''}`}
                  onClick={() => sendMessage(s.unknown
                    ? `${s.count} of our ${h.newLeads} new leads this period have no source at all (neither True Lead Source nor an Original Traffic Source). Which reps or stages are they in?`
                    : `Tell me about leads from "${s.source}" this period — how many, who's working them, and how they're converting.`)}>
                  <div className="dv-funnel-label">
                    {s.unknown ? 'Unknown' : s.source}
                    {s.autoOnly && !s.unknown && <span className="rep-tag">auto</span>}
                  </div>
                  <div className="dv-funnel-bar-wrap">
                    <div className="dv-funnel-bar" style={{width:`${Math.round(s.count / maxSrc * 100)}%`}}/>
                  </div>
                  <div className="dv-funnel-count">{s.count}</div>
                  <div className="dv-funnel-val">{s.pct}%</div>
                </div>
              ))}
            </div>
          </>
        );
      })()}

      {/* Recent deals */}
      {h?.recentDeals?.length > 0 && (
        <>
          <div className="dv-section-label">Recent Leads</div>
          <div className="dv-deal-list">
            {h.recentDeals.map((deal, i) => (
              <div key={i} className="dv-deal-row" onClick={() => sendMessage(`Tell me about the deal "${deal.name}" — status, value, and what should happen next?`)}>
                <div className="dv-deal-info">
                  <div className="dv-deal-name">{deal.name}</div>
                  <div className="dv-deal-meta">{deal.owner} · {deal.created}</div>
                </div>
                <div className="dv-deal-right">
                  <div className={`dv-stage-chip${deal.stage==='Closed Won'?' dv-chip-won':deal.stage==='Closed Lost'?' dv-chip-lost':''}`}>{deal.stage}</div>
                  {deal.amount && <div className="dv-deal-amt">{fmt$(deal.amount)}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <button className="dv-ai-btn" onClick={() => sendMessage(`Give me a full pipeline analysis for ${rangeLabel} — stage breakdown, rep performance, and what needs immediate attention.`)}>
        <span>Ask AI for full analysis</span>
        <Icon name="arrowR" size={13}/>
      </button>
      <div style={{height:32}}/>
    </div>
  );
}

// ══ ADMIN PANEL ═══════════════════════════════════════════════════════════
function AdminPanel({ sidebarOpen, setSidebarOpen, currentUser, signOut, toggleTheme, themeBtnRef, theme, setScreen, perms, permissions, togglePerm, goalTargets, setGoalTargets, monthlyBudget, setMonthlyBudget, repGoals, setRepGoals, adminTab, setAdminTab, pendingUsers, setPendingUsers }) {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const thisYear = new Date().getFullYear();
  const curMonth = new Date().getMonth();
  const SALES_REPS = USERS.filter(u => ['sales','sales_manager'].includes(u.role));
  const role = currentUser?.role;
  const canManageUsers  = perms.manageUsers;
  const canSetCompGoals = perms.goalAdmin;
  const canSetTeamGoals = perms.teamGoals;
  const canManagePerms  = role === 'admin';
  const hasPending = pendingUsers.length > 0;

  // Query log state (David Hamby only)
  const isDH = currentUser?.email === 'dhamby@pureturfllc.com';
  const [queryLogs, setQueryLogs] = React.useState([]);
  const [logsLoading, setLogsLoading] = React.useState(false);
  const [logSearch, setLogSearch] = React.useState('');

  const fetchQueryLogs = React.useCallback(async () => {
    if (!isDH) return;
    setLogsLoading(true);
    try {
      const res = await fetch('/.netlify/functions/query-logs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, limit: 500 }),
      });
      const d = await res.json();
      if (d.logs) setQueryLogs(d.logs);
    } catch {}
    setLogsLoading(false);
  }, [currentUser, isDH]);

  // Active users state (for Users tab)
  const [allUsers, setAllUsers] = React.useState([]);
  const [usersLoading, setUsersLoading] = React.useState(false);
  const [userMsg, setUserMsg] = React.useState('');
  const [roleEdits, setRoleEdits] = React.useState({});

  const fetchAllUsers = React.useCallback(async () => {
    if (!canManageUsers) return;
    setUsersLoading(true);
    try {
      const res = await fetch('/.netlify/functions/auth', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action:'list-users', requester_email: currentUser.email }),
      });
      const d = await res.json();
      if (d.ok) setAllUsers(d.users || []);
    } catch {}
    setUsersLoading(false);
  }, [currentUser, canManageUsers]);

  React.useEffect(() => {
    if (adminTab === 'users' && canManageUsers) fetchAllUsers();
    if (adminTab === 'query-log' && isDH) fetchQueryLogs();
  }, [adminTab]);

  const doApprove = async (userId) => {
    const role = roleEdits[userId] || 'sales';
    setUserMsg('');
    const res = await fetch('/.netlify/functions/auth', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'approve', requester_email: currentUser.email, user_id: userId, role }),
    });
    const d = await res.json();
    if (d.ok) { setPendingUsers(p => p.filter(u => u.id !== userId)); fetchAllUsers(); setUserMsg('User approved.'); }
    else setUserMsg(d.error || 'Error');
  };

  const doReject = async (userId) => {
    setUserMsg('');
    await fetch('/.netlify/functions/auth', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'reject', requester_email: currentUser.email, user_id: userId }),
    });
    setPendingUsers(p => p.filter(u => u.id !== userId));
    fetchAllUsers();
    setUserMsg('Request rejected.');
  };

  const doDisable = async (userId) => {
    setUserMsg('');
    await fetch('/.netlify/functions/auth', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'disable', requester_email: currentUser.email, user_id: userId }),
    });
    fetchAllUsers();
    setUserMsg('User disabled.');
  };

  const doResetPin = async (userId) => {
    if (!window.confirm(`Reset PIN for ${userId}? They'll create a new one at their next login.`)) return;
    setUserMsg('');
    await fetch('/.netlify/functions/auth', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'reset-pin', requester_email: currentUser.email, user_id: userId }),
    });
    fetchAllUsers();
    setUserMsg('PIN reset — they will create a new one at next login.');
  };

  const doEnable = async (userId) => {
    setUserMsg('');
    await fetch('/.netlify/functions/auth', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'enable', requester_email: currentUser.email, user_id: userId }),
    });
    fetchAllUsers();
    setUserMsg('User re-enabled.');
  };


  const availableTabs = [
    ...(canSetCompGoals ? [{ id:'goals',  label:'Company Goals' }] : []),
    ...(canSetCompGoals ? [{ id:'budget', label:'Ad Budget'     }] : []),
    ...(canSetTeamGoals ? [{ id:'team',   label:'Team Goals'    }] : []),
    ...(canManagePerms  ? [{ id:'perms',  label:'Permissions'   }] : []),
    ...(canManageUsers  ? [{ id:'users',  label: hasPending ? `Users · ${pendingUsers.length} pending` : 'Users' }] : []),
    ...(isDH            ? [{ id:'query-log', label:'Query Log' }] : []),
  ];

  // Pick first available tab if current not available
  const activeTab = availableTabs.find(t => t.id === adminTab) ? adminTab : availableTabs[0]?.id;

  const panelTitle = {
    admin: 'Admin Panel', owner: 'Owner Panel', marketing: 'Marketing Panel',
    executive: 'Settings', sales_manager: 'Team Settings',
  }[role] || 'Settings';

  return (
    <div className="app-shell" style={{ opacity: 1, pointerEvents: 'all' }}>
      <nav className={`sidebar${sidebarOpen ? '' : ' collapsed'}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            {sidebarOpen ? <PTLockup width={124} color="var(--text)"/> : <PTMark size={22} color="var(--accent)"/>}
          </div>
          <button className="sidebar-collapse" onClick={() => setSidebarOpen(o => !o)}><CollapseIcon collapsed={!sidebarOpen}/></button>
        </div>
        <div className="sidebar-nav">
          <button className="snav-btn" onClick={() => setScreen('app')}>
            <Icon name="home" size={16}/>{sidebarOpen && <span>Dashboard</span>}
          </button>
          <button className="snav-btn active">
            <Icon name="admin" size={16}/>{sidebarOpen && <span>Settings</span>}
          </button>
        </div>
        <div className="sidebar-footer">
          <button className="snav-btn snav-user" onClick={signOut}>
            <div className="snav-av">{currentUser?.initials}</div>
            {sidebarOpen && <div className="snav-user-info">
              <div className="snav-name">{currentUser?.name?.split(' ')[0]}</div>
              <div className="snav-role">Sign out</div>
            </div>}
          </button>
        </div>
      </nav>

      <div className="main-area">
        <div className="topbar">
          <div className="topbar-left">
            <div className="status-dot" style={{width:7,height:7}}/>
            <span className="topbar-live">{panelTitle}</span>
          </div>
          <div className="topbar-right">
            <button className="theme-btn" ref={themeBtnRef} onClick={toggleTheme}>
              {theme === 'dark' ? <SunIcon/> : <MoonIcon/>}
            </button>
          </div>
        </div>

        <div className="admin-scroll">
          {/* Header */}
          <div className="admin-hdr-row">
            <div>
              <div className="admin-title">{panelTitle}</div>
              <div className="admin-sub">
                {role === 'admin' && 'Full control over goals, team, permissions, and users'}
                {role === 'owner' && 'Company goals, ad budget, and team targets'}
                {role === 'sales_manager' && 'Set individual rep targets and track team performance'}
                {role === 'executive' && 'Company goals and team targets'}
              </div>
            </div>
            <button className="admin-back" onClick={() => setScreen('app')}>
              <svg viewBox="0 0 16 16" width="12" height="12" stroke="currentColor" strokeWidth="1.5" fill="none"><path d="M10 12L6 8l4-4" strokeLinecap="round"/></svg>
              Back
            </button>
          </div>

          {/* Tabs */}
          {availableTabs.length > 1 && (
            <div className="admin-tabs">
              {availableTabs.map(tab => (
                <button key={tab.id}
                  className={`admin-tab${activeTab === tab.id ? ' active' : ''}${tab.id === 'users' && hasPending ? ' admin-tab-alert' : ''}`}
                  onClick={() => setAdminTab(tab.id)}>
                  {tab.label}
                  {tab.id === 'users' && hasPending && <span className="admin-tab-badge">{pendingUsers.length}</span>}
                </button>
              ))}
            </div>
          )}

          {userMsg && <div className="admin-msg">{userMsg}</div>}

          {/* ── COMPANY GOALS ── */}
          {activeTab === 'goals' && (
            <div className="admin-section">
              <div className="admin-section-hdr">
                <div className="admin-section-label">Annual & monthly targets</div>
                <div className="admin-section-hint">Applied across all dashboards instantly</div>
              </div>
              <div className="goal-settings-grid">
                {GOAL_DEFS.filter(g => g.id !== 'adSpend').map(goal => (
                  <div key={goal.id} className="goal-setting-row">
                    <div className="gs-info">
                      <div className="gs-label">{goal.label}</div>
                      <div className="gs-desc">{goal.desc}</div>
                    </div>
                    <div className="gs-input-wrap">
                      {goal.unit && <span className="gs-unit">{goal.unit}</span>}
                      <input type="number" className="gs-input"
                        defaultValue={getGoalTarget(goal.id, goalTargets, monthlyBudget)}
                        onBlur={e => {
                          const v = parseFloat(e.target.value);
                          if (!isNaN(v)) { const u = { ...goalTargets, [goal.id]: v }; setGoalTargets(u); saveGoalTargets(u); }
                        }}/>
                      {goal.suffix && <span className="gs-suffix">{goal.suffix}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="admin-note">Changes save instantly and reflect across all user dashboards.</div>
            </div>
          )}

          {/* ── AD BUDGET ── */}
          {activeTab === 'budget' && (
            <div className="admin-section">
              <div className="admin-section-hdr">
                <div className="admin-section-label">Monthly ad spend targets</div>
                <div className="admin-section-hint">Google + Meta combined. Current month used automatically.</div>
              </div>
              <div className="budget-grid">
                {MONTHS.map((mo, idx) => {
                  const key = `${thisYear}-${String(idx + 1).padStart(2, '0')}`;
                  const val = monthlyBudget[key] ?? DEFAULT_MONTHLY_BUDGET[key] ?? 75000;
                  return (
                    <div key={key} className={`budget-row${idx === curMonth ? ' current' : ''}`}>
                      <div className="budget-month">
                        {mo}{idx === curMonth && <span className="current-badge">Now</span>}
                      </div>
                      <div className="gs-input-wrap">
                        <span className="gs-unit">$</span>
                        <input type="number" className="gs-input" defaultValue={val}
                          onBlur={e => {
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v)) { const u = { ...monthlyBudget, [key]: v }; setMonthlyBudget(u); saveMonthlyBudget(u); }
                          }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TEAM GOALS ── */}
          {activeTab === 'team' && (
            <div className="admin-section">
              <div className="admin-section-hdr">
                <div className="admin-section-label">Individual rep targets</div>
                <div className="admin-section-hint">Reps see their own targets on their Goals tab.</div>
              </div>
              <div className="perm-table">
                <div className="perm-row perm-hdr">
                  <div className="perm-user-col">Rep</div>
                  <div className="perm-mod-col" style={{flex:'0 0 140px',justifyContent:'flex-start',paddingLeft:8}}>Leads / mo</div>
                  <div className="perm-mod-col" style={{flex:'0 0 140px',justifyContent:'flex-start',paddingLeft:8}}>Close rate</div>
                </div>
                {SALES_REPS.map(rep => {
                  const rg = repGoals[rep.email] || {};
                  return (
                    <div key={rep.email} className="perm-row">
                      <div className="perm-user-col">
                        <div className="perm-av">{rep.initials}</div>
                        <div>
                          <div className="perm-name">{rep.name}</div>
                          <div className="perm-role">{rep.title}</div>
                        </div>
                      </div>
                      <div className="perm-mod-col" style={{flex:'0 0 140px',justifyContent:'flex-start'}}>
                        <input type="number" className="gs-input" style={{width:72}}
                          defaultValue={rg.leads ?? 80}
                          onBlur={e => {
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v)) { const u = { ...repGoals, [rep.email]: { ...rg, leads: v } }; setRepGoals(u); saveRepGoals(u); }
                          }}/>
                        <span style={{fontSize:11,color:'var(--text-3)',marginLeft:4}}>/mo</span>
                      </div>
                      <div className="perm-mod-col" style={{flex:'0 0 140px',justifyContent:'flex-start'}}>
                        <div className="gs-input-wrap">
                          <input type="number" className="gs-input" style={{width:60}}
                            defaultValue={rg.closeRate ?? 70}
                            onBlur={e => {
                              const v = parseFloat(e.target.value);
                              if (!isNaN(v)) { const u = { ...repGoals, [rep.email]: { ...rg, closeRate: v } }; setRepGoals(u); saveRepGoals(u); }
                            }}/>
                          <span className="gs-suffix">%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PERMISSIONS ── */}
          {activeTab === 'perms' && (
            <div className="admin-section">
              <div className="admin-section-hdr">
                <div className="admin-section-label">Module access per user</div>
                <div className="admin-section-hint">Override default role permissions for individual users.</div>
              </div>
              <div className="perm-table">
                <div className="perm-row perm-hdr">
                  <div className="perm-user-col">User</div>
                  {Object.entries(MODULE_LABELS).filter(([k]) => k !== 'manageUsers').map(([k,v]) => (
                    <div key={k} className="perm-mod-col">{v}</div>
                  ))}
                </div>
                {USERS.map(user => {
                  const p = getPerms(user.email, user.role, permissions);
                  return (
                    <div key={user.email} className="perm-row">
                      <div className="perm-user-col">
                        <div className="perm-av">{user.initials}</div>
                        <div>
                          <div className="perm-name">{user.name}</div>
                          <div className="perm-role" style={{color: ROLE_COLORS[user.role]}}>{ROLE_LABELS[user.role] || user.role}</div>
                        </div>
                      </div>
                      {Object.keys(MODULE_LABELS).filter(k => k !== 'manageUsers').map(mod => (
                        <div key={mod} className="perm-mod-col">
                          <button className={`perm-toggle${p[mod] ? ' on' : ''}`} onClick={() => togglePerm(user.email, mod)}>
                            {p[mod]
                              ? <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 6l3 3 6-7"/></svg>
                              : <svg viewBox="0 0 12 12" width="11" height="11" stroke="currentColor" strokeWidth="1.5" fill="none"><path d="M1 1l10 10M11 1L1 11" strokeLinecap="round"/></svg>}
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div className="admin-note">Overrides are per-user and persist across sessions.</div>
            </div>
          )}

          {/* ── USERS ── */}
          {activeTab === 'users' && (
            <div className="admin-section">
              {/* Pending approvals */}
              {pendingUsers.length > 0 && (
                <>
                  <div className="admin-section-hdr" style={{marginBottom:12}}>
                    <div className="admin-section-label">
                      <span className="admin-pending-dot"/>
                      Pending approval · {pendingUsers.length}
                    </div>
                    <div className="admin-section-hint">New account requests waiting for your review.</div>
                  </div>
                  <div className="perm-table" style={{marginBottom:28}}>
                    <div className="perm-row perm-hdr">
                      <div className="perm-user-col">Requested by</div>
                      <div className="perm-mod-col" style={{flex:'0 0 130px',justifyContent:'flex-start',paddingLeft:8}}>Assign role</div>
                      <div className="perm-mod-col" style={{flex:'0 0 180px',justifyContent:'flex-end',gap:8}}>Action</div>
                    </div>
                    {pendingUsers.map(u => (
                      <div key={u.id} className="perm-row">
                        <div className="perm-user-col">
                          <div className="perm-av">{u.initials}</div>
                          <div>
                            <div className="perm-name">{u.name}</div>
                            <div className="perm-role">{u.email}</div>
                          </div>
                        </div>
                        <div className="perm-mod-col" style={{flex:'0 0 130px',justifyContent:'flex-start'}}>
                          <select className="gs-input admin-role-select"
                            value={roleEdits[u.id] || 'sales'}
                            onChange={e => setRoleEdits(prev => ({...prev, [u.id]: e.target.value}))}>
                            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                          </select>
                        </div>
                        <div className="perm-mod-col" style={{flex:'0 0 180px',justifyContent:'flex-end',gap:8}}>
                          <button className="admin-action-btn admin-action-approve" onClick={() => doApprove(u.id)}>Approve</button>
                          <button className="admin-action-btn admin-action-reject" onClick={() => doReject(u.id)}>Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* All active users */}
              <div className="admin-section-hdr" style={{marginBottom:12}}>
                <div className="admin-section-label">All users</div>
                <div className="admin-section-hint">
                  {usersLoading ? 'Loading…' : `${allUsers.filter(u=>u.status==='active').length} active · ${allUsers.filter(u=>u.status==='disabled').length} disabled`}
                </div>
              </div>
              {usersLoading ? (
                <div className="dv-loading-rows">{[1,2,3].map(i=><div key={i} className="dv-row-skel"/>)}</div>
              ) : (
                <div className="admin-users-table">
                  <div className="admin-user-hdr">
                    <div className="au-col-user">User</div>
                    <div className="au-col-role">Role</div>
                    <div className="au-col-login">Last login</div>
                    <div className="au-col-status">Status</div>
                    <div className="au-col-action"/>
                  </div>
                  {allUsers.map(u => {
                    const lastLogin = u.last_login ? new Date(u.last_login).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'Never';
                    const isActive = u.status === 'active';
                    const notSetUp = u.status === 'not_set_up';
                    const isDisabled = u.status === 'disabled';
                    const isSelf = u.email === currentUser?.email;
                    return (
                      <div key={u.id} className={`admin-user-row${!isActive?' dimmed':''}`}>
                        <div className="au-col-user">
                          <div className="perm-av" style={{width:30,height:30,fontSize:10}}>{u.initials || u.name?.slice(0,2).toUpperCase()}</div>
                          <div>
                            <div className="perm-name">{u.name}{isSelf && <span className="rep-tag">You</span>}</div>
                            <div className="perm-role" style={{fontSize:10}}>{u.email}</div>
                          </div>
                        </div>
                        <div className="au-col-role">
                          <span className="au-role-badge" style={{color: ROLE_COLORS[u.role] || 'var(--text-3)', background: (ROLE_COLORS[u.role] || 'var(--text-3)') + '18'}}>
                            {ROLE_LABELS[u.role] || u.role || '–'}
                          </span>
                        </div>
                        <div className="au-col-login">{lastLogin}</div>
                        <div className="au-col-status">
                          <span className={`au-status-dot${isActive?' active':notSetUp?' pending':' disabled'}`}/>
                          <span style={{fontSize:11,color:'var(--text-3)'}}>{isActive?'Active':notSetUp?'No PIN yet':'Disabled'}</span>
                        </div>
                        <div className="au-col-action">
                          {isActive && (<>
                            <button className="admin-action-btn" style={{fontSize:10,padding:'3px 10px',marginRight:6}} onClick={() => doResetPin(u.id)}>Reset PIN</button>
                            {/* Can't disable your own account — prevents locking yourself out. */}
                            {!isSelf && <button className="admin-action-btn admin-action-reject" style={{fontSize:10,padding:'3px 10px'}} onClick={() => doDisable(u.id)}>Disable</button>}
                          </>)}
                          {isDisabled && (
                            <button className="admin-action-btn admin-action-approve" style={{fontSize:10,padding:'3px 10px'}} onClick={() => doEnable(u.id)}>Enable</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'query-log' && (() => {
            // Usage analytics, computed from the fetched logs (David-only view).
            const now = Date.now();
            const within7 = queryLogs.filter(l => l.created_at && now - new Date(l.created_at).getTime() < 7*864e5).length;
            const today = queryLogs.filter(l => l.created_at && now - new Date(l.created_at).getTime() < 864e5).length;
            const perUser = {};
            queryLogs.forEach(l => {
              const k = l.user_email || 'unknown';
              if (!perUser[k]) perUser[k] = { name: l.user_name || k, email: k, count: 0 };
              perUser[k].count++;
            });
            const users = Object.values(perUser).sort((a,b) => b.count - a.count);
            const q = logSearch.trim().toLowerCase();
            const filtered = q
              ? queryLogs.filter(l => `${l.user_name} ${l.user_email} ${l.message}`.toLowerCase().includes(q))
              : queryLogs;
            const exportCsv = () => {
              const esc = s => `"${String(s ?? '').replace(/"/g,'""')}"`;
              const rows = [['Time','Name','Email','Query'], ...queryLogs.map(l => [l.created_at || '', l.user_name || '', l.user_email || '', l.message || ''])];
              const blob = new Blob([rows.map(r => r.map(esc).join(',')).join('\n')], { type: 'text/csv' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pure-turf-ai-queries.csv'; a.click();
            };
            return (
            <div className="admin-section">
              <div className="admin-section-hdr" style={{marginBottom:12}}>
                <div className="admin-section-label">Search Activity</div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <div className="admin-section-hint">{logsLoading ? 'Loading…' : `${queryLogs.length} queries`}</div>
                  {queryLogs.length > 0 && <button className="ql-export" onClick={exportCsv}>Export CSV</button>}
                </div>
              </div>

              {!logsLoading && queryLogs.length > 0 && (
                <>
                  {/* Summary stats */}
                  <div className="ql-stats">
                    {[
                      { label:'Total queries', val: queryLogs.length },
                      { label:'Active users',  val: users.length },
                      { label:'Last 7 days',   val: within7 },
                      { label:'Today',         val: today },
                    ].map(s => (
                      <div key={s.label} className="ql-stat"><div className="ql-stat-val">{s.val}</div><div className="ql-stat-lbl">{s.label}</div></div>
                    ))}
                  </div>

                  {/* Per-user breakdown */}
                  <div className="admin-section-label" style={{margin:'4px 0 8px'}}>By User</div>
                  <div className="ql-userbars">
                    {users.map(u => (
                      <div key={u.email} className="ql-userbar" onClick={() => setLogSearch(u.email)} title="Click to filter to this user">
                        <div className="ql-userbar-name">{u.name}</div>
                        <div className="ql-userbar-track"><div className="ql-userbar-fill" style={{width:`${Math.round(u.count/users[0].count*100)}%`}}/></div>
                        <div className="ql-userbar-count">{u.count}</div>
                      </div>
                    ))}
                  </div>

                  {/* Search */}
                  <input className="ql-search" placeholder="Search queries, names, emails…" value={logSearch} onChange={e=>setLogSearch(e.target.value)} />
                </>
              )}

              <div className="admin-section-label" style={{margin:'12px 0 8px'}}>
                {q ? `Matching “${logSearch}” · ${filtered.length}` : 'Recent Queries'}
              </div>
              {logsLoading ? (
                <div className="dv-loading-rows">{[1,2,3].map(i=><div key={i} className="dv-row-skel"/>)}</div>
              ) : filtered.length === 0 ? (
                <div className="dv-empty" style={{padding:'18px 0'}}>{queryLogs.length === 0 ? 'No queries logged yet.' : 'No matches.'}</div>
              ) : (
                <div className="ql-list">
                  {filtered.map((log, i) => (
                    <div key={log.id || i} className="ql-row">
                      <div className="perm-av" style={{width:30,height:30,fontSize:10,flexShrink:0}}>{(log.user_name||'?').split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                      <div className="ql-row-body">
                        <div className="ql-row-msg">{log.message}</div>
                        <div className="ql-row-meta">{log.user_name} · {log.created_at ? new Date(log.created_at).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}) : '–'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}


// ── SCORECARD ──────────────────────────────────────────────────────────
// Effort (calls/emails from HubSpot) next to outcome (leads/won/close%/revenue from
// the pipeline data). Activity loads from its own function only when this view opens.
function ScorecardView({ liveStats, dateRange, sendMessage }) {
  const [activity, setActivity] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/.netlify/functions/scorecard?range=${dateRange}`)
      .then(r => r.json()).then(d => { if (!cancelled) setActivity(d); })
      .catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [dateRange]);

  const rangeLabel = DATE_RANGES[dateRange]?.label || 'Month to date';
  const fmt$ = v => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v||0}`;
  const board = (liveStats?.hubspot?.repLeaderboard || []).filter(r => r.name !== 'Unassigned');
  const actByName = {};
  (activity?.reps || []).forEach(r => { actByName[r.name] = r; });
  const emailsOff = (activity?.unavailable || []).includes('emails');
  const callsOff  = (activity?.unavailable || []).includes('calls');

  const rows = board.map(r => {
    const a = actByName[r.name] || {};
    const calls = a.calls ?? 0, emails = a.emails ?? 0;
    const won = r.won || 0;
    return {
      name: r.name, note: r.note,
      calls, emails, activity: calls + emails,
      leads: r.leads || 0, won, closeRate: r.closeRate,
      revenue: r.revenue || 0,
      // Effort efficiency: wins per 100 outreach touches.
      perWin: won > 0 ? Math.round((calls + emails) / won) : null,
    };
  }).sort((a, b) => b.activity - a.activity);
  const maxAct = Math.max(...rows.map(r => r.activity), 1);

  return (
    <div className="data-view-scroll">
      <div className="dv-header">
        <div>
          <div className="dv-eyebrow">Rep Scorecard · 2026 Sales</div>
          <h2 className="dv-title">Scorecard</h2>
        </div>
        <div className="dv-period">{rangeLabel}</div>
      </div>

      {(emailsOff || callsOff) && (
        <div className="data-health data-health-ok" role="status" style={{marginBottom:12, paddingTop:0}}>
          {callsOff && emailsOff ? 'Call & email activity unavailable — grant the HubSpot private app the calls/emails read scopes.'
            : emailsOff ? 'Email activity unavailable — grant the HubSpot private app the “crm.objects.emails.read” scope to add emails.'
            : 'Call activity unavailable — grant the HubSpot private app the “crm.objects.calls.read” scope.'}
        </div>
      )}

      <div className="dv-table">
        <div className="dv-table-hdr">
          <div className="dv-col-main">Rep</div>
          <div className="dv-col-num">Calls</div>
          <div className="dv-col-num">Emails</div>
          <div className="dv-col-num">Leads</div>
          <div className="dv-col-num">Won</div>
          <div className="dv-col-num">Close%</div>
          <div className="dv-col-num">Revenue</div>
        </div>
        {rows.map(r => (
          <div key={r.name} className="dv-table-row" onClick={() => sendMessage(`Give me a performance review of ${r.name.split(' ')[0]} for ${rangeLabel} — calls, emails, leads, close rate, and revenue. What should they focus on?`)}>
            <div className="dv-col-main dv-rep-name">
              {r.name}{r.note && <span className="rep-tag">{r.note}</span>}
              <div className="sc-activity-bar"><div className="sc-activity-fill" style={{width:`${Math.round(r.activity/maxAct*100)}%`}}/></div>
            </div>
            <div className="dv-col-num">{loading ? '…' : r.calls}</div>
            <div className="dv-col-num">{loading ? '…' : (emailsOff ? '–' : r.emails)}</div>
            <div className="dv-col-num">{r.leads}</div>
            <div className="dv-col-num dv-won-num">{r.won}</div>
            <div className="dv-col-num">{r.closeRate != null ? `${r.closeRate}%` : '–'}</div>
            <div className="dv-col-num">{r.revenue ? fmt$(r.revenue) : '–'}</div>
          </div>
        ))}
      </div>

      {/* Programs sold per rep, by tier (RG Services · sold_by_1) */}
      {(() => {
        const pbr = liveStats?.rgServices?.programsByRep || [];
        const byName = {}; pbr.forEach(x => { byName[x.rep] = x; });
        const repProgs = rows.map(r => byName[r.name]).filter(Boolean).sort((a, b) => b.total - a.total);
        if (!repProgs.length) return null;
        const TIERS = [['basic','Basic'],['essential','Ess'],['elite','Elite'],['mosquito','Mosq'],['aeration','Aer']];
        return (
          <>
            <div className="dv-section-label" style={{margin:'16px 0 8px'}}>Programs Sold · {rangeLabel}</div>
            <div className="dv-table sc-prog-table">
              <div className="dv-table-hdr">
                <div className="dv-col-main">Rep</div>
                {TIERS.map(([k,l]) => <div key={k} className="dv-col-num">{l}</div>)}
                <div className="dv-col-num">Total</div>
              </div>
              {repProgs.map(x => (
                <div key={x.rep} className="dv-table-row" onClick={() => sendMessage(`What programs has ${x.rep.split(' ')[0]} sold this period and how does the mix compare to other reps?`)}>
                  <div className="dv-col-main dv-rep-name">{x.rep}</div>
                  {TIERS.map(([k]) => <div key={k} className="dv-col-num">{x[k] || 0}</div>)}
                  <div className="dv-col-num dv-won-num">{x.total}</div>
                </div>
              ))}
            </div>
          </>
        );
      })()}

      <div className="dv-section-label" style={{margin:'16px 0 8px'}}>Touches per Win</div>
      <div className="sc-note">How many calls + emails it takes each rep to close one deal — lower is more efficient.</div>
      <div className="dv-funnel">
        {rows.filter(r => r.perWin != null).sort((a,b) => a.perWin - b.perWin).map(r => {
          const maxPW = Math.max(...rows.filter(x => x.perWin != null).map(x => x.perWin), 1);
          return (
            <div key={r.name} className="dv-funnel-row">
              <div className="dv-funnel-label">{r.name}</div>
              <div className="dv-funnel-bar-wrap"><div className="dv-funnel-bar" style={{width:`${Math.round(r.perWin/maxPW*100)}%`}}/></div>
              <div className="dv-funnel-count">{r.perWin}</div>
            </div>
          );
        })}
      </div>

      <button className="dv-ai-btn" onClick={() => sendMessage(`Give me a full team scorecard analysis for ${rangeLabel} — who's putting in the activity, who's converting it, and who needs coaching.`)}>
        <span>Ask AI for coaching insights</span>
        <Icon name="arrowR" size={13}/>
      </button>
      <div style={{height:32}}/>
    </div>
  );
}

// ── FINANCE (QuickBooks P&L via Windsor) ────────────────────────────────
function FinanceView({ sendMessage }) {
  const [period, setPeriod] = React.useState('this_year');
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let cancelled = false; setLoading(true);
    fetch(`/.netlify/functions/finance?period=${period}`)
      .then(r => r.json()).then(d => { if (!cancelled) setData(d); })
      .catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [period]);

  const fmt$ = v => { if (v == null) return '–'; const a = Math.abs(v); const s = v < 0 ? '-' : ''; return a >= 1e6 ? `${s}$${(a/1e6).toFixed(2)}M` : a >= 1e3 ? `${s}$${(a/1e3).toFixed(0)}k` : `${s}$${Math.round(a)}`; };
  const periodLabel = { this_month:'This Month', this_year:'Year to Date', last_year:'Last Year' }[period];
  const f = data && !data.error ? data : null;
  const lines = f ? [
    { label:'Revenue', val:f.revenue, bold:true },
    { label:'Cost of Goods Sold', val:-f.cogs },
    { label:'Gross Profit', val:f.grossProfit, bold:true },
    { label:'Operating Expenses', val:-f.operatingExpenses },
    { label:'Net Operating Income', val:f.netOperatingIncome, bold:true },
    { label:'Other Income', val:f.otherIncome },
    { label:'Other Expenses', val:-f.otherExpenses },
    { label:'Net Income', val:f.netIncome, bold:true, big:true },
  ] : [];

  return (
    <div className="data-view-scroll">
      <div className="dv-header">
        <div><div className="dv-eyebrow">QuickBooks · Profit &amp; Loss</div><h2 className="dv-title">Finance</h2></div>
      </div>
      <div className="pipe-toggle">
        {[['this_month','This Month'],['this_year','YTD'],['last_year','Last Year']].map(([p,l]) => (
          <button key={p} className={`pipe-toggle-btn${period===p?' active':''}`} onClick={() => setPeriod(p)}>{l}</button>
        ))}
      </div>

      {loading && <div className="dv-loading-rows">{[1,2,3].map(i=><div key={i} className="dv-row-skel"/>)}</div>}

      {!loading && f && (
        <>
          <div className="dv-kpi-row">
            {[
              { label:'Revenue', val: fmt$(f.revenue) },
              { label:'Net Income', val: fmt$(f.netIncome) },
              { label:'Net Margin', val: f.margin != null ? `${f.margin}%` : '–' },
              { label:'A/R Outstanding', val: fmt$(f.accountsReceivable) },
            ].map(k => (
              <div key={k.label} className="dv-kpi-card"><div className="dv-kpi-label">{k.label}</div><div className="dv-kpi-val">{k.val}</div></div>
            ))}
          </div>

          <div className="dv-section-label" style={{marginTop:16}}>Income Statement · {periodLabel}</div>
          <div className="fin-statement">
            {lines.map(l => (
              <div key={l.label} className={`fin-line${l.bold?' fin-bold':''}${l.big?' fin-big':''}`}>
                <span>{l.label}</span>
                <span className={l.val < 0 ? 'fin-neg' : ''}>{fmt$(l.val)}</span>
              </div>
            ))}
          </div>
          {f.cash != null && <div className="sc-note" style={{marginTop:12}}>Cash on hand (bank balances): <strong>{fmt$(f.cash)}</strong></div>}
        </>
      )}

      {!loading && !f && <div className="dv-empty" style={{padding:'18px 0'}}>Finance data unavailable{data?.error ? `: ${data.error}` : ''}.</div>}

      <button className="dv-ai-btn" onClick={() => sendMessage(`Give me a financial summary for ${periodLabel} — revenue, gross profit, net income, margin, and what stands out or needs attention.`)}>
        <span>Ask AI for a financial summary</span>
        <Icon name="arrowR" size={13}/>
      </button>
      <div style={{height:32}}/>
    </div>
  );
}

// ── SEARCH & VISIBILITY (SEO / Local / AEO via Search Atlas) ────────────
function SearchVisibilityView({ sendMessage }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let cancelled = false;
    fetch('/.netlify/functions/search-atlas')
      .then(r => r.json()).then(d => { if (!cancelled) setData(d); })
      .catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const g = data?.gsc, local = data?.local;
  const fmtN = n => (n ?? 0).toLocaleString();
  // Compact for narrow KPI cards: full with commas under 10k, else 231K / 1.2M.
  const fmtK = n => { if (n == null) return '–'; const a = Math.abs(n); if (a >= 1e6) return `${(n/1e6).toFixed(1)}M`; if (a >= 1e4) return `${Math.round(n/1e3)}K`; return n.toLocaleString(); };
  const delta = local?.delta;
  const updated = data?.fetchedAt ? relTime(data.fetchedAt) : null;

  return (
    <div className="data-view-scroll">
      <div className="dv-header">
        <div>
          <div className="dv-eyebrow">Search Atlas{updated ? ` · updated ${updated}` : ''}</div>
          <h2 className="dv-title">Search & Visibility</h2>
        </div>
      </div>

      {loading && <div className="dv-loading-rows">{[1,2,3].map(i=><div key={i} className="dv-row-skel"/>)}</div>}

      {!loading && (
        <>
          {/* Wins heroes — reputation + local map rank */}
          <div className="sv-heroes">
            {data?.reviews && (
              <div className="sv-win">
                <div className="sv-win-val">{data.reviews.avgRating}<span className="sv-win-star">★</span></div>
                <div className="sv-win-lbl">{data.reviews.total.toLocaleString()} reviews · {data.reviews.fiveStar.toLocaleString()} five-star</div>
              </div>
            )}
            <div className="sv-win">
              <div className="sv-win-val">#{local?.avgPosition ?? '–'}{delta > 0 && <span className="sv-delta up"> ▲{delta}</span>}</div>
              <div className="sv-win-lbl">avg map rank{local?.prevPosition != null ? ` · up from #${local.prevPosition}` : ''}</div>
            </div>
          </div>

          {/* Keyword wins */}
          {data?.keywordWins && (() => { const kw = data.keywordWins; return (
            <>
              <div className="dv-section-label" style={{marginTop:18}}>
                Keyword Rankings{kw.improved != null && <span className="dv-section-note" style={{color:'#10B981',opacity:1}}>▲ {kw.improved} improved this period</span>}
              </div>
              <div className="dv-kpi-row">
                {[
                  { label:'Ranking #1', val: kw.atTop1 },
                  { label:'In Top 3',   val: kw.top3 },
                  { label:'On Page 1',  val: kw.page1 },
                  { label:'Tracked',    val: kw.ranked },
                ].map(k => (
                  <div key={k.label} className="dv-kpi-card"><div className="dv-kpi-label">{k.label}</div><div className="dv-kpi-val">{k.val}</div></div>
                ))}
              </div>
              {data.visibilityTrend?.length > 1 && (() => { const mx = Math.max(...data.visibilityTrend, 0.01); return (
                <div className="dv-sparkbar-wrap" style={{marginBottom:18}}>
                  {data.visibilityTrend.map((v, i) => (
                    <div key={i} className="dv-sparkbar-col"><div className="dv-sparkbar" style={{height:`${Math.max(8, Math.round((v/mx)*100))}%`}}/></div>
                  ))}
                </div>
              ); })()}
            </>
          ); })()}

          {/* GBP locations */}
          {data?.gbpLocations?.length > 0 && (
            <>
              <div className="dv-section-label" style={{marginTop:16}}>Locations ({data.gbpLocations.length})</div>
              <div className="dv-deal-list">
                {data.gbpLocations.map(l => (
                  <div key={l.id} className="dv-deal-row" onClick={() => sendMessage(`How is the ${l.name} (${l.address}) location performing in local search?`)}>
                    <div className="dv-deal-info">
                      <div className="dv-deal-name">{l.name}</div>
                      <div className="dv-deal-meta">{l.address}</div>
                    </div>
                    <div className="dv-deal-right">
                      <div className={`dv-stage-chip${l.verified ? ' dv-chip-won' : ''}`}>{l.verified ? 'Verified' : 'Unverified'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Website search traffic (GSC) */}
          <div className="dv-section-label" style={{marginTop:18}}>Website Search · last {g?.periodDays || 90} days</div>
          <div className="dv-kpi-row">
            {[
              { label:'Clicks',      val: g ? fmtK(g.clicks) : '–' },
              { label:'Impressions', val: g ? fmtK(g.impressions) : '–' },
              { label:'CTR',         val: g ? `${g.ctr}%` : '–' },
              { label:'Avg Position',val: g ? g.position : '–' },
            ].map(k => (
              <div key={k.label} className="dv-kpi-card">
                <div className="dv-kpi-label">{k.label}</div>
                <div className="dv-kpi-val">{k.val}</div>
              </div>
            ))}
          </div>

          {data?.gscTopKeywords?.length > 0 && (
            <>
              <div className="dv-section-label" style={{marginTop:16}}>Top Search Terms</div>
              <div className="dv-table">
                {data.gscTopKeywords.map((k, i) => (
                  <div key={i} className="dv-table-row">
                    <div className="dv-col-main">{k.term}</div>
                    <div className="dv-col-num">{fmtN(k.clicks)} clk</div>
                    <div className="dv-col-num">#{k.position}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {Object.keys(data?.errors || {}).length > 0 && (
            <div className="data-health data-health-ok" style={{marginTop:14}}>Some Search Atlas data couldn’t load: {Object.keys(data.errors).join(', ')}.</div>
          )}
        </>
      )}

      <button className="dv-ai-btn" onClick={() => sendMessage('Give me a full SEO and local search summary — how are we ranking, where are we gaining or losing, and what should we focus on?')}>
        <span>Ask AI for an SEO summary</span>
        <Icon name="arrowR" size={13}/>
      </button>
      <div style={{height:32}}/>
    </div>
  );
}

// ── MOBILE DETECTION ───────────────────────────────────────────────────
function useMobile(bp = 768) {
  const [m, setM] = useState(() => window.innerWidth <= bp);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp}px)`);
    const h = (e) => setM(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [bp]);
  return m;
}

// ── ERROR BOUNDARY ─────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Pure Turf AI crash:', error, info); }
  render() {
    if (this.state.error) {
      return React.createElement('div', { style: { padding: 40, fontFamily: 'system-ui' } },
        React.createElement('h2', null, 'Something went wrong'),
        React.createElement('p', { style: { color: '#666', fontSize: 14 } }, this.state.error.message),
        React.createElement('button', {
          onClick: () => { this.setState({ error: null }); window.location.reload(); },
          style: { marginTop: 16, padding: '8px 20px', borderRadius: 8, border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer', fontSize: 14 }
        }, 'Reload')
      );
    }
    return this.props.children;
  }
}

function AppInner() {
  const [screen,        setScreen]        = useState('login');
  const [theme,         setTheme]         = useState('light');
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const isMobile = useMobile();
  const [mobileTab,     setMobileTab]     = useState('dashboard');
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [loginStep,     setLoginStep]     = useState(() => {
    const saved = getSavedEmail();
    return saved ? 'pin' : 'email';
  });
  const [emailInput,    setEmailInput]    = useState('');
  const [emailErr,      setEmailErr]      = useState('');
  const [selectedUser,  setSelectedUser]  = useState(() => {
    const saved = getSavedEmail();
    return saved ? USERS.find(u => u.email === saved) || null : null;
  });
  const [pin,           setPin]           = useState('');
  const [pinErr,        setPinErr]        = useState(false);
  const [pinMode,       setPinMode]       = useState('login'); // 'login' | 'create' | 'confirm'
  const [firstPin,      setFirstPin]      = useState('');
  const [signupName,    setSignupName]    = useState('');
  const [signupEmail,   setSignupEmail]   = useState('');
  const [signupPin,     setSignupPin]     = useState('');
  const [signupPin2,    setSignupPin2]    = useState('');
  const [signupErr,     setSignupErr]     = useState('');
  const [signupOk,      setSignupOk]      = useState('');
  const [signupBusy,    setSignupBusy]    = useState(false);
  const [pendingUsers,  setPendingUsers]  = useState([]);
  const [currentUser,   setCurrentUser]   = useState(null);
  const [permissions,   setPermissions]   = useState(loadPerms);
  const [goalTargets,   setGoalTargets]   = useState(loadGoalTargets);
  const [monthlyBudget, setMonthlyBudget] = useState(loadMonthlyBudget);
  const [repGoals,      setRepGoals]      = useState(loadRepGoals);
  const [editingGoal,   setEditingGoal]   = useState(null);
  const [adminTab,      setAdminTab]      = useState('goals');
  const [mainView,      setMainView]      = useState('dashboard'); // 'dashboard' | 'goals' // goal id being edited
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState('');
  const [busy,          setBusy]          = useState(false);
  const [dateStr,       setDateStr]       = useState('');
  const [greet,         setGreet]         = useState('morning');
  const [history,       setHistory]       = useState([]);
  const [dateRange,     setDateRange]     = useState('mtd');
  const [liveStats,     setLiveStats]     = useState(null);
  const [statsLoading,  setStatsLoading]  = useState(false);

  const loginRef   = useRef(null);
  const appRef     = useRef(null);
  const dashRef    = useRef(null);
  const msgsRef    = useRef(null);
  const taRef      = useRef(null);
  const sbRef      = useRef(null);
  const bgLayerRef = useRef(null);
  const floatRef   = useRef(null);
  const float2Ref  = useRef(null);
  const float3Ref  = useRef(null);
  const themeBtnRef= useRef(null);
  const stepRef    = useRef(null);

  const rangeDesc = DATE_RANGES[dateRange]?.desc || 'this month';

  const perms = currentUser ? getPerms(currentUser.email, currentUser.role, permissions) : {};

  // Load permission overrides from Supabase on login
  useEffect(() => {
    if (!currentUser) return;
    fetch('/.netlify/functions/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get', key: 'permissions' }),
    }).then(r => r.json()).then(d => {
      if (d.value && typeof d.value === 'object') {
        setPermissions(d.value);
        savePerms(d.value); // cache locally
      }
    }).catch(() => {}); // fall back to localStorage
  }, [currentUser]);
  // Merge live Windsor/HubSpot data into tiles.
  const getLiveTile = (tile) => {
    if (!liveStats) return tile;
    const h = liveStats.hubspot, rg = liveStats.rgServices;
    let val, sub, dir;
    switch (tile.key) {
      case 'google':   { const s = liveStats.google;   if (s) { val = s.spend; sub = adsPaused() ? '⏸ Paused until Jul 15 · Aeration ramp' : s.sub; dir = adsPaused() ? '' : s.dir; } break; }
      case 'meta':     { const s = liveStats.meta;      if (s) { val = s.spend; sub = s.sub; dir = s.dir; } break; }
      case 'gbp':      { const s = liveStats.gbp;       if (s) { val = s.views; sub = s.sub; dir = s.dir; } break; }
      case 'pipeline': { const s = liveStats.pipeline;  if (s) { val = s.total; sub = s.sub; dir = s.dir; } break; }
      case 'adSpend':  { const s = liveStats.adSpend;   if (s) { val = s.total; sub = 'Google Ads · this period'; } break; }
      case 'leads':       if (h) { val = h.newLeads; sub = 'new this period'; } break;
      case 'closeRate':   if (h && h.closeRate != null) { val = h.closeRate; sub = `${h.wonCount||0} won · ${h.lostCount||0} lost`; } break;
      case 'revenue':     if (h) { val = h.revenue; sub = 'closed won'; } break;
      case 'newCustomers':    if (rg) { val = rg.newCustomers; sub = 'added this period'; } break;
      case 'activeCustomers': if (rg) { val = rg.totalActive; sub = 'total active book'; } break;
      case 'cancellations':   if (rg) { val = rg.newCancels; sub = 'cancelled this period'; } break;
      case 'qbRevenue':     { const f = liveStats.finance; if (f) { val = Math.round(f.revenue); } break; }
      case 'qbGrossProfit': { const f = liveStats.finance; if (f) { val = Math.round(f.grossProfit); } break; }
      case 'qbNetIncome':   { const f = liveStats.finance; if (f) { val = Math.round(f.netIncome); } break; }
      case 'qbMargin':      { const f = liveStats.finance; if (f && f.margin != null) { val = f.margin; } break; }
      default: val = tile.val;
    }
    return {
      ...tile,
      val:  (val !== undefined && val !== null) ? val : tile.val,
      sub:  sub || tile.sub,
      dir:  dir !== undefined ? dir : tile.dir,
    };
  };

  // Get goal progress for a tile key
  const getTileGoalContext = (key) => {
    if (!liveStats) return null;
    const tileToGoal = { google: 'googleCPA', adSpend: 'adSpend', leads: 'leads', closeRate: 'closeRate' };
    const goalId = tileToGoal[key];
    if (!goalId) return null;
    const goal = GOAL_DEFS.find(g => g.id === goalId);
    if (!goal) return null;
    const actual = goal.getActual(liveStats);
    const target = getGoalTarget(goalId, goalTargets, monthlyBudget);
    if (actual === null || !target) return null;
    const pct = goal.format === 'currency-inv'
      ? Math.round(target / actual * 100)
      : Math.round(actual / target * 100);
    const status = goalStatus(actual, target, goal.format);
    return { pct, status, label: goal.label };
  };

  const visibleTiles   = ALL_TILES.filter(t => perms[t.perm]).map(getLiveTile);
  const visibleActions = currentUser?.role === 'sales'
    ? SALES_ACTIONS.filter(a => perms[a.perm])
    : ALL_ACTIONS.filter(a => perms[a.perm]);

  // ── INIT ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = new Date().getHours();
    setGreet(h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening');
    setDateStr(new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' }));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.getElementById('theme-meta');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#F2F0EC' : '#0A0A0C');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  // ── LOGIN ANIMATIONS ──────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'login') return;
    // CSS animations handle the entry effects via .login-animate class
    document.querySelector('.login-photo-bg')?.classList.add('login-animate');
    document.querySelector('.login-photo-copy')?.classList.add('login-animate');
    [floatRef, float2Ref, float3Ref].forEach((ref, i) => {
      if (!ref.current) return;
      ref.current.style.animationDelay = `${1.1 + i * 0.22}s`;
      ref.current.classList.add('float-in');
    });
    animateStep();
  }, [screen === 'login']);

  function animateStep() {
    setTimeout(() => {
      const els = document.querySelectorAll('.login-step > *');
      els.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(14px)';
        setTimeout(() => {
          el.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, 50 + i * 70);
      });
    }, 50);
  }

  // ── LOGIN LOGIC ────────────────────────────────────────────────────────
  const submitEmail = useCallback((e) => {
    e?.preventDefault();
    const val = emailInput.trim().toLowerCase();
    if (!val) { setEmailErr('Enter your work email.'); return; }
    const user = USERS.find(u => u.email === val);
    if (!user) { setEmailErr('No account found with that email.'); return; }
    setEmailErr(''); setSelectedUser(user);
    const panel = stepRef.current;
    if (!panel) { setLoginStep('pin'); return; }
    panel.style.transition = 'opacity 0.22s, transform 0.22s';
    panel.style.opacity = '0'; panel.style.transform = 'translateX(-22px)';
    setTimeout(() => {
      setLoginStep('pin'); setPin(''); setPinErr(false);
      panel.style.transform = 'translateX(22px)';
      requestAnimationFrame(() => {
        panel.style.transition = 'opacity 0.35s, transform 0.35s';
        panel.style.opacity = '1'; panel.style.transform = 'translateX(0)';
      });
      animateStep();
    }, 220);
  }, [emailInput]);

  const backToEmail = useCallback(() => {
    const panel = stepRef.current;
    if (!panel) { setLoginStep('email'); setSelectedUser(null); return; }
    panel.style.transition = 'opacity 0.22s, transform 0.22s';
    panel.style.opacity = '0'; panel.style.transform = 'translateX(22px)';
    setTimeout(() => {
      setLoginStep('email'); setSelectedUser(null); setPin(''); setPinErr(false);
      panel.style.transform = 'translateX(-22px)';
      requestAnimationFrame(() => {
        panel.style.transition = 'opacity 0.35s, transform 0.35s';
        panel.style.opacity = '1'; panel.style.transform = 'translateX(0)';
      });
      animateStep();
    }, 220);
  }, []);

  const pressKey = useCallback((val) => {
    if (pin.length >= 4) return;
    const next = pin + val;
    setPin(next);
    if (next.length === 4) setTimeout(() => checkPin(next), 200);
  }, [pin, selectedUser]);

  const delKey = useCallback(() => { setPin(p => p.slice(0, -1)); setPinErr(false); }, []);

  const doLogin = useCallback((user) => {
    saveLastUser(user.email);
    if (loginRef.current) {
      loginRef.current.style.transition = 'opacity 0.5s, transform 0.5s';
      loginRef.current.style.opacity = '0';
      loginRef.current.style.transform = 'scale(1.02)';
    }
    setTimeout(() => { setCurrentUser(user); setScreen('app'); }, 500);
  }, []);

  const checkPin = useCallback(async (p) => {
    const shake = () => {
      document.querySelector('.pin-dots')?.classList.remove('shake');
      requestAnimationFrame(() => document.querySelector('.pin-dots')?.classList.add('shake'));
    };
    // First-time setup: choose a PIN, then confirm it.
    if (pinMode === 'create') {
      setFirstPin(p); setPin(''); setPinErr(false); setEmailErr(''); setPinMode('confirm');
      return;
    }
    if (pinMode === 'confirm') {
      if (p !== firstPin) {
        setEmailErr('PINs didn’t match — choose again.'); setFirstPin(''); setPin(''); setPinErr(true); setPinMode('create'); shake();
        return;
      }
      try {
        const res = await fetch('/.netlify/functions/auth', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set-pin', email: selectedUser?.email, pin: p }),
        });
        const data = await res.json();
        if (res.ok && data.ok) { setPinMode('login'); setFirstPin(''); doLogin(data.user); return; }
        setEmailErr(data.error || 'Could not set PIN.'); setPin(''); setPinErr(true); setFirstPin(''); setPinMode('login'); shake();
      } catch { setEmailErr('Network error — try again.'); setPin(''); setPinErr(true); shake(); }
      return;
    }
    // Normal login.
    try {
      const res = await fetch('/.netlify/functions/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: selectedUser?.email, pin: p }),
      });
      const data = await res.json();
      if (res.ok && data.ok) { doLogin(data.user); return; }
      if (data.needsPinSetup) { setPinMode('create'); setPin(''); setPinErr(false); setEmailErr(''); return; }
      setPin(''); setPinErr(true); if (data.error) setEmailErr(data.error); shake();
    } catch {
      setPin(''); setPinErr(true); setEmailErr('Network error — try again.'); shake();
    }
  }, [selectedUser, doLogin, pinMode, firstPin]);

  // When the PIN screen opens for a user, ask the server whether they need to
  // create a PIN (first-time) or just enter it — so the label is right up front.
  useEffect(() => {
    if (loginStep !== 'pin' || !selectedUser?.email) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/.netlify/functions/auth', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', email: selectedUser.email }),
        });
        const d = await res.json();
        if (cancelled) return;
        setPin(''); setFirstPin(''); setPinErr(false); setEmailErr('');
        setPinMode(d.needsPinSetup ? 'create' : 'login');
      } catch { if (!cancelled) setPinMode('login'); }
    })();
    return () => { cancelled = true; };
  }, [loginStep, selectedUser]);

  const submitSignup = useCallback(async (e) => {
    e?.preventDefault();
    setSignupErr('');
    if (!signupName.trim()) { setSignupErr('Enter your full name.'); return; }
    if (!signupEmail.trim()) { setSignupErr('Enter your email.'); return; }
    if (!/^\d{4}$/.test(signupPin)) { setSignupErr('PIN must be 4 digits.'); return; }
    if (signupPin !== signupPin2) { setSignupErr('PINs do not match.'); return; }
    setSignupBusy(true);
    try {
      const res = await fetch('/.netlify/functions/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', email: signupEmail.trim().toLowerCase(), name: signupName.trim(), pin: signupPin }),
      });
      const data = await res.json();
      if (res.ok && data.ok) { setSignupOk(data.message); }
      else { setSignupErr(data.error || 'Something went wrong.'); }
    } catch { setSignupErr('Network error — try again.'); }
    finally { setSignupBusy(false); }
  }, [signupName, signupEmail, signupPin, signupPin2]);

  // Animate tile numbers when live stats arrive
  useEffect(() => {
    if (!liveStats) return;
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count);
      if (!target) return;
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const start = performance.now();
      const duration = 1400;
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
        el.textContent = prefix + Math.round(target * ease).toLocaleString() + suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, [liveStats]);
  const fetchStats = useCallback(async (range) => {
    setStatsLoading(true);
    try {
      const res = await fetch(`/.netlify/functions/stats?range=${range}`, { signal: AbortSignal.timeout(20000) });
      if (res.ok) {
        const data = await res.json();
        if (data.errors && Object.keys(data.errors).length > 0) {
          console.warn('Stats partial errors:', data.errors);
        }
        setLiveStats(data);
      } else {
        console.error('Stats function error:', res.status, await res.text());
      }
    } catch (e) {
      console.error('Stats fetch failed:', e.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch stats when app loads or dateRange changes
  useEffect(() => {
    if (screen === 'app') fetchStats(dateRange);
  }, [screen, dateRange]);

  // Fetch pending users when admin panel opens
  useEffect(() => {
    if (screen !== 'admin' || !currentUser) return;
    fetch('/.netlify/functions/auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list-pending', requester_email: currentUser.email }),
    }).then(r => r.json()).then(d => { if (d.ok) setPendingUsers(d.pending || []); }).catch(() => {});
  }, [screen, currentUser]);
  useEffect(() => {
    if (screen !== 'app') return;
    if (appRef.current) {
      appRef.current.style.transition = 'opacity 0.5s';
      appRef.current.style.opacity = '1';
    }
  }, [screen]);

  // ── SIGN OUT ─────────────────────────────────────────────────────────
  const signOut = useCallback(() => {
    setCurrentUser(null); setMessages([]); setHistory([]);
    setPin(''); setEmailInput(''); setEmailErr('');
    // Don't clear saved user — they'll go straight to PIN next time
    setLoginStep(getSavedEmail() ? 'pin' : 'email');
    setSelectedUser(getSavedEmail() ? USERS.find(u => u.email === getSavedEmail()) || null : null);
    setPinErr(false);
    setScreen('login');
    if (appRef.current) appRef.current.style.opacity = '0';
  }, []);

  const forgotUser = useCallback(() => {
    try { localStorage.removeItem('pt_last_user'); } catch {}
    setLoginStep('email'); setSelectedUser(null); setPin(''); setPinErr(false);
    animateStep();
  }, []);

  // ── MOBILE TAB HANDLER ──────────────────────────────────────────────
  const handleMobileTab = useCallback((tab) => {
    setMobileTab(tab);
    if (tab === 'chat') setHasUnreadChat(false);
    if (tab !== 'chat') setMainView(tab);
  }, []);

  // ── API ───────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (busy || !text.trim()) return;
    const loadId = Date.now() + 1;
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: text }, { id: loadId, role: 'loading' }]);
    setInput(''); setBusy(true);
    const newHist = [...history, { role: 'user', content: text }];
    const aiId = Date.now() + 2;
    try {
      const res = await fetch('/.netlify/functions/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: newHist, dateRange, userEmail: currentUser?.email, userName: currentUser?.name, userRole: currentUser?.role, liveStats }) });
      if (!res.ok || !res.body) throw new Error(`Server error: ${res.status}`);
      // Stream tokens in as they arrive — keep the loading bubble until the first token.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '', started = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        if (!started) {
          started = true;
          setMessages(prev => prev.filter(m => m.id !== loadId).concat({ id: aiId, role: 'ai', content: acc }));
        } else {
          setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: acc } : m));
        }
      }
      const reply = acc.trim() || 'No response.';
      setMessages(prev => started
        ? prev.map(m => m.id === aiId ? { ...m, content: reply } : m)
        : prev.filter(m => m.id !== loadId).concat({ id: aiId, role: 'ai', content: reply }));
      setHistory([...newHist, { role: 'assistant', content: reply }]);
      if (isMobile && mobileTab !== 'chat') setHasUnreadChat(true);
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== loadId).concat({ id: Date.now(), role: 'error', content: `Error: ${err.message}` }));
    } finally { setBusy(false); }
  }, [busy, history, isMobile, mobileTab, liveStats, dateRange, currentUser]);

  // ── MESSAGE ANIMATION ──────────────────────────────────────────────────
  const lastAnimatedId = useRef(null);
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    // Animate each bubble in only once (by id) — not on every streamed token.
    if (last.role !== 'loading' && last.id !== lastAnimatedId.current) {
      lastAnimatedId.current = last.id;
      const els = msgsRef.current?.querySelectorAll('.msg-row');
      if (els?.length) {
        const el = els[els.length - 1];
        el.style.opacity = '0'; el.style.transform = 'translateY(10px)';
        requestAnimationFrame(() => {
          el.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
          el.style.opacity = '1'; el.style.transform = 'translateY(0)';
        });
      }
    }
    // Keep following the text as it streams in.
    if (msgsRef.current) msgsRef.current.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // ── INPUT ──────────────────────────────────────────────────────────────
  const handleInput = useCallback((e) => {
    const val = e.target.value; setInput(val);
    const ta = e.target; ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 110) + 'px';
    const has = val.trim().length > 0; const sb = sbRef.current;
    if (sb) {
      sb.style.transition = 'transform 0.2s, opacity 0.2s';
      if (has && !sb.classList.contains('on')) { sb.classList.add('on'); sb.style.transform = 'scale(1)'; sb.style.opacity = '1'; }
      else if (!has && sb.classList.contains('on')) { sb.classList.remove('on'); sb.style.transform = 'scale(0.8)'; sb.style.opacity = '0.3'; }
    }
  }, []);
  const handleKeyDown = useCallback((e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }, [input, busy]);
  const handleSend = useCallback(() => {
    if (!input.trim() || busy) return;
    sendMessage(input);
    if (taRef.current) taRef.current.style.height = 'auto';
    if (sbRef.current) { sbRef.current.classList.remove('on'); sbRef.current.style.transform = 'scale(0.8)'; sbRef.current.style.opacity = '0.3'; }
  }, [input, busy, sendMessage]);

  // ── ADMIN ──────────────────────────────────────────────────────────────
  const togglePerm = useCallback((email, module) => {
    const user = USERS.find(u => u.email === email); if (!user) return;
    const cur = getPerms(email, user.role, permissions);
    const updated = { ...permissions, [email]: { ...(permissions[email]||{}), [module]: !cur[module] } };
    setPermissions(updated); savePerms(updated); savePermsRemote(updated, currentUser?.email);
  }, [permissions, currentUser]);

  // ── MARKDOWN RENDERER ──────────────────────────────────────────────────
  const inlineFormat = (text) => {
    if (!text) return null;
    text = text.replace(/^[\u{1F000}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+\s*/gu, '');
    return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).map((p, i) => {
      if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2,-2)}</strong>;
      if (p.startsWith('`')  && p.endsWith('`'))  return <code key={i} className="ai-code">{p.slice(1,-1)}</code>;
      return p;
    });
  };

  const renderAI = (content) => {
    const lines = content.split('\n');
    const out = []; let i = 0, tBuf = [], lBuf = [];
    const flushList = () => { if (!lBuf.length) return; out.push(<ul key={`l${i}`} className="ai-list">{lBuf.map((t,j)=><li key={j}>{inlineFormat(t)}</li>)}</ul>); lBuf = []; };
    const flushTable = () => {
      if (tBuf.length < 2) { tBuf = []; return; }
      const hdrs = tBuf[0].split('|').map(c=>c.trim()).filter(Boolean);
      const rows = tBuf.slice(2).map(r=>r.split('|').map(c=>c.trim()).filter(Boolean)).filter(r=>r.length);
      out.push(<div key={`t${i}`} className="ai-table-wrap"><table className="ai-table"><thead><tr>{hdrs.map((h,j)=><th key={j}>{inlineFormat(h)}</th>)}</tr></thead><tbody>{rows.map((r,j)=><tr key={j}>{r.map((c,k)=><td key={k}>{inlineFormat(c)}</td>)}</tr>)}</tbody></table></div>);
      tBuf = [];
    };
    while (i < lines.length) {
      const ln = lines[i];
      if (/^---+$/.test(ln.trim())) { flushList(); flushTable(); i++; continue; }
      if (ln.trim().startsWith('|')) { flushList(); tBuf.push(ln.trim()); i++; continue; } else { flushTable(); }
      if (/^#{1,3}\s/.test(ln)) { flushList(); const t = ln.replace(/^#{1,3}\s/,'').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{26FF}]+/gu,'').trim(); if(t) out.push(<div key={`h${i}`} className="ai-heading">{inlineFormat(t)}</div>); i++; continue; }
      if (/^[\d]+\.\s/.test(ln.trim()) || /^[-*]\s/.test(ln.trim())) { lBuf.push(ln.replace(/^[\d]+\.\s|^[-*]\s/,'')); i++; continue; }
      if (!ln.trim()) { flushList(); i++; continue; }
      flushList(); out.push(<p key={`p${i}`}>{inlineFormat(ln.trim())}</p>); i++;
    }
    flushList(); flushTable();
    return out.filter(Boolean);
  };

  const renderMsg = (msg) => {
    if (msg.role === 'user') return (
      <div key={msg.id} className="msg-row msg-row-user">
        <div className="msg-user">{msg.content}</div>
      </div>
    );
    if (msg.role === 'loading') return (
      <div key={msg.id} className="msg-row msg-row-ai">
        <div className="msg-ai-wrap">
          <div className="ai-av-small"><PTMark size={11} color="var(--accent)"/></div>
          <div className="loading-lines"><div className="skel w75"/><div className="skel w100"/><div className="skel w55"/></div>
        </div>
      </div>
    );
    if (msg.role === 'error') return (
      <div key={msg.id} className="msg-row msg-row-ai">
        <div className="msg-error">{msg.content}</div>
      </div>
    );
    return (
      <div key={msg.id} className="msg-row msg-row-ai">
        <div className="msg-ai-wrap">
          <div className="ai-av-small"><PTMark size={11} color="var(--accent)"/></div>
          <div className="ai-body">
            <div className="ai-sender">Pure Turf AI</div>
            <div className="ai-content">{renderAI(msg.content)}</div>
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <div className="bg-atmo"><div className="bg-layer" ref={bgLayerRef}/><div className="bg-noise"/></div>

      {/* ── LOGIN ── */}
      {screen === 'login' && (
        <div className="login-screen" ref={loginRef}>
          <div className="login-photo">
            <img src={theme === 'light' ? '/essential-house2.jpg' : '/lawn-dusk.jpg'} className="login-photo-img" alt="" aria-hidden="true" onError={e => e.target.style.display='none'}/>
            <div className="login-photo-bg"/>
            <div className="login-photo-content">
              <div className="login-photo-logo"><PTLockup width={180} color="white"/></div>
              <div className="login-photo-copy">
                <h2>"Raising the standard of lawn care through professionalism and integrity."</h2>
                <p>— David Patton, Founder · Pure Turf LLC</p>
              </div>
            </div>
            <div className="login-float lf-1" ref={floatRef}><div className="login-float-lbl">Google · MTD</div><div className="login-float-val">$89</div><div className="login-float-sub">↑ avg CPA · 108 conv</div></div>
            <div className="login-float lf-2" ref={float2Ref}><div className="login-float-lbl">GBP · This Week</div><div className="login-float-val lf-val-sm">47</div><div className="login-float-sub">↑ phone calls</div></div>
            <div className="login-float lf-3" ref={float3Ref}><div className="login-float-lbl">Pipeline · 2026</div><div className="login-float-val">1,617</div><div className="login-float-sub">active deals</div></div>
          </div>
          <div className="login-form-panel">
            <div ref={stepRef} className="login-step">
              {loginStep === 'signup' ? (
                <>
                  <div className="login-logo"><PTLockup width={160} color="var(--text)"/></div>
                  <div className="login-heading">Request access</div>
                  <div className="login-sub">An admin will approve your account.</div>
                  {signupOk ? (
                    <div className="signup-ok">
                      <div className="signup-ok-icon">✓</div>
                      <div className="signup-ok-msg">{signupOk}</div>
                      <button className="email-submit" style={{marginTop:16}} onClick={()=>{setLoginStep('email');setSignupOk('');setSignupName('');setSignupEmail('');setSignupPin('');setSignupPin2('');}}>Back to sign in</button>
                    </div>
                  ) : (
                    <form className="email-form" onSubmit={submitSignup}>
                      <input className="email-input" placeholder="Full name" value={signupName} onChange={e=>setSignupName(e.target.value)} autoComplete="name"/>
                      <input className="email-input" type="email" placeholder="Work email" value={signupEmail} onChange={e=>setSignupEmail(e.target.value)} autoComplete="email"/>
                      <div className="signup-pin-row">
                        <input className="email-input" type="password" inputMode="numeric" maxLength={4} placeholder="Choose PIN (4 digits)" value={signupPin} onChange={e=>setSignupPin(e.target.value.replace(/\D/g,'').slice(0,4))}/>
                        <input className="email-input" type="password" inputMode="numeric" maxLength={4} placeholder="Confirm PIN" value={signupPin2} onChange={e=>setSignupPin2(e.target.value.replace(/\D/g,'').slice(0,4))}/>
                      </div>
                      {signupErr && <div className="email-err">{signupErr}</div>}
                      <button type="submit" className="email-submit" disabled={signupBusy}>{signupBusy?'Submitting…':'Request access'}</button>
                      <button type="button" className="forgot-link" style={{marginTop:10}} onClick={()=>{setLoginStep('email');setSignupErr('');}}>Already have an account? Sign in</button>
                    </form>
                  )}
                </>
              ) : loginStep === 'email' ? (
                <>
                  <div className="login-logo"><PTLockup width={160} color="var(--text)"/></div>
                  <div className="login-heading">Welcome back</div>
                  <div className="login-sub">Enter your email to continue</div>
                  <form className="email-form" onSubmit={submitEmail}>
                    <div className="email-field">
                      <input type="email" className={`email-input${emailErr?' error':''}`} placeholder="name@pureturfllc.com" value={emailInput} onChange={e=>{setEmailInput(e.target.value);setEmailErr('');}} autoComplete="email"/>
                      {emailErr && <div className="email-err">{emailErr}</div>}
                    </div>
                    <button type="submit" className="email-submit">Continue <svg viewBox="0 0 16 16" width="13" height="13" stroke="currentColor" strokeWidth="1.5" fill="none"><path d="M3 8h10M9 4l4 4-4 4"/></svg></button>
                  </form>
                  <button className="forgot-link" style={{marginTop:10}} onClick={()=>{setLoginStep('signup');setSignupErr('');setSignupOk('');}}>New here? Request access →</button>
                </>
              ) : (
                <>
                  <div className="login-logo"><PTLockup width={160} color="var(--text)"/></div>
                  <button className="back-to-users" onClick={backToEmail}>
                    <svg viewBox="0 0 16 16" width="11" height="11" stroke="currentColor" strokeWidth="1.5" fill="none"><path d="M10 12L6 8l4-4"/></svg>
                    {selectedUser?.email}
                  </button>
                  <div className="pin-user-av">{selectedUser?.initials}</div>
                  <div className="login-heading">{selectedUser?.name}</div>
                  <div className="login-sub">{pinMode === 'create' ? 'Create a 4-digit PIN' : pinMode === 'confirm' ? 'Re-enter to confirm' : 'Enter your PIN'}</div>
                  <div className="pin-dots">{[0,1,2,3].map(i=><div key={i} className={`pin-dot${pin.length>i?' filled':''}`}/>)}</div>
                  {pinErr && pinMode === 'login' && <div className="pin-err">Incorrect PIN — try again</div>}
                  {emailErr && <div className="pin-err">{emailErr}</div>}
                  <div className="pin-pad">
                    {[1,2,3,4,5,6,7,8,9].map(n=><button key={n} className="pin-key" onClick={()=>pressKey(String(n))}>{n}</button>)}
                    <button className="pin-key blank"/>
                    <button className="pin-key" onClick={()=>pressKey('0')}>0</button>
                    <button className="pin-key del" onClick={delKey}>⌫</button>
                  </div>
                  <button className="forgot-link" onClick={forgotUser}>Use a different account</button>
                </>
              )}
            </div>
            <button className="theme-btn login-theme-btn" ref={themeBtnRef} onClick={toggleTheme}>{theme==='dark'?<SunIcon/>:<MoonIcon/>}</button>
          </div>
        </div>
      )}

      {/* ── APP ── */}
      {screen === 'app' && (
        <div className="app-shell" ref={appRef}>

          {/* SIDEBAR */}
          <nav className={`sidebar${sidebarOpen?'':' collapsed'}`}>
            <div className="sidebar-top">
              <div className="sidebar-brand">{sidebarOpen && <PTLockup width={124} color="var(--text)"/>}{!sidebarOpen && <PTMark size={22} color="var(--accent)"/>}</div>
              <button className="sidebar-collapse" onClick={()=>setSidebarOpen(o=>!o)} title={sidebarOpen?'Collapse':'Expand'}>
                <CollapseIcon collapsed={!sidebarOpen}/>
              </button>
            </div>

            <div className="sidebar-nav">
              {sidebarOpen && <div className="snav-section">Navigation</div>}
              {[
                { key:'home',      icon:'home',     label:'Dashboard' },
                { key:'goals',     icon:'goals',    label:'Goals'     },
                ...(perms.googleAds ? [{ key:'gads',  icon:'chart',    label:'Google Ads' }] : []),
                ...(perms.gbp      ? [{ key:'gbp',   icon:'gbp',      label:'GBP'        }] : []),
                ...(perms.pipeline ? [{ key:'pipe',  icon:'pipeline', label:'Pipeline'   }] : []),
                ...(perms.finance ? [{ key:'finance', icon:'finance', label:'Finance' }] : []),
                ...(perms.teamGoals ? [{ key:'score', icon:'briefing', label:'Scorecard' }] : []),
                ...(perms.teamGoals ? [{ key:'search', icon:'chart', label:'Search & Visibility' }] : []),
              ].map(item => (
                <button key={item.key}
                  className={`snav-btn${
                    (mainView==='dashboard' && item.key==='home') ||
                    (mainView==='goals'     && item.key==='goals') ||
                    (mainView==='google-ads'&& item.key==='gads') ||
                    (mainView==='gbp'       && item.key==='gbp') ||
                    (mainView==='pipeline'  && item.key==='pipe') ||
                    (mainView==='scorecard' && item.key==='score') ||
                    (mainView==='finance'   && item.key==='finance') ||
                    (mainView==='search'    && item.key==='search') ? ' active' : ''}`}
                  title={item.label}
                  onClick={() => {
                    if (item.key === 'home')  { setMobileTab('dashboard'); setMainView('dashboard'); }
                    else if (item.key === 'goals') { setMobileTab('goals'); setMainView('goals'); }
                    else if (item.key === 'gads')  { setMobileTab('google-ads'); setMainView('google-ads'); }
                    else if (item.key === 'gbp')   { setMobileTab('dashboard'); setMainView('gbp'); }
                    else if (item.key === 'pipe')  { setMobileTab('pipeline'); setMainView('pipeline'); }
                    else if (item.key === 'score') { setMobileTab('dashboard'); setMainView('scorecard'); }
                    else if (item.key === 'finance'){ setMobileTab('dashboard'); setMainView('finance'); }
                    else if (item.key === 'search'){ setMobileTab('dashboard'); setMainView('search'); }
                  }}>
                  <Icon name={item.icon} size={16}/>
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              ))}
            </div>

            <div className="sidebar-footer">
              <button className="snav-btn snav-theme" ref={themeBtnRef} onClick={toggleTheme} title="Toggle theme">
                {theme==='dark' ? <SunIcon/> : <MoonIcon/>}
                {sidebarOpen && <span>{theme==='dark' ? 'Light mode' : 'Dark mode'}</span>}
              </button>
              {perms.adminPanel && (
                <button className="snav-btn" title="Admin" onClick={()=>setScreen('admin')}>
                  <Icon name="admin" size={16}/>{sidebarOpen && <span>Admin</span>}
                </button>
              )}
              <button className="snav-btn snav-user" onClick={signOut} title="Sign out">
                <div className="snav-av">{currentUser?.initials}</div>
                {sidebarOpen && <div className="snav-user-info"><div className="snav-name">{currentUser?.name.split(' ')[0]}</div><div className="snav-role">Sign out</div></div>}
              </button>
            </div>
          </nav>

          {/* MAIN */}
          <div className="main-area">

            {/* MOBILE HEADER */}
            {isMobile && (
              <header className="mobile-header">
                <span className="mobile-header-title">
                  {mobileTab === 'chat' ? 'Pure Turf AI' : mobileTab === 'goals' ? 'Goals' : mobileTab === 'google-ads' ? 'Google Ads' : mobileTab === 'pipeline' ? 'Pipeline' : 'Dashboard'}
                </span>
                <div className="mobile-header-right">
                  {mobileTab !== 'chat' && (
                    <select className="range-picker" value={dateRange} onChange={e=>setDateRange(e.target.value)}>
                      {Object.entries(DATE_RANGES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                    </select>
                  )}
                  <button className="theme-toggle-mobile" onClick={toggleTheme} aria-label="Toggle theme">
                    {theme === 'dark' ? <SunIcon/> : <MoonIcon/>}
                  </button>
                  <button className="user-badge-mobile" onClick={signOut} aria-label="Sign out">
                    {currentUser?.initials}
                  </button>
                </div>
              </header>
            )}

            {/* CONTENT: split dashboard + chat */}
            <div className="split-area">

              {/* LEFT: DASHBOARD */}
              <div className={`left-col${isMobile ? (mobileTab !== 'chat' ? ' mobile-active' : ' mobile-hidden') : ''}`} ref={dashRef}>

                {/* Left column header with date range picker — desktop only */}
                {!isMobile && (
                <div className="left-col-hdr">
                  <select className="range-picker" value={dateRange} onChange={e=>setDateRange(e.target.value)}>
                    {Object.entries(DATE_RANGES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                )}

                <DataHealthBanner liveStats={liveStats} statsLoading={statsLoading}/>


                {/* DASHBOARD VIEW */}
                <div className="dash-col" style={{display: mainView === 'dashboard' ? undefined : 'none'}}>
                <div className="dash-scroll" key={dateRange}>

                  {/* Metric cards — grouped: Marketing · Sales · Customers */}
                  {visibleTiles.length > 0 && (() => {
                    const ERR_SRC = { google:'google', meta:'meta', gbp:'gbp', pipeline:'hubspot', leads:'hubspot', closeRate:'hubspot', revenue:'hubspot', newCustomers:'rgServices', activeCustomers:'rgServices', cancellations:'rgServices', qbRevenue:'finance', qbGrossProfit:'finance', qbNetIncome:'finance', qbMargin:'finance' };
                    const tileErrored = (k) => !!liveStats?.errors?.[ERR_SRC[k]];
                    const ORDER = ['Sales','Customers','Finance','Marketing'];
                    const groups = ORDER.map(g => ({ g, tiles: visibleTiles.filter(t => (t.group||'Other') === g) })).filter(x => x.tiles.length);
                    const other = visibleTiles.filter(t => !ORDER.includes(t.group));
                    if (other.length) groups.push({ g:'Other', tiles: other });
                    return (
                    <div className="metrics-section">
                      {groups.map(({ g, tiles }) => (
                        <div key={g} className="metric-group">
                          <div className="metric-group-label">{g} · {DATE_RANGES[dateRange]?.label}</div>
                          <div className="metric-stack">
                            {tiles.map(t => {
                              const errored = tileErrored(t.key);
                              const gc = getTileGoalContext(t.key);
                              return (
                                <div key={t.key} className={`metric-card metric-hero${statsLoading?' loading':''}`} onClick={()=>sendMessage(`Break down ${t.lbl} for ${rangeDesc} — performance, trends, action items.`)}>
                                  <div className="mc-glow"/>
                                  <div className="mc-label">{t.lbl}</div>
                                  {statsLoading
                                    ? <div className="mc-value-skeleton"/>
                                    : errored
                                      ? <div className="mc-value" style={{opacity:0.5}}>–</div>
                                      : <div className="mc-value" data-count={t.val} data-prefix={t.prefix} data-suffix={t.suffix||''}>{t.prefix}{liveStats ? t.val.toLocaleString() : '0'}{t.suffix||''}</div>
                                  }
                                  <div className={`mc-sub${t.dir?' '+t.dir:''}`}>{errored ? '⚠ unavailable' : t.sub}</div>
                                  {gc && !errored && (
                                    <div className={`mc-goal-ctx mc-goal-${gc.status}`}>{gc.pct}% of {gc.label} target</div>
                                  )}
                                  <div className="mc-footer">
                                    <span>{statsLoading ? 'Loading…' : errored ? '⚠ data unavailable' : 'Live data · click for breakdown'}</span>
                                    <div className="mc-arrow"><Icon name="arrowR" size={12}/></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    );
                  })()}

                  {/* Action rows */}
                  <div style={{ height: 32 }}/>
                </div>
              </div>{/* /dash-col */}

                {/* GOALS VIEW */}
                <div className="goals-col" style={{display: mainView === 'goals' ? undefined : 'none'}}>
                  <GoalsView currentUser={currentUser} liveStats={liveStats} statsLoading={statsLoading}
                    dateRange={dateRange} goalTargets={goalTargets} monthlyBudget={monthlyBudget}
                    repGoals={repGoals} editingGoal={editingGoal} setEditingGoal={setEditingGoal}
                    setGoalTargets={setGoalTargets} sendMessage={sendMessage}/>
                </div>

                {/* GOOGLE ADS VIEW */}
                <div className="goals-col" style={{display: mainView === 'google-ads' ? undefined : 'none'}}>
                  <GoogleAdsView key={dateRange} liveStats={liveStats} statsLoading={statsLoading} dateRange={dateRange} sendMessage={sendMessage}/>
                </div>

                {/* GBP VIEW */}
                <div className="goals-col" style={{display: mainView === 'gbp' ? undefined : 'none'}}>
                  <GBPView key={dateRange} liveStats={liveStats} statsLoading={statsLoading} dateRange={dateRange} sendMessage={sendMessage}/>
                </div>

                {/* PIPELINE VIEW */}
                <div className="goals-col" style={{display: mainView === 'pipeline' ? undefined : 'none'}}>
                  <PipelineView key={dateRange} liveStats={liveStats} statsLoading={statsLoading} dateRange={dateRange} sendMessage={sendMessage}/>
                </div>

                {/* SCORECARD VIEW */}
                <div className="goals-col" style={{display: mainView === 'scorecard' ? undefined : 'none'}}>
                  {mainView === 'scorecard' && <ScorecardView key={dateRange} liveStats={liveStats} dateRange={dateRange} sendMessage={sendMessage}/>}
                </div>

                {/* FINANCE VIEW */}
                <div className="goals-col" style={{display: mainView === 'finance' ? undefined : 'none'}}>
                  {mainView === 'finance' && <FinanceView sendMessage={sendMessage}/>}
                </div>

                {/* SEARCH & VISIBILITY VIEW */}
                <div className="goals-col" style={{display: mainView === 'search' ? undefined : 'none'}}>
                  {mainView === 'search' && <SearchVisibilityView sendMessage={sendMessage}/>}
                </div>

              </div>{/* /left-col */}

              {/* RIGHT: CHAT PANEL */}
              <div className={`chat-panel${isMobile ? (mobileTab === 'chat' ? ' mobile-active' : ' mobile-hidden') : ''}`}>
                <div className="chat-panel-hdr">
                  <div className="cp-hdr-left">
                    <span className="cp-title">Pure Turf AI</span>
                    <span className="cp-live-dot"/>
                    <span className="cp-sub">{busy ? 'Thinking…' : 'Live'}</span>
                  </div>
                  <div className="cp-hdr-right">
                    {messages.length > 0 && (
                      <button className="cp-clear" onClick={()=>{setMessages([]);setHistory([]);}}>New chat</button>
                    )}
                  </div>
                </div>

                <div className="chat-messages" ref={msgsRef}>
                  {messages.length === 0 && (
                    <div className="chat-empty">
                      <div className="ce-mark"><PTMark size={40} color="var(--accent)"/></div>
                      <div className="ce-title">Good {greet}, {currentUser?.name?.split(' ')[0]}.</div>
                      <div className="ce-sub">Ask me anything about Pure Turf's performance. I have live access to Google Ads, GBP, and your HubSpot pipeline.</div>
                    </div>
                  )}
                  {messages.map(renderMsg)}
                </div>

                {/* Suggestions — always visible, collapses after first message */}
                {messages.length === 0 && (
                  <div className="chat-suggestions">
                    <div className="sugg-label">Suggested questions</div>
                    <div className="sugg-list">
                      {visibleActions.map(a => (
                        <button key={a.label} className="sugg-item"
                          onClick={() => sendMessage(a.prompt.replace('this month', rangeDesc).replace('this week', rangeDesc))}>
                          <div className="sugg-ico">
                            <Icon name={a.icon==='briefing'?'briefing':a.icon==='chart'?'chart':a.icon==='meta'?'meta':a.icon==='gbp'?'gbp':'pipeline'} size={13}/>
                          </div>
                          <div className="sugg-body">
                            <div className="sugg-title">{a.label}</div>
                            <div className="sugg-sub">{a.sub}</div>
                          </div>
                          <div className="sugg-send">
                            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M2 8h10M8 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="chat-input-area">
                  <div className="chat-input-inner">
                    <textarea ref={taRef} className="chat-ta" rows={1} value={input} onChange={handleInput} onKeyDown={handleKeyDown}
                      placeholder={currentUser?.role==='sales'?'Ask about your pipeline...':'Ask about performance, pipeline, or campaigns...'}/>
                    <button ref={sbRef} className="send-btn" onClick={handleSend}><Icon name="send" size={13}/></button>
                  </div>
                </div>
              </div>

            </div>{/* /split-area */}

            {/* MOBILE BOTTOM TAB BAR */}
            {isMobile && (
            <nav className="bottom-tab-bar" role="tablist">
              <button className={`tab-item${mobileTab==='dashboard'?' active':''}`} onClick={()=>handleMobileTab('dashboard')} aria-label="Home">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
                <span className="tab-label">Home</span>
              </button>
              <button className={`tab-item${mobileTab==='goals'?' active':''}`} onClick={()=>handleMobileTab('goals')} aria-label="Goals">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6-6 6 6"/><path d="M12 3v14"/><path d="M5 21h14"/></svg>
                <span className="tab-label">Goals</span>
              </button>
              <button className={`tab-item${mobileTab==='google-ads'?' active':''}`} onClick={()=>handleMobileTab('google-ads')} aria-label="Ads">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-7 4 4 5-9"/></svg>
                <span className="tab-label">Ads</span>
              </button>
              <button className={`tab-item${mobileTab==='pipeline'?' active':''}`} onClick={()=>handleMobileTab('pipeline')} aria-label="Pipeline">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v3l-6 5v6l-4 2v-8L4 7z"/></svg>
                <span className="tab-label">Pipeline</span>
              </button>
              <button className={`tab-item${mobileTab==='chat'?' active':''}`} onClick={()=>handleMobileTab('chat')} aria-label="Chat" style={{position:'relative'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12c0 4.418-4.03 8-9 8-1.4 0-2.73-.25-3.9-.7L3 21l1.5-4.2C3.56 15.36 3 13.74 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                <span className="tab-label">AI Chat</span>
                {hasUnreadChat && <span className="tab-badge"/>}
              </button>
            </nav>
            )}

          </div>{/* /main-area */}
        </div>
      )}

      {/* ── ADMIN ── */}
      {screen === 'admin' && (
        <AdminPanel
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentUser={currentUser}
          signOut={signOut}
          toggleTheme={toggleTheme}
          themeBtnRef={themeBtnRef}
          theme={theme}
          setScreen={setScreen}
          perms={perms}
          permissions={permissions}
          togglePerm={togglePerm}
          goalTargets={goalTargets}
          setGoalTargets={setGoalTargets}
          monthlyBudget={monthlyBudget}
          setMonthlyBudget={setMonthlyBudget}
          repGoals={repGoals}
          setRepGoals={setRepGoals}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          pendingUsers={pendingUsers}
          setPendingUsers={setPendingUsers}
        />
      )}

          </>
  );
}

export default function App() {
  return React.createElement(ErrorBoundary, null, React.createElement(AppInner));
}
