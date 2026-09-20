import { IMinigameModule, MinigameResult } from '../types';
export { DiyaDashGame } from './DiyaDashGame';
export { DiyaDashScene } from './DiyaDashScene';

export const DiyaDashModule: IMinigameModule = {
  id: 'diyaDash',
  name: 'Diya Dash',
  init: (container: HTMLElement, onFinish: (result: MinigameResult) => void) => {
    console.log('Diya Dash minigame initialized', container, onFinish);
  },
  destroy: () => {
    console.log('Diya Dash minigame destroyed');
  },
};
