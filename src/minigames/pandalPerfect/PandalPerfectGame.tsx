import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PandalScene } from './PandalScene';
import {
  DecorationType,
  INITIAL_OBJECTIVES,
  PandalObjectiveState,
  PlacedDecoration,
  SnapPoint,
  TOOLBAR_ITEMS,
} from './types';
import { ScoreManager } from '../../game/ScoreManager';
import { AudioManager } from '../../game/AudioManager';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Trophy,
  Undo2,
  CheckCircle2,
  Clock,
  Flame,
  Info,
  Pause,
} from 'lucide-react';

interface PandalPerfectGameProps {
  onExitToHub: () => void;
  isPaused?: boolean;
  onPause?: () => void;
}

type Phase = 'INSTRUCTIONS' | 'PLAYING' | 'SUCCESS_REVEAL' | 'RESULTS';

export const PandalPerfectGame: React.FC<PandalPerfectGameProps> = ({
  onExitToHub,
  isPaused = false,
  onPause,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<PandalScene | null>(null);

  // Managers
  const scoreManager = useRef(ScoreManager.getInstance()).current;
  const audio = useRef(AudioManager.getInstance()).current;

  // Phase & Time
  const [phase, setPhase] = useState<Phase>('INSTRUCTIONS');
  const [timeRemaining, setTimeRemaining] = useState<number>(45.0);

  // Selected tool from bottom bar
  const [selectedTool, setSelectedTool] = useState<DecorationType>('diya');

  // Objectives and placement history
  const [objectives, setObjectives] = useState<PandalObjectiveState>(INITIAL_OBJECTIVES);
  const [placementHistory, setPlacementHistory] = useState<PlacedDecoration[]>([]);
  const [roundScore, setRoundScore] = useState<number>(0);

  // UI Toast / Feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; color: string } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stats for result
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [coinsEarned, setCoinsEarned] = useState<number>(0);

  // Synchronized refs to avoid stale closures and prevent setState inside render updaters
  const objectivesRef = useRef(objectives);
  useEffect(() => {
    objectivesRef.current = objectives;
  }, [objectives]);

  const timeRemainingRef = useRef(timeRemaining);
  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  const showToast = useCallback((text: string, color: string = 'text-amber-300') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage({ text, color });
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  }, []);

  // 1. Mount 3D Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new PandalScene(containerRef.current);
    sceneRef.current = scene;

    // Connect snap point click handler via stable ref
    scene.onSnapPointClicked = (snapPoint: SnapPoint) => {
      handleSnapPointInteractionRef.current(snapPoint);
    };

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, []);

  // Sync activeTool with scene for visual pulsing beacons
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.activeTool = selectedTool;
    }
  }, [selectedTool]);

  // Finish game logic (declared before handleSnapPointInteraction)
  const handleGameFinished = useCallback(
    (won: boolean, finalObjectives: PandalObjectiveState) => {
      setIsVictory(won);

      const totalPlaced =
        finalObjectives.diyasPlaced +
        finalObjectives.garlandsPlaced +
        finalObjectives.lanternsPlaced +
        finalObjectives.rangoliPlaced;

      let bonus = 0;
      if (won) {
        bonus += 1000; // Complete all bonus
        bonus += Math.floor(timeRemainingRef.current * 20); // Time bonus
        audio.playSuccess();
        if (sceneRef.current) {
          sceneRef.current.startCelebration();
        }
        setPhase('SUCCESS_REVEAL');
      } else {
        audio.playBell();
        setPhase('RESULTS');
      }

      setRoundScore((prev) => prev + bonus);
      scoreManager.addScore(bonus);

      // Award festival coins
      const earnedCoins = won ? 120 : Math.floor(totalPlaced * 10);
      setCoinsEarned(earnedCoins);
      scoreManager.addCoins(earnedCoins);
    },
    [audio, scoreManager]
  );

  // Handle snap point placement
  const handleSnapPointInteraction = useCallback(
    (snap: SnapPoint) => {
      if (phase !== 'PLAYING' || isPaused) return;

      if (snap.isOccupied) {
        showToast('This spot is already decorated!', 'text-amber-400');
        audio.playClick();
        return;
      }

      // Check if selected tool matches spot type
      if (snap.type !== selectedTool) {
        const matchingTool = TOOLBAR_ITEMS.find((t) => t.type === snap.type);
        showToast(
          `This spot requires a ${matchingTool?.label || snap.type}! Select it from the toolbar below.`,
          'text-rose-300'
        );
        audio.playClick();
        return;
      }

      // Successful placement
      if (sceneRef.current) {
        const success = sceneRef.current.placeDecoration(snap.id, selectedTool);
        if (success) {
          audio.playBell();

          // Calculate score
          const itemScore = 150;
          setRoundScore((prev) => prev + itemScore);
          scoreManager.addScore(itemScore);

          // Record history for Undo
          setPlacementHistory((prev) => [
            ...prev,
            { snapPointId: snap.id, type: selectedTool, timestamp: Date.now() },
          ]);

          // Update objectives purely outside render
          const prevObj = objectivesRef.current;
          const next: PandalObjectiveState = {
            ...prevObj,
            diyasPlaced: prevObj.diyasPlaced + (selectedTool === 'diya' ? 1 : 0),
            garlandsPlaced: prevObj.garlandsPlaced + (selectedTool === 'garland' ? 1 : 0),
            lanternsPlaced: prevObj.lanternsPlaced + (selectedTool === 'lantern' ? 1 : 0),
            rangoliPlaced: prevObj.rangoliPlaced + (selectedTool === 'rangoli' ? 1 : 0),
          };
          setObjectives(next);

          // Sync with global festival objective
          scoreManager.progressObjective('pandalPerfect', 1);

          showToast(`+150 ${snap.label} Placed!`, 'text-emerald-300');

          // Check if all 11 items are completed!
          const totalPlaced =
            next.diyasPlaced + next.garlandsPlaced + next.lanternsPlaced + next.rangoliPlaced;

          if (totalPlaced >= 11) {
            handleGameFinished(true, next);
          }
        }
      }
    },
    [phase, isPaused, selectedTool, audio, scoreManager, showToast, handleGameFinished]
  );

  const handleSnapPointInteractionRef = useRef(handleSnapPointInteraction);
  useEffect(() => {
    handleSnapPointInteractionRef.current = handleSnapPointInteraction;
  }, [handleSnapPointInteraction]);

  // Undo last placement
  const handleUndo = useCallback(() => {
    if (placementHistory.length === 0 || phase !== 'PLAYING') return;

    const lastPlacement = placementHistory[placementHistory.length - 1];
    if (sceneRef.current) {
      const undone = sceneRef.current.removeDecoration(lastPlacement.snapPointId);
      if (undone) {
        audio.playClick();

        // Roll back history
        setPlacementHistory((prev) => prev.slice(0, -1));

        // Roll back score
        setRoundScore((prev) => Math.max(0, prev - 150));

        // Roll back objective count
        setObjectives((prev) => {
          const next = { ...prev };
          if (lastPlacement.type === 'diya') next.diyasPlaced = Math.max(0, next.diyasPlaced - 1);
          if (lastPlacement.type === 'garland')
            next.garlandsPlaced = Math.max(0, next.garlandsPlaced - 1);
          if (lastPlacement.type === 'lantern')
            next.lanternsPlaced = Math.max(0, next.lanternsPlaced - 1);
          if (lastPlacement.type === 'rangoli')
            next.rangoliPlaced = Math.max(0, next.rangoliPlaced - 1);
          return next;
        });

        showToast('Decoration removed', 'text-amber-200');
      }
    }
  }, [placementHistory, phase, audio, showToast]);

  // 45s Countdown Timer
  useEffect(() => {
    if (phase !== 'PLAYING' || isPaused) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0.1) {
          return 0;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [phase, isPaused]);

  // Handle time expiration safely in effect
  useEffect(() => {
    if (phase === 'PLAYING' && timeRemaining <= 0) {
      handleGameFinished(false, objectivesRef.current);
    }
  }, [phase, timeRemaining, handleGameFinished]);

  // Start Decorating Action
  const handleStartDecorating = () => {
    audio.playClick();
    setPhase('PLAYING');
  };

  // Restart Round
  const handleRestart = () => {
    audio.playClick();

    // Reset scene
    if (sceneRef.current) {
      sceneRef.current.resetCelebration();
      sceneRef.current.snapPoints.forEach((s) => {
        if (s.isOccupied) {
          sceneRef.current?.removeDecoration(s.id);
        }
      });
    }

    setObjectives(INITIAL_OBJECTIVES);
    setPlacementHistory([]);
    setRoundScore(0);
    setTimeRemaining(45.0);
    setIsVictory(false);
    setSelectedTool('diya');
    setPhase('PLAYING');
  };

  const totalPlaced =
    objectives.diyasPlaced +
    objectives.garlandsPlaced +
    objectives.lanternsPlaced +
    objectives.rangoliPlaced;

  return (
    <div className="absolute inset-0 z-30 flex flex-col select-none overflow-hidden bg-slate-950 font-sans">
      {/* 1. 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-pointer" />

      {/* 2. Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-slate-950/80 via-slate-900/50 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={onExitToHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-800 text-amber-200 border border-amber-500/30 text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Festival Hub</span>
          </button>
          {onPause && (
            <button
              onClick={() => {
                audio.playClick();
                onPause();
              }}
              title="Pause Mini-Game (Esc)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-800 text-amber-200 border border-amber-500/30 text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <Pause className="w-4 h-4" />
              <span className="hidden sm:inline">Pause</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-wide text-amber-300">PANDAL PERFECT</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30">
                3D Decoration
              </span>
            </div>
            <p className="text-[11px] text-slate-300">Complete sacred pandal before the aarti!</p>
          </div>
        </div>

        {/* Timer & Score HUD */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Timer */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-lg ${
              timeRemaining <= 10
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse'
                : 'bg-slate-900/80 border-amber-500/30 text-amber-200'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Time</span>
              <span className="text-base font-black font-mono leading-none">
                {timeRemaining.toFixed(1)}s
              </span>
            </div>
          </div>

          {/* Round Score */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-amber-500/30 backdrop-blur-md shadow-lg text-amber-300">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Score</span>
              <span className="text-base font-black font-mono leading-none">{roundScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-300 animate-bounce">
          <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-amber-500/40 backdrop-blur-md shadow-2xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className={`text-xs font-bold ${toastMessage.color}`}>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* 3. Right Checklist Panel (Objectives) */}
      <div className="absolute right-4 top-20 z-10 w-72 pointer-events-auto">
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 backdrop-blur-md shadow-2xl text-slate-100">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                Pandal Checklist
              </span>
            </div>
            <span className="text-xs font-black font-mono text-amber-300">
              {totalPlaced}/11
            </span>
          </div>

          <div className="space-y-2">
            {/* 1. Diyas */}
            <div
              className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                objectives.diyasPlaced >= 5
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                  : 'bg-slate-800/60 border border-slate-700/50 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🪔</span>
                <div>
                  <div className="text-xs font-bold leading-tight">Place 5 Diyas</div>
                  <div className="text-[10px] text-slate-400">Pedestals & stage</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black font-mono">
                  {objectives.diyasPlaced}/5
                </span>
                {objectives.diyasPlaced >= 5 && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>

            {/* 2. Marigold Garlands */}
            <div
              className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                objectives.garlandsPlaced >= 3
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                  : 'bg-slate-800/60 border border-slate-700/50 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🌼</span>
                <div>
                  <div className="text-xs font-bold leading-tight">Place 3 Marigold Garlands</div>
                  <div className="text-[10px] text-slate-400">Entrance arch & pillars</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black font-mono">
                  {objectives.garlandsPlaced}/3
                </span>
                {objectives.garlandsPlaced >= 3 && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>

            {/* 3. Lanterns */}
            <div
              className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                objectives.lanternsPlaced >= 2
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                  : 'bg-slate-800/60 border border-slate-700/50 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🏮</span>
                <div>
                  <div className="text-xs font-bold leading-tight">Place 2 Lanterns</div>
                  <div className="text-[10px] text-slate-400">Canopy hanging hooks</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black font-mono">
                  {objectives.lanternsPlaced}/2
                </span>
                {objectives.lanternsPlaced >= 2 && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>

            {/* 4. Rangoli */}
            <div
              className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                objectives.rangoliPlaced >= 1
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                  : 'bg-slate-800/60 border border-slate-700/50 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🌸</span>
                <div>
                  <div className="text-xs font-bold leading-tight">Place 1 Rangoli</div>
                  <div className="text-[10px] text-slate-400">Sanctum courtyard floor</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black font-mono">
                  {objectives.rangoliPlaced}/1
                </span>
                {objectives.rangoliPlaced >= 1 && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>
          </div>

          {/* Overall Completion Progress */}
          <div className="mt-3 pt-2.5 border-t border-slate-800">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Overall Completion</span>
              <span className="font-bold text-amber-300">
                {Math.round((totalPlaced / 11) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${(totalPlaced / 11) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Toolbar */}
      <div className="relative z-10 mt-auto p-4 flex justify-center items-center pointer-events-none">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 p-2.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 backdrop-blur-lg shadow-2xl pointer-events-auto">
          {TOOLBAR_ITEMS.map((item) => {
            const isSelected = selectedTool === item.type;
            const currentCount = objectives[item.badgeCountKey] as number;
            const targetCount = objectives[item.targetCountKey] as number;
            const isFinished = currentCount >= targetCount;

            return (
              <button
                key={item.type}
                onClick={() => {
                  audio.playClick();
                  setSelectedTool(item.type);
                }}
                title={item.tooltip}
                className={`group relative flex flex-col items-center justify-center min-w-[76px] sm:min-w-[88px] h-16 sm:h-18 px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)] scale-105'
                    : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/70 text-slate-300'
                }`}
              >
                {/* Badge count */}
                <div
                  className={`absolute -top-2 -right-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black font-mono border shadow-md ${
                    isFinished
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-slate-950 border-amber-500/50 text-amber-300'
                  }`}
                >
                  {currentCount}/{targetCount}
                </div>

                {/* Decoration Icon Preview */}
                <span className="text-xl sm:text-2xl filter drop-shadow group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>

                {/* Label */}
                <span
                  className={`text-[11px] font-bold mt-1 tracking-tight leading-none ${
                    isSelected ? 'text-amber-200' : 'text-slate-300'
                  }`}
                >
                  {item.label}
                </span>

                {/* Selection indicator pill */}
                {isSelected && (
                  <div className="absolute -bottom-1 w-6 h-1 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}

          {/* Undo Button */}
          <div className="h-10 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

          <button
            onClick={handleUndo}
            disabled={placementHistory.length === 0}
            title="Undo last decoration placement"
            className={`flex flex-col items-center justify-center min-w-[76px] sm:min-w-[84px] h-16 sm:h-18 px-3 py-1.5 rounded-xl border transition-all ${
              placementHistory.length > 0
                ? 'bg-slate-800/80 hover:bg-slate-700 text-amber-200 border-slate-600 shadow-md active:scale-95'
                : 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold leading-none">Undo</span>
            <span className="text-[9px] text-slate-500">Placement</span>
          </button>
        </div>
      </div>

      {/* 5. Instruction Modal (Entry Flow) */}
      {phase === 'INSTRUCTIONS' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/40 shadow-2xl text-center">
            {/* Header Icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>

            <h2 className="text-2xl font-black tracking-wide text-amber-300">PANDAL PERFECT</h2>
            <p className="mt-2 text-sm text-slate-300 font-medium">
              Complete the decorations before the festival begins!
            </p>

            {/* Instruction Steps */}
            <div className="mt-5 p-4 rounded-xl bg-slate-950/60 border border-amber-500/20 text-left space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-xs font-bold shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-xs text-slate-200">
                  Choose a decoration from the bottom toolbar (Diya, Garland, Lantern, or Rangoli).
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-xs text-slate-200">
                  Click a matching glowing spot on the pandal to snap it firmly into place.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-xs font-bold shrink-0 mt-0.5">
                  3
                </div>
                <p className="text-xs text-slate-200">
                  Complete every objective within 45 seconds for grand celebration bonus points!
                </p>
              </div>
            </div>

            {/* Checklist Overview Preview */}
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <div className="text-lg">🪔</div>
                <div className="text-[10px] text-amber-300 font-bold">5 Diyas</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <div className="text-lg">🌼</div>
                <div className="text-[10px] text-amber-300 font-bold">3 Garlands</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <div className="text-lg">🏮</div>
                <div className="text-[10px] text-amber-300 font-bold">2 Lanterns</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <div className="text-lg">🌸</div>
                <div className="text-[10px] text-amber-300 font-bold">1 Rangoli</div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartDecorating}
              className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm tracking-wider uppercase shadow-xl hover:shadow-amber-500/30 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>START DECORATING</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Grand Celebration & Success Reveal Overlay */}
      {phase === 'SUCCESS_REVEAL' && (
        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-6 animate-fade-in">
          {/* Top Banner */}
          <div className="mx-auto max-w-xl p-4 rounded-2xl bg-slate-950/85 border border-amber-400/50 backdrop-blur-md shadow-[0_0_40px_rgba(245,158,11,0.4)] text-center pointer-events-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Divine Sanctuary Complete</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-amber-100">
              PANDAL PERFECT!
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-200">
              Lord Ganesha's pandal shines with brilliant festive light and showers of marigold petals!
            </p>
          </div>

          {/* Bottom Action Bar */}
          <div className="mx-auto w-full max-w-md p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Score</span>
                <div className="text-xl font-black font-mono text-amber-300">{roundScore}</div>
              </div>
              <div className="h-8 w-[1px] bg-slate-700" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Bonus</span>
                <div className="text-sm font-bold text-emerald-400">+1000 Pandal Bonus</div>
              </div>
            </div>

            <button
              onClick={() => {
                audio.playClick();
                setPhase('RESULTS');
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-amber-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>View Results</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* 7. Results Modal */}
      {phase === 'RESULTS' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/40 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>

            <h2 className="text-2xl font-black text-amber-300">
              {isVictory ? 'PANDAL COMPLETE!' : 'TIME COMPLETED!'}
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              {isVictory
                ? 'The festival pandal looks breathtaking and sacred for Lord Ganesha!'
                : 'Bappa smiles upon your heartfelt decoration efforts! Ganpati Bappa Morya!'}
            </p>

            {/* Score & Coin Stats */}
            <div className="mt-5 p-4 rounded-xl bg-slate-950/60 border border-amber-500/30 grid grid-cols-2 gap-4">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Total Score
                </span>
                <div className="text-2xl font-black font-mono text-amber-300">{roundScore}</div>
              </div>

              <div className="text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Festival Coins
                </span>
                <div className="text-2xl font-black font-mono text-emerald-300 flex items-center gap-1">
                  <span>🪙</span>
                  <span>+{coinsEarned}</span>
                </div>
              </div>

              <div className="text-left col-span-2 pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Decorations Placed:</span>
                <span className="font-bold font-mono text-amber-200">{totalPlaced} / 11</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 border border-slate-600 font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>

              <button
                onClick={onExitToHub}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs tracking-wider uppercase shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Hub</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
