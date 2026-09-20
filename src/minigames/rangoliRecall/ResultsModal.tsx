import React from 'react';
import { LevelResultStats, PetalColor } from './types';
import { RangoliBoard } from './RangoliBoard';
import {
  Sparkles,
  RotateCcw,
  ArrowRight,
  Home,
  CheckCircle2,
  Trophy,
  Coins,
  Clock,
  Unlock,
  Sliders,
} from 'lucide-react';

interface ResultsModalProps {
  stats: LevelResultStats;
  targetCells: (PetalColor | null)[];
  playerCells: (PetalColor | null)[];
  gridSize: 3 | 4 | 5;
  onRetry: () => void;
  onNextLevel: () => void;
  onOpenDifficultySelect: () => void;
  onExitToHub: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  stats,
  targetCells,
  playerCells,
  gridSize,
  onRetry,
  onNextLevel,
  onOpenDifficultySelect,
  onExitToHub,
}) => {
  const isPerfect = stats.isPerfect;
  const isPass = stats.accuracy >= 60;

  // Rating badge colors
  const getRatingBadgeClass = () => {
    switch (stats.rating) {
      case 'PERFECT MATCH':
        return 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-purple-950 shadow-yellow-500/40';
      case 'EXCELLENT':
        return 'bg-gradient-to-r from-emerald-500 to-teal-400 text-purple-950 shadow-emerald-500/30';
      case 'GOOD':
        return 'bg-gradient-to-r from-sky-500 to-indigo-400 text-white shadow-sky-500/30';
      default:
        return 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-orange-500/30';
    }
  };

  return (
    <div
      id="modal-level-results"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-[#25123d] via-[#1a0c2d] to-[#0e0419] border-2 border-amber-400/50 p-5 sm:p-7 shadow-2xl text-white my-auto flex flex-col">
        {/* Header Ribbon */}
        <div className="flex flex-col items-center text-center mb-4">
          <div
            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-black tracking-wider uppercase shadow-lg flex items-center gap-1.5 mb-2 ${getRatingBadgeClass()}`}
          >
            <Sparkles className="w-4 h-4" />
            {stats.rating}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-200">
            {stats.patternName}
          </h2>
          <p className="text-xs sm:text-sm text-amber-300/80">
            Level {stats.levelNumber} • {stats.difficulty.toUpperCase()} • Accuracy: {stats.accuracy}%
          </p>
        </div>

        {/* Unlock Announcement if new difficulty unlocked */}
        {stats.unlockedNewDifficulty && (
          <div
            id="announcement-unlocked-difficulty"
            className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border-2 border-amber-400/80 flex items-center gap-3 animate-pulse"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-purple-950 flex items-center justify-center flex-shrink-0">
              <Unlock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-sm text-amber-200">
                New Difficulty Unlocked: {stats.unlockedNewDifficulty.toUpperCase()}!
              </h4>
              <p className="text-xs text-amber-300/80">
                You have proven your memory skill! Take on larger boards and richer petal colors.
              </p>
            </div>
          </div>
        )}

        {/* Score & Rewards Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
          <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/30 flex flex-col items-center text-center">
            <span className="text-[10px] text-amber-300/70 uppercase font-semibold">
              Correct Petals
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-0.5">
              {stats.correctCells} / {stats.totalRequired}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/30 flex flex-col items-center text-center">
            <span className="text-[10px] text-amber-300/70 uppercase font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" /> Time Taken
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-200 font-mono mt-0.5">
              {stats.timeTaken.toFixed(1)}s
            </span>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/30 flex flex-col items-center text-center">
            <span className="text-[10px] text-amber-300/70 uppercase font-semibold flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-400" /> Festive Coins
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-300 font-mono mt-0.5">
              +{stats.coinsEarned}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/30 flex flex-col items-center text-center">
            <span className="text-[10px] text-amber-300/70 uppercase font-semibold flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" /> Score Earned
            </span>
            <span className="text-lg sm:text-xl font-black text-yellow-300 font-mono mt-0.5">
              +{stats.totalScore}
            </span>
          </div>
        </div>

        {/* Side-by-side Pattern Comparison (Crucial for Imperfect or Review) */}
        <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-[#170a25]/80 border border-purple-500/30">
          <div className="flex items-center justify-between mb-3 px-1">
            <h4 className="text-xs font-black tracking-wider uppercase text-amber-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Pattern Comparison (Target vs Your Submission)
            </h4>
            <span className="text-[11px] text-amber-200/70">
              {stats.accuracy}% match
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center justify-items-center">
            {/* Target Pattern */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-amber-300/80 mb-1.5">
                Target Pattern
              </span>
              <RangoliBoard
                gridSize={gridSize}
                cells={targetCells}
                disabled={true}
                className="scale-90 sm:scale-95"
              />
            </div>

            {/* Player Submitted Pattern with badges */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-amber-300/80 mb-1.5">
                Your Rangoli
              </span>
              <RangoliBoard
                gridSize={gridSize}
                cells={playerCells}
                disabled={true}
                comparison={stats.comparison.map((c) => ({
                  index: c.index,
                  isCorrect: c.isCorrect,
                }))}
                showStatusBadges={true}
                className="scale-90 sm:scale-95"
              />
            </div>
          </div>
        </div>

        {/* Actions Button Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-purple-500/20">
          <div className="flex items-center gap-2">
            <button
              id="btn-result-return-hub"
              onClick={onExitToHub}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-400/30 hover:border-amber-400/60 text-xs font-bold text-amber-200 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Return to Hub
            </button>
            <button
              id="btn-result-difficulty-select"
              onClick={onOpenDifficultySelect}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-400/30 hover:border-amber-400/60 text-xs font-bold text-amber-200 transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              Difficulty
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-result-retry-level"
              onClick={onRetry}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-400/40 hover:border-amber-400 text-xs font-bold text-amber-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Retry Level
            </button>

            <button
              id="btn-result-next-level"
              onClick={onNextLevel}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-purple-950 text-xs font-black shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Next Level
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
