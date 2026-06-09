import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';

export function ProfileScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user, logout, deleteAccount } = useAuthStore();
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
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
            <Pressable style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutText}>Log Out</Text>
            </Pressable>
            <Pressable
              style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
              onPress={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting
                ? <ActivityIndicator size="small" color={colors.errorFlash} />
                : <Text style={styles.deleteText}>Delete Account</Text>
              }
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: { flex: 1, alignItems: 'center', padding: 32, gap: 12 },
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
    deleteBtn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 12 },
    deleteBtnDisabled: { opacity: 0.5 },
    deleteText: { color: c.errorFlash, fontFamily: FONTS.bold, fontSize: 14 },
  });
}
