export type DecorationType = 'diya' | 'garland' | 'lantern' | 'rangoli';

export interface SnapPoint {
  id: string;
  index: number;
  type: DecorationType;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  label: string;
  isOccupied: boolean;
  placedItemId?: string;
}

export interface PlacedDecoration {
  snapPointId: string;
  type: DecorationType;
  timestamp: number;
}

export interface PandalObjectiveState {
  diyasPlaced: number;
  diyasTarget: number;
  garlandsPlaced: number;
  garlandsTarget: number;
  lanternsPlaced: number;
  lanternsTarget: number;
  rangoliPlaced: number;
  rangoliTarget: number;
}

export const INITIAL_OBJECTIVES: PandalObjectiveState = {
  diyasPlaced: 0,
  diyasTarget: 5,
  garlandsPlaced: 0,
  garlandsTarget: 3,
  lanternsPlaced: 0,
  lanternsTarget: 2,
  rangoliPlaced: 0,
  rangoliTarget: 1,
};

export interface ToolbarItem {
  type: DecorationType;
  label: string;
  hindiName: string;
  icon: string;
  badgeCountKey: keyof PandalObjectiveState;
  targetCountKey: keyof PandalObjectiveState;
  color: string;
  glowColor: string;
  tooltip: string;
}

export const TOOLBAR_ITEMS: ToolbarItem[] = [
  {
    type: 'diya',
    label: 'Diya',
    hindiName: 'Deepak',
    icon: '🪔',
    badgeCountKey: 'diyasPlaced',
    targetCountKey: 'diyasTarget',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    tooltip: 'Sacred brass oil lamps for illumination',
  },
  {
    type: 'garland',
    label: 'Marigold Garland',
    hindiName: 'Genda Toran',
    icon: '🌼',
    badgeCountKey: 'garlandsPlaced',
    targetCountKey: 'garlandsTarget',
    color: '#ea580c',
    glowColor: 'rgba(234, 88, 12, 0.6)',
    tooltip: 'Fresh marigold torans to bless entrance & pillars',
  },
  {
    type: 'lantern',
    label: 'Lantern',
    hindiName: 'Akash Kandil',
    icon: '🏮',
    badgeCountKey: 'lanternsPlaced',
    targetCountKey: 'lanternsTarget',
    color: '#e11d48',
    glowColor: 'rgba(225, 29, 72, 0.6)',
    tooltip: 'Festive hanging lanterns with colorful streamers',
  },
  {
    type: 'rangoli',
    label: 'Rangoli',
    hindiName: 'Rangavali',
    icon: '🌸',
    badgeCountKey: 'rangoliPlaced',
    targetCountKey: 'rangoliTarget',
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.6)',
    tooltip: 'Sacred geometric flower powder floor pattern',
  },
];
