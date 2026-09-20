import { Difficulty, DIFFICULTY_CONFIGS, GamePhase } from './types';

export interface ControllerCallbacks {
  onTick: (phase: GamePhase, secondsRemaining: number) => void;
  onMemorizeComplete: () => void;
  onRebuildTimeout: () => void;
  onHintExpire: () => void;
}

export class RangoliRecallController {
  private phase: GamePhase = 'WELCOME';
  private difficulty: Difficulty = 'easy';
  private callbacks: ControllerCallbacks;

  // Precise timing
  private rafId: number | null = null;
  private lastTimestamp: number = 0;
  private remainingMs: number = 0;
  private isPaused: boolean = false;

  // Hint timing
  private hintRemainingMs: number = 0;
  private isHintActive: boolean = false;
  private hintsUsedThisLevel: number = 0;

  constructor(callbacks: ControllerCallbacks) {
    this.callbacks = callbacks;
  }

  public setDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty;
  }

  public startMemorize(difficulty: Difficulty): void {
    this.stopLoop();
    this.difficulty = difficulty;
    this.phase = 'MEMORIZE';
    this.isPaused = false;
    this.hintsUsedThisLevel = 0;
    this.isHintActive = false;
    this.hintRemainingMs = 0;

    const cfg = DIFFICULTY_CONFIGS[difficulty];
    this.remainingMs = cfg.memorizeSeconds * 1000;
    this.lastTimestamp = performance.now();

    this.callbacks.onTick(this.phase, Math.ceil(this.remainingMs / 1000));
    this.startLoop();
  }

  public startRebuild(difficulty: Difficulty): void {
    this.stopLoop();
    this.difficulty = difficulty;
    this.phase = 'REBUILD';
    this.isPaused = false;

    const cfg = DIFFICULTY_CONFIGS[difficulty];
    this.remainingMs = cfg.rebuildSeconds * 1000;
    this.lastTimestamp = performance.now();

    this.callbacks.onTick(this.phase, Math.ceil(this.remainingMs / 1000));
    this.startLoop();
  }

  public triggerHint(durationMs = 1500): boolean {
    if (this.phase !== 'REBUILD' || this.isPaused || this.isHintActive) {
      return false;
    }
    this.isHintActive = true;
    this.hintRemainingMs = durationMs;
    this.hintsUsedThisLevel += 1;
    return true;
  }

  public pause(): void {
    if (this.isPaused) return;
    this.isPaused = true;
    this.stopLoop();
  }

  public resume(): void {
    if (!this.isPaused) return;
    if (this.phase !== 'MEMORIZE' && this.phase !== 'REBUILD') {
      this.isPaused = false;
      return;
    }
    this.isPaused = false;
    this.lastTimestamp = performance.now();
    this.startLoop();
  }

  public stop(): void {
    this.stopLoop();
    this.phase = 'WELCOME';
    this.remainingMs = 0;
    this.isPaused = false;
    this.isHintActive = false;
    this.hintRemainingMs = 0;
  }

  public getRemainingSeconds(): number {
    return Math.max(0, this.remainingMs / 1000);
  }

  public getHintsUsed(): number {
    return this.hintsUsedThisLevel;
  }

  public getIsHintActive(): boolean {
    return this.isHintActive;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public getPhase(): GamePhase {
    return this.phase;
  }

  public getActiveTimerCount(): number {
    return this.rafId !== null ? 1 : 0;
  }

  private startLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.rafId = requestAnimationFrame(this.step);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private step = (now: number): void => {
    if (this.isPaused) {
      this.rafId = null;
      return;
    }

    const delta = now - this.lastTimestamp;
    this.lastTimestamp = now;

    // 1. Tick main phase timer
    this.remainingMs -= delta;

    // 2. Tick hint timer if active
    if (this.isHintActive) {
      this.hintRemainingMs -= delta;
      if (this.hintRemainingMs <= 0) {
        this.isHintActive = false;
        this.hintRemainingMs = 0;
        this.callbacks.onHintExpire();
      }
    }

    if (this.remainingMs <= 0) {
      this.remainingMs = 0;
      this.stopLoop();

      if (this.phase === 'MEMORIZE') {
        this.callbacks.onTick(this.phase, 0);
        this.callbacks.onMemorizeComplete();
      } else if (this.phase === 'REBUILD') {
        this.callbacks.onTick(this.phase, 0);
        this.callbacks.onRebuildTimeout();
      }
      return;
    }

    this.callbacks.onTick(this.phase, Math.max(0, this.remainingMs / 1000));
    this.rafId = requestAnimationFrame(this.step);
  };

  public destroy(): void {
    this.stopLoop();
    this.isPaused = true;
    this.callbacks = {
      onTick: () => {},
      onMemorizeComplete: () => {},
      onRebuildTimeout: () => {},
      onHintExpire: () => {},
    };
  }
}
