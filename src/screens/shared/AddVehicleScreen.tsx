import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Image,
} from 'react-native';
import { Ionicons }          from '@expo/vector-icons';
import { Input }             from '../../components/common/Input';
import { Button }            from '../../components/common/Button';
import { SelectDropdown, DropdownSection } from '../../components/common/SelectDropdown';
import { AppLoaderModal }         from '../../components/common/AppLoaderModal';
import { ImagePickerBottomSheet } from '../../components/common/ImagePickerBottomSheet';
import { vehicleApi }             from '../../api/vehicleApi';
import { vehicleMasterApi }       from '../../api/vehicleMasterApi';
import { VEHICLE_BRANDS, POPULAR_BRANDS, getModelsForBrand } from '../../constants/vehicleMaster';
import { useMultiImageUpload }    from '../../hooks/useImageUpload';
import { showToast }         from '../../utils/toast';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../config/theme';

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'] as const;
type FuelType = (typeof FUEL_TYPES)[number];

export const AddVehicleScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { customerId, registrationHint } = route.params ?? {};

  const [regNumber,  setRegNumber]  = useState(registrationHint ?? '');
  const [brand,      setBrand]      = useState('');
  const [model,      setModel]      = useState('');
  const [year,       setYear]       = useState('');
  const [color,      setColor]      = useState('');
  const [fuelType,   setFuelType]   = useState<FuelType>('Petrol');
  const [currentKM,  setCurrentKM]  = useState('');
  const [saving,     setSaving]     = useState(false);

  const [brandSections,  setBrandSections]  = useState<DropdownSection[]>([]);
  const [brandsLoading,  setBrandsLoading]  = useState(false);
  const [modelOptions,   setModelOptions]   = useState<string[]>([]);
  const [modelsLoading,  setModelsLoading]  = useState(false);

  // ── Photo upload ──────────────────────────────────────────────────────────
  const {
    imageUrls:   photoUrls,
    isUploading: photosUploading,
    removeImage: removePhoto,
    pickerVisible, openPicker, closePicker,
    handlePickerCamera, handlePickerGallery,
  } = useMultiImageUpload({ moduleName: 'vehicle', maxImages: 5 });

  // ── Load brands ───────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    setBrandsLoading(true);

    const popular = POPULAR_BRANDS;
    const all     = VEHICLE_BRANDS.map(b => b.name);

    setBrandSections([
      { title: 'Popular Brands', data: popular },
      { title: 'All Brands',     data: all     },
    ]);
    setBrandsLoading(false);

    vehicleMasterApi.getBrands().then(apiBrands => {
      if (!mounted || apiBrands.length === 0) return;
      setBrandSections([
        { title: 'Popular Brands', data: popular },
        { title: 'All Brands',     data: apiBrands },
      ]);
    }).catch(() => {});

    return () => { mounted = false; };
  }, []);

  // ── Load models on brand change ───────────────────────────────────────────
  useEffect(() => {
    if (!brand) { setModelOptions([]); setModel(''); return; }

    setModel('');
    setModelsLoading(true);
    setModelOptions(getModelsForBrand(brand));
    setModelsLoading(false);

    vehicleMasterApi.getModels(brand).then(apiModels => {
      if (apiModels.length > 0) setModelOptions(apiModels);
    }).catch(() => {});
  }, [brand]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!regNumber.trim() || !brand.trim() || !model.trim()) {
      showToast('Registration number, brand and model are required', 'error');
      return;
    }

    setSaving(true);
    try {
      await vehicleApi.addVehicle({
        registrationNumber: regNumber.trim().toUpperCase(),
        brand:      brand.trim(),
        model:      model.trim(),
        year:       year.trim()      || undefined,
        color:      color.trim()     || undefined,
        currentKM:  currentKM.trim() || undefined,
        fuleType:   fuelType,
        customerId: customerId ?? undefined,
        ...(photoUrls.length > 0 && { photos: photoUrls }),
      } as any);
      showToast('Vehicle added successfully', 'success');
      navigation.goBack();
    } catch (e: any) {
      showToast(e.message ?? 'Failed to add vehicle', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.container}>
      <AppLoaderModal visible={photosUploading} message="Uploading photo…" />
      <ImagePickerBottomSheet
        visible={pickerVisible}
        onClose={closePicker}
        onCamera={handlePickerCamera}
        onGallery={handlePickerGallery}
        title="Vehicle Photos"
      />

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Input
            label="Registration Number *"
            value={regNumber}
            onChangeText={setRegNumber}
            placeholder="GJ01AH0101"
            leftIcon="barcode-outline"
            autoCapitalize="characters"
          />

          <SelectDropdown
            label="Brand *"
            value={brand}
            placeholder="Select vehicle brand"
            sections={brandSections}
            loading={brandsLoading}
            leftIcon="car-outline"
            onSelect={val => setBrand(val)}
            searchPlaceholder="Search brand…"
          />

          <SelectDropdown
            label="Model *"
            value={model}
            placeholder={brand ? 'Select model' : 'Select brand first'}
            options={modelOptions}
            loading={modelsLoading}
            disabled={!brand}
            leftIcon="car-sport-outline"
            onSelect={val => setModel(val)}
            searchPlaceholder="Search model…"
          />

          <Input
            label="Year"
            value={year}
            onChangeText={setYear}
            placeholder="e.g. 2022"
            leftIcon="calendar-outline"
            keyboardType="numeric"
            maxLength={4}
          />
          <Input
            label="Color"
            value={color}
            onChangeText={setColor}
            placeholder="e.g. White"
            leftIcon="color-palette-outline"
          />
          <Input
            label="Current KM"
            value={currentKM}
            onChangeText={setCurrentKM}
            placeholder="e.g. 45000"
            leftIcon="speedometer-outline"
            keyboardType="numeric"
          />

          <Text style={s.fieldLabel}>Fuel Type</Text>
          <View style={s.fuelGrid}>
            {FUEL_TYPES.map(ft => (
              <TouchableOpacity
                key={ft}
                style={[s.fuelChip, fuelType === ft && s.fuelChipActive]}
                onPress={() => setFuelType(ft)}
              >
                <Text style={[s.fuelText, fuelType === ft && s.fuelTextActive]}>{ft}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Vehicle photos ── */}
          <Text style={s.fieldLabel}>Vehicle Photos (optional)</Text>
          <View style={s.photoRow}>
            {photoUrls.map((uri, idx) => (
              <View key={uri} style={s.photoThumb}>
                <Image source={{ uri }} style={s.thumbImg} resizeMode="cover" />
                <TouchableOpacity
                  style={s.thumbRemove}
                  onPress={() => removePhoto(idx)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}

            {photoUrls.length < 5 && (
              <TouchableOpacity
                style={s.addPhotoBtn}
                onPress={openPicker}
                activeOpacity={0.75}
                disabled={photosUploading}
              >
                <Ionicons name="camera-outline" size={22} color={COLORS.primary} />
                <Text style={s.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <Button title="Cancel"      onPress={() => navigation.goBack()} variant="outline" style={s.footerBtn} />
        <Button title="Add Vehicle" onPress={handleSave} loading={saving}              style={s.footerBtn} />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  content:    { padding: SPACING.md, paddingBottom: 100 },
  card:       { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOW.sm },
  fieldLabel: { fontSize: FONT.sizes.sm, fontWeight: '500', color: COLORS.text, marginBottom: SPACING.xs },

  fuelGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.md },
  fuelChip:       { paddingHorizontal: SPACING.sm, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border },
  fuelChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  fuelText:       { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  fuelTextActive: { color: '#fff' },

  // Photo upload
  photoRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  photoThumb:  { position: 'relative' },
  thumbImg:    { width: 76, height: 76, borderRadius: RADIUS.md, backgroundColor: COLORS.border },
  thumbRemove: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 10 },
  addPhotoBtn: {
    width:          76,
    height:         76,
    borderRadius:   RADIUS.md,
    borderWidth:    1.5,
    borderColor:    COLORS.primary,
    borderStyle:    'dashed',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            4,
  },
  addPhotoText: { fontSize: FONT.sizes.xs, color: COLORS.primary, fontWeight: '600' },

  footer:     { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  footerBtn:  { flex: 1 },
});
