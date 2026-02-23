import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Pressable,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Flame, RotateCcw, Home, Trophy } from 'lucide-react-native';
import { GameColors } from '@/constants/colors';
import {
  GAME,
  WorldType,
  RingType,
  ObstacleData,
  RingData,
  GameStateData,
} from '@/constants/game';
import DragonSprite from '@/components/game/DragonSprite';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const GROUND_Y = SCREEN_H * GAME.GROUND_PERCENT;
const DRAGON_X = SCREEN_W * GAME.DRAGON_X_PERCENT;
const DRAGON_SIZE = GAME.DRAGON_SIZE;
const GROUND_HEIGHT = SCREEN_H - GROUND_Y;

interface BuildingData {
  x: number;
  w: number;
  h: number;
}

interface LayerData {
  buildings: BuildingData[];
  totalWidth: number;
}

function generateBuildings(
  count: number,
  maxW: number,
  maxH: number,
): LayerData {
  const buildings: BuildingData[] = [];
  let x = 0;
  for (let i = 0; i < count; i++) {
    const w = 18 + Math.random() * maxW;
    const h = 20 + Math.random() * maxH;
    buildings.push({ x, w, h });
    x += w + 6 + Math.random() * 28;
  }
  return { buildings, totalWidth: x };
}

function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

function createInitialState(): GameStateData {
  return {
    dragonY: GROUND_Y - DRAGON_SIZE / 2,
    dragonVy: 0,
    onGround: true,
    isGliding: false,
    jumpsRemaining: GAME.MAX_JUMPS,
    obstacles: [],
    rings: [],
    score: 0,
    ringsCollected: 0,
    speed: GAME.BASE_SPEED,
    distance: 0,
    worldType: 'futuristic',
    isGameOver: false,
    isRunning: false,
    nextSpawnAt: GAME.SPAWN_DISTANCE,
    nextId: 0,
    bgOffset: 0,
  };
}

function spawnObjects(state: GameStateData) {
  const baseX = SCREEN_W + 60;
  const fromCeiling = Math.random() < 0.15;
  const obsWidth = 28 + Math.random() * 28;
  const obsHeight = fromCeiling
    ? 70 + Math.random() * 90
    : 45 + Math.random() * 75;

  state.obstacles.push({
    id: state.nextId++,
    x: baseX,
    y: fromCeiling ? 0 : GROUND_Y - obsHeight,
    width: obsWidth,
    height: obsHeight,
    fromCeiling,
  });

  const ringCount = 2 + Math.floor(Math.random() * 3);
  const types: RingType[] = ['fire', 'jade', 'chaos'];
  for (let i = 0; i < ringCount; i++) {
    state.rings.push({
      id: state.nextId++,
      x: baseX + 90 + i * 36,
      y: GROUND_Y - 65 - Math.random() * (GROUND_Y * 0.45),
      type: types[Math.floor(Math.random() * types.length)],
      collected: false,
    });
  }
}

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const gameRef = useRef<GameStateData>(createInitialState());
  const animFrameRef = useRef<number>(0);
  const touchRef = useRef<boolean>(false);
  const highScoreRef = useRef<number>(0);

  const [render, setRender] = useState<GameStateData>(createInitialState());
  const [highScore, setHighScore] = useState<number>(0);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [showReady, setShowReady] = useState<boolean>(true);

  const gameOverAnim = useRef(new RNAnimated.Value(0)).current;
  const shakeAnim = useRef(new RNAnimated.Value(0)).current;

  const farLayer = useMemo(() => generateBuildings(14, 45, 90), []);
  const nearLayer = useMemo(() => generateBuildings(12, 35, 55), []);

  const stars = useMemo(
    () =>
      Array.from({ length: 20 }, () => ({
        x: Math.random() * SCREEN_W,
        y: Math.random() * GROUND_Y * 0.6,
        size: 1 + Math.random() * 2,
      })),
    [],
  );

  useEffect(() => {
    AsyncStorage.getItem(GAME.HIGH_SCORE_KEY).then((v) => {
      if (v) {
        const val = parseInt(v, 10);
        setHighScore(val);
        highScoreRef.current = val;
      }
    });
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const gameLoop = useCallback(function loop() {
    const state = gameRef.current;
    if (!state.isRunning || state.isGameOver) return;

    const grav = state.isGliding ? GAME.GLIDE_GRAVITY : GAME.GRAVITY;
    state.dragonVy += grav;
    state.dragonY += state.dragonVy;

    if (state.dragonY > GROUND_Y - DRAGON_SIZE / 2) {
      state.dragonY = GROUND_Y - DRAGON_SIZE / 2;
      state.dragonVy = 0;
      state.onGround = true;
      state.isGliding = false;
      state.jumpsRemaining = GAME.MAX_JUMPS;
    } else {
      state.onGround = false;
    }

    if (state.dragonY < 20) {
      state.dragonY = 20;
      state.dragonVy = 1;
    }

    for (const o of state.obstacles) o.x -= state.speed;
    for (const r of state.rings) r.x -= state.speed;

    state.obstacles = state.obstacles.filter((o) => o.x > -100);
    state.rings = state.rings.filter((r) => r.x > -60);

    state.distance += state.speed;
    state.bgOffset += state.speed;

    if (state.distance >= state.nextSpawnAt) {
      spawnObjects(state);
      state.nextSpawnAt =
        state.distance + GAME.SPAWN_DISTANCE + Math.random() * 130;
    }

    const dh = {
      x: DRAGON_X - DRAGON_SIZE * 0.2,
      y: state.dragonY - DRAGON_SIZE * 0.2,
      w: DRAGON_SIZE * 0.4,
      h: DRAGON_SIZE * 0.4,
    };

    let hit = false;
    for (const o of state.obstacles) {
      if (
        rectsOverlap(dh, { x: o.x, y: o.y, w: o.width, h: o.height })
      ) {
        hit = true;
        break;
      }
    }

    if (hit) {
      state.isGameOver = true;
      state.isRunning = false;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      if (state.score > highScoreRef.current) {
        highScoreRef.current = state.score;
        setHighScore(state.score);
        setIsNewHighScore(true);
        AsyncStorage.setItem(GAME.HIGH_SCORE_KEY, state.score.toString());
      }

      setRender({
        ...state,
        obstacles: state.obstacles.map((o) => ({ ...o })),
        rings: state.rings.map((r) => ({ ...r })),
      });
      return;
    }

    for (const r of state.rings) {
      if (
        !r.collected &&
        rectsOverlap(dh, { x: r.x - 14, y: r.y - 14, w: 28, h: 28 })
      ) {
        r.collected = true;
        state.ringsCollected++;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    state.speed = Math.min(GAME.MAX_SPEED, state.speed + GAME.SPEED_INCREMENT);
    state.score = Math.floor(state.distance / 10);

    const worldIdx = Math.floor(state.distance / GAME.WORLD_SHIFT_DISTANCE);
    state.worldType =
      worldIdx % 2 === 0 ? 'futuristic' : 'ancient';

    if (touchRef.current && !state.onGround) {
      state.isGliding = true;
    } else if (!touchRef.current) {
      state.isGliding = false;
    }

    setRender({
      ...state,
      obstacles: state.obstacles.map((o) => ({ ...o })),
      rings: state.rings.filter((r) => !r.collected).map((r) => ({ ...r })),
    });

    animFrameRef.current = requestAnimationFrame(loop);
  }, []);

  const startGame = useCallback(() => {
    const state = createInitialState();
    state.isRunning = true;
    gameRef.current = state;
    setShowReady(false);
    setIsNewHighScore(false);
    gameOverAnim.setValue(0);
    shakeAnim.setValue(0);
    setRender({ ...state });
    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const handleRetry = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startGame();
  }, [startGame]);

  const handleTouchStart = useCallback(() => {
    touchRef.current = true;
    const state = gameRef.current;

    if (state.isGameOver) return;
    if (!state.isRunning) {
      startGame();
      return;
    }

    if (state.jumpsRemaining > 0) {
      const force =
        state.jumpsRemaining === GAME.MAX_JUMPS
          ? GAME.JUMP_FORCE
          : GAME.JUMP_FORCE * 0.75;
      state.dragonVy = force;
      state.onGround = false;
      state.jumpsRemaining--;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [startGame]);

  const handleTouchEnd = useCallback(() => {
    touchRef.current = false;
  }, []);

  useEffect(() => {
    if (render.isGameOver) {
      RNAnimated.parallel([
        RNAnimated.spring(gameOverAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        RNAnimated.sequence([
          RNAnimated.timing(shakeAnim, {
            toValue: 8,
            duration: 40,
            useNativeDriver: true,
          }),
          RNAnimated.timing(shakeAnim, {
            toValue: -8,
            duration: 40,
            useNativeDriver: true,
          }),
          RNAnimated.timing(shakeAnim, {
            toValue: 5,
            duration: 40,
            useNativeDriver: true,
          }),
          RNAnimated.timing(shakeAnim, {
            toValue: -3,
            duration: 40,
            useNativeDriver: true,
          }),
          RNAnimated.timing(shakeAnim, {
            toValue: 0,
            duration: 40,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [render.isGameOver]);

  const world =
    render.worldType === 'futuristic'
      ? GameColors.futuristic
      : GameColors.ancient;

  const farTotalW = farLayer.totalWidth || 1;
  const nearTotalW = nearLayer.totalWidth || 1;
  const farOffset = -(render.bgOffset * 0.3) % farTotalW;
  const nearOffset = -(render.bgOffset * 0.6) % nearTotalW;

  const dragonRotation = `${Math.max(-25, Math.min(25, render.dragonVy * 2.5))}deg`;

  const gameOverScale = gameOverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden />

      <RNAnimated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        <LinearGradient
          colors={[...world.sky]}
          style={StyleSheet.absoluteFill}
        />

        {stars.map((s, i) => (
          <View
            key={i}
            style={{
              position: 'absolute' as const,
              left: s.x,
              top: s.y,
              width: s.size,
              height: s.size,
              borderRadius: s.size / 2,
              backgroundColor: world.star,
            }}
          />
        ))}

        <View style={[styles.parallaxLayer, { bottom: GROUND_HEIGHT }]}>
          {[0, 1].map((copy) =>
            farLayer.buildings.map((b, i) => (
              <View
                key={`f${copy}-${i}`}
                style={{
                  position: 'absolute' as const,
                  left: farOffset + b.x + copy * farTotalW,
                  bottom: 0,
                  width: b.w,
                  height: b.h,
                  backgroundColor: world.building1,
                  borderTopLeftRadius: 2,
                  borderTopRightRadius: 2,
                }}
              />
            )),
          )}
        </View>

        <View style={[styles.parallaxLayer, { bottom: GROUND_HEIGHT }]}>
          {[0, 1].map((copy) =>
            nearLayer.buildings.map((b, i) => (
              <View
                key={`n${copy}-${i}`}
                style={{
                  position: 'absolute' as const,
                  left: nearOffset + b.x + copy * nearTotalW,
                  bottom: 0,
                  width: b.w,
                  height: b.h * 0.6,
                  backgroundColor: world.building2,
                  borderTopLeftRadius: 2,
                  borderTopRightRadius: 2,
                }}
              />
            )),
          )}
        </View>

        <View
          style={[
            styles.ground,
            { top: GROUND_Y, height: GROUND_HEIGHT },
          ]}
        >
          <View
            style={[styles.groundLine, { backgroundColor: world.groundLine }]}
          />
          <View
            style={[styles.groundFill, { backgroundColor: world.ground }]}
          />
        </View>

        {render.obstacles.map((o) => (
          <View
            key={o.id}
            style={[
              styles.obstacle,
              {
                left: o.x,
                top: o.y,
                width: o.width,
                height: o.height,
                backgroundColor: world.obstacleBase,
                borderColor: world.obstacleEdge,
                borderTopLeftRadius: o.fromCeiling ? 0 : 4,
                borderTopRightRadius: o.fromCeiling ? 0 : 4,
                borderBottomLeftRadius: o.fromCeiling ? 4 : 0,
                borderBottomRightRadius: o.fromCeiling ? 4 : 0,
              },
            ]}
          >
            <View
              style={[
                styles.obstacleStripe,
                { backgroundColor: world.obstacleEdge },
              ]}
            />
          </View>
        ))}

        {render.rings
          .filter((r) => !r.collected)
          .map((r) => (
            <View
              key={r.id}
              style={[
                styles.ring,
                {
                  left: r.x - GAME.RING_SIZE / 2,
                  top: r.y - GAME.RING_SIZE / 2,
                  borderColor: GameColors.ring[r.type] ?? '#ffd700',
                },
              ]}
            >
              <View
                style={[
                  styles.ringDot,
                  {
                    backgroundColor: GameColors.ring[r.type] ?? '#ffd700',
                  },
                ]}
              />
            </View>
          ))}

        <View
          style={[
            styles.dragon,
            {
              left: DRAGON_X - DRAGON_SIZE * 0.7,
              top: render.dragonY - DRAGON_SIZE / 2,
              transform: [{ rotate: dragonRotation }],
            },
          ]}
        >
          <DragonSprite
            size={DRAGON_SIZE}
            isGliding={render.isGliding}
            velocity={render.dragonVy}
          />
        </View>
      </RNAnimated.View>

      <View style={[styles.hud, { top: insets.top + 8 }]} pointerEvents="none">
        <View style={styles.hudItem}>
          <Text style={[styles.hudLabel, { color: world.accent }]}>
            SCORE
          </Text>
          <Text style={styles.hudValue}>{render.score}</Text>
        </View>
        <View style={styles.hudCenter}>
          <Text
            style={[
              styles.hudWorldLabel,
              { color: world.accent },
            ]}
          >
            {render.worldType === 'futuristic'
              ? '⚡ NEON CITY'
              : '🏯 ANCIENT REALM'}
          </Text>
        </View>
        <View style={styles.hudItemRight}>
          <Flame size={14} color={GameColors.ring.fire} />
          <Text style={styles.hudValue}>{render.ringsCollected}</Text>
        </View>
      </View>

      {showReady && (
        <Pressable
          style={styles.overlay}
          onPressIn={handleTouchStart}
          onPressOut={handleTouchEnd}
        >
          <View style={styles.readyCard}>
            <Text style={styles.readyTitle}>READY?</Text>
            <View style={styles.readyDivider} />
            <Text style={styles.readyHint}>Tap anywhere to start</Text>
          </View>
        </Pressable>
      )}

      {!showReady && !render.isGameOver && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPressIn={handleTouchStart}
          onPressOut={handleTouchEnd}
        />
      )}

      {render.isGameOver && (
        <View style={styles.overlay}>
          <RNAnimated.View
            style={[
              styles.gameOverCard,
              {
                opacity: gameOverAnim,
                transform: [{ scale: gameOverScale }],
              },
            ]}
          >
            <Text style={styles.gameOverTitle}>GAME OVER</Text>

            {isNewHighScore && (
              <View style={styles.newHighScoreBadge}>
                <Trophy size={14} color={GameColors.ui.gold} />
                <Text style={styles.newHighScoreText}>NEW BEST!</Text>
              </View>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>SCORE</Text>
                <Text style={styles.statValue}>{render.score}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>RINGS</Text>
                <Text style={styles.statValue}>
                  {render.ringsCollected}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>BEST</Text>
                <Text
                  style={[styles.statValue, { color: GameColors.ui.gold }]}
                >
                  {highScore}
                </Text>
              </View>
            </View>

            <View style={styles.gameOverButtons}>
              <Pressable
                onPress={handleRetry}
                testID="retry-button"
                style={({ pressed }) => [
                  styles.goButton,
                  styles.retryButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <RotateCcw size={16} color={GameColors.ui.neonCyan} />
                <Text
                  style={[
                    styles.goButtonText,
                    { color: GameColors.ui.neonCyan },
                  ]}
                >
                  RETRY
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                testID="menu-button"
                style={({ pressed }) => [
                  styles.goButton,
                  styles.menuButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Home size={16} color={GameColors.ui.whiteTransparent} />
                <Text
                  style={[
                    styles.goButtonText,
                    { color: GameColors.ui.whiteTransparent },
                  ]}
                >
                  MENU
                </Text>
              </Pressable>
            </View>
          </RNAnimated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060610',
  },
  parallaxLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 200,
  },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  groundLine: {
    height: 2,
    shadowColor: '#00e8ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  groundFill: {
    flex: 1,
  },
  obstacle: {
    position: 'absolute',
    borderWidth: 1,
    overflow: 'hidden',
  },
  obstacleStripe: {
    position: 'absolute',
    left: 3,
    top: 0,
    bottom: 0,
    width: 2,
    opacity: 0.25,
  },
  ring: {
    position: 'absolute',
    width: GAME.RING_SIZE,
    height: GAME.RING_SIZE,
    borderRadius: GAME.RING_SIZE / 2,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.5,
  },
  dragon: {
    position: 'absolute',
  },
  hud: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 80,
  },
  hudItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 80,
    justifyContent: 'flex-end',
  },
  hudCenter: {
    alignItems: 'center',
  },
  hudLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  hudValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  hudWorldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyCard: {
    alignItems: 'center',
    padding: 30,
  },
  readyTitle: {
    fontSize: 50,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 8,
    textShadowColor: 'rgba(0,232,255,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  readyDivider: {
    width: 40,
    height: 2,
    backgroundColor: GameColors.ui.neonCyan,
    marginVertical: 14,
    borderRadius: 1,
    opacity: 0.5,
  },
  readyHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1,
  },
  gameOverCard: {
    backgroundColor: 'rgba(8,8,18,0.95)',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  gameOverTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: GameColors.ui.red,
    letterSpacing: 4,
    marginBottom: 10,
    textShadowColor: 'rgba(255,50,68,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  newHighScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,200,0,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 14,
  },
  newHighScoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: GameColors.ui.gold,
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginBottom: 22,
    marginTop: 6,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 55,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  gameOverButtons: {
    flexDirection: 'row',
    gap: 14,
  },
  goButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  retryButton: {
    borderColor: GameColors.ui.neonCyan,
  },
  menuButton: {
    borderColor: 'rgba(255,255,255,0.2)',
  },
  goButtonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
