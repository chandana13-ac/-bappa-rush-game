import { IMinigameModule, MinigameResult } from '../types';
export { PandalPerfectGame } from './PandalPerfectGame';
export { PandalScene } from './PandalScene';
export * from './types';

export const PandalPerfectModule: IMinigameModule = {
  id: 'pandalPerfect',
  name: 'Pandal Perfect',
  init: (container: HTMLElement, onFinish: (result: MinigameResult) => void) => {
    console.log('Pandal Perfect minigame initialized in container', container, onFinish);
  },
  destroy: () => {
    console.log('Pandal Perfect minigame destroyed cleanly');
  },
};
