import React, { useEffect, useMemo } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Line, Path } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';

const EXAMPLE_PATHS = [
  { colour: '#F5C842', label: 'grows into', words: ['SEED', 'ROOT', 'TREE', 'FOREST'] },
  { colour: '#3DBE8A', label: 'causes', words: ['MATCH', 'SPARK', 'FIRE', 'SMOKE'] },
  { colour: '#4AAEC8', label: 'performance path', words: ['SCRIPT', 'ACTOR', 'STAGE', 'APPLAUSE'] },
];

export function WordlinesHelpModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
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
              <Text style={styles.rule}>Find four hidden ordered paths.</Text>
              <Text style={styles.rule}>Tap four words <Text style={styles.bold}>in order</Text>, then hit <Text style={styles.bold}>Submit Steps</Text>.</Text>
              <Text style={styles.rule}>You get <Text style={styles.bold}>4 mistakes</Text> before the path closes.</Text>
              <Text style={styles.rule}>Right words but wrong order? You'll be told to reorder them.</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Example Paths</Text>
            <Text style={styles.sectionSub}>Every word connects to the next by meaning, cause, phrase, process, or story logic.</Text>

            <View style={styles.trailList}>
              {EXAMPLE_PATHS.map(trail => (
                <View key={trail.label} style={styles.trailRow}>
                  <View style={[styles.swatch, { backgroundColor: trail.colour }]}>
                    <PathIcon color={colors.categoryText} />
                  </View>
                  <View style={styles.trailText}>
                    <View style={styles.trailLabelRow}>
                      <Text style={styles.trailLabel}>{trail.label}</Text>
                      <Text style={[styles.trailType, { color: trail.colour }]}>Ordered</Text>
                    </View>
                    <Text style={styles.trailWords}>{trail.words.join(' -> ')}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>Path logic</Text>
              <Text style={styles.tipText}>
                A set can be correct but still fail if the order is wrong. For example, <Text style={styles.bold}>MATCH -> SPARK -> FIRE -> SMOKE</Text> works because the ideas flow forward.
              </Text>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function PathIcon({ color }: { color: string }) {
  return (
    <Svg width={28} height={18} viewBox="0 0 28 18">
      <Line x1="5" y1="9" x2="14" y2="9" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="18" y1="9" x2="23" y2="9" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M21 5 L25 9 L21 13" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
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
    trailList: { gap: 10 },
    trailRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    swatch: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    trailText: { flex: 1, gap: 3 },
    trailLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    trailLabel: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.text1 },
    trailType: { fontSize: 12, fontFamily: FONTS.extraBold, letterSpacing: 0.5, textTransform: 'uppercase' },
    trailWords: { fontSize: 13, fontFamily: FONTS.bold, color: c.text3, lineHeight: 18 },
    tipCard: { backgroundColor: c.bgBase, borderRadius: 16, padding: 16, gap: 8 },
    tipTitle: { fontSize: 16, fontFamily: FONTS.extraBold, color: c.text1 },
    tipText: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2, lineHeight: 20 },
  });
}
