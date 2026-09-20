import { MinigameId } from '../game/GameState';

export interface StationInfo {
  id: MinigameId;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  themeColor: string; // Hex color for lighting & UI
  accentColor: string;
  position: [number, number, number]; // 3D world position [x, y, z]
  interactionRadius: number;
  preparationTip: string;
}

export const FESTIVAL_STATIONS: StationInfo[] = [
  {
    id: 'diyaDash',
    name: 'Diya Dash',
    tagline: 'Light the sacred lamps along the procession route',
    description:
      'Sprint through the decorated corridor to light traditional brass diyas before the festive breeze blows them out!',
    icon: '🪔',
    themeColor: '#f59e0b', // Amber/Gold
    accentColor: '#fbbf24',
    position: [-10, 0, -6],
    interactionRadius: 3.5,
    preparationTip: 'Dash quickly between oil lamps and shield flames from crosswinds.',
  },
  {
    id: 'rangoliRecall',
    name: 'Rangoli Recall',
    tagline: 'Recreate vibrant sacred geometric floor patterns',
    description:
      'Memorize vibrant sequences of coloured powders (gulal) and place petals & colors in harmonious symmetrical order.',
    icon: '🌸',
    themeColor: '#ec4899', // Pink / Magenta
    accentColor: '#f472b6',
    position: [-10, 0, 8],
    interactionRadius: 3.5,
    preparationTip: 'Notice the center flower color first before spreading outward.',
  },
  {
    id: 'modakFactory',
    name: 'Modak Factory',
    tagline: 'Shape and catch fresh steaming modaks for Bappa',
    description:
      'Guide sweet rice flour dumplings, coconut, and jaggery filling into delicious festive modak offerings.',
    icon: '🥟',
    themeColor: '#eab308', // Warm Gold
    accentColor: '#fde047',
    position: [0, 0, 12],
    interactionRadius: 3.5,
    preparationTip: 'Watch for golden modaks—they grant bonus festival combo time!',
  },
  {
    id: 'dholEcho',
    name: 'Dhol Echo',
    tagline: 'Match the thunderous rhythm of festival drums',
    description:
      'Feel the energizing pulse of traditional Maharashtrian dhol-tasha beats in sync with the celebratory rhythm.',
    icon: '🥁',
    themeColor: '#ea580c', // Bright Orange
    accentColor: '#fb923c',
    position: [10, 0, 8],
    interactionRadius: 3.5,
    preparationTip: 'Keep a steady meter to build the crowd celebration meter.',
  },
  {
    id: 'pandalPerfect',
    name: 'Pandal Perfect',
    tagline: 'Hang floral marigold garlands and sacred torans',
    description:
      'Decorate the grand festival stage with vibrant orange marigolds, silk drapes, and golden fairy lights before the arti.',
    icon: '🌺',
    themeColor: '#a855f7', // Festive Purple / Violet
    accentColor: '#c084fc',
    position: [10, 0, -6],
    interactionRadius: 3.5,
    preparationTip: 'Align the central toran evenly to earn top festive harmony scores.',
  },
];

export interface TutorialCard {
  title: string;
  subtitle: string;
  badge: string;
  text: string;
  keys?: string[];
  visualHint: string;
}

export const TUTORIAL_CARDS: TutorialCard[] = [
  {
    title: 'Welcome to Bappa Rush!',
    subtitle: 'The Great Festival Challenge',
    badge: 'Overview',
    text: 'Ganesh Chaturthi festival preparations are in full swing! Help the volunteer committee prepare the grand pandal, light the diyas, shape modaks, and beat the dhols before the grand evening celebration begins.',
    visualHint: '🪔 🐘 🌺',
  },
  {
    title: 'Movement & Exploration',
    subtitle: 'Walking the Festival Grounds',
    badge: 'Controls',
    text: 'Use WASD or Arrow Keys to walk around the festival courtyard. Click and drag your mouse across the screen to rotate your view around your character, or scroll to zoom.',
    keys: ['W', 'A', 'S', 'D', 'Arrow Keys', 'Mouse Drag'],
    visualHint: '🚶‍♂️ ↔️ 🔄',
  },
  {
    title: 'Interacting with Stations',
    subtitle: 'Step into Glowing Zones',
    badge: 'Interaction',
    text: 'Approach any of the 5 festival stalls—marked by bright glowing lanterns and colored arches. When the prompt appears, press [E] or tap the on-screen Interact button to enter the station.',
    keys: ['E', 'Interact Button'],
    visualHint: '✨ [E] ✨',
  },
  {
    title: 'Score, Combo & Festival Chaos',
    subtitle: 'Manage the Festive Atmosphere',
    badge: 'Mechanics',
    text: 'Fast and accurate actions build your Combo Multiplier up to 3x! Watch the Festival Chaos meter in the HUD: completing tasks keeps chaos low and joyful. If time runs out or chaos peaks, the celebration rush is called.',
    visualHint: '⚡ Combo 3x • 🎚️ Chaos Meter',
  },
  {
    title: 'Pausing & Settings',
    subtitle: 'Take a Breath Any Time',
    badge: 'Safety',
    text: 'Need a break? Press [Escape] or click the Pause icon in the top right. Pausing immediately halts all countdowns and game activity, letting you adjust audio or read instructions safely.',
    keys: ['Esc', 'Pause Icon'],
    visualHint: '⏸️ Peaceful Rest',
  },
];
