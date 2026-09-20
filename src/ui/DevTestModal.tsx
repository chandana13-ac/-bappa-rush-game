import React from 'react';
import { X, Wrench, Play, ShieldAlert, Sparkles, PlusCircle, MinusCircle } from 'lucide-react';
import { FESTIVAL_STATIONS, StationInfo } from '../data/festivalData';
import { GameState, MinigameId } from '../game/GameState';
import { ScoreManager } from '../game/ScoreManager';
import { TimerManager } from '../game/TimerManager';
import { AudioManager } from '../game/AudioManager';

interface DevTestModalProps {
  onClose: () => void;
  onOpenMinigame: (id: MinigameId) => void;
  onSwitchState: (state: GameState) => void;
  onTriggerError: () => void;
}

export const DevTestModal: React.FC<DevTestModalProps> = ({
  onClose,
  onOpenMinigame,
  onSwitchState,
  onTriggerError,
}) => {
  const scoreManager = ScoreManager.getInstance();
  const timerManager = TimerManager.getInstance();
  const audio = AudioManager.getInstance();

  return (
    <div
      id="modal-dev-test"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-gradient-to-b from-[#1f1035] via-[#160927] to-[#0d0417] border-2 border-amber-400/50 p-6 sm:p-7 shadow-2xl text-white flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-xl font-black text-amber-200">Development Test Center</h3>
              <p className="text-xs text-amber-300/70">
                Direct minigame testing & state machine controller
              </p>
            </div>
          </div>
          <button
            id="btn-dev-test-close"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-amber-300/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Minigame Direct Launch */}
        <div className="mb-5">
          <h4 className="text-xs uppercase font-extrabold tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5" />
            Direct Minigame Launchers (5 Stations)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {FESTIVAL_STATIONS.map((st) => (
              <button
                key={st.id}
                id={`btn-dev-launch-${st.id}`}
                onClick={() => {
                  audio.playClick();
                  onOpenMinigame(st.id);
                  onClose();
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-purple-500/30 hover:border-amber-400/60 transition-all text-left group cursor-pointer"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {st.icon}
                </span>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-100 group-hover:text-amber-300">
                      {st.name}
                    </span>
                    {(st.id === 'diyaDash' ||
                      st.id === 'rangoliRecall' ||
                      st.id === 'modakFactory' ||
                      st.id === 'dholEcho' ||
                      st.id === 'pandalPerfect') && (
                      <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Playable
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-amber-300/60 leading-tight">
                    {st.tagline}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Game State Machine Jumps */}
        <div className="mb-5">
          <h4 className="text-xs uppercase font-extrabold tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            State Machine Jumps
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              GameState.MAIN_MENU,
              GameState.TUTORIAL,
              GameState.FESTIVAL_HUB,
              GameState.RESULTS,
              GameState.GAME_OVER,
            ].map((stateName) => (
              <button
                key={stateName}
                id={`btn-dev-state-${stateName.toLowerCase()}`}
                onClick={() => {
                  audio.playClick();
                  onSwitchState(stateName);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 border border-purple-500/30 text-xs font-mono font-bold text-amber-200 transition-all cursor-pointer"
              >
                {stateName}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Gameplay Parameter Toggles */}
        <div className="mb-5">
          <h4 className="text-xs uppercase font-extrabold tracking-wider text-amber-400 mb-2">
            Parameter Controls
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => {
                scoreManager.addScore(500);
                audio.playBell();
              }}
              className="p-2 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-xs text-amber-200 font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" /> +500 Score
            </button>

            <button
              onClick={() => {
                scoreManager.addCoins(25);
                audio.playClick();
              }}
              className="p-2 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-xs text-yellow-200 font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-yellow-400" /> +25 Coins
            </button>

            <button
              onClick={() => {
                scoreManager.adjustChaos(20);
                audio.playClick();
              }}
              className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/40 text-xs text-rose-200 font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-rose-400" /> +20% Chaos
            </button>

            <button
              onClick={() => {
                scoreManager.adjustChaos(-20);
                audio.playClick();
              }}
              className="p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/40 text-xs text-emerald-200 font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <MinusCircle className="w-3.5 h-3.5 text-emerald-400" /> -20% Chaos
            </button>

            <button
              onClick={() => {
                timerManager.addTime(60);
                audio.playClick();
              }}
              className="p-2 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-xs text-amber-200 font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              +60s Time
            </button>

            <button
              onClick={() => {
                timerManager.addTime(-60);
                audio.playClick();
              }}
              className="p-2 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-xs text-amber-200 font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              -60s Time
            </button>
          </div>
        </div>

        {/* Section 4: Error Recovery Simulation */}
        <div className="pt-3 border-t border-amber-500/20">
          <button
            id="btn-dev-trigger-error"
            onClick={() => {
              onTriggerError();
            }}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-600/40 text-xs font-bold text-rose-200 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Simulate Error to Test "Return to Main Menu" Recovery Screen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
