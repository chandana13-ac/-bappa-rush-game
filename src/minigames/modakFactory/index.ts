import { IMinigameModule, MinigameResult } from '../types';
export { ModakFactoryGame } from './ModakFactoryGame';
export { ModakVisual } from './ModakVisual';
export * from './types';

export const ModakFactoryModule: IMinigameModule = {
  id: 'modakFactory',
  name: 'Modak Factory',
  init: (container: HTMLElement, onFinish: (result: MinigameResult) => void) => {
    console.log('Modak Factory minigame initialized in container', container, onFinish);
  },
  destroy: () => {
    console.log('Modak Factory minigame destroyed cleanly');
  },
};
