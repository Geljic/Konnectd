import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';

interface OneAwayToastProps {
  visible: boolean;
  onDismiss: () => void;
  message?: string;
}

export function OneAwayToast({ visible, onDismiss, message = 'One away…' }: OneAwayToastProps) {
  const colors = useColors();
  const translateY = useSharedValue(60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(-8, { damping: 14 });
      opacity.value = withTiming(1, { duration: 150 });
      opacity.value = withDelay(1800, withTiming(0, { duration: 300 }, () => {
        runOnJS(onDismiss)();
      }));
      translateY.value = withDelay(1800, withTiming(60, { duration: 300 }));
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.toast, { backgroundColor: colors.text1 }, animStyle]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  text: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
});
