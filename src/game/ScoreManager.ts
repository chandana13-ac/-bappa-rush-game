import { Objective, MinigameId } from './GameState';

export interface ScoreState {
  score: number;
  coins: number;
  combo: number;
  comboMultiplier: number;
  comboTimeRemaining: number; // in seconds
  chaosLevel: number; // 0 to 100%
  objectives: Objective[];
}

export class ScoreManager {
  private static instance: ScoreManager | null = null;
  private state: ScoreState;
  private listeners: Array<(state: ScoreState) => void> = [];
  private comboMaxTime = 4.0; // 4 seconds before combo drops

  private constructor() {
    this.state = this.getInitialState();
  }

  public static getInstance(): ScoreManager {
    if (!ScoreManager.instance) {
      ScoreManager.instance = new ScoreManager();
    }
    return ScoreManager.instance;
  }

  private getInitialState(): ScoreState {
    return {
      score: 0,
      coins: 0,
      combo: 0,
      comboMultiplier: 1.0,
      comboTimeRemaining: 0,
      chaosLevel: 25, // Start with modest chaos
      objectives: [
        {
          id: 'obj_diya',
          title: 'Light 10 Temple Diyas',
          stationId: 'diyaDash',
          targetCount: 10,
          currentCount: 0,
          completed: false,
          rewardCoins: 50,
        },
        {
          id: 'obj_rangoli',
          title: 'Complete 3 Rangoli Patterns',
          stationId: 'rangoliRecall',
          targetCount: 3,
          currentCount: 0,
          completed: false,
          rewardCoins: 75,
        },
        {
          id: 'obj_modak',
          title: 'Catch 15 Steaming Modaks',
          stationId: 'modakFactory',
          targetCount: 15,
          currentCount: 0,
          completed: false,
          rewardCoins: 60,
        },
        {
          id: 'obj_dhol',
          title: 'Hit 20 Dhol Rhythm Beats',
          stationId: 'dholEcho',
          targetCount: 20,
          currentCount: 0,
          completed: false,
          rewardCoins: 80,
        },
        {
          id: 'obj_pandal',
          title: 'Place 11 Pandal Decorations',
          stationId: 'pandalPerfect',
          targetCount: 11,
          currentCount: 0,
          completed: false,
          rewardCoins: 120,
        },
      ],
    };
  }

  public resetRun(): void {
    this.state = this.getInitialState();
    this.notify();
  }

  public getState(): ScoreState {
    return {
      ...this.state,
      objectives: this.state.objectives.map((o) => ({ ...o })),
    };
  }

  public addScore(basePoints: number, triggerCombo = true): void {
    if (triggerCombo) {
      this.state.combo += 1;
      this.state.comboTimeRemaining = this.comboMaxTime;
      // Multiplier steps: 1x, 1.2x, 1.5x, 2.0x, 3.0x max
      if (this.state.combo >= 15) this.state.comboMultiplier = 3.0;
      else if (this.state.combo >= 10) this.state.comboMultiplier = 2.5;
      else if (this.state.combo >= 5) this.state.comboMultiplier = 2.0;
      else if (this.state.combo >= 2) this.state.comboMultiplier = 1.5;
      else this.state.comboMultiplier = 1.0;
    }

    const earned = Math.round(basePoints * this.state.comboMultiplier);
    this.state.score += earned;
    // Lower chaos slightly when performing well
    this.adjustChaos(-3);
    this.notify();
  }

  public addCoins(amount: number): void {
    this.state.coins += amount;
    this.notify();
  }

  public adjustChaos(delta: number): void {
    this.state.chaosLevel = Math.max(0, Math.min(100, this.state.chaosLevel + delta));
    this.notify();
  }

  public progressObjective(stationId: MinigameId, increment = 1): void {
    let completedAny = false;
    this.state.objectives = this.state.objectives.map((obj) => {
      if (obj.stationId === stationId && !obj.completed) {
        const newCount = Math.min(obj.targetCount, obj.currentCount + increment);
        const justDone = newCount >= obj.targetCount;
        if (justDone) {
          completedAny = true;
          this.state.coins += obj.rewardCoins;
          this.state.score += 500;
        }
        return {
          ...obj,
          currentCount: newCount,
          completed: justDone,
        };
      }
      return obj;
    });

    if (completedAny) {
      this.adjustChaos(-15);
    }
    this.notify();
  }

  public update(deltaSeconds: number): void {
    if (this.state.combo > 0) {
      this.state.comboTimeRemaining -= deltaSeconds;
      if (this.state.comboTimeRemaining <= 0) {
        this.state.combo = 0;
        this.state.comboMultiplier = 1.0;
        this.state.comboTimeRemaining = 0;
        this.notify();
      }
    }
  }

  public subscribe(listener: (state: ScoreState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const copy = this.getState();
    for (const listener of this.listeners) {
      listener(copy);
    }
  }
}
