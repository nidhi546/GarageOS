import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity,
  StyleSheet, Pressable, Image, ScrollView,
} from 'react-native';
<<<<<<< HEAD
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
=======
import { Ionicons }       from '@expo/vector-icons';
import * as ImagePicker   from 'expo-image-picker';
import { showToast }      from '../../utils/toast';
import { AppLoader }      from './AppLoader';
import { uploadImages, extractUploadedUrls, UploadModule } from '../../utils/uploadFile';
>>>>>>> b4f26d8f (changes)
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../config/theme';

export interface PickedImage {
  uri:       string;
  fileName?: string;
  type?:     string;
}

interface Props {
  visible:  boolean;
  onClose:  () => void;
  images:   PickedImage[];
  onImagesChange: (images: PickedImage[]) => void;
  maxImages?: number;
  title?:     string;

  /**
   * When set, every newly-picked image is uploaded immediately.
   * `onUploadComplete` is called once all uploads finish with the HTTPS URLs.
   * Use these URLs — NOT `images[].uri` — for database saves.
   */
  moduleName?:        UploadModule;
  onUploadComplete?:  (httpsUrls: string[]) => void;
}

export const ImagePickerModal: React.FC<Props> = ({
  visible,
  onClose,
  images,
  onImagesChange,
  maxImages = 10,
  title = 'Add Photos',
  moduleName,
  onUploadComplete,
}) => {
<<<<<<< HEAD
  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: maxImages - images.length,
    });
    if (!result.canceled) {
      const picked: PickedImage[] = result.assets.map(a => ({
        uri: a.uri,
        fileName: a.fileName ?? undefined,
        type: a.mimeType ?? 'image/jpeg',
      }));
      onImagesChange([...images, ...picked].slice(0, maxImages));
=======
  const remaining   = maxImages - images.length;
  const uploadMode  = !!moduleName;
  const [uploading, setUploading] = useState(false);

  // ── After picking: either upload (if moduleName provided) or just store locally ──

  const handlePicked = async (picked: PickedImage[]) => {
    if (picked.length === 0) return;

    const merged = [...images, ...picked].slice(0, maxImages);
    onImagesChange(merged);    // local preview immediately

    if (!uploadMode) return;  // no upload requested — caller handles raw URIs

    setUploading(true);
    try {
      const results  = await uploadImages(picked, moduleName!);
      const urls     = extractUploadedUrls(results);
      const failed   = results.length - urls.length;

      if (failed > 0) {
        showToast(
          `${urls.length} uploaded, ${failed} failed — check connection`,
          failed === results.length ? 'error' : 'info',
        );
      }

      if (urls.length > 0) {
        onUploadComplete?.(urls);
      }
    } finally {
      setUploading(false);
    }
  };

  // ── Gallery picker ────────────────────────────────────────────────────────

  const pickFromGallery = async () => {
    try {
      const ok = await ensureGalleryPermission();
      if (!ok) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:              ['images'] as ImagePicker.MediaType[],
        allowsMultipleSelection: true,
        quality:                 0.85,
        selectionLimit:          remaining,
        exif:                    false,
      });

      if (result.canceled || !result.assets?.length) return;

      await handlePicked(result.assets.map(a => ({
        uri:      a.uri,
        fileName: a.fileName ?? undefined,
        type:     a.mimeType ?? 'image/jpeg',
      })));
    } catch {
      showToast('Failed to open gallery. Please try again.', 'error');
>>>>>>> b4f26d8f (changes)
    }
  };

  // ── Camera picker ─────────────────────────────────────────────────────────

  const pickFromCamera = async () => {
<<<<<<< HEAD
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const picked: PickedImage = {
        uri: asset.uri,
        fileName: asset.fileName ?? undefined,
        type: asset.mimeType ?? 'image/jpeg',
      };
      onImagesChange([...images, picked].slice(0, maxImages));
=======
    try {
      const ok = await ensureCameraPermission();
      if (!ok) return;

      const result = await ImagePicker.launchCameraAsync({
        quality:       0.85,
        allowsEditing: false,
        exif:          false,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      await handlePicked([{
        uri:      asset.uri,
        fileName: asset.fileName ?? undefined,
        type:     asset.mimeType ?? 'image/jpeg',
      }]);
    } catch {
      showToast('Failed to open camera. Please try again.', 'error');
>>>>>>> b4f26d8f (changes)
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose} />
      <View style={s.sheet}>
        {/* Handle */}
        <View style={s.handle} />

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

<<<<<<< HEAD
        {/* Source options */}
        <View style={s.optionsRow}>
          <TouchableOpacity
            style={s.optionBtn}
            onPress={pickFromCamera}
            activeOpacity={0.8}
            disabled={images.length >= maxImages}
=======
        {/* Upload mode warning: remind callers to use HTTPS URLs */}
        {!uploadMode && (
          <View style={s.warnBanner}>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.warning} />
            <Text style={s.warnText}>
              Pass <Text style={s.warnCode}>moduleName</Text> prop to auto-upload.
              Never save <Text style={s.warnCode}>image.uri</Text> to DB.
            </Text>
          </View>
        )}

        {/* Source buttons */}
        <View style={s.optionsRow}>
          <TouchableOpacity
            style={[s.optionBtn, (remaining === 0 || uploading) && s.optionBtnDisabled]}
            onPress={pickFromCamera}
            activeOpacity={0.8}
            disabled={remaining === 0 || uploading}
>>>>>>> b4f26d8f (changes)
          >
            <View style={[s.optionIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="camera-outline" size={26} color={COLORS.primary} />
            </View>
            <Text style={s.optionLabel}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
<<<<<<< HEAD
            style={s.optionBtn}
            onPress={pickFromGallery}
            activeOpacity={0.8}
            disabled={images.length >= maxImages}
=======
            style={[s.optionBtn, (remaining === 0 || uploading) && s.optionBtnDisabled]}
            onPress={pickFromGallery}
            activeOpacity={0.8}
            disabled={remaining === 0 || uploading}
>>>>>>> b4f26d8f (changes)
          >
            <View style={[s.optionIcon, { backgroundColor: COLORS.successLight }]}>
              <Ionicons name="images-outline" size={26} color={COLORS.success} />
            </View>
            <Text style={s.optionLabel}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Upload progress */}
        {uploading && (
          <View style={s.uploadingRow}>
            <AppLoader visible size="sm" />
            <Text style={s.uploadingText}>Uploading…</Text>
          </View>
        )}

        {/* Counter */}
        <Text style={s.counter}>{images.length} / {maxImages} photos</Text>

        {/* Preview grid */}
        {images.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.previewRow}
          >
            {images.map((img, idx) => (
              <View key={idx} style={s.previewWrap}>
                <Image source={{ uri: img.uri }} style={s.previewImg} />
                <TouchableOpacity style={s.removeBtn} onPress={() => removeImage(idx)}>
                  <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Done */}
<<<<<<< HEAD
        <TouchableOpacity style={s.doneBtn} onPress={onClose} activeOpacity={0.85}>
          <Text style={s.doneBtnText}>Done</Text>
=======
        <TouchableOpacity
          style={[s.doneBtn, uploading && { opacity: 0.6 }]}
          onPress={onClose}
          activeOpacity={0.85}
          disabled={uploading}
        >
          <Text style={s.doneBtnText}>
            {images.length > 0 ? `Done  (${images.length} selected)` : 'Done'}
          </Text>
>>>>>>> b4f26d8f (changes)
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
<<<<<<< HEAD
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.md, paddingBottom: 36, ...SHADOW.lg },
  handle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SPACING.md },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  title:        { fontSize: FONT.sizes.lg, fontWeight: '700', color: COLORS.text },
  optionsRow:   { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  optionBtn:    { flex: 1, alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, gap: SPACING.sm, ...SHADOW.sm },
  optionIcon:   { width: 56, height: 56, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  optionLabel:  { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.text },
=======
  overlay:             { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:               { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.md, paddingBottom: 36, ...SHADOW.lg },
  handle:              { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SPACING.md },
  header:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  title:               { fontSize: FONT.sizes.lg, fontWeight: '700', color: COLORS.text },

  warnBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.warningLight, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 6, marginBottom: SPACING.sm },
  warnText:   { flex: 1, fontSize: FONT.sizes.xs, color: COLORS.warning },
  warnCode:   { fontWeight: '700' },

  optionsRow:          { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm },
  optionBtn:           { flex: 1, alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, gap: SPACING.sm, ...SHADOW.sm },
  optionBtnDisabled:   { opacity: 0.45 },
  optionIcon:          { width: 56, height: 56, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  optionLabel:         { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.text },
  optionLabelDisabled: { color: COLORS.textMuted },

  uploadingRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  uploadingText: { fontSize: FONT.sizes.sm, color: COLORS.textMuted },

>>>>>>> b4f26d8f (changes)
  counter:      { fontSize: FONT.sizes.xs, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.sm },
  previewRow:   { paddingVertical: SPACING.sm, gap: SPACING.sm, paddingHorizontal: 2 },
  previewWrap:  { position: 'relative' },
  previewImg:   { width: 80, height: 80, borderRadius: RADIUS.md, backgroundColor: COLORS.border },
<<<<<<< HEAD
  removeBtn:    { position: 'absolute', top: -6, right: -6, backgroundColor: '#fff', borderRadius: 10 },
=======
  removeBtn:    { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 11 },
>>>>>>> b4f26d8f (changes)
  doneBtn:      { marginTop: SPACING.md, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING.md, alignItems: 'center' },
  doneBtnText:  { fontSize: FONT.sizes.md, fontWeight: '700', color: '#fff' },
});
