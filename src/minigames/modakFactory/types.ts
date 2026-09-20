export type FillingId = 'jaggery_coconut' | 'kaju_mawa' | 'mango_elaichi';
export type ToppingId = 'kesar_saffron' | 'green_pista' | 'silver_vark';

export interface FillingOption {
  id: FillingId;
  name: string;
  hindiName: string;
  icon: string;
  color: string;
  glowColor: string;
  description: string;
}

export interface ToppingOption {
  id: ToppingId;
  name: string;
  hindiName: string;
  icon: string;
  color: string;
  glowColor: string;
  description: string;
}

export interface ModakOrder {
  id: string;
  orderNumber: number;
  filling: FillingId;
  topping: ToppingId;
  steamZone: {
    min: number; // e.g. 60%
    max: number; // e.g. 85%
  };
}

export interface ActiveModak {
  id: string;
  progress: number; // 0 to 100% across conveyor belt
  selectedFilling: FillingId | null;
  selectedTopping: ToppingId | null;
  steamQuality: 'none' | 'perfect' | 'good' | 'oversteamed' | 'understeamed';
  steamCharge: number; // 0 to 100%
  completed: boolean;
  isDelivered: boolean;
  mistakes: string[];
}

export const FILLING_OPTIONS: FillingOption[] = [
  {
    id: 'jaggery_coconut',
    name: 'Jaggery Coconut',
    hindiName: 'Gur Nariyal',
    icon: '🥥',
    color: '#92400e', // Rich jaggery brown
    glowColor: 'rgba(180, 83, 9, 0.5)',
    description: 'Fresh grated coconut & spiced jaggery',
  },
  {
    id: 'kaju_mawa',
    name: 'Kaju Mawa',
    hindiName: 'Kaju Khoya',
    icon: '🥛',
    color: '#fef08a', // Creamy khoya yellow
    glowColor: 'rgba(254, 240, 138, 0.5)',
    description: 'Sweet cashew nut milk cream',
  },
  {
    id: 'mango_elaichi',
    name: 'Mango Elaichi',
    hindiName: 'Aam Elaichi',
    icon: '🥭',
    color: '#ea580c', // Bright saffron mango orange
    glowColor: 'rgba(234, 88, 12, 0.5)',
    description: 'Alphonso pulp & fragrant cardamom',
  },
];

export const TOPPING_OPTIONS: ToppingOption[] = [
  {
    id: 'kesar_saffron',
    name: 'Golden Saffron',
    hindiName: 'Kesar',
    icon: '🌾',
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.5)',
    description: 'Fragrant Kashmiri saffron threads',
  },
  {
    id: 'green_pista',
    name: 'Green Pistachio',
    hindiName: 'Pista Churan',
    icon: '🥜',
    color: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.5)',
    description: 'Toasted emerald pistachio slivers',
  },
  {
    id: 'silver_vark',
    name: 'Silver Vark',
    hindiName: 'Chandi Vark',
    icon: '✨',
    color: '#e2e8f0',
    glowColor: 'rgba(226, 232, 240, 0.6)',
    description: 'Shimmering edible festive silver leaf',
  },
];
