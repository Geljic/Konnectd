import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View, Text, Pressable, StyleSheet, useWindowDimensions, Modal } from 'react-native';
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
import { GameResultModal } from '@/components/GameResultModal';
import { TrailReveal } from '@/components/TrailReveal';
import { Confetti } from '@/components/Confetti';
import { STRIP_CONFIG, useSettingsStore, type TileStripStyle } from '@/store/settingsStore';
import type { AppStackParamList } from '../App';

type Props = NativeStackScreenProps<AppStackParamList, 'WordlinesGame'>;
type GameStatus = 'playing' | 'won' | 'lost';
type StepHint = 'same_path' | 'next_step' | 'path_label';

const MAX_STEP_HINTS = 3;
const HINT_PENALTY = 75;

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
    <Svg width="52" height="28" viewBox="0 0 80 50">
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
  shuffleDelay,
  onPress,
  colors,
  styles,
}: {
  word: string;
  selectedIndex: number;
  disabled: boolean;
  status: GameStatus;
  shuffleSignal: number;
  shuffleDelay: number;
  onPress: () => void;
  colors: ColorTheme;
  styles: ReturnType<typeof makeStyles>;
}) {
  const faceIndex = faceIndexFor(word);
  const [blink, setBlink] = useState(false);
  const bob = useRef(new Animated.Value(0)).current;
  const faceScale = useRef(new Animated.Value(1)).current;
  const shuffleKick = useRef(new Animated.Value(0)).current;
  const shuffleScale = useRef(new Animated.Value(1)).current;
  const shuffleRotate = useRef(new Animated.Value(0)).current;
  const stripCfg = useSettingsStore((s: { tileStripStyle: TileStripStyle }) => STRIP_CONFIG[s.tileStripStyle]);
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
    Animated.spring(faceScale, {
      toValue: selected ? 1.12 : 1,
      useNativeDriver: true,
      friction: 6,
      tension: 180,
    }).start();
  }, [faceScale, selected]);

  useEffect(() => {
    if (shuffleSignal === 0) return;
    shuffleKick.setValue(0);
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(shuffleKick, { toValue: 1, duration: 75, useNativeDriver: true }),
          Animated.spring(shuffleKick, { toValue: 0, useNativeDriver: true, friction: 5, tension: 140 }),
        ]),
        Animated.sequence([
          Animated.timing(shuffleScale, { toValue: 0.72, duration: 75, useNativeDriver: true }),
          Animated.spring(shuffleScale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 180 }),
        ]),
        Animated.sequence([
          Animated.timing(shuffleRotate, { toValue: faceIndex % 2 === 0 ? 8 : -8, duration: 75, useNativeDriver: true }),
          Animated.spring(shuffleRotate, { toValue: 0, useNativeDriver: true, friction: 8, tension: 180 }),
        ]),
      ]).start();
    }, shuffleDelay);
    return () => clearTimeout(timeout);
  }, [faceIndex, shuffleDelay, shuffleKick, shuffleRotate, shuffleScale, shuffleSignal]);

  const expression = status === 'lost' ? 'sad' : selected ? 'selected' : 'idle';
  const faceColor = colors.categoryText;

  return (
    <Pressable disabled={disabled} onPress={onPress} style={styles.tilePressable}>
      <Animated.View
        style={[
          styles.tile,
          selected && styles.tileSelected,
          status === 'lost' && styles.tileLost,
          {
            transform: [
              { scale: shuffleScale },
              {
                rotate: shuffleRotate.interpolate({
                  inputRange: [-8, 0, 8],
                  outputRange: ['-8deg', '0deg', '8deg'],
                }),
              },
            ],
          },
        ]}
      >
        <View style={[styles.faceStrip, { backgroundColor: colors.tileStrip, height: stripCfg.height }]}>
          <Animated.View
            style={{
              transform: [
                { translateY: bob },
                {
                  rotate: shuffleKick.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', faceIndex % 2 === 0 ? '7deg' : '-7deg'],
                  }),
                },
                { scale: faceScale },
              ],
            }}
          >
            <WordlineFace expression={expression} faceIndex={faceIndex} blink={blink} color={faceColor} />
          </Animated.View>
        </View>
        <View style={[styles.wordArea, selected && styles.wordAreaSelected]}>
          {selected && <Text style={styles.orderBadge}>{selectedIndex + 1}</Text>}
          <Text
            style={styles.tileText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {word.toUpperCase()}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function WordlinesGameScreen({ route, navigation }: Props) {
  const colors = useColors();
  const { height } = useWindowDimensions();
  const compact = height < 760;
  const styles = useMemo(() => makeStyles(colors, compact), [colors, compact]);
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
  const [message, setMessage] = useState('Tap four words in step order.');
  const [elapsed, setElapsed] = useState(0);
  const [helpVisible, setHelpVisible] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [resultVisible, setResultVisible] = useState(false);
  const [shuffleSignal, setShuffleSignal] = useState(0);
  const startedAt = useRef(Date.now());
  const recorded = useRef(false);

  useEffect(() => {
    if (status !== 'playing') return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (recorded.current || status === 'playing') return;
    recorded.current = true;
    const durationSeconds = Math.max(1, Math.floor((Date.now() - startedAt.current) / 1000));
    const completed = status === 'won';
    const score = completed ? Math.max(0, 1200 - mistakes * 100 - durationSeconds * 2 - hintsUsed * HINT_PENALTY) : undefined;
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
    if (status === 'won') {
      const timeout = setTimeout(() => setResultVisible(true), 700);
      return () => clearTimeout(timeout);
    }
  }, [hintsUsed, mistakes, puzzle.id, solvedTrails, status]);

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
      setMessage('Tap four words in step order.');
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
    setMessage(sameSetTrail ? 'Right words, wrong order.' : 'Those steps do not connect.');
    if (nextMistakes >= MAX_MISTAKES) {
      sound.play('lose');
      setBoardWords([]);
      setStatus('lost');
    }
  }

  function resetSelection() {
    setSelectedWords([]);
    setMessage('Tap four words in step order.');
  }

  function handleShuffle() {
    if (status !== 'playing') return;
    setShuffleSignal(s => s + 1);
    setTimeout(() => setBoardWords(words => shuffle(words)), 160);
  }

  function handleBack() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home');
  }

  function useStepHint(kind: StepHint) {
    if (status !== 'playing' || hintsUsed >= MAX_STEP_HINTS) return;
    const unsolved = puzzle.trails.filter(trail => !solvedTrails.includes(trail));
    if (unsolved.length === 0) return;
    let text = '';

    if (kind === 'same_path') {
      if (selectedWords.length === 0) {
        text = 'Select a word first, then this hint will count how many selected words share a path.';
      } else {
        const best = Math.max(...unsolved.map(trail => selectedWords.filter(word => trail.words.includes(word)).length));
        text = best === selectedWords.length
          ? `All ${selectedWords.length} selected word${selectedWords.length === 1 ? '' : 's'} share one path.`
          : `${best} of your selected words share one path.`;
      }
    } else if (kind === 'next_step') {
      const selectedTrail = unsolved.find(trail => selectedWords.some(word => trail.words.includes(word))) ?? unsolved[0];
      const anchor = selectedWords.find(word => selectedTrail.words.includes(word)) ?? selectedTrail.words[0];
      const anchorIndex = selectedTrail.words.indexOf(anchor);
      const next = selectedTrail.words[Math.min(anchorIndex + 1, selectedTrail.words.length - 1)];
      text = anchor === next
        ? `${anchor.toUpperCase()} is the final step in one path.`
        : `${next.toUpperCase()} comes after ${anchor.toUpperCase()} in one path.`;
    } else {
      const trail = unsolved[0];
      text = `One hidden path is: ${trail.label.toUpperCase()}.`;
    }

    setHintsUsed(count => count + 1);
    setHintText(text);
    setHintVisible(false);
  }

  const displayTrails = status === 'lost' ? puzzle.trails : solvedTrails;
  const rows: string[][] = [];
  for (let i = 0; i < boardWords.length; i += 4) {
    rows.push(boardWords.slice(i, i + 4));
  }
  while (rows.length < 4) rows.push([]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={handleBack} hitSlop={12}>
            <BackIcon color={colors.text1} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.eyebrow}>Next Steps</Text>
            <Text style={styles.title}>{puzzle.title}</Text>
            <Text style={styles.subtitle}>Difficulty {puzzle.difficulty}</Text>
          </View>

          <View style={styles.rightCluster}>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
            </View>
            <Pressable style={styles.iconBtn} onPress={() => setHelpVisible(true)} hitSlop={12}>
              <InfoIcon color={colors.text2} />
            </Pressable>
          </View>
        </View>

        {displayTrails.map((trail, index) => (
          <TrailReveal
            key={trail.label}
            label={trail.label}
            words={trail.words}
            color={trailColors[index]}
            revealed={status === 'lost'}
          />
        ))}

        {status !== 'won' && (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{status === 'lost' ? 'Path closed.' : message}</Text>
          </View>
        )}

        {status === 'playing' && (
          <View style={styles.board}>
            {rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.gridRow}>
                {row.map((word, colIndex) => {
                  const selectedIndex = selectedWords.indexOf(word);
                  return (
                    <WordlineTile
                      key={word}
                      word={word}
                      selectedIndex={selectedIndex}
                      disabled={status !== 'playing'}
                      status={status}
                      shuffleSignal={shuffleSignal}
                      shuffleDelay={(rowIndex * 4 + colIndex) * 12}
                      onPress={() => toggleWord(word)}
                      colors={colors}
                      styles={styles}
                    />
                  );
                })}
                {row.length < 4 && Array.from({ length: 4 - row.length }).map((_, fillerIndex) => (
                  <View key={`empty-${rowIndex}-${fillerIndex}`} style={styles.tilePressable} />
                ))}
              </View>
            ))}
          </View>
        )}

        {status !== 'playing' && <View style={{ flex: 1 }} />}

        <View style={styles.mistakesWrap}>
          <MistakeDots mistakes={mistakes} />

          {hintText && status === 'playing' && (
            <Pressable style={styles.hintBanner} onPress={() => setHintText(null)}>
              <Text style={styles.hintBannerText}>{hintText}</Text>
              <Text style={styles.hintBannerSub}>Tap to dismiss</Text>
            </Pressable>
          )}

          {status === 'playing' ? (
            <>
              <View style={styles.actions}>
                <Pressable style={styles.btnSecondary} onPress={handleShuffle} disabled={status !== 'playing'}>
                  <Text style={styles.btnSecondaryText}>Shuffle</Text>
                </Pressable>
                <Pressable style={styles.btnSecondary} onPress={resetSelection} disabled={status !== 'playing'}>
                  <Text style={styles.btnSecondaryText}>Deselect</Text>
                </Pressable>
                <Pressable
                  style={[styles.btnSubmit, selectedWords.length !== 4 && styles.btnSubmitDisabled]}
                  onPress={submitTrail}
                  disabled={status !== 'playing' || selectedWords.length !== 4}
                >
                  <Text style={styles.btnSubmitText}>Submit</Text>
                </Pressable>
              </View>
              <Pressable
                style={[styles.btnHint, hintsUsed >= MAX_STEP_HINTS && styles.btnHintDisabled]}
                onPress={() => setHintVisible(true)}
                disabled={hintsUsed >= MAX_STEP_HINTS}
              >
                <Text style={styles.btnHintText}>
                  {hintsUsed === 0
                    ? `💡 Hint (${MAX_STEP_HINTS} free)`
                    : `💡 Hint (${MAX_STEP_HINTS - hintsUsed} left · −${HINT_PENALTY} pts)`}
                </Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.actions}>
              <Pressable style={styles.btnSecondary} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.btnSecondaryText}>Home</Text>
              </Pressable>
              <Pressable style={styles.btnSubmit} onPress={() => navigation.replace('WordlinesGame', { mode: 'random' })}>
                <Text style={styles.btnSubmitText}>Random Next</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
      <Confetti active={status === 'won'} />
      <WordlinesHelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
      <Modal visible={hintVisible} transparent animationType="fade" onRequestClose={() => setHintVisible(false)}>
        <Pressable style={styles.hintOverlay} onPress={() => setHintVisible(false)}>
          <Pressable style={styles.hintSheet} onPress={e => e.stopPropagation()}>
            <View style={styles.hintHeader}>
              <Text style={styles.hintTitle}>Use a Hint</Text>
              <Text style={styles.hintSub}>
                {MAX_STEP_HINTS - hintsUsed} hint{MAX_STEP_HINTS - hintsUsed === 1 ? '' : 's'} remaining
                {hintsUsed > 0 ? ` · −${hintsUsed * HINT_PENALTY} pts so far` : ''}
              </Text>
            </View>
            <Pressable style={styles.hintOption} onPress={() => useStepHint('same_path')}>
              <Text style={styles.hintOptionEmoji}>🌡️</Text>
              <View style={styles.hintOptionText}>
                <Text style={styles.hintOptionTitle}>Warm / Cold</Text>
                <Text style={styles.hintOptionDesc}>Count how many selected words share a path.</Text>
              </View>
              <View style={styles.hintCostPill}>
                <Text style={styles.hintCostText}>−{HINT_PENALTY}</Text>
              </View>
            </Pressable>
            <Pressable style={styles.hintOption} onPress={() => useStepHint('next_step')}>
              <Text style={styles.hintOptionEmoji}>🔍</Text>
              <View style={styles.hintOptionText}>
                <Text style={styles.hintOptionTitle}>Next Step</Text>
                <Text style={styles.hintOptionDesc}>Reveal one word that follows a selected word.</Text>
              </View>
              <View style={styles.hintCostPill}>
                <Text style={styles.hintCostText}>−{HINT_PENALTY}</Text>
              </View>
            </Pressable>
            <Pressable style={styles.hintOption} onPress={() => useStepHint('path_label')}>
              <Text style={styles.hintOptionEmoji}>👁️</Text>
              <View style={styles.hintOptionText}>
                <Text style={styles.hintOptionTitle}>Path Peek</Text>
                <Text style={styles.hintOptionDesc}>Reveal one hidden path label.</Text>
              </View>
              <View style={styles.hintCostPill}>
                <Text style={styles.hintCostText}>−{HINT_PENALTY}</Text>
              </View>
            </Pressable>
            <Pressable style={styles.hintCancel} onPress={() => setHintVisible(false)}>
              <Text style={styles.hintCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <GameResultModal
        visible={resultVisible}
        label={`Next Steps · ${puzzle.title}`}
        preloadedResult={{
          durationSeconds: Math.max(1, Math.floor((Date.now() - startedAt.current) / 1000)),
          mistakes,
        }}
        score={status === 'won' ? Math.max(0, 1200 - mistakes * 100 - elapsed * 2 - hintsUsed * HINT_PENALTY) : null}
        gameMode="classic"
        onClose={() => {
          setResultVisible(false);
          navigation.navigate('Home');
        }}
        onViewBoard={() => setResultVisible(false)}
        onPlayAgain={() => {
          setResultVisible(false);
          navigation.replace('WordlinesGame', { mode: 'random' });
        }}
      />
    </SafeAreaView>
  );
}

const trailColors = ['#F5C842', '#3DBE8A', '#4AAEC8', '#9D6EC8'];

function makeStyles(c: ColorTheme, compact: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: {
      flex: 1,
      paddingHorizontal: compact ? 12 : 18,
      paddingTop: compact ? 4 : 8,
      paddingBottom: compact ? 8 : 12,
      gap: compact ? 7 : 10,
      minHeight: 0,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerCenter: { flex: 1, alignItems: 'center', gap: compact ? 3 : 5 },
    iconBtn: { width: compact ? 32 : 36, height: compact ? 32 : 36, alignItems: 'center', justifyContent: 'center' },
    eyebrow: { fontSize: compact ? 10 : 11, fontFamily: FONTS.extraBold, color: c.blue, letterSpacing: 1.5, textTransform: 'uppercase' },
    title: { fontSize: compact ? 22 : 26, fontFamily: FONTS.extraBold, color: c.text1, textAlign: 'center' },
    subtitle: { fontSize: compact ? 12 : 13, fontFamily: FONTS.bold, color: c.text2 },
    rightCluster: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    timerBadge: { alignItems: 'flex-end', minWidth: 36 },
    timerText: { fontSize: compact ? 11 : 13, fontFamily: FONTS.bold, color: c.text2 },
    messageBox: { backgroundColor: c.bgBase, borderRadius: 8, paddingVertical: compact ? 7 : 9, paddingHorizontal: 12, alignItems: 'center' },
    messageText: { fontSize: compact ? 12 : 14, fontFamily: FONTS.bold, color: c.text2, textAlign: 'center' },
    hintBanner: {
      backgroundColor: c.bgSurface,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: c.blue,
      paddingHorizontal: 12,
      paddingVertical: compact ? 7 : 9,
      alignItems: 'center',
      gap: 2,
    },
    hintBannerText: { fontSize: compact ? 12 : 13, fontFamily: FONTS.extraBold, color: c.text1, textAlign: 'center' },
    hintBannerSub: { fontSize: 10, fontFamily: FONTS.bold, color: c.text3 },
    board: {
      flex: 1,
      minHeight: 0,
      backgroundColor: c.bgBase,
      borderRadius: 16,
      paddingHorizontal: compact ? 5 : 8,
      paddingVertical: compact ? 5 : 6,
      overflow: 'visible',
    },
    gridRow: { flex: 1, flexDirection: 'row', overflow: 'visible' },
    tilePressable: { flex: 1, margin: compact ? 3 : 4, overflow: 'visible' },
    tile: {
      flex: 1,
      backgroundColor: c.tileStrip,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'transparent',
      overflow: 'hidden',
      position: 'relative',
      shadowColor: c.shadow,
      shadowOpacity: 1,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 3 },
    },
    tileSelected: { borderColor: c.tileStrip },
    tileLost: { opacity: 0.88 },
    faceStrip: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: compact ? 24 : 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      zIndex: 1,
    },
    wordArea: {
      flex: 1,
      backgroundColor: c.tileDefault,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
      paddingVertical: 6,
    },
    wordAreaSelected: { backgroundColor: c.tileSelected },
    tileText: { fontSize: 13, fontFamily: FONTS.extraBold, color: c.text1, textAlign: 'center', letterSpacing: 0.8 },
    orderBadge: {
      position: 'absolute',
      top: compact ? 5 : 7,
      left: compact ? 5 : 7,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: c.tileStrip,
      textAlign: 'center',
      fontSize: 11,
      fontFamily: FONTS.extraBold,
      lineHeight: 18,
      color: c.categoryText,
    },
    mistakesWrap: { marginTop: compact ? -1 : 0, gap: compact ? 7 : 10, zIndex: 10, elevation: 10 },
    actions: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
    btnSecondary: {
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 24,
      paddingHorizontal: compact ? 14 : 18,
      paddingVertical: compact ? 8 : 10,
    },
    btnSecondaryText: { fontSize: compact ? 12 : 14, fontFamily: FONTS.bold, color: c.text1 },
    btnSubmit: {
      backgroundColor: c.actionBg,
      borderRadius: 24,
      paddingHorizontal: compact ? 18 : 24,
      paddingVertical: compact ? 8 : 10,
    },
    btnSubmitDisabled: { backgroundColor: c.text3 },
    btnSubmitText: { fontSize: compact ? 12 : 14, fontFamily: FONTS.extraBold, color: c.actionText },
    btnHint: {
      alignSelf: 'center',
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: compact ? 7 : 8,
    },
    btnHintDisabled: { opacity: 0.45 },
    btnHintText: { fontSize: compact ? 11 : 13, fontFamily: FONTS.bold, color: c.text2 },
    hintOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    hintSheet: {
      backgroundColor: c.bgSurface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      gap: 10,
    },
    hintHeader: { alignItems: 'center', paddingBottom: 6 },
    hintTitle: { fontSize: 20, fontFamily: FONTS.extraBold, color: c.text1 },
    hintSub: { fontSize: 13, fontFamily: FONTS.bold, color: c.text3, marginTop: 2 },
    hintOption: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: c.bgBase, borderRadius: 12, padding: 14,
    },
    hintOptionEmoji: { fontSize: 24, width: 32, textAlign: 'center' },
    hintOptionText: { flex: 1, gap: 2 },
    hintOptionTitle: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.text1 },
    hintOptionDesc: { fontSize: 12, fontFamily: FONTS.bold, color: c.text3 },
    hintCostPill: {
      backgroundColor: c.errorFlash + '22',
      borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    },
    hintCostText: { fontSize: 13, fontFamily: FONTS.extraBold, color: c.errorFlash },
    hintCancel: { alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: c.border, marginTop: 4 },
    hintCancelText: { fontSize: 15, fontFamily: FONTS.bold, color: c.text2 },
  });
}
