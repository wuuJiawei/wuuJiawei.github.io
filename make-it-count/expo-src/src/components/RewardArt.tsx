import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  Group,
  Line,
  Path,
  RoundedRect,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { colors } from '../theme/colors';

export function RewardArt({ revealed = true, compact = false }: { revealed?: boolean; compact?: boolean }) {
  const scale = useSharedValue(compact ? 1 : 0.68);
  const opacity = useSharedValue(compact ? 1 : 0);

  useEffect(() => {
    if (!revealed || compact) return;
    opacity.value = withTiming(1, { duration: 280 });
    scale.value = withDelay(50, withSpring(1, { damping: 12, stiffness: 115 }));
  }, [revealed, compact, opacity, scale]);

  const artStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 12;
    const x1 = 110 + Math.cos(a) * 80;
    const y1 = 110 + Math.sin(a) * 80;
    const x2 = 110 + Math.cos(a) * 91;
    const y2 = 110 + Math.sin(a) * 91;
    return <Line key={i} p1={vec(x1, y1)} p2={vec(x2, y2)} color={colors.ochre} strokeWidth={2} opacity={0.45} />;
  });

  const shade = Skia.Path.Make();
  shade.moveTo(73, 78);
  shade.lineTo(147, 78);
  shade.lineTo(138, 160);
  shade.lineTo(82, 160);
  shade.close();

  return (
    <Animated.View style={[compact ? styles.compact : styles.box, artStyle]}>
      <Canvas style={StyleSheet.absoluteFill}>
        {!compact ? <Circle cx={110} cy={110} r={92} color={colors.ochre} opacity={0.09} /> : null}
        {!compact ? rays : null}
        <Group>
          <Path path={shade} color={colors.terracottaDeep} />
          <RoundedRect x={84} y={89} width={52} height={55} r={12} color={colors.ochre} />
          <RoundedRect x={91} y={96} width={38} height={40} r={10} color="#F6D995" />
          <Circle cx={110} cy={116} r={17} color="#FFF0BB" opacity={0.55} />
          <RoundedRect x={106} y={53} width={8} height={29} r={4} color={colors.ink} />
          <RoundedRect x={87} y={63} width={46} height={7} r={4} color={colors.ink} />
          <RoundedRect x={81} y={157} width={58} height={8} r={4} color={colors.ink} />
        </Group>
      </Canvas>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { width: 220, height: 220 },
  compact: { width: 72, height: 72 },
});
