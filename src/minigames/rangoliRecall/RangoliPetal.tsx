import React from 'react';
import { PetalColor, PETAL_COLORS } from './types';
import { Sun, Sparkles, Heart, Diamond, Droplet, Check, X } from 'lucide-react';

interface RangoliPetalProps {
  color: PetalColor | null;
  size?: number;
  isSelected?: boolean;
  isHinted?: boolean;
  isCorrect?: boolean | null; // For results view
  disabled?: boolean;
  onClick?: () => void;
  index?: number;
  className?: string;
  showStatusBadge?: boolean;
}

export const RangoliPetal: React.FC<RangoliPetalProps> = ({
  color,
  size = 72,
  isSelected = false,
  isHinted = false,
  isCorrect = null,
  disabled = false,
  onClick,
  index,
  className = '',
  showStatusBadge = false,
}) => {
  const config = color ? PETAL_COLORS[color] : null;

  // Render distinctive icon for accessibility
  const renderPetalIcon = () => {
    if (!config) return null;
    const iconProps = { className: 'w-4 h-4 sm:w-5 sm:h-5 text-white/95 filter drop-shadow' };
    switch (config.iconName) {
      case 'sun':
        return <Sun {...iconProps} />;
      case 'sparkles':
        return <Sparkles {...iconProps} />;
      case 'heart':
        return <Heart {...iconProps} />;
      case 'diamond':
        return <Diamond {...iconProps} />;
      case 'droplet':
        return <Droplet {...iconProps} />;
      default:
        return null;
    }
  };

  return (
    <button
      type="button"
      id={index !== undefined ? `rangoli-cell-${index}` : undefined}
      disabled={disabled}
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`relative group flex items-center justify-center rounded-2xl transition-all duration-200 select-none touch-manipulation ${
        disabled
          ? 'cursor-default'
          : 'cursor-pointer hover:scale-105 active:scale-95 focus:outline-none'
      } ${
        isSelected
          ? 'ring-4 ring-amber-300 ring-offset-2 ring-offset-[#13091e] scale-105 z-10'
          : ''
      } ${
        isHinted
          ? 'ring-4 ring-yellow-300 ring-offset-2 ring-offset-[#13091e] animate-pulse z-20 scale-105'
          : ''
      } ${
        isCorrect === true
          ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-[#13091e] bg-emerald-950/40'
          : isCorrect === false
          ? 'ring-2 ring-amber-400/80 ring-offset-1 ring-offset-[#13091e] bg-rose-950/30'
          : ''
      } ${className}`}
      aria-label={
        config
          ? `${config.name} at position ${index !== undefined ? index + 1 : ''}`
          : `Empty cell ${index !== undefined ? index + 1 : ''}`
      }
    >
      {/* Cell base slot */}
      <div
        className={`absolute inset-0 rounded-2xl transition-all duration-200 border ${
          config
            ? 'bg-gradient-to-br from-[#231238] to-[#12071e] border-amber-400/40 shadow-lg'
            : isHinted
            ? 'bg-amber-500/20 border-yellow-300 shadow-lg shadow-yellow-500/30'
            : 'bg-[#1e1030]/60 border-dashed border-purple-400/30 hover:border-amber-400/70 hover:bg-[#2a1645]/70'
        }`}
      />

      {/* Decorative inner rangoli chalk pattern for empty cells */}
      {!config && (
        <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity">
          <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-amber-200/50 stroke-1 fill-none">
            <circle cx="12" cy="12" r="7" strokeDasharray="2 2" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
          {index !== undefined && (
            <span className="text-[10px] font-mono text-amber-300/40 mt-0.5">
              {index + 1}
            </span>
          )}
        </div>
      )}

      {/* Colored Petal Flower SVG when cell is filled */}
      {config && (
        <div className="relative z-10 w-full h-full p-1.5 flex items-center justify-center animate-in fade-in zoom-in-75 duration-200">
          <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-md">
            <defs>
              <radialGradient id={`grad-${config.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                <stop offset="40%" stopColor={config.lightHex} />
                <stop offset="100%" stopColor={config.hex} />
              </radialGradient>
              <radialGradient id={`core-${config.id}`} cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </radialGradient>
            </defs>

            {/* 8 Outer Symmetrical Flower Petals */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <g key={i} transform={`rotate(${angle} 50 50)`}>
                <path
                  d="M 50 50 C 42 24, 40 8, 50 2 C 60 8, 58 24, 50 50 Z"
                  fill={`url(#grad-${config.id})`}
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth="1.2"
                />
              </g>
            ))}

            {/* Inner layered blossom ring */}
            {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => (
              <g key={`inner-${i}`} transform={`rotate(${angle} 50 50)`}>
                <path
                  d="M 50 50 C 45 32, 43 20, 50 16 C 57 20, 55 32, 50 50 Z"
                  fill={config.lightHex}
                  opacity="0.9"
                />
              </g>
            ))}

            {/* Center Pollen Core */}
            <circle cx="50" cy="50" r="14" fill={`url(#core-${config.id})`} stroke="#fef08a" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="6" fill="#fef08a" opacity="0.95" />
          </svg>

          {/* Centered Accessibility Icon Badge */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {renderPetalIcon()}
          </div>
        </div>
      )}

      {/* Hint badge if hint is active on this cell */}
      {isHinted && (
        <div className="absolute -top-1.5 -left-1.5 z-30 bg-amber-400 text-purple-950 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
          <Sparkles className="w-2.5 h-2.5" />
          HINT
        </div>
      )}

      {/* Evaluation Status Badge (Correct / Mismatch) in Results Screen */}
      {showStatusBadge && isCorrect !== null && (
        <div
          className={`absolute -top-1.5 -right-1.5 z-30 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md border ${
            isCorrect
              ? 'bg-emerald-500 border-emerald-200'
              : 'bg-rose-500 border-rose-200'
          }`}
        >
          {isCorrect ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      )}
    </button>
  );
};
