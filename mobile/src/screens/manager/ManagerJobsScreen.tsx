import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons }       from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SearchBar }      from '../../components/common/SearchBar';
import { EmptyState }     from '../../components/common/EmptyState';
import { AppLoaderModal } from '../../components/common/AppLoaderModal';
import { jobcardApi, HanaJobCard } from '../../api/jobcardApi';
import { showToast }      from '../../utils/toast';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../config/theme';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  open:                  { label: 'Open',             color: '#92400E', bg: '#FEF3C7', border: COLORS.warning },
  assigned:              { label: 'Assigned',         color: '#1E40AF', bg: '#DBEAFE', border: COLORS.info    },
  in_progress:           { label: 'In Progress',      color: '#1E40AF', bg: '#DBEAFE', border: COLORS.info    },
  awaiting_approval:     { label: 'Pending Approval', color: '#92400E', bg: '#FEF3C7', border: COLORS.warning },
  approved_for_invoice:  { label: 'Approved',         color: '#065F46', bg: '#D1FAE5', border: COLORS.success },
  revision_requested:    { label: 'Revision Needed',  color: '#991B1B', bg: '#FEE2E2', border: COLORS.danger  },
  completed:             { label: 'Completed',        color: '#065F46', bg: '#D1FAE5', border: COLORS.success },
  cancelled:             { label: 'Cancelled',        color: '#991B1B', bg: '#FEE2E2', border: COLORS.danger  },
};

// ─── Filters ──────────────────────────────────────────────────────────────────

type FilterKey = 'all' | 'open' | 'active' | 'pending' | 'approved' | 'completed' | 'cancelled';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',       label: 'All'        },
  { key: 'open',      label: 'Open'       },
  { key: 'active',    label: 'In Progress'},
  { key: 'pending',   label: 'Pending'    },
  { key: 'approved',  label: 'Approved'   },
  { key: 'completed', label: 'Completed'  },
  { key: 'cancelled', label: 'Cancelled'  },
];

function matchFilter(j: HanaJobCard, f: FilterKey): boolean {
  if (f === 'all')       return true;
  if (f === 'open')      return j.status === 'open';
  if (f === 'active')    return j.status === 'assigned' || j.status === 'in_progress';
  if (f === 'pending')   return j.status === 'awaiting_approval' || j.status === 'revision_requested';
  if (f === 'approved')  return j.status === 'approved_for_invoice';
  if (f === 'completed') return j.status === 'completed';
  if (f === 'cancelled') return j.status === 'cancelled';
  return true;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const ManagerJobsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [jobCards,  setJobCards]  = useState<HanaJobCard[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [refreshing,setRefreshing]= useState(false);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState<FilterKey>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jobcardApi.getAll();
      setJobCards(data);
    } catch (e: any) {
      showToast(e.message ?? 'Failed to load jobs', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = jobCards.filter(j => {
    if (!matchFilter(j, filter)) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      j.registrationNumber?.toLowerCase().includes(q) ||
      j.brand?.toLowerCase().includes(q) ||
      j.model?.toLowerCase().includes(q) ||
      j.description?.toLowerCase().includes(q) ||
      j.assignedMechanicName?.toLowerCase().includes(q) ||
      j._id.toLowerCase().includes(q)
    );
  });

  return (
    <View style={s.container}>
      <AppLoaderModal visible={loading && jobCards.length === 0} message="Loading jobs…" />

      {/* Search */}
      <View style={s.topBar}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by plate, vehicle, mechanic…"
        />
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
<<<<<<< HEAD
        style={styles.filtersScroll}
        contentContainerStyle={styles.filters}
=======
        contentContainerStyle={s.chips}
>>>>>>> b4f26d8f (changes)
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.chip, filter === f.key && s.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[s.chipText, filter === f.key && s.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={j => j._id}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="No jobs found"
              message={search ? 'Try a different search term' : 'No jobs for this filter'}
              icon="construct-outline"
            />
          ) : null
        }
        renderItem={({ item: j }) => <JobCard job={j} onPress={() => navigation.navigate('HanaJobCardDetail', { id: j._id })} />}
      />
    </View>
  );
};

// ─── Card component ───────────────────────────────────────────────────────────

const JobCard: React.FC<{ job: HanaJobCard; onPress: () => void }> = ({ job: j, onPress }) => {
  const cfg      = STATUS_CFG[j.status] ?? STATUS_CFG.open;
  const shortId  = `JC-${j._id.slice(-6).toUpperCase()}`;
  const vehicle  = [j.brand, j.model].filter(Boolean).join(' ');
  const kmLabel  = j.currentKM ? `${parseInt(j.currentKM).toLocaleString('en-IN')} km` : null;
  const dateLabel = j.createdAt
    ? new Date(j.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null;

  return (
    <TouchableOpacity
      style={[s.card, { borderLeftColor: cfg.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={s.cardHeader}>
        <View style={s.cardLeft}>
          <Text style={s.vehicleName} numberOfLines={1}>
            {vehicle || 'Unknown Vehicle'}
          </Text>
          <Text style={s.plateText}>{j.registrationNumber ?? '—'}</Text>
        </View>
        <View style={s.idChip}>
          <Text style={s.idChipText}>{shortId}</Text>
        </View>
      </View>

      {/* Meta row */}
      <View style={s.metaRow}>
        <View style={s.metaItem}>
          <Ionicons name="construct-outline" size={11} color={COLORS.textMuted} />
          <Text style={s.metaText}>{j.workType ?? '—'}</Text>
        </View>
        {kmLabel && (
          <View style={s.metaItem}>
            <Ionicons name="speedometer-outline" size={11} color={COLORS.textMuted} />
            <Text style={s.metaText}>{kmLabel}</Text>
          </View>
        )}
        {dateLabel && (
          <View style={s.metaItem}>
            <Ionicons name="calendar-outline" size={11} color={COLORS.textMuted} />
            <Text style={s.metaText}>{dateLabel}</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {!!j.description && (
        <Text style={s.descText} numberOfLines={1}>{j.description}</Text>
      )}

      {/* Footer */}
      <View style={s.cardFooter}>
        <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
          <View style={[s.statusDot, { backgroundColor: cfg.border }]} />
          <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>

        <View style={s.footerRight}>
          {j.assignedMechanicName ? (
            <View style={s.mechanicRow}>
              <Ionicons name="person-circle-outline" size={12} color={COLORS.textMuted} />
              <Text style={s.mechanicText} numberOfLines={1}>{j.assignedMechanicName}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
<<<<<<< HEAD
  topBar: { padding: SPACING.md, paddingBottom: 0 },
  filtersScroll: { flexGrow: 0 },
  filters: {
    flexDirection: "row",
    alignItems: "center",
=======
  topBar:    { padding: SPACING.md, paddingBottom: 0 },
  chips:     { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.xs },
  chip:      {
>>>>>>> b4f26d8f (changes)
    paddingHorizontal: SPACING.md,
    height:            32,
    justifyContent:    'center',
    borderRadius:      RADIUS.full,
    backgroundColor:   COLORS.surface,
    borderWidth:       1.5,
    borderColor:       COLORS.border,
  },
<<<<<<< HEAD
  filterChip: {
    // paddingHorizontal: SPACING.md,
    // paddingVertical: 7,
    height: 32,
    width: 90,
    justifyContent: "center",
    borderRadius: RADIUS.full,
=======
  chipActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText:       { fontSize: FONT.sizes.xs, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: '#fff' },
  list: { padding: SPACING.md, paddingBottom: 100 },

  card: {
>>>>>>> b4f26d8f (changes)
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    marginBottom:    SPACING.sm,
    ...SHADOW.sm,
    borderLeftWidth: 4,
    borderWidth:     1,
    borderColor:     COLORS.border,
  },

  cardHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   6,
  },
<<<<<<< HEAD
  filterText: {
    fontSize: FONT.sizes.xs,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textAlign: "center",
=======
  cardLeft:    { flex: 1, marginRight: SPACING.sm },
  vehicleName: { fontSize: FONT.sizes.md, fontWeight: '700', color: COLORS.text },
  plateText:   { fontSize: FONT.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  idChip: {
    backgroundColor:   COLORS.primaryLight,
    paddingHorizontal: 7,
    paddingVertical:   3,
    borderRadius:      RADIUS.sm,
>>>>>>> b4f26d8f (changes)
  },
  idChipText: { fontSize: FONT.sizes.xs, fontWeight: '700', color: COLORS.primary },

  metaRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: 6 },
  metaItem:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText:  { fontSize: FONT.sizes.xs, color: COLORS.textMuted },

  descText: {
    fontSize:     FONT.sizes.sm,
    color:        COLORS.textSecondary,
    marginBottom: 8,
  },

  cardFooter: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginTop:      4,
    paddingTop:     8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statusBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      RADIUS.full,
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FONT.sizes.xs, fontWeight: '600' },

  footerRight:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  mechanicRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  mechanicText:  { fontSize: FONT.sizes.xs, color: COLORS.textMuted, maxWidth: 120 },
});
