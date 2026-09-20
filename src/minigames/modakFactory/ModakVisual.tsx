import React from 'react';
import { FillingId, ToppingId, FILLING_OPTIONS, TOPPING_OPTIONS } from './types';

interface ModakVisualProps {
  filling: FillingId | null;
  topping: ToppingId | null;
  steamQuality: 'none' | 'perfect' | 'good' | 'oversteamed' | 'understeamed';
  size?: number;
  isSteamingNow?: boolean;
  className?: string;
}

export const ModakVisual: React.FC<ModakVisualProps> = ({
  filling,
  topping,
  steamQuality,
  size = 110,
  isSteamingNow = false,
  className = '',
}) => {
  const fillingConfig = filling ? FILLING_OPTIONS.find((f) => f.id === filling) : null;
  const toppingConfig = topping ? TOPPING_OPTIONS.find((t) => t.id === topping) : null;

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Dynamic Steam Clouds */}
      {(isSteamingNow || steamQuality === 'perfect' || steamQuality === 'good') && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none flex gap-1.5 z-20">
          <div
            className="w-4 h-8 bg-white/40 rounded-full filter blur-sm animate-pulse"
            style={{
              animation: 'bounce 1.2s infinite ease-in-out',
            }}
          />
          <div
            className="w-5 h-10 bg-amber-100/40 rounded-full filter blur-sm animate-pulse"
            style={{
              animation: 'bounce 1s infinite ease-in-out 0.2s',
            }}
          />
          <div
            className="w-3 h-7 bg-white/40 rounded-full filter blur-sm animate-pulse"
            style={{
              animation: 'bounce 1.4s infinite ease-in-out 0.4s',
            }}
          />
        </div>
      )}

      {/* SVG Modak Graphic */}
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full filter drop-shadow-xl"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Rice Dough Gradient (Soft, pearlescent ivory steamed dumpling) */}
          <radialGradient id="riceDoughGrad" cx="45%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#fef3c7" />
            <stop offset="85%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.4" />
          </radialGradient>

          {/* Steamed Gloss overlay */}
          <linearGradient id="steamedGloss" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="0.4" />
          </linearGradient>

          {/* Plate Shadow */}
          <radialGradient id="plateShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.5)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>

        {/* Soft shadow base */}
        <ellipse cx="60" cy="110" rx="42" ry="9" fill="url(#plateShadow)" />

        {/* Outer Rice Dough Base Shape (Tapered onion-dome with pinched top spire) */}
        <path
          d="M 60 14
             C 62 14, 76 36, 88 56
             C 100 76, 102 96, 84 105
             C 68 112, 52 112, 36 105
             C 18 96, 20 76, 32 56
             C 44 36, 58 14, 60 14 Z"
          fill="url(#riceDoughGrad)"
          stroke="#f59e0b"
          strokeWidth="1.5"
        />

        {/* Inner Filling Core Visual Glow if filling selected */}
        {fillingConfig && (
          <ellipse
            cx="60"
            cy="78"
            rx="24"
            ry="18"
            fill={fillingConfig.color}
            opacity="0.85"
            className="animate-pulse"
          />
        )}

        {/* Distinctive Modak Pleats (Hand-pinched traditional folds) */}
        {/* Center fold */}
        <path
          d="M 60 14 Q 60 60 60 108"
          stroke="#d97706"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
          fill="none"
        />
        {/* Left 1 */}
        <path
          d="M 59 16 Q 46 60 40 104"
          stroke="#d97706"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.5"
          fill="none"
        />
        {/* Left 2 */}
        <path
          d="M 58 20 Q 34 64 26 94"
          stroke="#d97706"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.4"
          fill="none"
        />
        {/* Right 1 */}
        <path
          d="M 61 16 Q 74 60 80 104"
          stroke="#d97706"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.5"
          fill="none"
        />
        {/* Right 2 */}
        <path
          d="M 62 20 Q 86 64 94 94"
          stroke="#d97706"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.4"
          fill="none"
        />

        {/* Pinched top point / crown spire */}
        <path
          d="M 60 12 L 62 18 L 58 18 Z"
          fill="#d97706"
          stroke="#b45309"
          strokeWidth="1"
        />
        <circle cx="60" cy="12" r="2.5" fill="#f59e0b" />

        {/* Toppings visual decoration */}
        {toppingConfig?.id === 'kesar_saffron' && (
          <g>
            {/* Saffron threads garnishing top and body */}
            <path d="M 56 34 Q 59 40 54 48" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M 63 36 Q 66 43 68 50" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M 58 56 Q 62 64 57 72" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M 48 64 Q 52 70 50 78" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M 70 66 Q 73 72 71 80" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        )}

        {toppingConfig?.id === 'green_pista' && (
          <g>
            {/* Emerald pistachio crushed flecks */}
            <rect x="52" y="40" width="4" height="6" rx="1.5" transform="rotate(25 54 43)" fill="#16a34a" />
            <rect x="64" y="44" width="5" height="4" rx="1.5" transform="rotate(-30 66 46)" fill="#22c55e" />
            <rect x="58" y="60" width="5" height="7" rx="1.5" transform="rotate(15 60 63)" fill="#15803d" />
            <rect x="44" y="68" width="4" height="5" rx="1.5" transform="rotate(-20 46 70)" fill="#22c55e" />
            <rect x="72" y="64" width="5" height="5" rx="1.5" transform="rotate(40 74 66)" fill="#16a34a" />
          </g>
        )}

        {toppingConfig?.id === 'silver_vark' && (
          <g>
            {/* Shimmering silver leaf patches */}
            <polygon points="56,38 66,42 62,52 52,48" fill="#f8fafc" opacity="0.9" stroke="#cbd5e1" strokeWidth="0.5" />
            <polygon points="46,62 58,66 54,78 42,72" fill="#ffffff" opacity="0.9" stroke="#cbd5e1" strokeWidth="0.5" />
            <polygon points="66,60 76,64 74,74 62,70" fill="#e2e8f0" opacity="0.95" stroke="#cbd5e1" strokeWidth="0.5" />
          </g>
        )}

        {/* Steamed glossy finish when done */}
        {(steamQuality === 'perfect' || steamQuality === 'good') && (
          <path
            d="M 45 40 Q 60 30 75 42 Q 80 65 72 85"
            stroke="url(#steamedGloss)"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.8"
            fill="none"
          />
        )}
      </svg>
    </div>
  );
};
