import React, { useEffect, useMemo } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet, Switch, ScrollView, Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Line } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme, LIGHT_COLORS } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { useSettingsStore } from '@/store/settingsStore';

const DIFFICULTY_ROWS = [
  { colour: LIGHT_COLORS.yellow, label: 'Sunflower', difficulty: 'Easiest', hint: 'Straightforward. The theme is clear once you see it.' },
  { colour: LIGHT_COLORS.green,  label: 'Sage',      difficulty: 'Medium',  hint: 'Needs a little lateral thinking to crack' },
  { colour: LIGHT_COLORS.blue,   label: 'Teal',      difficulty: 'Tricky',  hint: 'Unexpected links. Watch out for red herrings.' },
  { colour: LIGHT_COLORS.purple, label: 'Violet',    difficulty: 'Hardest', hint: 'Cryptic or abstract. Saved for last.' },
];

export function HelpModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { hardMode, setHardMode } = useSettingsStore();
  const sheetY = useSharedValue(600);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 220 });
      sheetY.value = withSpring(0, { damping: 22, stiffness: 280 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 180 });
      sheetY.value = withTiming(600, { duration: 220 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>How to Play</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Svg width="20" height="20" viewBox="0 0 20 20">
                <Line x1="4" y1="4" x2="16" y2="16" stroke={colors.text2} strokeWidth="2.2" strokeLinecap="round" />
                <Line x1="16" y1="4" x2="4" y2="16" stroke={colors.text2} strokeWidth="2.2" strokeLinecap="round" />
              </Svg>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <View style={styles.section}>
              <Text style={styles.rule}>Find four groups of four words that share a connection.</Text>
              <Text style={styles.rule}>Tap four words, then hit <Text style={styles.bold}>Submit</Text>.</Text>
              <Text style={styles.rule}>You get <Text style={styles.bold}>4 mistakes</Text> before the game ends.</Text>
              <Text style={styles.rule}>One away? You'll be told if three of your four are correct.</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Difficulty</Text>
            <Text style={styles.sectionSub}>Each group is colour-coded by how tricky it is.</Text>

            <View style={styles.difficultyList}>
              {DIFFICULTY_ROWS.map((row, i) => (
                <View key={i} style={styles.diffRow}>
                  <View style={[styles.swatch, { backgroundColor: row.colour }]}>
                    <View style={styles.swatchDots}>
                      {Array.from({ length: i + 1 }).map((_, d) => (
                        <View key={d} style={styles.swatchDot} />
                      ))}
                    </View>
                  </View>
                  <View style={styles.diffText}>
                    <View style={styles.diffLabelRow}>
                      <Text style={styles.diffLabel}>{row.label}</Text>
                      <Text style={[styles.diffDifficulty, { color: row.colour }]}>{row.difficulty}</Text>
                    </View>
                    <Text style={styles.diffHint}>{row.hint}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.hardModeCard}>
              <View style={styles.hardModeHeader}>
                <Svg width={18} height={18} viewBox="0 0 20 20">
                  <Path d="M10 2 C10 2 13 6 13 9 C13 9 15 7 14 5 C14 5 18 8 18 13 C18 17.4 14.4 20 10 20 C5.6 20 2 17.4 2 13 C2 9 5 6 5 6 C5 8 7 9 7 9 C7 6.5 10 2 10 2Z" fill={colors.purple} />
                </Svg>
                <Text style={styles.hardModeTitle}>Hard Mode</Text>
                <Switch
                  value={hardMode}
                  onValueChange={setHardMode}
                  trackColor={{ false: colors.border, true: colors.purple }}
                  thumbColor={Platform.OS === 'android' ? colors.bgSurface : undefined}
                  style={styles.hardModeSwitch}
                />
              </View>
              <Text style={styles.hardModeDesc}>
                You must solve the <Text style={styles.bold}>hardest group first</Text> (Violet → Teal → Sage → Sunflower).
                Solving an easier group counts as a mistake.
              </Text>
              {hardMode && (
                <View style={styles.hardModeBadge}>
                  <Svg width={12} height={12} viewBox="0 0 20 20">
                    <Path d="M10 2 C10 2 13 6 13 9 C13 9 15 7 14 5 C14 5 18 8 18 13 C18 17.4 14.4 20 10 20 C5.6 20 2 17.4 2 13 C2 9 5 6 5 6 C5 8 7 9 7 9 C7 6.5 10 2 10 2Z" fill={colors.bgSurface} />
                  </Svg>
                  <Text style={styles.hardModeBadgeText}>Active: solve hardest first</Text>
                </View>
              )}
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,30,18,0.45)' },
    sheet: {
      backgroundColor: c.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      maxHeight: '88%', paddingTop: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 20,
    },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: 8 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
    title: { flex: 1, fontSize: 20, fontFamily: FONTS.extraBold, color: c.text1 },
    closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bgBase, borderRadius: 16 },
    body: { paddingHorizontal: 20, paddingTop: 4 },
    section: { gap: 8, paddingBottom: 4 },
    rule: { fontSize: 15, fontFamily: FONTS.bold, color: c.text2, lineHeight: 22 },
    bold: { fontFamily: FONTS.extraBold, color: c.text1 },
    divider: { height: 1, backgroundColor: c.border, marginVertical: 20 },
    sectionTitle: { fontSize: 16, fontFamily: FONTS.extraBold, color: c.text1, marginBottom: 4 },
    sectionSub: { fontSize: 13, fontFamily: FONTS.bold, color: c.text3, marginBottom: 14 },
    difficultyList: { gap: 10 },
    diffRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    swatch: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    swatchDots: { flexDirection: 'row', gap: 3 },
    swatchDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.7)' },
    diffText: { flex: 1, gap: 3 },
    diffLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    diffLabel: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.text1 },
    diffDifficulty: { fontSize: 12, fontFamily: FONTS.extraBold, letterSpacing: 0.5, textTransform: 'uppercase' },
    diffHint: { fontSize: 13, fontFamily: FONTS.bold, color: c.text3, lineHeight: 18 },
    hardModeCard: { backgroundColor: c.bgBase, borderRadius: 16, padding: 16, gap: 10 },
    hardModeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    hardModeTitle: { flex: 1, fontSize: 16, fontFamily: FONTS.extraBold, color: c.text1 },
    hardModeSwitch: { transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] },
    hardModeDesc: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2, lineHeight: 20 },
    hardModeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: c.purple, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    hardModeBadgeText: { fontSize: 12, fontFamily: FONTS.extraBold, color: c.bgSurface },
  });
}
