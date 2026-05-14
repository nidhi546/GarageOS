import React, { useEffect, useMemo } from 'react';
import {
<<<<<<< HEAD
  View, Text, ScrollView, StyleSheet,
  RefreshControl, TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../stores/authStore';
import { useJobCardStore } from '../../stores/jobCardStore';
=======
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, SafeAreaView, ActivityIndicator,
  StatusBar, Dimensions,
} from 'react-native';
import { AppLoaderModal } from '../../components/common/AppLoaderModal';
import { Ionicons }       from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore }   from '../../stores/authStore';
>>>>>>> b4f26d8f (changes)
import { useNotificationStore } from '../../stores/notificationStore';
import { useDrawer } from '../../components/CustomDrawer';
import { StatCard } from '../../components/common/StatCard';
import { JobCardListItem } from '../../components/job/JobCardListItem';
import { EmptyState } from '../../components/common/EmptyState';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../config/theme';

<<<<<<< HEAD
const COMPLETED_STATUSES = new Set(['work_completed', 'qc_passed', 'invoiced', 'paid', 'delivered']);
const ACTIVE_STATUSES    = new Set(['assigned', 'in_progress', 'waiting_parts', 'qc_failed']);
=======
const { width: SW } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND = '#4F46E5';
const BRAND_DARK = '#3730A3';

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  open:                 { label: 'New',             color: '#3B82F6', bg: '#EFF6FF', icon: 'clipboard-outline'        },
  assigned:             { label: 'Assigned',        color: '#3B82F6', bg: '#EFF6FF', icon: 'clipboard-outline'        },
  in_progress:          { label: 'In Progress',     color: '#7C3AED', bg: '#F5F3FF', icon: 'play-circle-outline'      },
  awaiting_approval:    { label: 'Pending Approval',color: '#D97706', bg: '#FFFBEB', icon: 'time-outline'             },
  approved_for_invoice: { label: 'Approved',        color: '#059669', bg: '#ECFDF5', icon: 'checkmark-circle-outline' },
  revision_requested:   { label: 'Needs Revision',  color: '#DC2626', bg: '#FEF2F2', icon: 'refresh-circle-outline'   },
  completed:            { label: 'Completed',       color: '#059669', bg: '#ECFDF5', icon: 'checkmark-done-outline'   },
  cancelled:            { label: 'Cancelled',       color: '#6B7280', bg: '#F9FAFB', icon: 'close-circle-outline'     },
};

const ACTIVE_STATUSES = new Set([
  'open', 'assigned', 'in_progress',
  'awaiting_approval', 'approved_for_invoice', 'revision_requested',
]);

const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);

const formatDate = (iso?: string) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
};

// ─── Status Pill ──────────────────────────────────────────────────────────────

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CFG[status] ?? { label: status, color: '#6B7280', bg: '#F9FAFB', icon: 'ellipse-outline' };
  return (
    <View style={[pill.wrap, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
      <Text style={[pill.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};
const pill = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  text: { fontSize: 10, fontWeight: '700' },
});

// ─── Stat Card (horizontal scroll) ───────────────────────────────────────────

const STAT_CARDS = [
  { key: 'assigned',  label: 'Assigned',    icon: 'clipboard-outline',      color: '#3B82F6', bg: '#EFF6FF' },
  { key: 'progress',  label: 'In Progress', icon: 'play-circle-outline',    color: '#7C3AED', bg: '#F5F3FF' },
  { key: 'pending',   label: 'Awaiting',    icon: 'time-outline',           color: '#D97706', bg: '#FFFBEB' },
  { key: 'revision',  label: 'Revision',    icon: 'refresh-circle-outline', color: '#DC2626', bg: '#FEF2F2' },
  { key: 'completed', label: 'Completed',   icon: 'checkmark-done-outline', color: '#059669', bg: '#ECFDF5' },
];

const StatCard: React.FC<{ label: string; value: number; icon: string; color: string; bg: string }> = ({
  label, value, icon, color, bg,
}) => (
  <View style={[sc.card, { backgroundColor: bg }]}>
    <View style={[sc.iconBox, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text style={[sc.val, { color }]}>{value}</Text>
    <Text style={[sc.lbl, { color: color + 'CC' }]}>{label}</Text>
  </View>
);
const sc = StyleSheet.create({
  card:   { width: 100, borderRadius: 18, padding: 14, gap: 6, ...SHADOW.sm },
  iconBox:{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  val:    { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  lbl:    { fontSize: 10, fontWeight: '700' },
});

// ─── Job Card ─────────────────────────────────────────────────────────────────

const JobCard: React.FC<{
  job: HanaJobCard;
  navigation: any;
  onStatusChange: React.Dispatch<React.SetStateAction<HanaJobCard[]>>;
}> = ({ job, navigation, onStatusChange }) => {
  const [starting, setStarting] = useState(false);
  const cfg        = STATUS_CFG[job.status] ?? STATUS_CFG.assigned;
  const isAssigned = job.status === 'assigned' || job.status === 'open';
  const isPending  = job.status === 'awaiting_approval';
  const isRevision = job.status === 'revision_requested';
  const isApproved = job.status === 'approved_for_invoice';
  const isActive   = job.status === 'in_progress';

  const handleStart = async () => {
    setStarting(true);
    try {
      await jobcardApi.updateStatus(job._id, 'in_progress');
      onStatusChange(prev => prev.map(j => j._id === job._id ? { ...j, status: 'in_progress' } : j));
    } catch { /* silent */ }
    finally { setStarting(false); }
  };

  return (
    <TouchableOpacity
      style={jc.card}
      onPress={() => navigation.navigate('HanaJobCardDetail', { id: job._id })}
      activeOpacity={0.88}
    >
      {/* Left accent */}
      <View style={[jc.accent, { backgroundColor: cfg.color }]} />

      <View style={jc.body}>
        {/* Header row */}
        <View style={jc.headerRow}>
          <View style={[jc.vehicleIcon, { backgroundColor: cfg.color + '15' }]}>
            <Ionicons name="car-sport-outline" size={16} color={cfg.color} />
          </View>
          <View style={jc.vehicleInfo}>
            <Text style={jc.plate}>{job.registrationNumber ?? '—'}</Text>
            <Text style={jc.vehicleName}>
              {[job.brand, job.model].filter(Boolean).join(' ') || 'Unknown vehicle'}
            </Text>
          </View>
          <StatusPill status={job.status} />
        </View>

        {/* Work type */}
        {job.workType && (
          <View style={jc.workRow}>
            <Ionicons name="construct-outline" size={12} color={COLORS.textMuted} />
            <Text style={jc.workText} numberOfLines={1}>{job.workType}</Text>
          </View>
        )}

        {/* Alert banners */}
        {isRevision && (
          <View style={[jc.banner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Ionicons name="alert-circle" size={13} color="#DC2626" />
            <Text style={[jc.bannerText, { color: '#991B1B' }]}>Revision needed — update estimate</Text>
          </View>
        )}
        {isPending && (
          <View style={[jc.banner, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <Ionicons name="time" size={13} color="#D97706" />
            <Text style={[jc.bannerText, { color: '#92400E' }]}>Waiting for owner approval</Text>
          </View>
        )}
        {isApproved && (
          <View style={[jc.banner, { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' }]}>
            <Ionicons name="checkmark-circle" size={13} color="#059669" />
            <Text style={[jc.bannerText, { color: '#065F46' }]}>Approved — ready for invoice</Text>
          </View>
        )}
        {isActive && (
          <View style={[jc.banner, { backgroundColor: '#F5F3FF', borderColor: '#C4B5FD' }]}>
            <Ionicons name="flash" size={13} color="#7C3AED" />
            <Text style={[jc.bannerText, { color: '#5B21B6' }]}>Work in progress</Text>
          </View>
        )}

        {/* Footer */}
        <View style={jc.footer}>
          <Text style={jc.jobId}>#{job._id.slice(-6).toUpperCase()}</Text>
          {job.createdAt && (
            <View style={jc.dateRow}>
              <Ionicons name="calendar-outline" size={10} color={COLORS.textMuted} />
              <Text style={jc.dateText}>{formatDate(job.createdAt)}</Text>
            </View>
          )}
          {isAssigned ? (
            <TouchableOpacity style={jc.startBtn} onPress={handleStart} disabled={starting} activeOpacity={0.85}>
              {starting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="play-circle" size={13} color="#fff" />
              }
              <Text style={jc.startText}>{starting ? 'Starting…' : 'Start Work'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={jc.openBtn}>
              <Text style={jc.openText}>View</Text>
              <Ionicons name="chevron-forward" size={12} color={BRAND} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const jc = StyleSheet.create({
  card:        { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 18, marginBottom: 10, ...SHADOW.sm, overflow: 'hidden' },
  accent:      { width: 4 },
  body:        { flex: 1, padding: 14, gap: 8 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vehicleIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  vehicleInfo: { flex: 1 },
  plate:       { fontSize: 14, fontWeight: '800', color: COLORS.text, letterSpacing: 0.5 },
  vehicleName: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  workRow:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  workText:    { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  banner:      { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  bannerText:  { fontSize: 11, fontWeight: '600', flex: 1 },
  footer:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  jobId:       { flex: 1, fontSize: 10, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 0.5 },
  dateRow:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dateText:    { fontSize: 10, color: COLORS.textMuted },
  startBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BRAND, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  startText:   { fontSize: 11, fontWeight: '700', color: '#fff' },
  openBtn:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  openText:    { fontSize: 11, fontWeight: '700', color: BRAND },
});

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; count?: number; onPress?: () => void }> = ({
  title, count, onPress,
}) => (
  <View style={sh.row}>
    <Text style={sh.title}>{title}</Text>
    {count !== undefined && count > 0 && (
      <View style={sh.badge}><Text style={sh.badgeText}>{count}</Text></View>
    )}
    {onPress && (
      <TouchableOpacity style={sh.seeAll} onPress={onPress} activeOpacity={0.7}>
        <Text style={sh.seeAllText}>See all</Text>
        <Ionicons name="chevron-forward" size={12} color={BRAND} />
      </TouchableOpacity>
    )}
  </View>
);
const sh = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  title:       { fontSize: 15, fontWeight: '800', color: COLORS.text, flex: 1 },
  badge:       { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeText:   { fontSize: 11, color: BRAND, fontWeight: '700' },
  seeAll:      { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText:  { fontSize: 12, color: BRAND, fontWeight: '600' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
>>>>>>> b4f26d8f (changes)

export const MechanicDashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { jobCards, fetchByMechanic, isLoading } = useJobCardStore();
  const { unreadCount } = useNotificationStore();
  const { toggleDrawer } = useDrawer();

  const mechanicId = user?.id ?? 'u3';

<<<<<<< HEAD
  useEffect(() => { fetchByMechanic(mechanicId); }, [mechanicId]);

  // ─── Derived (memoized) ────────────────────────────────────────────────────
=======
  const load = useCallback(async () => {
    try {
      const data = await jobcardApi.getByMechanic(user?.id ?? '');
      setJobs(data);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);
>>>>>>> b4f26d8f (changes)

  const inProgress = useMemo(() => jobCards.filter(j => j.status === 'in_progress'), [jobCards]);
  const waiting    = useMemo(() => jobCards.filter(j => j.status === 'waiting_parts'), [jobCards]);
  const completed  = useMemo(() => jobCards.filter(j => COMPLETED_STATUSES.has(j.status as string)), [jobCards]);
  const activeJobs = useMemo(() => jobCards.filter(j => ACTIVE_STATUSES.has(j.status as string)), [jobCards]);

<<<<<<< HEAD
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} >
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchByMechanic(mechanicId)} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.menuBtn} onPress={toggleDrawer} activeOpacity={0.8}>
          <Ionicons name="menu-outline" size={26} color={COLORS.text} />
        </TouchableOpacity>
        <View style={s.headerLeft}>
          <Text style={s.greeting}>{greeting} 👋</Text>
          <Text style={s.name}>{user?.name ?? 'Mechanic'}</Text>
          <Text style={s.sub}>My Workspace</Text>
        </View>
        <TouchableOpacity
          style={s.notifBtn}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          {unreadCount > 0 && (
            <View style={s.notifBadge}>
              <Text style={s.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
=======
  const counts = {
    assigned:  jobs.filter(j => j.status === 'assigned' || j.status === 'open').length,
    progress:  jobs.filter(j => j.status === 'in_progress').length,
    pending:   jobs.filter(j => j.status === 'awaiting_approval').length,
    revision:  jobs.filter(j => j.status === 'revision_requested').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  };

  // Priority order: revision first, then in_progress, then assigned, then pending, then approved
  const priorityOrder: Record<string, number> = {
    revision_requested: 0, in_progress: 1, assigned: 2, open: 2,
    awaiting_approval: 3, approved_for_invoice: 4,
  };
  const activeJobs = jobs
    .filter(j => ACTIVE_STATUSES.has(j.status))
    .sort((a, b) => (priorityOrder[a.status] ?? 9) - (priorityOrder[b.status] ?? 9));

  const displayName = (user?.legalname ?? user?.name)?.trim() || 'Mechanic';
  const totalActive = activeJobs.length;

  return (
    <SafeAreaView style={s.safe}>
      <AppLoaderModal visible={loading && jobs.length === 0} message="Loading your jobs…" />
      <StatusBar barStyle="light-content" backgroundColor={BRAND_DARK} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} colors={[BRAND]} />
        }
        showsVerticalScrollIndicator={false}
      >

        {/* ══ HEADER ══ */}
        <View style={s.header}>
          {/* Top bar */}
          <View style={s.topBar}>
            <TouchableOpacity style={s.iconBtn} onPress={toggleDrawer} activeOpacity={0.8}>
              <Ionicons name="menu-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={s.appTitle}>My Dashboard</Text>
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {unreadCount > 0 && (
                <View style={s.notifBadge}>
                  <Text style={s.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Profile */}
          <View style={s.profileRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{getInitials(displayName)}</Text>
              <View style={s.onlineDot} />
            </View>
            <View style={s.profileInfo}>
              <Text style={s.greetText}>{greeting()} 👋</Text>
              <Text style={s.nameText}>{displayName}</Text>
              <Text style={s.roleText}>Mechanic</Text>
            </View>
            <View style={s.activeBadge}>
              <Text style={s.activeNum}>{totalActive}</Text>
              <Text style={s.activeLbl}>Active Jobs</Text>
            </View>
          </View>
        </View>

        {/* ══ STAT CARDS ══ */}
        <View style={s.statsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsScroll}>
            {STAT_CARDS.map(c => (
              <StatCard
                key={c.key}
                label={c.label}
                value={counts[c.key as keyof typeof counts]}
                icon={c.icon}
                color={c.color}
                bg={c.bg}
              />
            ))}
          </ScrollView>
        </View>

        {/* ══ REVISION ALERT ══ */}
        {counts.revision > 0 && (
          <TouchableOpacity style={s.revAlert} activeOpacity={0.85}>
            <View style={s.revAlertIcon}>
              <Ionicons name="alert-circle" size={24} color="#DC2626" />
            </View>
            <View style={s.revAlertBody}>
              <Text style={s.revAlertTitle}>Action Required</Text>
              <Text style={s.revAlertSub}>
                {counts.revision} job{counts.revision > 1 ? 's' : ''} sent back for revision
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#DC2626" />
          </TouchableOpacity>
        )}

        {/* ══ ACTIVE JOBS ══ */}
        <View style={s.section}>
          <SectionHeader
            title="My Jobs"
            count={totalActive}
            onPress={totalActive > 0 ? () => navigation.navigate('Jobs') : undefined}
          />
          {activeJobs.length === 0 ? (
            <EmptyState
              title="No active jobs"
              message="You're all caught up! Pull down to refresh."
              icon="construct-outline"
            />
          ) : (
            activeJobs.map(job => (
              <JobCard key={job._id} job={job} navigation={navigation} onStatusChange={setJobs} />
            ))
>>>>>>> b4f26d8f (changes)
          )}
        </TouchableOpacity>
      </View>

<<<<<<< HEAD
      {/* ── KPI Cards ── */}
      <View style={s.statsRow}>
        <StatCard
          label="In Progress"
          value={String(inProgress.length)}
          icon="play-circle-outline"
          iconColor={COLORS.info}
          iconBg={COLORS.infoLight}
          style={s.stat}
        />
        <StatCard
          label="Waiting Parts"
          value={String(waiting.length)}
          icon="cube-outline"
          iconColor={COLORS.warning}
          iconBg={COLORS.warningLight}
          style={s.stat}
        />
      </View>
      <View style={s.statsRow}>
        <StatCard
          label="Completed"
          value={String(completed.length)}
          icon="checkmark-circle-outline"
          iconColor={COLORS.success}
          iconBg={COLORS.successLight}
          style={s.stat}
        />
        <StatCard
          label="Total Assigned"
          value={String(jobCards.length)}
          icon="construct-outline"
          iconColor={COLORS.primary}
          iconBg={COLORS.primaryLight}
          style={s.stat}
        />
      </View>

      {/* ── Active Jobs ── */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>My Active Jobs</Text>
        {activeJobs.length > 0 && (
          <View style={s.countPill}>
            <Text style={s.countPillText}>{activeJobs.length}</Text>
          </View>
        )}
      </View>

      {activeJobs.length === 0 ? (
        <EmptyState
          title="No active jobs"
          message="You have no jobs assigned right now. Check back soon."
          icon="construct-outline"
        />
      ) : (
        activeJobs.map(job => (
          <JobCardListItem
            key={job.id}
            jobCard={job}
            onPress={() => navigation.navigate('JobWork', { jobCardId: job.id })}
          />
        ))
      )}

      {/* ── Completed Jobs (collapsed summary) ── */}
      {completed.length > 0 && (
        <>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Completed</Text>
          </View>
          <TouchableOpacity
            style={s.completedSummary}
            onPress={() => navigation.navigate('Jobs')}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={s.completedText}>{completed.length} job{completed.length > 1 ? 's' : ''} completed</Text>
=======
        {/* ══ COMPLETED ROW ══ */}
        {counts.completed > 0 && (
          <TouchableOpacity
            style={s.completedRow}
            onPress={() => navigation.navigate('Jobs')}
            activeOpacity={0.8}
          >
            <View style={s.completedIcon}>
              <Ionicons name="checkmark-circle" size={22} color="#059669" />
            </View>
            <View style={s.completedBody}>
              <Text style={s.completedTitle}>Completed Jobs</Text>
              <Text style={s.completedSub}>{counts.completed} job{counts.completed > 1 ? 's' : ''} finished</Text>
            </View>
>>>>>>> b4f26d8f (changes)
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
    </SafeAreaView>
  );
};

<<<<<<< HEAD
const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.background },
  content:         { padding: SPACING.md, paddingBottom: 100 },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
  headerLeft:      { flex: 1 ,marginStart:20},
  greeting:        { fontSize: FONT.sizes.sm, color: COLORS.textSecondary },
  name:            { fontSize: FONT.sizes.xl, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  sub:             { fontSize: FONT.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  menuBtn:        { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', ...SHADOW.sm },
  notifBtn:        { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', ...SHADOW.sm },
  notifBadge:      { position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  notifBadgeText:  { fontSize: 9, color: '#fff', fontWeight: '800' },
  statsRow:        { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  stat:            { flex: 1 },
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  sectionTitle:    { fontSize: FONT.sizes.md, fontWeight: '700', color: COLORS.text },
  countPill:       { backgroundColor: COLORS.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  countPillText:   { fontSize: FONT.sizes.xs, color: COLORS.primary, fontWeight: '700' },
  completedSummary:{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOW.sm },
  completedText:   { flex: 1, fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.success },
=======
// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: BRAND_DARK },
  scroll:  { flex: 1, backgroundColor: '#F4F6FB' },
  content: { paddingBottom: 100 },
  loader:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },

  // Header
  header:      { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: 32, backgroundColor: BRAND },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  iconBtn:     { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  appTitle:    { fontSize: 16, fontWeight: '700', color: '#fff' },
  notifBadge:  { position: 'absolute', top: 6, right: 6, minWidth: 14, height: 14, borderRadius: 7, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  notifBadgeText: { fontSize: 8, color: '#fff', fontWeight: '800' },

  profileRow:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar:      { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  avatarText:  { fontSize: 18, fontWeight: '800', color: '#fff' },
  onlineDot:   { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2, borderColor: BRAND },
  profileInfo: { flex: 1 },
  greetText:   { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  nameText:    { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 1 },
  roleText:    { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: '500' },
  activeBadge: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  activeNum:   { fontSize: 24, fontWeight: '800', color: '#fff', lineHeight: 28 },
  activeLbl:   { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 },

  // Stats
  statsSection: { marginTop: -16, marginBottom: SPACING.md },
  statsScroll:  { paddingHorizontal: SPACING.md, gap: 10 },

  // Revision alert
  revAlert:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FEF2F2', borderRadius: 16, padding: 14, marginHorizontal: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#FECACA', ...SHADOW.sm },
  revAlertIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  revAlertBody: { flex: 1 },
  revAlertTitle:{ fontSize: 13, fontWeight: '800', color: '#991B1B' },
  revAlertSub:  { fontSize: 11, color: '#B91C1C', marginTop: 2 },

  // Section
  section: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },

  // Completed row
  completedRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: SPACING.md, marginTop: 4, ...SHADOW.sm },
  completedIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  completedBody: { flex: 1 },
  completedTitle:{ fontSize: 13, fontWeight: '700', color: COLORS.text },
  completedSub:  { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
>>>>>>> b4f26d8f (changes)
});
