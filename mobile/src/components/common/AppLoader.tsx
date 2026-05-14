import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { COLORS, SPACING, FONT } from '../../config/theme';

export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg';

interface AppLoaderProps {
  visible: boolean;
  size?:   LoaderSize;
  message?: string;
}

const SIZE_PX: Record<LoaderSize, number> = {
  xs:  24,
  sm:  36,
  md:  80,
  lg: 120,
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const LOADER_SOURCE = require('../../assets/animations/loader.json');

export const AppLoader: React.FC<AppLoaderProps> = React.memo(({
  visible,
  size = 'md',
  message,
}) => {
  const animRef = useRef<LottieView>(null);

  useEffect(() => {
    if (visible) animRef.current?.play();
  }, [visible]);

  if (!visible) return null;

  const px = SIZE_PX[size];

  return (
    <View style={s.inline}>
      <LottieView
        ref={animRef}
        source={LOADER_SOURCE}
        autoPlay
        loop
        style={{ width: px, height: px }}
        renderMode="AUTOMATIC"
        resizeMode="contain"
      />
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
