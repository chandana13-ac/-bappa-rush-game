import React, { useEffect, useState } from 'react';
import { FestivalHub } from '../scene/FestivalHub';
import { GameState } from '../game/GameState';
import { TimerManager, TimerSnapshot } from '../game/TimerManager';
import { ScoreManager, ScoreState } from '../game/ScoreManager';
import { Terminal, X, Clock, Trophy, Flame, User } from 'lucide-react';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  isPaused: boolean;
  hub: FestivalHub | null;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  isOpen,
  onClose,
  gameState,
  isPaused,
  hub,
}) => {
  const [timerSnapshot, setTimerSnapshot] = useState<TimerSnapshot>(
    TimerManager.getInstance().getSnapshot()
  );
  const [scoreState, setScoreState] = useState<ScoreState>(
    ScoreManager.getInstance().getState()
  );

  const [playerInfo, setPlayerInfo] = useState<{
    x: number;
    y: number;
    z: number;
    activeKeys: string[];
    movementEnabled: boolean;
    isGrounded: boolean;
  }>({
    x: 0,
    y: 0,
    z: 0,
    activeKeys: [],
    movementEnabled: false,
    isGrounded: true,
  });

  // Subscribe to Timer and Score updates
  useEffect(() => {
    if (!isOpen) return;

    const timerManager = TimerManager.getInstance();
    const scoreManager = ScoreManager.getInstance();

    const unsubTimer = timerManager.subscribe((snap) => setTimerSnapshot(snap));
    const unsubScore = scoreManager.subscribe((state) => setScoreState(state));

    // Force initial sync
    setTimerSnapshot(timerManager.getSnapshot());
    setScoreState(scoreManager.getState());

    return () => {
      unsubTimer();
      unsubScore();
    };
  }, [isOpen]);

  // Track 3D player position in Hub
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;
    const updateDebug = () => {
      if (hub && hub.player) {
        const pos = hub.player.getPosition();
        setPlayerInfo({
          x: pos.x,
          y: pos.y,
          z: pos.z,
          activeKeys: hub.player.getActiveKeys(),
          movementEnabled: hub.player.isMovementEnabled(),
          isGrounded: hub.player.isGrounded(),
        });
      }
      animId = requestAnimationFrame(updateDebug);
    };

    animId = requestAnimationFrame(updateDebug);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, hub]);

  if (!isOpen) return null;

  const pandalObj = scoreState.objectives.find((o) => o.stationId === 'pandalPerfect');

  return (
    <div
      id="debug-panel"
      className="fixed top-16 left-4 z-50 w-80 max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-950/95 border border-emerald-500/40 p-4 shadow-2xl backdrop-blur-md text-xs font-mono text-emerald-400 select-none pointer-events-auto"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-emerald-500/30">
        <div className="flex items-center gap-2 font-bold text-emerald-300">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>DEBUG MONITOR [P]</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-emerald-950/60 text-emerald-400/70 hover:text-emerald-300 transition-colors"
          title="Close Debug Panel (P)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {/* 1. Game State Section */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Game State</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/80 border border-emerald-950 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Current State:</span>
              <span className="font-bold text-amber-300">{gameState}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Pause Status:</span>
              <span className={`font-bold ${isPaused ? 'text-rose-400' : 'text-emerald-300'}`}>
                {isPaused ? 'PAUSED' : 'RUNNING'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Timer Section */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Festival Timer</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/80 border border-emerald-950 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Formatted Time:</span>
              <span className="font-bold text-amber-300 font-mono">
                {timerSnapshot.formattedTime}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Time Remaining:</span>
              <span className="font-bold text-cyan-300 font-mono">
                {timerSnapshot.timeRemaining.toFixed(1)}s / {timerSnapshot.totalTime}s
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Timer State:</span>
              <span className={`font-bold ${timerSnapshot.isPaused ? 'text-rose-400' : 'text-emerald-300'}`}>
                {timerSnapshot.isPaused ? 'PAUSED' : 'TICKING'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Placement & Objectives Stats */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>Placement & Objectives</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/80 border border-emerald-950 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Pandal Perfect:</span>
              <span className="font-bold text-amber-300 font-mono">
                {pandalObj ? `${pandalObj.currentCount}/${pandalObj.targetCount} (${pandalObj.completed ? 'DONE' : 'INCOMPLETE'})` : '0/11'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Score / Coins:</span>
              <span className="font-bold text-yellow-300 font-mono">
                {scoreState.score} pts / {scoreState.coins} coins
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Combo Multiplier:</span>
              <span className="font-bold text-emerald-300 font-mono">
                {scoreState.combo}x (x{scoreState.comboMultiplier.toFixed(1)})
              </span>
            </div>
            <div className="pt-1 mt-1 border-t border-emerald-950/60 text-[10px] space-y-0.5">
              {scoreState.objectives.map((obj) => (
                <div key={obj.id} className="flex justify-between text-slate-400">
                  <span className="truncate max-w-[170px]">{obj.title}:</span>
                  <span className={obj.completed ? 'text-emerald-400' : 'text-amber-300'}>
                    {obj.currentCount}/{obj.targetCount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Player Controller Stats */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center gap-1">
            <User className="w-3 h-3 text-amber-400" />
            <span>Player Controller</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/80 border border-emerald-950 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Movement Enabled:</span>
              <span className={`font-bold ${playerInfo.movementEnabled ? 'text-emerald-300' : 'text-rose-400'}`}>
                {playerInfo.movementEnabled ? 'true' : 'false'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Grounded (Y=0):</span>
              <span className={`font-bold ${playerInfo.isGrounded ? 'text-emerald-300' : 'text-rose-400'}`}>
                {playerInfo.isGrounded ? 'true' : 'false'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Position X/Y/Z:</span>
              <span className="font-bold text-cyan-300 font-mono">
                {playerInfo.x.toFixed(2)}, {playerInfo.y.toFixed(2)}, {playerInfo.z.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Active Keys:</span>
              <span className="font-bold text-yellow-300">
                {playerInfo.activeKeys.length > 0 ? playerInfo.activeKeys.join(', ') : 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
