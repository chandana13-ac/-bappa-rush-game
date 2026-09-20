import React from 'react';
import { Difficulty, GamePhase, PetalColor, RangoliPattern } from './types';
import { Bug, X, Play, CheckCircle2, AlertCircle } from 'lucide-react';

interface DebugMonitorProps {
  phase: GamePhase;
  difficulty: Difficulty;
  levelNumber: number;
  pattern: RangoliPattern;
  playerGrid: (PetalColor | null)[];
  memorizeTimer: number;
  rebuildTimer: number;
  selectedColor: PetalColor;
  hintsUsed: number;
  score: number;
  unlockedDifficulties: Difficulty[];
  activeTimerCount: number;
  isPaused: boolean;
  onClose: () => void;
  onAutocompleteTarget: () => void;
  onForceSubmit: () => void;
}

export const DebugMonitor: React.FC<DebugMonitorProps> = ({
  phase,
  difficulty,
  levelNumber,
  pattern,
  playerGrid,
  memorizeTimer,
  rebuildTimer,
  selectedColor,
  hintsUsed,
  score,
  unlockedDifficulties,
  activeTimerCount,
  isPaused,
  onClose,
  onAutocompleteTarget,
  onForceSubmit,
}) => {
  return (
    <div
      id="panel-rangoli-debug"
      className="fixed bottom-4 right-4 z-50 w-96 max-h-[85vh] rounded-2xl bg-black/90 border-2 border-emerald-400 p-4 shadow-2xl text-emerald-300 font-mono text-xs overflow-y-auto select-none"
    >
      <div className="flex items-center justify-between pb-2 border-b border-emerald-500/40 mb-3">
        <div className="flex items-center gap-1.5 font-black text-emerald-400 text-sm">
          <Bug className="w-4 h-4" />
          RANGOLI RECALL DEBUG (Press R)
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-emerald-400 hover:text-white hover:bg-emerald-900/50 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Game State / Phase:</span>
          <span className="font-bold text-yellow-300">{phase}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Difficulty:</span>
          <span className="font-bold text-yellow-300 uppercase">{difficulty}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Level Number:</span>
          <span className="font-bold text-white">{levelNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Pattern ID:</span>
          <span className="font-bold text-white">{pattern.id} ({pattern.name})</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Grid Size:</span>
          <span className="font-bold text-white">{pattern.gridSize}x{pattern.gridSize}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Memorize Timer:</span>
          <span className="font-bold text-cyan-300">{memorizeTimer.toFixed(1)}s</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Rebuild Timer:</span>
          <span className="font-bold text-cyan-300">{rebuildTimer.toFixed(1)}s</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Selected Color:</span>
          <span className="font-bold text-white capitalize">{selectedColor}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Hints Used:</span>
          <span className="font-bold text-white">{hintsUsed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Score:</span>
          <span className="font-bold text-amber-300">{score}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Unlocked Difficulties:</span>
          <span className="font-bold text-emerald-400">
            {unlockedDifficulties.join(', ')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Active Timer Count:</span>
          <span className="font-bold text-white">{activeTimerCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Paused:</span>
          <span className={`font-bold ${isPaused ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isPaused ? 'TRUE' : 'FALSE'}
          </span>
        </div>
      </div>

      {/* Target vs Player preview arrays */}
      <div className="p-2 rounded bg-gray-950 border border-emerald-900/50 mb-3 space-y-1">
        <div className="text-[10px] text-gray-400">
          Target ({pattern.cells.filter(Boolean).length} petals):
        </div>
        <div className="text-[10px] text-yellow-200/80 break-all">
          {JSON.stringify(pattern.cells.map((c) => (c ? c[0].toUpperCase() : '-')))}
        </div>
        <div className="text-[10px] text-gray-400 mt-1">
          Player ({playerGrid.filter(Boolean).length} petals):
        </div>
        <div className="text-[10px] text-cyan-200/80 break-all">
          {JSON.stringify(playerGrid.map((c) => (c ? c[0].toUpperCase() : '-')))}
        </div>
      </div>

      {/* Quick Test Actions */}
      <div className="space-y-1.5 pt-2 border-t border-emerald-500/30">
        <span className="text-[10px] text-gray-400 uppercase font-bold">Quick Actions:</span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onAutocompleteTarget}
            disabled={phase !== 'REBUILD'}
            className="px-2 py-1 rounded bg-emerald-900/70 hover:bg-emerald-800 disabled:opacity-40 text-emerald-200 text-[10px] font-bold cursor-pointer"
          >
            Autocomplete Target
          </button>
          <button
            onClick={onForceSubmit}
            disabled={phase !== 'REBUILD'}
            className="px-2 py-1 rounded bg-amber-900/70 hover:bg-amber-800 disabled:opacity-40 text-amber-200 text-[10px] font-bold cursor-pointer"
          >
            Force Submit
          </button>
        </div>
      </div>
    </div>
  );
};
