import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KonnectLogo } from '@/components/KonnectLogo';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { useAuthStore } from '@/store/authStore';
import type { AuthStackParamList } from '../App';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'> };

export function WelcomeScreen({ navigation }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const guestLogin = useAuthStore(s => s.guestLogin);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <KonnectLogo iconSize={160} />
          <Text style={styles.tagline}>Word connections. Daily puzzles.{'\n'}Challenge your friends.</Text>
        </View>
        <View style={styles.buttons}>
          <Pressable style={styles.btnPrimary} onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.btnPrimaryText}>Create Account</Text>
          </Pressable>
          <Pressable style={styles.btnSecondary} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.btnSecondaryText}>Log In</Text>
          </Pressable>
          <Pressable style={styles.btnGuest} onPress={guestLogin}>
            <Text style={styles.btnGuestText}>Continue as Guest</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 32, paddingVertical: 48 },
    hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
    tagline: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2, textAlign: 'center', lineHeight: 22 },
    buttons: { gap: 12 },
    btnPrimary: { backgroundColor: c.text1, borderRadius: 12, padding: 16, alignItems: 'center' },
    btnPrimaryText: { color: c.bgScreen, fontSize: 16, fontFamily: FONTS.extraBold },
    btnSecondary: { borderWidth: 1.5, borderColor: c.border, borderRadius: 12, padding: 16, alignItems: 'center' },
    btnSecondaryText: { color: c.text1, fontSize: 16, fontFamily: FONTS.bold },
    btnGuest: { padding: 12, alignItems: 'center' },
    btnGuestText: { color: c.text3, fontSize: 14, fontFamily: FONTS.bold },
  });
}
