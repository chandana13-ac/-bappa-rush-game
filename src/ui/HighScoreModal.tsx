import React, { useState, useEffect } from 'react';
import { Trophy, Coins, Calendar, X, Sparkles } from 'lucide-react';
import { SaveManager, SaveData } from '../game/SaveManager';
import { AudioManager } from '../game/AudioManager';

interface HighScoreModalProps {
  onClose: () => void;
}

export const HighScoreModal: React.FC<HighScoreModalProps> = ({ onClose }) => {
  const saveManager = SaveManager.getInstance();
  const audio = AudioManager.getInstance();
  const [data, setData] = useState<SaveData>(saveManager.getData());

  useEffect(() => {
    return saveManager.subscribe((newData) => {
      setData(newData);
    });
  }, [saveManager]);

  return (
    <div
      id="modal-high-scores"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-[#251341] via-[#1a0c32] to-[#120724] border-2 border-amber-400/40 p-6 sm:p-7 shadow-2xl shadow-purple-950/80 text-white flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-xl font-black text-amber-200">Festival Hall of Fame</h3>
              <p className="text-xs text-amber-300/70">Top volunteer high scores</p>
            </div>
          </div>
          <button
            id="btn-high-scores-close"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-amber-300/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-indigo-950/80 border border-amber-500/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-xl">
              🏆
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400/80">Best Score</span>
              <p className="text-lg font-mono font-black text-yellow-300">
                {data.highScore.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/80 border border-amber-500/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-xl">
              🪙
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400/80">Total Coins</span>
              <p className="text-lg font-mono font-black text-yellow-300">
                {data.totalCoins.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Score List */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
          {data.highScoresList.map((entry, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                idx === 0
                  ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-purple-500/20 border-amber-400/60 shadow-md'
                  : 'bg-indigo-950/60 border-purple-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono ${
                    idx === 0
                      ? 'bg-amber-400 text-purple-950 shadow-sm'
                      : idx === 1
                      ? 'bg-slate-300 text-purple-950'
                      : idx === 2
                      ? 'bg-amber-700 text-white'
                      : 'bg-indigo-900 text-amber-300'
                  }`}
                >
                  {idx + 1}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-amber-100 flex items-center gap-1.5">
                    {entry.playerName}
                    {idx === 0 && <Sparkles className="w-3.5 h-3.5 text-yellow-300" />}
                  </h4>
                  <span className="text-[10px] text-amber-300/60 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {entry.date}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-base font-mono font-extrabold text-amber-300">
                  {entry.score.toLocaleString()} pts
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Close Button */}
        <button
          id="btn-high-scores-done"
          onClick={() => {
            audio.playClick();
            onClose();
          }}
          className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-sm shadow-md hover:from-amber-400 hover:to-orange-400 transition-all cursor-pointer"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
};
