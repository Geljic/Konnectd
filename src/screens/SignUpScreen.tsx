import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';

export function SignUpScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUp, isLoading, error, clearError } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <Text style={styles.title}>Create account</Text>
        {error && <Text style={styles.error}>{error}</Text>}
        <TextInput
          style={styles.input}
          placeholder="Display name"
          placeholderTextColor={colors.text3}
          value={displayName}
          onChangeText={t => { clearError(); setDisplayName(t); }}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.text3}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={t => { clearError(); setEmail(t); }}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.text3}
          secureTextEntry
          value={password}
          onChangeText={t => { clearError(); setPassword(t); }}
        />
        <Pressable style={styles.btn} onPress={() => signUp(email, password, displayName)} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color={colors.bgScreen} /> : <Text style={styles.btnText}>Create Account</Text>}
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: { flex: 1, padding: 32, justifyContent: 'center', gap: 14 },
    title: { fontSize: 28, fontFamily: FONTS.extraBold, color: c.text1, marginBottom: 8 },
    input: { backgroundColor: c.bgSurface, borderRadius: 10, padding: 14, fontSize: 16, color: c.text1, borderWidth: 1, borderColor: c.border },
    btn: { backgroundColor: c.text1, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
    btnText: { color: c.bgScreen, fontSize: 16, fontFamily: FONTS.extraBold },
    error: { color: c.errorFlash, fontSize: 14, fontFamily: FONTS.bold },
  });
}
