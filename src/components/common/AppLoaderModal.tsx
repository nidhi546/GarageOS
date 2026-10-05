import React from 'react';
import {
  Modal, View, Text, ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../config/theme';

interface AppLoaderModalProps {
  visible:      boolean;
  message?:     string;
  transparent?: boolean;
}

export const AppLoaderModal: React.FC<AppLoaderModalProps> = React.memo(({
  visible,
  message,
  transparent = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {/* dismiss blocked intentionally */}}
    >
      <View style={s.backdrop}>
        <View style={[s.card, transparent && s.cardTransparent]}>
          <ActivityIndicator size="large" color={transparent ? '#fff' : COLORS.primary} />
          {!!message && (
            <Text style={[s.message, transparent && s.messageTransparent]}>
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
});

AppLoaderModal.displayName = 'AppLoaderModal';

const s = StyleSheet.create({
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems:      'center',
    justifyContent:  'center',
  },

  card: {
    // backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.xl,
    padding:         SPACING.xl,
    alignItems:      'center',
    minWidth:        140,
    gap:             SPACING.sm,
    ...SHADOW.md,
    elevation:       8,
  },
  cardTransparent: {
    backgroundColor: 'transparent',
    ...Platform.select({ ios: { shadowOpacity: 0 }, android: {} }),
    elevation: 0,
  },

  message: {
    fontSize:   FONT.sizes.sm,
    fontWeight: '600',
    color:      COLORS.text,
    textAlign:  'center',
    maxWidth:   180,
  },
  messageTransparent: {
    color: '#fff',
  },
});
