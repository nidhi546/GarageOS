import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { Ionicons }               from '@expo/vector-icons';
import { useAuthStore }           from '../../stores/authStore';
import { appuserApi }             from '../../api/appuserApi';
import { AppLoaderModal }         from '../../components/common/AppLoaderModal';
import { ImagePickerBottomSheet } from '../../components/common/ImagePickerBottomSheet';
import { useImageUpload }         from '../../hooks/useImageUpload';
import { showToast }              from '../../utils/toast';
import { ProfileHeader }          from '../../components/profile/ProfileHeader';
import { ProfileSection, ProfileDivider } from '../../components/profile/ProfileSection';
import { ProfileItem }            from '../../components/profile/ProfileItem';
import { COLORS, SPACING, FONT, RADIUS, SHADOW } from '../../config/theme';

// ─── Permission chip ──────────────────────────────────────────────────────────

const PermChip: React.FC<{ label: string; allowed: boolean }> = ({ label, allowed }) => (
  <View style={[pc.chip, { backgroundColor: allowed ? COLORS.successLight : COLORS.surfaceAlt }]}>
    <Ionicons
      name={allowed ? 'checkmark-circle' : 'close-circle'}
      size={13}
      color={allowed ? COLORS.success : COLORS.textMuted}
    />
    <Text style={[pc.label, { color: allowed ? COLORS.success : COLORS.textMuted }]}>{label}</Text>
  </View>
);

const pc = StyleSheet.create({
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.full },
  label: { fontSize: FONT.sizes.xs, fontWeight: '600' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    user, company, logout,
    canViewFinancials, canApproveEstimate,
    canAssignMechanic, canManageUsers,
    canCreateJobCard,
  } = useAuthStore();

  const [localAvatar,  setLocalAvatar]  = useState<string | undefined>(user?.avatar);
  const [isRemoving,   setIsRemoving]   = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Avatar upload ──────────────────────────────────────────────────────────

  const {
    isUploading,
    pickerVisible, openPicker, closePicker,
    handlePickerCamera, handlePickerGallery,
    clearImage: clearHookImage,
  } = useImageUpload({
    moduleName:         'appuser',
    showToastOnSuccess: false,
    showToastOnError:   false,
    onError: () => showToast('Upload failed', 'error'),
    onSuccess: async (url) => {
      try {
        await appuserApi.update(user!.id, { avatar: url });
        useAuthStore.setState(s => ({ user: s.user ? { ...s.user, avatar: url } : s.user }));
        setLocalAvatar(url);
        showToast('Profile photo updated successfully', 'success');
      } catch {
        showToast('Unable to update profile', 'error');
      }
    },
  });

  const handleRemovePhoto = async () => {
    setIsRemoving(true);
    try {
      await appuserApi.update(user!.id, { avatar: null });
      useAuthStore.setState(s => ({ user: s.user ? { ...s.user, avatar: undefined } : s.user }));
      setLocalAvatar(undefined);
      clearHookImage();
      showToast('Profile photo removed', 'success');
    } catch {
      showToast('Unable to update profile', 'error');
    } finally {
      setIsRemoving(false);
    }
  };

  // ── Pull-to-refresh ────────────────────────────────────────────────────────

  const onRefresh = useCallback(async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const fresh = await appuserApi.getById(user.id);
      if (fresh) {
        useAuthStore.setState(s => ({
          user: s.user ? {
            ...s.user,
            legalname:      fresh.legalname      ?? s.user.legalname,
            name:           fresh.name           ?? s.user.name,
            email:          fresh.email          ?? s.user.email,
            address:        fresh.address,
            experience:     fresh.experience,
            specialization: fresh.specialization,
            avatar:         fresh.avatar         ?? s.user.avatar,
          } : s.user,
        }));
        setLocalAvatar(fresh.avatar ?? user.avatar);
      }
    } catch {
      // silent — user already has cached data
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  // ── Logout ────────────────────────────────────────────────────────────────

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) return null;

  const isMechanic      = user.role === 'MECHANIC';
  const isOwnerOrAdmin  = user.role === 'OWNER' || user.role === 'SUPER_ADMIN';
  const hasProInfo      = isMechanic && (user.experience || user.specialization);
  const hasBusinessInfo = (isOwnerOrAdmin || user.role === 'MANAGER') && company;

  return (
    <>
      <AppLoaderModal
        visible={isUploading || isRemoving}
        message={isRemoving ? 'Removing photo…' : 'Uploading photo…'}
      />
      <ImagePickerBottomSheet
        visible={pickerVisible}
        onClose={closePicker}
        onCamera={handlePickerCamera}
        onGallery={handlePickerGallery}
        onRemove={localAvatar ? handleRemovePhoto : undefined}
        title="Profile Photo"
      />

      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* ── Hero header ── */}
        <ProfileHeader
          user={user}
          localAvatar={localAvatar}
          onAvatarPress={openPicker}
          company={company}
        />

        {/* ── Personal Info ── */}
        <ProfileSection title="Personal Info">
          <ProfileItem
            icon="person-outline"
            label="Full Name"
            value={user.legalname ?? user.name}
          />
          <ProfileDivider />
          <ProfileItem
            icon="call-outline"
            iconBg={COLORS.successLight}
            iconColor={COLORS.success}
            label="Mobile"
            value={user.mobile ?? user.phone}
          />
          {user.email ? (
            <>
              <ProfileDivider />
              <ProfileItem
                icon="mail-outline"
                iconBg={COLORS.infoLight}
                iconColor={COLORS.info}
                label="Email"
                value={user.email}
              />
            </>
          ) : null}
          {user.address ? (
            <>
              <ProfileDivider />
              <ProfileItem
                icon="location-outline"
                iconBg={COLORS.warningLight}
                iconColor={COLORS.warning}
                label="Address"
                value={user.address}
              />
            </>
          ) : null}
        </ProfileSection>

        {/* ── Mechanic: Professional Info ── */}
        {hasProInfo ? (
          <ProfileSection title="Professional Info">
            {user.experience ? (
              <ProfileItem
                icon="time-outline"
                iconBg="#F0FDF4"
                iconColor="#16A34A"
                label="Experience"
                value={user.experience}
              />
            ) : null}
            {user.experience && user.specialization ? <ProfileDivider /> : null}
            {user.specialization ? (
              <ProfileItem
                icon="construct-outline"
                iconBg="#F0FDF4"
                iconColor="#16A34A"
                label="Specialization"
                value={user.specialization}
              />
            ) : null}
          </ProfileSection>
        ) : null}

        {/* ── Owner / Manager: Business Info ── */}
        {hasBusinessInfo ? (
          <ProfileSection title="Business Info">
            <ProfileItem
              icon="business-outline"
              iconBg={COLORS.primaryLight}
              iconColor={COLORS.primary}
              label="Company"
              value={company!.name}
            />
            <ProfileDivider />
            <ProfileItem
              icon="ribbon-outline"
              iconBg={COLORS.successLight}
              iconColor={COLORS.success}
              label="Subscription Plan"
              badge={company!.subscription_plan.toUpperCase()}
              badgeBg={COLORS.primaryLight}
              badgeColor={COLORS.primary}
            />
            {company!.email ? (
              <>
                <ProfileDivider />
                <ProfileItem
                  icon="mail-outline"
                  iconBg={COLORS.infoLight}
                  iconColor={COLORS.info}
                  label="Business Email"
                  value={company!.email}
                />
              </>
            ) : null}
          </ProfileSection>
        ) : null}

        {/* ── Permissions ── */}
        <ProfileSection title="Your Access">
          <View style={s.permGrid}>
            <PermChip label="View Financials"   allowed={canViewFinancials()} />
            <PermChip label="Approve Estimate"  allowed={canApproveEstimate()} />
            <PermChip label="Assign Mechanic"   allowed={canAssignMechanic()} />
            <PermChip label="Manage Users"      allowed={canManageUsers()} />
            <PermChip label="Create Job Card"   allowed={canCreateJobCard()} />
          </View>
        </ProfileSection>

        {/* ── Account ── */}
        <ProfileSection title="Account">
          <ProfileItem
            icon="create-outline"
            iconBg={COLORS.primaryLight}
            iconColor={COLORS.primary}
            label="Edit Profile"
            value="Update your personal info"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <ProfileDivider />
          <ProfileItem
            icon="lock-closed-outline"
            iconBg={COLORS.warningLight}
            iconColor={COLORS.warning}
            label="Change Password"
            value="Update your password"
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </ProfileSection>

        {/* ── Quick Access ── */}
        <ProfileSection title="Quick Access">
          <ProfileItem
            icon="construct-outline"
            iconBg={COLORS.infoLight}
            iconColor={COLORS.info}
            label="Jobs"
            value="View all job cards"
            onPress={() => navigation.navigate('Jobs')}
          />
          <ProfileDivider />
          <ProfileItem
            icon="people-outline"
            label="Customers"
            value="Manage customer list"
            onPress={() => navigation.navigate('Customers')}
          />
          {canViewFinancials() ? (
            <>
              <ProfileDivider />
              <ProfileItem
                icon="bar-chart-outline"
                iconBg={COLORS.successLight}
                iconColor={COLORS.success}
                label="Revenue Report"
                onPress={() => navigation.navigate('Revenue')}
              />
            </>
          ) : null}
          {canApproveEstimate() ? (
            <>
              <ProfileDivider />
              <ProfileItem
                icon="checkmark-circle-outline"
                iconBg={COLORS.warningLight}
                iconColor={COLORS.warning}
                label="Pending Approvals"
                onPress={() => navigation.navigate('Approvals')}
              />
            </>
          ) : null}
          {canAssignMechanic() ? (
            <>
              <ProfileDivider />
              <ProfileItem
                icon="people-circle-outline"
                iconBg={COLORS.successLight}
                iconColor={COLORS.success}
                label="Mechanics"
                value="Manage mechanic list"
                onPress={() => navigation.navigate('Mechanics')}
              />
            </>
          ) : null}
        </ProfileSection>

        {/* ── Sign Out ── */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>GarageOS v1.0.0</Text>
      </ScrollView>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { paddingBottom: SPACING.xxl },

  permGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           SPACING.sm,
    padding:       SPACING.md,
  },

  logoutBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            SPACING.sm,
    backgroundColor: COLORS.dangerLight,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom:    SPACING.sm,
    ...SHADOW.sm,
  },
  logoutText: { fontSize: FONT.sizes.md, fontWeight: '700', color: COLORS.danger },

  version: {
    textAlign:   'center',
    fontSize:    FONT.sizes.xs,
    color:       COLORS.textMuted,
    marginTop:   SPACING.xs,
    marginBottom: SPACING.sm,
  },
});
