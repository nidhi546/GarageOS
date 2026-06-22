import type { HanaPayment } from '../api/paymentApi';
import type { HanaInvoice } from '../api/invoiceApi';
import type { HanaJobCard } from '../api/jobcardApi';

// ─── Period ───────────────────────────────────────────────────────────────────

export type Period = 'today' | 'week' | 'month';

export interface DateRange {
  start: Date;
  end:   Date;
}

// ─── Output types ─────────────────────────────────────────────────────────────

export interface PaymentBreakdownItem {
  mode:    string;
  amount:  number;
  percent: number; // 0-100
}

export interface JobStats {
  total:      number;
  completed:  number;
  inProgress: number;
  pending:    number;
  cancelled:  number;
}

export interface PendingBreakdown {
  overdue: number;  // unpaid invoices older than 7 days
  partial: number;  // partial payment received, balance remaining
  fresh:   number;  // new unpaid invoices (≤ 7 days old)
}

export interface OutstandingItem {
  invoiceId:     string;
  invoiceNumber: string;
  jobcardId:     string;
  grandTotal:    number;
  amountPaid:    number;
  balanceDue:    number;
  paymentStatus: string;
  createdAt?:    string;
}

export interface MechanicRevenueItem {
  mechanicId:   string;
  mechanicName: string;
  revenue:      number;
}

export interface ServiceRevenueItem {
  serviceName: string;
  revenue:     number;
  count:       number;
}

export interface DailyEarning {
  date:   string;  // "YYYY-MM-DD"
  label:  string;  // "Mon", "01", "01 Apr"
  amount: number;
}

export interface RevenueMetrics {
  totalRevenue:       number;
  pendingCollections: number;
  pendingBreakdown:   PendingBreakdown;
  growthPercent:      number;
  breakdown:          PaymentBreakdownItem[];
  jobStats:           JobStats;
  outstandingList:    OutstandingItem[];
  mechanicRevenue:    MechanicRevenueItem[];
  serviceRevenue:     ServiceRevenueItem[];
  dailyEarnings:      DailyEarning[];
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function endOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}

export function getDateRange(period: Period): DateRange {
  const now = new Date();
  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: now };

    case 'week': {
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      return { start: startOfDay(monday), end: now };
    }

    case 'month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfDay(first), end: now };
    }
  }
}

export function getPreviousRange(period: Period): DateRange {
  const now = new Date();
  switch (period) {
    case 'today': {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    }

    case 'week': {
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      const prevMonday = new Date(monday);
      prevMonday.setDate(monday.getDate() - 7);
      const prevSunday = new Date(monday);
      prevSunday.setDate(monday.getDate() - 1);
      return { start: startOfDay(prevMonday), end: endOfDay(prevSunday) };
    }

    case 'month': {
      const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastPrevMonth  = new Date(firstThisMonth);
      lastPrevMonth.setDate(0);
      const firstPrevMonth = new Date(lastPrevMonth.getFullYear(), lastPrevMonth.getMonth(), 1);
      return { start: startOfDay(firstPrevMonth), end: endOfDay(lastPrevMonth) };
    }
  }
}

export function getPeriodLabel(period: Period): string {
  switch (period) {
    case 'today': return 'yesterday';
    case 'week':  return 'last week';
    case 'month': return 'last month';
  }
}

function inRange(dateStr: string | undefined, range: DateRange): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= range.start && d <= range.end;
}

// ─── Index builders ───────────────────────────────────────────────────────────

function buildCompletedJobIds(jobcards: HanaJobCard[]): Set<string> {
  return new Set(jobcards.filter(j => j.status === 'completed').map(j => j._id));
}

function buildJobMechanicIndex(
  jobcards: HanaJobCard[],
): Map<string, { id: string; name: string }> {
  const map = new Map<string, { id: string; name: string }>();
  for (const j of jobcards) {
    if (j.assignedMechanicId) {
      map.set(j._id, {
        id:   j.assignedMechanicId,
        name: j.assignedMechanicName ?? j.assignedMechanicId,
      });
    }
  }
  return map;
}

// ─── Revenue (paid amounts from completed jobs) ───────────────────────────────

/**
 * Total revenue = payments collected within range.
 * When jobcards are provided, only payments for COMPLETED jobs are counted
 * (excludes in-progress and cancelled). When jobcards is omitted or empty,
 * all payments in range are summed (backward-compatible for dashboard).
 */
export function calcRevenue(
  payments: HanaPayment[],
  range: DateRange,
  jobcards: HanaJobCard[] = [],
): number {
  const completedIds = jobcards.length > 0 ? buildCompletedJobIds(jobcards) : null;

  return payments
    .filter(p => {
      if (!inRange(p.collectedAt, range)) return false;
      if (completedIds && !completedIds.has(p.jobcardId)) return false;
      return true;
    })
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);
}

// ─── Pending collections ──────────────────────────────────────────────────────

/**
 * Total balance due across all unpaid/partial invoices.
 * Backward-compatible: accepts invoices only (used by dashboardApi).
 */
export function calcPendingCollections(invoices: HanaInvoice[]): number {
  return invoices
    .filter(i => i.paymentStatus !== 'paid')
    .reduce((sum, i) => sum + (i.balanceDue ?? 0), 0);
}

/** Unpaid invoice count for dashboard badge. */
export function calcPendingCount(invoices: HanaInvoice[]): number {
  return invoices.filter(i => i.paymentStatus !== 'paid').length;
}

/**
 * Full pending collections breakdown — used by RevenueScreen.
 * Filters to COMPLETED jobs only; classifies by overdue / partial / fresh.
 */
export function calcPendingFull(
  invoices: HanaInvoice[],
  jobcards: HanaJobCard[],
): { total: number; breakdown: PendingBreakdown; list: OutstandingItem[] } {
  const completedIds = buildCompletedJobIds(jobcards);
  const now = Date.now();
  const OVERDUE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  const unpaid = invoices.filter(
    i => i.paymentStatus !== 'paid'
      && (i.balanceDue ?? 0) > 0
      && completedIds.has(i.jobcardId),
  );

  const breakdown: PendingBreakdown = { overdue: 0, partial: 0, fresh: 0 };
  const list: OutstandingItem[] = [];

  for (const inv of unpaid) {
    const bal = inv.balanceDue ?? 0;
    const age = inv.createdAt ? now - new Date(inv.createdAt).getTime() : 0;

    if (inv.paymentStatus === 'partial') {
      breakdown.partial += bal;
    } else if (age > OVERDUE_MS) {
      breakdown.overdue += bal;
    } else {
      breakdown.fresh += bal;
    }

    list.push({
      invoiceId:     inv._id,
      invoiceNumber: inv.invoiceNumber ?? '—',
      jobcardId:     inv.jobcardId,
      grandTotal:    inv.grandTotal ?? 0,
      amountPaid:    inv.amountPaid ?? 0,
      balanceDue:    bal,
      paymentStatus: inv.paymentStatus,
      createdAt:     inv.createdAt,
    });
  }

  list.sort((a, b) => b.balanceDue - a.balanceDue);

  return {
    total: breakdown.overdue + breakdown.partial + breakdown.fresh,
    breakdown,
    list,
  };
}

// ─── Payment breakdown by mode ────────────────────────────────────────────────

/**
 * Payment breakdown by mode with percentages, sorted largest-first.
 * When jobcards provided, only completed-job payments are counted.
 */
export function calcBreakdown(
  payments: HanaPayment[],
  range: DateRange,
  jobcards: HanaJobCard[] = [],
): PaymentBreakdownItem[] {
  const completedIds = jobcards.length > 0 ? buildCompletedJobIds(jobcards) : null;

  const filtered = payments.filter(p => {
    if (!inRange(p.collectedAt, range)) return false;
    if (completedIds && !completedIds.has(p.jobcardId)) return false;
    return true;
  });

  const total = filtered.reduce((sum, p) => sum + (p.amount ?? 0), 0);

  const byMode: Record<string, number> = {};
  for (const p of filtered) {
    const mode = (p.mode ?? 'other').toLowerCase();
    byMode[mode] = (byMode[mode] ?? 0) + (p.amount ?? 0);
  }

  return Object.entries(byMode)
    .map(([mode, amount]) => ({
      mode,
      amount,
      percent: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

// ─── Job statistics ───────────────────────────────────────────────────────────

/** Job card counts for jobs created within the range, split by status. */
export function calcJobStats(jobcards: HanaJobCard[], range: DateRange): JobStats {
  const filtered = jobcards.filter(j => inRange(j.createdAt, range));
  return {
    total:      filtered.length,
    completed:  filtered.filter(j => j.status === 'completed').length,
    inProgress: filtered.filter(
      j => j.status === 'in_progress'
        || j.status === 'assigned'
        || j.status === 'awaiting_approval'
        || j.status === 'approved_for_invoice',
    ).length,
    pending:    filtered.filter(j => j.status === 'open').length,
    cancelled:  filtered.filter(j => j.status === 'cancelled').length,
  };
}

// ─── Mechanic-wise revenue ────────────────────────────────────────────────────

/** Revenue grouped by assigned mechanic for completed jobs in range. */
export function calcMechanicRevenue(
  payments: HanaPayment[],
  jobcards: HanaJobCard[],
  range: DateRange,
): MechanicRevenueItem[] {
  const completedIds    = buildCompletedJobIds(jobcards);
  const jobToMechanic   = buildJobMechanicIndex(jobcards);

  const byMechanic: Record<string, { name: string; revenue: number }> = {};

  for (const p of payments) {
    if (!inRange(p.collectedAt, range)) continue;
    if (!completedIds.has(p.jobcardId)) continue;

    const mech = jobToMechanic.get(p.jobcardId);
    const key  = mech?.id ?? 'unassigned';
    if (!byMechanic[key]) {
      byMechanic[key] = { name: mech?.name ?? 'Unassigned', revenue: 0 };
    }
    byMechanic[key].revenue += p.amount ?? 0;
  }

  return Object.entries(byMechanic)
    .map(([mechanicId, { name, revenue }]) => ({
      mechanicId,
      mechanicName: name,
      revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

// ─── Service-wise revenue ─────────────────────────────────────────────────────

/** Revenue grouped by invoice line-item name for completed jobs in range. */
export function calcServiceRevenue(
  invoices: HanaInvoice[],
  jobcards: HanaJobCard[],
  range: DateRange,
): ServiceRevenueItem[] {
  const completedIds = buildCompletedJobIds(jobcards);
  const byService: Record<string, { revenue: number; count: number }> = {};

  for (const inv of invoices) {
    if (!inRange(inv.createdAt, range)) continue;
    if (!completedIds.has(inv.jobcardId)) continue;
    if (inv.paymentStatus === 'unpaid') continue;

    for (const item of inv.items ?? []) {
      const name = (item.name ?? 'Unknown Service').trim();
      if (!byService[name]) byService[name] = { revenue: 0, count: 0 };
      byService[name].revenue += item.amount ?? 0;
      byService[name].count  += 1;
    }
  }

  return Object.entries(byService)
    .map(([serviceName, { revenue, count }]) => ({ serviceName, revenue, count }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

// ─── Daily earnings chart ─────────────────────────────────────────────────────

/** Per-day totals within the period, every day pre-filled with ₹0. */
export function calcDailyEarnings(
  payments: HanaPayment[],
  jobcards: HanaJobCard[],
  range: DateRange,
  period: Period,
): DailyEarning[] {
  const completedIds = buildCompletedJobIds(jobcards);
  const byDay: Record<string, number> = {};

  // Pre-fill every day in range
  const cur = new Date(range.start);
  while (cur <= range.end) {
    byDay[cur.toISOString().slice(0, 10)] = 0;
    cur.setDate(cur.getDate() + 1);
  }

  for (const p of payments) {
    if (!inRange(p.collectedAt, range)) continue;
    if (!completedIds.has(p.jobcardId)) continue;
    const day = p.collectedAt.slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + (p.amount ?? 0);
  }

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS    = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => {
      const d = new Date(date);
      let label: string;
      if (period === 'week') {
        label = DAY_NAMES[d.getDay()];
      } else if (period === 'month') {
        label = String(d.getDate());
      } else {
        label = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
      }
      return { date, label, amount };
    });
}

// ─── Growth % ─────────────────────────────────────────────────────────────────

export function calcGrowthPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ─── Main aggregator ──────────────────────────────────────────────────────────

/** Compute all revenue metrics for a given period from raw API data. */
export function computeMetrics(
  payments: HanaPayment[],
  invoices: HanaInvoice[],
  jobcards: HanaJobCard[],
  period:   Period,
): RevenueMetrics {
  const range     = getDateRange(period);
  const prevRange = getPreviousRange(period);

  const totalRevenue = calcRevenue(payments, range, jobcards);
  const prevRevenue  = calcRevenue(payments, prevRange, jobcards);

  const { total: pendingCollections, breakdown: pendingBreakdown, list: outstandingList } =
    calcPendingFull(invoices, jobcards);

  return {
    totalRevenue,
    pendingCollections,
    pendingBreakdown,
    growthPercent:   calcGrowthPercent(totalRevenue, prevRevenue),
    breakdown:       calcBreakdown(payments, range, jobcards),
    jobStats:        calcJobStats(jobcards, range),
    outstandingList,
    mechanicRevenue: calcMechanicRevenue(payments, jobcards, range),
    serviceRevenue:  calcServiceRevenue(invoices, jobcards, range),
    dailyEarnings:   calcDailyEarnings(payments, jobcards, range, period),
  };
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/** Format Indian rupee amount without decimals. */
export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
