import React from 'react';
import { Play, Sparkles, HelpCircle, Trophy, Settings, Compass } from 'lucide-react';
import { AudioManager } from '../game/AudioManager';

interface MainMenuProps {
  onPlay: () => void;
  onDemoMode: () => void;
  onHowToPlay: () => void;
  onHighScore: () => void;
  onSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onPlay,
  onDemoMode,
  onHowToPlay,
  onHighScore,
  onSettings,
}) => {
  const audio = AudioManager.getInstance();

  const handleAction = (cb: () => void) => {
    audio.playClick();
    cb();
  };

  return (
    <div
      id="screen-main-menu"
      className="relative w-full h-full flex flex-col justify-between items-center z-20 pointer-events-none p-6 sm:p-10 select-none"
    >
      {/* Top Festival Header Banner */}
      <div className="w-full max-w-2xl flex flex-col items-center text-center mt-2 sm:mt-6 pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-600/60 to-pink-600/60 border border-amber-300/40 backdrop-blur-md shadow-lg mb-3">
          <span className="text-xl">🪔</span>
          <span className="text-xs sm:text-sm font-semibold tracking-wider text-amber-200 uppercase">
            Ganesh Chaturthi Utsav Edition
          </span>
          <span className="text-xl">🌺</span>
        </div>

        {/* Title */}
        <h1
          id="main-title"
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-orange-500 drop-shadow-[0_4px_16px_rgba(245,158,11,0.5)]"
        >
          🐘 BAPPA RUSH
        </h1>

        {/* Subtitle */}
        <h2
          id="main-subtitle"
          className="mt-1 text-sm sm:text-lg md:text-xl font-bold tracking-widest text-amber-200 drop-shadow"
        >
          THE GREAT FESTIVAL CHALLENGE
        </h2>

        {/* Tagline */}
        <p
          id="main-tagline"
          className="mt-3 text-sm sm:text-base text-amber-100/90 font-medium max-w-lg bg-indigo-950/60 px-4 py-1.5 rounded-lg border border-amber-500/20 backdrop-blur-sm"
        >
          Can you get the festival ready before time runs out?
        </p>
      </div>

      {/* Center / Menu Buttons */}
      <div className="flex flex-col items-center gap-3.5 w-full max-w-xs sm:max-w-sm pointer-events-auto mb-4 sm:mb-8">
        {/* Play Festival Button */}
        <button
          id="btn-play-festival"
          onClick={() => handleAction(onPlay)}
          className="w-full group relative flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white font-extrabold text-lg sm:text-xl shadow-xl shadow-orange-500/35 hover:shadow-orange-500/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-2 border-amber-300 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-current text-yellow-200 group-hover:animate-pulse" />
          <span>PLAY FESTIVAL</span>
          <Sparkles className="w-5 h-5 text-yellow-200" />
        </button>

        {/* Demo / Practice Mode Button */}
        <button
          id="btn-demo-mode"
          onClick={() => handleAction(onDemoMode)}
          className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-amber-100 font-bold text-sm sm:text-base border border-purple-400/40 backdrop-blur-md shadow-lg hover:shadow-purple-500/30 hover:scale-[1.01] active:scale-[0.98] transition-all duration-150 cursor-pointer"
        >
          <Compass className="w-5 h-5 text-amber-300" />
          <span>Demo Mode (Free Roam)</span>
        </button>

        {/* Secondary Row of Actions */}
        <div className="w-full grid grid-cols-3 gap-2 mt-1">
          <button
            id="btn-how-to-play"
            onClick={() => handleAction(onHowToPlay)}
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-amber-200 text-xs sm:text-sm font-semibold border border-indigo-500/40 backdrop-blur-sm shadow hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-300" />
            <span>Tutorial</span>
          </button>

          <button
            id="btn-high-scores"
            onClick={() => handleAction(onHighScore)}
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-amber-200 text-xs sm:text-sm font-semibold border border-indigo-500/40 backdrop-blur-sm shadow hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>High Score</span>
          </button>

          <button
            id="btn-settings"
            onClick={() => handleAction(onSettings)}
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-amber-200 text-xs sm:text-sm font-semibold border border-indigo-500/40 backdrop-blur-sm shadow hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-amber-300" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-amber-200/60 pointer-events-auto">
        <p>Use keyboard (WASD / Arrows) & Mouse to explore • Sound powered by Web Audio API</p>
      </div>
    </div>
  );
};
