import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../config/theme';

interface SectionProps {
  title:    string;
  children: React.ReactNode;
}

export const ProfileSection: React.FC<SectionProps> = ({ title, children }) => (
  <View style={s.container}>
    <Text style={s.title}>{title}</Text>
    <View style={s.card}>{children}</View>
  </View>
);

export const ProfileDivider: React.FC = () => <View style={s.divider} />;

const s = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.md,
    marginBottom:     SPACING.md,
  },
  title: {
    fontSize:        FONT.sizes.xs,
    fontWeight:      '700',
    color:           COLORS.textMuted,
    textTransform:   'uppercase',
    letterSpacing:   0.8,
    marginBottom:    SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.lg,
    overflow:        'hidden',
    ...SHADOW.sm,
  },
  divider: {
    height:          1,
    backgroundColor: COLORS.border,
    marginLeft:      SPACING.md + 38 + SPACING.sm,
  },
});
