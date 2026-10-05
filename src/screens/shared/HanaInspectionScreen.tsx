import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet,
} from 'react-native';
import { Alert }          from 'react-native';
import { Ionicons }       from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { TrialChecklistTable } from '../../components/job/TrialChecklistTable';
import { AppLoaderModal }      from '../../components/common/AppLoaderModal';
import { jobcardApi, HanaJobCard, HanaInspectionData } from '../../api/jobcardApi';
import { useAuthStore }        from '../../stores/authStore';
import { showToast }           from '../../utils/toast';
import { useMultiImageUpload }    from '../../hooks/useImageUpload';
import { ImagePickerBottomSheet } from '../../components/common/ImagePickerBottomSheet';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../config/theme';
import type { CreateInspectionPayload, Inspection, InspectionRating } from '../../types';

// ─── Helper ───────────────────────────────────────────────────────────────────

function toInspectionShape(data: HanaInspectionData): Inspection {
  return {
    id:             'pre',
    job_card_id:    '',
    type:           'pre',
    engine:         (data.engine   as InspectionRating) ?? 'good',
    brakes:         (data.brakes   as InspectionRating) ?? 'good',
    clutch:         (data.clutch   as InspectionRating) ?? 'good',
    ac:             (data.ac       as InspectionRating) ?? 'good',
    battery:        (data.battery  as InspectionRating) ?? 'good',
    tyres:          (data.tyres    as InspectionRating) ?? 'good',
    lights:         (data.lights   as InspectionRating) ?? 'good',
    steering:       (data.steering as InspectionRating) ?? 'good',
    notes:          data.notes,
    road_test_done: data.road_test_done ?? false,
    inspected_by:   data.checkedBy ?? '',
    created_at:     data.checkedAt ?? new Date().toISOString(),
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const HanaInspectionScreen: React.FC<{ route: any; navigation: any }> = ({
  route, navigation,
}) => {
  const { jobCardId, type = 'pre' } = route.params ?? {};
  const { user } = useAuthStore();

  const [jobCard,    setJobCard]    = useState<HanaJobCard | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Inspection photo upload ───────────────────────────────────────────────
  const {
    imageUrls:   photoUrls,
    isUploading: photosUploading,
    removeImage: removePhoto,
    pickerVisible, openPicker, closePicker,
    handlePickerCamera, handlePickerGallery,
  } = useMultiImageUpload({ moduleName: 'jobcard', maxImages: 8 });

  // ── Load job card ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const card = await jobcardApi.getById(jobCardId);
      setJobCard(card);
    } catch (e: any) {
      showToast(e.message ?? 'Failed to load job card', 'error');
    } finally {
      setLoading(false);
    }
  }, [jobCardId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (payload: CreateInspectionPayload) => {
    setSubmitting(true);
    try {
      const inspectionData: HanaInspectionData = {
        completed:      true,
        checkedAt:      new Date().toISOString(),
        checkedBy:      (user as any)?._id ?? user?.id ?? '',
        notes:          payload.notes,
        engine:         payload.engine,
        brakes:         payload.brakes,
        clutch:         payload.clutch,
        ac:             payload.ac,
        battery:        payload.battery,
        tyres:          payload.tyres,
        lights:         payload.lights,
        steering:       payload.steering,
        road_test_done: payload.road_test_done,
        ...(photoUrls.length > 0 && { photos: photoUrls }),
      } as any;

      const inspType = type === 'post' ? 'postTrial' : 'preTrial';
      await jobcardApi.updateInspection(jobCardId, inspType, inspectionData);

      if (type === 'pre') {
        Alert.alert(
          'Pre-Trial Saved',
          'Vehicle condition recorded before work begins.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        const poorItems = (
          ['engine', 'brakes', 'clutch', 'ac', 'battery', 'tyres', 'lights', 'steering'] as const
        ).filter(k => payload[k] === 'poor');

        if (poorItems.length > 0) {
          Alert.alert(
            'QC Failed',
            `${poorItems.length} item(s) rated Poor: ${poorItems.join(', ')}.\n\nJob flagged for rework.`,
            [{ text: 'OK', onPress: () => navigation.goBack() }],
          );
        } else {
          Alert.alert(
            'QC Passed ✓',
            'Post-trial inspection passed. Job is ready for invoicing.',
            [{ text: 'OK', onPress: () => navigation.goBack() }],
          );
        }
      }
    } catch (e: any) {
      showToast(e.message ?? 'Failed to save inspection', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AppLoaderModal visible message="Loading job card…" />;

  const preTrialShape = jobCard?.inspections?.preTrial
    ? toInspectionShape(jobCard.inspections.preTrial)
    : null;

  return (
    <>
      <AppLoaderModal visible={photosUploading} message="Uploading photo…" />
      <ImagePickerBottomSheet
        visible={pickerVisible}
        onClose={closePicker}
        onCamera={handlePickerCamera}
        onGallery={handlePickerGallery}
        title="Inspection Photos"
      />

      <ScrollView
        style={s.screen}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Inspection photos ── */}
        <View style={s.photoCard}>
          <Text style={s.sectionLabel}>Inspection Photos</Text>

          <View style={s.photoRow}>
            {photoUrls.map((uri, idx) => (
              <View key={uri} style={s.photoThumb}>
                <Image source={{ uri }} style={s.thumbImg} resizeMode="cover" />
                <TouchableOpacity
                  style={s.thumbRemove}
                  onPress={() => removePhoto(idx)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}

            {photoUrls.length < 8 && (
              <TouchableOpacity
                style={s.addPhotoBtn}
                onPress={openPicker}
                activeOpacity={0.75}
              >
                <Ionicons name="camera-outline" size={22} color={COLORS.primary} />
                <Text style={s.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {photoUrls.length > 0 && (
            <Text style={s.photoCount}>
              {photoUrls.length} photo{photoUrls.length !== 1 ? 's' : ''} attached
            </Text>
          )}
        </View>

        {/* ── Checklist ── */}
        <TrialChecklistTable
          jobCardId={jobCardId}
          mode={type === 'post' ? 'post-form' : 'pre-view'}
          preInspection={preTrialShape}
          onSubmit={handleSubmit}
          submitLoading={submitting}
        />
      </ScrollView>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: SPACING.xxl },

  photoCard: {
    backgroundColor: COLORS.surface,
    margin:          SPACING.md,
    marginBottom:    0,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    ...SHADOW.sm,
  },
  sectionLabel: {
    fontSize:     FONT.sizes.sm,
    fontWeight:   '700',
    color:        COLORS.text,
    marginBottom: SPACING.sm,
  },

  photoRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  photoThumb:  { position: 'relative' },
  thumbImg:    { width: 72, height: 72, borderRadius: RADIUS.md, backgroundColor: COLORS.border },
  thumbRemove: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 10 },

  addPhotoBtn: {
    width:          72,
    height:         72,
    borderRadius:   RADIUS.md,
    borderWidth:    1.5,
    borderColor:    COLORS.primary,
    borderStyle:    'dashed',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            3,
  },
  addPhotoText: { fontSize: FONT.sizes.xs, color: COLORS.primary, fontWeight: '600' },
  photoCount:   { fontSize: FONT.sizes.xs, color: COLORS.textMuted, marginTop: SPACING.xs },
});
