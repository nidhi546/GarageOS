import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT, RADIUS } from '../../config/theme';

interface Props {
  icon:       keyof typeof Ionicons.glyphMap;
  iconBg?:    string;
  iconColor?: string;
  label:      string;
  value?:     string;
  onPress?:   () => void;
  showArrow?: boolean;
  danger?:    boolean;
  badge?:     string;
  badgeBg?:   string;
  badgeColor?:string;
}

export const ProfileItem: React.FC<Props> = ({
  icon, iconBg, iconColor, label, value,
  onPress, showArrow, danger = false,
  badge, badgeBg, badgeColor,
}) => {
  const shouldShowArrow = showArrow ?? !!onPress;
  const iBg    = iconBg    ?? (danger ? COLORS.dangerLight  : COLORS.primaryLight);
  const iColor = iconColor ?? (danger ? COLORS.danger       : COLORS.primary);

  const inner = (
    <View style={s.row}>
      <View style={[s.iconBox, { backgroundColor: iBg }]}>
        <Ionicons name={icon} size={18} color={iColor} />
      </View>

      <View style={s.textBox}>
        <Text style={[s.label, danger && s.labelDanger]} numberOfLines={1}>{label}</Text>
        {!!value && (
          <Text style={s.value} numberOfLines={2}>{value}</Text>
        )}
      </View>

      {badge ? (
        <View style={[s.badge, { backgroundColor: badgeBg ?? COLORS.primaryLight }]}>
          <Text style={[s.badgeText, { color: badgeColor ?? COLORS.primary }]}>{badge}</Text>
        </View>
      ) : null}

      {shouldShowArrow && (
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      )}
    </View>
  );

  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{inner}</TouchableOpacity>
  ) : inner;
};

const s = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    gap:               SPACING.sm,
    minHeight:         56,
  },
  iconBox: {
    width:           38,
    height:          38,
    borderRadius:    RADIUS.md,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  textBox:     { flex: 1 },
  label:       { fontSize: FONT.sizes.md, fontWeight: '500', color: COLORS.text },
  labelDanger: { color: COLORS.danger },
  value:       { fontSize: FONT.sizes.sm, color: COLORS.textSecondary, marginTop: 1 },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical:   3,
    borderRadius:      RADIUS.full,
  },
  badgeText: { fontSize: FONT.sizes.xs, fontWeight: '700' },
});
