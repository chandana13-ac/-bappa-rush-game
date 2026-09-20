export interface HighScoreEntry {
  playerName: string;
  score: number;
  date: string;
  festivalsCompleted: number;
  chaosManaged: number;
}

export interface SaveData {
  highScore: number;
  highScoresList: HighScoreEntry[];
  totalCoins: number;
  totalFestivalsCompleted: number;
  unlockedDecorations: string[];
  lastPlayedDate: string;
  hasCompletedTutorial: boolean;
}

const SAVE_KEY = 'bappa_rush_save_v1';

const DEFAULT_SAVE_DATA: SaveData = {
  highScore: 0,
  highScoresList: [
    {
      playerName: 'Ganesh Bhakt',
      score: 3500,
      date: 'Day 1',
      festivalsCompleted: 1,
      chaosManaged: 80,
    },
    {
      playerName: 'Festive Hero',
      score: 2200,
      date: 'Day 1',
      festivalsCompleted: 1,
      chaosManaged: 60,
    },
    {
      playerName: 'Modak Master',
      score: 1500,
      date: 'Day 1',
      festivalsCompleted: 0,
      chaosManaged: 40,
    },
  ],
  totalCoins: 100,
  totalFestivalsCompleted: 0,
  unlockedDecorations: ['basic_diyas', 'marigold_toran'],
  lastPlayedDate: new Date().toISOString().split('T')[0],
  hasCompletedTutorial: false,
};

export class SaveManager {
  private static instance: SaveManager | null = null;
  private data: SaveData;
  private listeners: Array<(data: SaveData) => void> = [];

  private constructor() {
    this.data = this.loadData();
  }

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  private loadData(): SaveData {
    try {
      const stored = localStorage.getItem(SAVE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_SAVE_DATA,
          ...parsed,
          highScoresList: parsed.highScoresList || DEFAULT_SAVE_DATA.highScoresList,
        };
      }
    } catch {
      // Storage unavailable or corrupt
    }
    return { ...DEFAULT_SAVE_DATA };
  }

  public getData(): SaveData {
    return { ...this.data };
  }

  public recordScore(score: number, playerName = 'Festival Volunteer', chaosManaged = 50): void {
    const isNewHigh = score > this.data.highScore;
    const newEntry: HighScoreEntry = {
      playerName,
      score,
      date: new Date().toISOString().split('T')[0],
      festivalsCompleted: this.data.totalFestivalsCompleted,
      chaosManaged,
    };

    const updatedList = [...this.data.highScoresList, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    this.data = {
      ...this.data,
      highScore: isNewHigh ? score : this.data.highScore,
      highScoresList: updatedList,
      lastPlayedDate: new Date().toISOString().split('T')[0],
    };

    this.save();
  }

  public addCoins(coins: number): void {
    this.data = {
      ...this.data,
      totalCoins: Math.max(0, this.data.totalCoins + coins),
    };
    this.save();
  }

  public hasCompletedTutorial(): boolean {
    return !!this.data.hasCompletedTutorial;
  }

  public setTutorialCompleted(completed = true): void {
    this.data = {
      ...this.data,
      hasCompletedTutorial: completed,
    };
    this.save();
  }

  public incrementFestivalsCompleted(): void {
    this.data = {
      ...this.data,
      totalFestivalsCompleted: this.data.totalFestivalsCompleted + 1,
    };
    this.save();
  }

  public clearAllData(): void {
    this.data = { ...DEFAULT_SAVE_DATA };
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // ignore
    }
    this.save();
  }

  private save(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      // safe fallback
    }
    for (const listener of this.listeners) {
      listener(this.data);
    }
  }

  public subscribe(listener: (data: SaveData) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}
