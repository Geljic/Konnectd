import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated as RNAnimated, PanResponder, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { useSound } from '@/hooks/useSound';
import { useChallengeFinish } from '@/hooks/useChallengeFinish';
import { AdBanner } from '@/components/BannerAd';
import { Confetti } from '@/components/Confetti';
import { ShuffleIcon, ScanIcon, CheckIcon } from '@/components/GameIcons';
import { CrossedSignalsHelpModal } from '@/components/CrossedSignalsHelpModal';
import { CrossedSignalsResultModal } from '@/components/CrossedSignalsResultModal';
import type { AppStackParamList } from '../App';
import {
  calculateCrossedSignalsScore,
  countCorrect,
  createInitialBoard,
  getSolvedBoard,
  getCrossedSignalsPuzzles,
  getDailyCrossedSignalsPuzzle,
  getRandomCrossedSignalsPuzzle,
  getScanFeedback,
  isSolved,
  markCrossedSignalsCompleted,
  type ScanFeedback,
} from '@/utils/crossedSignals';
import type { CrossedSignalsPuzzle } from '@/data/crossedSignalsPuzzles';

type Props = NativeStackScreenProps<AppStackParamList, 'CrossedSignalsGame'>;
type GameStatus = 'playing' | 'won' | 'lost';
type CellSize = { width: number; height: number };
type SignalLine = 'row' | 'column';

const MAX_NOISE = 4;
const MAX_SCANS = 3;

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

function pickPuzzle(mode: Props['route']['params']['mode'], puzzleId?: string): CrossedSignalsPuzzle {
  const puzzles = getCrossedSignalsPuzzles();
  if (mode === 'freeplay' && puzzleId) {
    return puzzles.find(p => p.id === puzzleId) ?? puzzles[0];
  }
  if (mode === 'random') return getRandomCrossedSignalsPuzzle(puzzles);
  return getDailyCrossedSignalsPuzzle(puzzles);
}

function tileFontSize(word: string) {
  return word.length >= 10 ? 10 : word.length >= 8 ? 11 : word.length >= 7 ? 12 : 13;
}

function difficultyLabel(level: CrossedSignalsPuzzle['difficulty']) {
  return ['Easy', 'Easy', 'Medium', 'Hard', 'Expert', 'Master'][level] ?? 'Medium';
}

const SCAN_LABELS: Record<ScanFeedback, string> = {
  locked: 'Correct',
  row: 'Row',
  column: 'Column',
  static: 'Static',
};

function getScanNote(word: string, feedback: ScanFeedback) {
  if (feedback === 'locked') return `${word} is correct here.`;
  if (feedback === 'row') return `${word} belongs in this row, but a different column.`;
  if (feedback === 'column') return `${word} belongs in this column, but a different row.`;
  return `${word} belongs somewhere else.`;
}

function getLineColour(c: ColorTheme, index: number) {
  return [c.yellow, c.green, c.blue, c.purple][index % 4];
}

function getLineName(type: SignalLine, index: number) {
  return `${type === 'row' ? 'Row' : 'Column'} ${index + 1}`;
}

function isSolvedLine(index: number, solvedRows: Set<number>, solvedColumns: Set<number>) {
  return solvedRows.has(Math.floor(index / 4)) || solvedColumns.has(index % 4);
}

function shuffleMovableTiles(board: string[], lockedTiles: Set<number>, solvedRows: Set<number>, solvedColumns: Set<number>) {
  const next = [...board];
  const unlockedIndices = next
    .map((_, index) => index)
    .filter(index => !lockedTiles.has(index) && !isSolvedLine(index, solvedRows, solvedColumns));
  const unlockedWords = unlockedIndices.map(index => next[index]);

  for (let i = unlockedWords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unlockedWords[i], unlockedWords[j]] = [unlockedWords[j], unlockedWords[i]];
  }

  unlockedIndices.forEach((index, wordIndex) => {
    next[index] = unlockedWords[wordIndex];
  });
  return next;
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

interface SignalTileProps {
  word: string;
  index: number;
  selected: boolean;
  moved: boolean;
  tileLocked: boolean;
  lineState?: 'ready' | 'solved';
  lineColour?: string;
  rowTrace?: string | null;
  columnTrace?: string | null;
  disabled: boolean;
  feedback?: ScanFeedback;
  styles: ReturnType<typeof makeStyles>;
  onPress: (index: number) => void;
  onLongPress: (index: number) => void;
  onDrop: (index: number, dx: number, dy: number) => void;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  onLayout: (size: CellSize) => void;
  revealState?: 'correct' | 'incorrect';
}

function SignalTile({
  word,
  index,
  selected,
  moved,
  tileLocked,
  lineState,
  lineColour,
  rowTrace,
  columnTrace,
  disabled,
  feedback,
  styles,
  onPress,
  onLongPress,
  onDrop,
  onDragStart,
  onDragEnd,
  onLayout,
  revealState,
}: SignalTileProps) {
  const drag = useRef(new RNAnimated.ValueXY()).current;
  const lift = useRef(new RNAnimated.Value(1)).current;
  const [dragging, setDragging] = useState(false);
  const webDragStyle = Platform.OS === 'web'
    ? ({
      cursor: tileLocked || lineState === 'solved' ? 'not-allowed' : 'pointer',
      touchAction: 'none',
      userSelect: 'none',
    } as any)
    : null;

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => {
      if (Platform.OS === 'web' || disabled || tileLocked || lineState === 'solved') return false;
      return Math.abs(gesture.dx) > 7 || Math.abs(gesture.dy) > 7;
    },
    onMoveShouldSetPanResponderCapture: (_, gesture) => {
      if (Platform.OS === 'web' || disabled || tileLocked || lineState === 'solved') return false;
      return Math.abs(gesture.dx) > 7 || Math.abs(gesture.dy) > 7;
    },
    onPanResponderGrant: () => {
      setDragging(true);
      onDragStart(index);
      RNAnimated.spring(lift, {
        toValue: 1.06,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderMove: RNAnimated.event([null, { dx: drag.x, dy: drag.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, gesture) => {
      setDragging(false);
      onDragEnd();
      RNAnimated.parallel([
        RNAnimated.spring(drag, {
          toValue: { x: 0, y: 0 },
          friction: 7,
          tension: 120,
          useNativeDriver: false,
        }),
        RNAnimated.spring(lift, {
          toValue: 1,
          friction: 7,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
      onDrop(index, gesture.dx, gesture.dy);
    },
    onPanResponderTerminate: () => {
      setDragging(false);
      onDragEnd();
      RNAnimated.parallel([
        RNAnimated.spring(drag, {
          toValue: { x: 0, y: 0 },
          friction: 7,
          tension: 120,
          useNativeDriver: false,
        }),
        RNAnimated.spring(lift, {
          toValue: 1,
          friction: 7,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    },
  }), [disabled, drag, index, lift, lineState, onDragEnd, onDragStart, onDrop, tileLocked]);

  return (
    <RNAnimated.View
      {...panResponder.panHandlers}
      onLayout={event => onLayout(event.nativeEvent.layout)}
      style={[
        styles.tile,
        selected && styles.tileSelected,
        moved && styles.tileMoved,
        feedback && styles.tileScanned,
        feedback === 'locked' && styles.tileScanLocked,
        lineState && styles.tileLineMarked,
        lineState && lineColour ? { borderColor: lineColour, backgroundColor: lineState === 'solved' ? lineColour + '22' : lineColour + '12' } : null,
        tileLocked && styles.tileLocked,
        revealState === 'correct' && styles.tileResultCorrect,
        revealState === 'incorrect' && styles.tileResultIncorrect,
        dragging && styles.tileDragging,
        webDragStyle,
        {
          transform: [
            { translateX: drag.x },
            { translateY: drag.y },
            { scale: lift },
          ],
        },
      ]}
    >
      {rowTrace && <View pointerEvents="none" style={[styles.traceH, { backgroundColor: rowTrace, shadowColor: rowTrace }]} />}
      {columnTrace && <View pointerEvents="none" style={[styles.traceV, { backgroundColor: columnTrace, shadowColor: columnTrace }]} />}
      <Pressable
        style={styles.tilePress}
        onPress={() => onPress(index)}
        onLongPress={() => onLongPress(index)}
        delayLongPress={260}
        disabled={disabled}
      >
        {feedback && (
          <Text style={styles.scanPill}>{SCAN_LABELS[feedback]}</Text>
        )}
        {moved && <View style={styles.movedDot} />}
        {lineState === 'solved' && <Text style={[styles.lockPill, lineColour ? { backgroundColor: lineColour } : null]}>Solved</Text>}
        {tileLocked && <Text style={styles.tileLockPill}>Locked</Text>}
        <Text style={[styles.tileText, { fontSize: tileFontSize(word) }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} selectable={false}>
          {word}
        </Text>
      </Pressable>
    </RNAnimated.View>
  );
}

export function CrossedSignalsGameScreen({ navigation, route }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const sound = useSound();
  const puzzle = useMemo(
    () => pickPuzzle(route.params.mode, route.params.puzzleId),
    [route.params.mode, route.params.puzzleId],
  );

  const [board, setBoard] = useState(() => createInitialBoard(puzzle));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [noise, setNoise] = useState(0);
  const [scansUsed, setScansUsed] = useState(0);
  const [scanFeedback, setScanFeedback] = useState<Record<number, ScanFeedback>>({});
  const [scanArmed, setScanArmed] = useState(false);
  const [lastScanNote, setLastScanNote] = useState<string | null>(null);
  const [lastCorrectCount, setLastCorrectCount] = useState<number | null>(null);
  const [movedWords, setMovedWords] = useState<Set<string>>(() => new Set());
  const [lockedTiles, setLockedTiles] = useState<Set<number>>(() => new Set());
  const [readyRows, setReadyRows] = useState<Set<number>>(() => new Set());
  const [readyColumns, setReadyColumns] = useState<Set<number>>(() => new Set());
  const [solvedRows, setSolvedRows] = useState<Set<number>>(() => new Set());
  const [solvedColumns, setSolvedColumns] = useState<Set<number>>(() => new Set());
  const [cellSize, setCellSize] = useState<CellSize | null>(null);
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [startTime] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const { isChallenge, finishChallenge } = useChallengeFinish({
    challengeId: route.params.challengeId,
    recipientId: route.params.recipientId,
    recipientName: route.params.recipientName,
  });

  useEffect(() => {
    if (status !== 'playing') return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime, status]);

  function markMoved(firstWord: string, secondWord: string) {
    setMovedWords(current => {
      const next = new Set(current);
      next.add(firstWord);
      next.add(secondWord);
      return next;
    });
  }

  function swapCells(first: number, second: number) {
    if (first === second) return false;
    if (lockedTiles.has(first) || lockedTiles.has(second)) {
      Alert.alert('Locked tile', 'Unlock a tile before moving it.');
      return false;
    }
    if (isSolvedLine(first, solvedRows, solvedColumns) || isSolvedLine(second, solvedRows, solvedColumns)) {
      Alert.alert('Solved line', 'Solved rows and columns stay fixed.');
      return false;
    }
    sound.play('tap');
    markMoved(board[first], board[second]);
    setBoard(current => {
      const next = [...current];
      [next[first], next[second]] = [next[second], next[first]];
      return next;
    });
    setScanFeedback({});
    setScanArmed(false);
    setLastScanNote(null);
    setLastCorrectCount(null);
    clearReadyLinesForCells([first, second]);
    return true;
  }

  function clearReadyLinesForCells(indices: number[]) {
    const rows = new Set(indices.map(index => Math.floor(index / 4)));
    const columns = new Set(indices.map(index => index % 4));
    setReadyRows(current => new Set([...current].filter(row => !rows.has(row))));
    setReadyColumns(current => new Set([...current].filter(column => !columns.has(column))));
  }

  function getDragTarget(index: number, dx: number, dy: number) {
    if (!cellSize) return null;
    const strideX = cellSize.width + 6;
    const strideY = cellSize.height + 6;
    const thresholdX = cellSize.width * 0.38;
    const thresholdY = cellSize.height * 0.38;
    if (Math.abs(dx) < thresholdX && Math.abs(dy) < thresholdY) return null;

    const row = Math.floor(index / 4);
    const col = index % 4;
    const nextRow = Math.max(0, Math.min(3, row + Math.round(dy / strideY)));
    const nextCol = Math.max(0, Math.min(3, col + Math.round(dx / strideX)));
    const target = nextRow * 4 + nextCol;
    return target === index ? null : target;
  }

  function handleCellPress(index: number) {
    if (status !== 'playing') return;
    if (scanArmed) {
      performScan(index);
      return;
    }
    if (selectedIndex === null) {
      setSelectedIndex(index);
      return;
    }
    if (selectedIndex === index) {
      setSelectedIndex(null);
      return;
    }
    swapCells(selectedIndex, index);
    setSelectedIndex(null);
  }

  function handleCellLongPress(index: number) {
    if (status !== 'playing') return;
    if (isSolvedLine(index, solvedRows, solvedColumns)) return;
    const willLock = !lockedTiles.has(index);
    setLockedTiles(current => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
    setSelectedIndex(null);
    setScanArmed(false);
    setLastScanNote(`${board[index]} ${willLock ? 'locked' : 'unlocked'}.`);
  }

  function toggleReadyLine(type: SignalLine, index: number) {
    if (status !== 'playing') return;
    const solved = type === 'row' ? solvedRows.has(index) : solvedColumns.has(index);
    if (solved) {
      setLastScanNote(`${getLineName(type, index)} is already solved.`);
      return;
    }
    const ready = type === 'row' ? readyRows.has(index) : readyColumns.has(index);
    const setter = type === 'row' ? setReadyRows : setReadyColumns;
    setter(current => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
    setSelectedIndex(null);
    setScanArmed(false);
    setLastScanNote(`${getLineName(type, index)} ${ready ? 'cleared' : 'ready to submit'}.`);
  }

  function handleDrop(index: number, dx: number, dy: number) {
    if (status !== 'playing') return;
    const target = getDragTarget(index, dx, dy);
    if (target === null) return;
    swapCells(index, target);
    setSelectedIndex(null);
  }

  function handleTileLayout(size: CellSize) {
    if (size.width <= 0 || size.height <= 0) return;
    setCellSize(current => {
      if (current && Math.abs(current.width - size.width) < 1 && Math.abs(current.height - size.height) < 1) {
        return current;
      }
      return size;
    });
  }

  function performScan(index: number) {
    if (status !== 'playing') return;
    if (scansUsed >= MAX_SCANS) {
      Alert.alert('No scans left', 'You have used all 3 scans for this puzzle.');
      return;
    }
    const feedback = getScanFeedback(puzzle, board, index);
    sound.play('tap');
    setScanFeedback(current => ({ ...current, [index]: feedback }));
    setScansUsed(current => current + 1);
    setSelectedIndex(index);
    setScanArmed(false);
    setLastScanNote(getScanNote(board[index], feedback));
  }

  async function finish(nextStatus: GameStatus, nextNoise: number) {
    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
    const nextScore = calculateCrossedSignalsScore({
      completed: nextStatus === 'won',
      noise: nextNoise,
      scansUsed,
      durationSeconds,
    });
    setElapsed(durationSeconds);
    setScore(nextScore);
    setStatus(nextStatus);
    sound.play(nextStatus === 'won' ? 'win' : 'lose');
    if (isChallenge) {
      setTimeout(() => {
        void finishChallenge({
          gameType: 'crossed_signals',
          gameMode: 'classic',
          puzzleId: puzzle.id,
          puzzleLabel: `Crossed Signals · ${puzzle.title}`,
          mistakes: nextNoise,
          durationSeconds,
          solvedOrder: [],
          score: nextScore,
        });
      }, nextStatus === 'won' ? 800 : 500);
    } else {
      setTimeout(() => setResultVisible(true), nextStatus === 'won' ? 800 : 500);
    }
    await markCrossedSignalsCompleted(puzzle.id, {
      completed: nextStatus === 'won',
      noise: nextNoise,
      scansUsed,
      durationSeconds,
      score: nextScore,
    });
  }

  async function handleSubmit() {
    if (status !== 'playing') return;
    if (readyRows.size > 0 || readyColumns.size > 0) {
      await submitReadyLines();
      return;
    }
    if (isSolved(puzzle, board)) {
      await finish('won', noise);
      return;
    }
    const nextNoise = noise + 1;
    setNoise(nextNoise);
    const correct = countCorrect(puzzle, board);
    setLastCorrectCount(correct);
    if (nextNoise >= MAX_NOISE) {
      await finish('lost', nextNoise);
      Alert.alert('Signal lost', `You placed ${correct}/16 words correctly.`);
    } else {
      sound.play('wrong');
      Alert.alert('Static', `${correct}/16 signals are locked in. Noise increased.`);
    }
  }

  async function submitReadyLines() {
    const solved = getSolvedBoard(puzzle);
    const correctRows: number[] = [];
    const wrongRows: { index: number; count: number }[] = [];
    const correctColumns: number[] = [];
    const wrongColumns: { index: number; count: number }[] = [];

    readyRows.forEach(row => {
      const indices = Array.from({ length: 4 }, (_, column) => row * 4 + column);
      const count = indices.filter(index => board[index] === solved[index]).length;
      if (count === 4) correctRows.push(row);
      else wrongRows.push({ index: row, count });
    });

    readyColumns.forEach(column => {
      const indices = Array.from({ length: 4 }, (_, row) => row * 4 + column);
      const count = indices.filter(index => board[index] === solved[index]).length;
      if (count === 4) correctColumns.push(column);
      else wrongColumns.push({ index: column, count });
    });

    if (correctRows.length > 0) {
      setSolvedRows(current => new Set([...current, ...correctRows]));
    }
    if (correctColumns.length > 0) {
      setSolvedColumns(current => new Set([...current, ...correctColumns]));
    }

    setReadyRows(current => new Set([...current].filter(row => !correctRows.includes(row))));
    setReadyColumns(current => new Set([...current].filter(column => !correctColumns.includes(column))));

    const wrongCount = wrongRows.length + wrongColumns.length;
    const correctCount = correctRows.length + correctColumns.length;
    if (correctCount > 0) {
      const firstSolved = correctRows[0] ?? correctColumns[0] ?? 0;
      sound.playCorrect(['yellow', 'green', 'blue', 'purple'][firstSolved % 4]);
    }
    if (wrongCount === 0) {
      setLastScanNote(`${correctCount} signal${correctCount !== 1 ? 's' : ''} solved.`);
      setLastCorrectCount(null);
      if (isSolved(puzzle, board)) await finish('won', noise);
      return;
    }

    const nextNoise = noise + 1;
    setNoise(nextNoise);
    if (nextNoise < MAX_NOISE) sound.play('wrong');
    const wrongParts = [
      ...wrongRows.map(row => `${getLineName('row', row.index)} ${row.count}/4`),
      ...wrongColumns.map(column => `${getLineName('column', column.index)} ${column.count}/4`),
    ];
    setLastScanNote(`${wrongParts.join(' · ')}. ${wrongParts.some(part => part.includes('3/4')) ? 'Very close.' : 'Not yet.'}`);
    setLastCorrectCount(countCorrect(puzzle, board));
    if (nextNoise >= MAX_NOISE) {
      await finish('lost', nextNoise);
      Alert.alert('Signal lost', `You placed ${countCorrect(puzzle, board)}/16 words correctly.`);
    }
  }

  function handleScan() {
    if (status !== 'playing') return;
    if (scansUsed >= MAX_SCANS) {
      Alert.alert('No scans left', 'You have used all 3 scans for this puzzle.');
      return;
    }
    if (selectedIndex !== null) {
      performScan(selectedIndex);
      return;
    }
    setScanArmed(true);
    setLastScanNote('Tap any tile to scan whether it fits this row or column.');
  }

  function handleShuffle() {
    if (status !== 'playing') return;
    sound.play('tap');
    setBoard(current => shuffleMovableTiles(current, lockedTiles, solvedRows, solvedColumns));
    setSelectedIndex(null);
    setScanFeedback({});
    setScanArmed(false);
    setReadyRows(new Set());
    setReadyColumns(new Set());
    setLastScanNote(null);
    setLastCorrectCount(null);
  }

  function handleShare() {
    const result = status === 'won' ? 'decoded' : 'lost signal';
    Share.share({
      message: `Konnectd: Crossed Signals\n${puzzle.title}\n${result} in ${formatTime(elapsed)} · ${noise} Noise · ${scansUsed} Scans${score != null ? ` · ${score} pts` : ''}`,
    }).catch(() => {});
  }

  const scansLeft = Math.max(0, MAX_SCANS - scansUsed);
  const solvedBoard = status !== 'playing' ? getSolvedBoard(puzzle) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.leftCluster}>
            <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()} hitSlop={12}>
              <BackIcon color={colors.text1} />
            </Pressable>
            <Text style={styles.modeLabel}>Crossed Signals</Text>
          </View>

          <View style={styles.headerCenter}>
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{puzzle.title}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{difficultyLabel(puzzle.difficulty)}</Text>
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

        <View style={[styles.guidanceBar, scanArmed && styles.guidanceBarActive]}>
          <Text style={styles.guidanceText}>{lastScanNote ?? 'Place each word where two signals cross.'}</Text>
          <Text style={styles.guidanceText}>
            {lastCorrectCount !== null
              ? `${lastCorrectCount}/16 correct after your last submit.`
              : 'Tap a row or column clue to mark it Ready.'}
          </Text>
        </View>

        <View style={styles.boardShell}>
          <View style={styles.columnRow}>
            <View style={styles.corner} />
            {puzzle.columns.map((column, columnIndex) => {
              const lineColour = getLineColour(colors, columnIndex);
              const ready = status === 'playing' && readyColumns.has(columnIndex);
              const solved = solvedColumns.has(columnIndex);
              return (
                <Pressable
                  key={column.id}
                  style={[
                    styles.columnLabel,
                    (ready || solved) && styles.lineLabelMarked,
                    ready && { borderColor: lineColour, backgroundColor: lineColour + '18' },
                    solved && { backgroundColor: lineColour, borderColor: lineColour },
                  ]}
                  onPress={() => toggleReadyLine('column', columnIndex)}
                  disabled={status !== 'playing'}
                >
                  <Text style={[styles.lineLabelText, solved && styles.lineLabelTextSolved]} numberOfLines={2}>{column.label}</Text>
                  {(ready || solved) && (
                    <View style={[styles.stateChip, solved ? { backgroundColor: lineColour } : { backgroundColor: lineColour + '30' }]}>
                      <Text style={[styles.stateChipText, solved ? styles.stateChipTextSolved : { color: lineColour }]}>{solved ? 'SOLVED' : 'READY'}</Text>
                    </View>
                  )}
                  <View style={styles.railNotchColumn} />
                </Pressable>
              );
            })}
          </View>

          {puzzle.rows.map((row, rowIndex) => (
            <View
              key={row.id}
              style={[
                styles.gridRow,
                activeDragIndex !== null && Math.floor(activeDragIndex / 4) === rowIndex && styles.gridRowDragging,
              ]}
            >
              {(() => {
                const lineColour = getLineColour(colors, rowIndex);
                const ready = status === 'playing' && readyRows.has(rowIndex);
                const solved = solvedRows.has(rowIndex);
                return (
                  <Pressable
                    style={[
                      styles.rowLabel,
                      (ready || solved) && styles.lineLabelMarked,
                      ready && { borderColor: lineColour, backgroundColor: lineColour + '18' },
                      solved && { backgroundColor: lineColour, borderColor: lineColour },
                    ]}
                    onPress={() => toggleReadyLine('row', rowIndex)}
                    disabled={status !== 'playing'}
                  >
                    <View style={styles.railNotchRow} />
                    <Text style={[styles.lineLabelText, solved && styles.lineLabelTextSolved]} numberOfLines={2}>{row.label}</Text>
                    {(ready || solved) && (
                      <View style={[styles.stateChip, solved ? { backgroundColor: lineColour } : { backgroundColor: lineColour + '30' }]}>
                        <Text style={[styles.stateChipText, solved ? styles.stateChipTextSolved : { color: lineColour }]}>{solved ? 'SOLVED' : 'READY'}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })()}
              {puzzle.columns.map((column, columnIndex) => {
                const index = rowIndex * 4 + columnIndex;
                const feedback = scanFeedback[index];
                const selected = selectedIndex === index;
                const rowSolved = solvedRows.has(rowIndex);
                const columnSolved = solvedColumns.has(columnIndex);
                const rowReady = readyRows.has(rowIndex);
                const columnReady = readyColumns.has(columnIndex);
                const lineState = rowSolved || columnSolved ? 'solved' : rowReady || columnReady ? 'ready' : undefined;
                const lineColour = rowSolved || rowReady
                  ? getLineColour(colors, rowIndex)
                  : columnSolved || columnReady
                    ? getLineColour(colors, columnIndex)
                    : undefined;
                const revealState = solvedBoard
                  ? solvedBoard[index] === board[index] ? 'correct' : 'incorrect'
                  : undefined;
                const rowTrace = status === 'playing'
                  ? (rowReady || rowSolved ? getLineColour(colors, rowIndex) : feedback ? colors.blue : null)
                  : null;
                const columnTrace = status === 'playing'
                  ? (columnReady || columnSolved ? getLineColour(colors, columnIndex) : feedback ? colors.blue : null)
                  : null;
                return (
                  <SignalTile
                    key={`${row.id}-${column.id}`}
                    word={board[index]}
                    index={index}
                    selected={selected}
                    moved={status === 'playing' && movedWords.has(board[index])}
                    tileLocked={status === 'playing' && lineState !== 'solved' && lockedTiles.has(index)}
                    lineState={status === 'playing' ? lineState : undefined}
                    lineColour={lineColour}
                    rowTrace={rowTrace}
                    columnTrace={columnTrace}
                    disabled={status !== 'playing'}
                    feedback={status === 'playing' ? feedback : undefined}
                    styles={styles}
                    onPress={handleCellPress}
                    onLongPress={handleCellLongPress}
                    onDrop={handleDrop}
                    onDragStart={setActiveDragIndex}
                    onDragEnd={() => setActiveDragIndex(null)}
                    onLayout={handleTileLayout}
                    revealState={revealState}
                  />
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.noiseBlock}>
          <Text style={styles.noiseLabel}>Noise</Text>
          <View style={styles.noiseRow}>
            {Array.from({ length: MAX_NOISE }).map((_, index) => (
              <Text key={index} style={[styles.noiseMark, index < noise && styles.noiseMarkActive]}>×</Text>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          {status === 'playing' ? (
            <>
              <Pressable style={styles.secondaryBtn} onPress={handleShuffle}>
                <ShuffleIcon color={colors.text1} />
                <Text style={styles.secondaryBtnText}>Shuffle</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={handleScan}>
                <ScanIcon color={scanArmed ? colors.blue : colors.text1} />
                <Text style={[styles.secondaryBtnText, scanArmed && { color: colors.blue }]}>{scanArmed ? 'Tap tile' : `Scan (${scansLeft})`}</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={handleSubmit}>
                <CheckIcon color="#162219" />
                <Text style={styles.primaryBtnText}>Submit</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={styles.secondaryBtn} onPress={() => setResultVisible(true)}>
                <Text style={styles.secondaryBtnText}>Results</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={() => navigation.replace('CrossedSignalsGame', route.params)}>
                <Text style={styles.primaryBtnText}>Play Again</Text>
              </Pressable>
            </>
          )}
        </View>
        <AdBanner />
      </View>

      <Confetti active={status === 'won'} />
      <CrossedSignalsHelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
      {status !== 'playing' && (
        <CrossedSignalsResultModal
          visible={resultVisible}
          status={status}
          puzzle={puzzle}
          board={board}
          noise={noise}
          scansUsed={scansUsed}
          durationSeconds={elapsed}
          score={score}
          onClose={() => setResultVisible(false)}
          onShare={handleShare}
          onPlayAgain={() => {
            setResultVisible(false);
            navigation.replace('CrossedSignalsGame', route.params);
          }}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: { flex: 1, padding: 16, gap: 12 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, position: 'relative', minHeight: 48 },
    leftCluster: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 1 },
    modeLabel: { fontSize: 10, fontFamily: FONTS.extraBold, color: c.blue, letterSpacing: 1.2, textTransform: 'uppercase' },
    iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    headerCenter: { position: 'absolute', left: 140, right: 100, alignItems: 'center', gap: 2, zIndex: 0 },
    title: { width: '100%', fontSize: 22, fontFamily: FONTS.extraBold, color: c.text1, textAlign: 'center' },
    subtitle: { width: '100%', fontSize: 12, fontFamily: FONTS.bold, color: c.text2, textAlign: 'center' },
    rightCluster: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, zIndex: 1 },
    timerBadge: { alignItems: 'flex-end', minWidth: 36 },
    timerText: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    guidanceBar: {
      backgroundColor: c.bgSurface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: 58,
      gap: 2,
      justifyContent: 'center',
    },
    guidanceBarActive: { borderColor: c.blue, backgroundColor: c.blue + '18' },
    guidanceText: { textAlign: 'center', fontSize: 12, fontFamily: FONTS.bold, color: c.text2 },
    boardShell: { backgroundColor: c.bgSurface, borderRadius: 16, padding: 8, gap: 6, overflow: 'visible' },
    columnRow: { flexDirection: 'row', gap: 6, alignItems: 'stretch' },
    corner: { width: 74 },
    columnLabel: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.bgBase,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: 'transparent',
      paddingHorizontal: 3,
      paddingVertical: 5,
    },
    gridRow: { flexDirection: 'row', gap: 6, alignItems: 'stretch', zIndex: 1 },
    gridRowDragging: { zIndex: 50, elevation: 12 },
    rowLabel: {
      width: 74,
      minHeight: 70,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      backgroundColor: c.bgBase,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: 'transparent',
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    lineLabelMarked: { borderWidth: 2 },
    lineLabelText: {
      textAlign: 'center',
      textAlignVertical: 'center',
      fontSize: 10,
      fontFamily: FONTS.extraBold,
      color: c.text2,
    },
    lineLabelTextSolved: { color: c.categoryText },
    stateChip: {
      marginTop: 3,
      borderRadius: 5,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    stateChipText: {
      fontSize: 7.5,
      fontFamily: FONTS.extraBold,
      letterSpacing: 0.6,
    },
    stateChipTextSolved: { color: c.categoryText },
    railNotchRow: {
      position: 'absolute',
      right: -6,
      top: '50%',
      marginTop: -6,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: c.bgSurface,
    },
    railNotchColumn: {
      position: 'absolute',
      bottom: -6,
      left: '50%',
      marginLeft: -6,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: c.bgSurface,
    },
    traceH: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: '50%',
      marginTop: -1,
      height: 2,
      borderRadius: 1,
      opacity: 0.5,
      shadowOpacity: 0.9,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 0 },
    },
    traceV: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: '50%',
      marginLeft: -1,
      width: 2,
      borderRadius: 1,
      opacity: 0.5,
      shadowOpacity: 0.9,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 0 },
    },
    tile: {
      flex: 1,
      minHeight: 70,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.tileStrip,
      backgroundColor: c.tileDefault,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    tilePress: {
      width: '100%',
      minHeight: 66,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      overflow: 'hidden',
      borderRadius: 8,
    },
    tileSelected: { backgroundColor: c.tileSelected, borderColor: c.text1 },
    tileMoved: { borderColor: c.purple },
    tileScanned: { borderColor: c.blue },
    tileScanLocked: { borderColor: c.green, backgroundColor: c.green + '22' },
    tileLineMarked: { borderWidth: 2 },
    tileLocked: { borderColor: c.green },
    tileResultCorrect: { borderColor: c.green, backgroundColor: c.green + '18' },
    tileResultIncorrect: { borderColor: c.errorFlash, backgroundColor: c.errorFlash + '12' },
    tileDragging: {
      zIndex: 100,
      elevation: 16,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
    },
    scanPill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: 8,
      fontFamily: FONTS.extraBold,
      color: '#162219',
      backgroundColor: c.blue,
      paddingVertical: 2,
    },
    movedDot: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.purple,
    },
    lockPill: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: 8,
      fontFamily: FONTS.extraBold,
      color: '#162219',
      backgroundColor: c.green,
      paddingVertical: 2,
    },
    tileLockPill: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: 8,
      fontFamily: FONTS.extraBold,
      color: '#162219',
      backgroundColor: c.green,
      paddingVertical: 2,
    },
    tileText: { fontFamily: FONTS.extraBold, color: c.text1, textAlign: 'center' },
    noiseBlock: { alignItems: 'center', gap: 2 },
    noiseLabel: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    noiseRow: { flexDirection: 'row', gap: 12 },
    noiseMark: { fontSize: 34, fontFamily: FONTS.extraBold, color: c.border },
    noiseMarkActive: { color: c.errorFlash },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
    secondaryBtn: {
      flex: 1,
      minWidth: 72,
      minHeight: 48,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: c.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingHorizontal: 8,
      backgroundColor: c.bgScreen,
    },
    secondaryBtnText: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.text1 },
    primaryBtn: {
      flex: 1,
      minWidth: 72,
      minHeight: 48,
      borderRadius: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingHorizontal: 8,
      backgroundColor: c.blue,
    },
    primaryBtnText: { fontSize: 15, fontFamily: FONTS.extraBold, color: '#162219' },
  });
}
