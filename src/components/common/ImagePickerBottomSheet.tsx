import React from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  Pressable, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons }          from '@expo/vector-icons';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../config/theme';

interface Props {
  visible:   boolean;
  onClose:   () => void;
  onCamera:  () => void;
  onGallery: () => void;
  onRemove?: () => void;
  title?:    string;
}

export const ImagePickerBottomSheet: React.FC<Props> = ({
  visible,
  onClose,
  onCamera,
  onGallery,
  onRemove,
  title = 'Choose Photo',
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={s.backdrop} onPress={onClose} />

      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, SPACING.md) + SPACING.sm }]}>

        <View style={s.handle} />
        <Text style={s.title}>{title}</Text>

        <TouchableOpacity style={s.row} onPress={onCamera} activeOpacity={0.7}>
          <View style={[s.iconBox, s.iconCamera]}>
            <Ionicons name="camera-outline" size={22} color={COLORS.primary} />
          </View>
          <Text style={s.rowText}>Take Photo</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={s.row} onPress={onGallery} activeOpacity={0.7}>
          <View style={[s.iconBox, s.iconGallery]}>
            <Ionicons name="images-outline" size={22} color={COLORS.success} />
          </View>
          <Text style={s.rowText}>Choose from Gallery</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>

        {onRemove && (
          <TouchableOpacity
            style={s.row}
            onPress={() => { onRemove(); onClose(); }}
            activeOpacity={0.7}
          >
            <View style={[s.iconBox, s.iconRemove]}>
              <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
            </View>
            <Text style={[s.rowText, s.removeText]}>Remove Photo</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}

        <View style={s.divider} />

        <TouchableOpacity style={s.cancelRow} onPress={onClose} activeOpacity={0.7}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },

  sheet: {
    backgroundColor:      COLORS.surface,
    borderTopLeftRadius:  RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop:           SPACING.xs,
    paddingHorizontal:    SPACING.md,
    ...SHADOW.lg,
  },
  handle: {
    width:        40,
    height:       4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf:    'center',
    marginTop:    SPACING.sm,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize:     FONT.sizes.md,
    fontWeight:   '700',
    color:        COLORS.text,
    textAlign:    'center',
    marginBottom: SPACING.md,
  },

  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.md,
    paddingVertical:   SPACING.sm + 2,
    paddingHorizontal: SPACING.xs,
    borderRadius:      RADIUS.md,
    marginBottom:      2,
  },
  iconBox: {
    width:          44,
    height:         44,
    borderRadius:   RADIUS.md,
    alignItems:     'center',
    justifyContent: 'center',
  },
  iconCamera:  { backgroundColor: COLORS.primaryLight },
  iconGallery: { backgroundColor: COLORS.successLight },
  iconRemove:  { backgroundColor: COLORS.dangerLight  },

  rowText:    { flex: 1, fontSize: FONT.sizes.md, fontWeight: '500', color: COLORS.text },
  removeText: { color: COLORS.danger },

  divider:   { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  cancelRow: { alignItems: 'center', paddingVertical: SPACING.md, borderRadius: RADIUS.md },
  cancelText: { fontSize: FONT.sizes.md, fontWeight: '600', color: COLORS.textMuted },
});
