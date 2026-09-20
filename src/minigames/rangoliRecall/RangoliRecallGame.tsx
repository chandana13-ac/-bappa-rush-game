import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Difficulty,
  DIFFICULTY_CONFIGS,
  GamePhase,
  PetalColor,
  PETAL_COLORS,
  RangoliPattern,
  LevelResultStats,
  CellComparison,
  PatternRating,
} from './types';
import { getPatternForLevel } from './patterns';
import { RangoliSaveManager } from './saveData';
import { RangoliRecallScene } from './RangoliRecallScene';
import { RangoliRecallController } from './RangoliRecallController';
import { RangoliBoard } from './RangoliBoard';
import { DifficultyModal } from './DifficultyModal';
import { ResultsModal } from './ResultsModal';
import { DebugMonitor } from './DebugMonitor';
import { ScoreManager } from '../../game/ScoreManager';
import { AudioManager } from '../../game/AudioManager';
import {
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Trash2,
  CheckCircle,
  HelpCircle,
  Pause,
  Play,
  Sun,
  Heart,
  Diamond,
  Droplet,
  Undo2,
  Lock,
  Sliders,
  AlertTriangle,
} from 'lucide-react';

interface RangoliRecallGameProps {
  onExitToHub: () => void;
  isPaused?: boolean;
}

interface HistoryStep {
  cellIndex: number;
  previousColor: PetalColor | null;
  newColor: PetalColor | null;
}

export const RangoliRecallGame: React.FC<RangoliRecallGameProps> = ({
  onExitToHub,
  isPaused = false,
}) => {
  // Shared managers
  const scoreManager = useRef(ScoreManager.getInstance()).current;
  const audio = useRef(AudioManager.getInstance()).current;
  const saveManager = useRef(RangoliSaveManager.getInstance()).current;

  // 3D Scene ref
  const sceneContainerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<RangoliRecallScene | null>(null);

  // Controller ref
  const controllerRef = useRef<RangoliRecallController | null>(null);

  // Local Save Data state
  const [saveData, setSaveData] = useState(saveManager.getData());

  // Game Progress State
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [levelNumber, setLevelNumber] = useState<number>(1);
  const [phase, setPhase] = useState<GamePhase>('WELCOME');

  // Active Pattern & Player Grid
  const [targetPattern, setTargetPattern] = useState<RangoliPattern>(() =>
    getPatternForLevel('easy', 1)
  );
  const [playerGrid, setPlayerGrid] = useState<(PetalColor | null)[]>(() =>
    Array(9).fill(null)
  );
  const [selectedColor, setSelectedColor] = useState<PetalColor>('orange');
  const [historyStack, setHistoryStack] = useState<HistoryStep[]>([]);

  // Timers & Display
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [hintIndices, setHintIndices] = useState<number[]>([]);

  // Modals & UI States
  const [showDifficultyModal, setShowDifficultyModal] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);
  const [resultsStats, setResultsStats] = useState<LevelResultStats | null>(null);
  const [localIsPaused, setLocalIsPaused] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // Initialize 3D Scene
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (sceneContainerRef.current && !sceneRef.current) {
      sceneRef.current = new RangoliRecallScene(sceneContainerRef.current);
    }

    return () => {
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
    };
  }, []);

  // --------------------------------------------------------------------------
  // Initialize Controller
  // --------------------------------------------------------------------------
  useEffect(() => {
    controllerRef.current = new RangoliRecallController({
      onTick: (currentPhase, secRemaining) => {
        setPhase(currentPhase);
        setTimerSeconds(secRemaining);
      },
      onMemorizeComplete: () => {
        audio.playClick();
        setPhase('REBUILD');
        controllerRef.current?.startRebuild(difficulty);
      },
      onRebuildTimeout: () => {
        audio.playClick();
        handleEvaluate(true);
      },
      onHintExpire: () => {
        setHintIndices([]);
      },
    });

    return () => {
      if (controllerRef.current) {
        controllerRef.current.destroy();
        controllerRef.current = null;
      }
    };
  }, [audio, difficulty]);

  // Synchronize pause prop with controller
  useEffect(() => {
    if (isPaused || localIsPaused) {
      controllerRef.current?.pause();
    } else {
      controllerRef.current?.resume();
    }
  }, [isPaused, localIsPaused]);

  // Keyboard shortcut listeners (R for debug panel, Escape for pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        setShowDebugPanel((prev) => !prev);
      }

      if (e.key === 'Escape') {
        if (showDifficultyModal) {
          setShowDifficultyModal(false);
          return;
        }
        if (showClearConfirm) {
          setShowClearConfirm(false);
          return;
        }
        if (showDebugPanel) {
          setShowDebugPanel(false);
          return;
        }
        // Toggle local pause if in active gameplay
        if (phase === 'MEMORIZE' || phase === 'REBUILD') {
          setLocalIsPaused((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, showDifficultyModal, showClearConfirm, showDebugPanel]);

  // --------------------------------------------------------------------------
  // Start / Load Level
  // --------------------------------------------------------------------------
  const startLevel = useCallback(
    (diff: Difficulty, lvl: number) => {
      const pattern = getPatternForLevel(diff, lvl);
      setDifficulty(diff);
      setLevelNumber(lvl);
      setTargetPattern(pattern);
      setPlayerGrid(Array(pattern.gridSize * pattern.gridSize).fill(null));
      setHistoryStack([]);
      setHintIndices([]);
      setShowClearConfirm(false);
      setResultsStats(null);
      setLocalIsPaused(false);

      // Default selected color to first available
      setSelectedColor(pattern.availableColors[0]);

      audio.playBell();
      setPhase('MEMORIZE');
      controllerRef.current?.startMemorize(diff);
    },
    [audio]
  );

  // --------------------------------------------------------------------------
  // Interaction Handlers
  // --------------------------------------------------------------------------
  const handleCellClick = (cellIndex: number) => {
    if (phase !== 'REBUILD' || isPaused || localIsPaused) return;

    const currentColor = playerGrid[cellIndex];
    // If placing the exact same color, keep it intact (no accidental erasure)
    if (currentColor === selectedColor) {
      audio.playClick();
      return;
    }

    // Place or replace petal with confirmation pulse
    audio.playClick();
    const newGrid = [...playerGrid];
    newGrid[cellIndex] = selectedColor;
    setPlayerGrid(newGrid);

    setHistoryStack((prev) => [
      ...prev,
      { cellIndex, previousColor: currentColor, newColor: selectedColor },
    ]);
  };

  const handleUndo = () => {
    if (phase !== 'REBUILD' || historyStack.length === 0 || isPaused || localIsPaused) return;

    audio.playClick();
    const lastStep = historyStack[historyStack.length - 1];
    const newGrid = [...playerGrid];
    newGrid[lastStep.cellIndex] = lastStep.previousColor;
    setPlayerGrid(newGrid);
    setHistoryStack((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (phase !== 'REBUILD' || isPaused || localIsPaused) return;
    audio.playClick();
    setPlayerGrid(Array(targetPattern.gridSize * targetPattern.gridSize).fill(null));
    setHistoryStack([]);
    setShowClearConfirm(false);
  };

  const handleTriggerHint = () => {
    if (phase !== 'REBUILD' || isPaused || localIsPaused) return;

    const success = controllerRef.current?.triggerHint(1500);
    if (!success) return;

    audio.playBell();

    // Find 2 to 3 correct cells that are currently missing or mismatched
    const eligibleIndices: number[] = [];
    targetPattern.cells.forEach((color, idx) => {
      if (color !== null && playerGrid[idx] !== color) {
        eligibleIndices.push(idx);
      }
    });

    // If all are already filled or none missing, pick any 2 target cells
    if (eligibleIndices.length === 0) {
      targetPattern.cells.forEach((color, idx) => {
        if (color !== null) eligibleIndices.push(idx);
      });
    }

    // Pick up to 3 distinct indices
    const picked: number[] = [];
    const shuffled = [...eligibleIndices].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(3, shuffled.length); i++) {
      picked.push(shuffled[i]);
    }

    setHintIndices(picked);
  };

  // --------------------------------------------------------------------------
  // Evaluation & Scoring
  // --------------------------------------------------------------------------
  const handleEvaluate = (isTimeout = false) => {
    const totalCells = targetPattern.gridSize * targetPattern.gridSize;
    let correct = 0;
    let wrong = 0;
    const comparison: CellComparison[] = [];

    for (let i = 0; i < totalCells; i++) {
      const targetCol = targetPattern.cells[i];
      const playerCol = playerGrid[i];
      const isMatch = targetCol === playerCol;

      if (targetCol !== null) {
        if (isMatch) {
          correct++;
        } else {
          wrong++;
        }
      } else if (playerCol !== null) {
        // Player placed a color where an empty spot was required
        wrong++;
      }

      comparison.push({
        index: i,
        row: Math.floor(i / targetPattern.gridSize),
        col: i % targetPattern.gridSize,
        targetColor: targetCol,
        playerColor: playerCol,
        isCorrect: isMatch,
      });
    }

    const accuracy = Math.round((correct / targetPattern.requiredCount) * 100);
    const isPerfect = correct === targetPattern.requiredCount && wrong === 0;

    // Rating
    let rating: PatternRating = 'KEEP PRACTICING';
    if (isPerfect) rating = 'PERFECT MATCH';
    else if (accuracy >= 85) rating = 'EXCELLENT';
    else if (accuracy >= 60) rating = 'GOOD';

    // Scoring math
    const cfg = DIFFICULTY_CONFIGS[difficulty];
    const basePoints = correct * 100;
    const perfectBonus = isPerfect ? 500 : 0;

    const remainingTime = controllerRef.current?.getRemainingSeconds() || 0;
    const timeTaken = cfg.rebuildSeconds - remainingTime;

    // Time bonus up to 300 points
    const rawTimeBonus = Math.round((remainingTime / cfg.rebuildSeconds) * 300);
    const hintsUsed = controllerRef.current?.getHintsUsed() || 0;
    const hintPenalty = hintsUsed * cfg.hintPenalty;
    const timeBonus = Math.max(0, rawTimeBonus - hintPenalty);

    const subtotal = basePoints + perfectBonus + timeBonus;
    const totalScore = Math.round(subtotal * cfg.scoreMultiplier);
    const coinsEarned = Math.round((correct * 5 + (isPerfect ? 30 : 10)) * cfg.scoreMultiplier);

    // Stop controller loop
    controllerRef.current?.stop();

    // Record save progression
    const { unlockedNewDifficulty } = saveManager.recordLevelCompletion({
      difficulty,
      patternId: targetPattern.id,
      score: totalScore,
      accuracy,
      timeTaken,
      isPerfect,
    });

    setSaveData(saveManager.getData());

    // Update global score manager & objective
    scoreManager.addScore(totalScore, isPerfect);
    scoreManager.addCoins(coinsEarned);
    if (accuracy >= 60) {
      scoreManager.progressObjective('rangoliRecall', 1);
    }

    // Audio & 3D effects
    if (isPerfect) {
      audio.playSuccess();
      sceneRef.current?.triggerVictoryBurst();
    } else if (accuracy >= 60) {
      audio.playBell();
    }

    const stats: LevelResultStats = {
      patternId: targetPattern.id,
      patternName: targetPattern.name,
      difficulty,
      levelNumber,
      rating,
      accuracy,
      correctCells: correct,
      wrongCells: wrong,
      totalRequired: targetPattern.requiredCount,
      timeRemaining,
      timeTaken,
      basePoints,
      perfectBonus,
      timeBonus,
      hintPenalty,
      difficultyMultiplier: cfg.scoreMultiplier,
      totalScore,
      coinsEarned,
      isPerfect,
      unlockedNewDifficulty,
      comparison,
    };

    setResultsStats(stats);
    setPhase('RESULTS');
  };

  // --------------------------------------------------------------------------
  // Debug Helpers
  // --------------------------------------------------------------------------
  const handleAutocompleteTarget = () => {
    setPlayerGrid([...targetPattern.cells]);
    audio.playClick();
  };

  const handleForceSubmit = () => {
    handleEvaluate(false);
  };

  // Count placed cells
  const placedCellCount = playerGrid.filter((c) => c !== null).length;
  const isSubmitDisabled = placedCellCount !== targetPattern.requiredCount;

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div
      id="rangoli-recall-container"
      className="fixed inset-0 z-40 flex flex-col bg-[#0d0617] text-white select-none overflow-hidden"
    >
      {/* 1. 3D WebGL Background Scene */}
      <div
        ref={sceneContainerRef}
        id="rangoli-3d-viewport"
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* 2. Top HUD Bar */}
      <header
        id="rangoli-hud"
        className="relative z-20 flex items-center justify-between px-3 sm:px-6 py-2.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-xs border-b border-purple-500/20"
      >
        {/* Left: Exit to Hub & Difficulty badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="btn-rangoli-back-hub"
            onClick={() => {
              audio.playClick();
              controllerRef.current?.destroy();
              onExitToHub();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-400/30 text-xs font-bold text-amber-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Hub</span>
          </button>

          <div
            id="badge-difficulty"
            className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 border ${
              difficulty === 'easy'
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                : difficulty === 'medium'
                ? 'bg-purple-500/20 border-purple-400/60 text-purple-300'
                : 'bg-blue-500/20 border-blue-400/60 text-blue-300'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            {difficulty}
          </div>

          <span className="text-xs sm:text-sm font-bold text-amber-200/90 font-mono">
            Level {levelNumber} / 5
          </span>
        </div>

        {/* Center: Phase Title / Timer */}
        <div className="flex flex-col items-center">
          {phase === 'MEMORIZE' && (
            <div
              id="memorize-countdown-badge"
              className="px-3.5 py-1 rounded-full bg-amber-500/30 border border-amber-400 text-amber-200 text-xs sm:text-sm font-black animate-pulse flex items-center gap-1.5"
            >
              MEMORIZE: {Math.ceil(timerSeconds)}s
            </div>
          )}

          {phase === 'REBUILD' && (
            <div
              id="rebuild-timer-display"
              className={`px-3 py-1 rounded-full border text-xs sm:text-sm font-black font-mono tracking-wider flex items-center gap-1.5 ${
                timerSeconds <= 5
                  ? 'bg-rose-500/30 border-rose-400 text-rose-200 animate-pulse'
                  : 'bg-purple-950/60 border-purple-400/40 text-amber-100'
              }`}
            >
              TIMER: {Math.floor(timerSeconds / 60)
                .toString()
                .padStart(2, '0')}
              :
              {Math.floor(timerSeconds % 60)
                .toString()
                .padStart(2, '0')}
            </div>
          )}
        </div>

        {/* Right: Score & Pause */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-amber-300/70 font-mono uppercase">Score</span>
            <span className="text-sm sm:text-base font-black text-amber-300 font-mono">
              {scoreManager.getState().score.toLocaleString()}
            </span>
          </div>

          <button
            id="btn-rangoli-pause"
            onClick={() => {
              audio.playClick();
              setLocalIsPaused((prev) => !prev);
            }}
            className="p-2 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-400/30 text-amber-200 transition-colors cursor-pointer"
            title="Pause Mini-Game (Esc)"
          >
            {localIsPaused || isPaused ? (
              <Play className="w-4 h-4 text-emerald-400" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* 3. Main Center Stage Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto">
        {/* WELCOME / INSTRUCTIONS SCREEN */}
        {phase === 'WELCOME' && (
          <div
            id="rangoli-welcome-card"
            className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#24123c]/95 via-[#180a2a]/95 to-[#0e0419]/95 border-2 border-amber-400/50 shadow-2xl backdrop-blur-md text-center animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-purple-950 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Sparkles className="w-8 h-8" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-amber-200 tracking-wide uppercase">
              RANGOLI RECALL
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-amber-400/90 mb-4 uppercase tracking-wider">
              Petal Memory Challenge
            </p>

            <p className="text-sm text-amber-100/90 leading-relaxed mb-5">
              Watch the rangoli carefully, then rebuild it from memory.
            </p>

            {/* Rules List */}
            <div className="p-4 rounded-2xl bg-[#1a0c2b] border border-purple-500/30 text-left mb-6 space-y-2 text-xs sm:text-sm text-amber-200/90">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <span>Memorize the colorful petal arrangement.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <span>Select a flower petal color from the tray.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <span>Tap empty spaces to place your petals.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <span>Complete levels to unlock harder patterns.</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                id="btn-start-level"
                onClick={() => startLevel(difficulty, levelNumber)}
                className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-purple-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Start {DIFFICULTY_CONFIGS[difficulty].title} Level
              </button>

              <button
                id="btn-open-difficulty-select"
                onClick={() => {
                  audio.playClick();
                  setShowDifficultyModal(true);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-purple-950/80 hover:bg-purple-900 border border-purple-400/40 text-xs font-bold text-amber-200 transition-colors cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                Difficulty Select
              </button>

              <button
                id="btn-welcome-return-hub"
                onClick={() => {
                  audio.playClick();
                  onExitToHub();
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-purple-950/50 hover:bg-purple-900/80 text-xs font-bold text-amber-300/80 transition-colors cursor-pointer"
              >
                Return to Hub
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE GAMEPLAY STAGE: MEMORIZE & REBUILD */}
        {(phase === 'MEMORIZE' || phase === 'REBUILD') && (
          <div className="flex flex-col lg:flex-row items-center justify-center gap-6 w-full max-w-5xl">
            {/* Side Info Tracker (Desktop) */}
            <div className="hidden lg:flex flex-col gap-3 w-56 p-4 rounded-2xl bg-[#1c0c2e]/80 border border-purple-500/30 backdrop-blur-xs">
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                Progress
              </span>

              {/* Required Cell Placed Tracker */}
              <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/20">
                <span className="text-[10px] text-amber-300/70 uppercase font-semibold">
                  Petals Placed:
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl font-black text-amber-200 font-mono">
                    {placedCellCount} / {targetPattern.requiredCount}
                  </span>
                  <span className="text-[10px] text-amber-400">
                    {Math.round((placedCellCount / targetPattern.requiredCount) * 100)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-purple-950 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-200"
                    style={{
                      width: `${Math.min(
                        100,
                        (placedCellCount / targetPattern.requiredCount) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Levels Tracker */}
              <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/20 text-xs space-y-1.5">
                <span className="text-[10px] text-amber-300/70 uppercase font-semibold">
                  Difficulty Mastery:
                </span>
                <div className="flex items-center justify-between text-amber-100">
                  <span>Easy:</span>
                  <span className="font-bold text-amber-300">{saveData.easyCompleted} / 5</span>
                </div>
                <div className="flex items-center justify-between text-amber-100">
                  <span>Medium:</span>
                  <span className="font-bold text-purple-300">
                    {saveData.unlockedDifficulties.includes('medium')
                      ? `${saveData.mediumCompleted} / 5`
                      : 'Locked'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-amber-100">
                  <span>Difficult:</span>
                  <span className="font-bold text-blue-300">
                    {saveData.unlockedDifficulties.includes('difficult')
                      ? `${saveData.difficultCompleted} / 5`
                      : 'Locked'}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Rangoli Board */}
            <div className="flex flex-col items-center">
              {/* Active Phase Banner */}
              {phase === 'MEMORIZE' && (
                <div className="mb-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-200 text-xs sm:text-sm font-bold animate-pulse">
                  Remember this pattern! Hiding in {Math.ceil(timerSeconds)}s...
                </div>
              )}

              {phase === 'REBUILD' && (
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-xs text-amber-200/80">
                    Placed:{' '}
                    <strong className="text-amber-300 font-mono">
                      {placedCellCount} / {targetPattern.requiredCount}
                    </strong>
                  </span>
                  {placedCellCount === targetPattern.requiredCount ? (
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Ready to submit!
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-300/60 font-mono">
                      Place {targetPattern.requiredCount - placedCellCount} more petal(s)
                    </span>
                  )}
                </div>
              )}

              {/* The Rangoli Board itself */}
              <RangoliBoard
                gridSize={targetPattern.gridSize}
                cells={phase === 'MEMORIZE' ? targetPattern.cells : playerGrid}
                onCellClick={handleCellClick}
                hintIndices={hintIndices}
                disabled={phase === 'MEMORIZE'}
              />
            </div>
          </div>
        )}
      </main>

      {/* 4. Bottom Controls Tray (Active only in REBUILD) */}
      {phase === 'REBUILD' && (
        <footer
          id="rangoli-bottom-controls"
          className="relative z-20 flex flex-col items-center gap-3 px-3 py-3 bg-gradient-to-t from-black/95 via-[#160a28]/95 to-transparent backdrop-blur-md border-t border-purple-500/20"
        >
          {/* Color Petal Palette */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {targetPattern.availableColors.map((colorId) => {
              const config = PETAL_COLORS[colorId];
              const isSelected = selectedColor === colorId;

              return (
                <button
                  key={colorId}
                  id={`btn-color-${colorId}`}
                  type="button"
                  onClick={() => {
                    audio.playClick();
                    setSelectedColor(colorId);
                  }}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-black scale-105 shadow-lg shadow-amber-500/20 bg-[#291345] border-amber-400 text-white'
                      : 'bg-[#1a0d2d]/80 hover:bg-[#25123d] border-purple-500/30 text-amber-200/80 hover:text-white'
                  }`}
                >
                  <span
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: config.hex }}
                  >
                    {config.iconName === 'sun' && <Sun className="w-2.5 h-2.5 text-white" />}
                    {config.iconName === 'sparkles' && (
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    )}
                    {config.iconName === 'heart' && <Heart className="w-2.5 h-2.5 text-white" />}
                    {config.iconName === 'diamond' && (
                      <Diamond className="w-2.5 h-2.5 text-white" />
                    )}
                    {config.iconName === 'droplet' && (
                      <Droplet className="w-2.5 h-2.5 text-white" />
                    )}
                  </span>
                  <span className="text-xs sm:text-sm font-bold">{config.name}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons: Undo, Clear, Hint, Submit */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button
              id="btn-action-undo"
              onClick={handleUndo}
              disabled={historyStack.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-950/70 hover:bg-purple-900 disabled:opacity-40 disabled:pointer-events-none border border-purple-400/30 text-xs font-bold text-amber-200 transition-colors cursor-pointer"
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </button>

            <button
              id="btn-action-clear"
              onClick={() => setShowClearConfirm(true)}
              disabled={placedCellCount === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 disabled:opacity-40 disabled:pointer-events-none border border-rose-500/30 text-xs font-bold text-rose-300 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Clear Pattern
            </button>

            <button
              id="btn-action-hint"
              onClick={handleTriggerHint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-xs font-bold text-amber-300 transition-colors cursor-pointer"
              title={
                DIFFICULTY_CONFIGS[difficulty].isHintFree
                  ? 'Free Hint available'
                  : 'Hint reduces bonus score'
              }
            >
              <HelpCircle className="w-4 h-4" />
              Hint
              {!DIFFICULTY_CONFIGS[difficulty].isHintFree && (
                <span className="text-[10px] text-amber-400/70">(-score)</span>
              )}
            </button>

            <button
              id="btn-action-submit"
              onClick={() => handleEvaluate(false)}
              disabled={isSubmitDisabled}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
                isSubmitDisabled
                  ? 'bg-purple-950/60 border border-purple-500/30 text-purple-300/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-purple-950 shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Submit Pattern
            </button>
          </div>
        </footer>
      )}

      {/* 5. Clear Confirmation Modal */}
      {showClearConfirm && (
        <div
          id="modal-confirm-clear"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none"
        >
          <div className="w-full max-w-sm rounded-2xl bg-[#24133b] border-2 border-amber-400/50 p-5 text-center shadow-2xl text-white">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <h3 className="font-bold text-lg text-amber-200">Clear all petals?</h3>
            <p className="text-xs text-amber-300/70 mt-1 mb-4">
              This will remove all placed petals from the current board.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/30 text-xs font-bold text-amber-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-clear-yes"
                onClick={handleClear}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md cursor-pointer"
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Difficulty Selection Modal */}
      {showDifficultyModal && (
        <DifficultyModal
          currentDifficulty={difficulty}
          saveData={saveData}
          onSelectDifficulty={(diff) => {
            setDifficulty(diff);
            setLevelNumber(1);
            setTargetPattern(getPatternForLevel(diff, 1));
          }}
          onClose={() => setShowDifficultyModal(false)}
        />
      )}

      {/* 7. Level Results Modal */}
      {resultsStats && (
        <ResultsModal
          stats={resultsStats}
          targetCells={targetPattern.cells}
          playerCells={playerGrid}
          gridSize={targetPattern.gridSize}
          onRetry={() => startLevel(difficulty, levelNumber)}
          onNextLevel={() => {
            const nextLvl = (levelNumber % 5) + 1;
            startLevel(difficulty, nextLvl);
          }}
          onOpenDifficultySelect={() => {
            setResultsStats(null);
            setPhase('WELCOME');
            setShowDifficultyModal(true);
          }}
          onExitToHub={() => {
            controllerRef.current?.destroy();
            onExitToHub();
          }}
        />
      )}

      {/* 8. Debug Monitor (Toggled with R key) */}
      {showDebugPanel && (
        <DebugMonitor
          phase={phase}
          difficulty={difficulty}
          levelNumber={levelNumber}
          pattern={targetPattern}
          playerGrid={playerGrid}
          memorizeTimer={phase === 'MEMORIZE' ? timerSeconds : 0}
          rebuildTimer={phase === 'REBUILD' ? timerSeconds : 0}
          selectedColor={selectedColor}
          hintsUsed={controllerRef.current?.getHintsUsed() || 0}
          score={scoreManager.getState().score}
          unlockedDifficulties={saveData.unlockedDifficulties}
          activeTimerCount={controllerRef.current?.getActiveTimerCount() || 0}
          isPaused={localIsPaused || !!isPaused}
          onClose={() => setShowDebugPanel(false)}
          onAutocompleteTarget={handleAutocompleteTarget}
          onForceSubmit={handleForceSubmit}
        />
      )}
    </div>
  );
};
