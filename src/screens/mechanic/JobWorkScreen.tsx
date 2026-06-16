import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useJobCardStore } from '../../stores/jobCardStore';
import { JobStatusBadge } from '../../components/job/JobStatusBadge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PhoneMasked } from '../../components/common/PhoneMasked';
import { canTransition } from '../../constants/jobCardLifecycle';
import { SPACING, SHADOW } from '../../config/theme';
import type { JobCardStatus } from '../../types';

// ─── Theme ────────────────────────────────────────────────────────────────────

const PRIMARY  = '#4F46E5';
const PRIMARY_D = '#3730A3';
const DARK     = '#0F172A';
const BG       = '#F1F5F9';
const SURFACE  = '#FFFFFF';
const TEXT     = '#0F172A';
const SUBTLE   = '#64748B';
const MUTED    = '#94A3B8';
const BORDER   = '#E2E8F0';

// ─── Status action config ─────────────────────────────────────────────────────

interface StatusAction {
  to: JobCardStatus;
  label: string;
  color: string;
  bg: string;
  icon: string;
  requiresPostTrial?: boolean;
}

const STATUS_ACTIONS: StatusAction[] = [
  { to: 'in_progress',    label: 'Start Work',        color: PRIMARY,   bg: '#EEF2FF', icon: 'play-circle-outline',       },
  { to: 'waiting_parts',  label: 'Waiting for Parts', color: '#D97706', bg: '#FFFBEB', icon: 'time-outline',               },
  { to: 'in_progress',    label: 'Resume Work',        color: '#3B82F6', bg: '#EFF6FF', icon: 'refresh-circle-outline',    },
  { to: 'work_completed', label: 'Mark Work Complete', color: '#059669', bg: '#ECFDF5', icon: 'checkmark-circle-outline',  requiresPostTrial: true },
];

// ─── Info Row ─────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={ir.row}>
    <View style={ir.iconBox}>
      <Ionicons name={icon as any} size={16} color={PRIMARY} />
    </View>
    <View style={ir.texts}>
      <Text style={ir.label}>{label}</Text>
      <Text style={ir.value}>{value || '—'}</Text>
    </View>
  </View>
);
const ir = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  iconBox:{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  texts:  { flex: 1 },
  label:  { fontSize: 11, color: MUTED, fontWeight: '600', marginBottom: 1 },
  value:  { fontSize: 14, color: TEXT, fontWeight: '700' },
});

// ─── Section Card ─────────────────────────────────────────────────────────────

const SectionCard: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <View style={sec.card}>
    <View style={sec.header}>
      <View style={sec.iconBox}>
        <Ionicons name={icon as any} size={16} color={PRIMARY} />
      </View>
      <Text style={sec.title}>{title}</Text>
    </View>
    {children}
  </View>
);
const sec = StyleSheet.create({
  card:   { backgroundColor: SURFACE, borderRadius: 20, padding: 16, marginBottom: 12, ...SHADOW.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconBox:{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E0E7FF' },
  title:  { fontSize: 14, fontWeight: '800', color: DARK },
});

// ─── Component ────────────────────────────────────────────────────────────────

export const JobWorkScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { jobCardId } = route.params;
  const { selected, fetchById, updateStatus, update, isLoading } = useJobCardStore();
  const [notes,    setNotes]    = useState('');
  const [updating, setUpdating] = useState(false);

  // ── Dark mechanic header ──
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle:      { backgroundColor: DARK },
      headerTitleStyle: { color: '#fff', fontWeight: '800', fontSize: 16 },
      headerTintColor:  PRIMARY,
      title: 'Job Work',
    });
  }, [navigation]);

  useEffect(() => { fetchById(jobCardId); }, [jobCardId]);

  useFocusEffect(
    useCallback(() => { fetchById(jobCardId); }, [jobCardId]),
  );

  useEffect(() => {
    if (selected?.id === jobCardId && selected?.notes) {
      setNotes(selected.notes);
    }
  }, [selected, jobCardId]);

  if (isLoading || !selected) return <LoadingSpinner fullScreen />;

  const vehicleName    = `${(selected.vehicle as any)?.brand ?? ''} ${selected.vehicle?.model ?? ''}`.trim();
  const plate          = (selected.vehicle as any)?.registration_number ?? '';
  const customerName   = selected.vehicle?.customer?.name ?? '—';
  const customerMobile = selected.vehicle?.customer?.mobile ?? '';

  const availableActions = STATUS_ACTIONS.filter(a => canTransition(selected.status, a.to));

  const handleStatusChange = (action: StatusAction) => {
    if (action.requiresPostTrial && action.to === 'work_completed') {
      Alert.alert(
        'Mark Work Complete',
        'Before marking complete, submit the Post-Trial (QC) checklist.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Do Post-Trial',
            onPress: async () => {
              setUpdating(true);
              try {
                await updateStatus(jobCardId, 'work_completed');
              } catch (e: any) {
                Alert.alert('Failed', e.message ?? 'Could not update status.');
                setUpdating(false);
                return;
              }
              setUpdating(false);
              navigation.navigate('Inspection', {
                jobCardId,
                type: 'post',
                preInspection: selected.inspections?.find(i => i.type === 'pre') ?? null,
              });
            },
          },
        ],
      );
      return;
    }

    Alert.alert('Update Status', `Change to "${action.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: 'default',
        onPress: async () => {
          setUpdating(true);
          try {
            await updateStatus(jobCardId, action.to, notes.trim() || undefined);
          } catch (e: any) {
            Alert.alert('Failed', e.message ?? 'Could not update status.');
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  const handleSaveNotes = async () => {
    try {
      await update(jobCardId, { notes: notes.trim() });
      Alert.alert('Saved', 'Work notes updated.');
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not save notes.');
    }
  };

  const isLocked  = ['delivered', 'cancelled', 'paid'].includes(selected.status);
  const isQcStage = ['work_completed', 'qc_pending', 'qc_failed', 'qc_passed'].includes(selected.status);

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Job header card ── */}
        <View style={s.jobCard}>
          <View style={s.jobCardTop}>
            <View style={s.jobIconBox}>
              <Ionicons name="construct" size={22} color={PRIMARY} />
            </View>
            <View style={s.jobCardInfo}>
              <Text style={s.jobNum}>{selected.job_number ?? selected.id}</Text>
              <Text style={s.jobWorkType}>{selected.work_type?.toUpperCase() ?? 'SERVICE'}</Text>
            </View>
            <JobStatusBadge status={selected.status} large />
          </View>
        </View>

        {/* ── Locked banner ── */}
        {isLocked && (
          <View style={[s.banner, s.bannerGreen]}>
            <Ionicons name="lock-closed" size={16} color="#059669" />
            <Text style={[s.bannerText, { color: '#065F46' }]}>
              {selected.status === 'delivered'
                ? 'Vehicle delivered — job is locked.'
                : selected.status === 'paid'
                  ? 'Payment complete — awaiting delivery.'
                  : 'Job cancelled.'}
            </Text>
          </View>
        )}

        {/* ── QC banner ── */}
        {isQcStage && !isLocked && (
          <View style={[s.banner, selected.status === 'qc_failed' ? s.bannerRed : s.bannerAmber]}>
            <Ionicons
              name={selected.status === 'qc_failed' ? 'warning' : 'shield-checkmark'}
              size={16}
              color={selected.status === 'qc_failed' ? '#DC2626' : '#D97706'}
            />
            <Text style={[s.bannerText, { color: selected.status === 'qc_failed' ? '#991B1B' : '#92400E' }]}>
              {selected.status === 'work_completed' && 'Work complete — submit QC post-trial.'}
              {selected.status === 'qc_pending'     && 'QC in progress — post-trial being reviewed.'}
              {selected.status === 'qc_failed'      && 'QC failed — rework required. Resume work.'}
              {selected.status === 'qc_passed'      && 'QC passed — ready for invoicing.'}
            </Text>
          </View>
        )}

        {/* ── Vehicle ── */}
        <SectionCard title="Vehicle" icon="car-sport-outline">
          <InfoRow icon="car-outline"         label="Vehicle"   value={vehicleName} />
          <InfoRow icon="barcode-outline"     label="Plate No." value={plate} />
          <InfoRow icon="speedometer-outline" label="Odometer"  value={selected.current_kms ? `${selected.current_kms.toLocaleString('en-IN')} km` : '—'} />
        </SectionCard>

        {/* ── Customer ── */}
        <SectionCard title="Customer" icon="person-outline">
          <InfoRow icon="person-circle-outline" label="Name"   value={customerName} />
          {customerMobile ? (
            <View style={ir.row}>
              <View style={ir.iconBox}>
                <Ionicons name="call-outline" size={16} color={PRIMARY} />
              </View>
              <View style={ir.texts}>
                <Text style={ir.label}>Mobile</Text>
                <PhoneMasked phone={customerMobile} />
              </View>
            </View>
          ) : null}
        </SectionCard>

        {/* ── Description ── */}
        {selected.description ? (
          <SectionCard title="Work Description" icon="document-text-outline">
            <Text style={s.descText}>{selected.description}</Text>
          </SectionCard>
        ) : null}

        {/* ── Status transitions ── */}
        {!isLocked && availableActions.length > 0 && (
          <SectionCard title="Update Status" icon="swap-horizontal-outline">
            <View style={s.actionsGrid}>
              {availableActions.map(action => (
                <TouchableOpacity
                  key={`${action.to}-${action.label}`}
                  style={[s.actionBtn, { backgroundColor: action.bg, borderColor: action.color + '50', opacity: updating ? 0.6 : 1 }]}
                  onPress={() => handleStatusChange(action)}
                  disabled={updating}
                  activeOpacity={0.8}
                >
                  <View style={[s.actionIconBox, { backgroundColor: action.color + '20' }]}>
                    <Ionicons name={action.icon as any} size={20} color={action.color} />
                  </View>
                  <Text style={[s.actionText, { color: action.color }]}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </SectionCard>
        )}

        {/* ── Post-trial shortcut ── */}
        {(selected.status === 'work_completed' || selected.status === 'qc_failed') && (
          <TouchableOpacity
            style={s.postTrialBtn}
            onPress={() => navigation.navigate('Inspection', {
              jobCardId,
              type: 'post',
              preInspection: selected.inspections?.find(i => i.type === 'pre') ?? null,
            })}
            activeOpacity={0.85}
          >
            <View style={s.postTrialIcon}>
              <Ionicons name="clipboard-outline" size={20} color="#059669" />
            </View>
            <Text style={s.postTrialText}>
              {selected.status === 'qc_failed' ? 'Re-Submit Post-Trial (QC)' : 'Submit Post-Trial (QC)'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#059669" />
          </TouchableOpacity>
        )}

        {/* ── Work notes ── */}
        {!isLocked && (
          <SectionCard title="Work Notes" icon="pencil-outline">
            <TextInput
              style={s.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about work done, parts used, observations…"
              placeholderTextColor={MUTED}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={s.saveBtn}
              onPress={handleSaveNotes}
              activeOpacity={0.85}
            >
              <Ionicons name="save-outline" size={16} color="#fff" />
              <Text style={s.saveBtnText}>Save Notes</Text>
            </TouchableOpacity>
          </SectionCard>
        )}

        {/* ── Inspections ── */}
        <SectionCard title="Inspections" icon="shield-checkmark-outline">
          <View style={s.inspectionRow}>
            {(['pre', 'post'] as const).map(type => {
              const done = !!selected.inspections?.find(i => i.type === type);
              return (
                <TouchableOpacity
                  key={type}
                  style={[s.inspChip, done && s.inspChipDone]}
                  onPress={() => navigation.navigate('Inspection', {
                    jobCardId,
                    type,
                    preInspection: selected.inspections?.find(i => i.type === 'pre') ?? null,
                  })}
                  activeOpacity={0.8}
                >
                  <View style={[s.inspChipIcon, done && { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons
                      name={done ? 'checkmark-circle' : 'clipboard-outline'}
                      size={18}
                      color={done ? '#059669' : MUTED}
                    />
                  </View>
                  <View>
                    <Text style={[s.inspChipLabel, done && { color: '#059669' }]}>
                      {type === 'pre' ? 'Pre-Trial' : 'Post-Trial'}
                    </Text>
                    <Text style={[s.inspChipStatus, done && { color: '#059669' }]}>
                      {done ? 'Completed ✓' : 'Not done yet'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </SectionCard>

      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content:   { padding: SPACING.md, paddingBottom: 100 },

  // Job header card
  jobCard:     { backgroundColor: DARK, borderRadius: 20, padding: 18, marginBottom: 12, ...SHADOW.sm },
  jobCardTop:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  jobIconBox:  { width: 48, height: 48, borderRadius: 14, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  jobCardInfo: { flex: 1 },
  jobNum:      { fontSize: 16, fontWeight: '800', color: '#fff' },
  jobWorkType: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3, fontWeight: '600', letterSpacing: 0.5 },

  // Banners
  banner:       { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1 },
  bannerGreen:  { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
  bannerRed:    { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  bannerAmber:  { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  bannerText:   { flex: 1, fontSize: 13, fontWeight: '600' },

  // Description
  descText: { fontSize: 14, color: SUBTLE, lineHeight: 22 },

  // Status action buttons
  actionsGrid:  { gap: 10 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1.5, paddingVertical: 14, paddingHorizontal: 16 },
  actionIconBox:{ width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionText:   { fontSize: 14, fontWeight: '800', flex: 1 },

  // Post-trial
  postTrialBtn:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ECFDF5', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#6EE7B7', ...SHADOW.sm },
  postTrialIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' },
  postTrialText: { flex: 1, fontSize: 14, fontWeight: '800', color: '#059669' },

  // Notes
  notesInput: { backgroundColor: BG, borderRadius: 12, padding: 14, fontSize: 14, color: TEXT, minHeight: 110, borderWidth: 1.5, borderColor: BORDER, marginBottom: 12, lineHeight: 22 },
  saveBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 12, alignSelf: 'flex-end', paddingHorizontal: 20 },
  saveBtnText:{ fontSize: 14, fontWeight: '800', color: '#fff' },

  // Inspections
  inspectionRow: { flexDirection: 'row', gap: 10 },
  inspChip:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: BG, borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: BORDER },
  inspChipDone:  { backgroundColor: '#F0FDF4', borderColor: '#6EE7B7' },
  inspChipIcon:  { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  inspChipLabel: { fontSize: 12, fontWeight: '800', color: SUBTLE },
  inspChipStatus:{ fontSize: 11, color: MUTED, fontWeight: '500', marginTop: 1 },
});
