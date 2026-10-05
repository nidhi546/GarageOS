import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../config/theme';

// ─── Data ─────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: [
      {
        subtitle: 'Staff Accounts',
        text: 'Legal name, display name, mobile number, email address, role (Owner, Manager, Receptionist, Mechanic), specialization, experience, address, and profile photo. Login credentials — passwords are hashed and never stored in plain text.',
      },
      {
        subtitle: 'Customer Records',
        text: 'Name, mobile number, email address, city, address, vehicle details (make, model, registration number), and service history.',
      },
      {
        subtitle: 'Operational Data',
        text: 'Job cards, bookings, inspection records, estimates, invoices, payment records (amount, payment mode, transaction reference numbers), and notes added during service.',
      },
    ],
  },
  {
    title: '2. How We Use Your Information',
    body: [
      {
        text: 'We use collected data solely to authenticate and authorize staff access, manage job cards, bookings, invoices, and payments, generate service history for customers and vehicles, and produce revenue and operational reports for the garage owner.\n\nWe do not sell, rent, or share your data with third parties for advertising purposes.',
      },
    ],
  },
  {
    title: '3. Data Storage and Security',
    body: [
      {
        text: 'Data is stored on servers via the Hana Platform. Access is restricted by role-based permissions. All API communication is encrypted in transit (HTTPS). Passwords are never stored or transmitted in plain text.',
      },
    ],
  },
  {
    title: '4. Data Retention',
    body: [
      {
        text: 'Customer and vehicle records, job cards, invoices, and payment history are retained for the lifetime of your garage\'s account to support service continuity and reporting. Staff accounts can be deactivated by an admin at any time.',
      },
    ],
  },
  {
    title: '5. Your Rights',
    body: [
      {
        text: 'Staff members and customers may request access to their personal data, correction of inaccurate data, or deletion of their account (subject to legal and accounting obligations).\n\nTo make a request, contact your garage administrator or reach us at dev@raidlayer.net.',
      },
    ],
  },
  {
    title: '6. Camera and Media Access',
    body: [
      {
        text: 'The App may request access to your device camera and photo library solely for uploading profile photos and vehicle or inspection images. Images are stored on the Hana Platform servers and are not shared externally.',
      },
    ],
  },
  {
    title: '7. Push Notifications',
    body: [
      {
        text: 'The App may send push notifications for job card status updates and approvals. You can disable these in your device settings at any time.',
      },
    ],
  },
  {
    title: '8. Children\'s Privacy',
    body: [
      {
        text: 'GarageOS is intended for business use by adults. We do not knowingly collect data from anyone under the age of 18.',
      },
    ],
  },
  {
    title: '9. Changes to This Policy',
    body: [
      {
        text: 'We may update this policy from time to time. Continued use of the App after changes constitutes acceptance of the updated policy.',
      },
    ],
  },
  {
    title: '10. Contact',
    body: [
      {
        text: 'For privacy-related questions or requests:\nEmail: dev@raidlayer.net',
      },
    ],
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export const PrivacyPolicyScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <SafeAreaView style={s.safe}>

    {/* Header */}
    <View style={s.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="arrow-back-outline" size={20} color={COLORS.primary} />
      </TouchableOpacity>
      <View style={s.headerCenter}>
        <Text style={s.title}>Privacy Policy</Text>
        <Text style={s.subtitle}>Effective Date: May 11, 2026</Text>
      </View>
    </View>

    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

      {/* Intro */}
      <View style={s.intro}>
        <View style={s.iconCircle}>
          <Ionicons name="shield-checkmark-outline" size={28} color={COLORS.primary} />
        </View>
        <Text style={s.introText}>
          GarageOS is a garage management platform operated on the Hana Platform. This policy explains what data we collect, how we use it, and your rights.
        </Text>
      </View>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <View key={section.title} style={s.card}>
          <Text style={s.sectionTitle}>{section.title}</Text>
          {section.body.map((item, i) => (
            <View key={i} style={i > 0 ? s.bodyGap : undefined}>
              {item.subtitle && <Text style={s.subtitle2}>{item.subtitle}</Text>}
              <Text style={s.bodyText}>{item.text}</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={s.footer}>
        <Ionicons name="lock-closed-outline" size={14} color={COLORS.textMuted} />
        <Text style={s.footerText}>GarageOS · All rights reserved</Text>
      </View>

    </ScrollView>
  </SafeAreaView>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  backBtn:      { padding: 4 },
  headerCenter: { flex: 1 },
  title:        { fontSize: FONT.sizes.md, fontWeight: '700', color: COLORS.text },
  subtitle:     { fontSize: FONT.sizes.xs, color: COLORS.textMuted, marginTop: 1 },

  scroll: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xxl },

  intro: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    ...SHADOW.sm,
  },
  iconCircle:  { marginTop: 2 },
  introText:   { flex: 1, fontSize: FONT.sizes.sm, color: COLORS.primary, lineHeight: 20 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
    ...SHADOW.sm,
  },
  sectionTitle: { fontSize: FONT.sizes.sm, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  subtitle2:    { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.textSecondary, marginTop: SPACING.xs },
  bodyText:     { fontSize: FONT.sizes.sm, color: COLORS.textSecondary, lineHeight: 20 },
  bodyGap:      { marginTop: SPACING.xs },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: SPACING.sm,
  },
  footerText: { fontSize: FONT.sizes.xs, color: COLORS.textMuted },
});
