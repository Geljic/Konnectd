import React, { useEffect, useState } from 'react';
import { Pressable, Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path, Line, Ellipse, Rect, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { FONTS } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { useSettingsStore, STRIP_CONFIG, type TileStripStyle } from '@/store/settingsStore';

interface TileProps {
  word: string;
  selected: boolean;
  onPress: () => void;
  shake?: boolean;
  onShakeDone?: () => void;
  faceIndex?: number;
  shuffleSignal?: number;
  shuffleDelay?: number;
  solving?: boolean;
  solvingDelay?: number;
}

const W = '#FFFFFF';
const CHEEK = '#F49A8B';
const TOOTH = '#FFF7D8';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const FACE_COUNT = 16;
const SELECTED_FACE_SEQUENCE = [1, 13, 14, 13, 2, 15];
const WRONG_FACE_SEQUENCE = [12, 8, 10, 8];
const SUCCESS_FACE_SEQUENCE = [2, 11, 15];
type TileTextDensity = 'regular' | 'compact' | 'tight';

function tileFontSize(word: string, density: TileTextDensity = 'regular') {
  const length = word.length;
  const size =
    length >= 11 ? 10.5 :
    length >= 10 ? 11 :
    length >= 9 ? 12 :
    length >= 8 ? 13 :
    length >= 7 ? 13.5 :
    15;
  if (density === 'tight') return Math.max(9.5, size - 2);
  if (density === 'compact') return Math.max(10, size - 1);
  return size;
}

// Eye config per face — null means no blinkable eye on that side
type EyeInfo = { cx: number; cy: number; baseRx: number; baseRy: number; innerR?: number; innerDx?: number; innerDy?: number };
type FaceEyeConfig = { left: EyeInfo | null; right: EyeInfo | null };

const FACE_EYES: FaceEyeConfig[] = [
  { left: { cx: 27, cy: 17, baseRx: 4.1, baseRy: 5.9, innerR: 1.35, innerDx: -1.2, innerDy: -2.2 }, right: { cx: 53, cy: 17, baseRx: 4.1, baseRy: 5.9, innerR: 1.35, innerDx: -1.2, innerDy: -2.2 } }, // 0 neutral
  { left: { cx: 27, cy: 17, baseRx: 4.1, baseRy: 5.9, innerR: 1.35, innerDx: -1.2, innerDy: -2.2 }, right: { cx: 53, cy: 17, baseRx: 4.1, baseRy: 5.9, innerR: 1.35, innerDx: -1.2, innerDy: -2.2 } }, // 1 happy
  { left: null, right: null }, // 2 big smile
  { left: { cx: 27, cy: 16, baseRx: 4.2, baseRy: 6.2, innerR: 1.4, innerDx: -1.3, innerDy: -2.3 }, right: { cx: 53, cy: 16, baseRx: 4.2, baseRy: 6.2, innerR: 1.4, innerDx: -1.3, innerDy: -2.3 } }, // 3 surprised
  { left: null, right: null }, // 4 sleepy
  { left: null, right: null }, // 5 blink
  { left: { cx: 27, cy: 17, baseRx: 4, baseRy: 5.8, innerR: 1.35, innerDx: -1.2, innerDy: -2.2 }, right: null }, // 6 wink
  { left: { cx: 27, cy: 18, baseRx: 4, baseRy: 5.8, innerR: 1.35, innerDx: -1.2, innerDy: -2.2 }, right: { cx: 53, cy: 18, baseRx: 4, baseRy: 5.8, innerR: 1.35, innerDx: -1.2, innerDy: -2.2 } }, // 7 shy
  { left: { cx: 27, cy: 19, baseRx: 3.7, baseRy: 5.3, innerR: 1.15, innerDx: -1.1, innerDy: -2 }, right: { cx: 53, cy: 19, baseRx: 3.7, baseRy: 5.3, innerR: 1.15, innerDx: -1.1, innerDy: -2 } }, // 8 grumpy
  { left: null, right: null }, // 9 squint
  { left: null, right: null }, // 10 dizzy
  { left: null, right: null }, // 11 laugh
  { left: { cx: 27, cy: 18, baseRx: 4.1, baseRy: 5.9, innerR: 1.35, innerDx: -1.2, innerDy: -2.2 }, right: { cx: 53, cy: 18, baseRx: 4.1, baseRy: 5.9, innerR: 1.35, innerDx: -1.2, innerDy: -2.2 } }, // 12 worried
  { left: { cx: 27, cy: 17, baseRx: 4.1, baseRy: 5.9, innerR: 1.35, innerDx: -1.2, innerDy: -2.2 }, right: { cx: 53, cy: 17, baseRx: 4.1, baseRy: 5.9, innerR: 1.35, innerDx: -1.2, innerDy: -2.2 } }, // 13 talk A
  { left: { cx: 27, cy: 17, baseRx: 4.1, baseRy: 5.9, innerR: 1.35, innerDx: -1.2, innerDy: -2.2 }, right: { cx: 53, cy: 17, baseRx: 4.1, baseRy: 5.9, innerR: 1.35, innerDx: -1.2, innerDy: -2.2 } }, // 14 talk O
  { left: null, right: null }, // 15 eyes closed smile
];

// Dark eye ellipse — cy shifts down as ry shrinks to keep bottom edge fixed (eyelid closes from top)
function AnimatedEye({ cx, cy, baseRx, baseRy, eyeRy, eyeShiftX, color }: {
  cx: number; cy: number; baseRx: number; baseRy: number;
  eyeRy: SharedValue<number>;
  eyeShiftX: SharedValue<number>;
  color: string;
}) {
  const animProps = useAnimatedProps(() => ({
    cx: cx + eyeShiftX.value,
    cy: cy + (baseRy - eyeRy.value),
    ry: eyeRy.value,
  }));
  return <AnimatedEllipse rx={baseRx} fill={color} animatedProps={animProps} />;
}

// White inner pupil that scales proportionally with outer eye (for big-eye faces)
function AnimatedInnerEye({ cx, cy, outerBaseRy, innerR, innerDx = 0, innerDy = 0, eyeRy, eyeShiftX }: {
  cx: number; cy: number; outerBaseRy: number; innerR: number; innerDx?: number; innerDy?: number;
  eyeRy: SharedValue<number>;
  eyeShiftX: SharedValue<number>;
}) {
  const animProps = useAnimatedProps(() => ({
    cx: cx + innerDx + eyeShiftX.value,
    cy: cy + innerDy + (outerBaseRy - eyeRy.value),
    ry: (eyeRy.value / outerBaseRy) * innerR,
  }));
  return <AnimatedEllipse rx={innerR} fill={W} opacity={0.9} animatedProps={animProps} />;
}

function FaceCheeks({ strong = false }: { strong?: boolean }) {
  return (
    <G opacity={strong ? 0.82 : 0.72}>
      <Rect x="13" y="22" width={strong ? 10 : 9} height={strong ? 4.3 : 4} rx={2} fill={CHEEK} />
      <Rect x="58" y="22" width={strong ? 10 : 9} height={strong ? 4.3 : 4} rx={2} fill={CHEEK} />
    </G>
  );
}

function FaceSmile({ color }: { color: string }) {
  return <Path d="M33 26 Q40 31 47 26" stroke={color} strokeWidth="2.7" fill="none" strokeLinecap="round" />;
}

function FaceBigMouth({ color, wide = false }: { color: string; wide?: boolean }) {
  return (
    <G>
      <Path d={wide ? 'M27 25 Q40 36 53 25 Z' : 'M29 25 Q40 35 51 25 Z'} fill={color} />
      <Path d={wide ? 'M30 25 Q40 29 50 25' : 'M32 25 Q40 28 48 25'} fill={TOOTH} />
      <Path d="M35 31 Q40 28.5 45 31 Q42 34 40 34 Q38 34 35 31 Z" fill={CHEEK} />
    </G>
  );
}

function FaceTalkO({ color }: { color: string }) {
  return (
    <G>
      <Ellipse cx="40" cy="28" rx="4.4" ry="5.6" fill={color} />
      <Ellipse cx="40" cy="31" rx="2.2" ry="1.2" fill={CHEEK} />
    </G>
  );
}

// Static parts for each face — everything except the blinkable open eyes
function FaceStaticParts({ index, color }: { index: number; color: string }) {
  switch (index % 16) {
    case 0:
      return <>
        <FaceCheeks />
        <Path d="M35 27 Q40 29 45 27" stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </>;
    case 1:
      return <>
        <FaceCheeks />
        <FaceSmile color={color} />
      </>;
    case 2:
      return <>
        <FaceCheeks />
        <Path d="M22 18 Q27 12 32 18" stroke={color} strokeWidth="3.1" fill="none" strokeLinecap="round" />
        <Path d="M48 18 Q53 12 58 18" stroke={color} strokeWidth="3.1" fill="none" strokeLinecap="round" />
        <FaceBigMouth color={color} wide />
      </>;
    case 3:
      return <>
        <FaceCheeks />
        <FaceTalkO color={color} />
      </>;
    case 4:
      return <>
        <FaceCheeks />
        <Path d="M22 18 Q27 21 32 18" stroke={color} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <Path d="M48 18 Q53 21 58 18" stroke={color} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <FaceTalkO color={color} />
      </>;
    case 5:
      return <>
        <FaceCheeks />
        <Path d="M22 18 Q27 14 32 18" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        <Path d="M48 18 Q53 14 58 18" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        <Line x1="36" y1="27" x2="44" y2="27" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </>;
    case 6:
      return <>
        <FaceCheeks />
        <Path d="M48 17 Q53 21 58 17" stroke={color} strokeWidth="2.9" fill="none" strokeLinecap="round" />
        <FaceSmile color={color} />
      </>;
    case 7:
      return <>
        <FaceCheeks strong />
        <Path d="M22 11 Q27 8 32 11" stroke={color} strokeWidth="2.3" fill="none" strokeLinecap="round" />
        <Path d="M48 11 Q53 8 58 11" stroke={color} strokeWidth="2.3" fill="none" strokeLinecap="round" />
        <FaceSmile color={color} />
      </>;
    case 8:
      return <>
        <FaceCheeks />
        <Path d="M20 12 L32 16" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <Path d="M48 16 L60 12" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <Path d="M31 31 Q40 25 49 31" stroke={color} strokeWidth="2.7" fill="none" strokeLinecap="round" />
      </>;
    case 9:
      return <>
        <FaceCheeks />
        <Path d="M22 15 L32 20" stroke={color} strokeWidth="3.2" strokeLinecap="round" />
        <Path d="M32 15 L22 20" stroke={color} strokeWidth="3.2" strokeLinecap="round" />
        <Line x1="48" y1="18" x2="58" y2="18" stroke={color} strokeWidth="3.2" strokeLinecap="round" />
        <FaceSmile color={color} />
      </>;
    case 10:
      return <>
        <FaceCheeks />
        <Path d="M28 12 C20 12 20 24 28 24 C35 24 35 14 28 14 C23 14 23 21 28 21" stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <Path d="M54 12 C46 12 46 24 54 24 C61 24 61 14 54 14 C49 14 49 21 54 21" stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <FaceTalkO color={color} />
      </>;
    case 11:
      return <>
        <FaceCheeks />
        <Path d="M23 15 L31 19 L23 23" stroke={color} strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M57 15 L49 19 L57 23" stroke={color} strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <FaceBigMouth color={color} />
      </>;
    case 12:
      return <>
        <FaceCheeks />
        <Path d="M22 12 Q27 8 32 12" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <Path d="M48 12 Q53 8 58 12" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <Path d="M34 30 Q37 26 40 30 Q43 34 46 30" stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>;
    case 13:
      return <>
        <FaceCheeks />
        <Path d="M34 25 Q40 33 46 25 Z" fill={color} />
        <Path d="M36 25 Q40 27 44 25" fill={TOOTH} />
        <Ellipse cx="40" cy="31" rx="3" ry="1.5" fill={CHEEK} />
      </>;
    case 14:
      return <>
        <FaceCheeks />
        <FaceTalkO color={color} />
      </>;
    case 15:
      return <>
        <FaceCheeks />
        <Path d="M22 17 Q27 21.5 32 17" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        <Path d="M48 17 Q53 21.5 58 17" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        <FaceSmile color={color} />
      </>;
    default:
      return null;
  }
}

function FaceIllustration({ index, leftEyeRy, rightEyeRy, eyeShiftX, color }: {
  index: number;
  leftEyeRy: SharedValue<number>;
  rightEyeRy: SharedValue<number>;
  eyeShiftX: SharedValue<number>;
  color: string;
}) {
  const faceIdx = index % 16;
  const eyeConfig = FACE_EYES[faceIdx];

  return (
    <G>
      <FaceStaticParts index={faceIdx} color={color} />
      {eyeConfig.left && (eyeConfig.left.innerR != null ? (
        <>
          <AnimatedEye cx={eyeConfig.left.cx} cy={eyeConfig.left.cy} baseRx={eyeConfig.left.baseRx} baseRy={eyeConfig.left.baseRy} eyeRy={leftEyeRy} eyeShiftX={eyeShiftX} color={color} />
          <AnimatedInnerEye
            cx={eyeConfig.left.cx}
            cy={eyeConfig.left.cy}
            outerBaseRy={eyeConfig.left.baseRy}
            innerR={eyeConfig.left.innerR}
            innerDx={eyeConfig.left.innerDx}
            innerDy={eyeConfig.left.innerDy}
            eyeRy={leftEyeRy}
            eyeShiftX={eyeShiftX}
          />
        </>
      ) : (
        <AnimatedEye cx={eyeConfig.left.cx} cy={eyeConfig.left.cy} baseRx={eyeConfig.left.baseRx} baseRy={eyeConfig.left.baseRy} eyeRy={leftEyeRy} eyeShiftX={eyeShiftX} color={color} />
      ))}
      {eyeConfig.right && (eyeConfig.right.innerR != null ? (
        <>
          <AnimatedEye cx={eyeConfig.right.cx} cy={eyeConfig.right.cy} baseRx={eyeConfig.right.baseRx} baseRy={eyeConfig.right.baseRy} eyeRy={rightEyeRy} eyeShiftX={eyeShiftX} color={color} />
          <AnimatedInnerEye
            cx={eyeConfig.right.cx}
            cy={eyeConfig.right.cy}
            outerBaseRy={eyeConfig.right.baseRy}
            innerR={eyeConfig.right.innerR}
            innerDx={eyeConfig.right.innerDx}
            innerDy={eyeConfig.right.innerDy}
            eyeRy={rightEyeRy}
            eyeShiftX={eyeShiftX}
          />
        </>
      ) : (
        <AnimatedEye cx={eyeConfig.right.cx} cy={eyeConfig.right.cy} baseRx={eyeConfig.right.baseRx} baseRy={eyeConfig.right.baseRy} eyeRy={rightEyeRy} eyeShiftX={eyeShiftX} color={color} />
      ))}
    </G>
  );
}

const CALM_EXPRESSIONS = [0, 1, 5, 6, 7, 9, 13, 14, 15];

function FaceStrip({
  faceIndex,
  selected,
  shake,
  solving,
  tileStripColor,
  tileEyeColor,
}: {
  faceIndex: number;
  selected: boolean;
  shake: boolean;
  solving: boolean;
  tileStripColor: string;
  tileEyeColor: string;
}) {
  const stripCfg = useSettingsStore((s: { tileStripStyle: TileStripStyle }) => STRIP_CONFIG[s.tileStripStyle]);
  const initialFace = faceIndex % FACE_COUNT;
  const [face, setFace] = useState(initialFace);

  const opacity = useSharedValue(1);
  const bounceY = useSharedValue(0);
  const squishX = useSharedValue(1);
  const bobY = useSharedValue(0);
  const leftEyeRy = useSharedValue(FACE_EYES[initialFace].left?.baseRy ?? 0);
  const rightEyeRy = useSharedValue(FACE_EYES[initialFace].right?.baseRy ?? 0);
  const eyeShiftX = useSharedValue(0);

  function setFaceFrame(next: number) {
    const nextFace = next % FACE_COUNT;
    setFace(nextFace);
    leftEyeRy.value = FACE_EYES[nextFace].left?.baseRy ?? 0;
    rightEyeRy.value = FACE_EYES[nextFace].right?.baseRy ?? 0;
    eyeShiftX.value = 0;
  }

  // Continuous gentle bob — each tile starts at a random phase
  useEffect(() => {
    const initDir = Math.random() < 0.5 ? 1.3 : -1.3;
    bobY.value = withRepeat(
      withSequence(
        withTiming(initDir, { duration: 1600 + Math.random() * 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-initDir, { duration: 1600 + Math.random() * 500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  // Blink, wink, eye-shift — reschedule when face changes
  useEffect(() => {
    const eyeConfig = FACE_EYES[face % FACE_COUNT];
    const hasLeft = !!eyeConfig.left;
    const hasRight = !!eyeConfig.right;
    const canBlink = hasLeft || hasRight;
    const canWink = hasLeft && hasRight;

    const timers: ReturnType<typeof setTimeout>[] = [];

    function blinkSide(doLeft: boolean, doRight: boolean) {
      if (doLeft && eyeConfig.left) {
        const base = eyeConfig.left.baseRy;
        leftEyeRy.value = withSequence(
          withTiming(0.3, { duration: 65, easing: Easing.in(Easing.quad) }),
          withTiming(base, { duration: 120, easing: Easing.out(Easing.quad) }),
        );
      }
      if (doRight && eyeConfig.right) {
        const base = eyeConfig.right.baseRy;
        rightEyeRy.value = withSequence(
          withTiming(0.3, { duration: 65, easing: Easing.in(Easing.quad) }),
          withTiming(base, { duration: 120, easing: Easing.out(Easing.quad) }),
        );
      }
    }

    if (canBlink) {
      function scheduleBlink() {
        const delay = 3500 + Math.random() * 3500;
        const t = setTimeout(() => { blinkSide(true, true); scheduleBlink(); }, delay);
        timers.push(t);
      }
      timers.push(setTimeout(scheduleBlink, 500 + Math.random() * 2500));
    }

    if (canWink) {
      function scheduleWink() {
        const delay = 11000 + Math.random() * 14000;
        const t = setTimeout(() => {
          const leftOnly = Math.random() < 0.5;
          blinkSide(leftOnly, !leftOnly);
          scheduleWink();
        }, delay);
        timers.push(t);
      }
      timers.push(setTimeout(scheduleWink, 7000 + Math.random() * 8000));

      function scheduleEyeShift() {
        const delay = 7000 + Math.random() * 9000;
        const t = setTimeout(() => {
          const shift = (Math.random() - 0.5) * 5;
          eyeShiftX.value = withSequence(
            withTiming(shift, { duration: 220 }),
            withTiming(shift, { duration: 900 }),
            withTiming(0, { duration: 220 }),
          );
          scheduleEyeShift();
        }, delay);
        timers.push(t);
      }
      timers.push(setTimeout(scheduleEyeShift, 3000 + Math.random() * 5000));
    }

    return () => timers.forEach(clearTimeout);
  }, [face]);

  // Expression crossfade
  useEffect(() => {
    if (selected || shake || solving) return;
    const interval = 12000 + Math.random() * 18000;
    let timer: ReturnType<typeof setTimeout>;
    function cycle() {
      const next = CALM_EXPRESSIONS[Math.floor(Math.random() * CALM_EXPRESSIONS.length)];
      opacity.value = withSequence(
        withTiming(0, { duration: 400 }),
        withTiming(1, { duration: 600 }),
      );
      setTimeout(() => {
        setFace(next);
        leftEyeRy.value = FACE_EYES[next].left?.baseRy ?? 0;
        rightEyeRy.value = FACE_EYES[next].right?.baseRy ?? 0;
        eyeShiftX.value = 0;
      }, 400);
      timer = setTimeout(cycle, interval);
    }
    timer = setTimeout(cycle, Math.random() * interval);
    return () => clearTimeout(timer);
  }, [selected, shake, solving]);

  // Intentional expressions: talk while selected, react to wrong guesses, celebrate solved tiles.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (solving) {
      SUCCESS_FACE_SEQUENCE.forEach((next, i) => {
        timers.push(setTimeout(() => setFaceFrame(next), i * 120));
      });
      return () => timers.forEach(clearTimeout);
    }

    if (shake) {
      WRONG_FACE_SEQUENCE.forEach((next, i) => {
        timers.push(setTimeout(() => setFaceFrame(next), i * 95));
      });
      timers.push(setTimeout(() => setFaceFrame(initialFace), WRONG_FACE_SEQUENCE.length * 95 + 180));
      return () => timers.forEach(clearTimeout);
    }

    if (selected) {
      let i = 0;
      setFaceFrame(SELECTED_FACE_SEQUENCE[0]);
      const interval = setInterval(() => {
        i = (i + 1) % SELECTED_FACE_SEQUENCE.length;
        setFaceFrame(SELECTED_FACE_SEQUENCE[i]);
      }, 170);
      return () => clearInterval(interval);
    }

    setFaceFrame(initialFace);
    return undefined;
  }, [initialFace, selected, shake, solving]);

  // Selection bounce + squish
  useEffect(() => {
    if (selected) {
      bounceY.value = withSequence(
        withTiming(-4, { duration: 70 }),
        withSpring(0, { damping: 6, stiffness: 280 }),
      );
      squishX.value = withSequence(
        withTiming(1.15, { duration: 80 }),
        withSpring(1, { damping: 8, stiffness: 260 }),
      );
    } else {
      bounceY.value = withSpring(0, { damping: 10, stiffness: 200 });
      squishX.value = withSpring(1, { damping: 10, stiffness: 200 });
    }
  }, [selected]);

  const faceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: bounceY.value + bobY.value },
      { scaleX: squishX.value },
    ],
  }));

  return (
    <View style={[styles.faceStrip, { backgroundColor: tileStripColor, height: stripCfg.height }]}>
      <Animated.View style={[styles.faceInner, faceStyle]}>
        <Svg width="100%" height={stripCfg.height} viewBox={stripCfg.viewBox} preserveAspectRatio="xMidYMid meet">
          <FaceIllustration index={face} leftEyeRy={leftEyeRy} rightEyeRy={rightEyeRy} eyeShiftX={eyeShiftX} color={tileEyeColor} />
        </Svg>
      </Animated.View>
    </View>
  );
}

export function Tile({ word, selected, onPress, shake, onShakeDone, faceIndex = 0, shuffleSignal = 0, shuffleDelay = 0, solving = false, solvingDelay = 0 }: TileProps) {
  const colors = useColors();
  const { width, height } = useWindowDimensions();
  const density: TileTextDensity = width <= 390 || height <= 700 ? 'tight' : width <= 480 || height <= 760 ? 'compact' : 'regular';
  const compactText = density !== 'regular';
  const fontSize = tileFontSize(word, density);

  const translateX = useSharedValue(0);
  const shuffleScale = useSharedValue(1);
  const shuffleRotate = useSharedValue(0);
  const solveScale = useSharedValue(1);
  const solveTranslateY = useSharedValue(0);
  const solveOpacity = useSharedValue(1);

  useEffect(() => {
    if (!shuffleSignal) return;
    const rotation = (Math.random() - 0.5) * 18;
    const t = setTimeout(() => {
      shuffleScale.value = withSequence(
        withTiming(0.72, { duration: 75, easing: Easing.in(Easing.quad) }),
        withSpring(1, { damping: 9, stiffness: 220 }),
      );
      shuffleRotate.value = withSequence(
        withTiming(rotation, { duration: 75 }),
        withSpring(0, { damping: 10, stiffness: 200 }),
      );
    }, shuffleDelay);
    return () => clearTimeout(t);
  }, [shuffleSignal]);

  useEffect(() => {
    if (!solving) return;
    const t = setTimeout(() => {
      solveScale.value = withSequence(
        withTiming(1.1, { duration: 90 }),
        withTiming(0, { duration: 280, easing: Easing.in(Easing.quad) }),
      );
      solveTranslateY.value = withTiming(-130, { duration: 370, easing: Easing.in(Easing.quad) });
      solveOpacity.value = withSequence(
        withTiming(1, { duration: 90 }),
        withTiming(0, { duration: 240, easing: Easing.in(Easing.quad) }),
      );
    }, solvingDelay);
    return () => clearTimeout(t);
  }, [solving]);

  useEffect(() => {
    if (!shake) return;
    translateX.value = withSequence(
      withTiming(-10, { duration: 60 }),
      withTiming(10, { duration: 60 }),
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(0, { duration: 60 }, () => { if (onShakeDone) onShakeDone(); }),
    );
  }, [shake]);

  const tileStrip = colors.tileStrip;
  const tileEye = colors.tileEye;
  const tileSelected = colors.tileSelected;
  const tileDefault = colors.tileDefault;

  const tileAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: shuffleScale.value * solveScale.value },
      { translateX: translateX.value },
      { translateY: solveTranslateY.value },
      { rotate: `${shuffleRotate.value}deg` },
    ],
    opacity: solveOpacity.value,
    borderColor: selected ? tileStrip : 'transparent',
  }));

  const wordAreaStyle = useAnimatedStyle(() => ({
    backgroundColor: selected ? tileSelected : tileDefault,
  }));

  return (
    <Pressable onPress={onPress} style={[styles.pressable, compactText && styles.pressableCompact]}>
      <Animated.View style={[styles.tile, { backgroundColor: tileStrip, shadowColor: colors.shadow }, tileAnimStyle]}>
        <FaceStrip
          faceIndex={faceIndex}
          selected={selected}
          shake={!!shake}
          solving={solving}
          tileStripColor={tileStrip}
          tileEyeColor={tileEye}
        />
        <Animated.View style={[styles.wordArea, wordAreaStyle]}>
          <Text
            style={[styles.word, { color: colors.text1, fontSize, lineHeight: Math.ceil(fontSize + 3) }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={compactText ? 0.7 : 0.78}
            maxFontSizeMultiplier={1.05}
          >
            {word.toUpperCase()}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { flex: 1, margin: 4, zIndex: 0, overflow: 'visible' },
  pressableCompact: { margin: 3 },
  tile: {
    flex: 1, borderRadius: 12, borderWidth: 2, overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 5, elevation: 4,
    flexDirection: 'column',
  },
  faceStrip: { width: '100%', height: 10, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  faceInner: { flex: 1 },
  wordArea: { flex: 1, minHeight: 30, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, paddingVertical: 0 },
  word: { fontSize: 13, fontFamily: FONTS.extraBold, textAlign: 'center', letterSpacing: 0, includeFontPadding: false },
});
