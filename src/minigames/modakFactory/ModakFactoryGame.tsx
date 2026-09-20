import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FillingId,
  ToppingId,
  FILLING_OPTIONS,
  TOPPING_OPTIONS,
  ModakOrder,
  ActiveModak,
} from './types';
import { ModakVisual } from './ModakVisual';
import { ScoreManager } from '../../game/ScoreManager';
import { AudioManager } from '../../game/AudioManager';
import {
  ArrowLeft,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Flame,
  Check,
  CheckCircle2,
  AlertCircle,
  Timer,
  Trophy,
  ChefHat,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface ModakFactoryGameProps {
  onExitToHub: () => void;
  isPaused?: boolean;
}

type GamePhase = 'INSTRUCTIONS' | 'PLAYING' | 'RESULTS';

export const ModakFactoryGame: React.FC<ModakFactoryGameProps> = ({
  onExitToHub,
  isPaused = false,
}) => {
  const scoreManager = useRef(ScoreManager.getInstance()).current;
  const audio = useRef(AudioManager.getInstance()).current;

  // Phase
  const [phase, setPhase] = useState<GamePhase>('INSTRUCTIONS');
  const [roundTimeLeft, setRoundTimeLeft] = useState<number>(40.0); // 40-second round
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [perfectCount, setPerfectCount] = useState<number>(0);

  // Current Order & Active Conveyor Modak
  const [currentOrder, setCurrentOrder] = useState<ModakOrder>({
    id: 'ord_1',
    orderNumber: 1,
    filling: 'jaggery_coconut',
    topping: 'kesar_saffron',
    steamZone: { min: 60, max: 85 },
  });

  const [activeModak, setActiveModak] = useState<ActiveModak>({
    id: 'mod_1',
    progress: 0, // 0 to 100%
    selectedFilling: null,
    selectedTopping: null,
    steamQuality: 'none',
    steamCharge: 0,
    completed: false,
    isDelivered: false,
    mistakes: [],
  });

  // Holding STEAM button state
  const [isHoldingSteam, setIsHoldingSteam] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'hint';
  } | null>({ text: 'Welcome to the Kitchen! Assemble orders for Bappa!', type: 'info' });

  // Web Audio Gentle Steam Sound Synthesizer
  const steamAudioContextRef = useRef<AudioContext | null>(null);
  const steamGainRef = useRef<GainNode | null>(null);
  const steamNoiseNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // References for clean disposal
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const feedbackTimeoutRef = useRef<number | null>(null);

  // Helper to show temporary feedback
  const showFeedback = useCallback((text: string, type: 'success' | 'info' | 'hint' = 'info') => {
    if (feedbackTimeoutRef.current !== null) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setFeedbackMessage({ text, type });
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedbackMessage(null);
      feedbackTimeoutRef.current = null;
    }, 2400);
  }, []);

  // --------------------------------------------------------------------------
  // Generate Next Customer Order
  // --------------------------------------------------------------------------
  const generateNewOrder = useCallback((prevNumber: number): ModakOrder => {
    const fillings: FillingId[] = ['jaggery_coconut', 'kaju_mawa', 'mango_elaichi'];
    const toppings: ToppingId[] = ['kesar_saffron', 'green_pista', 'silver_vark'];

    const chosenFilling = fillings[Math.floor(Math.random() * fillings.length)];
    const chosenTopping = toppings[Math.floor(Math.random() * toppings.length)];

    return {
      id: `ord_${prevNumber + 1}`,
      orderNumber: prevNumber + 1,
      filling: chosenFilling,
      topping: chosenTopping,
      steamZone: { min: 60, max: 85 }, // Highlighted golden zone
    };
  }, []);

  // --------------------------------------------------------------------------
  // Clean Audio & Timers
  // --------------------------------------------------------------------------
  const stopSteamAudio = useCallback(() => {
    if (steamGainRef.current && steamAudioContextRef.current) {
      try {
        steamGainRef.current.gain.setTargetAtTime(0.001, steamAudioContextRef.current.currentTime, 0.05);
      } catch {
        // Ignored
      }
    }
  }, []);

  const playSteamAudio = useCallback(() => {
    try {
      if (!steamAudioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) steamAudioContextRef.current = new AudioCtx();
      }
      if (steamAudioContextRef.current && steamAudioContextRef.current.state === 'suspended') {
        steamAudioContextRef.current.resume().catch(() => {});
      }
      if (!steamAudioContextRef.current) return;

      const ctx = steamAudioContextRef.current;
      // White noise buffer for steam hiss
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      whiteNoise.loop = true;

      // Filter to sound like soft gentle steam vapor
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(0);
      steamNoiseNodeRef.current = whiteNoise;
      steamGainRef.current = gain;
    } catch {
      // Ignore
    }
  }, []);

  const clearAllIntervals = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (feedbackTimeoutRef.current !== null) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    stopSteamAudio();
    if (steamNoiseNodeRef.current) {
      try {
        steamNoiseNodeRef.current.stop();
      } catch {}
      steamNoiseNodeRef.current = null;
    }
    if (steamAudioContextRef.current && steamAudioContextRef.current.state !== 'closed') {
      steamAudioContextRef.current.close().catch(() => {});
      steamAudioContextRef.current = null;
    }
  }, [stopSteamAudio]);

  useEffect(() => {
    return () => {
      clearAllIntervals();
    };
  }, [clearAllIntervals]);

  // --------------------------------------------------------------------------
  // Start Game
  // --------------------------------------------------------------------------
  const startGame = useCallback(() => {
    clearAllIntervals();
    audio.playBell();

    const firstOrder = generateNewOrder(0);
    setCurrentOrder(firstOrder);
    setActiveModak({
      id: 'mod_1',
      progress: 0,
      selectedFilling: null,
      selectedTopping: null,
      steamQuality: 'none',
      steamCharge: 0,
      completed: false,
      isDelivered: false,
      mistakes: [],
    });

    setScore(0);
    setCombo(0);
    setCompletedCount(0);
    setPerfectCount(0);
    setRoundTimeLeft(40.0);
    setPhase('PLAYING');
    lastTimeRef.current = performance.now();
    showFeedback('Conveyor started! Prepare the first modak!', 'info');
  }, [clearAllIntervals, audio, generateNewOrder, showFeedback]);

  // --------------------------------------------------------------------------
  // Finish Game (Time up)
  // --------------------------------------------------------------------------
  const finishGame = useCallback(() => {
    clearAllIntervals();
    audio.playSuccess();
    scoreManager.addScore(score);
    const coinsEarned = Math.max(10, Math.floor(completedCount * 4 + perfectCount * 3));
    scoreManager.addCoins(coinsEarned);
    scoreManager.progressObjective('modakFactory', completedCount);
    scoreManager.adjustChaos(-15);
    setPhase('RESULTS');
  }, [clearAllIntervals, audio, scoreManager, score, completedCount, perfectCount]);

  // --------------------------------------------------------------------------
  // Conveyor Animation Loop (Runs only when PLAYING & not paused)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'PLAYING' || isPaused) {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (currentTime: number) => {
      const deltaMs = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Base conveyor speed: ~9 seconds per modak traversal across belt
      // Slight acceleration with combo: up to +30% faster at high combo
      const comboSpeedMultiplier = 1.0 + Math.min(0.35, combo * 0.04);
      const progressDelta = (deltaMs / 9000) * 100 * comboSpeedMultiplier;

      setActiveModak((prev) => {
        let newProgress = prev.progress + progressDelta;
        let newCharge = prev.steamCharge;

        // If holding steam while in steam station (progress between 66% and 96%)
        if (isHoldingSteam && prev.progress >= 66 && prev.progress < 96) {
          // Charge fills up in ~1.2 seconds of holding
          newCharge = Math.min(100, newCharge + (deltaMs / 1200) * 100);
        }

        // When modak reaches 100%, deliver and spawn next!
        if (newProgress >= 100) {
          // Deliver modak
          deliverModak(prev, currentOrder);
          return {
            ...prev,
            progress: 100,
            isDelivered: true,
          };
        }

        return {
          ...prev,
          progress: newProgress,
          steamCharge: newCharge,
        };
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [phase, isPaused, combo, isHoldingSteam, currentOrder]);

  // --------------------------------------------------------------------------
  // Round Countdown Timer (40s)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'PLAYING' || isPaused) {
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = window.setInterval(() => {
      setRoundTimeLeft((prev) => {
        if (prev <= 1) {
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [phase, isPaused, finishGame]);

  // --------------------------------------------------------------------------
  // Modak Delivery at 100% Conveyor Progress
  // --------------------------------------------------------------------------
  const deliverModak = (modak: ActiveModak, order: ModakOrder) => {
    const isFillingCorrect = modak.selectedFilling === order.filling;
    const isToppingCorrect = modak.selectedTopping === order.topping;
    const isSteamedWell = modak.steamQuality === 'perfect' || modak.steamQuality === 'good';

    let earned = 0;
    let newCombo = combo;
    let wasPerfect = false;

    if (isFillingCorrect && isToppingCorrect && isSteamedWell) {
      // Perfect match!
      wasPerfect = true;
      audio.playSuccess();
      newCombo += 1;
      earned = 300 + newCombo * 50;
      setPerfectCount((p) => p + 1);
      showFeedback(`🎉 Perfect Modak! Packed for Bappa! (+${earned} pts)`, 'success');
    } else if (isFillingCorrect || isToppingCorrect || isSteamedWell) {
      // Partial match (gentle feedback, still awards points)
      audio.playBell();
      earned = 150;
      newCombo = Math.max(0, newCombo - 1);
      showFeedback(`👍 Sweet Offering! Bappa accepts with a smile! (+${earned} pts)`, 'info');
    } else {
      // Missed station options
      audio.playClick();
      earned = 50;
      newCombo = 0;
      showFeedback(`🥟 Plain modak, still delicious prasad! (+${earned} pts)`, 'hint');
    }

    setScore((s) => s + earned);
    setCombo(newCombo);
    setCompletedCount((c) => c + 1);

    // Spawn new modak and new order immediately
    const nextOrder = generateNewOrder(order.orderNumber);
    setCurrentOrder(nextOrder);
    setActiveModak({
      id: `mod_${nextOrder.orderNumber}`,
      progress: 0,
      selectedFilling: null,
      selectedTopping: null,
      steamQuality: 'none',
      steamCharge: 0,
      completed: false,
      isDelivered: false,
      mistakes: [],
    });
  };

  // --------------------------------------------------------------------------
  // Interaction Handlers (Filling, Topping, Steam)
  // --------------------------------------------------------------------------
  const handleSelectFilling = (fillingId: FillingId) => {
    if (phase !== 'PLAYING' || isPaused) return;

    // Check if modak is in Station 1 (progress < 36%)
    if (activeModak.progress > 38) {
      showFeedback('Modak has already left the Filling station!', 'hint');
      return;
    }

    audio.playClick();
    const isMatch = fillingId === currentOrder.filling;
    const option = FILLING_OPTIONS.find((f) => f.id === fillingId);

    setActiveModak((prev) => ({
      ...prev,
      selectedFilling: fillingId,
    }));

    if (isMatch) {
      showFeedback(`✓ Added ${option?.name || 'Filling'}!`, 'success');
    } else {
      showFeedback(`Requested ${FILLING_OPTIONS.find((f) => f.id === currentOrder.filling)?.name}! You can still change it!`, 'hint');
    }
  };

  const handleSelectTopping = (toppingId: ToppingId) => {
    if (phase !== 'PLAYING' || isPaused) return;

    // Check station window (between 30% and 68%)
    if (activeModak.progress < 28) {
      showFeedback('Wait for the modak to reach the Topping station!', 'hint');
      return;
    }
    if (activeModak.progress > 70) {
      showFeedback('Modak has moved past the Topping station!', 'hint');
      return;
    }

    audio.playClick();
    const isMatch = toppingId === currentOrder.topping;
    const option = TOPPING_OPTIONS.find((t) => t.id === toppingId);

    setActiveModak((prev) => ({
      ...prev,
      selectedTopping: toppingId,
    }));

    if (isMatch) {
      showFeedback(`✓ Garnished with ${option?.name || 'Topping'}!`, 'success');
    } else {
      showFeedback(`Order asked for ${TOPPING_OPTIONS.find((t) => t.id === currentOrder.topping)?.name}!`, 'hint');
    }
  };

  // Hold to Steam logic
  const handleStartSteam = () => {
    if (phase !== 'PLAYING' || isPaused) return;
    if (activeModak.progress < 64) {
      showFeedback('Wait until the modak enters the Steaming Station!', 'hint');
      return;
    }
    if (activeModak.progress > 97) {
      return;
    }

    setIsHoldingSteam(true);
    playSteamAudio();
  };

  const handleReleaseSteam = () => {
    if (!isHoldingSteam) return;
    setIsHoldingSteam(false);
    stopSteamAudio();

    const charge = activeModak.steamCharge;
    const { min, max } = currentOrder.steamZone;

    let quality: 'perfect' | 'good' | 'oversteamed' | 'understeamed' = 'good';

    if (charge >= min && charge <= max) {
      quality = 'perfect';
      audio.playBell();
      showFeedback('✨ Perfectly Steamed! Golden fragrant vapor!', 'success');
    } else if (charge > max) {
      quality = 'oversteamed';
      showFeedback('Extra soft & steamy! Still sweet!', 'info');
    } else if (charge > 20) {
      quality = 'good';
      showFeedback('Nicely steamed!', 'info');
    } else {
      quality = 'understeamed';
      showFeedback('A bit light on steam, but delicious!', 'hint');
    }

    setActiveModak((prev) => ({
      ...prev,
      steamQuality: quality,
    }));
  };

  // Current station active determination
  const currentStationIndex =
    activeModak.progress < 33 ? 0 : activeModak.progress < 66 ? 1 : 2;

  return (
    <div
      id="modak-factory-container"
      className="absolute inset-0 z-30 flex flex-col justify-between p-3 sm:p-5 bg-gradient-to-b from-[#180902] via-[#2a1205] to-[#120601] text-white select-none font-sans overflow-y-auto"
      onPointerUp={handleReleaseSteam}
    >
      {/* -------------------------------------------------------------------- */}
      {/* Top Navigation & Status Bar                                          */}
      {/* -------------------------------------------------------------------- */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2 pb-2 border-b border-amber-500/30">
        <button
          id="btn-modak-exit"
          onClick={() => {
            audio.playClick();
            clearAllIntervals();
            onExitToHub();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900 text-amber-200 border border-amber-500/40 text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Hub</span>
        </button>

        {/* Title */}
        <div className="flex items-center gap-2">
          <span className="text-2xl animate-bounce">🥟</span>
          <div className="flex flex-col text-left">
            <h1 className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-200 to-yellow-400 tracking-wide">
              Modak Factory
            </h1>
            <span className="text-[10px] text-amber-300/70">Bappa&apos;s Royal Sweet Kitchen</span>
          </div>
        </div>

        {/* Stats HUD (Score, Combo, Timer) */}
        <div className="flex items-center gap-2">
          {phase === 'PLAYING' && (
            <>
              {/* Score & Combo */}
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-amber-950/60 border border-amber-500/40 text-xs">
                <span className="text-amber-300 font-bold">Score:</span>
                <span className="font-mono font-black text-white">{score}</span>
                {combo > 1 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-orange-500 text-white font-extrabold text-[10px] animate-pulse">
                    x{combo} Combo!
                  </span>
                )}
              </div>

              {/* 40s Round Timer */}
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border font-mono font-bold text-xs sm:text-sm shadow-md transition-colors ${
                  roundTimeLeft <= 10
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-amber-950/80 border-amber-400/50 text-amber-200'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>{Math.ceil(roundTimeLeft)}s</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* PHASE 1: Instructions Card                                           */}
      {/* -------------------------------------------------------------------- */}
      {phase === 'INSTRUCTIONS' && (
        <div
          id="modak-instructions-card"
          className="my-auto w-full max-w-md mx-auto rounded-3xl bg-gradient-to-b from-[#321406] via-[#240e04] to-[#140601] border-2 border-amber-400/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col items-center text-center animate-fade-in"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-3xl shadow-lg mb-4 ring-4 ring-amber-400/30">
            🥟
          </div>

          <span className="text-xs uppercase font-extrabold tracking-widest text-amber-300 mb-1">
            Station 3 • Kitchen Mini-Game
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">MODAK FACTORY</h2>
          <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed mb-5">
            Bappa loves fresh modaks! Assemble delicious sweet dumplings as they roll along the
            conveyor belt across three festival cooking stations!
          </p>

          <div className="w-full bg-amber-950/60 rounded-2xl border border-amber-500/30 p-4 mb-6 text-left flex flex-col gap-2.5 text-xs text-amber-100">
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">1.</span>
              <span>
                <strong>Filling Station:</strong> Tap the requested sweet core (Jaggery, Kaju Mawa,
                or Mango).
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-400 font-bold">2.</span>
              <span>
                <strong>Topping Station:</strong> Garnish with Saffron, Pistachio, or Royal Silver
                Leaf.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold">3.</span>
              <span>
                <strong>Steaming Station:</strong> Press and hold the <strong>STEAM</strong> button
                into the golden target zone!
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">4.</span>
              <span>
                <strong>40-Second Rush:</strong> Maintain your combo to speed up the belt and score
                massive points!
              </span>
            </div>
          </div>

          <button
            id="btn-start-modak-factory"
            onClick={startGame}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:brightness-110 text-white font-black text-base sm:text-lg shadow-xl ring-2 ring-amber-300/40 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Start Conveyor Belt
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* PHASE 2: Main Playing Kitchen & Conveyor Belt                         */}
      {/* -------------------------------------------------------------------- */}
      {phase === 'PLAYING' && (
        <div className="my-auto flex flex-col items-center w-full max-w-4xl mx-auto gap-3">
          {/* Top Bar: Active Customer Order Card & Combo Meter */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 px-1">
            {/* Order Card */}
            <div
              id="active-order-card"
              className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-slate-950/80 border-2 border-amber-400/70 shadow-lg"
            >
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-300 flex items-center gap-1">
                  <span>Order #{currentOrder.orderNumber}</span>
                  <span className="text-white/60">•</span>
                  <span className="text-emerald-400">
                    {completedCount} packed
                  </span>
                </span>
                <div className="flex items-center gap-2 mt-0.5 text-xs font-bold text-white">
                  {/* Requested Filling */}
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] ${
                      activeModak.selectedFilling === currentOrder.filling
                        ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                        : 'bg-slate-900 border-amber-500/40 text-amber-200'
                    }`}
                  >
                    {FILLING_OPTIONS.find((f) => f.id === currentOrder.filling)?.icon}
                    <span>{FILLING_OPTIONS.find((f) => f.id === currentOrder.filling)?.name}</span>
                    {activeModak.selectedFilling === currentOrder.filling && ' ✓'}
                  </span>

                  <span>+</span>

                  {/* Requested Topping */}
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] ${
                      activeModak.selectedTopping === currentOrder.topping
                        ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                        : 'bg-slate-900 border-amber-500/40 text-amber-200'
                    }`}
                  >
                    {TOPPING_OPTIONS.find((t) => t.id === currentOrder.topping)?.icon}
                    <span>{TOPPING_OPTIONS.find((t) => t.id === currentOrder.topping)?.name}</span>
                    {activeModak.selectedTopping === currentOrder.topping && ' ✓'}
                  </span>

                  <span>+</span>

                  {/* Steaming */}
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] ${
                      activeModak.steamQuality === 'perfect' || activeModak.steamQuality === 'good'
                        ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                        : 'bg-slate-900 border-amber-500/40 text-amber-200'
                    }`}
                  >
                    <span>💨 Steamed</span>
                    {activeModak.steamQuality !== 'none' && ' ✓'}
                  </span>
                </div>
              </div>
            </div>

            {/* Score & Combo Pill */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-950/80 border border-amber-500/50 shadow-md">
                <Flame className={`w-4 h-4 ${combo > 0 ? 'text-orange-400 animate-bounce' : 'text-zinc-500'}`} />
                <span className="text-xs font-bold text-amber-200">
                  Combo: <strong className="font-mono text-white text-sm">x{combo}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-950/80 border border-amber-500/50 shadow-md">
                <Trophy className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold text-amber-200">
                  Score: <strong className="font-mono text-white text-sm">{score}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Toast Notification */}
          <div className="h-6 flex items-center justify-center">
            {feedbackMessage && (
              <div
                className={`px-3 py-0.5 rounded-full text-xs font-bold shadow-md transition-all animate-fade-in ${
                  feedbackMessage.type === 'success'
                    ? 'bg-emerald-500/90 text-slate-950'
                    : feedbackMessage.type === 'hint'
                    ? 'bg-amber-400/90 text-slate-950'
                    : 'bg-purple-600/90 text-white'
                }`}
              >
                {feedbackMessage.text}
              </div>
            )}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Visual Conveyor Belt Stage Area                                  */}
          {/* ---------------------------------------------------------------- */}
          <div
            id="modak-conveyor-belt-stage"
            className="w-full rounded-3xl bg-gradient-to-b from-[#1c0a03] via-[#150702] to-[#0c0401] border-2 border-amber-500/40 p-3 sm:p-5 shadow-2xl relative overflow-hidden flex flex-col justify-end"
            style={{ minHeight: '190px' }}
          >
            {/* Top Station Labels along track */}
            <div className="w-full grid grid-cols-3 text-center mb-6 relative z-10">
              {/* Station 1 */}
              <div
                className={`flex flex-col items-center p-1 rounded-xl transition-all ${
                  currentStationIndex === 0
                    ? 'bg-amber-500/20 border border-amber-400/60 shadow-md'
                    : 'opacity-50'
                }`}
              >
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-300">
                  Station 1
                </span>
                <span className="text-xs font-bold text-white">Filling Core</span>
              </div>

              {/* Station 2 */}
              <div
                className={`flex flex-col items-center p-1 rounded-xl transition-all ${
                  currentStationIndex === 1
                    ? 'bg-orange-500/20 border border-orange-400/60 shadow-md'
                    : 'opacity-50'
                }`}
              >
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-orange-300">
                  Station 2
                </span>
                <span className="text-xs font-bold text-white">Garnish Topping</span>
              </div>

              {/* Station 3 */}
              <div
                className={`flex flex-col items-center p-1 rounded-xl transition-all ${
                  currentStationIndex === 2
                    ? 'bg-yellow-500/20 border border-yellow-400/60 shadow-md'
                    : 'opacity-50'
                }`}
              >
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-yellow-300">
                  Station 3
                </span>
                <span className="text-xs font-bold text-white">Steam Chamber</span>
              </div>
            </div>

            {/* Conveyor Belt Metal Rail & Rollers */}
            <div className="relative w-full h-12 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 rounded-xl border-t-2 border-b-2 border-amber-500/50 shadow-inner flex items-center overflow-hidden">
              {/* Moving tread dashes */}
              <div
                className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(90deg,#000,#000_12px,#f59e0b_12px,#f59e0b_18px)]"
                style={{
                  transform: `translateX(-${(activeModak.progress * 4) % 18}px)`,
                }}
              />

              {/* Station Dividers on Belt */}
              <div className="absolute left-[33%] top-0 bottom-0 w-0.5 bg-amber-400/60" />
              <div className="absolute left-[66%] top-0 bottom-0 w-0.5 bg-amber-400/60" />

              {/* Exit Delivery Box Indicator at Right */}
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-amber-600/80 to-transparent flex items-center justify-end pr-2 text-base">
                🎁
              </div>
            </div>

            {/* The Moving Modak Character / Dumpling on Conveyor */}
            <div
              className="absolute pointer-events-none transition-all duration-75 ease-linear"
              style={{
                left: `clamp(24px, ${activeModak.progress}%, calc(100% - 100px))`,
                bottom: '36px',
                transform: 'translateX(-50%)',
              }}
            >
              <ModakVisual
                filling={activeModak.selectedFilling}
                topping={activeModak.selectedTopping}
                steamQuality={activeModak.steamQuality}
                size={86}
                isSteamingNow={isHoldingSteam && activeModak.progress >= 64}
              />
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Station Action Panels (Buttons based on active station)          */}
          {/* ---------------------------------------------------------------- */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
            {/* STATION 1: Filling Options */}
            <div
              className={`p-3 rounded-2xl border transition-all ${
                currentStationIndex === 0
                  ? 'bg-slate-900/90 border-amber-400 shadow-xl ring-2 ring-amber-400/30'
                  : 'bg-slate-950/60 border-zinc-800/80 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-amber-300">1. Select Filling:</span>
                {currentStationIndex === 0 && (
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 animate-pulse">
                    Active Station
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {FILLING_OPTIONS.map((f) => {
                  const isSelected = activeModak.selectedFilling === f.id;
                  const isTarget = currentOrder.filling === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleSelectFilling(f.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-950 border-amber-300 shadow-md ring-2 ring-amber-400 scale-[1.02]'
                          : 'bg-zinc-900/80 border-zinc-700 hover:border-amber-400/80 hover:bg-zinc-800'
                      }`}
                    >
                      <span className="text-xl mb-0.5">{f.icon}</span>
                      <span className="text-[10px] font-bold text-white line-clamp-1">
                        {f.name}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] font-extrabold text-emerald-400 mt-0.5">
                          ✓ Added
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STATION 2: Topping Options */}
            <div
              className={`p-3 rounded-2xl border transition-all ${
                currentStationIndex === 1
                  ? 'bg-slate-900/90 border-orange-400 shadow-xl ring-2 ring-orange-400/30'
                  : 'bg-slate-950/60 border-zinc-800/80 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-orange-300">2. Select Topping:</span>
                {currentStationIndex === 1 && (
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 animate-pulse">
                    Active Station
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {TOPPING_OPTIONS.map((t) => {
                  const isSelected = activeModak.selectedTopping === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTopping(t.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-orange-950 border-orange-300 shadow-md ring-2 ring-orange-400 scale-[1.02]'
                          : 'bg-zinc-900/80 border-zinc-700 hover:border-orange-400/80 hover:bg-zinc-800'
                      }`}
                    >
                      <span className="text-xl mb-0.5">{t.icon}</span>
                      <span className="text-[10px] font-bold text-white line-clamp-1">
                        {t.name}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] font-extrabold text-emerald-400 mt-0.5">
                          ✓ Garnished
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STATION 3: Steaming Station (Hold to steam) */}
            <div
              className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                currentStationIndex === 2
                  ? 'bg-slate-900/90 border-yellow-400 shadow-xl ring-2 ring-yellow-400/30'
                  : 'bg-slate-950/60 border-zinc-800/80 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-yellow-300">3. Steam Timing Zone:</span>
                <span className="text-[9px] font-mono text-amber-200">
                  Target: {currentOrder.steamZone.min}% - {currentOrder.steamZone.max}%
                </span>
              </div>

              {/* Steam Gauge Meter */}
              <div className="w-full mb-2">
                <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-700 relative">
                  {/* Sweet zone highlight */}
                  <div
                    className="absolute top-0 bottom-0 bg-emerald-500/30 border-l border-r border-emerald-400 z-0"
                    style={{
                      left: `${currentOrder.steamZone.min}%`,
                      width: `${currentOrder.steamZone.max - currentOrder.steamZone.min}%`,
                    }}
                  />
                  {/* Current Charge Bar */}
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 rounded-full transition-all duration-75 relative z-10"
                    style={{ width: `${activeModak.steamCharge}%` }}
                  />
                </div>
              </div>

              {/* Large Steam Button (Press & Hold) */}
              <button
                id="btn-steam-modak"
                type="button"
                onPointerDown={handleStartSteam}
                onPointerUp={handleReleaseSteam}
                onTouchStart={handleStartSteam}
                onTouchEnd={handleReleaseSteam}
                disabled={activeModak.progress < 64 || activeModak.progress > 97}
                className={`w-full py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg border transition-all cursor-pointer ${
                  isHoldingSteam
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-950 border-yellow-200 scale-95 ring-4 ring-yellow-400/50'
                    : activeModak.progress >= 64 && activeModak.progress <= 97
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 border-yellow-300 animate-pulse'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed opacity-60'
                }`}
              >
                <span>💨</span>
                <span>{isHoldingSteam ? 'Steaming...' : 'Hold to Steam'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* PHASE 3: Results Card                                                */}
      {/* -------------------------------------------------------------------- */}
      {phase === 'RESULTS' && (
        <div
          id="modak-results-card"
          className="my-auto w-full max-w-lg mx-auto rounded-3xl bg-gradient-to-b from-[#2e1305] via-[#200c03] to-[#0f0401] border-2 border-amber-400/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col items-center text-center animate-fade-in"
        >
          {/* Header Trophy & Title */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl shadow-xl mb-3 ring-4 ring-amber-400/30">
            🥟
          </div>

          <span className="text-xs uppercase font-extrabold tracking-widest text-amber-300">
            Festival Kitchen Shift Over!
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-0.5 mb-1">
            Prasad Packed for Bappa!
          </h2>

          <p className="text-xs sm:text-sm text-amber-200/80 mb-5">
            {completedCount >= 8
              ? "Lord Ganesha is overjoyed with your delicious modaks!"
              : completedCount >= 4
              ? "Wonderful seva! Warm and sweet offerings prepared for the arti!"
              : "Great attempt in the kitchen! Keep practicing your culinary speed!"}
          </p>

          {/* Stats Grid */}
          <div className="w-full grid grid-cols-3 gap-2.5 mb-6">
            <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-amber-300">Total Packed</span>
              <span className="text-xl font-black text-white font-mono mt-0.5">
                {completedCount}
              </span>
              <span className="text-[10px] text-emerald-400">{perfectCount} perfect</span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-amber-300">Total Score</span>
              <span className="text-xl font-black text-yellow-300 font-mono mt-0.5">
                +{score}
              </span>
              <span className="text-[10px] text-yellow-200/70">Points earned</span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-amber-300">Rewards</span>
              <span className="text-xl font-black text-amber-400 font-mono mt-0.5">
                +{Math.max(10, Math.floor(completedCount * 4 + perfectCount * 3))} 🪙
              </span>
              <span className="text-[10px] text-amber-200/70">Festival Coins</span>
            </div>
          </div>

          {/* Action Buttons: Retry & Return to Hub */}
          <div className="flex items-center gap-3 w-full">
            <button
              id="btn-modak-retry"
              onClick={startGame}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Shift</span>
            </button>

            <button
              id="btn-modak-return-hub"
              onClick={() => {
                audio.playClick();
                clearAllIntervals();
                onExitToHub();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-400/50 text-amber-200 font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Hub</span>
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Footer                                                               */}
      {/* -------------------------------------------------------------------- */}
      <div className="w-full text-center text-[10px] text-amber-300/50 font-mono py-1">
        Bappa Rush • Station 3: Modak Factory • Fast-paced festival kitchen assembly
      </div>
    </div>
  );
};
