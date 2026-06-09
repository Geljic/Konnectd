import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Switch, StyleSheet, Alert, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Line, Ellipse } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { useSettingsStore, STRIP_CONFIG, type TileStripStyle, type CosmeticTheme } from '@/store/settingsStore';
import { useMonetisationStore } from '@/store/monetisationStore';
import { MONETISATION_PRODUCTS } from '@/constants/config';
import { FONTS } from '@/constants/fonts';
import {
  requestNotificationPermission,
  scheduleDailyStreakReminder,
  cancelDailyStreakReminder,
} from '@/utils/notifications';

function Row({ label, description, value, onChange, colors }: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: ColorTheme;
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description && <Text style={styles.rowDesc}>{description}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.text1 }} />
    </View>
  );
}

// Mini face SVG for each strip option preview
function MiniFace({ index }: { index: number }) {
  const D = '#162219';
  const W = '#FFFFFF';
  switch (index) {
    case 0: return <>
      <Circle cx="26" cy="18" r="4.5" fill={D} />
      <Circle cx="54" cy="18" r="4.5" fill={D} />
      <Path d="M32 29 Q40 34 48 29" stroke={D} strokeWidth="2" fill="none" strokeLinecap="round" />
    </>;
    case 1: return <>
      <Line x1="19" y1="10" x2="31" y2="14" stroke={D} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="49" y1="14" x2="61" y2="10" stroke={D} strokeWidth="2.5" strokeLinecap="round" />
      <Circle cx="26" cy="20" r="4.5" fill={D} />
      <Circle cx="54" cy="20" r="4.5" fill={D} />
      <Path d="M31 31 Q40 26 49 31" stroke={D} strokeWidth="2" fill="none" strokeLinecap="round" />
    </>;
    case 2: return <>
      <Ellipse cx="15" cy="23" rx="6" ry="3.5" fill="#F4A0A0" opacity="0.55" />
      <Ellipse cx="65" cy="23" rx="6" ry="3.5" fill="#F4A0A0" opacity="0.55" />
      <Circle cx="26" cy="17" r="2.5" fill={D} />
      <Circle cx="54" cy="17" r="2.5" fill={D} />
      <Path d="M34 27 Q40 31 46 27" stroke={D} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>;
    default: return <>
      <Circle cx="26" cy="15" r="4.5" fill={D} />
      <Circle cx="54" cy="15" r="4.5" fill={D} />
      <Path d="M25 24 Q40 35 55 24 Z" fill={D} />
      <Path d="M28 24 Q40 31 52 24" fill={W} />
    </>;
  }
}

const STRIP_OPTIONS: Array<{ key: TileStripStyle; label: string; desc: string; faceIndex: number }> = [
  { key: 'tiny', label: 'Subtle',  desc: 'Minimal accent',    faceIndex: 2 },
  { key: 'tall', label: 'Full',    desc: 'Full face visible',  faceIndex: 1 },
  { key: 'peek', label: 'Peek',    desc: 'Eyes only',          faceIndex: 0 },
  { key: 'big',  label: 'Bold',    desc: 'Big & expressive',   faceIndex: 3 },
];

function TileStylePicker({ colors }: { colors: ColorTheme }) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const current = useSettingsStore(s => s.tileStripStyle);
  const setTileStripStyle = useSettingsStore(s => s.setTileStripStyle);

  return (
    <View style={styles.pickerRow}>
      <View style={styles.pickerLabelRow}>
        <Text style={styles.rowLabel}>Tile faces</Text>
        <Text style={styles.rowDesc}>How much of the face shows on each tile</Text>
      </View>
      <View style={styles.pickerOptions}>
        {STRIP_OPTIONS.map(opt => {
          const cfg = STRIP_CONFIG[opt.key];
          const isSelected = current === opt.key;
          return (
            <Pressable
              key={opt.key}
              style={[styles.pickerOption, isSelected && { borderColor: colors.text1, backgroundColor: colors.bgBase }]}
              onPress={() => setTileStripStyle(opt.key)}
            >
              {/* Mini tile mockup */}
              <View style={[styles.miniTile, { backgroundColor: colors.tileStrip }]}>
                <View style={[styles.miniStrip, { height: cfg.height / 2, backgroundColor: colors.tileStrip }]}>
                  <Svg
                    width="100%"
                    height={cfg.height / 2}
                    viewBox={cfg.viewBox}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <MiniFace index={opt.faceIndex} />
                  </Svg>
                </View>
                <View style={[styles.miniWord, { backgroundColor: colors.tileDefault }]}>
                  <Text style={[styles.miniWordText, { color: colors.text1 }]}>ABC</Text>
                </View>
              </View>
              <Text style={[styles.optionLabel, isSelected && { color: colors.text1 }]}>{opt.label}</Text>
              <Text style={styles.optionDesc}>{opt.desc}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const THEME_OPTIONS: Array<{ key: CosmeticTheme; label: string; swatches: string[] }> = [
  { key: 'classic', label: 'Classic', swatches: ['#8EC4AA', '#F5C842', '#3DBE8A', '#4AAEC8'] },
  { key: 'gardenPop', label: 'Garden Pop', swatches: ['#F0A1B7', '#DDE6FF', '#3DBE8A', '#9D6EC8'] },
];

function ThemePicker({ colors, locked, onBuy }: { colors: ColorTheme; locked: boolean; onBuy: () => void }) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const current = useSettingsStore(s => s.cosmeticTheme);
  const setCosmeticTheme = useSettingsStore(s => s.setCosmeticTheme);

  return (
    <View style={styles.pickerRow}>
      <View style={styles.pickerLabelRow}>
        <Text style={styles.rowLabel}>Board theme</Text>
        <Text style={styles.rowDesc}>Cosmetic colour packs for the board and chrome</Text>
      </View>
      <View style={styles.themeOptions}>
        {THEME_OPTIONS.map(opt => {
          const isSelected = current === opt.key || (locked && opt.key === 'classic');
          const isLocked = locked && opt.key === 'gardenPop';
          return (
            <Pressable
              key={opt.key}
              style={[styles.themeOption, isSelected && { borderColor: colors.text1, backgroundColor: colors.bgBase }]}
              onPress={() => {
                if (isLocked) onBuy();
                else setCosmeticTheme(opt.key);
              }}
            >
              <View style={styles.swatches}>
                {opt.swatches.map(swatch => (
                  <View key={swatch} style={[styles.swatch, { backgroundColor: swatch }]} />
                ))}
              </View>
              <Text style={styles.optionLabel}>{opt.label}</Text>
              {isLocked && <Text style={styles.optionDesc}>Locked</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ProductCard({
  title,
  description,
  price,
  owned,
  loading,
  onPress,
  colors,
}: {
  title: string;
  description: string;
  price: string;
  owned: boolean;
  loading: boolean;
  onPress: () => void;
  colors: ColorTheme;
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.productCard}>
      <View style={styles.productText}>
        <Text style={styles.rowLabel}>{title}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      <Pressable
        style={[styles.buyBtn, owned && styles.buyBtnOwned, loading && styles.buyBtnLoading]}
        onPress={onPress}
        disabled={owned || loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={[styles.buyBtnText, owned && styles.buyBtnOwnedText]}>{owned ? 'Owned' : price}</Text>
        )}
      </Pressable>
    </View>
  );
}

export function SettingsScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [soundOn, setSoundOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);

  const { hardMode, notificationsEnabled, challengeNotificationsEnabled, darkMode, load, setHardMode, setNotificationsEnabled, setChallengeNotificationsEnabled, setDarkMode, setCosmeticTheme } = useSettingsStore();
  const { buyProduct, restore, isCosmeticPackOwned, isSupporter, purchasingProductId } = useMonetisationStore();
  const cosmeticPackOwned = isCosmeticPackOwned();
  const supporter = isSupporter();

  useEffect(() => {
    load();
    AsyncStorage.getItem('setting_sound').then(v => { if (v !== null) setSoundOn(v === 'true'); });
    AsyncStorage.getItem('setting_haptics').then(v => { if (v !== null) setHapticsOn(v === 'true'); });
  }, []);

  async function toggleSound(val: boolean) {
    setSoundOn(val);
    await AsyncStorage.setItem('setting_sound', String(val));
  }

  async function toggleHaptics(val: boolean) {
    setHapticsOn(val);
    await AsyncStorage.setItem('setting_haptics', String(val));
  }

  async function toggleNotifications(val: boolean) {
    if (val) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permission needed',
          'Enable notifications in your device Settings to receive daily streak reminders.',
        );
        return;
      }
      await scheduleDailyStreakReminder();
    } else {
      await cancelDailyStreakReminder();
    }
    await setNotificationsEnabled(val);
  }

  async function buyCosmeticPack() {
    try {
      await buyProduct(MONETISATION_PRODUCTS.cosmeticsPack.id);
      await setCosmeticTheme('gardenPop');
    } catch {
      Alert.alert('Purchase failed', 'Please try again in a moment.');
    }
  }

  async function buySupportPass() {
    try {
      await buyProduct(MONETISATION_PRODUCTS.supportPass.id);
      await setCosmeticTheme('gardenPop');
      Alert.alert('Thank you', 'Supporter Pass is active. Unlimited hints and Garden Pop cosmetics are unlocked.');
    } catch {
      Alert.alert('Purchase failed', 'Please try again in a moment.');
    }
  }

  async function restoreOwnedPurchases() {
    try {
      await restore();
      Alert.alert('Restore complete', 'Any available purchases have been restored.');
    } catch {
      Alert.alert('Restore failed', 'Please try again in a moment.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.sectionHeader}>APPEARANCE</Text>
        <View style={styles.section}>
          <Row label="Dark Mode" description="Easy on the eyes at night." value={darkMode} onChange={setDarkMode} colors={colors} />
          <ThemePicker colors={colors} locked={!cosmeticPackOwned} onBuy={buyCosmeticPack} />
          <TileStylePicker colors={colors} />
        </View>

        <Text style={styles.sectionHeader}>SUPPORT</Text>
        <View style={styles.section}>
          <ProductCard
            title={MONETISATION_PRODUCTS.cosmeticsPack.label}
            description="Unlock the Garden Pop board theme and future cosmetic variants."
            price={MONETISATION_PRODUCTS.cosmeticsPack.priceLabel}
            owned={cosmeticPackOwned}
            loading={purchasingProductId === MONETISATION_PRODUCTS.cosmeticsPack.id}
            onPress={buyCosmeticPack}
            colors={colors}
          />
          <ProductCard
            title={MONETISATION_PRODUCTS.supportPass.label}
            description="One-time support purchase with unlimited hints, ad-free play and cosmetics vault access."
            price={MONETISATION_PRODUCTS.supportPass.priceLabel}
            owned={supporter}
            loading={purchasingProductId === MONETISATION_PRODUCTS.supportPass.id}
            onPress={buySupportPass}
            colors={colors}
          />
          <Pressable style={styles.restoreBtn} onPress={restoreOwnedPurchases}>
            <Text style={styles.restoreBtnText}>Restore purchases</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionHeader}>GAMEPLAY</Text>
        <View style={styles.section}>
          <Row
            label="Hard Mode"
            description="Must solve the hardest connection first."
            value={hardMode}
            onChange={setHardMode}
            colors={colors}
          />
        </View>

        <Text style={styles.sectionHeader}>AUDIO</Text>
        <View style={styles.section}>
          <Row label="Sound effects" value={soundOn} onChange={toggleSound} colors={colors} />
          <Row label="Haptic feedback" value={hapticsOn} onChange={toggleHaptics} colors={colors} />
        </View>

        <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
        <View style={styles.section}>
          <Row
            label="Daily streak reminder"
            description="Reminds you at 8 pm to play today's puzzle"
            value={notificationsEnabled}
            onChange={toggleNotifications}
            colors={colors}
          />
          <Row
            label="Challenge alerts"
            description="Notify when a friend challenges you or completes your challenge"
            value={challengeNotificationsEnabled}
            onChange={async (val) => {
              if (val) {
                const granted = await requestNotificationPermission();
                if (!granted) return;
              }
              await setChallengeNotificationsEnabled(val);
            }}
            colors={colors}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: { padding: 24, paddingBottom: 36 },
    title: { fontSize: 26, fontFamily: FONTS.extraBold, color: c.text1, marginBottom: 24 },
    sectionHeader: { fontSize: 11, fontFamily: FONTS.bold, color: c.text3, letterSpacing: 1.2, marginTop: 20, marginBottom: 6, marginLeft: 4 },
    section: { backgroundColor: c.bgSurface, borderRadius: 12, overflow: 'hidden' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: c.border },
    rowText: { flex: 1, gap: 2, marginRight: 12 },
    rowLabel: { fontSize: 16, fontFamily: FONTS.bold, color: c.text1 },
    rowDesc: { fontSize: 13, fontFamily: FONTS.bold, color: c.text3 },
    // Tile style picker
    pickerRow: { padding: 16, gap: 10 },
    pickerLabelRow: { gap: 2 },
    pickerOptions: { flexDirection: 'row', gap: 8 },
    pickerOption: {
      flex: 1, alignItems: 'center', gap: 4,
      borderWidth: 1.5, borderColor: c.border,
      borderRadius: 10, padding: 8,
    },
    miniTile: {
      width: '100%', aspectRatio: 1,
      borderRadius: 8, overflow: 'hidden',
      flexDirection: 'column',
    },
    miniStrip: { width: '100%', flexShrink: 0 },
    miniWord: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
    },
    miniWordText: { fontSize: 8, fontFamily: FONTS.extraBold, letterSpacing: 0.5 },
    optionLabel: { fontSize: 11, fontFamily: FONTS.extraBold, color: c.text3, letterSpacing: 0.3 },
    optionDesc: { fontSize: 9, fontFamily: FONTS.bold, color: c.text3, textAlign: 'center' },
    themeOptions: { flexDirection: 'row', gap: 8 },
    themeOption: {
      flex: 1, gap: 8,
      borderWidth: 1.5, borderColor: c.border,
      borderRadius: 10, padding: 10,
    },
    swatches: { flexDirection: 'row', gap: 4 },
    swatch: { flex: 1, height: 22, borderRadius: 5 },
    productCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      padding: 16, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    productText: { flex: 1, gap: 3 },
    buyBtn: {
      minWidth: 72, minHeight: 40,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.text1, borderRadius: 12,
      paddingHorizontal: 12, paddingVertical: 9,
    },
    buyBtnOwned: { backgroundColor: c.bgBase, borderWidth: 1.5, borderColor: c.border },
    buyBtnLoading: { opacity: 0.7 },
    buyBtnText: { fontSize: 13, fontFamily: FONTS.extraBold, color: '#FFF' },
    buyBtnOwnedText: { color: c.text2 },
    restoreBtn: { alignItems: 'center', padding: 14 },
    restoreBtnText: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2 },
  });
}
