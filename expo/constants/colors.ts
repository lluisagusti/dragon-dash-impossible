export const GameColors = {
  darkBg: '#080810',

  futuristic: {
    sky: ['#0a0a2e', '#12083e', '#0a1628'] as const,
    building1: '#0c0c1e',
    building2: '#141428',
    ground: '#0a0a18',
    groundLine: '#00e8ff',
    accent: '#00e8ff',
    accent2: '#ff0080',
    obstacleBase: '#0d1a2a',
    obstacleEdge: '#00e8ff',
    star: 'rgba(0, 232, 255, 0.4)',
  },

  ancient: {
    sky: ['#1a0800', '#2d1200', '#1a0f04'] as const,
    building1: '#1a0f05',
    building2: '#24180a',
    ground: '#1a0f05',
    groundLine: '#ffc800',
    accent: '#ffc800',
    accent2: '#ff4500',
    obstacleBase: '#2a1a0a',
    obstacleEdge: '#ffc800',
    star: 'rgba(255, 200, 0, 0.3)',
  },

  dragon: {
    body: '#00ff88',
    dark: '#00cc66',
    belly: '#66ffbb',
    eye: '#ff6b35',
    wing: '#00aa55',
    glow: 'rgba(0, 255, 136, 0.3)',
  },

  ring: {
    fire: '#ff6b35',
    jade: '#00e68a',
    chaos: '#ff4488',
  } as Record<string, string>,

  ui: {
    white: '#ffffff',
    whiteTransparent: 'rgba(255,255,255,0.6)',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.7)',
    neonCyan: '#00e8ff',
    gold: '#ffc800',
    red: '#ff3344',
  },
};
