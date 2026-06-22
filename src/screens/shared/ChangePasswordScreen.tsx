import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons }   from '@expo/vector-icons';
import { authApi }    from '../../api/authApi';
import { showToast }  from '../../utils/toast';
import { AppLoaderModal } from '../../components/common/AppLoaderModal';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../config/theme';

// ─── Password field ───────────────────────────────────────────────────────────

interface PwdFieldProps {
  label:    string;
  value:    string;
  onChange: (v: string) => void;
  hint?:    string;
}

const PwdField: React.FC<PwdFieldProps> = ({ label, value, onChange, hint }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={f.wrapper}>
      <Text style={f.label}>{label}</Text>
      <View style={f.row}>
        <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} style={f.icon} />
        <TextInput
          style={f.input}
          value={value}
          onChangeText={onChange}
          placeholder={label}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={() => setVisible(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>
      {hint ? <Text style={f.hint}>{hint}</Text> : null}
    </View>
  );
};

const f = StyleSheet.create({
  wrapper: { marginBottom: SPACING.md },
  label:   { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  row:     { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.sm, gap: SPACING.xs, ...SHADOW.sm },
  icon:    { flexShrink: 0 },
  input:   { flex: 1, fontSize: FONT.sizes.md, color: COLORS.text, paddingVertical: SPACING.sm + 2, minHeight: 46 },
  hint:    { fontSize: FONT.sizes.xs, color: COLORS.textMuted, marginTop: 4 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export const ChangePasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!current || !next || !confirm) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    if (next.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }
    if (next !== confirm) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (next === current) {
      showToast('New password must differ from current password', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await authApi.changePassword(current, next);
      showToast('Password changed successfully', 'success');
      navigation.goBack();
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to change password';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppLoaderModal visible={isSaving} message="Updating password…" />

      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <View style={s.headerCard}>
          <View style={s.headerIcon}>
            <Ionicons name="shield-checkmark-outline" size={28} color={COLORS.warning} />
          </View>
          <View style={s.headerText}>
            <Text style={s.headerTitle}>Change Password</Text>
            <Text style={s.headerSub}>Choose a strong password to keep your account secure</Text>
          </View>
        </View>

        {/* Form */}
        <View style={s.formCard}>
          <PwdField
            label="Current Password"
            value={current}
            onChange={setCurrent}
          />
          <PwdField
            label="New Password"
            value={next}
            onChange={setNext}
            hint="Minimum 6 characters"
          />
          <PwdField
            label="Confirm New Password"
            value={confirm}
            onChange={setConfirm}
          />
        </View>

        {/* Strength hints */}
        <View style={s.tipsCard}>
          <Text style={s.tipsTitle}>Password tips</Text>
          {[
            'At least 6 characters',
            'Mix of letters and numbers',
            'Avoid using your name or mobile number',
          ].map((tip, i) => (
            <View key={i} style={s.tipRow}>
              <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.success} />
              <Text style={s.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, (!current || !next || !confirm) && s.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={isSaving || !current || !next || !confirm}
        >
          <Ionicons name="lock-closed" size={18} color="#fff" />
          <Text style={s.submitBtnText}>Update Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={s.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  content:   { padding: SPACING.md, paddingBottom: SPACING.xxl },

  headerCard: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    gap:             SPACING.md,
    marginBottom:    SPACING.md,
    ...SHADOW.sm,
  },
  headerIcon: {
    width:           52,
    height:          52,
    borderRadius:    RADIUS.md,
    backgroundColor: COLORS.warningLight,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  headerText:  { flex: 1, paddingTop: 2 },
  headerTitle: { fontSize: FONT.sizes.lg, fontWeight: '700', color: COLORS.text },
  headerSub:   { fontSize: FONT.sizes.sm, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },

  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    marginBottom:    SPACING.md,
    ...SHADOW.sm,
  },

  tipsCard: {
    backgroundColor: COLORS.successLight,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    marginBottom:    SPACING.md,
    gap:             SPACING.xs,
  },
  tipsTitle: { fontSize: FONT.sizes.xs, fontWeight: '700', color: COLORS.success, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  tipRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tipText:   { fontSize: FONT.sizes.sm, color: COLORS.success },

  submitBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    marginBottom:    SPACING.sm,
    ...SHADOW.md,
  },
  submitBtnDisabled: { opacity: 0.55 },
  submitBtnText:     { fontSize: FONT.sizes.md, fontWeight: '700', color: '#fff' },

  cancelBtn:     { alignItems: 'center', padding: SPACING.md },
  cancelBtnText: { fontSize: FONT.sizes.md, fontWeight: '600', color: COLORS.textMuted },
});
