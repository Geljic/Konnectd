import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WORD_TRAILS_PUZZLES, type WordTrail, type WordTrailsPuzzle } from '@/data/wordTrailsPuzzles';
import {
  getDailyWordTrailsPuzzle,
  getRandomWordTrailsPuzzle,
  getWordTrailsBoard,
  markWordTrailsCompleted,
} from '@/utils/wordTrails';
import { shuffle } from '@/utils/shuffle';
import { recordPlaySession } from '@/api/puzzles';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { MAX_MISTAKES } from '@/constants/config';
import { useSound } from '@/hooks/useSound';
import { MistakeDots } from '@/components/MistakeDots';
import { WordlinesHelpModal } from '@/components/WordlinesHelpModal';
import type { AppStackParamList } from '../App';

type Props = NativeStackScreenProps<AppStackParamList, 'WordlinesGame'>;
type GameStatus = 'playing' | 'won' | 'lost';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  return `${m}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function resolvePuzzle(mode: 'daily' | 'random' | 'freeplay', puzzleId?: string): WordTrailsPuzzle {
  if (mode === 'daily') return getDailyWordTrailsPuzzle(WORD_TRAILS_PUZZLES);
  if (mode === 'freeplay' && puzzleId) {
    return WORD_TRAILS_PUZZLES.find(p => p.id === puzzleId) ?? WORD_TRAILS_PUZZLES[0];
  }
  return getRandomWordTrailsPuzzle(WORD_TRAILS_PUZZLES);
}

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18">
      <Path d="M11 4 L5 9 L11 14" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function InfoIcon({ color }: { color: string }) {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18">
      <Circle cx="9" cy="9" r="8" stroke={color} strokeWidth="1.8" fill="none" />
      <Line x1="9" y1="8" x2="9" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="9" cy="5.5" r="1.2" fill={color} />
    </Svg>
  );
}

function faceIndexFor(word: string) {
  let h = 0;
  for (let i = 0; i < word.length; i++) h = (h * 31 + word.charCodeAt(i)) & 0xff;
  return h % 6;
}

function WordlineFace({
  expression,
  faceIndex,
  blink,
  color,
}: {
  expression: 'idle' | 'selected' | 'sad';
  faceIndex: number;
  blink: boolean;
  color: string;
}) {
  const eyeY = 18 + (faceIndex % 2);
  const mouth =
    expression === 'sad'
      ? 'M28 38 Q40 29 52 38'
      : expression === 'selected'
        ? 'M31 32 Q40 42 49 32 Q40 37 31 32'
        : faceIndex % 3 === 0
          ? 'M29 33 Q40 41 51 33'
          : faceIndex % 3 === 1
            ? 'M31 34 Q40 39 49 34'
            : 'M32 35 Q40 35 48 35';

  return (
    <Svg width="54" height="34" viewBox="0 0 80 50">
      {blink ? (
        <>
          <Line x1="22" y1={eyeY} x2="32" y2={eyeY} stroke={color} strokeWidth="4" strokeLinecap="round" />
          <Line x1="48" y1={eyeY} x2="58" y2={eyeY} stroke={color} strokeWidth="4" strokeLinecap="round" />
        </>
      ) : faceIndex === 4 ? (
        <>
          <Circle cx="26" cy={eyeY} r="5" fill={color} />
          <Path d={`M49 ${eyeY} Q54 ${eyeY + 5} 59 ${eyeY}`} stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <Circle cx="26" cy={eyeY} r={faceIndex === 2 ? 4 : 5} fill={color} />
          <Circle cx="54" cy={eyeY} r={faceIndex === 2 ? 4 : 5} fill={color} />
        </>
      )}
      <Path
        d={mouth}
        stroke={color}
        strokeWidth={expression === 'selected' ? 0 : 3.2}
        fill={expression === 'selected' ? color : 'none'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WordlineTile({
  word,
  selectedIndex,
  disabled,
  status,
  shuffleSignal,
  onPress,
  colors,
  styles,
}: {
  word: string;
  selectedIndex: number;
  disabled: boolean;
  status: GameStatus;
  shuffleSignal: number;
  onPress: () => void;
  colors: ColorTheme;
  styles: ReturnType<typeof makeStyles>;
}) {
  const faceIndex = faceIndexFor(word);
  const [blink, setBlink] = useState(false);
  const bob = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const shuffleKick = useRef(new Animated.Value(0)).current;
  const selected = selectedIndex >= 0;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -2, duration: 1200 + faceIndex * 90, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 2, duration: 1200 + faceIndex * 90, useNativeDriver: true }),
      ]),
    ).start();
  }, [bob, faceIndex]);

  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;
    function schedule() {
      timeout = setTimeout(() => {
        if (cancelled) return;
        setBlink(true);
        setTimeout(() => {
          if (!cancelled) setBlink(false);
          if (!cancelled) schedule();
        }, 120);
      }, 2200 + faceIndex * 310 + Math.random() * 1400);
    }
    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [faceIndex]);

  useEffect(() => {
    Animated.spring(pressScale, {
      toValue: selected ? 1.04 : 1,
      useNativeDriver: true,
      friction: 6,
      tension: 180,
    }).start();
  }, [pressScale, selected]);

  useEffect(() => {
    if (shuffleSignal === 0) return;
    shuffleKick.setValue(0);
    Animated.sequence([
      Animated.timing(shuffleKick, { toValue: 1, duration: 85, useNativeDriver: true }),
      Animated.spring(shuffleKick, { toValue: 0, useNativeDriver: true, friction: 5, tension: 140 }),
    ]).start();
  }, [shuffleKick, shuffleSignal]);

  const expression = status === 'lost' ? 'sad' : selected ? 'selected' : 'idle';
  const faceColor = selected ? colors.bgScreen : colors.text1;

  return (
    <Pressable disabled={disabled} onPress={onPress} style={styles.tilePressable}>
      <Animated.View
        style={[
          styles.tile,
          selected && styles.tileSelected,
          status === 'lost' && styles.tileLost,
          {
            transform: [
              { translateY: bob },
              {
                rotate: shuffleKick.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', faceIndex % 2 === 0 ? '3deg' : '-3deg'],
                }),
              },
              { scale: pressScale },
            ],
          },
        ]}
      >
        {selected && <Text style={styles.orderBadge}>{selectedIndex + 1}</Text>}
        <View style={styles.faceWrap}>
          <WordlineFace expression={expression} faceIndex={faceIndex} blink={blink} color={faceColor} />
        </View>
        <Text
          style={[styles.tileText, selected && styles.tileTextSelected]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {word}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function WordlinesGameScreen({ route, navigation }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const sound = useSound();

  const puzzle = useMemo(
    () => resolvePuzzle(route.params.mode, route.params.puzzleId),
    [route.params.mode, route.params.puzzleId],
  );
  const [boardWords, setBoardWords] = useState(() => shuffle(getWordTrailsBoard(puzzle)));
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [solvedTrails, setSolvedTrails] = useState<WordTrail[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [message, setMessage] = useState('Tap four words in trail order.');
  const [elapsed, setElapsed] = useState(0);
  const [helpVisible, setHelpVisible] = useState(false);
  const [shuffleSignal, setShuffleSignal] = useState(0);
  const startedAt = useRef(Date.now());
  const recorded = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (recorded.current || status === 'playing') return;
    recorded.current = true;
    const durationSeconds = Math.max(1, Math.floor((Date.now() - startedAt.current) / 1000));
    const completed = status === 'won';
    const score = completed ? Math.max(0, 1200 - mistakes * 100 - durationSeconds * 2) : undefined;
    void markWordTrailsCompleted(puzzle.id, {
      completed,
      mistakes,
      durationSeconds,
      solvedTrailLabels: solvedTrails.map(t => t.label),
    });
    recordPlaySession({
      puzzleId: puzzle.id,
      completed,
      mistakes,
      durationSeconds,
      solvedOrder: [],
      gameType: 'word_trails',
      gameMode: 'classic',
      score,
    }).catch(e => console.error('[WordlinesGameScreen] record session error:', e));
  }, [mistakes, puzzle.id, solvedTrails, status]);

  function toggleWord(word: string) {
    if (status !== 'playing') return;
    if (selectedWords.includes(word)) {
      sound.play('deselect');
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else if (selectedWords.length < 4) {
      sound.play('tap');
      setSelectedWords([...selectedWords, word]);
    }
  }

  function submitTrail() {
    if (status !== 'playing' || selectedWords.length !== 4) return;
    const exactTrail = puzzle.trails.find(trail =>
      trail.words.every((word, index) => selectedWords[index] === word),
    );
    if (exactTrail) {
      sound.playCorrect(solvedTrails.length === 0 ? 'yellow' : solvedTrails.length === 1 ? 'green' : solvedTrails.length === 2 ? 'blue' : 'purple');
      const solved = [...solvedTrails, exactTrail];
      setSolvedTrails(solved);
      setBoardWords(boardWords.filter(word => !exactTrail.words.includes(word)));
      setSelectedWords([]);
      setMessage(exactTrail.label);
      if (solved.length === 4) {
        sound.play('win');
        setStatus('won');
      }
      return;
    }

    const sameSetTrail = puzzle.trails.find(trail =>
      trail.words.every(word => selectedWords.includes(word)) &&
      selectedWords.every(word => trail.words.includes(word)),
    );
    const nextMistakes = mistakes + 1;
    sound.play('wrong');
    setMistakes(nextMistakes);
    setSelectedWords([]);
    setMessage(sameSetTrail ? 'Right words, wrong order.' : 'That trail does not connect.');
    if (nextMistakes >= MAX_MISTAKES) {
      sound.play('lose');
      setStatus('lost');
    }
  }

  function resetSelection() {
    setSelectedWords([]);
    setMessage('Tap four words in trail order.');
  }

  function handleShuffle() {
    if (status !== 'playing') return;
    setShuffleSignal(s => s + 1);
    setTimeout(() => setBoardWords(words => shuffle(words)), 110);
  }

  function handleBack() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home');
  }

  const remainingMistakes = Math.max(0, MAX_MISTAKES - mistakes);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={handleBack} hitSlop={12}>
            <BackIcon color={colors.text1} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.eyebrow}>Wordlines</Text>
            <Text style={styles.title}>{puzzle.title}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>Difficulty {puzzle.difficulty}</Text>
              <Text style={styles.meta}>{formatTime(elapsed)}</Text>
              <Text style={styles.meta}>{remainingMistakes} misses left</Text>
            </View>
          </View>

          <Pressable style={styles.iconBtn} onPress={() => setHelpVisible(true)} hitSlop={12}>
            <InfoIcon color={colors.text2} />
          </Pressable>
        </View>

        <View style={styles.solvedStack}>
          {solvedTrails.map((trail, index) => (
            <View key={trail.label} style={[styles.solvedTrail, { borderLeftColor: trailColors[index] }]}>
              <Text style={styles.solvedLabel}>{trail.label}</Text>
              <Text style={styles.solvedWords}>{trail.words.join(' -> ')}</Text>
            </View>
          ))}
        </View>

        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{status === 'won' ? 'All trails solved.' : status === 'lost' ? 'Trail closed.' : message}</Text>
        </View>

        {status === 'lost' && (
          <View style={styles.answers}>
            {puzzle.trails.filter(t => !solvedTrails.includes(t)).map(trail => (
              <Text key={trail.label} style={styles.answerLine}>{trail.words.join(' -> ')}</Text>
            ))}
          </View>
        )}

        <View style={styles.grid}>
          {boardWords.map(word => {
            const selectedIndex = selectedWords.indexOf(word);
            return (
              <WordlineTile
                key={word}
                word={word}
                selectedIndex={selectedIndex}
                disabled={status !== 'playing'}
                status={status}
                shuffleSignal={shuffleSignal}
                onPress={() => toggleWord(word)}
                colors={colors}
                styles={styles}
              />
            );
          })}
        </View>

        <MistakeDots mistakes={mistakes} />

        {status === 'playing' && (
          <View style={styles.actions}>
            <Pressable style={styles.secondaryBtn} onPress={handleShuffle}>
              <Text style={styles.secondaryBtnText}>Shuffle</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={resetSelection}>
              <Text style={styles.secondaryBtnText}>Clear</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, selectedWords.length !== 4 && styles.primaryBtnDisabled]}
              onPress={submitTrail}
            >
              <Text style={styles.primaryBtnText}>Submit Trail</Text>
            </Pressable>
          </View>
        )}

        {status !== 'playing' && (
          <View style={styles.endActions}>
            <Pressable style={styles.secondaryBtn} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.secondaryBtnText}>Home</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => navigation.replace('WordlinesGame', { mode: 'random' })}>
              <Text style={styles.primaryBtnText}>Random Next</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      <WordlinesHelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
    </SafeAreaView>
  );
}

const trailColors = ['#F5C842', '#3DBE8A', '#4AAEC8', '#9D6EC8'];

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: { padding: 18, paddingBottom: 28, gap: 16 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
    headerCenter: { flex: 1, alignItems: 'center', gap: 6 },
    iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    eyebrow: { fontSize: 12, fontFamily: FONTS.extraBold, color: c.blue, letterSpacing: 1.5, textTransform: 'uppercase' },
    title: { fontSize: 26, fontFamily: FONTS.extraBold, color: c.text1, textAlign: 'center' },
    metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
    meta: { fontSize: 12, fontFamily: FONTS.bold, color: c.text2, backgroundColor: c.bgBase, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
    solvedStack: { gap: 8, minHeight: 0 },
    solvedTrail: { backgroundColor: c.bgSurface, borderRadius: 8, padding: 10, borderLeftWidth: 5 },
    solvedLabel: { fontSize: 13, fontFamily: FONTS.extraBold, color: c.text1 },
    solvedWords: { fontSize: 12, fontFamily: FONTS.bold, color: c.text2, marginTop: 2 },
    messageBox: { backgroundColor: c.bgBase, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
    messageText: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2, textAlign: 'center' },
    answers: { backgroundColor: c.bgSurface, borderRadius: 8, padding: 12, gap: 6 },
    answerLine: { fontSize: 12, fontFamily: FONTS.bold, color: c.text2 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tilePressable: { width: '23.5%', aspectRatio: 1.02 },
    tile: {
      flex: 1,
      backgroundColor: c.tileDefault,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 13,
      paddingBottom: 10,
      paddingHorizontal: 6,
      position: 'relative',
      shadowColor: c.shadow,
      shadowOpacity: 0.14,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    tileSelected: { backgroundColor: c.blue, borderColor: c.blue },
    tileLost: { opacity: 0.88 },
    faceWrap: { height: 36, justifyContent: 'center', alignItems: 'center' },
    tileText: { fontSize: 12, fontFamily: FONTS.extraBold, color: c.text1, textAlign: 'center' },
    tileTextSelected: { color: c.bgScreen },
    orderBadge: {
      position: 'absolute',
      top: 4,
      left: 4,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: c.bgScreen,
      color: c.blue,
      textAlign: 'center',
      fontSize: 11,
      fontFamily: FONTS.extraBold,
      lineHeight: 18,
    },
    actions: { flexDirection: 'row', gap: 10 },
    endActions: { flexDirection: 'row', gap: 10 },
    secondaryBtn: { flex: 1, backgroundColor: c.bgBase, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
    secondaryBtnText: { fontSize: 14, fontFamily: FONTS.extraBold, color: c.text1 },
    primaryBtn: { flex: 2, backgroundColor: c.blue, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
    primaryBtnDisabled: { opacity: 0.45 },
    primaryBtnText: { fontSize: 14, fontFamily: FONTS.extraBold, color: c.bgScreen },
  });
}
