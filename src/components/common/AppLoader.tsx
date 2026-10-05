import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT } from '../../config/theme';

export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg';

interface AppLoaderProps {
  visible: boolean;
  size?:   LoaderSize;
  message?: string;
}

const INDICATOR_SIZE: Record<LoaderSize, 'small' | 'large'> = {
  xs: 'small',
  sm: 'small',
  md: 'large',
  lg: 'large',
};

export const AppLoader: React.FC<AppLoaderProps> = React.memo(({
  visible,
  size = 'md',
  message,
}) => {
  if (!visible) return null;

  return (
    <View style={s.inline}>
      <ActivityIndicator size={INDICATOR_SIZE[size]} color={COLORS.primary} />
      {!!message && <Text style={s.message}>{message}</Text>}
    </View>
  );
});

AppLoader.displayName = 'AppLoader';

const s = StyleSheet.create({
  inline: {
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  message: {
    fontSize:  FONT.sizes.sm,
    color:     COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
