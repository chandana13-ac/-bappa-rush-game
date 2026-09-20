import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GameState, MinigameId } from './game/GameState';
import { GameManager, GameEventData } from './game/GameManager';
import { ScoreManager, ScoreState } from './game/ScoreManager';
import { TimerManager, TimerSnapshot } from './game/TimerManager';
import { SaveManager } from './game/SaveManager';
import { AudioManager } from './game/AudioManager';
import { FESTIVAL_STATIONS, StationInfo } from './data/festivalData';

import { LoadingScreen } from './ui/LoadingScreen';
import { MainMenu } from './ui/MainMenu';
import { TutorialModal } from './ui/TutorialModal';
import { HUD } from './ui/HUD';
import { PauseMenu } from './ui/PauseMenu';
import { SettingsModal } from './ui/SettingsModal';
import { HighScoreModal } from './ui/HighScoreModal';
import { DevTestModal } from './ui/DevTestModal';
import { MinigamePreviewModal } from './ui/MinigamePreviewModal';
import { DiyaDashGame } from './minigames/diyaDash';
import { RangoliRecallGame } from './minigames/rangoliRecall';
import { ModakFactoryGame } from './minigames/modakFactory';
import { DholEchoGame } from './minigames/dholEcho';
import { PandalPerfectGame } from './minigames/pandalPerfect';
import { ResultsScreen } from './ui/ResultsScreen';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { FestivalCanvas } from './components/FestivalCanvas';
import { TouchControls } from './components/TouchControls';
import { FestivalHub } from './scene/FestivalHub';
import { DebugPanel } from './components/DebugPanel';

export default function App() {
  const gameManager = useRef(GameManager.getInstance()).current;
  const scoreManager = useRef(ScoreManager.getInstance()).current;
  const timerManager = useRef(TimerManager.getInstance()).current;
  const saveManager = useRef(SaveManager.getInstance()).current;
  const audioManager = useRef(AudioManager.getInstance()).current;

  // React states mirroring managers
  const [gameState, setGameState] = useState<GameState>(gameManager.getState());
  const [activeMinigameId, setActiveMinigameId] = useState<MinigameId | null>(null);
  const [scoreState, setScoreState] = useState<ScoreState>(scoreManager.getState());
  const [timerSnapshot, setTimerSnapshot] = useState<TimerSnapshot>(timerManager.getSnapshot());

  // Proximity & Modal states
  const [nearbyStation, setNearbyStation] = useState<StationInfo | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showHighScores, setShowHighScores] = useState<boolean>(false);
  const [showDevTest, setShowDevTest] = useState<boolean>(false);
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);
  const [simulatedError, setSimulatedError] = useState<Error | null>(null);

  // Reference to 3D hub instance for touch controls
  const hubRef = useRef<FestivalHub | null>(null);

  // Subscriptions to Managers
  useEffect(() => {
    const unsubGame = gameManager.subscribe((event: GameEventData) => {
      setGameState(event.currentState);
      setActiveMinigameId(event.activeMinigameId || null);
    });

    const unsubScore = scoreManager.subscribe((state: ScoreState) => {
      setScoreState(state);
    });

    const unsubTimer = timerManager.subscribe((snap: TimerSnapshot) => {
      setTimerSnapshot(snap);
    });

    return () => {
      unsubGame();
      unsubScore();
      unsubTimer();
    };
  }, [gameManager, scoreManager, timerManager]);

  // Synchronize player movement with gameState and modal status
  const isModalOpen = showSettings || showHighScores || showDevTest;
  const isMovementAllowed = gameState === GameState.FESTIVAL_HUB && !isModalOpen;

  useEffect(() => {
    if (hubRef.current) {
      hubRef.current.setMovementEnabled(isMovementAllowed);
    }
  }, [isMovementAllowed]);

  // Global Keyboard shortcuts (Escape for Pause/Close modal, P for Debug panel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not capture shortcuts when user is typing in form inputs
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        // If any modal is open, close it first
        if (showSettings) {
          setShowSettings(false);
          return;
        }
        if (showHighScores) {
          setShowHighScores(false);
          return;
        }
        if (showDevTest) {
          setShowDevTest(false);
          return;
        }
        if (showDebugPanel) {
          setShowDebugPanel(false);
          return;
        }

        const current = gameManager.getState();
        if (current === GameState.FESTIVAL_HUB || current === GameState.MINI_GAME) {
          gameManager.pause();
        } else if (current === GameState.PAUSED) {
          gameManager.resume();
        }
      }

      // P toggle for development debug monitor panel
      if (e.code === 'KeyP' || e.key === 'p' || e.key === 'P') {
        setShowDebugPanel((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameManager, showSettings, showHighScores, showDevTest, showDebugPanel]);

  // Handle Hub station interactions
  const handleProximityChange = useCallback((station: StationInfo | null) => {
    setNearbyStation(station);
  }, []);

  const handleStationInteract = useCallback(
    (station: StationInfo) => {
      audioManager.playBell();
      gameManager.enterMinigame(station.id);
    },
    [audioManager, gameManager]
  );

  // Launch station from Dev Test or Direct UI
  const handleLaunchStation = (id: MinigameId) => {
    audioManager.playBell();
    gameManager.enterMinigame(id);
  };

  // Touch joystick input forwarding to 3D player controller
  const handleTouchMove = (vec: { x: number; y: number }) => {
    if (hubRef.current) {
      hubRef.current.player.virtualInput = vec;
    }
  };

  const handleTouchInteract = () => {
    if (hubRef.current) {
      hubRef.current.interactionSystem.triggerInteract();
    }
  };

  // Find active minigame station info
  const activeStationInfo = activeMinigameId
    ? FESTIVAL_STATIONS.find((s) => s.id === activeMinigameId) || null
    : null;

  // Active incomplete objective
  const currentObjective =
    scoreState.objectives.find((obj) => !obj.completed) ||
    scoreState.objectives[scoreState.objectives.length - 1] ||
    null;

  // Force simulated error for Dev Test error boundary testing
  if (simulatedError) {
    throw simulatedError;
  }

  return (
    <ErrorBoundary onResetToMainMenu={() => gameManager.quitToMainMenu()}>
      <div
        id="app-root"
        className="relative w-screen h-screen overflow-hidden bg-[#0c0926] text-white select-none font-sans"
      >
        {/* 1. BOOT / Loading Screen */}
        {gameState === GameState.BOOT && (
          <LoadingScreen onLoaded={() => gameManager.setState(GameState.MAIN_MENU)} />
        )}

        {/* 2. Persistent 3D Festival Hub Canvas (active during MAIN_MENU, HUB, PAUSED, MINI_GAME) */}
        {gameState !== GameState.BOOT && (
          <FestivalCanvas
            onProximityChange={handleProximityChange}
            onInteract={handleStationInteract}
            onHubReady={(hub) => {
              hubRef.current = hub;
            }}
          />
        )}

        {/* 3. Main Menu Overlay */}
        {gameState === GameState.MAIN_MENU && (
          <MainMenu
            onPlay={() => {
              if (!saveManager.hasCompletedTutorial()) {
                gameManager.setState(GameState.TUTORIAL);
              } else {
                gameManager.startNewFestivalRun(300);
              }
            }}
            onDemoMode={() => gameManager.startDemoMode()}
            onHowToPlay={() => gameManager.setState(GameState.TUTORIAL)}
            onHighScore={() => setShowHighScores(true)}
            onSettings={() => setShowSettings(true)}
          />
        )}

        {/* 4. Tutorial Modal */}
        {gameState === GameState.TUTORIAL && (
          <TutorialModal
            onClose={() => {
              saveManager.setTutorialCompleted(true);
              gameManager.startNewFestivalRun(300);
            }}
            onFinish={() => {
              saveManager.setTutorialCompleted(true);
              gameManager.startNewFestivalRun(300);
            }}
          />
        )}

        {/* 5. Festival Hub HUD (active only in Hub or when Hub is paused) */}
        {(gameState === GameState.FESTIVAL_HUB ||
          (gameState === GameState.PAUSED && gameManager.getPreviousState() === GameState.FESTIVAL_HUB)) && (
          <>
            <HUD
              timerFormatted={timerSnapshot.formattedTime}
              isTimerLow={timerSnapshot.timeRemaining <= 60}
              score={scoreState.score}
              coins={scoreState.coins}
              combo={scoreState.combo}
              comboMultiplier={scoreState.comboMultiplier}
              chaosLevel={scoreState.chaosLevel}
              currentObjective={currentObjective}
              activeNearbyStation={nearbyStation}
              onPauseClick={() => gameManager.pause()}
              onDevTestClick={() => setShowDevTest(true)}
              onDebugClick={() => setShowDebugPanel((prev) => !prev)}
              onInteractClick={() => {
                if (nearbyStation) {
                  handleStationInteract(nearbyStation);
                }
              }}
            />

            {/* Accessible Touch Joystick / Action Button for Mobile / Tablet */}
            <TouchControls onMove={handleTouchMove} onInteract={handleTouchInteract} />
          </>
        )}

        {/* 6. Active Minigame: Diya Dash */}
        {(gameState === GameState.MINI_GAME ||
          (gameState === GameState.PAUSED && gameManager.getPreviousState() === GameState.MINI_GAME)) &&
          activeMinigameId === 'diyaDash' && (
            <DiyaDashGame
              onExitToHub={() => gameManager.exitMinigameToHub()}
              isPaused={gameState === GameState.PAUSED}
            />
          )}

        {/* Active Minigame: Rangoli Recall */}
        {(gameState === GameState.MINI_GAME ||
          (gameState === GameState.PAUSED && gameManager.getPreviousState() === GameState.MINI_GAME)) &&
          activeMinigameId === 'rangoliRecall' && (
            <RangoliRecallGame
              onExitToHub={() => gameManager.exitMinigameToHub()}
              isPaused={gameState === GameState.PAUSED}
            />
          )}

        {/* Active Minigame: Modak Factory */}
        {(gameState === GameState.MINI_GAME ||
          (gameState === GameState.PAUSED && gameManager.getPreviousState() === GameState.MINI_GAME)) &&
          activeMinigameId === 'modakFactory' && (
            <ModakFactoryGame
              onExitToHub={() => gameManager.exitMinigameToHub()}
              isPaused={gameState === GameState.PAUSED}
            />
          )}

        {/* Active Minigame: Dhol Echo */}
        {(gameState === GameState.MINI_GAME ||
          (gameState === GameState.PAUSED && gameManager.getPreviousState() === GameState.MINI_GAME)) &&
          activeMinigameId === 'dholEcho' && (
            <DholEchoGame
              onExitToHub={() => gameManager.exitMinigameToHub()}
              isPaused={gameState === GameState.PAUSED}
            />
          )}

        {/* Active Minigame: Pandal Perfect */}
        {(gameState === GameState.MINI_GAME ||
          (gameState === GameState.PAUSED && gameManager.getPreviousState() === GameState.MINI_GAME)) &&
          activeMinigameId === 'pandalPerfect' && (
            <PandalPerfectGame
              onExitToHub={() => gameManager.exitMinigameToHub()}
              isPaused={gameState === GameState.PAUSED}
              onPause={() => gameManager.pause()}
            />
          )}

        {/* 7. Other Minigame Station Previews */}
        {gameState === GameState.MINI_GAME &&
          activeMinigameId !== 'diyaDash' &&
          activeMinigameId !== 'rangoliRecall' &&
          activeMinigameId !== 'modakFactory' &&
          activeMinigameId !== 'dholEcho' &&
          activeMinigameId !== 'pandalPerfect' &&
          activeStationInfo && (
            <MinigamePreviewModal
              station={activeStationInfo}
              onExit={() => gameManager.exitMinigameToHub()}
            />
          )}

        {/* 7. Pause Menu */}
        {gameState === GameState.PAUSED && (
          <PauseMenu
            onResume={() => gameManager.resume()}
            onHowToPlay={() => gameManager.setState(GameState.TUTORIAL)}
            onSettings={() => setShowSettings(true)}
            onQuitToMenu={() => {
              if (hubRef.current) {
                hubRef.current.player.setPosition(0, 0, 0);
              }
              gameManager.quitToMainMenu();
            }}
          />
        )}

        {/* 8. Results / Game Over Screen */}
        {(gameState === GameState.RESULTS || gameState === GameState.GAME_OVER) && (
          <ResultsScreen
            onPlayAgain={() => gameManager.startNewFestivalRun(300)}
            onMainMenu={() => {
              if (hubRef.current) {
                hubRef.current.player.setPosition(0, 0, 0);
              }
              gameManager.quitToMainMenu();
            }}
          />
        )}

        {/* 9. Development Debug Monitor Panel */}
        <DebugPanel
          isOpen={showDebugPanel}
          onClose={() => setShowDebugPanel(false)}
          gameState={gameState}
          isPaused={gameState === GameState.PAUSED}
          hub={hubRef.current}
        />

        {/* 10. Global Modals */}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        {showHighScores && <HighScoreModal onClose={() => setShowHighScores(false)} />}
        {showDevTest && (
          <DevTestModal
            onClose={() => setShowDevTest(false)}
            onOpenMinigame={(id) => handleLaunchStation(id)}
            onSwitchState={(state) => gameManager.setState(state)}
            onTriggerError={() => setSimulatedError(new Error('Simulated test error'))}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
