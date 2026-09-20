import React, { useEffect, useRef } from 'react';
import { FestivalHub } from '../scene/FestivalHub';
import { StationInfo } from '../data/festivalData';

interface FestivalCanvasProps {
  onProximityChange: (station: StationInfo | null) => void;
  onInteract: (station: StationInfo) => void;
  onHubReady?: (hub: FestivalHub) => void;
}

export const FestivalCanvas: React.FC<FestivalCanvasProps> = ({
  onProximityChange,
  onInteract,
  onHubReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<FestivalHub | null>(null);

  const onProximityChangeRef = useRef(onProximityChange);
  onProximityChangeRef.current = onProximityChange;

  const onInteractRef = useRef(onInteract);
  onInteractRef.current = onInteract;

  const onHubReadyRef = useRef(onHubReady);
  onHubReadyRef.current = onHubReady;

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize 3D Festival Hub once
    const hub = new FestivalHub(containerRef.current);
    hubRef.current = hub;

    hub.interactionSystem.onProximityChange((station) => {
      hub.setHighlightStation(station ? station.id : null);
      if (onProximityChangeRef.current) {
        onProximityChangeRef.current(station);
      }
    });

    hub.interactionSystem.onInteract((station) => {
      if (onInteractRef.current) {
        onInteractRef.current(station);
      }
    });

    if (onHubReadyRef.current) {
      onHubReadyRef.current(hub);
    }

    return () => {
      hub.dispose();
      hubRef.current = null;
    };
  }, []); // Run strictly once on mount

  return (
    <div
      id="festival-canvas-container"
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none bg-[#0c0926] pointer-events-auto"
    />
  );
};
