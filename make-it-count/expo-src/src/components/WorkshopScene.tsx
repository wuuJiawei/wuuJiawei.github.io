import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  Group,
  Line,
  LinearGradient,
  Path,
  RoundedRect,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { colors } from '../theme/colors';

const reader = require('../../assets/open-doodles/sitting-reading.png');

type Props = {
  progress: number;
  roomMode?: boolean;
  previewMode?: boolean;
  paused?: boolean;
  onRewardPress?: () => void;
};

export function WorkshopScene({
  progress,
  roomMode = false,
  previewMode = false,
  paused = false,
  onRewardPress,
}: Props) {
  const bob = useSharedValue(0);

  useEffect(() => {
    bob.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [bob]);

  const characterStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -1 + bob.value * 3 },
      { rotate: `${-0.4 + bob.value * 0.8}deg` },
    ],
    opacity: paused ? 0.52 : 1,
  }));

  const itemOpacity = Math.max(0.16, 0.28 + progress * 0.72);
  const glowOpacity = progress < 0.55 ? 0.02 : (progress - 0.55) * 0.55;
  const sceneHeight = previewMode ? 238 : roomMode ? 388 : 420;

  return (
    <View style={[styles.wrap, { height: sceneHeight }, previewMode && styles.previewWrap]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <RoundedRect x={0} y={0} width={390} height={sceneHeight} r={previewMode ? 24 : 28} color={colors.nightDeep} />
        <RoundedRect x={0} y={0} width={390} height={sceneHeight * 0.7} r={previewMode ? 24 : 28} color={colors.night}>
          <LinearGradient start={vec(0, 0)} end={vec(390, sceneHeight * 0.7)} colors={['#344239', colors.nightDeep]} />
        </RoundedRect>
        <Path path={floorPath(sceneHeight)} color={colors.woodDark} />

        <RoundedRect x={22} y={24} width={112} height={114} r={9} color="#987C5C" />
        <RoundedRect x={30} y={32} width={96} height={98} r={5} color="#22373C" />
        <Circle cx={99} cy={57} r={12} color="#EEDAA8" opacity={0.88} />
        <Line p1={vec(78, 32)} p2={vec(78, 130)} color="#7E6951" strokeWidth={4} />
        <Line p1={vec(30, 81)} p2={vec(126, 81)} color="#7E6951" strokeWidth={4} />
        <Line p1={vec(40, 40)} p2={vec(28, 65)} color="#B7CBCC" strokeWidth={1.2} opacity={0.28} />
        <Line p1={vec(54, 38)} p2={vec(37, 73)} color="#B7CBCC" strokeWidth={1.2} opacity={0.22} />
        <Line p1={vec(113, 84)} p2={vec(101, 109)} color="#B7CBCC" strokeWidth={1.2} opacity={0.2} />

        <RoundedRect x={237} y={49} width={118} height={7} r={4} color="#9F7654" />
        <RoundedRect x={249} y={28} width={9} height={21} r={2} color={colors.terracotta} />
        <RoundedRect x={261} y={22} width={8} height={27} r={2} color={colors.ochre} />
        <RoundedRect x={272} y={31} width={11} height={18} r={2} color="#75856F" />
        <RoundedRect x={317} y={34} width={24} height={15} r={7} color="#6F4D39" />
        <Circle cx={323} cy={28} r={8} color="#72886E" />
        <Circle cx={334} cy={27} r={7} color="#839A79" />

        <RoundedRect x={270} y={82} width={56} height={48} r={3} color="#B89C76" />
        <RoundedRect x={275} y={87} width={46} height={38} r={2} color="#DDD2B9" />
        <Circle cx={296} cy={101} r={7} color={colors.ochre} />
        <Path path={mountainPath()} color="#6F806E" />

        <RoundedRect x={42} y={sceneHeight - 141} width={304} height={23} r={7} color={colors.wood} />
        <RoundedRect x={63} y={sceneHeight - 123} width={15} height={91} r={5} color={colors.woodDark} />
        <RoundedRect x={309} y={sceneHeight - 123} width={15} height={91} r={5} color={colors.woodDark} />
        <RoundedRect x={132} y={sceneHeight - 164} width={61} height={8} r={3} color="#604736" />
        <RoundedRect x={139} y={sceneHeight - 188} width={48} height={24} r={3} color="#D8C8A6" />
        <Line p1={vec(146, sceneHeight - 178)} p2={vec(179, sceneHeight - 178)} color="#9F8E72" strokeWidth={2} />
        <Line p1={vec(146, sceneHeight - 171)} p2={vec(168, sceneHeight - 171)} color="#9F8E72" strokeWidth={2} />

        <RoundedRect x={202} y={sceneHeight - 168} width={27} height={27} r={6} color="#D5B178" />
        <Circle cx={229} cy={sceneHeight - 155} r={8} color="#D5B178" style="stroke" strokeWidth={4} />

        <Circle cx={282} cy={sceneHeight - 192} r={74} color="#E9B95D" opacity={glowOpacity} />
        <Group opacity={roomMode ? 1 : itemOpacity}>
          <Path path={lampShade(sceneHeight)} color={progress > 0.22 || roomMode ? colors.terracottaDeep : '#5C554B'} />
          <RoundedRect x={259} y={sceneHeight - 219} width={47} height={52} r={11} color={progress > 0.43 || roomMode ? colors.ochre : '#756B5E'} />
          <RoundedRect x={266} y={sceneHeight - 212} width={33} height={37} r={9} color={progress > 0.65 || roomMode ? '#F6D995' : '#8C8170'} />
          <Circle cx={282} cy={sceneHeight - 194} r={13} color="#FFF1BA" opacity={progress > 0.72 || roomMode ? 0.48 : 0} />
          <RoundedRect x={278} y={sceneHeight - 248} width={8} height={29} r={4} color={colors.ink} />
          <RoundedRect x={260} y={sceneHeight - 239} width={44} height={7} r={4} color={colors.ink} />
          <RoundedRect x={256} y={sceneHeight - 169} width={52} height={8} r={4} color={colors.ink} />
        </Group>

        {roomMode ? <RoundedRect x={89} y={sceneHeight - 58} width={211} height={39} r={20} color="#8B7159" opacity={0.7} /> : null}
      </Canvas>

      <Animated.View
        style={[
          styles.characterWrap,
          { bottom: previewMode ? 31 : 43, width: previewMode ? 162 : 218, height: previewMode ? 138 : 188 },
          characterStyle,
        ]}
        pointerEvents="none"
      >
        <Image source={reader} resizeMode="contain" style={styles.character} />
      </Animated.View>

      {!roomMode && !previewMode ? (
        <View style={styles.sceneLabel} pointerEvents="none">
          <View style={[styles.liveDot, paused && styles.liveDotPaused]} />
          <Text style={styles.sceneLabelText}>{paused ? '工坊暂停了' : '工坊正在工作'}</Text>
        </View>
      ) : null}

      {!roomMode && !previewMode && progress > 0.48 && !paused ? (
        <View style={styles.sparkCluster} pointerEvents="none">
          <Spark delay={0} />
          <Spark delay={440} />
        </View>
      ) : null}

      {roomMode && onRewardPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="查看雨夜书灯成果"
          onPress={onRewardPress}
          style={({ pressed }) => [styles.rewardHotspot, pressed && { opacity: 0.7 }]}
        />
      ) : null}
    </View>
  );
}

function Spark({ delay }: { delay: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    const start = setTimeout(() => {
      p.value = withRepeat(withTiming(1, { duration: 1050 }), -1, false);
    }, delay);
    return () => clearTimeout(start);
  }, [delay, p]);

  const style = useAnimatedStyle(() => ({
    opacity: p.value < 0.5 ? p.value * 2 : (1 - p.value) * 2,
    transform: [{ translateY: -p.value * 13 }, { scale: 0.65 + p.value * 0.5 }],
  }));
  return <Animated.View style={[styles.spark, style]} />;
}

function floorPath(height: number) {
  const p = Skia.Path.Make();
  p.moveTo(0, height * 0.68);
  p.lineTo(390, height * 0.68);
  p.lineTo(390, height);
  p.lineTo(0, height);
  p.close();
  return p;
}

function mountainPath() {
  const p = Skia.Path.Make();
  p.moveTo(276, 122);
  p.lineTo(287, 110);
  p.lineTo(295, 116);
  p.lineTo(306, 103);
  p.lineTo(321, 122);
  p.close();
  return p;
}

function lampShade(height: number) {
  const p = Skia.Path.Make();
  p.moveTo(252, height - 228);
  p.lineTo(312, height - 228);
  p.lineTo(305, height - 164);
  p.lineTo(259, height - 164);
  p.close();
  return p;
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.nightDeep,
  },
  previewWrap: { borderRadius: 24 },
  characterWrap: { position: 'absolute', left: 18 },
  character: { width: '100%', height: '100%' },
  sceneLabel: {
    position: 'absolute', top: 15, right: 15,
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(255,249,238,.88)',
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 15,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.terracotta },
  liveDotPaused: { backgroundColor: colors.faint },
  sceneLabelText: { color: colors.ink, fontSize: 10.5, fontWeight: '700' },
  sparkCluster: { position: 'absolute', right: 82, top: 145, gap: 7 },
  spark: { width: 6, height: 6, borderRadius: 1, backgroundColor: '#FFE3A0', transform: [{ rotate: '45deg' }] },
  rewardHotspot: { position: 'absolute', right: 52, bottom: 108, width: 92, height: 120, borderRadius: 30 },
});
