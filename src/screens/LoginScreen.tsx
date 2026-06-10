import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';

export function LoginScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { login, requestPasswordReset, isLoading, error, clearError } = useAuthStore();

  async function handlePasswordReset() {
    try {
      await requestPasswordReset(email);
      setResetSent(true);
    } catch {
      // Store error is already populated.
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <Text style={styles.title}>{resetMode ? 'Reset password' : 'Welcome back'}</Text>
        {resetMode && <Text style={styles.helper}>Enter your account email and we will send a password reset link.</Text>}
        {error && <Text style={styles.error}>{error}</Text>}
        {resetSent && <Text style={styles.success}>Check your inbox for the reset link.</Text>}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.text3}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={t => { clearError(); setResetSent(false); setEmail(t); }}
        />
        {!resetMode && (
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.text3}
            secureTextEntry
            value={password}
            onChangeText={t => { clearError(); setPassword(t); }}
          />
        )}
        {resetMode ? (
          <>
            <Pressable style={styles.btn} onPress={handlePasswordReset} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color={colors.actionText} /> : <Text style={styles.btnText}>Send Reset Link</Text>}
            </Pressable>
            <Pressable
              style={styles.linkBtn}
              onPress={() => { clearError(); setResetSent(false); setResetMode(false); }}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>Back to log in</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable style={styles.btn} onPress={() => login(email, password)} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color={colors.actionText} /> : <Text style={styles.btnText}>Log In</Text>}
            </Pressable>
            <Pressable
              style={styles.linkBtn}
              onPress={() => { clearError(); setResetSent(false); setResetMode(true); }}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>Forgot password?</Text>
            </Pressable>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: { flex: 1, padding: 32, justifyContent: 'center', gap: 14 },
    title: { fontSize: 28, fontFamily: FONTS.extraBold, color: c.text1, marginBottom: 8 },
    helper: { fontSize: 14, lineHeight: 20, fontFamily: FONTS.bold, color: c.text2, marginTop: -6 },
    input: { backgroundColor: c.bgSurface, borderRadius: 10, padding: 14, fontSize: 16, color: c.text1, borderWidth: 1, borderColor: c.border },
    btn: { backgroundColor: c.actionBg, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
    btnText: { color: c.actionText, fontSize: 16, fontFamily: FONTS.extraBold },
    linkBtn: { alignItems: 'center', padding: 8 },
    linkText: { color: c.text2, fontSize: 14, fontFamily: FONTS.bold },
    error: { color: c.errorFlash, fontSize: 14, fontFamily: FONTS.bold },
    success: { color: c.correct, fontSize: 14, fontFamily: FONTS.bold },
  });
}
