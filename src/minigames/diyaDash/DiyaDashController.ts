/**
 * DiyaDashController.ts
 * 
 * Central controller managing timing, target spawning, reaction calculations,
 * and state transitions for Diya Dash: Light the Festival.
 * 
 * Guarantees:
 * - Single requestAnimationFrame-based delta round timer starting from exactly 25.0s
 * - Deterministic single-target activation
 * - Cancellable handles (no rogue intervals, exactly one round timer)
 * - Exact freeze/resume tracking during pause
 * - No double hits or duplicate score events
 */

export type DiyaRating = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

export interface HitResult {
  diyaIndex: number;
  rating: DiyaRating;
  reactionTimeMs: number;
  pointsEarned: number;
  combo: number;
  isComboBonus: boolean;
  totalScore: number;
  totalHits: number;
}

export interface MissResult {
  diyaIndex: number;
  misses: number;
  combo: number;
}

export interface DiyaDashFinalStats {
  score: number;
  diyasLit: number;
  misses: number;
  accuracy: number;
  bestCombo: number;
  coinsEarned: number;
  performanceTitle: string;
}

export interface DiyaDashControllerConfig {
  roundDurationSec?: number;      // Default: 25.0s
  targetLifespanMs?: number;      // Default: 1300ms
  hitTransitionDelayMs?: number;  // Default: 250ms
  missTransitionDelayMs?: number; // Default: 350ms
  onTick?: (remainingSec: number) => void;
  onTargetSpawn?: (diyaIndex: number, durationMs: number) => void;
  onTargetHit?: (result: HitResult) => void;
  onTargetMiss?: (result: MissResult) => void;
  onRoundEnd?: (stats: DiyaDashFinalStats) => void;
}

export class DiyaDashController {
  private config: Required<DiyaDashControllerConfig>;

  // Game state
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private roundTimeRemaining: number = 25.0;
  private roundScore: number = 0;
  private correctHits: number = 0;
  private misses: number = 0;
  private currentCombo: number = 0;
  private bestCombo: number = 0;

  // Active target state
  private activeDiyaIndex: number = -1;
  private previousDiyaIndex: number = -1;
  private targetSpawnTimestamp: number = 0;
  private targetRemainingMs: number = 0;
  private isHitConsuming: boolean = false;

  // Timers: single requestAnimationFrame round timer + single target expire timeout + transition timeout
  private roundRafId: number | null = null;
  private lastTickTime: number = 0;
  private targetExpireTimerId: number | null = null;
  private transitionTimerId: number | null = null;

  constructor(config: DiyaDashControllerConfig = {}) {
    this.config = {
      roundDurationSec: config.roundDurationSec ?? 25.0,
      targetLifespanMs: config.targetLifespanMs ?? 1300,
      hitTransitionDelayMs: config.hitTransitionDelayMs ?? 250,
      missTransitionDelayMs: config.missTransitionDelayMs ?? 350,
      onTick: config.onTick ?? (() => {}),
      onTargetSpawn: config.onTargetSpawn ?? (() => {}),
      onTargetHit: config.onTargetHit ?? (() => {}),
      onTargetMiss: config.onTargetMiss ?? (() => {}),
      onRoundEnd: config.onRoundEnd ?? (() => {}),
    };
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  public startRound(): void {
    // Ensure all existing timers are cleanly terminated first
    this.cleanupAllTimers();

    this.isRunning = true;
    this.isPaused = false;
    this.roundTimeRemaining = this.config.roundDurationSec;
    this.roundScore = 0;
    this.correctHits = 0;
    this.misses = 0;
    this.currentCombo = 0;
    this.bestCombo = 0;
    this.activeDiyaIndex = -1;
    this.previousDiyaIndex = -1;
    this.isHitConsuming = false;

    // Immediately trigger onTick with initial 25.0
    this.config.onTick(this.roundTimeRemaining);

    // Start single delta-time round timer via requestAnimationFrame
    this.lastTickTime = performance.now();
    this.roundRafId = requestAnimationFrame(this.tickRoundTimer);

    // Spawn the first active diya
    this.spawnNextTarget();
  }

  public hitDiya(diyaIndex: number): boolean {
    if (!this.isRunning || this.isPaused || this.isHitConsuming) {
      return false;
    }

    if (diyaIndex !== this.activeDiyaIndex || this.activeDiyaIndex < 0) {
      return false;
    }

    // Atomic consumption flag: hit executes exactly once
    this.isHitConsuming = true;

    // 1. Immediately clear target expiration timer
    if (this.targetExpireTimerId !== null) {
      window.clearTimeout(this.targetExpireTimerId);
      this.targetExpireTimerId = null;
    }

    // 2. Compute rating & score
    const reactionTimeMs = Math.max(0, performance.now() - this.targetSpawnTimestamp);
    let rating: DiyaRating = 'GOOD';
    let basePoints = 50;

    if (reactionTimeMs < 350) {
      rating = 'PERFECT';
      basePoints = 150;
    } else if (reactionTimeMs < 700) {
      rating = 'GREAT';
      basePoints = 100;
    } else {
      rating = 'GOOD';
      basePoints = 50;
    }

    this.correctHits += 1;
    this.currentCombo += 1;
    if (this.currentCombo > this.bestCombo) {
      this.bestCombo = this.currentCombo;
    }

    // Combo bonus: +100 bonus every 5 consecutive lights
    const isComboBonus = this.currentCombo > 0 && this.currentCombo % 5 === 0;
    const bonusPoints = isComboBonus ? 100 : 0;
    const pointsEarned = basePoints + bonusPoints;
    this.roundScore += pointsEarned;

    const hitResult: HitResult = {
      diyaIndex,
      rating,
      reactionTimeMs: Math.round(reactionTimeMs),
      pointsEarned,
      combo: this.currentCombo,
      isComboBonus,
      totalScore: this.roundScore,
      totalHits: this.correctHits,
    };

    // 3. Immediately set activeDiyaIndex to -1
    const prevIndex = this.activeDiyaIndex;
    this.activeDiyaIndex = -1;

    // 4. Notify listener of hit
    this.config.onTargetHit(hitResult);

    // 5. Schedule next diya spawn once only
    this.transitionTimerId = window.setTimeout(() => {
      this.transitionTimerId = null;
      this.isHitConsuming = false;
      if (this.isRunning && !this.isPaused) {
        this.spawnNextTarget(prevIndex);
      }
    }, this.config.hitTransitionDelayMs);

    return true;
  }

  public pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;

    // 1. Freeze round timer
    if (this.roundRafId !== null) {
      cancelAnimationFrame(this.roundRafId);
      this.roundRafId = null;
    }

    // 2. Freeze active target expiration timer and record remaining time
    if (this.targetExpireTimerId !== null) {
      window.clearTimeout(this.targetExpireTimerId);
      this.targetExpireTimerId = null;
      const elapsed = performance.now() - this.targetSpawnTimestamp;
      this.targetRemainingMs = Math.max(50, this.config.targetLifespanMs - elapsed);
    }

    // 3. Freeze pending transition timer if waiting between targets
    if (this.transitionTimerId !== null) {
      window.clearTimeout(this.transitionTimerId);
      this.transitionTimerId = null;
    }
  }

  public resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;

    // 1. Resume main round timer with fresh tick time
    this.lastTickTime = performance.now();
    this.roundRafId = requestAnimationFrame(this.tickRoundTimer);

    // 2. If an active target was waiting to expire, resume with exact remaining duration
    if (this.activeDiyaIndex >= 0) {
      this.targetSpawnTimestamp = performance.now() - (this.config.targetLifespanMs - this.targetRemainingMs);
      this.targetExpireTimerId = window.setTimeout(() => {
        this.handleTargetExpire();
      }, this.targetRemainingMs);
    } else if (!this.isHitConsuming) {
      // If we were paused between targets, spawn immediately
      this.spawnNextTarget();
    }
  }

  public stop(): DiyaDashFinalStats {
    this.cleanupAllTimers();
    this.isRunning = false;
    this.activeDiyaIndex = -1;

    return this.calculateFinalStats();
  }

  public dispose(): void {
    this.cleanupAllTimers();
    this.isRunning = false;
    this.activeDiyaIndex = -1;
  }

  // --------------------------------------------------------------------------
  // Getters for React & Debug Panel
  // --------------------------------------------------------------------------

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getIsTimerRunning(): boolean {
    return this.isRunning && !this.isPaused && this.roundRafId !== null;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public getRoundTimeRemaining(): number {
    return Math.max(0, this.roundTimeRemaining);
  }

  public getRoundScore(): number {
    return this.roundScore;
  }

  public getCorrectHits(): number {
    return this.correctHits;
  }

  public getMisses(): number {
    return this.misses;
  }

  public getCurrentCombo(): number {
    return this.currentCombo;
  }

  public getBestCombo(): number {
    return this.bestCombo;
  }

  public getActiveDiyaIndex(): number {
    return this.activeDiyaIndex;
  }

  public getActiveTargetRemainingMs(): number {
    if (this.activeDiyaIndex < 0 || !this.isRunning) return 0;
    if (this.isPaused) return Math.round(this.targetRemainingMs);
    const elapsed = performance.now() - this.targetSpawnTimestamp;
    return Math.max(0, Math.round(this.config.targetLifespanMs - elapsed));
  }

  public getTimerHandlesCount(): number {
    return this.roundRafId !== null ? 1 : 0;
  }

  public getTargetExpireHandlesCount(): number {
    return this.targetExpireTimerId !== null ? 1 : 0;
  }

  // --------------------------------------------------------------------------
  // Internal Helpers
  // --------------------------------------------------------------------------

  private tickRoundTimer = (now: number): void => {
    if (!this.isRunning || this.isPaused) return;

    const deltaSec = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    this.roundTimeRemaining = Math.max(0, this.roundTimeRemaining - deltaSec);
    this.config.onTick(this.roundTimeRemaining);

    if (this.roundTimeRemaining <= 0) {
      this.endRound();
      return;
    }

    this.roundRafId = requestAnimationFrame(this.tickRoundTimer);
  };

  private spawnNextTarget(avoidIndex?: number): void {
    if (!this.isRunning || this.isPaused) return;

    // Pick a random index 0..11, never repeat previous
    let nextIndex: number;
    const forbidden = avoidIndex !== undefined ? avoidIndex : this.previousDiyaIndex;

    do {
      nextIndex = Math.floor(Math.random() * 12);
    } while (nextIndex === forbidden);

    this.activeDiyaIndex = nextIndex;
    this.previousDiyaIndex = nextIndex;
    this.targetSpawnTimestamp = performance.now();
    this.targetRemainingMs = this.config.targetLifespanMs;
    this.isHitConsuming = false;

    this.config.onTargetSpawn(nextIndex, this.config.targetLifespanMs);

    // Start expiration timer
    this.targetExpireTimerId = window.setTimeout(() => {
      this.handleTargetExpire();
    }, this.config.targetLifespanMs);
  }

  private handleTargetExpire(): void {
    if (!this.isRunning || this.isPaused || this.activeDiyaIndex < 0) return;

    const expiredIndex = this.activeDiyaIndex;
    this.activeDiyaIndex = -1;
    this.targetExpireTimerId = null;

    this.misses += 1;
    this.currentCombo = 0; // Reset combo

    const missResult: MissResult = {
      diyaIndex: expiredIndex,
      misses: this.misses,
      combo: 0,
    };

    this.config.onTargetMiss(missResult);

    // Wait 350ms, then spawn next diya
    this.transitionTimerId = window.setTimeout(() => {
      this.transitionTimerId = null;
      if (this.isRunning && !this.isPaused) {
        this.spawnNextTarget(expiredIndex);
      }
    }, this.config.missTransitionDelayMs);
  }

  private endRound(): void {
    this.cleanupAllTimers();
    this.isRunning = false;
    this.activeDiyaIndex = -1;

    const stats = this.calculateFinalStats();
    this.config.onRoundEnd(stats);
  }

  private calculateFinalStats(): DiyaDashFinalStats {
    const totalAttempts = this.correctHits + this.misses;
    const accuracy = totalAttempts > 0 ? Math.round((this.correctHits / totalAttempts) * 100) : 0;
    const coinsEarned = Math.floor(this.correctHits * 3 + this.roundScore * 0.05);

    let performanceTitle = 'Keep the Festival Glowing';
    if (accuracy >= 90 && this.correctHits >= 10) {
      performanceTitle = 'Light Bringer';
    } else if (accuracy >= 70 && this.correctHits >= 7) {
      performanceTitle = 'Diya Champion';
    } else if (accuracy >= 50 && this.correctHits >= 4) {
      performanceTitle = 'Festival Helper';
    }

    return {
      score: this.roundScore,
      diyasLit: this.correctHits,
      misses: this.misses,
      accuracy,
      bestCombo: this.bestCombo,
      coinsEarned,
      performanceTitle,
    };
  }

  private cleanupAllTimers(): void {
    if (this.roundRafId !== null) {
      cancelAnimationFrame(this.roundRafId);
      this.roundRafId = null;
    }
    if (this.targetExpireTimerId !== null) {
      window.clearTimeout(this.targetExpireTimerId);
      this.targetExpireTimerId = null;
    }
    if (this.transitionTimerId !== null) {
      window.clearTimeout(this.transitionTimerId);
      this.transitionTimerId = null;
    }
  }
}
