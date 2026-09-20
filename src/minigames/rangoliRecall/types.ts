export type Difficulty = 'easy' | 'medium' | 'difficult';

export type PetalColor = 'orange' | 'yellow' | 'pink' | 'purple' | 'blue';

export interface PetalDefinition {
  id: PetalColor;
  name: string;
  hindiName: string;
  flowerType: string;
  hex: string;
  lightHex: string;
  glowHex: string;
  borderClass: string;
  textClass: string;
  iconName: 'sun' | 'sparkles' | 'heart' | 'diamond' | 'droplet';
}

export const PETAL_COLORS: Record<PetalColor, PetalDefinition> = {
  orange: {
    id: 'orange',
    name: 'Orange Petal',
    hindiName: 'Genda',
    flowerType: 'Marigold Petal',
    hex: '#f97316',
    lightHex: '#fdba74',
    glowHex: 'rgba(249, 115, 22, 0.45)',
    borderClass: 'border-orange-400',
    textClass: 'text-orange-400',
    iconName: 'sun',
  },
  yellow: {
    id: 'yellow',
    name: 'Yellow Petal',
    hindiName: 'Peela',
    flowerType: 'Jasmine Sun',
    hex: '#eab308',
    lightHex: '#fde047',
    glowHex: 'rgba(234, 179, 8, 0.45)',
    borderClass: 'border-yellow-400',
    textClass: 'text-yellow-400',
    iconName: 'sparkles',
  },
  pink: {
    id: 'pink',
    name: 'Pink Petal',
    hindiName: 'Gulabi',
    flowerType: 'Rose Petal',
    hex: '#ec4899',
    lightHex: '#f472b6',
    glowHex: 'rgba(236, 72, 153, 0.45)',
    borderClass: 'border-pink-400',
    textClass: 'text-pink-400',
    iconName: 'heart',
  },
  purple: {
    id: 'purple',
    name: 'Purple Petal',
    hindiName: 'Aparajita',
    flowerType: 'Orchid Petal',
    hex: '#a855f7',
    lightHex: '#c084fc',
    glowHex: 'rgba(168, 85, 247, 0.45)',
    borderClass: 'border-purple-400',
    textClass: 'text-purple-400',
    iconName: 'diamond',
  },
  blue: {
    id: 'blue',
    name: 'Blue Petal',
    hindiName: 'Neelkamal',
    flowerType: 'Blue Lotus',
    hex: '#3b82f6',
    lightHex: '#93c5fd',
    glowHex: 'rgba(59, 130, 246, 0.45)',
    borderClass: 'border-blue-400',
    textClass: 'text-blue-400',
    iconName: 'droplet',
  },
};

export interface RangoliPattern {
  id: string;
  name: string;
  theme: string;
  difficulty: Difficulty;
  gridSize: 3 | 4 | 5;
  availableColors: PetalColor[];
  requiredCount: number; // Number of colored cells in the pattern
  cells: (PetalColor | null)[]; // row-major array of size gridSize * gridSize
}

export type GamePhase = 'WELCOME' | 'MEMORIZE' | 'REBUILD' | 'RESULTS';

export type PatternRating = 'PERFECT MATCH' | 'EXCELLENT' | 'GOOD' | 'KEEP PRACTICING';

export interface CellComparison {
  index: number;
  row: number;
  col: number;
  targetColor: PetalColor | null;
  playerColor: PetalColor | null;
  isCorrect: boolean;
}

export interface LevelResultStats {
  patternId: string;
  patternName: string;
  difficulty: Difficulty;
  levelNumber: number;
  rating: PatternRating;
  accuracy: number; // 0..100
  correctCells: number;
  wrongCells: number;
  totalRequired: number;
  timeRemaining: number;
  timeTaken: number;
  basePoints: number;
  perfectBonus: number;
  timeBonus: number;
  hintPenalty: number;
  difficultyMultiplier: number;
  totalScore: number;
  coinsEarned: number;
  isPerfect: boolean;
  unlockedNewDifficulty: 'medium' | 'difficult' | null;
  comparison: CellComparison[];
}

export interface RangoliSaveData {
  easyCompleted: number;
  mediumCompleted: number;
  difficultCompleted: number;
  highScore: number;
  unlockedDifficulties: Difficulty[];
  bestCompletionTime: number; // in seconds
  totalPerfectPatterns: number;
  completedLevelIds: string[];
}

export interface DifficultyConfig {
  difficulty: Difficulty;
  title: string;
  gridSize: 3 | 4 | 5;
  memorizeSeconds: number;
  rebuildSeconds: number;
  availableColors: PetalColor[];
  scoreMultiplier: number;
  hintPenalty: number;
  isHintFree: boolean;
  unlockThresholdScore: number;
  unlockThresholdAccuracy: number;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    difficulty: 'easy',
    title: 'Easy',
    gridSize: 3,
    memorizeSeconds: 5,
    rebuildSeconds: 35,
    availableColors: ['orange', 'yellow', 'pink'],
    scoreMultiplier: 1.0,
    hintPenalty: 0,
    isHintFree: true,
    unlockThresholdScore: 60,
    unlockThresholdAccuracy: 60,
  },
  medium: {
    difficulty: 'medium',
    title: 'Medium',
    gridSize: 4,
    memorizeSeconds: 4,
    rebuildSeconds: 30,
    availableColors: ['orange', 'yellow', 'pink', 'purple'],
    scoreMultiplier: 1.5,
    hintPenalty: 100,
    isHintFree: false,
    unlockThresholdScore: 70,
    unlockThresholdAccuracy: 70,
  },
  difficult: {
    difficulty: 'difficult',
    title: 'Difficult',
    gridSize: 5,
    memorizeSeconds: 3,
    rebuildSeconds: 25,
    availableColors: ['orange', 'yellow', 'pink', 'purple', 'blue'],
    scoreMultiplier: 2.0,
    hintPenalty: 250,
    isHintFree: false,
    unlockThresholdScore: 60,
    unlockThresholdAccuracy: 60,
  },
};
