import React, { useState } from 'react';
import { Play, HelpCircle, Settings, Home, AlertTriangle } from 'lucide-react';
import { AudioManager } from '../game/AudioManager';

interface PauseMenuProps {
  onResume: () => void;
  onHowToPlay: () => void;
  onSettings: () => void;
  onQuitToMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onHowToPlay,
  onSettings,
  onQuitToMenu,
}) => {
  const [showConfirmQuit, setShowConfirmQuit] = useState(false);
  const audio = AudioManager.getInstance();

  return (
    <div
      id="menu-pause"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none"
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#251441] via-[#1a0c32] to-[#120724] border-2 border-amber-400/40 p-6 sm:p-8 shadow-2xl shadow-purple-950/80 text-white flex flex-col items-center text-center">
        {/* Header */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-purple-900/50">
          ⏸️
        </div>

        <h2 id="pause-title" className="text-2xl sm:text-3xl font-black text-amber-200 tracking-wide">
          Festival Paused
        </h2>
        <p className="text-xs sm:text-sm text-amber-300/80 mt-1 mb-6">
          Take a breath! All timers and preparations are safely halted.
        </p>

        {!showConfirmQuit ? (
          /* Main Pause Action Buttons */
          <div className="w-full flex flex-col gap-3">
            {/* Resume Button */}
            <button
              id="btn-pause-resume"
              onClick={() => {
                audio.playClick();
                onResume();
              }}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-base shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Resume Festival</span>
            </button>

            {/* How to Play */}
            <button
              id="btn-pause-how-to-play"
              onClick={() => {
                audio.playClick();
                onHowToPlay();
              }}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-purple-900/70 hover:bg-purple-800 text-amber-200 font-bold text-sm border border-purple-400/30 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-300" />
              <span>How to Play / Tutorial</span>
            </button>

            {/* Settings */}
            <button
              id="btn-pause-settings"
              onClick={() => {
                audio.playClick();
                onSettings();
              }}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-purple-900/70 hover:bg-purple-800 text-amber-200 font-bold text-sm border border-purple-400/30 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4 text-amber-300" />
              <span>Settings</span>
            </button>

            {/* Quit to Main Menu */}
            <button
              id="btn-pause-quit-prompt"
              onClick={() => {
                audio.playClick();
                setShowConfirmQuit(true);
              }}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 font-bold text-sm border border-rose-500/30 mt-2 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Home className="w-4 h-4 text-rose-300" />
              <span>Quit to Main Menu</span>
            </button>
          </div>
        ) : (
          /* Confirmation for Quit */
          <div id="pause-confirm-quit-card" className="w-full p-4 rounded-xl bg-rose-950/90 border border-rose-500/50 flex flex-col items-center">
            <AlertTriangle className="w-8 h-8 text-rose-400 mb-2" />
            <h4 className="font-bold text-base text-rose-200 mb-1">Return to Main Menu?</h4>
            <p className="text-xs text-rose-300/80 mb-4">
              Your active festival run progress will be saved to your festival record.
            </p>

            <div className="w-full grid grid-cols-2 gap-2">
              <button
                id="btn-pause-cancel-quit"
                onClick={() => {
                  audio.playClick();
                  setShowConfirmQuit(false);
                }}
                className="py-2.5 px-3 rounded-lg bg-indigo-900/80 hover:bg-indigo-800 text-amber-200 text-xs font-bold border border-indigo-500/40 cursor-pointer"
              >
                Keep Playing
              </button>
              <button
                id="btn-pause-confirm-quit"
                onClick={() => {
                  audio.playClick();
                  onQuitToMenu();
                }}
                className="py-2.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Yes, Quit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
