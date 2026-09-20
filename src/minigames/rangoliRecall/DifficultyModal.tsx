import React from 'react';
import { Difficulty, DIFFICULTY_CONFIGS, RangoliSaveData } from './types';
import { X, Lock, CheckCircle, Sparkles, Award } from 'lucide-react';

interface DifficultyModalProps {
  currentDifficulty: Difficulty;
  saveData: RangoliSaveData;
  onSelectDifficulty: (diff: Difficulty) => void;
  onClose: () => void;
}

export const DifficultyModal: React.FC<DifficultyModalProps> = ({
  currentDifficulty,
  saveData,
  onSelectDifficulty,
  onClose,
}) => {
  const difficulties: Difficulty[] = ['easy', 'medium', 'difficult'];

  return (
    <div
      id="modal-difficulty-select"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#24133b] via-[#1a0c2c] to-[#0f041c] border-2 border-amber-400/50 p-6 sm:p-7 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-5">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-xl font-black text-amber-200">Select Difficulty</h3>
              <p className="text-xs text-amber-300/70">
                Progress through levels to unlock grander festive mandalas
              </p>
            </div>
          </div>
          <button
            id="btn-close-difficulty-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-300/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Difficulty Cards */}
        <div className="flex flex-col gap-3.5 mb-6">
          {difficulties.map((diff) => {
            const cfg = DIFFICULTY_CONFIGS[diff];
            const isUnlocked =
              diff === 'easy' || saveData.unlockedDifficulties.includes(diff);
            const isSelected = currentDifficulty === diff;

            let completedCount = 0;
            if (diff === 'easy') completedCount = saveData.easyCompleted;
            else if (diff === 'medium') completedCount = saveData.mediumCompleted;
            else completedCount = saveData.difficultCompleted;

            return (
              <div
                key={diff}
                id={`card-difficulty-${diff}`}
                onClick={() => {
                  if (isUnlocked) {
                    onSelectDifficulty(diff);
                    onClose();
                  }
                }}
                className={`relative flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isUnlocked
                    ? isSelected
                      ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 cursor-pointer shadow-lg'
                      : 'bg-[#210f36]/70 hover:bg-[#2c1547] border-purple-500/30 hover:border-amber-400/50 cursor-pointer'
                    : 'bg-[#150924]/60 border-purple-900/30 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                      diff === 'easy'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : diff === 'medium'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}
                  >
                    {cfg.gridSize}x{cfg.gridSize}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-amber-100">{cfg.title}</h4>
                      {isSelected && (
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-purple-950 font-mono">
                          Selected
                        </span>
                      )}
                      {!isUnlocked && (
                        <span className="flex items-center gap-1 text-[11px] text-rose-300 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-200/70 mt-0.5">
                      {cfg.gridSize}x{cfg.gridSize} Grid • {cfg.availableColors.length} Colors •{' '}
                      {cfg.memorizeSeconds}s Memorize • {cfg.rebuildSeconds}s Rebuild
                    </p>
                    {!isUnlocked && (
                      <p className="text-[11px] text-amber-400/90 mt-1">
                        {diff === 'medium'
                          ? `Unlock condition: Complete 3 Easy patterns with 60%+ score (${saveData.easyCompleted}/3 completed)`
                          : `Unlock condition: Complete 3 Medium patterns with 70%+ score (${saveData.mediumCompleted}/3 completed)`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center gap-1 text-xs text-amber-300/80">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Completed:</span>
                    <span className="font-bold text-white">{completedCount} / 5</span>
                  </div>
                  <span className="text-[10px] text-purple-300/60 font-mono mt-0.5">
                    {cfg.scoreMultiplier}x Score Multiplier
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs text-amber-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Highest Rangoli Recall Score:</span>
          </div>
          <span className="font-bold text-amber-300 font-mono text-sm">
            {saveData.highScore.toLocaleString()} pts
          </span>
        </div>
      </div>
    </div>
  );
};
