export enum GameState {
  BOOT = 'BOOT',
  MAIN_MENU = 'MAIN_MENU',
  TUTORIAL = 'TUTORIAL',
  FESTIVAL_HUB = 'FESTIVAL_HUB',
  MINI_GAME = 'MINI_GAME',
  RANDOM_EVENT = 'RANDOM_EVENT',
  CHAOS_MODE = 'CHAOS_MODE',
  FINAL_REVEAL = 'FINAL_REVEAL',
  RESULTS = 'RESULTS',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

export type MinigameId =
  | 'diyaDash'
  | 'rangoliRecall'
  | 'modakFactory'
  | 'dholEcho'
  | 'pandalPerfect';

export interface Objective {
  id: string;
  title: string;
  stationId: MinigameId;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  rewardCoins: number;
}
