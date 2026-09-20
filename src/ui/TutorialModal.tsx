import React, { useState } from 'react';
import { TUTORIAL_CARDS } from '../data/festivalData';
import { ChevronRight, ChevronLeft, Check, X } from 'lucide-react';
import { AudioManager } from '../game/AudioManager';

interface TutorialModalProps {
  onClose: () => void;
  onFinish?: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose, onFinish }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const audio = AudioManager.getInstance();
  const card = TUTORIAL_CARDS[currentIdx];
  const isLast = currentIdx === TUTORIAL_CARDS.length - 1;

  const handleNext = () => {
    audio.playClick();
    if (isLast) {
      if (onFinish) onFinish();
      else onClose();
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    audio.playClick();
    setCurrentIdx((prev) => Math.max(0, prev - 1));
  };

  return (
    <div
      id="modal-tutorial"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-[#24133f] via-[#1c0e34] to-[#120824] border-2 border-amber-400/40 p-6 sm:p-8 shadow-2xl shadow-purple-950/80 text-white flex flex-col justify-between min-h-[440px]">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                Card {currentIdx + 1} of {TUTORIAL_CARDS.length} • {card.badge}
              </span>
              <h3 className="text-xl font-extrabold text-amber-200">{card.title}</h3>
            </div>
          </div>
          <button
            id="btn-tutorial-skip-x"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-amber-300/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Close Tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Body */}
        <div className="my-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500/30 to-pink-500/30 border border-amber-400/40 flex items-center justify-center text-4xl mb-4 shadow-inner">
            {card.visualHint}
          </div>

          <h4 className="text-base sm:text-lg font-bold text-amber-300 mb-2">{card.subtitle}</h4>

          <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed max-w-sm">
            {card.text}
          </p>

          {card.keys && card.keys.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {card.keys.map((k, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs font-mono font-bold shadow-sm"
                >
                  {k}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Step dots */}
        <div className="flex justify-center items-center gap-1.5 mb-4">
          {TUTORIAL_CARDS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === currentIdx ? 'w-6 bg-amber-400' : 'w-2 bg-amber-400/30'
              }`}
            />
          ))}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-amber-500/20">
          <button
            id="btn-tutorial-skip"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="text-xs sm:text-sm font-semibold text-amber-300/80 hover:text-amber-200 hover:underline px-2 py-1 cursor-pointer"
          >
            Skip Tutorial
          </button>

          <div className="flex items-center gap-2">
            {currentIdx > 0 && (
              <button
                id="btn-tutorial-prev"
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-amber-200 text-xs sm:text-sm font-semibold border border-purple-400/30 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              id="btn-tutorial-next"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/30 transition-all cursor-pointer"
            >
              <span>{isLast ? 'Start Playing' : 'Next'}</span>
              {isLast ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
