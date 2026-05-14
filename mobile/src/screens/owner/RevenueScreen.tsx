<<<<<<< HEAD
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dummyPayments } from '../../dummy/payments';
import { dummyInvoices } from '../../dummy/invoices';
=======
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { AppLoaderModal } from '../../components/common/AppLoaderModal';
import { Ionicons } from '@expo/vector-icons';
import { revenueApi, RevenueRawData } from '../../api/revenueApi';
import {
  Period,
  computeMetrics,
  getPeriodLabel,
  formatINR,
  OutstandingItem,
  MechanicRevenueItem,
  ServiceRevenueItem,
  DailyEarning,
} from '../../utils/revenueUtils';
>>>>>>> b4f26d8f (changes)
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../config/theme';

type Period = 'today' | 'week' | 'month';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

<<<<<<< HEAD
const MODE_ICON: Record<string, any> = {
  cash: 'cash-outline',
  upi: 'phone-portrait-outline',
  bank_transfer: 'business-outline',
  cheque: 'document-text-outline',
};

export const RevenueScreen: React.FC = () => {
  const [period, setPeriod] = useState<Period>('month');

  const totalRevenue = dummyPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
=======
const MODE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  cash:          'cash-outline',
  upi:           'phone-portrait-outline',
  bank_transfer: 'business-outline',
  cheque:        'document-text-outline',
  card:          'card-outline',
  online:        'globe-outline',
  other:         'ellipse-outline',
};

const MODE_LABEL: Record<string, string> = {
  cash:          'Cash',
  upi:           'UPI',
  bank_transfer: 'Bank Transfer',
  cheque:        'Cheque',
  card:          'Card',
  online:        'Online',
  other:         'Other',
};

const EMPTY_RAW: RevenueRawData = { payments: [], invoices: [], jobcards: [] };

// ─── Main screen ──────────────────────────────────────────────────────────────

export const RevenueScreen: React.FC = () => {
  const [period,     setPeriod]     = useState<Period>('month');
  const [raw,        setRaw]        = useState<RevenueRawData>(EMPTY_RAW);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(false);

  const loadData = useCallback(async () => {
    setError(false);
    try {
      const data = await revenueApi.fetchAll();
      setRaw(data);
    } catch {
      setError(true);
    }
  }, []);
>>>>>>> b4f26d8f (changes)

  const pendingAmount = dummyInvoices
    .filter(i => i.status !== 'paid' && i.status !== 'PAID')
    .reduce((sum, i) => sum + (i.balance_due ?? i.total), 0);

  const byMode = dummyPayments.reduce<Record<string, number>>((acc, p) => {
    if (p.status === 'completed') acc[p.mode] = (acc[p.mode] ?? 0) + p.amount;
    return acc;
  }, {});

<<<<<<< HEAD
  const jobStats = {
    total: 4,
    completed: 1,
    inProgress: 2,
    pending: 1,
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Period Filter */}
=======
  // All maths done in-memory — switching tabs is instant
  const metrics = useMemo(
    () => computeMetrics(raw.payments, raw.invoices, raw.jobcards, period),
    [raw, period],
  );

  const {
    totalRevenue, pendingCollections, pendingBreakdown, growthPercent,
    breakdown, jobStats, outstandingList, mechanicRevenue, serviceRevenue, dailyEarnings,
  } = metrics;

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={s.centerScreen}>
        <Ionicons name="cloud-offline-outline" size={52} color={COLORS.border} />
        <Text style={s.errorTitle}>Could not load data</Text>
        <Text style={s.errorSub}>Check your connection, then pull down to retry</Text>
        <TouchableOpacity
          style={s.retryBtn}
          onPress={() => { setLoading(true); loadData().finally(() => setLoading(false)); }}
        >
          <Text style={s.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const growthPositive = growthPercent >= 0;
  const maxDaily       = Math.max(...dailyEarnings.map(d => d.amount), 1);

  return (
    <>
      <AppLoaderModal visible={loading} message="Loading revenue data…" />
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
      {/* ── Period Filter ── */}
>>>>>>> b4f26d8f (changes)
      <View style={s.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[s.periodChip, period === p.key && s.periodActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[s.periodText, period === p.key && s.periodTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

<<<<<<< HEAD
      {/* Revenue Card */}
      <View style={s.revenueCard}>
        <Text style={s.revenueLabel}>Total Revenue</Text>
        <Text style={s.revenueValue}>₹{totalRevenue.toLocaleString('en-IN')}</Text>
        <View style={s.revenueSub}>
          <Ionicons name="trending-up" size={14} color={COLORS.success} />
          <Text style={s.revenueSubText}>+12% vs last {period}</Text>
        </View>
      </View>

      {/* Pending */}
      <View style={[s.pendingCard, pendingAmount > 0 && s.pendingAlert]}>
        <View style={s.pendingLeft}>
          <Ionicons name="alert-circle-outline" size={20} color={pendingAmount > 0 ? COLORS.danger : COLORS.textMuted} />
          <Text style={[s.pendingLabel, pendingAmount > 0 && s.pendingLabelAlert]}>Pending Collections</Text>
        </View>
        <Text style={[s.pendingValue, pendingAmount > 0 && s.pendingValueAlert]}>
          ₹{pendingAmount.toLocaleString('en-IN')}
        </Text>
=======
      {/* ── Revenue Hero Card ── */}
      <View style={s.revenueCard}>
        <Text style={s.revenueLabel}>Total Revenue</Text>
        <Text style={s.revenueValue}>{formatINR(totalRevenue)}</Text>
        <Text style={s.revenueNote}>Completed jobs · paid invoices only</Text>
        {totalRevenue === 0 ? (
          <Text style={s.noDataNote}>No payments received yet</Text>
        ) : (
          <View style={s.revenueSub}>
            <Ionicons
              name={growthPositive ? 'trending-up' : 'trending-down'}
              size={14}
              color={growthPositive ? '#86efac' : '#fca5a5'}
            />
            <Text style={s.revenueSubText}>
              {growthPositive ? '+' : ''}{growthPercent}% vs {getPeriodLabel(period)}
            </Text>
          </View>
        )}
      </View>

      {/* ── Daily Earnings Mini Chart ── */}
      {dailyEarnings.length > 1 && (
        <>
          <Text style={s.sectionTitle}>Daily Earnings</Text>
          <View style={s.chartCard}>
            <View style={s.chartBars}>
              {dailyEarnings.map(d => (
                <View key={d.date} style={s.chartBarWrap}>
                  <View style={s.chartBarTrack}>
                    <View
                      style={[
                        s.chartBarFill,
                        {
                          height: `${Math.max(
                            d.amount > 0 ? (d.amount / maxDaily) * 100 : 0,
                            d.amount > 0 ? 4 : 0,
                          )}%` as any,
                          opacity: d.amount > 0 ? 1 : 0.25,
                        },
                      ]}
                    />
                  </View>
                  <Text style={s.chartBarLabel}>{d.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      {/* ── Pending Collections ── */}
      <View style={[s.pendingCard, pendingCollections > 0 && s.pendingAlert]}>
        <View style={s.pendingTop}>
          <View style={s.pendingLeft}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={pendingCollections > 0 ? COLORS.danger : COLORS.textMuted}
            />
            <Text style={[s.pendingLabel, pendingCollections > 0 && s.pendingLabelAlert]}>
              Pending Collections
            </Text>
          </View>
          <Text style={[s.pendingValue, pendingCollections > 0 && s.pendingValueAlert]}>
            {formatINR(pendingCollections)}
          </Text>
        </View>

        {pendingCollections > 0 && (
          <View style={s.pendingChips}>
            {pendingBreakdown.overdue > 0 && (
              <View style={[s.chip, s.chipDanger]}>
                <Ionicons name="time-outline" size={11} color={COLORS.danger} />
                <Text style={[s.chipText, { color: COLORS.danger }]}>
                  Overdue {formatINR(pendingBreakdown.overdue)}
                </Text>
              </View>
            )}
            {pendingBreakdown.partial > 0 && (
              <View style={[s.chip, s.chipWarning]}>
                <Ionicons name="ellipse-outline" size={11} color={COLORS.warning} />
                <Text style={[s.chipText, { color: COLORS.warning }]}>
                  Partial {formatINR(pendingBreakdown.partial)}
                </Text>
              </View>
            )}
            {pendingBreakdown.fresh > 0 && (
              <View style={[s.chip, s.chipInfo]}>
                <Ionicons name="add-circle-outline" size={11} color={COLORS.info} />
                <Text style={[s.chipText, { color: COLORS.info }]}>
                  New {formatINR(pendingBreakdown.fresh)}
                </Text>
              </View>
            )}
          </View>
        )}
>>>>>>> b4f26d8f (changes)
      </View>

      {/* Payment Breakdown */}
      <Text style={s.sectionTitle}>Payment Breakdown</Text>
<<<<<<< HEAD
      {Object.entries(byMode).map(([mode, amount]) => (
        <View key={mode} style={s.modeCard}>
          <View style={s.modeIcon}>
            <Ionicons name={MODE_ICON[mode] ?? 'card-outline'} size={18} color={COLORS.primary} />
=======

      {breakdown.length === 0 ? (
        <EmptyCard icon="bar-chart-outline" text="No payments in this period" />
      ) : (
        breakdown.map(({ mode, amount, percent }) => (
          <View key={mode} style={s.modeCard}>
            <View style={s.modeIcon}>
              <Ionicons
                name={MODE_ICON[mode] ?? 'card-outline'}
                size={18}
                color={COLORS.primary}
              />
            </View>
            <Text style={s.modeName}>
              {MODE_LABEL[mode] ?? mode.replace(/_/g, ' ')}
            </Text>
            <View style={s.modeBar}>
              <View style={[s.modeBarFill, { width: `${Math.min(percent, 100)}%` as any }]} />
            </View>
            <Text style={s.modePercent}>{percent}%</Text>
            <Text style={s.modeAmount}>{formatINR(amount)}</Text>
>>>>>>> b4f26d8f (changes)
          </View>
          <Text style={s.modeName}>{mode.replace('_', ' ').toUpperCase()}</Text>
          <View style={s.modeBar}>
            <View style={[s.modeBarFill, { width: `${Math.min((amount / totalRevenue) * 100, 100)}%` }]} />
          </View>
          <Text style={s.modeAmount}>₹{amount.toLocaleString('en-IN')}</Text>
        </View>
      ))}

      {/* Job Stats */}
      <Text style={s.sectionTitle}>Job Statistics</Text>
<<<<<<< HEAD
      <View style={s.jobStatsGrid}>
        {[
          { label: 'Total Jobs',  value: jobStats.total,      color: COLORS.primary },
          { label: 'Completed',   value: jobStats.completed,  color: COLORS.success },
          { label: 'In Progress', value: jobStats.inProgress, color: COLORS.info },
          { label: 'Pending',     value: jobStats.pending,    color: COLORS.warning },
        ].map(stat => (
          <View key={stat.label} style={s.jobStatCard}>
            <Text style={[s.jobStatValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={s.jobStatLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
=======

      {jobStats.total === 0 ? (
        <EmptyCard icon="construct-outline" text="No jobs in this period" />
      ) : (
        <View style={s.jobStatsGrid}>
          {([
            { label: 'Total Jobs',  value: jobStats.total,      color: COLORS.primary },
            { label: 'Completed',   value: jobStats.completed,  color: COLORS.success },
            { label: 'In Progress', value: jobStats.inProgress, color: COLORS.info    },
            { label: 'Pending',     value: jobStats.pending,    color: COLORS.warning },
            { label: 'Cancelled',   value: jobStats.cancelled,  color: COLORS.danger  },
          ] as const).map(stat => (
            <View key={stat.label} style={s.jobStatCard}>
              <Text style={[s.jobStatValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={s.jobStatLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Outstanding Dues ── */}
      {outstandingList.length > 0 && (
        <>
          <SectionHeader title="Outstanding Dues" count={outstandingList.length} />
          {outstandingList.slice(0, 5).map(item => (
            <OutstandingRow key={item.invoiceId} item={item} />
          ))}
          {outstandingList.length > 5 && (
            <Text style={s.seeAll}>
              +{outstandingList.length - 5} more outstanding invoices
            </Text>
          )}
        </>
      )}

      {/* ── Mechanic Revenue ── */}
      {mechanicRevenue.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Mechanic-wise Revenue</Text>
          {mechanicRevenue.map(item => (
            <MechanicRow
              key={item.mechanicId}
              item={item}
              topRevenue={mechanicRevenue[0].revenue}
            />
          ))}
        </>
      )}

      {/* ── Service Revenue ── */}
      {serviceRevenue.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Top Services by Revenue</Text>
          {serviceRevenue.map(item => (
            <ServiceRow
              key={item.serviceName}
              item={item}
              topRevenue={serviceRevenue[0].revenue}
            />
          ))}
        </>
      )}
>>>>>>> b4f26d8f (changes)
    </ScrollView>
    </>
  );
};

<<<<<<< HEAD
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: 100 },
  periodRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.md },
  periodChip: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border },
  periodActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodText: { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  periodTextActive: { color: '#fff' },
  revenueCard: { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.sm, alignItems: 'center' },
  revenueLabel: { fontSize: FONT.sizes.sm, color: 'rgba(255,255,255,0.8)', marginBottom: SPACING.xs },
  revenueValue: { fontSize: 40, fontWeight: '800', color: '#fff', marginBottom: SPACING.xs },
  revenueSub: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  revenueSubText: { fontSize: FONT.sizes.sm, color: 'rgba(255,255,255,0.9)' },
  pendingCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm },
  pendingAlert: { backgroundColor: COLORS.dangerLight, borderWidth: 1, borderColor: COLORS.danger + '40' },
  pendingLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  pendingLabel: { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
=======
// ─── Shared sub-components ────────────────────────────────────────────────────

const EmptyCard: React.FC<{ icon: keyof typeof Ionicons.glyphMap; text: string }> = ({
  icon, text,
}) => (
  <View style={s.emptyCard}>
    <Ionicons name={icon} size={32} color={COLORS.border} />
    <Text style={s.emptyText}>{text}</Text>
  </View>
);

const SectionHeader: React.FC<{ title: string; count?: number }> = ({ title, count }) => (
  <View style={s.sectionHeaderRow}>
    <Text style={s.sectionTitle}>{title}</Text>
    {count !== undefined && (
      <View style={s.sectionBadge}>
        <Text style={s.sectionBadgeText}>{count}</Text>
      </View>
    )}
  </View>
);

const OutstandingRow: React.FC<{ item: OutstandingItem }> = ({ item }) => {
  const isOverdue = item.paymentStatus !== 'partial' && !!item.createdAt
    && Date.now() - new Date(item.createdAt).getTime() > 7 * 24 * 60 * 60 * 1000;

  return (
    <View style={s.dueRow}>
      <View style={s.dueLeft}>
        <Text style={s.dueInvoice}>{item.invoiceNumber}</Text>
        <Text style={s.dueDate}>
          {item.createdAt
            ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: '2-digit',
              })
            : '—'}
          {item.paymentStatus === 'partial' ? ' · Partial' : isOverdue ? ' · Overdue' : ''}
        </Text>
      </View>
      <View style={s.dueRight}>
        <Text style={s.dueAmount}>{formatINR(item.balanceDue)}</Text>
        {item.amountPaid > 0 && (
          <Text style={s.duePaid}>Paid {formatINR(item.amountPaid)}</Text>
        )}
      </View>
    </View>
  );
};

const MechanicRow: React.FC<{ item: MechanicRevenueItem; topRevenue: number }> = ({
  item, topRevenue,
}) => (
  <View style={s.rankCard}>
    <View style={s.rankAvatar}>
      <Ionicons name="person-outline" size={16} color={COLORS.primary} />
    </View>
    <View style={s.rankInfo}>
      <Text style={s.rankName}>{item.mechanicName}</Text>
      <View style={s.rankBarTrack}>
        <View
          style={[
            s.rankBarFill,
            { width: `${topRevenue > 0 ? (item.revenue / topRevenue) * 100 : 0}%` as any },
          ]}
        />
      </View>
    </View>
    <Text style={s.rankAmount}>{formatINR(item.revenue)}</Text>
  </View>
);

const ServiceRow: React.FC<{ item: ServiceRevenueItem; topRevenue: number }> = ({
  item, topRevenue,
}) => (
  <View style={s.rankCard}>
    <View style={[s.rankAvatar, { backgroundColor: COLORS.successLight }]}>
      <Ionicons name="construct-outline" size={16} color={COLORS.success} />
    </View>
    <View style={s.rankInfo}>
      <Text style={s.rankName}>{item.serviceName}</Text>
      <Text style={s.rankSub}>{item.count} {item.count === 1 ? 'job' : 'jobs'}</Text>
      <View style={s.rankBarTrack}>
        <View
          style={[
            s.rankBarFill,
            {
              width: `${topRevenue > 0 ? (item.revenue / topRevenue) * 100 : 0}%` as any,
              backgroundColor: COLORS.success,
            },
          ]}
        />
      </View>
    </View>
    <Text style={s.rankAmount}>{formatINR(item.revenue)}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { padding: SPACING.md, paddingBottom: 100 },

  // Center screens (loading / error)
  centerScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xl,
  },
  loadingText:  { fontSize: FONT.sizes.sm, color: COLORS.textMuted },
  errorTitle:   { fontSize: FONT.sizes.md, fontWeight: '700', color: COLORS.text, marginTop: SPACING.sm },
  errorSub:     { fontSize: FONT.sizes.sm, color: COLORS.textMuted, textAlign: 'center' },
  retryBtn:     {
    marginTop: SPACING.md, paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT.sizes.sm },

  // Period tabs
  periodRow:        { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.md },
  periodChip:       {
    flex: 1, paddingVertical: 8, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  periodActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodText:       { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  periodTextActive: { color: '#fff' },

  // Revenue hero card
  revenueCard:    {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl,
    padding: SPACING.xl, marginBottom: SPACING.sm, alignItems: 'center',
  },
  revenueLabel:   { fontSize: FONT.sizes.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  revenueValue:   { fontSize: 42, fontWeight: '800', color: '#fff', marginBottom: 2 },
  revenueNote:    { fontSize: FONT.sizes.xs, color: 'rgba(255,255,255,0.55)', marginBottom: SPACING.xs },
  revenueSub:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  revenueSubText: { fontSize: FONT.sizes.sm, color: 'rgba(255,255,255,0.9)' },
  noDataNote:     { fontSize: FONT.sizes.sm, color: 'rgba(255,255,255,0.65)' },

  // Daily earnings chart
  chartCard:     {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.sm,
  },
  chartBars:     { flexDirection: 'row', alignItems: 'flex-end', height: 72, gap: 3 },
  chartBarWrap:  { flex: 1, alignItems: 'center' },
  chartBarTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  chartBarFill:  {
    width: '100%', backgroundColor: COLORS.primary,
    borderRadius: 3, minHeight: 0,
  },
  chartBarLabel: { fontSize: 9, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },

  // Pending collections
  pendingCard:       {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm,
  },
  pendingAlert:      {
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1, borderColor: COLORS.danger + '40',
  },
  pendingTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pendingLeft:       { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  pendingLabel:      { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
>>>>>>> b4f26d8f (changes)
  pendingLabelAlert: { color: COLORS.danger },
  pendingValue: { fontSize: FONT.sizes.lg, fontWeight: '700', color: COLORS.text },
  pendingValueAlert: { color: COLORS.danger },
<<<<<<< HEAD
  sectionTitle: { fontSize: FONT.sizes.md, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  modeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.xs, gap: SPACING.sm, ...SHADOW.sm },
  modeIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  modeName: { fontSize: FONT.sizes.xs, fontWeight: '700', color: COLORS.text, width: 80 },
  modeBar: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  modeBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  modeAmount: { fontSize: FONT.sizes.sm, fontWeight: '700', color: COLORS.text, width: 70, textAlign: 'right' },
  jobStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  jobStatCard: { flex: 1, minWidth: '45%', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', ...SHADOW.sm },
  jobStatValue: { fontSize: FONT.sizes.xxl, fontWeight: '800' },
  jobStatLabel: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary, marginTop: 4 },
=======
  pendingChips:      { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.sm },
  chip:              {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  chipDanger:  { backgroundColor: COLORS.danger  + '18' },
  chipWarning: { backgroundColor: COLORS.warning + '18' },
  chipInfo:    { backgroundColor: COLORS.info    + '18' },
  chipText:    { fontSize: FONT.sizes.xs, fontWeight: '600' },

  // Section header
  sectionTitle:     {
    fontSize: FONT.sizes.md, fontWeight: '700', color: COLORS.text,
    marginBottom: SPACING.sm, marginTop: SPACING.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.xs, marginTop: SPACING.sm, marginBottom: SPACING.sm,
  },
  sectionBadge:     {
    backgroundColor: COLORS.danger, borderRadius: RADIUS.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  sectionBadgeText: { fontSize: FONT.sizes.xs, color: '#fff', fontWeight: '700' },

  // Payment breakdown
  modeCard:    {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.xs, gap: SPACING.sm, ...SHADOW.sm,
  },
  modeIcon:    {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  modeName:    { fontSize: FONT.sizes.xs, fontWeight: '700', color: COLORS.text, width: 80 },
  modeBar:     { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  modeBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  modePercent: { fontSize: FONT.sizes.xs, color: COLORS.textMuted, width: 30, textAlign: 'right' },
  modeAmount:  { fontSize: FONT.sizes.sm, fontWeight: '700', color: COLORS.text, width: 72, textAlign: 'right' },

  // Job stats
  jobStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  jobStatCard:  {
    flex: 1, minWidth: '45%',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, alignItems: 'center', ...SHADOW.sm,
  },
  jobStatValue: { fontSize: FONT.sizes.xxl, fontWeight: '800' },
  jobStatLabel: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },

  // Outstanding dues
  dueRow:    {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.xs, ...SHADOW.sm,
  },
  dueLeft:   { flex: 1, gap: 2 },
  dueRight:  { alignItems: 'flex-end', gap: 2 },
  dueInvoice:{ fontSize: FONT.sizes.sm, fontWeight: '700', color: COLORS.text },
  dueDate:   { fontSize: FONT.sizes.xs, color: COLORS.textMuted },
  dueAmount: { fontSize: FONT.sizes.sm, fontWeight: '700', color: COLORS.danger },
  duePaid:   { fontSize: FONT.sizes.xs, color: COLORS.textMuted },
  seeAll:    { fontSize: FONT.sizes.xs, color: COLORS.primary, textAlign: 'center', paddingVertical: SPACING.xs },

  // Mechanic / Service rank cards
  rankCard:      {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.xs, gap: SPACING.sm, ...SHADOW.sm,
  },
  rankAvatar:    {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  rankInfo:      { flex: 1 },
  rankName:      { fontSize: FONT.sizes.sm, fontWeight: '700', color: COLORS.text },
  rankSub:       { fontSize: FONT.sizes.xs, color: COLORS.textMuted, marginBottom: 2 },
  rankBarTrack:  {
    height: 5, backgroundColor: COLORS.border,
    borderRadius: 3, overflow: 'hidden', marginTop: 4,
  },
  rankBarFill:   { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  rankAmount:    { fontSize: FONT.sizes.sm, fontWeight: '700', color: COLORS.text, width: 72, textAlign: 'right' },

  // Empty state
  emptyCard: {
    alignItems: 'center', paddingVertical: SPACING.lg, gap: SPACING.sm,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: SPACING.xs,
  },
  emptyText: { fontSize: FONT.sizes.sm, color: COLORS.textMuted },
>>>>>>> b4f26d8f (changes)
});
