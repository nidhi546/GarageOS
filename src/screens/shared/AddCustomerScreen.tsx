import React, { useState } from 'react';
import {
  View, Text, StyleSheet,
  KeyboardAvoidingView, Platform,
  TouchableOpacity, Image, ScrollView,
} from 'react-native';
import { Ionicons }          from '@expo/vector-icons';
import { useCustomerStore }  from '../../stores/customerStore';
import { Input }             from '../../components/common/Input';
import { Button }            from '../../components/common/Button';
import { AppLoaderModal }         from '../../components/common/AppLoaderModal';
import { ImagePickerBottomSheet } from '../../components/common/ImagePickerBottomSheet';
import { isValidMobile }          from '../../utils/phone';
import { showToast }              from '../../utils/toast';
import { useImageUpload }         from '../../hooks/useImageUpload';
import { COLORS, SPACING, RADIUS, SHADOW, FONT } from '../../config/theme';

export const AddCustomerScreen: React.FC<{ route: any; navigation: any }> = ({
  navigation,
}) => {
  const { create } = useCustomerStore();

  const [name,    setName]    = useState('');
  const [mobile,  setMobile]  = useState('');
  const [email,   setEmail]   = useState('');
  const [address, setAddress] = useState('');
  const [city,    setCity]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  // ── Photo upload ──────────────────────────────────────────────────────────
  const {
    imageUrl:    photoUrl,
    isUploading: photoUploading,
    clearImage:  clearPhoto,
    pickerVisible, openPicker, closePicker,
    handlePickerCamera, handlePickerGallery,
  } = useImageUpload({ moduleName: 'customer' });

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim())                                               e.name   = 'Full name is required';
    if (!mobile.trim())                                             e.mobile = 'Mobile number is required';
    else if (!isValidMobile(mobile))                                e.mobile = 'Enter a valid 10-digit mobile number';
    if (!city.trim())                                               e.city   = 'City is required';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email  = 'Invalid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const clearForm = () => {
    setName(''); setMobile(''); setEmail(''); setAddress(''); setCity('');
    setErrors({});
    clearPhoto();
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await create({
        name:    name.trim(),
        mobile:  mobile.trim(),
        email:   email.trim()   || undefined,
        address: address.trim() || undefined,
        city:    city.trim(),
        ...(photoUrl && { photo: photoUrl }),
      } as any);
      showToast('Customer added successfully', 'success');
      clearForm();
      navigation.goBack();
    } catch (err: any) {
      showToast(err?.message || 'Failed to add customer. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <AppLoaderModal visible={photoUploading} message="Uploading photo…" />
      <ImagePickerBottomSheet
        visible={pickerVisible}
        onClose={closePicker}
        onCamera={handlePickerCamera}
        onGallery={handlePickerGallery}
        onRemove={photoUrl ? clearPhoto : undefined}
        title="Customer Photo"
      />

      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Customer photo ── */}
        <View style={s.photoSection}>
          <TouchableOpacity
            style={s.photoCircle}
            onPress={openPicker}
            activeOpacity={0.8}
          >
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={s.photoImg} resizeMode="cover" />
            ) : (
              <>
                <View style={s.photoIconBg}>
                  <Ionicons name="person-outline" size={32} color={COLORS.textMuted} />
                </View>
              </>
            )}
            <View style={s.photoCameraBadge}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={s.photoHint}>Tap to add photo</Text>
        </View>

        <View style={s.card}>
          <Input
            label="Full Name *"
            value={name}
            onChangeText={t => { setName(t); setErrors(e => ({ ...e, name: '' })); }}
            placeholder="e.g. Amit Patel"
            leftIcon="person-outline"
            error={errors.name}
          />
          <Input
            label="Mobile Number *"
            value={mobile}
            onChangeText={t => { setMobile(t); setErrors(e => ({ ...e, mobile: '' })); }}
            placeholder="9876543210"
            leftIcon="call-outline"
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.mobile}
          />
          <Input
            label="Email"
            value={email}
            onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: '' })); }}
            placeholder="amit@email.com"
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <Input
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Street, Area"
            leftIcon="location-outline"
          />
          <Input
            label="City *"
            value={city}
            onChangeText={t => { setCity(t); setErrors(e => ({ ...e, city: '' })); }}
            placeholder="e.g. Bangalore"
            leftIcon="business-outline"
            error={errors.city}
          />
        </View>
      </ScrollView>

      <View style={s.footer}>
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={s.footerBtn}
          disabled={saving}
        />
        <Button
          title="Add Customer"
          onPress={handleSave}
          loading={saving}
          style={s.footerBtn}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { padding: SPACING.md, paddingBottom: 100 },
  card:      { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOW.sm },

  // Photo upload
  photoSection:   { alignItems: 'center', marginBottom: SPACING.md },
  photoCircle:    {
    width:          90,
    height:         90,
    borderRadius:   45,
    backgroundColor: COLORS.surface,
    borderWidth:    2,
    borderColor:    COLORS.border,
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
    position:       'relative',
    ...SHADOW.sm,
  },
  photoImg:       { width: 90, height: 90, borderRadius: 45 },
  photoIconBg:    { alignItems: 'center', justifyContent: 'center' },
  photoCameraBadge: {
    position:        'absolute',
    bottom:          4,
    right:           4,
    width:           24,
    height:          24,
    borderRadius:    12,
    backgroundColor: COLORS.primary,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     '#fff',
  },
  photoHint: { fontSize: FONT.sizes.xs, color: COLORS.textMuted, marginTop: 6 },

  footer:    { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  footerBtn: { flex: 1 },
});
