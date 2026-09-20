import { GameState, MinigameId } from './GameState';
import { TimerManager } from './TimerManager';
import { ScoreManager } from './ScoreManager';
import { SaveManager } from './SaveManager';
import { SettingsManager } from './SettingsManager';
import { AudioManager } from './AudioManager';

export interface GameEventData {
  previousState: GameState;
  currentState: GameState;
  activeMinigameId?: MinigameId | null;
}

export class GameManager {
  private static instance: GameManager | null = null;
  private currentState: GameState = GameState.BOOT;
  private previousState: GameState = GameState.BOOT;
  private activeMinigameId: MinigameId | null = null;
  private minigameCleanupCallbacks: Array<() => void> = [];
  private listeners: Array<(event: GameEventData) => void> = [];
  private errorListeners: Array<(error: Error) => void> = [];

  private timerManager: TimerManager;
  private scoreManager: ScoreManager;
  private saveManager: SaveManager;
  private settingsManager: SettingsManager;
  private audioManager: AudioManager;

  private constructor() {
    this.timerManager = TimerManager.getInstance();
    this.scoreManager = ScoreManager.getInstance();
    this.saveManager = SaveManager.getInstance();
    this.settingsManager = SettingsManager.getInstance();
    this.audioManager = AudioManager.getInstance();

    // Hook timer expiry to game over or results
    this.timerManager.onExpire(() => {
      if (this.currentState === GameState.FESTIVAL_HUB || this.currentState === GameState.MINI_GAME) {
        this.finishRun();
      }
    });
  }

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  public getState(): GameState {
    return this.currentState;
  }

  public getPreviousState(): GameState {
    return this.previousState;
  }

  public getActiveMinigame(): MinigameId | null {
    return this.activeMinigameId;
  }

  public setState(newState: GameState): void {
    if (this.currentState === newState) return;

    const oldState = this.currentState;

    // Leaving MINI_GAME cleanup rule:
    // When leaving a mini-game, remove all timers, event listeners, meshes, particles, animations, and audio
    if (oldState === GameState.MINI_GAME && newState !== GameState.PAUSED) {
      this.cleanupActiveMinigame();
    }

    // Timer pausing rules
    if (newState === GameState.PAUSED) {
      this.timerManager.pause();
    } else if (oldState === GameState.PAUSED && (newState === GameState.FESTIVAL_HUB || newState === GameState.MINI_GAME)) {
      this.timerManager.resume();
    }

    this.previousState = oldState;
    this.currentState = newState;

    // Sound ambient management
    if (newState === GameState.FESTIVAL_HUB || newState === GameState.MINI_GAME) {
      this.audioManager.startFestivalAmbient();
    } else if (newState === GameState.MAIN_MENU || newState === GameState.GAME_OVER) {
      this.audioManager.stopFestivalAmbient();
    }

    this.notify();
  }

  public startNewFestivalRun(durationSeconds = 300): void {
    this.scoreManager.resetRun();
    this.timerManager.reset(durationSeconds);
    this.timerManager.start();
    this.setState(GameState.FESTIVAL_HUB);
  }

  public startDemoMode(): void {
    this.scoreManager.resetRun();
    this.timerManager.reset(9999); // Infinite timer for exploration
    this.timerManager.start();
    this.setState(GameState.FESTIVAL_HUB);
  }

  public enterMinigame(minigameId: MinigameId): void {
    this.activeMinigameId = minigameId;
    this.setState(GameState.MINI_GAME);
  }

  public exitMinigameToHub(): void {
    this.cleanupActiveMinigame();
    this.setState(GameState.FESTIVAL_HUB);
  }

  public registerMinigameCleanup(cleanupFn: () => void): () => void {
    this.minigameCleanupCallbacks.push(cleanupFn);
    return () => {
      this.minigameCleanupCallbacks = this.minigameCleanupCallbacks.filter((fn) => fn !== cleanupFn);
    };
  }

  private cleanupActiveMinigame(): void {
    for (const cleanup of this.minigameCleanupCallbacks) {
      try {
        cleanup();
      } catch (err) {
        console.warn('Error during minigame cleanup:', err);
      }
    }
    this.minigameCleanupCallbacks = [];
    this.activeMinigameId = null;
  }

  public pause(): void {
    if (this.currentState === GameState.FESTIVAL_HUB || this.currentState === GameState.MINI_GAME) {
      this.setState(GameState.PAUSED);
    }
  }

  public resume(): void {
    if (this.currentState === GameState.PAUSED) {
      this.setState(this.previousState || GameState.FESTIVAL_HUB);
    }
  }

  public quitToMainMenu(): void {
    this.cleanupActiveMinigame();
    this.timerManager.pause();
    this.timerManager.reset();
    this.setState(GameState.MAIN_MENU);
  }

  public finishRun(): void {
    const scoreState = this.scoreManager.getState();
    this.saveManager.recordScore(scoreState.score, 'Festival Hero', 100 - scoreState.chaosLevel);
    this.saveManager.addCoins(scoreState.coins);
    this.saveManager.incrementFestivalsCompleted();
    this.timerManager.pause();
    this.setState(GameState.RESULTS);
  }

  public reportError(error: Error): void {
    console.error('GameManager encountered error:', error);
    for (const listener of this.errorListeners) {
      listener(error);
    }
  }

  public onError(listener: (error: Error) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter((l) => l !== listener);
    };
  }

  public subscribe(listener: (event: GameEventData) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const event: GameEventData = {
      previousState: this.previousState,
      currentState: this.currentState,
      activeMinigameId: this.activeMinigameId,
    };
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
