export interface TimerSnapshot {
  timeRemaining: number; // in seconds
  totalTime: number; // initial duration in seconds
  isPaused: boolean;
  isExpired: boolean;
  formattedTime: string;
}

export class TimerManager {
  private static instance: TimerManager | null = null;
  private timeRemaining: number;
  private totalTime: number;
  private isPaused: boolean = true;
  private intervalId: number | null = null;
  private lastTimestamp: number = 0;
  private listeners: Array<(snapshot: TimerSnapshot) => void> = [];
  private onExpireCallbacks: Array<() => void> = [];

  private constructor(defaultDuration = 300) {
    this.totalTime = defaultDuration;
    this.timeRemaining = defaultDuration;
  }

  public static getInstance(defaultDuration = 300): TimerManager {
    if (!TimerManager.instance) {
      TimerManager.instance = new TimerManager(defaultDuration);
    }
    return TimerManager.instance;
  }

  public setDuration(seconds: number): void {
    this.totalTime = seconds;
    this.timeRemaining = seconds;
    this.notify();
  }

  public start(): void {
    if (this.intervalId !== null) {
      this.stopInterval();
    }
    this.isPaused = false;
    this.lastTimestamp = performance.now();

    // Use requestAnimationFrame-backed update loop or short interval with delta time calculation
    this.intervalId = window.setInterval(() => {
      this.tick();
    }, 200);

    this.notify();
  }

  public pause(): void {
    this.isPaused = true;
    this.stopInterval();
    this.notify();
  }

  public resume(): void {
    if (this.timeRemaining > 0 && this.isPaused) {
      this.start();
    }
  }

  public reset(duration?: number): void {
    this.stopInterval();
    this.isPaused = true;
    if (duration !== undefined) {
      this.totalTime = duration;
    }
    this.timeRemaining = this.totalTime;
    this.notify();
  }

  public addTime(seconds: number): void {
    this.timeRemaining = Math.max(0, this.timeRemaining + seconds);
    this.notify();
  }

  private tick(): void {
    if (this.isPaused) return;

    const now = performance.now();
    const delta = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;

    this.timeRemaining = Math.max(0, this.timeRemaining - delta);

    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.pause();
      for (const cb of this.onExpireCallbacks) {
        cb();
      }
    }

    this.notify();
  }

  private stopInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public getSnapshot(): TimerSnapshot {
    const mins = Math.floor(this.timeRemaining / 60);
    const secs = Math.floor(this.timeRemaining % 60);
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    return {
      timeRemaining: this.timeRemaining,
      totalTime: this.totalTime,
      isPaused: this.isPaused,
      isExpired: this.timeRemaining <= 0,
      formattedTime: formatted,
    };
  }

  public onExpire(callback: () => void): () => void {
    this.onExpireCallbacks.push(callback);
    return () => {
      this.onExpireCallbacks = this.onExpireCallbacks.filter((c) => c !== callback);
    };
  }

  public subscribe(listener: (snapshot: TimerSnapshot) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const snap = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snap);
    }
  }
}
