import React from 'react';
import { Trophy, Coins, RotateCcw, Home, Sparkles, Flame } from 'lucide-react';
import { ScoreManager } from '../game/ScoreManager';
import { AudioManager } from '../game/AudioManager';

interface ResultsScreenProps {
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  onPlayAgain,
  onMainMenu,
}) => {
  const scoreManager = ScoreManager.getInstance();
  const audio = AudioManager.getInstance();
  const state = scoreManager.getState();

  const completedCount = state.objectives.filter((o) => o.completed).length;

  return (
    <div
      id="screen-results"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-[#2a144b] via-[#1c0d34] to-[#110723] border-2 border-amber-400/50 p-6 sm:p-8 shadow-2xl text-white flex flex-col items-center text-center">
        {/* Festival Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-pink-500 flex items-center justify-center text-4xl mb-3 shadow-lg shadow-orange-500/40 animate-pulse">
          🐘
        </div>

        <h2 id="results-title" className="text-3xl font-black text-amber-200 tracking-wide">
          Festival Results!
        </h2>
        <p className="text-xs sm:text-sm text-amber-300/80 mt-1 mb-6">
          The evening Arti bell rings! Here is how your festival preparations went:
        </p>

        {/* Score & Coins Grid */}
        <div className="w-full grid grid-cols-2 gap-3 mb-4">
          <div className="p-3.5 rounded-xl bg-indigo-950/80 border border-amber-500/30 flex flex-col items-center">
            <Trophy className="w-6 h-6 text-amber-400 mb-1" />
            <span className="text-[10px] uppercase font-bold text-amber-400/80">Final Score</span>
            <span id="results-score" className="text-xl sm:text-2xl font-black font-mono text-yellow-300">
              {state.score.toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-950/80 border border-amber-500/30 flex flex-col items-center">
            <Coins className="w-6 h-6 text-yellow-400 mb-1" />
            <span className="text-[10px] uppercase font-bold text-amber-400/80">Coins Earned</span>
            <span id="results-coins" className="text-xl sm:text-2xl font-black font-mono text-yellow-300">
              +{state.coins}
            </span>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="w-full p-3 rounded-xl bg-indigo-950/60 border border-purple-800/40 flex items-center justify-around text-xs text-amber-200 mb-6">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              {completedCount} / {state.objectives.length} Objectives
            </span>
          </div>
          <div className="h-4 w-px bg-purple-700/50" />
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Chaos: {Math.round(state.chaosLevel)}%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            id="btn-results-play-again"
            onClick={() => {
              audio.playClick();
              onPlayAgain();
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-sm shadow-lg shadow-orange-500/30 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Festival Again</span>
          </button>

          <button
            id="btn-results-main-menu"
            onClick={() => {
              audio.playClick();
              onMainMenu();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 text-amber-200 font-bold text-sm border border-indigo-500/40 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
