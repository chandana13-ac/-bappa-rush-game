import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  onLoaded: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoaded }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onLoaded(), 250);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15 + 10);
      });
    }, 120);

    return () => clearInterval(interval);
  }, [onLoaded]);

  return (
    <div
      id="screen-loading"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#0c0926] via-[#1a0f37] to-[#2a134a] text-white select-none px-6"
    >
      <div className="flex flex-col items-center max-w-md w-full text-center">
        {/* Glowing Festival Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/40 animate-pulse">
            <span className="text-5xl">🐘</span>
          </div>
          <div className="absolute -top-2 -right-2 text-yellow-300 animate-bounce">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Title */}
        <h1
          id="loading-title"
          className="text-4xl sm:text-5xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 drop-shadow-md"
        >
          BAPPA RUSH
        </h1>

        <p id="loading-text" className="mt-2 text-lg text-amber-200/90 font-medium">
          Loading the festival...
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-indigo-950/80 rounded-full h-3.5 mt-8 p-0.5 border border-amber-500/30 overflow-hidden shadow-inner">
          <div
            id="loading-progress-bar"
            className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 rounded-full transition-all duration-200 ease-out shadow-sm shadow-amber-400/50"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>

        {/* Progress text */}
        <div className="w-full flex justify-between items-center mt-3 text-xs text-amber-300/70 font-mono">
          <span>Preparing Mandap & Diyas</span>
          <span>{Math.min(100, progress)}%</span>
        </div>
      </div>
    </div>
  );
};
