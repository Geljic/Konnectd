import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Switch, StyleSheet, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Line, Ellipse } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { useSettingsStore, STRIP_CONFIG, type TileStripStyle } from '@/store/settingsStore';
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

export function SettingsScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [soundOn, setSoundOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);

  const { hardMode, notificationsEnabled, darkMode, load, setHardMode, setNotificationsEnabled, setDarkMode } = useSettingsStore();

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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.sectionHeader}>APPEARANCE</Text>
        <View style={styles.section}>
          <Row label="Dark Mode" description="Easy on the eyes at night." value={darkMode} onChange={setDarkMode} colors={colors} />
          <TileStylePicker colors={colors} />
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
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: { flex: 1, padding: 24 },
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
  });
}
