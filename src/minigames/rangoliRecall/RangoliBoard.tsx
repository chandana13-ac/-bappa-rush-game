import React, { useState } from 'react';
import { PetalColor } from './types';
import { RangoliPetal } from './RangoliPetal';

interface RangoliBoardProps {
  gridSize: 3 | 4 | 5;
  cells: (PetalColor | null)[];
  onCellClick?: (index: number) => void;
  disabled?: boolean;
  hintIndices?: number[];
  comparison?: { index: number; isCorrect: boolean }[];
  showStatusBadges?: boolean;
  className?: string;
}

export const RangoliBoard: React.FC<RangoliBoardProps> = ({
  gridSize,
  cells,
  onCellClick,
  disabled = false,
  hintIndices = [],
  comparison,
  showStatusBadges = false,
  className = '',
}) => {
  const [pulseIndex, setPulseIndex] = useState<number | null>(null);

  // Dynamic sizing based on grid dimension
  // 3x3: 72px - 84px
  // 4x4: 58px - 68px
  // 5x5: 46px - 54px
  const getCellSize = () => {
    if (gridSize === 3) return 'w-16 h-16 sm:w-20 sm:h-20';
    if (gridSize === 4) return 'w-12 h-12 sm:w-16 sm:h-16';
    return 'w-10 h-10 sm:w-13 sm:h-13';
  };

  const getGridColsClass = () => {
    if (gridSize === 3) return 'grid-cols-3';
    if (gridSize === 4) return 'grid-cols-4';
    return 'grid-cols-5';
  };

  const handleCellClick = (idx: number) => {
    if (disabled || !onCellClick) return;

    // Trigger brief pulse animation on the cell
    setPulseIndex(idx);
    setTimeout(() => setPulseIndex(null), 250);

    onCellClick(idx);
  };

  return (
    <div
      id="rangoli-board-container"
      className={`relative flex items-center justify-center p-3 sm:p-5 rounded-3xl bg-gradient-to-b from-[#24133b]/90 via-[#180b29]/95 to-[#0e0419]/95 border-2 border-amber-400/40 shadow-2xl backdrop-blur-md transition-all select-none ${className}`}
    >
      {/* Decorative Outer Mandala Ring */}
      <div className="absolute inset-2 rounded-2xl border border-amber-500/20 pointer-events-none" />
      <div className="absolute inset-3 rounded-2xl border border-dashed border-purple-400/15 pointer-events-none" />

      {/* Grid of Cells */}
      <div
        id="rangoli-grid"
        className={`grid ${getGridColsClass()} gap-2 sm:gap-3 p-2 relative z-10`}
      >
        {cells.map((color, idx) => {
          const isHinted = hintIndices.includes(idx);
          const comp = comparison?.find((c) => c.index === idx);
          const isCorrect = comp ? comp.isCorrect : null;
          const isPulsing = pulseIndex === idx;

          return (
            <div
              key={idx}
              className={`transition-transform duration-150 ${
                isPulsing ? 'scale-110' : ''
              }`}
            >
              <RangoliPetal
                index={idx}
                color={color}
                isHinted={isHinted}
                isCorrect={isCorrect}
                showStatusBadge={showStatusBadges}
                disabled={disabled}
                onClick={() => handleCellClick(idx)}
                className={getCellSize()}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
