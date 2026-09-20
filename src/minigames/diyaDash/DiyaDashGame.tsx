import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { DiyaDashScene } from './DiyaDashScene';
import {
  DiyaDashController,
  DiyaDashFinalStats,
  HitResult,
  MissResult,
  DiyaRating,
} from './DiyaDashController';
import { ScoreManager } from '../../game/ScoreManager';
import { AudioManager } from '../../game/AudioManager';
import { GameManager } from '../../game/GameManager';
import {
  Flame,
  Clock,
  Sparkles,
  Trophy,
  RotateCcw,
  ArrowLeft,
  Pause,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface DiyaDashGameProps {
  onExitToHub: () => void;
  isPaused?: boolean;
}

type Phase = 'INSTRUCTIONS' | 'PLAYING' | 'RESULTS' | 'ERROR';

interface FeedbackPopup {
  id: number;
  text: string;
  subtext: string;
  rating: DiyaRating;
  x: number;
  y: number;
}

export const DiyaDashGame: React.FC<DiyaDashGameProps> = ({ onExitToHub, isPaused = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<DiyaDashScene | null>(null);
  const controllerRef = useRef<DiyaDashController | null>(null);
  const overlayButtonRef = useRef<HTMLButtonElement | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Managers
  const scoreManager = useRef(ScoreManager.getInstance()).current;
  const audio = useRef(AudioManager.getInstance()).current;
  const gameManager = useRef(GameManager.getInstance()).current;

  // Game Phase & HUD State
  const [phase, setPhase] = useState<Phase>('INSTRUCTIONS');
  const [initError, setInitError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(25.0);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [diyasLit, setDiyasLit] = useState<number>(0);
  const [activeDiyaIndex, setActiveDiyaIndex] = useState<number>(-1);

  // Pixel Position and World Position of Active Diya
  const [overlayButtonPos, setOverlayButtonPos] = useState<{ x: number; y: number } | null>(null);
  const [activeDiyaWorldPos, setActiveDiyaWorldPos] = useState<THREE.Vector3 | null>(null);

  // Feedback Popups
  const [feedbacks, setFeedbacks] = useState<FeedbackPopup[]>([]);

  // Final Results
  const [finalStats, setFinalStats] = useState<DiyaDashFinalStats | null>(null);

  // Debug Panel (D Key toggle)
  const [showDebug, setShowDebug] = useState<boolean>(false);

  // Flag to guarantee a single hit event per active target (prevents click + pointerup double-fire)
  const hitHandledForTargetRef = useRef<boolean>(false);

  // --------------------------------------------------------------------------
  // Safe Audio Helpers
  // --------------------------------------------------------------------------
  const safePlayBell = useCallback(() => {
    try {
      audio.playBell();
    } catch {
      // Audio fallback safe
    }
  }, [audio]);

  const safePlayClick = useCallback(() => {
    try {
      audio.playClick();
    } catch {
      // Audio fallback safe
    }
  }, [audio]);

  const safePlaySuccess = useCallback(() => {
    try {
      audio.playSuccess();
    } catch {
      // Audio fallback safe
    }
  }, [audio]);

  // --------------------------------------------------------------------------
  // Popups Helper
  // --------------------------------------------------------------------------
  const addFeedback = useCallback(
    (text: string, subtext: string, rating: DiyaRating, x: number, y: number) => {
      const id = Date.now() + Math.random();
      setFeedbacks((prev) => [...prev, { id, text, subtext, rating, x, y }]);
      setTimeout(() => {
        if (isMountedRef.current) {
          setFeedbacks((prev) => prev.filter((f) => f.id !== id));
        }
      }, 750);
    },
    []
  );

  // --------------------------------------------------------------------------
  // Stable Callbacks Ref to avoid re-triggering Mount Effect
  // --------------------------------------------------------------------------
  const callbacksRef = useRef({
    onTick: (secRemaining: number) => {
      if (!isMountedRef.current) return;
      setTimeRemaining(secRemaining);
    },

    onTargetSpawn: (diyaIdx: number) => {
      if (!isMountedRef.current) return;
      setActiveDiyaIndex(diyaIdx);
      hitHandledForTargetRef.current = false;

      if (sceneRef.current) {
        sceneRef.current.setActiveDiya(diyaIdx);
        const pixelPos = sceneRef.current.getDiyaPixelPosition(diyaIdx);
        if (pixelPos) {
          setOverlayButtonPos({ x: pixelPos.x, y: pixelPos.y });
          setActiveDiyaWorldPos(pixelPos.worldPos);
        }
      }
    },

    onTargetHit: (hit: HitResult) => {
      if (!isMountedRef.current) return;
      setActiveDiyaIndex(-1);
      setOverlayButtonPos(null);
      setScore(hit.totalScore);
      setCombo(hit.combo);
      setDiyasLit(hit.totalHits);

      if (sceneRef.current) {
        sceneRef.current.flashDiyaLit(hit.diyaIndex);
      }

      safePlayBell();

      const pixelPos = sceneRef.current?.getDiyaPixelPosition(hit.diyaIndex);
      const posX = pixelPos ? pixelPos.x : window.innerWidth / 2;
      const posY = pixelPos ? pixelPos.y : window.innerHeight / 2;

      const bonusMsg = hit.isComboBonus ? ` +100 COMBO BONUS!` : '';
      addFeedback(hit.rating, `+${hit.pointsEarned}${bonusMsg}`, hit.rating, posX, posY);
    },

    onTargetMiss: (miss: MissResult) => {
      if (!isMountedRef.current) return;
      setActiveDiyaIndex(-1);
      setOverlayButtonPos(null);
      setCombo(0);

      if (sceneRef.current) {
        sceneRef.current.clearDiyaState(miss.diyaIndex);
      }

      const pixelPos = sceneRef.current?.getDiyaPixelPosition(miss.diyaIndex);
      const posX = pixelPos ? pixelPos.x : window.innerWidth / 2;
      const posY = pixelPos ? pixelPos.y : window.innerHeight / 2;

      addFeedback('MISS', 'Flame faded', 'MISS', posX, posY);
    },

    onRoundEnd: (stats: DiyaDashFinalStats) => {
      if (!isMountedRef.current) return;
      setActiveDiyaIndex(-1);
      setOverlayButtonPos(null);
      setFinalStats(stats);
      setPhase('RESULTS');

      if (sceneRef.current) {
        sceneRef.current.resetAllDiyas();
      }

      safePlaySuccess();

      scoreManager.addScore(stats.score);
      scoreManager.addCoins(stats.coinsEarned);
      scoreManager.progressObjective('diyaDash', stats.diyasLit);
    },
  });

  // Keep callbacks synchronized with outer scope helpers
  useEffect(() => {
    callbacksRef.current.onTargetHit = (hit: HitResult) => {
      if (!isMountedRef.current) return;
      setActiveDiyaIndex(-1);
      setOverlayButtonPos(null);
      setScore(hit.totalScore);
      setCombo(hit.combo);
      setDiyasLit(hit.totalHits);

      if (sceneRef.current) {
        sceneRef.current.flashDiyaLit(hit.diyaIndex);
      }

      safePlayBell();

      const pixelPos = sceneRef.current?.getDiyaPixelPosition(hit.diyaIndex);
      const posX = pixelPos ? pixelPos.x : window.innerWidth / 2;
      const posY = pixelPos ? pixelPos.y : window.innerHeight / 2;

      const bonusMsg = hit.isComboBonus ? ` +100 COMBO BONUS!` : '';
      addFeedback(hit.rating, `+${hit.pointsEarned}${bonusMsg}`, hit.rating, posX, posY);
    };

    callbacksRef.current.onTargetMiss = (miss: MissResult) => {
      if (!isMountedRef.current) return;
      setActiveDiyaIndex(-1);
      setOverlayButtonPos(null);
      setCombo(0);

      if (sceneRef.current) {
        sceneRef.current.clearDiyaState(miss.diyaIndex);
      }

      const pixelPos = sceneRef.current?.getDiyaPixelPosition(miss.diyaIndex);
      const posX = pixelPos ? pixelPos.x : window.innerWidth / 2;
      const posY = pixelPos ? pixelPos.y : window.innerHeight / 2;

      addFeedback('MISS', 'Flame faded', 'MISS', posX, posY);
    };

    callbacksRef.current.onRoundEnd = (stats: DiyaDashFinalStats) => {
      if (!isMountedRef.current) return;
      setActiveDiyaIndex(-1);
      setOverlayButtonPos(null);
      setFinalStats(stats);
      setPhase('RESULTS');

      if (sceneRef.current) {
        sceneRef.current.resetAllDiyas();
      }

      safePlaySuccess();

      scoreManager.addScore(stats.score);
      scoreManager.addCoins(stats.coinsEarned);
      scoreManager.progressObjective('diyaDash', stats.diyasLit);
    };
  }, [addFeedback, safePlayBell, safePlaySuccess, scoreManager]);

  // --------------------------------------------------------------------------
  // Single Mount Effect: Initializes 3D Scene and Controller ONCE
  // --------------------------------------------------------------------------
  useEffect(() => {
    isMountedRef.current = true;
    if (!containerRef.current) return;

    try {
      // 1. Initialize Three.js Scene
      const scene = new DiyaDashScene(containerRef.current);
      sceneRef.current = scene;

      // 2. Initialize Logic Controller
      const controller = new DiyaDashController({
        roundDurationSec: 25.0,
        targetLifespanMs: 1300,
        hitTransitionDelayMs: 250,
        missTransitionDelayMs: 350,
        onTick: (sec) => callbacksRef.current.onTick(sec),
        onTargetSpawn: (idx) => callbacksRef.current.onTargetSpawn(idx),
        onTargetHit: (hit) => callbacksRef.current.onTargetHit(hit),
        onTargetMiss: (miss) => callbacksRef.current.onTargetMiss(miss),
        onRoundEnd: (stats) => callbacksRef.current.onRoundEnd(stats),
      });
      controllerRef.current = controller;

      // 3. Each animation frame: project active diya world position to pixels
      scene.onRenderFrame = () => {
        if (!isMountedRef.current) return;
        const currentActive = controllerRef.current?.getActiveDiyaIndex() ?? -1;
        if (currentActive >= 0 && sceneRef.current) {
          const pixelPos = sceneRef.current.getDiyaPixelPosition(currentActive);
          if (pixelPos) {
            setOverlayButtonPos({ x: pixelPos.x, y: pixelPos.y });
            setActiveDiyaWorldPos(pixelPos.worldPos);
          }
        }
      };
    } catch (err: unknown) {
      console.error('Failed to initialize Diya Dash:', err);
      setInitError(err instanceof Error ? err.message : 'WebGL or Graphics context unavailable');
      setPhase('ERROR');
    }

    return () => {
      isMountedRef.current = false;
      if (controllerRef.current) {
        controllerRef.current.dispose();
        controllerRef.current = null;
      }
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
    };
  }, []); // Strictly empty dependency array: NEVER unmount on state updates

  // --------------------------------------------------------------------------
  // Synchronize Pause / Resume
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!controllerRef.current) return;

    if (isPaused) {
      controllerRef.current.pause();
    } else {
      if (phase === 'PLAYING') {
        controllerRef.current.resume();
      }
    }
  }, [isPaused, phase]);

  // --------------------------------------------------------------------------
  // Keyboard Listeners (Single Registration)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Debug Panel with 'D'
      if (e.key === 'd' || e.key === 'D') {
        setShowDebug((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --------------------------------------------------------------------------
  // Element Coverage Check for Debug Mode
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (showDebug && overlayButtonPos && activeDiyaIndex >= 0) {
      const elem = document.elementFromPoint(overlayButtonPos.x, overlayButtonPos.y);
      if (elem && overlayButtonRef.current && !overlayButtonRef.current.contains(elem)) {
        console.warn('Diya Dash Warning: Active diya button may be covered by element:', elem);
      }
    }
  }, [showDebug, overlayButtonPos, activeDiyaIndex]);

  // --------------------------------------------------------------------------
  // Centralized Hit Response (Atomic execution)
  // --------------------------------------------------------------------------
  const handleSuccessfulHit = useCallback(
    (_source: string) => {
      if (phase !== 'PLAYING' || isPaused) return;

      // Prevent duplicate calls using handled flag
      if (hitHandledForTargetRef.current) return;
      hitHandledForTargetRef.current = true;

      const activeIdx = controllerRef.current?.getActiveDiyaIndex() ?? -1;
      if (activeIdx < 0) return;

      // 1. Immediately disable button and set activeDiya to null
      setActiveDiyaIndex(-1);
      setOverlayButtonPos(null);

      // 2. Process hit in controller (awards score, cancels expiration, increments combo, schedules next diya)
      if (controllerRef.current) {
        controllerRef.current.hitDiya(activeIdx);
      }
    },
    [phase, isPaused]
  );

  // --------------------------------------------------------------------------
  // Format Timer as 00:25, 00:24, down to 00:00
  // --------------------------------------------------------------------------
  const formatTimer = (seconds: number): string => {
    const totalSec = Math.max(0, Math.ceil(seconds));
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------
  const handleStartChallenge = () => {
    safePlayClick();
    setPhase('PLAYING');
    setScore(0);
    setCombo(0);
    setDiyasLit(0);
    setTimeRemaining(25.0);
    setFinalStats(null);
    hitHandledForTargetRef.current = false;

    if (controllerRef.current) {
      controllerRef.current.startRound();
    }
  };

  const handleRetry = () => {
    safePlayClick();
    setFeedbacks([]);
    if (sceneRef.current) {
      sceneRef.current.resetAllDiyas();
    }
    handleStartChallenge();
  };

  const handleReturnToHub = () => {
    safePlayClick();
    if (controllerRef.current) {
      controllerRef.current.dispose();
    }
    if (sceneRef.current) {
      sceneRef.current.dispose();
    }
    onExitToHub();
  };

  // --------------------------------------------------------------------------
  // Error Screen Fallback
  // --------------------------------------------------------------------------
  if (phase === 'ERROR') {
    return (
      <div id="diya-dash-error" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 text-white p-6">
        <div className="max-w-md w-full bg-slate-900 border border-amber-500/40 rounded-2xl p-8 text-center shadow-2xl">
          <AlertTriangle className="w-14 h-14 text-amber-400 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-amber-200 mb-2">Diya Dash Notice</h2>
          <p className="text-slate-300 text-sm mb-6">
            {initError || 'The 3D festival scene could not be loaded in your browser window.'}
          </p>
          <button
            id="diya-dash-error-exit"
            onClick={handleReturnToHub}
            className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-xl transition-all transform active:scale-95 shadow-lg shadow-amber-500/20"
          >
            Return to Festival Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="diya-dash-container" className="fixed inset-0 z-40 bg-slate-950 select-none overflow-hidden font-sans">
      {/* 1. Dedicated Three.js 3D Canvas Container (z-0) */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* 2. HUD Top Bar (z-20, pointer-events: none, buttons override with pointer-events-auto) */}
      <div
        id="diya-dash-hud"
        className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-4 sm:p-6 flex items-center justify-between"
      >
        {/* Left: Score & Combo */}
        <div className="flex items-center gap-3 pointer-events-none">
          <div className="bg-slate-900/85 backdrop-blur-md border border-amber-500/30 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[10px] tracking-wider text-slate-400 uppercase font-semibold">Score</div>
              <div className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">{score}</div>
            </div>
          </div>

          {combo > 1 && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 text-slate-950 font-black animate-pulse">
              <Zap className="w-4 h-4 fill-current" />
              <span className="text-sm tracking-wide">COMBO x{combo}</span>
            </div>
          )}
        </div>

        {/* Center: Objective Banner */}
        <div className="hidden md:flex flex-col items-center pointer-events-none">
          <div className="bg-slate-950/70 border border-amber-500/20 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-200 tracking-wide flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
            LIGHT THE GLOWING DIYAS!
          </div>
        </div>

        {/* Right: Diyas Lit, Timer & Pause */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/85 backdrop-blur-md border border-amber-500/30 px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2 text-white pointer-events-none">
            <Flame className="w-5 h-5 text-orange-400" />
            <div>
              <div className="text-[10px] tracking-wider text-slate-400 uppercase font-semibold">Diyas Lit</div>
              <div className="text-xl sm:text-2xl font-black text-white">{diyasLit}</div>
            </div>
          </div>

          {/* Formatted Timer: 00:25, 00:24, down to 00:00 */}
          <div
            id="diya-dash-timer-hud"
            className={`bg-slate-900/85 backdrop-blur-md border px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-white transition-all pointer-events-none ${
              timeRemaining <= 5
                ? 'border-rose-500 text-rose-300 animate-pulse bg-rose-950/40'
                : 'border-amber-500/30 text-white'
            }`}
          >
            <Clock className={`w-5 h-5 ${timeRemaining <= 5 ? 'text-rose-400' : 'text-amber-400'}`} />
            <div>
              <div className="text-[10px] tracking-wider text-slate-400 uppercase font-semibold">Time</div>
              <div className="text-xl sm:text-2xl font-mono font-black tracking-tight">{formatTimer(timeRemaining)}</div>
            </div>
          </div>

          {/* Pause Button */}
          <button
            id="diya-dash-pause-btn"
            onClick={() => gameManager.pause()}
            className="pointer-events-auto w-10 h-10 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-amber-500/30 flex items-center justify-center text-amber-300 hover:text-white transition-colors active:scale-95 shadow-lg"
            title="Pause Game (Esc)"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. HTML Button Overlay: Exactly ONE button exists ONLY for the active diya */}
      {/* Container uses pointer-events: none; Active button overrides with pointer-events: auto and z-index: 100 */}
      {phase === 'PLAYING' && !isPaused && activeDiyaIndex >= 0 && overlayButtonPos && (
        <div
          id="diya-dash-overlay-layer"
          className="absolute inset-0 z-30 pointer-events-none overflow-hidden"
        >
          <button
            ref={overlayButtonRef}
            id={`diya-dash-active-btn-${activeDiyaIndex}`}
            aria-label="Light active diya"
            onClick={(e) => {
              e.preventDefault();
              handleSuccessfulHit('click');
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              handleSuccessfulHit('pointerup');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSuccessfulHit('keyboard');
              }
            }}
            style={{
              position: 'absolute',
              left: `${overlayButtonPos.x}px`,
              top: `${overlayButtonPos.y}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 100,
              pointerEvents: 'auto',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              touchAction: 'manipulation',
              width: '76px',
              height: '76px',
            }}
            className="flex flex-col items-center justify-center outline-none focus:ring-2 focus:ring-amber-400 group"
          >
            {/* Floating CLICK/LIGHT Badge */}
            <div className="absolute -top-7 pointer-events-none bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-lg shadow-orange-500/50 animate-bounce tracking-wider uppercase border border-amber-200 whitespace-nowrap">
              LIGHT!
            </div>

            {/* Touch target ring indicator */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-amber-400/80 bg-amber-400/20 animate-pulse flex items-center justify-center group-active:scale-90 transition-transform shadow-xl shadow-amber-400/40">
              <Flame className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
          </button>
        </div>
      )}

      {/* 4. Feedback Popups (PERFECT, GREAT, GOOD, MISS) (z-40) */}
      {feedbacks.map((f) => (
        <div
          key={f.id}
          className="fixed pointer-events-none z-40 -translate-x-1/2 -translate-y-1/2 text-center transition-all animate-out fade-out zoom-out duration-700"
          style={{ left: f.x, top: f.y }}
        >
          <div
            className={`font-black tracking-wider text-xl sm:text-2xl drop-shadow-md ${
              f.rating === 'PERFECT'
                ? 'text-yellow-300 scale-110'
                : f.rating === 'GREAT'
                ? 'text-emerald-300'
                : f.rating === 'GOOD'
                ? 'text-cyan-300'
                : 'text-rose-400'
            }`}
          >
            {f.text}
          </div>
          <div className="text-xs sm:text-sm font-bold text-white/90 drop-shadow">{f.subtext}</div>
        </div>
      ))}

      {/* 5. Instructions Screen Modal (z-50) */}
      {phase === 'INSTRUCTIONS' && (
        <div
          id="diya-dash-instructions-modal"
          className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
        >
          <div className="max-w-md w-full bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 bg-amber-500/20 border border-amber-400/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-300 shadow-lg shadow-amber-500/20">
              <Flame className="w-9 h-9 text-amber-400 animate-pulse" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight mb-1">DIYA DASH</h1>
            <p className="text-xs uppercase tracking-widest text-orange-400 font-semibold mb-4">
              Light the Festival
            </p>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Light the glowing diyas before their flame fades!
            </p>

            <div className="bg-slate-950/70 border border-amber-500/20 rounded-2xl p-4 text-left mb-6 space-y-2.5 text-xs sm:text-sm text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <span>Click or tap the glowing diya directly.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <span>Faster reactions earn more points.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <span>Build a combo for bonus score (+100 every 5 hits).</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs">
                  4
                </span>
                <span>Missing a diya resets your combo.</span>
              </div>
            </div>

            <button
              id="diya-dash-start-btn"
              onClick={handleStartChallenge}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-amber-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              START CHALLENGE
            </button>
          </div>
        </div>
      )}

      {/* 6. Results Screen Modal (z-50) */}
      {phase === 'RESULTS' && finalStats && (
        <div
          id="diya-dash-results-modal"
          className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-300"
        >
          <div className="max-w-md w-full bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-amber-500/20 border border-amber-400/40 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-400 shadow-lg shadow-amber-500/20">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-1">
              Challenge Complete!
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
              {finalStats.performanceTitle}
            </h2>
            <div className="text-amber-300 font-black text-3xl sm:text-4xl tracking-tight mb-6">
              {finalStats.score}{' '}
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-normal">Points</span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 text-left">
                <div className="text-[11px] text-slate-400 font-medium">Diyas Lit</div>
                <div className="text-xl font-black text-amber-300">{finalStats.diyasLit}</div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 text-left">
                <div className="text-[11px] text-slate-400 font-medium">Accuracy</div>
                <div className="text-xl font-black text-emerald-300">{finalStats.accuracy}%</div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 text-left">
                <div className="text-[11px] text-slate-400 font-medium">Best Combo</div>
                <div className="text-xl font-black text-cyan-300">x{finalStats.bestCombo}</div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 text-left">
                <div className="text-[11px] text-slate-400 font-medium">Coins Earned</div>
                <div className="text-xl font-black text-yellow-400">+{finalStats.coinsEarned} 🪙</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                id="diya-dash-retry-btn"
                onClick={handleRetry}
                className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again (Retry)
              </button>

              <button
                id="diya-dash-return-hub-btn"
                onClick={handleReturnToHub}
                className="w-full py-3 px-6 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Hub
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Developer Debug Panel (Toggled with 'D' Key) (z-[110]) */}
      {showDebug && (
        <div
          id="diya-dash-debug-panel"
          className="fixed bottom-4 left-4 z-[110] bg-slate-950/95 border border-amber-500/60 rounded-xl p-4 text-xs font-mono text-amber-200 shadow-2xl max-w-sm pointer-events-auto"
        >
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-2 mb-2 font-bold text-amber-400">
            <span>Diya Dash Live Monitor</span>
            <button onClick={() => setShowDebug(false)} className="text-slate-400 hover:text-white px-1">
              ✕
            </button>
          </div>

          <div className="space-y-1 mb-3">
            <div className="flex justify-between">
              <span className="text-slate-400">roundStarted:</span>
              <span className="font-semibold text-white">
                {phase === 'PLAYING' || phase === 'RESULTS' ? 'TRUE' : 'FALSE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">game state:</span>
              <span className="font-semibold text-white">{phase}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">timerRunning:</span>
              <span className="font-semibold text-white">
                {controllerRef.current?.getIsTimerRunning() ? 'TRUE' : 'FALSE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">round time remaining:</span>
              <span className="font-semibold text-white">
                {timeRemaining.toFixed(2)}s ({formatTimer(timeRemaining)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">active diya index:</span>
              <span className="font-semibold text-white">{activeDiyaIndex >= 0 ? activeDiyaIndex : 'none'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">active diya world pos:</span>
              <span className="font-semibold text-white">
                {activeDiyaWorldPos
                  ? `${activeDiyaWorldPos.x.toFixed(2)}, ${activeDiyaWorldPos.y.toFixed(2)}, ${activeDiyaWorldPos.z.toFixed(2)}`
                  : 'none'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">active overlay button exists:</span>
              <span className="font-semibold text-white">
                {activeDiyaIndex >= 0 && overlayButtonPos ? 'TRUE' : 'FALSE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">overlay button x/y:</span>
              <span className="font-semibold text-white">
                {overlayButtonPos ? `${overlayButtonPos.x}px, ${overlayButtonPos.y}px` : 'none'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">overlay button pointer-events:</span>
              <span className="font-semibold text-white">auto (container: none)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">overlay button z-index:</span>
              <span className="font-semibold text-white">100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">correct hits:</span>
              <span className="font-semibold text-white">{diyasLit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">misses:</span>
              <span className="font-semibold text-white">{controllerRef.current?.getMisses() ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">score:</span>
              <span className="font-semibold text-white">{score}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">combo:</span>
              <span className="font-semibold text-white">{combo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">pause status:</span>
              <span className="font-semibold text-white">{isPaused ? 'PAUSED' : 'RUNNING'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">number of timer handles:</span>
              <span className="font-semibold text-white">{controllerRef.current?.getTimerHandlesCount() ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">number of target expire handles:</span>
              <span className="font-semibold text-white">
                {controllerRef.current?.getTargetExpireHandlesCount() ?? 0}
              </span>
            </div>
          </div>

          {/* Test Button Required by Specification */}
          <button
            id="debug-test-hit-btn"
            onClick={() => handleSuccessfulHit('debug-test')}
            disabled={activeDiyaIndex < 0 || phase !== 'PLAYING'}
            className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black rounded-lg transition-colors text-center uppercase tracking-wider"
          >
            TEST ACTIVE DIYA HIT
          </button>
        </div>
      )}
    </div>
  );
};
