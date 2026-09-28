import { useEffect, useMemo, useRef } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from '@/constants/theme';

const SPIKES = 16;
const RINGS = 6;
const AUTO_DISMISS_MS = 1800;

// One ring of the halftone dot field. Rings fade in one after another,
// radiating outward from the burst.
function DotRing({
  progress,
  index,
  cx,
  cy,
}: {
  progress: SharedValue<number>;
  index: number;
  cx: number;
  cy: number;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [index * 0.14, index * 0.14 + 0.3],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const dots = useMemo(() => {
    const radius = 82 + index * 48;
    const count = 10 + index * 6;
    const size = Math.max(4, 13 - index * 1.7);
    const color = index < 2 ? COLORS.yellow : '#ffffff';
    const baseOpacity = Math.max(0.15, 0.85 - index * 0.11);
    return Array.from({ length: count }, (_, k) => {
      const a = (k / count) * Math.PI * 2 + index * 0.35;
      const left = cx + Math.cos(a) * radius - size / 2;
      const top = cy + Math.sin(a) * radius * 0.92 - size / 2;
      return (
        <View
          key={k}
          style={{
            position: 'absolute',
            left,
            top,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: baseOpacity,
          }}
        />
      );
    });
  }, [index, cx, cy]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      {dots}
    </Animated.View>
  );
}

function renderSpikes(color: string) {
  return Array.from({ length: SPIKES }, (_, i) => {
    const long = i % 2 === 0;
    const len = long ? 215 : 165;
    return (
      <View
        key={i}
        style={{
          position: 'absolute',
          left: -17,
          top: -len / 2,
          width: 34,
          height: len,
          borderRadius: 5,
          backgroundColor: color,
          transform: [{ rotate: `${(360 / SPIKES) * i}deg` }],
        }}
      />
    );
  });
}

// Jagged comic starburst: white outline layer behind a yellow burst.
function Burst({ scale, cx, cy }: { scale: SharedValue<number>; cx: number; cy: number }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: Math.max(scale.value, 0.001) }],
  }));
  const white = useMemo(() => renderSpikes('#ffffff'), []);
  const yellow = useMemo(() => renderSpikes(COLORS.yellow), []);
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: cx, top: cy }, style]}
    >
      <View style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.16 }] }]}>{white}</View>
      <View style={StyleSheet.absoluteFill}>{yellow}</View>
    </Animated.View>
  );
}

export default function LaunchIntro({ onDone }: { onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const cx = width / 2;
  const cy = height * 0.4;
  const finished = useRef(false);

  const overlayOpacity = useSharedValue(1);
  const overlayScale = useSharedValue(1);
  const burstScale = useSharedValue(0);
  const dotsIn = useSharedValue(0);
  const powScale = useSharedValue(0);
  const mascotScale = useSharedValue(0);
  const wordOpacity = useSharedValue(0);
  const wordY = useSharedValue(18);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    overlayScale.value = withTiming(1.12, {
      duration: 260,
      easing: Easing.in(Easing.cubic),
    });
    overlayOpacity.value = withTiming(0, { duration: 260 }, (ok) => {
      if (ok) runOnJS(onDone)();
    });
  };

  useEffect(() => {
    // Our overlay is already rendered — drop the native splash onto it.
    SplashScreen.hideAsync().catch(() => {});

    burstScale.value = withDelay(80, withSpring(1, { damping: 7, stiffness: 110 }));
    dotsIn.value = withDelay(140, withTiming(1, { duration: 950 }));
    powScale.value = withDelay(330, withSpring(1, { damping: 6, stiffness: 140 }));
    mascotScale.value = withDelay(540, withSpring(1, { damping: 7.5, stiffness: 105 }));
    wordOpacity.value = withDelay(820, withTiming(1, { duration: 350 }));
    wordY.value = withDelay(820, withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) }));

    const t = setTimeout(finish, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [{ scale: overlayScale.value }],
  }));
  const powStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.max(powScale.value, 0.001) }, { rotate: '-8deg' }],
  }));
  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.max(mascotScale.value, 0.001) }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    transform: [{ translateY: wordY.value }],
  }));

  return (
    <Pressable onPress={finish} style={[styles.overlay, overlayStyle]}>
      {Array.from({ length: RINGS }, (_, i) => (
        <DotRing key={i} progress={dotsIn} index={i} cx={cx} cy={cy} />
      ))}
      <Burst scale={burstScale} cx={cx} cy={cy} />
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: cx - 130,
            top: cy - 72,
            width: 260,
            height: 144,
            alignItems: 'center',
            justifyContent: 'center',
          },
          powStyle,
        ]}
      >
        <Text style={styles.pow}>POW!</Text>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: cx - 80,
            top: cy + 150,
            width: 160,
            height: 160,
            alignItems: 'center',
            justifyContent: 'center',
          },
          mascotStyle,
        ]}
      >
        <Image
          source={require('@/assets/images/logo.png')}
          style={{ width: 148, height: 148 }}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: cy + 322,
            alignItems: 'center',
          },
          wordStyle,
        ]}
      >
        <Text style={styles.wordmark}>NERDCAVE77</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.cardDeep,
    zIndex: 50,
  },
  pow: {
    fontSize: 66,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#ffffff',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
  },
  wordmark: {
    color: COLORS.yellow,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 6,
  },
});
