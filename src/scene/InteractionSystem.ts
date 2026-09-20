import * as THREE from 'three';
import { FESTIVAL_STATIONS, StationInfo } from '../data/festivalData';
import { MinigameId } from '../game/GameState';

export class InteractionSystem {
  private nearestStation: StationInfo | null = null;
  private onInteractCallback: ((station: StationInfo) => void) | null = null;
  private onStationProximityChange: ((station: StationInfo | null) => void) | null = null;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private isEnabled: boolean = true;

  constructor() {
    this.boundKeyDown = this.onKeyDown.bind(this);
    window.addEventListener('keydown', this.boundKeyDown);
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public update(playerPosition: THREE.Vector3): void {
    if (!this.isEnabled) {
      if (this.nearestStation !== null) {
        this.nearestStation = null;
        if (this.onStationProximityChange) {
          this.onStationProximityChange(null);
        }
      }
      return;
    }

    let closest: StationInfo | null = null;
    let minDistance = Infinity;

    for (const station of FESTIVAL_STATIONS) {
      const stationVec = new THREE.Vector3(...station.position);
      const dist = playerPosition.distanceTo(stationVec);

      if (dist <= station.interactionRadius && dist < minDistance) {
        minDistance = dist;
        closest = station;
      }
    }

    if (this.nearestStation?.id !== closest?.id) {
      this.nearestStation = closest;
      if (this.onStationProximityChange) {
        this.onStationProximityChange(this.nearestStation);
      }
    }
  }

  public getNearestStation(): StationInfo | null {
    return this.nearestStation;
  }

  public onInteract(callback: (station: StationInfo) => void): void {
    this.onInteractCallback = callback;
  }

  public onProximityChange(callback: (station: StationInfo | null) => void): void {
    this.onStationProximityChange = callback;
  }

  public triggerInteract(): void {
    if (!this.isEnabled) return;
    if (this.nearestStation && this.onInteractCallback) {
      this.onInteractCallback(this.nearestStation);
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (!this.isEnabled) return;
    const target = e.target as HTMLElement | null;
    if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) {
      return;
    }
    if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
      this.triggerInteract();
    }
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    this.onInteractCallback = null;
    this.onStationProximityChange = null;
    this.nearestStation = null;
  }
}
