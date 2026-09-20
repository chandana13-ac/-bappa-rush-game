import { IMinigameModule, MinigameResult } from '../types';
export { DholEchoGame } from './DholEchoGame';
export { DholDrumVisual } from './DholDrumVisual';
export * from './types';

export const DholEchoModule: IMinigameModule = {
  id: 'dholEcho',
  name: 'Dhol Echo',
  init: (container: HTMLElement, onFinish: (result: MinigameResult) => void) => {
    console.log('Dhol Echo minigame initialized in container', container, onFinish);
  },
  destroy: () => {
    console.log('Dhol Echo minigame destroyed cleanly');
  },
};
