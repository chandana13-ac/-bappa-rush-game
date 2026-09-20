import React from 'react';
import { Pause, Coins, Flame, Trophy, Zap, Wrench, AlertTriangle } from 'lucide-react';
import { StationInfo } from '../data/festivalData';
import { Objective } from '../game/GameState';
import { AudioManager } from '../game/AudioManager';

interface HUDProps {
  timerFormatted: string;
  isTimerLow: boolean;
  score: number;
  coins: number;
  combo: number;
  comboMultiplier: number;
  chaosLevel: number;
  currentObjective: Objective | null;
  activeNearbyStation: StationInfo | null;
  onPauseClick: () => void;
  onDevTestClick: () => void;
  onInteractClick: () => void;
  onDebugClick?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  timerFormatted,
  isTimerLow,
  score,
  coins,
  combo,
  comboMultiplier,
  chaosLevel,
  currentObjective,
  activeNearbyStation,
  onPauseClick,
  onDevTestClick,
  onInteractClick,
  onDebugClick,
}) => {
  const audio = AudioManager.getInstance();

  return (
    <div
      id="game-hud"
      className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-5 select-none"
    >
      {/* Top Bar */}
      <div className="w-full flex items-start justify-between gap-2">
        {/* Left Stats: Score, Coins, Combo */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Score & Coins Badge */}
          <div className="flex items-center gap-2 bg-indigo-950/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-amber-500/30 shadow-lg text-white">
            <div className="flex items-center gap-1.5 pr-3 border-r border-indigo-800">
              <Trophy className="w-4 h-4 text-amber-400" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-amber-300/70 leading-none">Score</span>
                <span id="hud-score-value" className="text-base sm:text-lg font-mono font-black text-amber-300">
                  {score.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pl-1">
              <Coins className="w-4 h-4 text-yellow-400" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-amber-300/70 leading-none">Coins</span>
                <span id="hud-coins-value" className="text-base sm:text-lg font-mono font-black text-yellow-300">
                  {coins}
                </span>
              </div>
            </div>
          </div>

          {/* Combo Multiplier indicator (shows when combo > 0) */}
          {combo > 0 && (
            <div
              id="hud-combo-badge"
              className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-lg bg-gradient-to-r from-orange-600 to-pink-600 text-white border border-yellow-300/40 shadow-md animate-bounce"
            >
              <Zap className="w-4 h-4 text-yellow-300 fill-current" />
              <span className="text-xs font-black tracking-wider">
                {comboMultiplier}x COMBO! ({combo} hits)
              </span>
            </div>
          )}
        </div>

        {/* Center: Countdown Timer & Chaos Meter */}
        <div className="flex flex-col items-center gap-1.5">
          {/* Main Countdown Timer */}
          <div
            id="hud-timer-badge"
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border backdrop-blur-md shadow-xl transition-all ${
              isTimerLow
                ? 'bg-rose-950/90 border-rose-500 text-rose-200 animate-pulse'
                : 'bg-indigo-950/85 border-amber-500/40 text-amber-100'
            }`}
          >
            <span className="text-xs sm:text-sm uppercase font-bold tracking-wider text-amber-400/80">
              Festival Time
            </span>
            <span
              id="hud-timer-value"
              className="text-lg sm:text-2xl font-black font-mono tracking-wider text-yellow-300 drop-shadow"
            >
              {timerFormatted}
            </span>
          </div>

          {/* Festival Chaos Meter */}
          <div className="w-40 sm:w-56 bg-indigo-950/90 rounded-full px-2 py-1 border border-purple-500/30 flex items-center gap-1.5 shadow-md">
            <Flame
              className={`w-3.5 h-3.5 ${
                chaosLevel > 70 ? 'text-rose-500 animate-bounce' : 'text-orange-400'
              }`}
            />
            <div className="flex-1 bg-indigo-900/90 h-2 rounded-full overflow-hidden border border-purple-700/50">
              <div
                id="hud-chaos-bar"
                className={`h-full transition-all duration-300 ${
                  chaosLevel > 70
                    ? 'bg-gradient-to-r from-orange-500 to-rose-600'
                    : 'bg-gradient-to-r from-emerald-400 via-amber-400 to-orange-500'
                }`}
                style={{ width: `${chaosLevel}%` }}
              />
            </div>
            <span
              id="hud-chaos-value"
              className="text-[10px] font-mono font-bold text-amber-200 min-w-[28px] text-right"
            >
              {Math.round(chaosLevel)}%
            </span>
          </div>
        </div>

        {/* Right Buttons: Dev Test Button & Pause Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Debug Monitor Toggle Button */}
          {onDebugClick && (
            <button
              id="btn-hud-debug"
              onClick={() => {
                audio.playClick();
                onDebugClick();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-md text-xs sm:text-sm font-mono font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              title="Toggle Debug Monitor [P]"
            >
              <span>[P] Debug</span>
            </button>
          )}

          {/* Visible Development Test button as specifically requested */}
          <button
            id="btn-dev-test"
            onClick={() => {
              audio.playClick();
              onDevTestClick();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/50 backdrop-blur-md shadow-md text-xs sm:text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            title="Development Test Mode: open any minigame directly"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Development Test</span>
          </button>

          {/* Pause Button */}
          <button
            id="btn-hud-pause"
            onClick={() => {
              audio.playClick();
              onPauseClick();
            }}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-950/85 hover:bg-indigo-900 text-amber-200 border border-amber-500/40 backdrop-blur-md shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Pause Game (Esc)"
          >
            <Pause className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>

      {/* Center Proximity Interaction Banner (when player is near a station) */}
      {activeNearbyStation && (
        <div className="self-center pointer-events-auto my-auto animate-fade-in">
          <div
            id="interaction-prompt-banner"
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-indigo-950/95 border-2 shadow-2xl backdrop-blur-md transform transition-transform duration-150 hover:scale-105"
            style={{ borderColor: activeNearbyStation.themeColor }}
          >
            <span className="text-3xl">{activeNearbyStation.icon}</span>
            <div className="flex flex-col">
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-300">
                Festival Station
              </span>
              <h3 className="text-lg font-black text-white">{activeNearbyStation.name}</h3>
              <p className="text-xs text-amber-200/80">{activeNearbyStation.tagline}</p>
            </div>
            <button
              id="btn-interact-prompt"
              onClick={() => {
                audio.playBell();
                onInteractClick();
              }}
              className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-black text-sm shadow-md cursor-pointer hover:brightness-110 active:scale-95 transition-all"
              style={{ backgroundColor: activeNearbyStation.themeColor }}
            >
              <span>[E] Enter</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Bar: Objective & Controls reminder */}
      <div className="w-full flex items-end justify-between gap-3">
        {/* Current Objective Card */}
        {currentObjective && (
          <div
            id="hud-objective-card"
            className="pointer-events-auto max-w-xs sm:max-w-sm bg-indigo-950/85 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-amber-500/30 shadow-lg text-white"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                Current Festival Objective
              </span>
              <span className="text-[10px] font-mono text-yellow-300 font-bold">
                +{currentObjective.rewardCoins} 🪙
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-amber-100">{currentObjective.title}</p>
            <div className="w-full bg-indigo-900/80 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (currentObjective.currentCount / currentObjective.targetCount) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Quick controls helper hint */}
        <div className="hidden md:flex items-center gap-2.5 bg-indigo-950/75 backdrop-blur-sm px-3.5 py-1.5 rounded-lg border border-indigo-800/50 text-[11px] text-amber-200/80 font-mono">
          <span>WASD / Arrows: Move</span>
          <span>•</span>
          <span>Shift: Run</span>
          <span>•</span>
          <span>Mouse Drag: Rotate Camera</span>
          <span>•</span>
          <span>E: Interact</span>
          <span>•</span>
          <span>P: Debug</span>
          <span>•</span>
          <span>Esc: Pause</span>
        </div>
      </div>
    </div>
  );
};
