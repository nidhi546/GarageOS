<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useJobCardStore } from '../../stores/jobCardStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
=======
import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform,
  Alert, RefreshControl,
} from 'react-native';
import { AppLoader }      from '../../components/common/AppLoader';
import { AppLoaderModal } from '../../components/common/AppLoaderModal';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons }       from '@expo/vector-icons';
import { estimateApi, HanaEstimate } from '../../api/estimateApi';
import { jobcardApi }                from '../../api/jobcardApi';
import { useAuthStore }   from '../../stores/authStore';
import { EmptyState }     from '../../components/common/EmptyState';
import { showToast }      from '../../utils/toast';
>>>>>>> b4f26d8f (changes)
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../config/theme';
import { dummyEstimates } from '../../dummy/estimates';
import { Estimate } from '../../types';

export const ApprovalsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { jobCards, fetchAll, isLoading } = useJobCardStore();
  const [estimates, setEstimates] = useState<Estimate[]>([]);

  useEffect(() => {
    fetchAll();
    setEstimates(dummyEstimates.filter(e => e.status === 'draft' || e.status === 'sent' || e.status === 'DRAFT' || e.status === 'SENT'));
  }, []);

  const handleApprove = (id: string) => {
    Alert.alert('Approve Estimate', 'Approve this estimate?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve', onPress: () => {
          setEstimates(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' as any } : e));
        },
      },
    ]);
  };

  const handleReject = (id: string) => {
    Alert.alert('Reject Estimate', 'Reject this estimate?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: () => {
          setEstimates(prev => prev.filter(e => e.id !== id));
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Estimate }) => {
    const job = jobCards.find(j => j.id === item.job_card_id);
    const vehicleText = job ? `${(job.vehicle as any)?.brand ?? ''} ${job.vehicle?.model ?? ''}`.trim() : '—';

    return (
      <View style={s.card}>
        <TouchableOpacity onPress={() => navigation.navigate('JobCardDetail', { id: item.job_card_id })} activeOpacity={0.8}>
          <View style={s.cardHeader}>
            <View>
              <Text style={s.jobNum}>{job?.job_number ?? item.job_card_id}</Text>
              <Text style={s.vehicle}>{vehicleText}</Text>
            </View>
            <View style={s.totalBox}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>₹{item.total.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Items summary */}
          <View style={s.itemsList}>
            {item.items.slice(0, 3).map((it, idx) => (
              <View key={idx} style={s.itemRow}>
                <Text style={s.itemName} numberOfLines={1}>{it.name}</Text>
                <Text style={s.itemAmt}>₹{it.amount.toLocaleString('en-IN')}</Text>
              </View>
            ))}
            {item.items.length > 3 && (
              <Text style={s.moreItems}>+{item.items.length - 3} more items</Text>
            )}
          </View>

          <View style={s.totalsRow}>
            <Text style={s.subtotalText}>Subtotal ₹{item.subtotal.toLocaleString('en-IN')}</Text>
            <Text style={s.gstText}>GST ₹{item.gst_amount.toLocaleString('en-IN')}</Text>
          </View>
        </TouchableOpacity>

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity style={s.rejectBtn} onPress={() => handleReject(item.id)}>
            <Ionicons name="close-outline" size={16} color={COLORS.danger} />
            <Text style={s.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.reviseBtn} onPress={() => navigation.navigate('Estimate', { jobCardId: item.job_card_id })}>
            <Ionicons name="create-outline" size={16} color={COLORS.warning} />
            <Text style={s.reviseText}>Revise</Text>
          </TouchableOpacity>
<<<<<<< HEAD
          <TouchableOpacity style={s.approveBtn} onPress={() => handleApprove(item.id)}>
=======

          <TouchableOpacity
            style={[s.approveBtn, isProcessing && s.btnDisabled]}
            onPress={() => handleApprove(item)}
            disabled={!!processingId}
          >
>>>>>>> b4f26d8f (changes)
            <Ionicons name="checkmark-outline" size={16} color="#fff" />
            <Text style={s.approveText}>Approve</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

<<<<<<< HEAD
  if (isLoading) return <LoadingSpinner fullScreen />;

=======
>>>>>>> b4f26d8f (changes)
  return (
    <View style={s.container}>
      <AppLoaderModal visible={loading && estimates.length === 0} />
      <AppLoaderModal visible={!!processingId} message="Processing…" />
      <FlatList
        data={estimates}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        ListEmptyComponent={<EmptyState title="All clear!" message="No estimates pending approval" icon="checkmark-circle-outline" />}
      />
<<<<<<< HEAD
=======

      {/* ── Reject reason modal ── */}
      <Modal
        visible={!!rejectTarget}
        transparent
        animationType="slide"
        onRequestClose={() => !rejecting && setRejectTarget(null)}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Reject Estimate</Text>
            <Text style={s.modalSub}>
              {rejectTarget?.vehicleName ?? rejectTarget?.registrationNumber ?? 'Estimate'}
            </Text>

            <TextInput
              style={s.reasonInput}
              placeholder="Reason for rejection (optional)"
              placeholderTextColor={COLORS.textMuted}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!rejecting}
            />

            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => !rejecting && setRejectTarget(null)}
                disabled={rejecting}
              >
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.confirmRejectBtn, rejecting && s.btnDisabled]}
                onPress={confirmReject}
                disabled={rejecting}
              >
                {rejecting ? (
                  <AppLoader visible size="sm" />
                ) : (
                  <Text style={s.confirmRejectText}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
>>>>>>> b4f26d8f (changes)
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  jobNum: { fontSize: FONT.sizes.md, fontWeight: '700', color: COLORS.text },
  vehicle: { fontSize: FONT.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  totalBox: { alignItems: 'flex-end' },
  totalLabel: { fontSize: FONT.sizes.xs, color: COLORS.textMuted },
  totalValue: { fontSize: FONT.sizes.lg, fontWeight: '700', color: COLORS.text },
  itemsList: { backgroundColor: COLORS.background, borderRadius: RADIUS.sm, padding: SPACING.sm, marginBottom: SPACING.sm },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemName: { fontSize: FONT.sizes.sm, color: COLORS.text, flex: 1 },
  itemAmt: { fontSize: FONT.sizes.sm, color: COLORS.text, fontWeight: '600' },
  moreItems: { fontSize: FONT.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  totalsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm },
  subtotalText: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary },
  gstText: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary },
  actions: { flexDirection: 'row', gap: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: COLORS.danger },
  rejectText: { fontSize: FONT.sizes.sm, color: COLORS.danger, fontWeight: '600' },
  reviseBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: COLORS.warning },
  reviseText: { fontSize: FONT.sizes.sm, color: COLORS.warning, fontWeight: '600' },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: RADIUS.sm, backgroundColor: COLORS.success },
  approveText: { fontSize: FONT.sizes.sm, color: '#fff', fontWeight: '600' },
});
