import React from 'react';
import { DholDirection, DIRECTION_CONFIGS } from './types';

interface DholDrumVisualProps {
  activeDirection: DholDirection | null;
  isVibrating: boolean;
  size?: number;
}

export const DholDrumVisual: React.FC<DholDrumVisualProps> = ({
  activeDirection,
  isVibrating,
  size = 200,
}) => {
  const activeConfig = activeDirection ? DIRECTION_CONFIGS[activeDirection] : null;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size * 0.72 }}
    >
      {/* Resonant Soundwave Ripple Ring when hit */}
      {isVibrating && activeConfig && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none animate-ping opacity-60"
          style={{
            borderColor: activeConfig.primaryColor,
            borderWidth: '4px',
            boxShadow: `0 0 35px ${activeConfig.glowColor}`,
          }}
        />
      )}

      {/* SVG Dhol Drum */}
      <svg
        viewBox="0 0 280 190"
        className={`w-full h-full filter drop-shadow-2xl transition-transform duration-75 ${
          isVibrating ? 'scale-105' : 'scale-100'
        }`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Wood barrel body gradient */}
          <linearGradient id="drumBarrelWood" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="25%" stopColor="#b45309" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="75%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>

          {/* Festive Red Saffron Decorative Band */}
          <linearGradient id="drumBandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#991b1b" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>

          {/* Left Drum Head (Bass Leather Membrane) */}
          <radialGradient id="bassMembrane" cx="45%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="70%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>

          {/* Right Drum Head (Treble Tasha Leather) */}
          <radialGradient id="trebleMembrane" cx="55%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="75%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>

          {/* Brass Rings */}
          <linearGradient id="brassRing" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ca8a04" />
            <stop offset="50%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>

          {/* Shadow */}
          <radialGradient id="drumFloorShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.6)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>

        {/* Floor Shadow */}
        <ellipse cx="140" cy="172" rx="105" ry="14" fill="url(#drumFloorShadow)" />

        {/* Main Barrel Hull */}
        <path
          d="M 50 45
             Q 140 30 230 45
             L 230 135
             Q 140 150 50 135 Z"
          fill="url(#drumBarrelWood)"
          stroke="#451a03"
          strokeWidth="2.5"
        />

        {/* Festive Red Saffron Center Bands */}
        <path
          d="M 105 34
             Q 140 30 175 34
             L 175 146
             Q 140 150 105 146 Z"
          fill="url(#drumBandGrad)"
          stroke="#7f1d1d"
          strokeWidth="1.5"
        />

        {/* Central Golden Sun Motif / Emblem */}
        <circle cx="140" cy="90" r="16" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
        <circle cx="140" cy="90" r="9" fill="#dc2626" />
        <circle cx="140" cy="90" r="4" fill="#fef08a" />

        {/* Woven Zig-Zag Ropes (Traditional Dhol Tension Cords) */}
        <polyline
          points="
            50,45 80,140 110,34 140,147 170,34 200,140 230,45
          "
          fill="none"
          stroke="#fef08a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        <polyline
          points="
            50,135 80,40 110,146 140,33 170,146 200,40 230,135
          "
          fill="none"
          stroke="#fef08a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />

        {/* Brass Tuning Rings along ropes */}
        <circle cx="95" cy="88" r="4.5" fill="url(#brassRing)" stroke="#713f12" strokeWidth="1" />
        <circle cx="125" cy="88" r="4.5" fill="url(#brassRing)" stroke="#713f12" strokeWidth="1" />
        <circle cx="155" cy="88" r="4.5" fill="url(#brassRing)" stroke="#713f12" strokeWidth="1" />
        <circle cx="185" cy="88" r="4.5" fill="url(#brassRing)" stroke="#713f12" strokeWidth="1" />

        {/* LEFT DRUM HEAD (Bass / Dhaga Side) */}
        <g>
          {/* Rim Collar */}
          <ellipse
            cx="50"
            cy="90"
            rx="16"
            ry="45"
            fill="#451a03"
            stroke="#1c1917"
            strokeWidth="2"
          />
          {/* Membrane */}
          <ellipse
            cx="48"
            cy="90"
            rx="14"
            ry="42"
            fill="url(#bassMembrane)"
            stroke={activeDirection === 'LEFT' ? '#fb7185' : '#334155'}
            strokeWidth={activeDirection === 'LEFT' ? 3.5 : 1.5}
          />
          {/* Syahi (Black tuning paste on bass head) */}
          <ellipse cx="48" cy="90" rx="7" ry="22" fill="#09090b" opacity="0.9" />

          {/* Dunki (Curved Wooden Bass Stick on Left) */}
          <path
            d={
              activeDirection === 'LEFT'
                ? 'M 24 75 Q 40 85 46 90'
                : 'M 14 65 Q 26 80 34 88'
            }
            stroke="#f59e0b"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-75"
          />
          <circle
            cx={activeDirection === 'LEFT' ? 46 : 34}
            cy={activeDirection === 'LEFT' ? 90 : 88}
            r="4.5"
            fill="#ea580c"
          />
        </g>

        {/* RIGHT DRUM HEAD (Treble / Tasha Side) */}
        <g>
          {/* Rim Collar */}
          <ellipse
            cx="230"
            cy="90"
            rx="16"
            ry="45"
            fill="#451a03"
            stroke="#1c1917"
            strokeWidth="2"
          />
          {/* Membrane */}
          <ellipse
            cx="232"
            cy="90"
            rx="14"
            ry="42"
            fill="url(#trebleMembrane)"
            stroke={activeDirection === 'RIGHT' ? '#67e8f9' : '#b45309'}
            strokeWidth={activeDirection === 'RIGHT' ? 3.5 : 1.5}
          />

          {/* Kaddi (Slender Thin Bamboo Stick on Right) */}
          <line
            x1={activeDirection === 'RIGHT' ? 240 : 252}
            y1={activeDirection === 'RIGHT' ? 88 : 78}
            x2={activeDirection === 'RIGHT' ? 268 : 280}
            y2={activeDirection === 'RIGHT' ? 104 : 94}
            stroke="#fef08a"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="transition-all duration-75"
          />
        </g>

        {/* Colorful Festive Tassels (Red & Gold) */}
        <g opacity="0.85">
          <circle cx="80" cy="140" r="3" fill="#ef4444" />
          <path d="M 80 140 L 78 154 L 82 154 Z" fill="#ef4444" />
          <circle cx="140" cy="147" r="3" fill="#eab308" />
          <path d="M 140 147 L 138 162 L 142 162 Z" fill="#eab308" />
          <circle cx="200" cy="140" r="3" fill="#ef4444" />
          <path d="M 200 140 L 198 154 L 202 154 Z" fill="#ef4444" />
        </g>
      </svg>
    </div>
  );
};
