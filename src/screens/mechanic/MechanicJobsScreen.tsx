import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl, TextInput, Dimensions,
} from 'react-native';
import { Ionicons }       from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore }   from '../../stores/authStore';
import { useDrawer }      from '../../components/CustomDrawer';
import { jobcardApi, HanaJobCard } from '../../api/jobcardApi';
import { EmptyState }     from '../../components/common/EmptyState';
import { SHADOW, SPACING } from '../../config/theme';

const { width: SW } = Dimensions.get('window');

// ─── Theme ────────────────────────────────────────────────────────────────────

const PRIMARY  = '#4F46E5';
const DARK     = '#0F172A';
const BG       = '#F1F5F9';
const SURFACE  = '#FFFFFF';
const TEXT     = '#0F172A';
const MUTED    = '#94A3B8';
const SUBTLE   = '#64748B';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  open:                 { label: 'Assigned',         color: '#3B82F6', bg: '#EFF6FF' },
  assigned:             { label: 'Assigned',         color: '#3B82F6', bg: '#EFF6FF' },
  in_progress:          { label: 'In Progress',      color: '#7C3AED', bg: '#F5F3FF' },
  awaiting_approval:    { label: 'Awaiting Approval',color: '#D97706', bg: '#FFFBEB' },
  approved_for_invoice: { label: 'Approved',         color: '#059669', bg: '#ECFDF5' },
  revision_requested:   { label: 'Revision Needed',  color: '#DC2626', bg: '#FEF2F2' },
  completed:            { label: 'Completed',        color: '#059669', bg: '#ECFDF5' },
  cancelled:            { label: 'Cancelled',        color: '#6B7280', bg: '#F9FAFB' },
};

// ─── Filters ──────────────────────────────────────────────────────────────────

type FilterKey = 'all' | 'assigned' | 'in_progress' | 'awaiting_approval' | 'revision_requested' | 'completed';

const FILTERS: { key: FilterKey; label: string; icon: string }[] = [
  { key: 'all',                label: 'All',       icon: 'layers-outline'          },
  { key: 'assigned',           label: 'Assigned',  icon: 'clipboard-outline'       },
  { key: 'in_progress',        label: 'Active',    icon: 'play-circle-outline'     },
  { key: 'awaiting_approval',  label: 'Pending',   icon: 'time-outline'            },
  { key: 'revision_requested', label: 'Revision',  icon: 'refresh-circle-outline'  },
  { key: 'completed',          label: 'Done',      icon: 'checkmark-done-outline'  },
];

function matchFilter(j: HanaJobCard, f: FilterKey): boolean {
  if (f === 'all')      return true;
  if (f === 'assigned') return j.status === 'assigned' || j.status === 'open';
  return j.status === f;
}

const formatDate = (iso?: string) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ─── Job Card ─────────────────────────────────────────────────────────────────

const JobCard: React.FC<{ job: HanaJobCard; onPress: () => void }> = ({ job, onPress }) => {
  const cfg        = STATUS_CFG[job.status] ?? STATUS_CFG.open;
  const isRevision = job.status === 'revision_requested';
  const isPending  = job.status === 'awaiting_approval';
  const isActive   = job.status === 'in_progress';

  return (
    <TouchableOpacity style={jc.card} onPress={onPress} activeOpacity={0.88}>
      {/* Colored top strip */}
      <View style={[jc.strip, { backgroundColor: cfg.color }]}>
        <Text style={jc.stripId}>#{job._id.slice(-8).toUpperCase()}</Text>
        <View style={jc.stripRight}>
          {job.createdAt && (
            <View style={jc.dateRow}>
              <Ionicons name="calendar-outline" size={10} color="rgba(255,255,255,0.7)" />
              <Text style={jc.dateText}>{formatDate(job.createdAt)}</Text>
            </View>
          )}
          <View style={[jc.statusDot, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
            <Text style={jc.statusLabel}>{cfg.label}</Text>
          </View>
        </View>
      </View>

      {/* Body */}
      <View style={jc.body}>
        {/* Vehicle info */}
        <View style={jc.vehicleRow}>
          <View style={[jc.vehicleIcon, { backgroundColor: cfg.color + '18' }]}>
            <Ionicons name="car-sport-outline" size={22} color={cfg.color} />
          </View>
          <View style={jc.vehicleInfo}>
            <Text style={jc.plate}>{job.registrationNumber ?? '—'}</Text>
            <Text style={jc.model}>
              {[job.brand, job.model].filter(Boolean).join(' ') || 'Unknown vehicle'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={MUTED} />
        </View>

        {/* Work type */}
        {job.workType ? (
          <View style={jc.workRow}>
            <Ionicons name="construct-outline" size={13} color={SUBTLE} />
            <Text style={jc.workText} numberOfLines={1}>{job.workType}</Text>
          </View>
        ) : null}

        {/* Alert banners */}
        {isRevision && (
          <View style={[jc.banner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Ionicons name="alert-circle" size={14} color="#DC2626" />
            <Text style={[jc.bannerText, { color: '#991B1B' }]}>Revision needed — update estimate and resubmit</Text>
          </View>
        )}
        {isPending && (
          <View style={[jc.banner, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <Ionicons name="time" size={14} color="#D97706" />
            <Text style={[jc.bannerText, { color: '#92400E' }]}>Submitted — waiting for owner review</Text>
          </View>
        )}
        {isActive && (
          <View style={[jc.banner, { backgroundColor: '#F5F3FF', borderColor: '#C4B5FD' }]}>
            <Ionicons name="flash" size={14} color="#7C3AED" />
            <Text style={[jc.bannerText, { color: '#5B21B6' }]}>Work is currently in progress</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const jc = StyleSheet.create({
  card:        { backgroundColor: SURFACE, borderRadius: 20, marginBottom: 12, overflow: 'hidden', ...SHADOW.sm },
  strip:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  stripId:     { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.6 },
  stripRight:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText:    { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  statusDot:   { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusLabel: { fontSize: 10, fontWeight: '700', color: '#fff' },
  body:        { padding: 14, gap: 10 },
  vehicleRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  vehicleInfo: { flex: 1 },
  plate:       { fontSize: 16, fontWeight: '800', color: TEXT, letterSpacing: 0.5 },
  model:       { fontSize: 12, color: SUBTLE, marginTop: 2 },
  workRow:     { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#F8FAFC', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
  workText:    { fontSize: 12, color: SUBTLE, flex: 1, fontWeight: '500' },
  banner:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  bannerText:  { fontSize: 12, fontWeight: '600', flex: 1 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export const MechanicJobsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user }         = useAuthStore();
  const { toggleDrawer } = useDrawer();

  const [jobs,       setJobs]       = useState<HanaJobCard[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState<FilterKey>('all');

  // ── Dark mechanic header ──
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle:      { backgroundColor: DARK },
      headerTitleStyle: { color: '#fff', fontWeight: '800', fontSize: 16 },
      headerTintColor:  PRIMARY,
      title: 'My Jobs',
      headerLeft: () => (
        <TouchableOpacity
          onPress={toggleDrawer}
          style={{ marginLeft: 12 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, toggleDrawer]);

  const load = useCallback(async () => {
    try {
      const data = await jobcardApi.getByMechanic(user?.id ?? '');
      setJobs(data);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const filtered = jobs.filter(j => {
    if (!matchFilter(j, filter)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      j.registrationNumber?.toLowerCase().includes(q) ||
      j._id.toLowerCase().includes(q) ||
      j.workType?.toLowerCase().includes(q) ||
      j.brand?.toLowerCase().includes(q) ||
      j.model?.toLowerCase().includes(q)
    );
  });

  const counts = {
    all:                jobs.length,
    assigned:           jobs.filter(j => j.status === 'assigned' || j.status === 'open').length,
    in_progress:        jobs.filter(j => j.status === 'in_progress').length,
    awaiting_approval:  jobs.filter(j => j.status === 'awaiting_approval').length,
    revision_requested: jobs.filter(j => j.status === 'revision_requested').length,
    completed:          jobs.filter(j => j.status === 'completed').length,
  };

  return (
    <View style={s.container}>

      {/* ── Search ── */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={17} color={MUTED} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search plate, work type, brand…"
            placeholderTextColor={MUTED}
            returnKeyType="search"
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color={MUTED} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
      >
        {FILTERS.map(f => {
          const active = filter === f.key;
          const count  = counts[f.key];
          return (
            <TouchableOpacity
              key={f.key}
              style={[s.chip, active && s.chipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={f.icon as any}
                size={13}
                color={active ? '#fff' : SUBTLE}
              />
              <Text style={[s.chipText, active && s.chipTextActive]}>{f.label}</Text>
              {count > 0 && (
                <View style={[s.chipBadge, active && s.chipBadgeActive]}>
                  <Text style={[s.chipBadgeText, active && s.chipBadgeTextActive]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Results count ── */}
      <View style={s.resultsRow}>
        <Text style={s.resultsText}>
          {filtered.length} {filtered.length === 1 ? 'job' : 'jobs'}
          {search ? ` for "${search}"` : ''}
        </Text>
      </View>

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={j => j._id}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
            tintColor={PRIMARY}
            colors={[PRIMARY]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title={loading ? 'Loading…' : 'No jobs found'}
            message={loading ? '' : 'Try a different filter or search term'}
            icon="construct-outline"
          />
        }
        renderItem={({ item: j }) => (
          <JobCard
            key={j._id}
            job={j}
            onPress={() => navigation.navigate('HanaJobCardDetail', { id: j._id })}
          />
        )}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Search
  searchWrap: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  searchBox:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: SURFACE, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, ...SHADOW.sm },
  searchInput:{ flex: 1, fontSize: 14, color: TEXT, padding: 0 },

  // Chips
  chips:          { paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, gap: 8 },
  chip:           { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: SURFACE, borderWidth: 1.5, borderColor: '#E2E8F0' },
  chipActive:     { backgroundColor: DARK, borderColor: DARK },
  chipText:       { fontSize: 12, fontWeight: '700', color: SUBTLE },
  chipTextActive: { color: '#fff' },
  chipBadge:      { backgroundColor: '#F1F5F9', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  chipBadgeActive:{ backgroundColor: 'rgba(255,255,255,0.2)' },
  chipBadgeText:  { fontSize: 10, fontWeight: '800', color: SUBTLE },
  chipBadgeTextActive: { color: '#fff' },

  // Results
  resultsRow:  { paddingHorizontal: SPACING.md, paddingBottom: 6 },
  resultsText: { fontSize: 12, color: MUTED, fontWeight: '600' },

  // List
  list: { paddingHorizontal: SPACING.md, paddingBottom: 100 },
});
