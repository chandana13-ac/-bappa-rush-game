import * as THREE from 'three';
import { SettingsManager } from '../game/SettingsManager';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private target: THREE.Vector3 = new THREE.Vector3(0, 1.2, 0);

  // Spherical coordinates
  private radius: number = 14;
  private theta: number = Math.PI * 0.5; // Horizontal angle (yaw)
  private phi: number = Math.PI * 0.32; // Vertical angle (pitch)

  private isDragging: boolean = false;
  private previousMousePosition = { x: 0, y: 0 };
  private boundOnMouseDown: (e: MouseEvent) => void;
  private boundOnMouseMove: (e: MouseEvent) => void;
  private boundOnMouseUp: () => void;
  private boundOnWheel: (e: WheelEvent) => void;
  private boundOnTouchStart: (e: TouchEvent) => void;
  private boundOnTouchMove: (e: TouchEvent) => void;
  private boundOnTouchEnd: () => void;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchStart = this.onTouchStart.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchEnd = this.onTouchEnd.bind(this);

    this.initEvents();
  }

  private initEvents(): void {
    this.domElement.addEventListener('mousedown', this.boundOnMouseDown);
    window.addEventListener('mousedown', this.boundOnMouseDown);
    window.addEventListener('mousemove', this.boundOnMouseMove);
    window.addEventListener('mouseup', this.boundOnMouseUp);
    this.domElement.addEventListener('wheel', this.boundOnWheel, { passive: false });

    this.domElement.addEventListener('touchstart', this.boundOnTouchStart, { passive: false });
    window.addEventListener('touchmove', this.boundOnTouchMove, { passive: false });
    window.addEventListener('touchend', this.boundOnTouchEnd);
  }

  public update(targetPosition: THREE.Vector3): void {
    this.target.lerp(new THREE.Vector3(targetPosition.x, targetPosition.y + 1.2, targetPosition.z), 0.12);

    // Calculate camera position in spherical coordinates relative to target
    const x = this.target.x + this.radius * Math.sin(this.phi) * Math.sin(this.theta);
    const y = this.target.y + this.radius * Math.cos(this.phi);
    const z = this.target.z + this.radius * Math.sin(this.phi) * Math.cos(this.theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
  }

  public getYaw(): number {
    return this.theta;
  }

  private onMouseDown(e: MouseEvent): void {
    // If target is an interactive UI button, input, or modal, do not capture camera drag
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('#debug-panel') ||
        target.closest('#modal-settings') ||
        target.closest('#modal-high-scores') ||
        target.closest('#modal-dev-test') ||
        target.closest('#modal-tutorial') ||
        target.closest('#menu-pause'))
    ) {
      return;
    }

    // Left click rotates camera
    if (e.button === 0) {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };

    const settings = SettingsManager.getInstance().getSettings();
    const sensitivity = 0.005 * settings.cameraSensitivity;
    const invertSign = settings.invertY ? -1 : 1;

    this.theta -= deltaX * sensitivity;
    this.phi -= deltaY * sensitivity * invertSign;

    // Clamp pitch between 20 deg and 75 deg
    this.phi = Math.max(Math.PI * 0.12, Math.min(Math.PI * 0.44, this.phi));
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.radius += e.deltaY * 0.01;
    this.radius = Math.max(7, Math.min(22, this.radius));
  }

  private onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.previousMousePosition = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
    const deltaY = e.touches[0].clientY - this.previousMousePosition.y;
    this.previousMousePosition = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };

    this.theta -= deltaX * 0.005;
    this.phi -= deltaY * 0.005;
    this.phi = Math.max(Math.PI * 0.12, Math.min(Math.PI * 0.44, this.phi));
  }

  private onTouchEnd(): void {
    this.isDragging = false;
  }

  public dispose(): void {
    this.domElement.removeEventListener('mousedown', this.boundOnMouseDown);
    window.removeEventListener('mousedown', this.boundOnMouseDown);
    window.removeEventListener('mousemove', this.boundOnMouseMove);
    window.removeEventListener('mouseup', this.boundOnMouseUp);
    this.domElement.removeEventListener('wheel', this.boundOnWheel);

    this.domElement.removeEventListener('touchstart', this.boundOnTouchStart);
    window.removeEventListener('touchmove', this.boundOnTouchMove);
    window.removeEventListener('touchend', this.boundOnTouchEnd);
  }
}
