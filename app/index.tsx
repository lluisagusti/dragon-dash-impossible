import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trophy, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { GameColors } from '@/constants/colors';
import { GAME } from '@/constants/game';
import DragonSprite from '@/components/game/DragonSprite';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 14;

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const [highScore, setHighScore] = useState<number>(0);

  const titleAnim = useRef(new Animated.Value(0)).current;
  const dragonBounce = useRef(new Animated.Value(0)).current;
  const buttonPulse = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        x: Math.random() * width,
        startY: height * 0.15 + Math.random() * height * 0.65,
        size: 2 + Math.random() * 3,
        baseOpacity: 0.15 + Math.random() * 0.3,
        duration: 4000 + Math.random() * 4000,
        anim: new Animated.Value(0),
        color:
          i % 3 === 0
            ? GameColors.ui.neonCyan
            : i % 3 === 1
              ? GameColors.ui.gold
              : GameColors.dragon.body,
      })),
    [],
  );

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(GAME.HIGH_SCORE_KEY).then((v) => {
        if (v) setHighScore(parseInt(v, 10));
      });
    }, []),
  );

  useEffect(() => {
    Animated.spring(titleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dragonBounce, {
          toValue: -14,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(dragonBounce, {
          toValue: 0,
          duration: 1300,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    particles.forEach((p) => {
      Animated.loop(
        Animated.timing(p.anim, {
          toValue: 1,
          duration: p.duration,
          useNativeDriver: true,
        }),
      ).start();
    });
  }, []);

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/game' as never);
  };

  const titleScale = titleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const titleOpacity = titleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  const buttonGlow = buttonPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#06060f', '#0a0a2e', '#14083e', '#0a0a2e', '#06060f']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      {particles.map((p, i) => {
        const translateY = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -height * 0.35],
        });
        const opacity = p.anim.interpolate({
          inputRange: [0, 0.15, 0.65, 1],
          outputRange: [0, p.baseOpacity, p.baseOpacity, 0],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute' as const,
              left: p.x,
              top: p.startY,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateY }],
            }}
          />
        );
      })}

      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        <Animated.View
          style={[
            styles.titleContainer,
            { opacity: titleOpacity, transform: [{ scale: titleScale }] },
          ]}
        >
          <Text style={styles.titleMain}>DRAGON DASH</Text>
          <View style={styles.titleAccent} />
          <Text style={styles.titleSub}>CHRONICLES</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.dragonArea,
            { opacity: fadeIn, transform: [{ translateY: dragonBounce }] },
          ]}
        >
          <View style={styles.dragonGlow} />
          <DragonSprite size={90} isGliding={false} velocity={0} />
        </Animated.View>

        {highScore > 0 && (
          <Animated.View style={[styles.scoreRow, { opacity: fadeIn }]}>
            <Trophy size={16} color={GameColors.ui.gold} />
            <Text style={styles.scoreText}>BEST: {highScore}</Text>
          </Animated.View>
        )}

        <Animated.View style={[styles.playArea, { opacity: fadeIn }]}>
          <Pressable
            onPress={handlePlay}
            testID="play-button"
            style={({ pressed }) => [
              styles.playButton,
              pressed && styles.playButtonPressed,
            ]}
          >
            <Animated.View
              style={[styles.playInner, { opacity: buttonGlow }]}
            >
              <LinearGradient
                colors={['rgba(0,232,255,0.12)', 'rgba(0,232,255,0.03)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Zap size={20} color={GameColors.ui.neonCyan} />
              <Text style={styles.playText}>TAP TO PLAY</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.hintArea, { opacity: fadeIn }]}>
          <Text style={styles.hintText}>
            Tap to jump · Hold to glide · Collect rings
          </Text>
          <Text style={styles.hintText2}>Double jump in mid-air!</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06060f',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  titleMain: {
    fontSize: 40,
    fontWeight: '900',
    color: GameColors.ui.neonCyan,
    letterSpacing: 3,
    textShadowColor: 'rgba(0,232,255,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  titleAccent: {
    width: 80,
    height: 2,
    backgroundColor: GameColors.ui.gold,
    marginVertical: 8,
    borderRadius: 1,
    opacity: 0.6,
  },
  titleSub: {
    fontSize: 16,
    fontWeight: '700',
    color: GameColors.ui.gold,
    letterSpacing: 14,
    textShadowColor: 'rgba(255,200,0,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  dragonArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  dragonGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: GameColors.dragon.glow,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 36,
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '700',
    color: GameColors.ui.gold,
    letterSpacing: 2,
  },
  playArea: {
    marginBottom: 30,
  },
  playButton: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  playButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  playInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 34,
    paddingVertical: 16,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: GameColors.ui.neonCyan,
  },
  playText: {
    fontSize: 17,
    fontWeight: '800',
    color: GameColors.ui.white,
    letterSpacing: 3,
  },
  hintArea: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    gap: 4,
  },
  hintText: {
    fontSize: 12,
    color: GameColors.ui.whiteTransparent,
    letterSpacing: 1,
  },
  hintText2: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.5,
  },
});
