import React, { useState } from 'react';
import { X, Play, ArrowLeft, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { StationInfo } from '../data/festivalData';
import { ScoreManager } from '../game/ScoreManager';
import { AudioManager } from '../game/AudioManager';

interface MinigamePreviewModalProps {
  station: StationInfo;
  onExit: () => void;
}

export const MinigamePreviewModal: React.FC<MinigamePreviewModalProps> = ({
  station,
  onExit,
}) => {
  const [hasCompletedTest, setHasCompletedTest] = useState(false);
  const scoreManager = ScoreManager.getInstance();
  const audio = AudioManager.getInstance();

  const handleSimulatedPractice = () => {
    audio.playSuccess();
    scoreManager.addScore(450, true);
    scoreManager.addCoins(25);
    scoreManager.progressObjective(station.id, 2);
    setHasCompletedTest(true);
  };

  return (
    <div
      id="screen-minigame-view"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-[#24133f] via-[#1c0e34] to-[#120824] border-2 p-6 sm:p-8 shadow-2xl text-white flex flex-col justify-between"
        style={{ borderColor: station.themeColor }}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
              style={{ backgroundColor: `${station.themeColor}33`, borderColor: station.accentColor }}
            >
              {station.icon}
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-300">
                Festival Station
              </span>
              <h2 className="text-2xl font-black text-white">{station.name}</h2>
              <p className="text-xs text-amber-200/80">{station.tagline}</p>
            </div>
          </div>

          <button
            id="btn-minigame-close-x"
            onClick={() => {
              audio.playClick();
              onExit();
            }}
            className="p-1.5 rounded-lg text-amber-300/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Return to Festival Hub"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Station Body */}
        <div className="my-6 flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-indigo-950/70 border border-purple-800/40 text-sm text-amber-100/90 leading-relaxed">
            {station.description}
          </div>

          {/* Volunteer Preparation Tip */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-start gap-3 text-xs text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">Volunteer Tip: </span>
              {station.preparationTip}
            </div>
          </div>

          {/* Test practice simulation card */}
          <div className="p-4 rounded-xl bg-purple-950/60 border border-purple-500/30 flex flex-col items-center text-center">
            <Award className="w-8 h-8 text-yellow-400 mb-1" />
            <h4 className="text-sm font-bold text-amber-200">Station Module Test & Practice</h4>
            <p className="text-xs text-amber-300/70 mt-0.5 mb-3 max-w-xs">
              Test station state registration, score integration, objective progress, and audio signals.
            </p>

            <button
              id="btn-minigame-test-action"
              onClick={handleSimulatedPractice}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Perform Station Action (+450 pts)</span>
            </button>

            {hasCompletedTest && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-300 font-bold animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Station practice registered! Objective progressed.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between">
          <button
            id="btn-minigame-return-hub"
            onClick={() => {
              audio.playClick();
              onExit();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 text-amber-200 font-bold text-xs sm:text-sm border border-indigo-500/40 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Festival Hub</span>
          </button>

          <span className="text-xs text-amber-300/60">Stage 1 Architecture Ready</span>
        </div>
      </div>
    </div>
  );
};
