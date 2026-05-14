import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons }     from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { appuserApi }   from '../../api/appuserApi';
import { showToast }    from '../../utils/toast';
import { AppLoaderModal } from '../../components/common/AppLoaderModal';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../config/theme';

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps {
  label:       string;
  icon:        keyof typeof Ionicons.glyphMap;
  value:       string;
  onChange:    (v: string) => void;
  placeholder?: string;
  multiline?:  boolean;
  editable?:   boolean;
}

const Field: React.FC<FieldProps> = ({
  label, icon, value, onChange, placeholder, multiline = false, editable = true,
}) => (
  <View style={f.wrapper}>
    <Text style={f.label}>{label}</Text>
    <View style={[f.inputRow, !editable && f.inputRowDisabled]}>
      <Ionicons
        name={icon}
        size={18}
        color={editable ? COLORS.primary : COLORS.textMuted}
        style={f.inputIcon}
      />
      <TextInput
        style={[f.input, multiline && f.inputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? label}
        placeholderTextColor={COLORS.textMuted}
        editable={editable}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        autoCapitalize="words"
      />
    </View>
    {!editable && (
      <Text style={f.hint}>This field cannot be changed</Text>
    )}
  </View>
);

const f = StyleSheet.create({
  wrapper:         { marginBottom: SPACING.md },
  label:           { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  inputRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.sm, gap: SPACING.xs, ...SHADOW.sm },
  inputRowDisabled:{ backgroundColor: COLORS.surfaceAlt, borderColor: COLORS.border },
  inputIcon:       { flexShrink: 0 },
  input:           { flex: 1, fontSize: FONT.sizes.md, color: COLORS.text, paddingVertical: SPACING.sm + 2, minHeight: 46 },
  inputMulti:      { minHeight: 80, textAlignVertical: 'top', paddingTop: SPACING.sm },
  hint:            { fontSize: FONT.sizes.xs, color: COLORS.textMuted, marginTop: 4 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export const EditProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuthStore();

  const [legalname,      setLegalname]      = useState(user?.legalname ?? user?.name ?? '');
  const [email,          setEmail]          = useState(user?.email ?? '');
  const [address,        setAddress]        = useState(user?.address ?? '');
  const [experience,     setExperience]     = useState(user?.experience ?? '');
  const [specialization, setSpecialization] = useState(user?.specialization ?? '');
  const [isSaving,       setIsSaving]       = useState(false);

  if (!user) return null;

  const isMechanic = user.role === 'MECHANIC';

  const handleSave = async () => {
    if (!legalname.trim()) {
      showToast('Full name is required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        legalname: legalname.trim(),
        name:      legalname.trim(),
      };
      if (email.trim())          payload.email          = email.trim();
      if (address.trim())        payload.address        = address.trim();
      if (isMechanic) {
        payload.experience     = experience.trim()     || undefined;
        payload.specialization = specialization.trim() || undefined;
      }

      await appuserApi.update(user.id, payload);

      useAuthStore.setState(s => ({
        user: s.user ? {
          ...s.user,
          legalname:      payload.legalname,
          name:           payload.name,
          email:          payload.email          ?? s.user.email,
          address:        payload.address        ?? s.user.address,
          experience:     payload.experience     ?? s.user.experience,
          specialization: payload.specialization ?? s.user.specialization,
        } : s.user,
      }));

      showToast('Profile updated successfully', 'success');
      navigation.goBack();
    } catch {
      showToast('Unable to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppLoaderModal visible={isSaving} message="Saving…" />

      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <View style={s.headerCard}>
          <Ionicons name="person-circle-outline" size={40} color={COLORS.primary} />
          <View style={s.headerText}>
            <Text style={s.headerTitle}>Edit Profile</Text>
            <Text style={s.headerSub}>Update your personal information</Text>
          </View>
        </View>

        {/* Form */}
        <View style={s.formCard}>
          <Field
            label="Full Name"
            icon="person-outline"
            value={legalname}
            onChange={setLegalname}
            placeholder="Enter your full name"
          />
          <Field
            label="Mobile Number"
            icon="call-outline"
            value={user.mobile ?? user.phone ?? ''}
            onChange={() => {}}
            editable={false}
          />
          <Field
            label="Email Address"
            icon="mail-outline"
            value={email}
            onChange={setEmail}
            placeholder="Enter your email"
          />
          <Field
            label="Address"
            icon="location-outline"
            value={address}
            onChange={setAddress}
            placeholder="Enter your address"
            multiline
          />

          {isMechanic ? (
            <>
              <View style={s.sectionLabel}>
                <Text style={s.sectionLabelText}>Professional Details</Text>
              </View>
              <Field
                label="Experience"
                icon="time-outline"
                value={experience}
                onChange={setExperience}
                placeholder="e.g. 5 years"
              />
              <Field
                label="Specialization"
                icon="construct-outline"
                value={specialization}
                onChange={setSpecialization}
                placeholder="e.g. Engine Repair, AC Service"
              />
            </>
          ) : null}
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={s.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={isSaving}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={s.saveBtnText}>Save Changes</Text>
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
    alignItems:      'center',
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    gap:             SPACING.md,
    marginBottom:    SPACING.md,
    ...SHADOW.sm,
  },
  headerText:  { flex: 1 },
  headerTitle: { fontSize: FONT.sizes.lg, fontWeight: '700', color: COLORS.text },
  headerSub:   { fontSize: FONT.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },

  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    marginBottom:    SPACING.md,
    ...SHADOW.sm,
  },
  sectionLabel: {
    borderTopWidth:  1,
    borderTopColor:  COLORS.border,
    paddingTop:      SPACING.md,
    marginTop:       SPACING.xs,
    marginBottom:    SPACING.md,
  },
  sectionLabelText: {
    fontSize:   FONT.sizes.xs,
    fontWeight: '700',
    color:      COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing:  0.8,
  },

  saveBtn: {
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
  saveBtnText: { fontSize: FONT.sizes.md, fontWeight: '700', color: '#fff' },

  cancelBtn:     { alignItems: 'center', padding: SPACING.md },
  cancelBtnText: { fontSize: FONT.sizes.md, fontWeight: '600', color: COLORS.textMuted },
});
