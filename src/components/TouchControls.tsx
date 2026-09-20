import React, { useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface TouchControlsProps {
  onMove: (vector: { x: number; y: number }) => void;
  onInteract: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onMove, onInteract }) => {
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [activeTouchId, setActiveTouchId] = useState<number | null>(null);
  const baseRef = useRef<HTMLDivElement>(null);

  const radius = 40;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTouchId !== null) return;
    const touch = e.changedTouches[0];
    setActiveTouchId(touch.identifier);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        setActiveTouchId(null);
        setKnobPos({ x: 0, y: 0 });
        onMove({ x: 0, y: 0 });
        break;
      }
    }
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > radius) {
      const angle = Math.atan2(dy, dx);
      const kx = Math.cos(angle) * radius;
      const ky = Math.sin(angle) * radius;
      setKnobPos({ x: kx, y: ky });
      onMove({ x: kx / radius, y: ky / radius });
    } else {
      setKnobPos({ x: dx, y: dy });
      onMove({ x: dx / radius, y: dy / radius });
    }
  };

  return (
    <div
      id="touch-controls-layer"
      className="absolute inset-0 pointer-events-none z-20 flex justify-between items-end p-4 sm:p-8 select-none"
    >
      {/* Left: Joystick */}
      <div
        ref={baseRef}
        id="virtual-joystick-base"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="pointer-events-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-indigo-950/60 border-2 border-amber-400/40 backdrop-blur-sm relative flex items-center justify-center shadow-lg shadow-black/40"
      >
        <div
          id="virtual-joystick-knob"
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 border border-yellow-200 shadow-md transform transition-transform duration-75"
          style={{ transform: `translate(${knobPos.x}px, ${knobPos.y}px)` }}
        />
      </div>

      {/* Right: Interact Action Button */}
      <div className="pointer-events-auto">
        <button
          id="btn-virtual-interact"
          onClick={onInteract}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 border-2 border-yellow-300 flex flex-col items-center justify-center text-white shadow-xl shadow-orange-500/40 active:scale-95 transition-transform cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-yellow-200" />
          <span className="text-[10px] sm:text-xs font-black uppercase">Interact</span>
        </button>
      </div>
    </div>
  );
};
