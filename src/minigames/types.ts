import { MinigameId } from '../game/GameState';

export interface MinigameConfig {
  id: MinigameId;
  name: string;
  durationSeconds: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface MinigameResult {
  completed: boolean;
  scoreEarned: number;
  coinsEarned: number;
  accuracy: number; // 0 to 100%
  comboPeak: number;
}

export interface IMinigameModule {
  id: MinigameId;
  name: string;
  init: (container: HTMLElement, onFinish: (result: MinigameResult) => void) => void;
  destroy: () => void;
}
