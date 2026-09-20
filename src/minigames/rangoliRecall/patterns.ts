import { Difficulty, PetalColor, RangoliPattern } from './types';

// ============================================================================
// EASY PRESETS: 3x3 Grid, 3 Colors ('orange' | 'yellow' | 'pink'), 4-5 Colored Cells
// ============================================================================
export const EASY_PATTERNS: RangoliPattern[] = [
  {
    id: 'easy_01',
    name: 'Diya Cross',
    theme: 'Warm Temple Glow',
    difficulty: 'easy',
    gridSize: 3,
    availableColors: ['orange', 'yellow', 'pink'],
    requiredCount: 5,
    cells: [
      null,     'orange', null,
      'orange', 'yellow', 'orange',
      null,     'orange', null,
    ],
  },
  {
    id: 'easy_02',
    name: 'Lotus Blossom',
    theme: 'Sacred Bloom',
    difficulty: 'easy',
    gridSize: 3,
    availableColors: ['orange', 'yellow', 'pink'],
    requiredCount: 5,
    cells: [
      'pink',   null,     'pink',
      null,     'yellow', null,
      'pink',   null,     'pink',
    ],
  },
  {
    id: 'easy_03',
    name: 'Marigold Diamond',
    theme: 'Auspicious Courtyard',
    difficulty: 'easy',
    gridSize: 3,
    availableColors: ['orange', 'yellow', 'pink'],
    requiredCount: 4,
    cells: [
      null,     'yellow', null,
      'orange', null,     'orange',
      null,     'yellow', null,
    ],
  },
  {
    id: 'easy_04',
    name: 'Sunbeam Star',
    theme: 'Golden Dawn',
    difficulty: 'easy',
    gridSize: 3,
    availableColors: ['orange', 'yellow', 'pink'],
    requiredCount: 5,
    cells: [
      'orange', null,     'orange',
      null,     'pink',   null,
      'orange', null,     'orange',
    ],
  },
  {
    id: 'easy_05',
    name: 'Rose Kolam',
    theme: 'Festive Welcome',
    difficulty: 'easy',
    gridSize: 3,
    availableColors: ['orange', 'yellow', 'pink'],
    requiredCount: 5,
    cells: [
      null,     'pink',   null,
      'yellow', 'pink',   'yellow',
      null,     'pink',   null,
    ],
  },
  {
    id: 'easy_06',
    name: 'Amber Crescent',
    theme: 'Evening Aarti',
    difficulty: 'easy',
    gridSize: 3,
    availableColors: ['orange', 'yellow', 'pink'],
    requiredCount: 5,
    cells: [
      'yellow', 'orange', 'yellow',
      null,     'pink',   null,
      null,     null,     null,
    ],
  },
];

// ============================================================================
// MEDIUM PRESETS: 4x4 Grid, 4 Colors (+ 'purple'), 7-9 Colored Cells
// ============================================================================
export const MEDIUM_PATTERNS: RangoliPattern[] = [
  {
    id: 'medium_01',
    name: 'Peacock Ring',
    theme: 'Radiant Mandala',
    difficulty: 'medium',
    gridSize: 4,
    availableColors: ['orange', 'yellow', 'pink', 'purple'],
    requiredCount: 8,
    cells: [
      null,     'purple', 'purple', null,
      'purple', null,     null,     'purple',
      'yellow', null,     null,     'yellow',
      null,     'yellow', 'yellow', null,
    ],
  },
  {
    id: 'medium_02',
    name: 'Four Corners Flame',
    theme: 'Deepavali Quadrant',
    difficulty: 'medium',
    gridSize: 4,
    availableColors: ['orange', 'yellow', 'pink', 'purple'],
    requiredCount: 8,
    cells: [
      'orange', null,     null,     'orange',
      null,     'pink',   'pink',   null,
      null,     'pink',   'pink',   null,
      'orange', null,     null,     'orange',
    ],
  },
  {
    id: 'medium_03',
    name: 'Orchid Toran',
    theme: 'Festive Gateway',
    difficulty: 'medium',
    gridSize: 4,
    availableColors: ['orange', 'yellow', 'pink', 'purple'],
    requiredCount: 8,
    cells: [
      'purple', 'yellow', 'yellow', 'purple',
      null,     'orange', 'orange', null,
      null,     null,     null,     null,
      'purple', null,     null,     'purple',
    ],
  },
  {
    id: 'medium_04',
    name: 'Aparajita Diamond',
    theme: 'Royal Garland',
    difficulty: 'medium',
    gridSize: 4,
    availableColors: ['orange', 'yellow', 'pink', 'purple'],
    requiredCount: 8,
    cells: [
      null,     'pink',   'pink',   null,
      'purple', null,     null,     'purple',
      'purple', null,     null,     'purple',
      null,     'pink',   'pink',   null,
    ],
  },
  {
    id: 'medium_05',
    name: 'Golden Chakra',
    theme: 'Solar Wheel',
    difficulty: 'medium',
    gridSize: 4,
    availableColors: ['orange', 'yellow', 'pink', 'purple'],
    requiredCount: 9,
    cells: [
      'yellow', null,     null,     'yellow',
      null,     'orange', 'purple', null,
      null,     'purple', 'orange', null,
      'yellow', null,     null,     'yellow',
    ],
  },
  {
    id: 'medium_06',
    name: 'Lotus Blossom Quad',
    theme: 'Divine Petals',
    difficulty: 'medium',
    gridSize: 4,
    availableColors: ['orange', 'yellow', 'pink', 'purple'],
    requiredCount: 8,
    cells: [
      null,     'orange', null,     null,
      'pink',   'yellow', 'yellow', 'pink',
      'pink',   'yellow', 'yellow', 'pink',
      null,     'orange', null,     null,
    ],
  },
];

// ============================================================================
// DIFFICULT PRESETS: 5x5 Grid, 5 Colors (+ 'blue'), 12-15 Colored Cells
// ============================================================================
export const DIFFICULT_PATTERNS: RangoliPattern[] = [
  {
    id: 'hard_01',
    name: 'Neelkamal Mandala',
    theme: 'Sacred Cosmic Center',
    difficulty: 'difficult',
    gridSize: 5,
    availableColors: ['orange', 'yellow', 'pink', 'purple', 'blue'],
    requiredCount: 13,
    cells: [
      null,     null,     'blue',   null,     null,
      null,     'purple', 'yellow', 'purple', null,
      'blue',   'yellow', 'blue',   'yellow', 'blue',
      null,     'purple', 'yellow', 'purple', null,
      null,     null,     'blue',   null,     null,
    ],
  },
  {
    id: 'hard_02',
    name: 'Ganesh Yantra',
    theme: 'Eternal Auspicious Star',
    difficulty: 'difficult',
    gridSize: 5,
    availableColors: ['orange', 'yellow', 'pink', 'purple', 'blue'],
    requiredCount: 13,
    cells: [
      'orange', null,     'pink',   null,     'orange',
      null,     'blue',   null,     'blue',   null,
      'pink',   null,     'yellow', null,     'pink',
      null,     'blue',   null,     'blue',   null,
      'orange', null,     'pink',   null,     'orange',
    ],
  },
  {
    id: 'hard_03',
    name: 'Deepavali Chakra',
    theme: 'Temple Light Symphony',
    difficulty: 'difficult',
    gridSize: 5,
    availableColors: ['orange', 'yellow', 'pink', 'purple', 'blue'],
    requiredCount: 13,
    cells: [
      null,     'orange', 'yellow', 'orange', null,
      'orange', null,     'purple', null,     'orange',
      'yellow', 'purple', 'blue',   'purple', 'yellow',
      'orange', null,     'purple', null,     'orange',
      null,     'orange', 'yellow', 'orange', null,
    ],
  },
  {
    id: 'hard_04',
    name: 'Peacock Crown',
    theme: 'Royal Festivity',
    difficulty: 'difficult',
    gridSize: 5,
    availableColors: ['orange', 'yellow', 'pink', 'purple', 'blue'],
    requiredCount: 14,
    cells: [
      'blue',   null,     'yellow', null,     'blue',
      null,     'purple', 'pink',   'purple', null,
      'yellow', 'pink',   null,     'pink',   'yellow',
      null,     'purple', 'pink',   'purple', null,
      'blue',   null,     'yellow', null,     'blue',
    ],
  },
  {
    id: 'hard_05',
    name: 'Ananda Blossom',
    theme: 'Radiant Joy of Lights',
    difficulty: 'difficult',
    gridSize: 5,
    availableColors: ['orange', 'yellow', 'pink', 'purple', 'blue'],
    requiredCount: 13,
    cells: [
      null,     null,     'pink',   null,     null,
      null,     'blue',   'orange', 'blue',   null,
      'pink',   'orange', 'yellow', 'orange', 'pink',
      null,     'blue',   'orange', 'blue',   null,
      null,     null,     'pink',   null,     null,
    ],
  },
  {
    id: 'hard_06',
    name: 'Suryoday Toran',
    theme: 'Sun Mandala Glory',
    difficulty: 'difficult',
    gridSize: 5,
    availableColors: ['orange', 'yellow', 'pink', 'purple', 'blue'],
    requiredCount: 13,
    cells: [
      'orange', null,     null,     null,     'orange',
      null,     'yellow', 'purple', 'yellow', null,
      null,     'purple', 'blue',   'purple', null,
      null,     'yellow', 'purple', 'yellow', null,
      'orange', null,     null,     null,     'orange',
    ],
  },
];

/**
 * Deterministically generates a symmetric procedural pattern for endless replayability.
 */
export function generateProceduralPattern(
  difficulty: Difficulty,
  levelIndex: number
): RangoliPattern {
  if (difficulty === 'easy') {
    const colorPool: PetalColor[] = ['orange', 'yellow', 'pink'];
    const c1 = colorPool[levelIndex % colorPool.length];
    const c2 = colorPool[(levelIndex + 1) % colorPool.length];
    const cells: (PetalColor | null)[] = [
      null, c1,   null,
      c1,   c2,   c1,
      null, c1,   null,
    ];
    return {
      id: `easy_proc_${levelIndex}`,
      name: `Festive Kolam #${levelIndex}`,
      theme: 'Symmetric Petal Charm',
      difficulty: 'easy',
      gridSize: 3,
      availableColors: colorPool,
      requiredCount: 5,
      cells,
    };
  }

  if (difficulty === 'medium') {
    const colorPool: PetalColor[] = ['orange', 'yellow', 'pink', 'purple'];
    const c1 = colorPool[levelIndex % colorPool.length];
    const c2 = colorPool[(levelIndex + 2) % colorPool.length];
    const cells: (PetalColor | null)[] = [
      c1,   null, null, c1,
      null, c2,   c2,   null,
      null, c2,   c2,   null,
      c1,   null, null, c1,
    ];
    return {
      id: `med_proc_${levelIndex}`,
      name: `Mandala Ring #${levelIndex}`,
      theme: 'Courtyard Symmetry',
      difficulty: 'medium',
      gridSize: 4,
      availableColors: colorPool,
      requiredCount: 8,
      cells,
    };
  }

  // Difficult (5x5)
  const colorPool: PetalColor[] = ['orange', 'yellow', 'pink', 'purple', 'blue'];
  const c1 = colorPool[levelIndex % colorPool.length];
  const c2 = colorPool[(levelIndex + 1) % colorPool.length];
  const c3 = colorPool[(levelIndex + 3) % colorPool.length];
  const cells: (PetalColor | null)[] = [
    null, null, c1,   null, null,
    null, c2,   c3,   c2,   null,
    c1,   c3,   c1,   c3,   c1,
    null, c2,   c3,   c2,   null,
    null, null, c1,   null, null,
  ];
  return {
    id: `hard_proc_${levelIndex}`,
    name: `Royal Yantra #${levelIndex}`,
    theme: 'Sacred Floral Harmony',
    difficulty: 'difficult',
    gridSize: 5,
    availableColors: colorPool,
    requiredCount: 13,
    cells,
  };
}

/**
 * Gets a pattern by difficulty and level number (1-indexed).
 */
export function getPatternForLevel(
  difficulty: Difficulty,
  levelNumber: number,
  previousId?: string
): RangoliPattern {
  let list: RangoliPattern[];
  if (difficulty === 'easy') list = EASY_PATTERNS;
  else if (difficulty === 'medium') list = MEDIUM_PATTERNS;
  else list = DIFFICULT_PATTERNS;

  const zeroIdx = Math.max(0, levelNumber - 1);
  if (zeroIdx < list.length) {
    const candidate = list[zeroIdx];
    // If candidate equals previousId and there is an alternate, take next
    if (candidate.id === previousId && list.length > 1) {
      const altIdx = (zeroIdx + 1) % list.length;
      return list[altIdx];
    }
    return candidate;
  }

  // Fallback to deterministic procedural generation
  return generateProceduralPattern(difficulty, levelNumber);
}

/**
 * Difficulty Configuration parameters
 */
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
