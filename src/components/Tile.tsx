import React, { useEffect, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import Svg, { Path, Line, Circle, Ellipse, Rect, G } from 'react-native-svg';
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

const D = '#162219';
const W = '#FFFFFF';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

// Eye config per face — null means no blinkable eye on that side
type EyeInfo = { cx: number; cy: number; baseRy: number; innerRy?: number };
type FaceEyeConfig = { left: EyeInfo | null; right: EyeInfo | null };

const FACE_EYES: FaceEyeConfig[] = [
  { left: { cx: 26, cy: 18, baseRy: 4.5 }, right: { cx: 54, cy: 18, baseRy: 4.5 } },                           // 0
  { left: { cx: 26, cy: 15, baseRy: 4.5 }, right: { cx: 54, cy: 15, baseRy: 4.5 } },                           // 1
  { left: null, right: null },                                                                                    // 2 closed arcs
  { left: { cx: 26, cy: 17, baseRy: 7, innerRy: 3.5 }, right: { cx: 54, cy: 17, baseRy: 7, innerRy: 3.5 } },  // 3 big eyes
  { left: { cx: 26, cy: 17, baseRy: 4.5 }, right: null },                                                       // 4 one eye + squint
  { left: null, right: { cx: 54, cy: 18, baseRy: 4.5 } },                                                       // 5 robot + one eye
  { left: { cx: 26, cy: 20, baseRy: 4.5 }, right: { cx: 54, cy: 20, baseRy: 4.5 } },                           // 6
  { left: null, right: null },                                                                                    // 7 x-eyes
  { left: null, right: null },                                                                                    // 8 arc eyes
  { left: null, right: null },                                                                                    // 9 flat eyes
  { left: { cx: 26, cy: 17, baseRy: 2.5 }, right: { cx: 54, cy: 17, baseRy: 2.5 } },                           // 10 small eyes
  { left: { cx: 26, cy: 15, baseRy: 4.5 }, right: { cx: 54, cy: 15, baseRy: 4.5 } },                           // 11
];

// Dark eye ellipse — cy shifts down as ry shrinks to keep bottom edge fixed (eyelid closes from top)
function AnimatedEye({ cx, cy, baseRy, eyeRy, eyeShiftX }: {
  cx: number; cy: number; baseRy: number;
  eyeRy: SharedValue<number>;
  eyeShiftX: SharedValue<number>;
}) {
  const animProps = useAnimatedProps(() => ({
    cx: cx + eyeShiftX.value,
    cy: cy + (baseRy - eyeRy.value),
    ry: eyeRy.value,
  }));
  return <AnimatedEllipse rx={baseRy} fill={D} animatedProps={animProps} />;
}

// White inner pupil that scales proportionally with outer eye (for big-eye faces)
function AnimatedInnerEye({ cx, cy, outerBaseRy, innerBaseRy, eyeRy, eyeShiftX }: {
  cx: number; cy: number; outerBaseRy: number; innerBaseRy: number;
  eyeRy: SharedValue<number>;
  eyeShiftX: SharedValue<number>;
}) {
  const animProps = useAnimatedProps(() => ({
    cx: cx + eyeShiftX.value,
    cy: cy + (outerBaseRy - eyeRy.value),
    ry: (eyeRy.value / outerBaseRy) * innerBaseRy,
  }));
  return <AnimatedEllipse rx={innerBaseRy} fill={W} animatedProps={animProps} />;
}

// Static parts for each face — everything except the blinkable eyes
function FaceStaticParts({ index }: { index: number }) {
  switch (index % 12) {
    case 0:
      return <Path d="M32 29 Q40 34 48 29" stroke={D} strokeWidth="2" fill="none" strokeLinecap="round" />;
    case 1:
      return <>
        <Path d="M24 24 Q40 36 56 24 Z" fill={D} />
        <Path d="M27 24 Q40 32 53 24" fill={W} />
        <Line x1="33" y1="24" x2="32" y2="29" stroke={D} strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="40" y1="24" x2="40" y2="30" stroke={D} strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="47" y1="24" x2="48" y2="29" stroke={D} strokeWidth="1.5" strokeLinecap="round" />
      </>;
    case 2:
      return <>
        <Path d="M21 18 A5 5 0 0 0 31 18 Z" fill={D} />
        <Line x1="21" y1="18" x2="31" y2="18" stroke={D} strokeWidth="2" strokeLinecap="round" />
        <Path d="M49 18 A5 5 0 0 0 59 18 Z" fill={D} />
        <Line x1="49" y1="18" x2="59" y2="18" stroke={D} strokeWidth="2" strokeLinecap="round" />
        <Line x1="33" y1="29" x2="47" y2="29" stroke={D} strokeWidth="2" strokeLinecap="round" />
      </>;
    case 3:
      // Mouth only — animated eyes handle the eye circles including white pupils
      return <>
        <Ellipse cx="40" cy="31" rx="4.5" ry="4" fill={D} />
        <Ellipse cx="40" cy="31" rx="2.5" ry="2.5" fill={W} />
      </>;
    case 4:
      return <>
        <Path d="M49 16 Q54 21 59 16" stroke={D} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <Path d="M32 28 Q40 33 48 28" stroke={D} strokeWidth="2" fill="none" strokeLinecap="round" />
      </>;
    case 5:
      return <>
        <Line x1="26" y1="13" x2="26" y2="8" stroke={D} strokeWidth="2" strokeLinecap="round" />
        <Line x1="19" y1="17" x2="13" y2="14" stroke={D} strokeWidth="1.5" strokeLinecap="round" />
        <Rect x="18" y="13" width="16" height="10" rx="3" fill={D} />
        <Path d="M44 28 Q51 33 55 28" stroke={D} strokeWidth="2" fill="none" strokeLinecap="round" />
      </>;
    case 6:
      return <>
        <Line x1="19" y1="10" x2="31" y2="14" stroke={D} strokeWidth="2.5" strokeLinecap="round" />
        <Line x1="49" y1="14" x2="61" y2="10" stroke={D} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M31 31 Q40 26 49 31" stroke={D} strokeWidth="2" fill="none" strokeLinecap="round" />
      </>;
    case 7:
      return <>
        <Line x1="21" y1="13" x2="31" y2="23" stroke={D} strokeWidth="2.5" strokeLinecap="round" />
        <Line x1="31" y1="13" x2="21" y2="23" stroke={D} strokeWidth="2.5" strokeLinecap="round" />
        <Line x1="49" y1="13" x2="59" y2="23" stroke={D} strokeWidth="2.5" strokeLinecap="round" />
        <Line x1="59" y1="13" x2="49" y2="23" stroke={D} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M27 30 Q32 27 37 30 Q42 33 47 30" stroke={D} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </>;
    case 8:
      return <>
        <Path d="M21 21 A5 5 0 0 1 31 21" stroke={D} strokeWidth="3" fill="none" strokeLinecap="round" />
        <Path d="M49 21 A5 5 0 0 1 59 21" stroke={D} strokeWidth="3" fill="none" strokeLinecap="round" />
        <Path d="M20 27 Q40 38 60 27 Z" fill={D} />
        <Path d="M23 27 Q40 35 57 27" fill={W} />
        <Line x1="30" y1="27" x2="29" y2="31" stroke={D} strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="37" y1="27" x2="37" y2="32" stroke={D} strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="43" y1="27" x2="43" y2="32" stroke={D} strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="50" y1="27" x2="51" y2="31" stroke={D} strokeWidth="1.5" strokeLinecap="round" />
      </>;
    case 9:
      return <>
        <Ellipse cx="26" cy="18" rx="6" ry="2.5" fill={D} />
        <Ellipse cx="54" cy="18" rx="6" ry="2.5" fill={D} />
        <Path d="M35 28 Q43 32 50 27" stroke={D} strokeWidth="2" fill="none" strokeLinecap="round" />
      </>;
    case 10:
      return <>
        <Ellipse cx="15" cy="23" rx="6" ry="3.5" fill="#F4A0A0" opacity="0.55" />
        <Ellipse cx="65" cy="23" rx="6" ry="3.5" fill="#F4A0A0" opacity="0.55" />
        <Path d="M34 27 Q40 31 46 27" stroke={D} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </>;
    case 11:
      return <>
        <Path d="M25 24 Q40 35 55 24 Z" fill={D} />
        <Path d="M28 24 Q40 31 52 24" fill={W} />
        <Path d="M33 24 L31 30 L36 24 Z" fill={D} />
        <Path d="M44 24 L47 30 L49 24 Z" fill={D} />
      </>;
    default:
      return null;
  }
}

function FaceIllustration({ index, leftEyeRy, rightEyeRy, eyeShiftX }: {
  index: number;
  leftEyeRy: SharedValue<number>;
  rightEyeRy: SharedValue<number>;
  eyeShiftX: SharedValue<number>;
}) {
  const faceIdx = index % 12;
  const eyeConfig = FACE_EYES[faceIdx];

  return (
    <G>
      <FaceStaticParts index={faceIdx} />
      {eyeConfig.left && (eyeConfig.left.innerRy != null ? (
        <>
          <AnimatedEye cx={eyeConfig.left.cx} cy={eyeConfig.left.cy} baseRy={eyeConfig.left.baseRy} eyeRy={leftEyeRy} eyeShiftX={eyeShiftX} />
          <AnimatedInnerEye cx={eyeConfig.left.cx} cy={eyeConfig.left.cy} outerBaseRy={eyeConfig.left.baseRy} innerBaseRy={eyeConfig.left.innerRy} eyeRy={leftEyeRy} eyeShiftX={eyeShiftX} />
        </>
      ) : (
        <AnimatedEye cx={eyeConfig.left.cx} cy={eyeConfig.left.cy} baseRy={eyeConfig.left.baseRy} eyeRy={leftEyeRy} eyeShiftX={eyeShiftX} />
      ))}
      {eyeConfig.right && (eyeConfig.right.innerRy != null ? (
        <>
          <AnimatedEye cx={eyeConfig.right.cx} cy={eyeConfig.right.cy} baseRy={eyeConfig.right.baseRy} eyeRy={rightEyeRy} eyeShiftX={eyeShiftX} />
          <AnimatedInnerEye cx={eyeConfig.right.cx} cy={eyeConfig.right.cy} outerBaseRy={eyeConfig.right.baseRy} innerBaseRy={eyeConfig.right.innerRy} eyeRy={rightEyeRy} eyeShiftX={eyeShiftX} />
        </>
      ) : (
        <AnimatedEye cx={eyeConfig.right.cx} cy={eyeConfig.right.cy} baseRy={eyeConfig.right.baseRy} eyeRy={rightEyeRy} eyeShiftX={eyeShiftX} />
      ))}
    </G>
  );
}

const CALM_EXPRESSIONS = [0, 2, 4, 6, 9, 10];

function FaceStrip({ faceIndex, selected, tileStripColor }: { faceIndex: number; selected: boolean; tileStripColor: string }) {
  const stripCfg = useSettingsStore((s: { tileStripStyle: TileStripStyle }) => STRIP_CONFIG[s.tileStripStyle]);
  const initialFace = faceIndex % 12;
  const [face, setFace] = useState(initialFace);

  const opacity = useSharedValue(1);
  const bounceY = useSharedValue(0);
  const squishX = useSharedValue(1);
  const bobY = useSharedValue(0);
  const leftEyeRy = useSharedValue(FACE_EYES[initialFace].left?.baseRy ?? 0);
  const rightEyeRy = useSharedValue(FACE_EYES[initialFace].right?.baseRy ?? 0);
  const eyeShiftX = useSharedValue(0);

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
    const eyeConfig = FACE_EYES[face % 12];
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
  }, []);

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
          <FaceIllustration index={face} leftEyeRy={leftEyeRy} rightEyeRy={rightEyeRy} eyeShiftX={eyeShiftX} />
        </Svg>
      </Animated.View>
    </View>
  );
}

export function Tile({ word, selected, onPress, shake, onShakeDone, faceIndex = 0, shuffleSignal = 0, shuffleDelay = 0, solving = false, solvingDelay = 0 }: TileProps) {
  const colors = useColors();

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
    <Pressable onPress={onPress} style={styles.pressable}>
      <Animated.View style={[styles.tile, { backgroundColor: tileStrip, shadowColor: colors.shadow }, tileAnimStyle]}>
        <FaceStrip faceIndex={faceIndex} selected={selected} tileStripColor={tileStrip} />
        <Animated.View style={[styles.wordArea, wordAreaStyle]}>
          <Text style={[styles.word, { color: colors.text1 }]} numberOfLines={2} adjustsFontSizeToFit>
            {word.toUpperCase()}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { flex: 1, margin: 4, zIndex: 0, overflow: 'visible' },
  tile: {
    flex: 1, borderRadius: 12, borderWidth: 2, overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 5, elevation: 4,
    flexDirection: 'column',
  },
  faceStrip: { width: '100%', height: 10, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  faceInner: { flex: 1 },
  wordArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, paddingVertical: 6 },
  word: { fontSize: 13, fontFamily: FONTS.extraBold, textAlign: 'center', letterSpacing: 0.8 },
});
