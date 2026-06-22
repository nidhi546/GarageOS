import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar }   from '../common/Avatar';
import { User, Company } from '../../types';
import { COLORS, SPACING, FONT, RADIUS } from '../../config/theme';

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_CFG: Record<string, { label: string; color: string }> = {
  OWNER:        { label: 'Owner',        color: '#2563EB' },
  SUPER_ADMIN:  { label: 'Super Admin',  color: '#7C3AED' },
  MANAGER:      { label: 'Manager',      color: '#7C3AED' },
  MECHANIC:     { label: 'Mechanic',     color: '#16A34A' },
  RECEPTIONIST: { label: 'Receptionist', color: '#D97706' },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  user:          User;
  localAvatar?:  string;
  onAvatarPress: () => void;
  company?:      Company | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ProfileHeader: React.FC<Props> = ({
  user, localAvatar, onAvatarPress, company,
}) => {
  const cfg  = ROLE_CFG[user.role] ?? ROLE_CFG.OWNER;
  const name = user.legalname ?? user.name;

  return (
    <View style={[s.card, { backgroundColor: cfg.color }]}>
      {/* Decorative bubbles */}
      <View style={s.bubble1} />
      <View style={s.bubble2} />

      {/* Avatar with camera badge */}
      <TouchableOpacity
        style={s.avatarWrap}
        onPress={onAvatarPress}
        activeOpacity={0.85}
      >
        <View style={s.avatarRing}>
          <Avatar name={name} size={84} imageUrl={localAvatar} />
        </View>
        <View style={s.cameraBadge}>
          <Ionicons name="camera" size={12} color="#fff" />
        </View>
      </TouchableOpacity>

      {/* Name */}
      <Text style={s.name} numberOfLines={1}>{name}</Text>

      {/* Role pill */}
      <View style={s.rolePill}>
        <Text style={[s.roleText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>

      {/* Contact chips */}
      <View style={s.contactRow}>
        {(user.mobile || user.phone) ? (
          <View style={s.chip}>
            <Ionicons name="call-outline" size={11} color="rgba(255,255,255,0.9)" />
            <Text style={s.chipText}>{user.mobile ?? user.phone}</Text>
          </View>
        ) : null}
        {user.email ? (
          <View style={s.chip}>
            <Ionicons name="mail-outline" size={11} color="rgba(255,255,255,0.9)" />
            <Text style={s.chipText} numberOfLines={1}>{user.email}</Text>
          </View>
        ) : null}
      </View>

      {/* Company badge */}
      {company ? (
        <View style={s.companyRow}>
          <Ionicons name="business-outline" size={12} color="rgba(255,255,255,0.65)" />
          <Text style={s.companyText}>{company.name}</Text>
        </View>
      ) : null}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    alignItems:        'center',
    paddingTop:        SPACING.xl + SPACING.md,
    paddingBottom:     SPACING.xl,
    paddingHorizontal: SPACING.lg,
    marginBottom:      SPACING.md,
    overflow:          'hidden',
    gap:               SPACING.xs,
  },

  // Decorative
  bubble1: {
    position:        'absolute',
    width:           200,
    height:          200,
    borderRadius:    100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top:             -70,
    right:           -50,
  },
  bubble2: {
    position:        'absolute',
    width:           130,
    height:          130,
    borderRadius:    65,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom:          -40,
    left:            -30,
  },

  // Avatar
  avatarWrap: { position: 'relative', marginBottom: SPACING.xs },
  avatarRing: {
    width:           96,
    height:          96,
    borderRadius:    48,
    borderWidth:     3,
    borderColor:     'rgba(255,255,255,0.55)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  cameraBadge: {
    position:        'absolute',
    bottom:          2,
    right:           2,
    width:           26,
    height:          26,
    borderRadius:    13,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth:     2,
    borderColor:     '#fff',
    alignItems:      'center',
    justifyContent:  'center',
  },

  // Text
  name: {
    fontSize:   FONT.sizes.xl,
    fontWeight: '800',
    color:      '#fff',
    textAlign:  'center',
    marginTop:  SPACING.xs,
  },
  rolePill: {
    backgroundColor:  '#fff',
    paddingHorizontal: SPACING.md,
    paddingVertical:   4,
    borderRadius:      RADIUS.full,
    marginTop:         2,
  },
  roleText: { fontSize: FONT.sizes.xs, fontWeight: '800' },

  // Contact
  contactRow: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    justifyContent: 'center',
    gap:            SPACING.xs,
    marginTop:      SPACING.sm,
  },
  chip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical:   5,
    borderRadius:      RADIUS.full,
  },
  chipText: {
    fontSize:   FONT.sizes.xs,
    color:      'rgba(255,255,255,0.95)',
    fontWeight: '500',
  },

  // Company
  companyRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    marginTop:     SPACING.xs,
  },
  companyText: {
    fontSize:   FONT.sizes.xs,
    color:      'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
});
