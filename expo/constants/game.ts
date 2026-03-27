export const GAME = {
  GRAVITY: 0.55,
  JUMP_FORCE: -12,
  GLIDE_GRAVITY: 0.13,
  BASE_SPEED: 3.5,
  MAX_SPEED: 10,
  SPEED_INCREMENT: 0.002,
  DRAGON_SIZE: 44,
  RING_SIZE: 24,
  GROUND_PERCENT: 0.78,
  DRAGON_X_PERCENT: 0.15,
  SPAWN_DISTANCE: 260,
  WORLD_SHIFT_DISTANCE: 2500,
  HIGH_SCORE_KEY: 'dragon_dash_high_score',
  HIGH_RINGS_KEY: 'dragon_dash_high_rings',
  MAX_JUMPS: 2,
} as const;

export type WorldType = 'futuristic' | 'ancient';
export type RingType = 'fire' | 'jade' | 'chaos';

export interface ObstacleData {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fromCeiling: boolean;
}

export interface RingData {
  id: number;
  x: number;
  y: number;
  type: RingType;
  collected: boolean;
}

export interface GameStateData {
  dragonY: number;
  dragonVy: number;
  onGround: boolean;
  isGliding: boolean;
  jumpsRemaining: number;
  obstacles: ObstacleData[];
  rings: RingData[];
  score: number;
  ringsCollected: number;
  speed: number;
  distance: number;
  worldType: WorldType;
  isGameOver: boolean;
  isRunning: boolean;
  nextSpawnAt: number;
  nextId: number;
  bgOffset: number;
}
