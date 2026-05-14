import React, { useState } from 'react';
<<<<<<< HEAD
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useCustomerStore } from '../../stores/customerStore';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { isValidMobile } from '../../utils/phone';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../config/theme';
=======
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
>>>>>>> b4f26d8f (changes)

export const AddCustomerScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { create } = useCustomerStore();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

<<<<<<< HEAD
  const validate = () => {
=======
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
>>>>>>> b4f26d8f (changes)
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!mobile.trim()) e.mobile = 'Mobile is required';
    else if (!isValidMobile(mobile)) e.mobile = 'Enter a valid 10-digit mobile number';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

<<<<<<< HEAD
=======
  const clearForm = () => {
    setName(''); setMobile(''); setEmail(''); setAddress(''); setCity('');
    setErrors({});
    clearPhoto();
  };

  // ── Submit ────────────────────────────────────────────────────────────────
>>>>>>> b4f26d8f (changes)
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
<<<<<<< HEAD
      await create({ name: name.trim(), mobile: mobile.trim(), email: email.trim() || undefined, address: address.trim() || undefined, city: city.trim() || undefined } as any);
      Alert.alert('Customer Added', `${name} has been added successfully.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add customer');
=======
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
>>>>>>> b4f26d8f (changes)
    } finally {
      setSaving(false);
    }
  };

  return (
<<<<<<< HEAD
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
=======
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

>>>>>>> b4f26d8f (changes)
        <View style={s.card}>
          <Input label="Full Name *" value={name} onChangeText={setName} placeholder="e.g. Amit Patel" leftIcon="person-outline" error={errors.name} />
          <Input label="Mobile Number *" value={mobile} onChangeText={setMobile} placeholder="9876543210" leftIcon="call-outline" keyboardType="phone-pad" maxLength={10} error={errors.mobile} />
          <Input label="Email" value={email} onChangeText={setEmail} placeholder="amit@email.com" leftIcon="mail-outline" keyboardType="email-address" autoCapitalize="none" error={errors.email} />
          <Input label="Address" value={address} onChangeText={setAddress} placeholder="Street, Area" leftIcon="location-outline" />
          <Input label="City" value={city} onChangeText={setCity} placeholder="e.g. Bangalore" leftIcon="business-outline" />
        </View>
      </ScrollView>
      <View style={s.footer}>
        <Button title="Cancel" onPress={() => navigation.goBack()} variant="outline" style={s.footerBtn} />
        <Button title="Add Customer" onPress={handleSave} loading={saving} style={s.footerBtn} />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
<<<<<<< HEAD
  content: { padding: SPACING.md, paddingBottom: 100 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOW.sm },
  footer: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
=======
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
>>>>>>> b4f26d8f (changes)
  footerBtn: { flex: 1 },
});
