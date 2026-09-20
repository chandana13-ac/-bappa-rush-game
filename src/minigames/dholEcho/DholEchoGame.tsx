import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DholDirection, TimingRating, DIRECTION_CONFIGS } from './types';
import { DholDrumVisual } from './DholDrumVisual';
import { ScoreManager } from '../../game/ScoreManager';
import { AudioManager } from '../../game/AudioManager';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Timer,
  Drum,
} from 'lucide-react';

interface DholEchoGameProps {
  onExitToHub: () => void;
  isPaused?: boolean;
}

type GamePhase = 'INSTRUCTIONS' | 'DEMO' | 'REPEAT' | 'RESULTS';

export const DholEchoGame: React.FC<DholEchoGameProps> = ({
  onExitToHub,
  isPaused = false,
}) => {
  const scoreManager = useRef(ScoreManager.getInstance()).current;
  const audio = useRef(AudioManager.getInstance()).current;

  // Phase
  const [phase, setPhase] = useState<GamePhase>('INSTRUCTIONS');
  const [timeRemaining, setTimeRemaining] = useState<number>(35.0); // 35-second round
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [patternsCompleted, setPatternsCompleted] = useState<number>(0);
  const [totalNotesHit, setTotalNotesHit] = useState<number>(0);

  // Pattern sequence state
  const [currentPattern, setCurrentPattern] = useState<DholDirection[]>([]);
  const [demoStepIndex, setDemoStepIndex] = useState<number>(-1);
  const [playerInputIndex, setPlayerInputIndex] = useState<number>(0);

  // Visual feedback states
  const [activeDirectionVisual, setActiveDirectionVisual] = useState<DholDirection | null>(null);
  const [isDrumVibrating, setIsDrumVibrating] = useState<boolean>(false);
  const [lastTimingRating, setLastTimingRating] = useState<{
    rating: TimingRating;
    direction: DholDirection;
  } | null>(null);

  const [feedbackToast, setFeedbackToast] = useState<{
    text: string;
    type: 'success' | 'info' | 'hint';
  } | null>(null);

  // Stats Breakdown for Results
  const [ratingCounts, setRatingCounts] = useState<{
    perfect: number;
    great: number;
    good: number;
    miss: number;
  }>({ perfect: 0, great: 0, good: 0, miss: 0 });

  // Web Audio Context for Authentic Percussion Tones
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Timers and references
  const timerIntervalRef = useRef<number | null>(null);
  const demoIntervalRef = useRef<number | null>(null);
  const demoTimeoutRef = useRef<number | null>(null);
  const visualTimeoutRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const lastNoteTimeRef = useRef<number>(performance.now());

  // Show temporary toast message
  const showToast = useCallback((text: string, type: 'success' | 'info' | 'hint' = 'info') => {
    if (toastTimeoutRef.current !== null) {
      clearTimeout(toastTimeoutRef.current);
    }
    setFeedbackToast({ text, type });
    toastTimeoutRef.current = window.setTimeout(() => {
      setFeedbackToast(null);
      toastTimeoutRef.current = null;
    }, 2200);
  }, []);

  // --------------------------------------------------------------------------
  // Synthesize Realistic Percussion Drum Beat
  // --------------------------------------------------------------------------
  const playPercussionSound = useCallback((dir: DholDirection) => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      if (!audioCtxRef.current) return;

      const ctx = audioCtxRef.current;
      const config = DIRECTION_CONFIGS[dir];
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (config.strokeType === 'dunki') {
        // Deep low resonant bass boom
        osc.type = 'sine';
        osc.frequency.setValueAtTime(config.frequencyStart, now);
        osc.frequency.exponentialRampToValueAtTime(config.frequencyEnd, now + 0.3);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      } else if (config.strokeType === 'kaddi') {
        // Sharp high tasha stick snap
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(config.frequencyStart, now);
        osc.frequency.exponentialRampToValueAtTime(config.frequencyEnd, now + 0.16);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      } else if (config.strokeType === 'rim') {
        // Metallic rim hit
        osc.type = 'square';
        osc.frequency.setValueAtTime(config.frequencyStart, now);
        osc.frequency.exponentialRampToValueAtTime(config.frequencyEnd, now + 0.14);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      } else {
        // Body slap thud
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(config.frequencyStart, now);
        osc.frequency.exponentialRampToValueAtTime(config.frequencyEnd, now + 0.22);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);
    } catch {
      // Audio error ignored safely
    }
  }, []);

  // --------------------------------------------------------------------------
  // Trigger Drum Vibration & Visual Glow
  // --------------------------------------------------------------------------
  const triggerVisualBeat = useCallback(
    (dir: DholDirection) => {
      setActiveDirectionVisual(dir);
      setIsDrumVibrating(true);
      playPercussionSound(dir);

      if (visualTimeoutRef.current !== null) {
        clearTimeout(visualTimeoutRef.current);
      }
      visualTimeoutRef.current = window.setTimeout(() => {
        setIsDrumVibrating(false);
        setActiveDirectionVisual(null);
        visualTimeoutRef.current = null;
      }, 220);
    },
    [playPercussionSound]
  );

  // --------------------------------------------------------------------------
  // Clean Up All Timers
  // --------------------------------------------------------------------------
  const clearAllTimers = useCallback(() => {
    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (demoIntervalRef.current !== null) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    if (demoTimeoutRef.current !== null) {
      clearTimeout(demoTimeoutRef.current);
      demoTimeoutRef.current = null;
    }
    if (visualTimeoutRef.current !== null) {
      clearTimeout(visualTimeoutRef.current);
      visualTimeoutRef.current = null;
    }
    if (toastTimeoutRef.current !== null) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimers();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [clearAllTimers]);

  // --------------------------------------------------------------------------
  // Generate Random Arrow Pattern
  // --------------------------------------------------------------------------
  const generatePattern = useCallback((completedCount: number): DholDirection[] => {
    const directions: DholDirection[] = ['LEFT', 'UP', 'DOWN', 'RIGHT'];
    // Gradually increase length: 3 -> 4 -> 5 -> 6
    let length = 3;
    if (completedCount >= 5) length = 6;
    else if (completedCount >= 3) length = 5;
    else if (completedCount >= 1) length = 4;

    const pattern: DholDirection[] = [];
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * directions.length);
      pattern.push(directions[randomIndex]);
    }
    return pattern;
  }, []);

  // --------------------------------------------------------------------------
  // Playback Demo Sequence for Player to Watch
  // --------------------------------------------------------------------------
  const startDemoSequence = useCallback(
    (pattern: DholDirection[]) => {
      setPhase('DEMO');
      setPlayerInputIndex(0);
      setDemoStepIndex(-1);
      setLastTimingRating(null);

      // Play each note with a steady cadence (~480ms)
      let step = 0;
      demoIntervalRef.current = window.setInterval(() => {
        if (step < pattern.length) {
          setDemoStepIndex(step);
          triggerVisualBeat(pattern[step]);
          step++;
        } else {
          // Finished demo
          if (demoIntervalRef.current !== null) {
            clearInterval(demoIntervalRef.current);
            demoIntervalRef.current = null;
          }
          demoTimeoutRef.current = window.setTimeout(() => {
            setDemoStepIndex(-1);
            setPhase('REPEAT');
            lastNoteTimeRef.current = performance.now();
            showToast('Your turn! Echo the rhythm!', 'info');
          }, 350);
        }
      }, 480);
    },
    [triggerVisualBeat, showToast]
  );

  // --------------------------------------------------------------------------
  // Start New Round
  // --------------------------------------------------------------------------
  const startGame = useCallback(() => {
    clearAllTimers();
    audio.playBell();

    setScore(0);
    setCombo(0);
    setPatternsCompleted(0);
    setTotalNotesHit(0);
    setTimeRemaining(35.0);
    setRatingCounts({ perfect: 0, great: 0, good: 0, miss: 0 });

    const newPattern = generatePattern(0);
    setCurrentPattern(newPattern);
    startDemoSequence(newPattern);
  }, [clearAllTimers, audio, generatePattern, startDemoSequence]);

  // --------------------------------------------------------------------------
  // Finish Round
  // --------------------------------------------------------------------------
  const finishGame = useCallback(() => {
    clearAllTimers();
    audio.playSuccess();

    // Register rewards in ScoreManager
    scoreManager.addScore(score);
    const coinsEarned = Math.max(10, Math.floor(patternsCompleted * 6 + totalNotesHit * 2));
    scoreManager.addCoins(coinsEarned);
    scoreManager.progressObjective('dholEcho', totalNotesHit);
    scoreManager.adjustChaos(-15);

    setPhase('RESULTS');
  }, [clearAllTimers, audio, score, patternsCompleted, totalNotesHit, scoreManager]);

  // --------------------------------------------------------------------------
  // 35s Countdown Timer
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (phase === 'INSTRUCTIONS' || phase === 'RESULTS' || isPaused) {
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = window.setInterval(() => {
      setTimeRemaining((prev) => {
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
  // Handle Player Input (Arrow Key or On-screen Button)
  // --------------------------------------------------------------------------
  const handleDirectionInput = useCallback(
    (dir: DholDirection) => {
      if (phase !== 'REPEAT' || isPaused) return;

      const expectedDir = currentPattern[playerInputIndex];
      const now = performance.now();
      const responseTime = now - lastNoteTimeRef.current;
      lastNoteTimeRef.current = now;

      if (dir === expectedDir) {
        // Correct Hit!
        triggerVisualBeat(dir);

        // Timing rating based on response speed
        let rating: TimingRating = 'GOOD';
        let points = 100;

        if (responseTime < 520) {
          rating = 'PERFECT';
          points = 250;
        } else if (responseTime < 900) {
          rating = 'GREAT';
          points = 180;
        }

        setLastTimingRating({ rating, direction: dir });
        setRatingCounts((prev) => ({
          ...prev,
          [rating.toLowerCase()]: prev[rating.toLowerCase() as keyof typeof prev] + 1,
        }));

        setTotalNotesHit((prev) => prev + 1);
        setScore((prev) => prev + points + combo * 25);

        const nextIndex = playerInputIndex + 1;

        if (nextIndex >= currentPattern.length) {
          // Entire pattern completed successfully!
          audio.playSuccess();
          const newCombo = combo + 1;
          setCombo(newCombo);
          setPatternsCompleted((p) => p + 1);
          setPlayerInputIndex(nextIndex);

          showToast(`🎉 Rhythm Mastered! Combo x${newCombo}!`, 'success');

          // Progress run objective
          scoreManager.progressObjective('dholEcho', currentPattern.length);

          // Brief celebratory pause before next pattern
          setTimeout(() => {
            const nextPattern = generatePattern(patternsCompleted + 1);
            setCurrentPattern(nextPattern);
            startDemoSequence(nextPattern);
          }, 650);
        } else {
          setPlayerInputIndex(nextIndex);
        }
      } else {
        // Miss / Incorrect Arrow
        audio.playClick();
        setLastTimingRating({ rating: 'MISS', direction: dir });
        setRatingCounts((prev) => ({ ...prev, miss: prev.miss + 1 }));
        setCombo(0);

        showToast('🥁 Missed a beat! Listen again closely!', 'hint');

        // Graceful non-harsh recovery: repeat same or new pattern
        setPhase('DEMO');
        setTimeout(() => {
          startDemoSequence(currentPattern);
        }, 800);
      }
    },
    [
      phase,
      isPaused,
      currentPattern,
      playerInputIndex,
      combo,
      patternsCompleted,
      triggerVisualBeat,
      audio,
      showToast,
      scoreManager,
      generatePattern,
      startDemoSequence,
    ]
  );

  // --------------------------------------------------------------------------
  // Keyboard Event Listener (Arrow Keys & WASD)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'REPEAT' || isPaused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let matchedDir: DholDirection | null = null;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        matchedDir = 'LEFT';
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        matchedDir = 'UP';
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        matchedDir = 'RIGHT';
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        matchedDir = 'DOWN';
      }

      if (matchedDir) {
        e.preventDefault();
        handleDirectionInput(matchedDir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [phase, isPaused, handleDirectionInput]);

  return (
    <div
      id="dhol-echo-container"
      className="absolute inset-0 z-30 flex flex-col justify-between p-3 sm:p-5 bg-gradient-to-b from-[#1c0800] via-[#2d0f02] to-[#120500] text-white select-none font-sans overflow-y-auto"
    >
      {/* -------------------------------------------------------------------- */}
      {/* Top Header Bar                                                       */}
      {/* -------------------------------------------------------------------- */}
      <div className="w-full max-w-2xl mx-auto flex items-center justify-between gap-2 pb-2 border-b border-orange-500/30">
        <button
          id="btn-dhol-exit"
          onClick={() => {
            audio.playClick();
            clearAllTimers();
            onExitToHub();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-950/70 hover:bg-orange-900 text-orange-200 border border-orange-500/40 text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Hub</span>
        </button>

        {/* Title */}
        <div className="flex items-center gap-2">
          <span className="text-2xl animate-bounce">🥁</span>
          <div className="flex flex-col text-left">
            <h1 className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-red-400 tracking-wide">
              Dhol Echo
            </h1>
            <span className="text-[10px] text-orange-300/70">Festival Rhythm Echo Challenge</span>
          </div>
        </div>

        {/* HUD: Timer & Score */}
        <div className="flex items-center gap-2">
          {(phase === 'DEMO' || phase === 'REPEAT') && (
            <>
              {/* Timer */}
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border font-mono font-bold text-xs sm:text-sm shadow-md transition-colors ${
                  timeRemaining <= 10
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-orange-950/80 border-orange-500/50 text-orange-200'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>{Math.ceil(timeRemaining)}s</span>
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
          id="dhol-instructions-card"
          className="my-auto w-full max-w-md mx-auto rounded-3xl bg-gradient-to-b from-[#331102] via-[#260c02] to-[#140601] border-2 border-orange-500/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col items-center text-center animate-fade-in"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-3xl shadow-xl mb-4 ring-4 ring-orange-400/30">
            🥁
          </div>

          <span className="text-xs uppercase font-extrabold tracking-widest text-amber-300 mb-1">
            Station 4 • Rhythm Mini-Game
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">DHOL ECHO</h2>
          <p className="text-xs sm:text-sm text-orange-100/90 leading-relaxed mb-5">
            Feel the thunderous pulse of Maharashtrian festival drums! Watch and listen as the dhol
            plays a rhythm, then repeat it back in perfect sync!
          </p>

          <div className="w-full bg-orange-950/60 rounded-2xl border border-orange-500/30 p-4 mb-6 text-left flex flex-col gap-2.5 text-xs text-orange-100">
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">1.</span>
              <span>
                <strong>Watch the Rhythm:</strong> The dhol beats 3 to 6 arrows in sequence.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-400 font-bold">2.</span>
              <span>
                <strong>Echo on Your Turn:</strong> Tap the large on-screen buttons or press{' '}
                <strong className="text-amber-300">Arrow Keys</strong> (or WASD).
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold">3.</span>
              <span>
                <strong>Timing Ratings:</strong> Hit fast for <strong>PERFECT</strong> (+250) and{' '}
                <strong>GREAT</strong> (+180) scores!
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">4.</span>
              <span>
                <strong>35-Second Round:</strong> Chain combos without missing to score big for
                Bappa!
              </span>
            </div>
          </div>

          <button
            id="btn-start-dhol"
            onClick={startGame}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 hover:brightness-110 text-white font-black text-base sm:text-lg shadow-xl ring-2 ring-orange-300/40 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Start Drum Beat
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* PHASE 2: Main Playing & Repeating Stage                              */}
      {/* -------------------------------------------------------------------- */}
      {(phase === 'DEMO' || phase === 'REPEAT') && (
        <div className="my-auto flex flex-col items-center w-full max-w-xl mx-auto gap-3">
          {/* Top Score & Combo Bar */}
          <div className="w-full flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-950/70 border border-orange-500/40 text-xs">
                <Flame
                  className={`w-4 h-4 ${combo > 0 ? 'text-amber-400 animate-bounce' : 'text-zinc-500'}`}
                />
                <span className="text-orange-200">
                  Combo: <strong className="font-mono text-white text-sm">x{combo}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-950/70 border border-orange-500/40 text-xs">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-orange-200">
                  Score: <strong className="font-mono text-white text-sm">{score}</strong>
                </span>
              </div>
            </div>

            {/* Patterns Completed Tally */}
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
              <span>🥁 {patternsCompleted} rhythms</span>
            </div>
          </div>

          {/* Turn Banner (Listen vs Your Turn) */}
          <div className="w-full flex flex-col items-center">
            <div
              className={`px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${
                phase === 'DEMO'
                  ? 'bg-amber-500 text-slate-950 animate-pulse ring-4 ring-amber-400/30'
                  : 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-400/30'
              }`}
            >
              <span>{phase === 'DEMO' ? '👂 WATCH & LISTEN...' : '🥁 YOUR TURN! ECHO NOW!'}</span>
            </div>

            {/* Timing Feedback Badge */}
            <div className="h-6 mt-1 flex items-center justify-center">
              {lastTimingRating && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all animate-bounce ${
                    lastTimingRating.rating === 'PERFECT'
                      ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-200'
                      : lastTimingRating.rating === 'GREAT'
                      ? 'bg-emerald-400 text-slate-950'
                      : lastTimingRating.rating === 'GOOD'
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {lastTimingRating.rating}!
                </span>
              )}
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Central Drum Visual Display                                      */}
          {/* ---------------------------------------------------------------- */}
          <div className="relative my-1 flex flex-col items-center justify-center">
            <DholDrumVisual
              activeDirection={activeDirectionVisual}
              isVibrating={isDrumVibrating}
              size={230}
            />
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Pattern Track (Shows Sequence of Arrows)                          */}
          {/* ---------------------------------------------------------------- */}
          <div
            id="dhol-pattern-track"
            className="flex items-center justify-center gap-2 sm:gap-3 p-3 rounded-2xl bg-slate-950/80 border border-orange-500/40 shadow-xl"
          >
            {currentPattern.map((dir, idx) => {
              const cfg = DIRECTION_CONFIGS[dir];
              const isDemoActive = phase === 'DEMO' && demoStepIndex === idx;
              const isPlayerCompleted = phase === 'REPEAT' && idx < playerInputIndex;
              const isPlayerCurrent = phase === 'REPEAT' && idx === playerInputIndex;

              return (
                <div
                  key={idx}
                  className={`w-11 h-11 sm:w-13 sm:h-13 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    isDemoActive
                      ? 'bg-amber-400 border-white text-slate-950 scale-110 shadow-lg ring-4 ring-amber-300'
                      : isPlayerCompleted
                      ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                      : isPlayerCurrent
                      ? 'bg-orange-950 border-orange-400 text-white animate-pulse ring-2 ring-orange-400/50 scale-105'
                      : 'bg-zinc-900/80 border-zinc-700 text-zinc-400'
                  }`}
                >
                  <span className="text-xl sm:text-2xl">{cfg.keyLabel}</span>
                  {isPlayerCompleted && (
                    <span className="text-[8px] font-black text-emerald-400 -mt-1">✓</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Feedback Toast Notification */}
          <div className="h-5 flex items-center justify-center">
            {feedbackToast && (
              <span
                className={`text-xs font-bold px-3 py-0.5 rounded-full ${
                  feedbackToast.type === 'success'
                    ? 'text-emerald-300'
                    : feedbackToast.type === 'hint'
                    ? 'text-amber-300'
                    : 'text-orange-200'
                }`}
              >
                {feedbackToast.text}
              </span>
            )}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* 4 Large Touch Buttons / D-Pad Controls (Left, Up, Down, Right)    */}
          {/* ---------------------------------------------------------------- */}
          <div className="w-full max-w-sm grid grid-cols-3 gap-2 mt-1">
            {/* Top row: Up button in center */}
            <div />
            <button
              id="btn-dhol-up"
              type="button"
              disabled={phase !== 'REPEAT'}
              onClick={() => handleDirectionInput('UP')}
              className="py-3.5 px-2 rounded-2xl bg-gradient-to-b from-yellow-500 to-amber-600 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-yellow-300 shadow-xl flex flex-col items-center justify-center text-slate-950 font-black cursor-pointer transition-all"
            >
              <span className="text-2xl">↑</span>
              <span className="text-[10px] uppercase font-bold tracking-tight">UP (Ta)</span>
            </button>
            <div />

            {/* Middle row: Left, Center Drum Icon, Right */}
            <button
              id="btn-dhol-left"
              type="button"
              disabled={phase !== 'REPEAT'}
              onClick={() => handleDirectionInput('LEFT')}
              className="py-3.5 px-2 rounded-2xl bg-gradient-to-b from-rose-600 to-red-700 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-rose-400 shadow-xl flex flex-col items-center justify-center text-white font-black cursor-pointer transition-all"
            >
              <span className="text-2xl">←</span>
              <span className="text-[10px] uppercase font-bold tracking-tight">LEFT (Dhum)</span>
            </button>

            <div className="flex items-center justify-center text-3xl opacity-40">
              🥁
            </div>

            <button
              id="btn-dhol-right"
              type="button"
              disabled={phase !== 'REPEAT'}
              onClick={() => handleDirectionInput('RIGHT')}
              className="py-3.5 px-2 rounded-2xl bg-gradient-to-b from-cyan-500 to-teal-600 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-cyan-300 shadow-xl flex flex-col items-center justify-center text-slate-950 font-black cursor-pointer transition-all"
            >
              <span className="text-2xl">→</span>
              <span className="text-[10px] uppercase font-bold tracking-tight">RIGHT (Tasha)</span>
            </button>

            {/* Bottom row: Down button in center */}
            <div />
            <button
              id="btn-dhol-down"
              type="button"
              disabled={phase !== 'REPEAT'}
              onClick={() => handleDirectionInput('DOWN')}
              className="py-3.5 px-2 rounded-2xl bg-gradient-to-b from-orange-500 to-amber-600 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-orange-300 shadow-xl flex flex-col items-center justify-center text-slate-950 font-black cursor-pointer transition-all"
            >
              <span className="text-2xl">↓</span>
              <span className="text-[10px] uppercase font-bold tracking-tight">DOWN (Dhaga)</span>
            </button>
            <div />
          </div>

          <div className="text-[11px] text-orange-300/60 font-mono mt-1 text-center">
            Keyboard supported: Use <strong className="text-amber-200">Arrow Keys</strong> or{' '}
            <strong className="text-amber-200">WASD</strong>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* PHASE 3: Results Card                                                */}
      {/* -------------------------------------------------------------------- */}
      {phase === 'RESULTS' && (
        <div
          id="dhol-results-card"
          className="my-auto w-full max-w-lg mx-auto rounded-3xl bg-gradient-to-b from-[#331102] via-[#240c02] to-[#120500] border-2 border-orange-500/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col items-center text-center animate-fade-in"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-3xl shadow-xl mb-3 ring-4 ring-orange-400/30">
            🥁
          </div>

          <span className="text-xs uppercase font-extrabold tracking-widest text-amber-300">
            Rhythm Session Complete!
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-0.5 mb-1">
            Crowd is Cheering!
          </h2>

          <p className="text-xs sm:text-sm text-orange-200/80 mb-5">
            {patternsCompleted >= 6
              ? 'Thunderous rhythm! You played like a true master Dhol Tasha player!'
              : patternsCompleted >= 3
              ? 'Fantastic energy! The temple procession is dancing to your beat!'
              : 'Good start! Practice your rhythm echo to hit longer sequences!'}
          </p>

          {/* Stats Bar */}
          <div className="w-full grid grid-cols-3 gap-2.5 mb-5">
            <div className="p-3 rounded-2xl bg-orange-950/60 border border-orange-500/40 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-orange-300">Rhythms</span>
              <span className="text-xl font-black text-white font-mono mt-0.5">
                {patternsCompleted}
              </span>
              <span className="text-[10px] text-orange-200/70">{totalNotesHit} beats hit</span>
            </div>

            <div className="p-3 rounded-2xl bg-orange-950/60 border border-orange-500/40 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-orange-300">Total Score</span>
              <span className="text-xl font-black text-yellow-300 font-mono mt-0.5">
                +{score}
              </span>
              <span className="text-[10px] text-yellow-200/70">Points earned</span>
            </div>

            <div className="p-3 rounded-2xl bg-orange-950/60 border border-orange-500/40 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-orange-300">Festival Coins</span>
              <span className="text-xl font-black text-amber-400 font-mono mt-0.5">
                +{Math.max(10, Math.floor(patternsCompleted * 6 + totalNotesHit * 2))} 🪙
              </span>
              <span className="text-[10px] text-amber-200/70">Rewards</span>
            </div>
          </div>

          {/* Timing Accuracy Breakdown */}
          <div className="w-full flex items-center justify-around py-2 px-3 rounded-xl bg-slate-950/60 border border-zinc-800 mb-6 text-xs font-bold">
            <span className="text-amber-400 font-mono">{ratingCounts.perfect} Perfect</span>
            <span className="text-emerald-400 font-mono">{ratingCounts.great} Great</span>
            <span className="text-cyan-400 font-mono">{ratingCounts.good} Good</span>
            <span className="text-rose-400 font-mono">{ratingCounts.miss} Misses</span>
          </div>

          {/* Action Buttons: Retry & Return to Hub */}
          <div className="flex items-center gap-3 w-full">
            <button
              id="btn-dhol-retry"
              onClick={startGame}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>

            <button
              id="btn-dhol-return-hub"
              onClick={() => {
                audio.playClick();
                clearAllTimers();
                onExitToHub();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-orange-950 hover:bg-orange-900 border border-orange-500/50 text-orange-200 font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
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
      <div className="w-full text-center text-[10px] text-orange-300/50 font-mono py-1">
        Bappa Rush • Station 4: Dhol Echo • Traditional rhythm memory challenge
      </div>
    </div>
  );
};
