import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';

const COLORS = [colors.terracotta, colors.ochre, colors.forest, '#B89E77', '#E7D3A8'];

export function Confetti({ active }: { active: boolean }) {
  const pieces = useMemo(
    () => Array.from({ length: 26 }, (_, i) => ({
      x: ((i * 37) % 100) / 100,
      delay: (i % 9) * 50,
      drift: ((i * 17) % 56) - 28,
      rotate: 160 + ((i * 53) % 430),
      color: COLORS[i % COLORS.length],
      tall: i % 3 === 0,
    })),
    [],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, i) => <Piece key={i} {...piece} active={active} />)}
    </View>
  );
}

function Piece({ active, x, delay, drift, rotate, color, tall }: any) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (!active) return;
    t.value = 0;
    t.value = withDelay(delay, withTiming(1, { duration: 1450, easing: Easing.in(Easing.quad) }));
  }, [active, delay, t]);

  const style = useAnimatedStyle(() => ({
    left: `${x * 100}%`,
    opacity: Math.min(1, (1 - t.value) * 1.4),
    transform: [
      { translateY: -70 + t.value * 820 },
      { translateX: drift * t.value },
      { rotate: `${rotate * t.value}deg` },
    ],
  }));

  return <Animated.View style={[styles.piece, tall && styles.tall, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0, width: 5, height: 10, borderRadius: 3 },
  tall: { height: 15, width: 4 },
});
