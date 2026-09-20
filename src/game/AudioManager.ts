import { SettingsManager } from './SettingsManager';

export class AudioManager {
  private static instance: AudioManager | null = null;
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgOscillators: OscillatorNode[] = [];
  private bgGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;

  private constructor() {
    // Lazy AudioContext setup
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private initContext(): boolean {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        return true;
      }
    } catch {
      // Audio not supported in this browser
    }
    return false;
  }

  public playClick(): void {
    const settings = SettingsManager.getInstance().getSettings();
    if (!settings.soundEnabled || settings.soundVolume <= 0) return;
    if (!this.initContext() || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15 * settings.soundVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio error ignored
    }
  }

  public playBell(): void {
    const settings = SettingsManager.getInstance().getSettings();
    if (!settings.soundEnabled || settings.soundVolume <= 0) return;
    if (!this.initContext() || !this.ctx) return;

    try {
      // Temple bell harmonic tone
      const now = this.ctx.currentTime;
      const freqs = [1046.5, 2093.0, 3135.96]; // C6 harmonics
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const amp = (0.2 / (idx + 1)) * settings.soundVolume;
        gain.gain.setValueAtTime(amp, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 + idx * 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.6);
      });
    } catch {
      // Ignore
    }
  }

  public playDholBeat(): void {
    const settings = SettingsManager.getInstance().getSettings();
    if (!settings.soundEnabled || settings.soundVolume <= 0) return;
    if (!this.initContext() || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

      gain.gain.setValueAtTime(0.35 * settings.soundVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Ignore
    }
  }

  public playSuccess(): void {
    const settings = SettingsManager.getInstance().getSettings();
    if (!settings.soundEnabled || settings.soundVolume <= 0) return;
    if (!this.initContext() || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C chord arpeggio
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.18 * settings.soundVolume, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.45);
      });
    } catch {
      // Ignore
    }
  }

  public startFestivalAmbient(): void {
    const settings = SettingsManager.getInstance().getSettings();
    if (!settings.musicEnabled || settings.musicVolume <= 0) return;
    if (this.isMusicPlaying) return;
    if (!this.initContext() || !this.ctx) return;

    try {
      this.stopFestivalAmbient();
      const now = this.ctx.currentTime;

      this.bgGain = this.ctx.createGain();
      this.bgGain.gain.setValueAtTime(0.03 * settings.musicVolume, now);
      this.bgGain.connect(this.ctx.destination);

      // Warm tanpura / sitar root note chord (C3, G3, C4)
      const chord = [130.81, 196.0, 261.63];
      this.bgOscillators = chord.map((f) => {
        const osc = this.ctx!.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        osc.connect(this.bgGain!);
        osc.start();
        return osc;
      });

      this.isMusicPlaying = true;
    } catch {
      // Ignore
    }
  }

  public stopFestivalAmbient(): void {
    try {
      for (const osc of this.bgOscillators) {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // Ignore
        }
      }
      this.bgOscillators = [];
      if (this.bgGain) {
        this.bgGain.disconnect();
        this.bgGain = null;
      }
      this.isMusicPlaying = false;
    } catch {
      // Ignore
    }
  }
}
