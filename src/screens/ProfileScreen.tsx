import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator, Clipboard, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { BottomNav } from '@/components/BottomNav';

export function ProfileScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user, logout, deleteAccount, updateProfile, changePassword, error, clearError } = useAuthStore();
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) setDisplayName(user.displayName);
  }, [user?.displayName]);

  if (!user) return null;

  function handleCopyHandle() {
    Clipboard.setString(user!.handle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all your game history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete },
      ],
    );
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteAccount();
    } catch {
      setDeleting(false);
      Alert.alert('Something went wrong', 'Could not delete your account. Please try again.');
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    setProfileSaved(false);
    try {
      await updateProfile(displayName);
      setProfileSaved(true);
    } catch {
      // Store error is already populated.
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    setChangingPassword(true);
    setPasswordSaved(false);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordForm(false);
      setPasswordSaved(true);
    } catch {
      // Store error is already populated.
    } finally {
      setChangingPassword(false);
    }
  }

  const profileChanged = displayName.trim() !== user.displayName;
  const winRate = user.puzzlesPlayed > 0 ? Math.round((user.puzzlesWon / user.puzzlesPlayed) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.displayName[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user.displayName}</Text>
        <Pressable style={styles.handleRow} onPress={handleCopyHandle}>
          <Text style={styles.handleName}>{user.displayName}</Text>
          <View style={styles.tagChip}>
            <Text style={styles.tagText}>#{user.usernameTag ?? '????'}</Text>
          </View>
          <Text style={styles.copyHint}>{copied ? '✓ Copied' : 'tap to copy'}</Text>
        </Pressable>
        {!user.isGuest && <Text style={styles.email}>{user.email}</Text>}

        {user.isGuest ? (
          <Pressable style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Sign Up / Log In</Text>
          </Pressable>
        ) : (
          <>
            {error && <Text style={styles.error}>{error}</Text>}
            {profileSaved && <Text style={styles.success}>Profile updated.</Text>}
            {passwordSaved && <Text style={styles.success}>Password changed.</Text>}

            <Text style={styles.sectionHeader}>ACCOUNT</Text>
            <View style={styles.section}>
              <View style={styles.formRow}>
                <Text style={styles.label}>Display name</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={value => {
                    clearError();
                    setProfileSaved(false);
                    setDisplayName(value);
                  }}
                  maxLength={32}
                  placeholder="Display name"
                  placeholderTextColor={colors.text3}
                />
                <Pressable
                  style={[styles.primaryBtn, (!profileChanged || savingProfile) && styles.disabledBtn]}
                  onPress={handleSaveProfile}
                  disabled={!profileChanged || savingProfile}
                >
                  {savingProfile
                    ? <ActivityIndicator size="small" color={colors.actionText} />
                    : <Text style={styles.primaryBtnText}>Save Profile</Text>
                  }
                </Pressable>
              </View>
            </View>

            <Text style={styles.sectionHeader}>PASSWORD</Text>
            <View style={styles.section}>
              {!showPasswordForm ? (
                <Pressable
                  style={styles.actionRow}
                  onPress={() => {
                    clearError();
                    setPasswordSaved(false);
                    setShowPasswordForm(true);
                  }}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>Change password</Text>
                    <Text style={styles.rowDesc}>Use your current password to set a new one.</Text>
                  </View>
                  <Text style={styles.chevron}>{'>'}</Text>
                </Pressable>
              ) : (
                <View style={styles.formRow}>
                  <Text style={styles.label}>Current password</Text>
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={value => { clearError(); setCurrentPassword(value); }}
                    secureTextEntry
                    placeholder="Current password"
                    placeholderTextColor={colors.text3}
                  />
                  <Text style={styles.label}>New password</Text>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={value => { clearError(); setNewPassword(value); }}
                    secureTextEntry
                    placeholder="At least 8 characters"
                    placeholderTextColor={colors.text3}
                  />
                  <View style={styles.buttonRow}>
                    <Pressable
                      style={styles.secondaryBtn}
                      onPress={() => {
                        clearError();
                        setCurrentPassword('');
                        setNewPassword('');
                        setShowPasswordForm(false);
                      }}
                      disabled={changingPassword}
                    >
                      <Text style={styles.secondaryBtnText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.primaryBtn, (!currentPassword || !newPassword || changingPassword) && styles.disabledBtn]}
                      onPress={handleChangePassword}
                      disabled={!currentPassword || !newPassword || changingPassword}
                    >
                      {changingPassword
                        ? <ActivityIndicator size="small" color={colors.actionText} />
                        : <Text style={styles.primaryBtnText}>Change</Text>
                      }
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.sectionHeader}>STATS</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{user.puzzlesPlayed}</Text>
                <Text style={styles.statLabel}>Played</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{winRate}%</Text>
                <Text style={styles.statLabel}>Win rate</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{user.streakCurrent}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
            </View>

            <Text style={styles.sectionHeader}>SESSION</Text>
            <View style={styles.section}>
              <Pressable style={styles.actionRow} onPress={logout}>
                <Text style={styles.rowLabel}>Log out</Text>
              </Pressable>
              <Pressable
                style={[styles.actionRow, deleting && styles.deleteBtnDisabled]}
                onPress={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting
                  ? <ActivityIndicator size="small" color={colors.errorFlash} />
                  : <Text style={styles.deleteText}>Delete account</Text>
                }
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
      <BottomNav active="profile" />
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: { alignItems: 'center', padding: 24, paddingBottom: 36, gap: 12 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.bgBase, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
    avatarText: { fontSize: 32, fontFamily: FONTS.extraBold, color: c.text1 },
    name: { fontSize: 22, fontFamily: FONTS.extraBold, color: c.text1 },
    handleRow: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: c.bgBase, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 8, marginTop: 2,
    },
    handleName: { fontSize: 14, fontFamily: FONTS.extraBold, color: c.text2 },
    tagChip: { backgroundColor: c.text1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    tagText: { fontSize: 13, fontFamily: FONTS.extraBold, color: c.bgScreen, letterSpacing: 0.5 },
    copyHint: { fontSize: 11, fontFamily: FONTS.bold, color: c.text3, marginLeft: 2 },
    email: { fontSize: 15, fontFamily: FONTS.bold, color: c.text2 },
    logoutBtn: { marginTop: 32, borderWidth: 1.5, borderColor: c.border, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
    logoutText: { color: c.text1, fontFamily: FONTS.bold, fontSize: 15 },
    deleteBtnDisabled: { opacity: 0.5 },
    deleteText: { color: c.errorFlash, fontFamily: FONTS.bold, fontSize: 14 },
    sectionHeader: { alignSelf: 'stretch', fontSize: 11, fontFamily: FONTS.bold, color: c.text3, letterSpacing: 1.2, marginTop: 18, marginLeft: 4 },
    section: { alignSelf: 'stretch', backgroundColor: c.bgSurface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: c.border },
    formRow: { padding: 16, gap: 8 },
    label: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    input: { backgroundColor: c.bgBase, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: c.text1, borderWidth: 1, borderColor: c.border },
    primaryBtn: { minHeight: 44, backgroundColor: c.actionBg, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 11 },
    primaryBtnText: { color: c.actionText, fontFamily: FONTS.extraBold, fontSize: 14 },
    secondaryBtn: { minHeight: 44, borderWidth: 1.5, borderColor: c.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 11 },
    secondaryBtnText: { color: c.text2, fontFamily: FONTS.bold, fontSize: 14 },
    disabledBtn: { opacity: 0.45 },
    buttonRow: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
    actionRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: c.border },
    rowText: { flex: 1, gap: 2, marginRight: 12 },
    rowLabel: { fontSize: 16, fontFamily: FONTS.bold, color: c.text1 },
    rowDesc: { fontSize: 13, fontFamily: FONTS.bold, color: c.text3 },
    chevron: { fontSize: 28, lineHeight: 28, fontFamily: FONTS.bold, color: c.text3 },
    statsGrid: { alignSelf: 'stretch', flexDirection: 'row', gap: 8 },
    statBox: { flex: 1, backgroundColor: c.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 12, alignItems: 'center', gap: 2 },
    statValue: { fontSize: 20, fontFamily: FONTS.extraBold, color: c.text1 },
    statLabel: { fontSize: 11, fontFamily: FONTS.bold, color: c.text3 },
    error: { alignSelf: 'stretch', color: c.errorFlash, fontSize: 14, fontFamily: FONTS.bold },
    success: { alignSelf: 'stretch', color: c.correct, fontSize: 14, fontFamily: FONTS.bold },
  });
}
