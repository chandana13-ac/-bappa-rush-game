import { Difficulty, RangoliSaveData } from './types';

const STORAGE_KEY = 'rangoli_recall_save_v2';

export const DEFAULT_RANGOLI_SAVE: RangoliSaveData = {
  easyCompleted: 0,
  mediumCompleted: 0,
  difficultCompleted: 0,
  highScore: 0,
  unlockedDifficulties: ['easy'],
  bestCompletionTime: 0,
  totalPerfectPatterns: 0,
  completedLevelIds: [],
};

export class RangoliSaveManager {
  private static instance: RangoliSaveManager | null = null;
  private data: RangoliSaveData;

  private constructor() {
    this.data = this.load();
  }

  public static getInstance(): RangoliSaveManager {
    if (!RangoliSaveManager.instance) {
      RangoliSaveManager.instance = new RangoliSaveManager();
    }
    return RangoliSaveManager.instance;
  }

  private load(): RangoliSaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const unlocked = Array.isArray(parsed.unlockedDifficulties)
          ? parsed.unlockedDifficulties
          : ['easy'];

        if (!unlocked.includes('easy')) {
          unlocked.unshift('easy');
        }

        // Auto verify unlock rules on load in case counts were satisfied
        const easyCount = Number(parsed.easyCompleted) || 0;
        const medCount = Number(parsed.mediumCompleted) || 0;

        if (easyCount >= 3 && !unlocked.includes('medium')) {
          unlocked.push('medium');
        }
        if (medCount >= 3 && !unlocked.includes('difficult')) {
          unlocked.push('difficult');
        }

        return {
          easyCompleted: easyCount,
          mediumCompleted: medCount,
          difficultCompleted: Number(parsed.difficultCompleted) || 0,
          highScore: Number(parsed.highScore) || 0,
          unlockedDifficulties: unlocked as Difficulty[],
          bestCompletionTime: Number(parsed.bestCompletionTime) || 0,
          totalPerfectPatterns: Number(parsed.totalPerfectPatterns) || 0,
          completedLevelIds: Array.isArray(parsed.completedLevelIds) ? parsed.completedLevelIds : [],
        };
      }
    } catch {
      // Storage failure fallback
    }
    return { ...DEFAULT_RANGOLI_SAVE };
  }

  public getData(): RangoliSaveData {
    return { ...this.data };
  }

  public save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // ignore
    }
  }

  public recordLevelCompletion(params: {
    difficulty: Difficulty;
    patternId: string;
    score: number;
    accuracy: number;
    timeTaken: number;
    isPerfect: boolean;
  }): { unlockedNewDifficulty: 'medium' | 'difficult' | null } {
    let unlockedNewDifficulty: 'medium' | 'difficult' | null = null;

    // Check if score satisfies threshold
    const qualifies =
      (params.difficulty === 'easy' && params.accuracy >= 60) ||
      (params.difficulty === 'medium' && params.accuracy >= 70) ||
      (params.difficulty === 'difficult' && params.accuracy >= 60);

    const isNewPattern = !this.data.completedLevelIds.includes(params.patternId);

    if (qualifies) {
      if (isNewPattern) {
        this.data.completedLevelIds.push(params.patternId);
        if (params.difficulty === 'easy') {
          this.data.easyCompleted += 1;
        } else if (params.difficulty === 'medium') {
          this.data.mediumCompleted += 1;
        } else if (params.difficulty === 'difficult') {
          this.data.difficultCompleted += 1;
        }
      }

      if (params.isPerfect) {
        this.data.totalPerfectPatterns += 1;
      }

      if (params.score > this.data.highScore) {
        this.data.highScore = params.score;
      }

      if (this.data.bestCompletionTime === 0 || params.timeTaken < this.data.bestCompletionTime) {
        this.data.bestCompletionTime = params.timeTaken;
      }

      // Check unlock conditions
      if (this.data.easyCompleted >= 3 && !this.data.unlockedDifficulties.includes('medium')) {
        this.data.unlockedDifficulties.push('medium');
        unlockedNewDifficulty = 'medium';
      }

      if (this.data.mediumCompleted >= 3 && !this.data.unlockedDifficulties.includes('difficult')) {
        this.data.unlockedDifficulties.push('difficult');
        unlockedNewDifficulty = 'difficult';
      }

      this.save();
    }

    return { unlockedNewDifficulty };
  }

  public isDifficultyUnlocked(diff: Difficulty): boolean {
    if (diff === 'easy') return true;
    return this.data.unlockedDifficulties.includes(diff);
  }

  public resetAll(): void {
    this.data = { ...DEFAULT_RANGOLI_SAVE };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
