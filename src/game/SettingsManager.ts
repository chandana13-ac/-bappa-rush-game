export interface GameSettings {
  soundEnabled: boolean;
  soundVolume: number; // 0.0 to 1.0
  musicEnabled: boolean;
  musicVolume: number; // 0.0 to 1.0
  cameraSensitivity: number; // 0.5 to 2.0
  graphicsQuality: 'high' | 'medium' | 'low';
  showHelpTips: boolean;
  invertY: boolean;
}

const SETTINGS_KEY = 'bappa_rush_settings_v1';

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  soundVolume: 0.8,
  musicEnabled: true,
  musicVolume: 0.6,
  cameraSensitivity: 1.0,
  graphicsQuality: 'high',
  showHelpTips: true,
  invertY: false,
};

export class SettingsManager {
  private static instance: SettingsManager | null = null;
  private settings: GameSettings;
  private listeners: Array<(settings: GameSettings) => void> = [];

  private constructor() {
    this.settings = this.loadSettings();
  }

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  private loadSettings(): GameSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // LocalStorage unavailable or corrupt
    }
    return { ...DEFAULT_SETTINGS };
  }

  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...partial };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // Safe fallback
    }
    this.notify();
  }

  public resetToDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // Safe fallback
    }
    this.notify();
  }

  public subscribe(listener: (settings: GameSettings) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.settings);
    }
  }
}
