// Windsor → QuickBooks (Profit & Loss + Chart of Accounts).
// Windsor exposes QuickBooks on a dedicated /quickbooks endpoint; the report is chosen
// by the field PREFIX (profitandloss__ vs accounts__), date by date_preset, and the
// connected company by select_accounts. Valid presets: this_month | this_year | last_year.
const QB_BASE = 'https://connectors.windsor.ai/quickbooks';
const QB_ACCOUNT = 'kurt@pureturfllc.com_184633936'; // the connected QuickBooks company

// Map the dashboard's range keys to QuickBooks date presets (P&L is monthly/annual).
export function qbPreset(rangeKey) {
  if (rangeKey === 'mtd') return 'this_month';
  if (rangeKey === 'last_year') return 'last_year';
  return 'this_year'; // ytd / 7d / 30d / 90d all roll up to this_year for finance
}

const PL = ['income', 'cogs', 'grossprofit', 'expenses', 'netoperatingincome', 'otherincome', 'otherexpenses', 'netotherincome', 'netincome'];

async function qbFetch(apiKey, fields, datePreset) {
  const url = `${QB_BASE}?api_key=${apiKey}&date_preset=${datePreset}&fields=${fields}&select_accounts=${encodeURIComponent(QB_ACCOUNT)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(9000) });
  if (!res.ok) throw new Error(`QuickBooks ${res.status}: ${(await res.text()).slice(0, 120)}`);
  return (await res.json()).data || [];
}

// Profit & Loss summary for the period.
export async function fetchQuickBooksPL(apiKey, datePreset = 'this_year') {
  const rows = await qbFetch(apiKey, PL.map(f => `profitandloss__${f}`).join(','), datePreset);
  const r = rows[0] || {};
  const num = k => parseFloat(r[`profitandloss__${k}`]) || 0;
  const revenue = num('income');
  const netIncome = num('netincome');
  return {
    period: datePreset,
    revenue,
    cogs: num('cogs'),
    grossProfit: num('grossprofit'),
    operatingExpenses: num('expenses'),
    netOperatingIncome: num('netoperatingincome'),
    otherIncome: num('otherincome'),
    otherExpenses: num('otherexpenses'),
    netIncome,
    // Total expenses = everything between revenue and net income.
    totalExpenses: Math.round((revenue - netIncome) * 100) / 100,
    margin: revenue > 0 ? Math.round((netIncome / revenue) * 1000) / 10 : null,
  };
}

// Combined P&L + balances for a period.
export async function fetchQuickBooks(apiKey, datePreset = 'this_year') {
  const [pl, bal] = await Promise.all([
    fetchQuickBooksPL(apiKey, datePreset),
    fetchQuickBooksBalances(apiKey, datePreset).catch(() => ({ accountsReceivable: null, cash: null })),
  ]);
  return { ...pl, ...bal };
}

// Accounts Receivable + cash from the chart-of-accounts current balances.
export async function fetchQuickBooksBalances(apiKey, datePreset = 'this_year') {
  const rows = await qbFetch(apiKey, 'accounts__name,accounts__accounttype,accounts__currentbalance', datePreset);
  let accountsReceivable = 0, cash = 0;
  for (const a of rows) {
    const type = (a.accounts__accounttype || '').toLowerCase();
    const bal = parseFloat(a.accounts__currentbalance) || 0;
    if (type.includes('receivable')) accountsReceivable += bal;
    if (type.includes('bank')) cash += bal;
  }
  return { accountsReceivable: Math.round(accountsReceivable), cash: Math.round(cash) };
}
