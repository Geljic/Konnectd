import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LIGHT_COLORS } from '@/constants/colors';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 30;
const PARTICLE_COLORS = [LIGHT_COLORS.yellow, LIGHT_COLORS.green, LIGHT_COLORS.blue, LIGHT_COLORS.purple, '#E07060', '#D4A855'];

interface Particle {
  x: number;
  delay: number;
  color: string;
  size: number;
  rotation: number;
}

function ConfettiParticle({ x, delay, color, size, rotation }: Particle) {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withTiming(height + 40, {
      duration: 1800 + Math.random() * 800,
      easing: Easing.in(Easing.quad),
    }));
    rotate.value = withDelay(delay, withTiming(rotation, { duration: 2000 }));
    opacity.value = withDelay(delay + 1200, withTiming(0, { duration: 600 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.particle, { left: x, width: size, height: size * 0.5, backgroundColor: color }, style]}
    />
  );
}

interface ConfettiProps {
  active: boolean;
}

export function Confetti({ active }: ConfettiProps) {
  if (!active) return null;

  const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    x: Math.random() * width,
    delay: Math.random() * 400,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    size: 8 + Math.random() * 8,
    rotation: 360 + Math.random() * 360,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => <ConfettiParticle key={i} {...p} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
  },
});
