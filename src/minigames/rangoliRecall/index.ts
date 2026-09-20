import { IMinigameModule, MinigameResult } from '../types';
export { RangoliRecallGame } from './RangoliRecallGame';
export { RangoliPetal } from './RangoliPetal';
export { RangoliBoard } from './RangoliBoard';
export { RangoliRecallScene } from './RangoliRecallScene';
export * from './types';
export * from './patterns';
export * from './saveData';

export const RangoliRecallModule: IMinigameModule = {
  id: 'rangoliRecall',
  name: 'Rangoli Recall',
  init: (container: HTMLElement, onFinish: (result: MinigameResult) => void) => {
    console.log('Rangoli Recall minigame initialized in container', container, onFinish);
  },
  destroy: () => {
    console.log('Rangoli Recall minigame destroyed cleanly');
  },
};
