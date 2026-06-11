import React, { useEffect, useMemo } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';

const EXAMPLE_ROWS = ['Can be cracked', 'Found in court', 'Has a shell', 'Can be streamed'];
const EXAMPLE_COLS = ['Food', 'Tech', 'Sport', 'Nature'];
const EXAMPLE_GRID = [
  ['EGG', 'PASSWORD', 'BAT', 'ICE'],
  ['DATES', 'CASE', 'TENNIS', 'YARD'],
  ['TACO', 'TERMINAL', 'HELMET', 'TURTLE'],
  ['SAUCE', 'VIDEO', 'MATCH', 'RIVER'],
];

// Full walkthrough of the highlighted top row: "Can be cracked".
const WORKED_ROW = [
  { word: 'EGG', col: 'Food' },
  { word: 'PASSWORD', col: 'Tech' },
  { word: 'BAT', col: 'Sport' },
  { word: 'ICE', col: 'Nature' },
];

const SCAN_LEGEND: { tag: string; colourKey: keyof ColorTheme; desc: string }[] = [
  { tag: 'Correct', colourKey: 'green', desc: 'Right row and right column.' },
  { tag: 'Row', colourKey: 'blue', desc: 'Right row, wrong column.' },
  { tag: 'Column', colourKey: 'blue', desc: 'Right column, wrong row.' },
  { tag: 'Static', colourKey: 'text3', desc: 'Belongs somewhere else entirely.' },
];

export function CrossedSignalsHelpModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
              <Text style={styles.rule}>Every word has <Text style={styles.bold}>two meanings</Text>.</Text>
              <Text style={styles.rule}>Place each word where its <Text style={styles.bold}>row signal</Text> crosses its <Text style={styles.bold}>column signal</Text>.</Text>
              <Text style={styles.rule}>Tap a tile, then a cell to swap. Mark a row or column <Text style={styles.bold}>Ready</Text> and Submit to check just that line.</Text>
              <Text style={styles.rule}>A wrong full-board submit adds <Text style={styles.bold}>Noise</Text>. 4 Noise and the signal collapses.</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Example Grid</Text>
            <Text style={styles.sectionSub}>Look at the highlighted top row — every word in it &ldquo;can be cracked&rdquo;.</Text>

            <View style={styles.grid}>
              <View style={styles.gridRow}>
                <View style={styles.corner} />
                {EXAMPLE_COLS.map(col => (
                  <View key={col} style={styles.colHead}>
                    <Text style={styles.colHeadText} numberOfLines={2}>{col}</Text>
                  </View>
                ))}
              </View>
              {EXAMPLE_GRID.map((row, r) => (
                <View key={EXAMPLE_ROWS[r]} style={styles.gridRow}>
                  <View style={styles.rowHead}>
                    <Text style={styles.rowHeadText} numberOfLines={2}>{EXAMPLE_ROWS[r]}</Text>
                  </View>
                  {row.map((word, ci) => (
                    <View key={word} style={[styles.cell, r === 0 && styles.cellHighlight]}>
                      <Text style={styles.cellText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{word}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>

            <Text style={[styles.sectionSub, { marginTop: 16, marginBottom: 10 }]}>
              The <Text style={styles.bold}>row signal</Text> stays the same across the row. Each <Text style={styles.bold}>column</Text> adds a second meaning — find the word that fits <Text style={styles.bold}>both</Text>:
            </Text>
            <View style={styles.workedList}>
              {WORKED_ROW.map(item => (
                <View key={item.word} style={styles.workedRow}>
                  <View style={styles.workedWord}>
                    <Text style={styles.workedWordText}>{item.word}</Text>
                  </View>
                  <View style={styles.workedCross}>
                    <View style={styles.workedChip}>
                      <Text style={styles.workedChipText}>Cracked</Text>
                    </View>
                    <Text style={styles.workedPlus}>×</Text>
                    <View style={[styles.workedChip, styles.workedChipCol]}>
                      <Text style={styles.workedChipText}>{item.col}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
            <Text style={[styles.sectionSub, { marginTop: 10, marginBottom: 0 }]}>
              So EGG goes under <Text style={styles.bold}>Food</Text>, PASSWORD under <Text style={styles.bold}>Tech</Text>, and so on — one word per crossing.
            </Text>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Scans</Text>
            <Text style={styles.sectionSub}>You get 3 scans. Each one probes a placed tile:</Text>
            <View style={styles.legendList}>
              {SCAN_LEGEND.map(item => (
                <View key={item.tag} style={styles.legendRow}>
                  <View style={[styles.legendPill, { backgroundColor: colors[item.colourKey] as string }]}>
                    <Text style={styles.legendPillText}>{item.tag}</Text>
                  </View>
                  <Text style={styles.legendDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>Tip</Text>
              <Text style={styles.tipText}>
                Long-press a tile to <Text style={styles.bold}>lock</Text> it once you are sure. Solved rows and columns lock automatically and turn their category colour.
              </Text>
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
      backgroundColor: c.bgSurface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '88%',
      paddingTop: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 20,
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
    grid: { gap: 4 },
    gridRow: { flexDirection: 'row', gap: 4 },
    corner: { width: 58 },
    colHead: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
    colHeadText: { fontSize: 9, fontFamily: FONTS.extraBold, color: c.text3, textAlign: 'center' },
    rowHead: { width: 58, justifyContent: 'center' },
    rowHeadText: { fontSize: 9, fontFamily: FONTS.extraBold, color: c.text3 },
    cell: { flex: 1, minHeight: 34, borderRadius: 6, backgroundColor: c.bgBase, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
    cellHighlight: { backgroundColor: c.green + '33', borderWidth: 1, borderColor: c.green },
    cellText: { fontSize: 9.5, fontFamily: FONTS.extraBold, color: c.text1 },
    workedList: { gap: 8 },
    workedRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: c.bgBase, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12,
    },
    workedWord: { minWidth: 86 },
    workedWordText: { fontSize: 14, fontFamily: FONTS.extraBold, color: c.text1 },
    workedCross: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    workedChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: c.blue + '22' },
    workedChipCol: { backgroundColor: c.purple + '22' },
    workedChipText: { fontSize: 11, fontFamily: FONTS.extraBold, color: c.text2 },
    workedPlus: { fontSize: 13, fontFamily: FONTS.extraBold, color: c.text3 },
    legendList: { gap: 10 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    legendPill: { minWidth: 64, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center' },
    legendPillText: { fontSize: 12, fontFamily: FONTS.extraBold, color: '#162219' },
    legendDesc: { flex: 1, fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    tipCard: { backgroundColor: c.bgBase, borderRadius: 16, padding: 16, gap: 8 },
    tipTitle: { fontSize: 16, fontFamily: FONTS.extraBold, color: c.text1 },
    tipText: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2, lineHeight: 20 },
  });
}
