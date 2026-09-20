export type DholDirection = 'LEFT' | 'UP' | 'RIGHT' | 'DOWN';

export type TimingRating = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

export interface DirectionConfig {
  id: DholDirection;
  label: string;
  sublabel: string;
  keyLabel: string;
  arrowIcon: string;
  primaryColor: string;
  glowColor: string;
  borderColor: string;
  frequencyStart: number;
  frequencyEnd: number;
  strokeType: 'dunki' | 'kaddi' | 'rim' | 'body';
}

export const DIRECTION_CONFIGS: Record<DholDirection, DirectionConfig> = {
  LEFT: {
    id: 'LEFT',
    label: 'Left',
    sublabel: 'Dhum (Bass)',
    keyLabel: '←',
    arrowIcon: '⬅️',
    primaryColor: '#e11d48', // Crimson Red
    glowColor: 'rgba(225, 29, 72, 0.6)',
    borderColor: '#fb7185',
    frequencyStart: 95,
    frequencyEnd: 38,
    strokeType: 'dunki',
  },
  UP: {
    id: 'UP',
    label: 'Up',
    sublabel: 'Ta (High Tasha)',
    keyLabel: '↑',
    arrowIcon: '⬆️',
    primaryColor: '#eab308', // Radiant Gold
    glowColor: 'rgba(234, 179, 8, 0.6)',
    borderColor: '#fde047',
    frequencyStart: 540,
    frequencyEnd: 240,
    strokeType: 'rim',
  },
  DOWN: {
    id: 'DOWN',
    label: 'Down',
    sublabel: 'Dhaga (Body Slap)',
    keyLabel: '↓',
    arrowIcon: '⬇️',
    primaryColor: '#f97316', // Vibrant Orange
    glowColor: 'rgba(249, 115, 22, 0.6)',
    borderColor: '#fdba74',
    frequencyStart: 160,
    frequencyEnd: 55,
    strokeType: 'body',
  },
  RIGHT: {
    id: 'RIGHT',
    label: 'Right',
    sublabel: 'Tasha (Treble Snap)',
    keyLabel: '→',
    arrowIcon: '➡️',
    primaryColor: '#06b6d4', // Bright Cyan
    glowColor: 'rgba(6, 182, 212, 0.6)',
    borderColor: '#67e8f9',
    frequencyStart: 320,
    frequencyEnd: 150,
    strokeType: 'kaddi',
  },
};
