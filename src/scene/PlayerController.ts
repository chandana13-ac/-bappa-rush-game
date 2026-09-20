import * as THREE from 'three';

export class PlayerController {
  public mesh: THREE.Group;
  private walkSpeed: number = 7.0;
  private runSpeed: number = 12.0;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private movementEnabled: boolean = true;

  private keys: Record<string, boolean> = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false,
    Shift: false,
  };

  // Virtual joystick vector for touch/mobile
  public virtualInput: { x: number; y: number } = { x: 0, y: 0 };

  // Character body parts for walk cycle animation
  private bodyMesh: THREE.Mesh;
  private headMesh: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private turbanOrScarf: THREE.Mesh;
  private walkTime: number = 0;

  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundBlur: () => void;

  // Boundary box for festival courtyard
  private arenaBounds = {
    minX: -18,
    maxX: 18,
    minZ: -18,
    maxZ: 18,
  };

  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.position.set(0, 0, 0);

    // Build procedural low-poly character
    const saffronMaterial = new THREE.MeshStandardMaterial({
      color: 0xf97316, // Vibrant saffron/orange
      roughness: 0.6,
      metalness: 0.1,
    });
    const creamMaterial = new THREE.MeshStandardMaterial({
      color: 0xfef08a, // Soft warm cream dhoti/pants
      roughness: 0.7,
    });
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Warm golden-brown tone
      roughness: 0.5,
    });
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.6,
      roughness: 0.3,
    });
    const pinkCloth = new THREE.MeshStandardMaterial({
      color: 0xec4899, // Festive gulabi scarf/sash
      roughness: 0.6,
    });

    // 1. Torso / Kurta
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.85, 8);
    this.bodyMesh = new THREE.Mesh(bodyGeo, saffronMaterial);
    this.bodyMesh.position.y = 1.0;
    this.bodyMesh.castShadow = true;
    this.mesh.add(this.bodyMesh);

    // Festive scarf across torso
    const sashGeo = new THREE.TorusGeometry(0.42, 0.08, 6, 12, Math.PI);
    const sash = new THREE.Mesh(sashGeo, pinkCloth);
    sash.rotation.x = Math.PI * 0.45;
    sash.rotation.z = Math.PI * 0.2;
    sash.position.y = 1.1;
    this.mesh.add(sash);

    // 2. Head
    const headGeo = new THREE.SphereGeometry(0.32, 10, 10);
    this.headMesh = new THREE.Mesh(headGeo, skinMaterial);
    this.headMesh.position.y = 1.7;
    this.mesh.add(this.headMesh);

    // Festive headband / crown
    const turbanGeo = new THREE.TorusGeometry(0.34, 0.1, 8, 12);
    this.turbanOrScarf = new THREE.Mesh(turbanGeo, goldMaterial);
    this.turbanOrScarf.position.y = 1.82;
    this.turbanOrScarf.rotation.x = Math.PI * 0.5;
    this.mesh.add(this.turbanOrScarf);

    // 3. Legs
    const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.7, 6);
    this.leftLeg = new THREE.Mesh(legGeo, creamMaterial);
    this.leftLeg.position.set(-0.2, 0.35, 0);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, creamMaterial);
    this.rightLeg.position.set(0.2, 0.35, 0);
    this.mesh.add(this.rightLeg);

    // 4. Arms
    const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.65, 6);
    this.leftArm = new THREE.Mesh(armGeo, saffronMaterial);
    this.leftArm.position.set(-0.48, 1.0, 0);
    this.mesh.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, saffronMaterial);
    this.rightArm.position.set(0.48, 1.0, 0);
    this.mesh.add(this.rightArm);

    // Small festive shadow decal on ground
    const shadowGeo = new THREE.CircleGeometry(0.5, 12);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0a0515,
      transparent: true,
      opacity: 0.45,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.02;
    this.mesh.add(shadowMesh);

    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    this.boundBlur = this.resetKeys.bind(this);

    this.initKeyboard();
  }

  private initKeyboard(): void {
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('blur', this.boundBlur);
  }

  public setMovementEnabled(enabled: boolean): void {
    this.movementEnabled = enabled;
    if (!enabled) {
      this.resetKeys();
      this.velocity.set(0, 0, 0);
    }
  }

  public isMovementEnabled(): boolean {
    return this.movementEnabled;
  }

  public isGrounded(): boolean {
    // Character is strictly kept on ground plane at y = 0
    return Math.abs(this.mesh.position.y) < 0.01;
  }

  public resetKeys(): void {
    for (const k in this.keys) {
      this.keys[k] = false;
    }
    this.virtualInput = { x: 0, y: 0 };
  }

  public getActiveKeys(): string[] {
    const active: string[] = [];
    if (this.keys.KeyW || this.keys.ArrowUp) active.push('W / ↑');
    if (this.keys.KeyA || this.keys.ArrowLeft) active.push('A / ←');
    if (this.keys.KeyS || this.keys.ArrowDown) active.push('S / ↓');
    if (this.keys.KeyD || this.keys.ArrowRight) active.push('D / →');
    if (this.keys.Shift) active.push('Shift');
    if (Math.abs(this.virtualInput.x) > 0.1 || Math.abs(this.virtualInput.y) > 0.1) active.push('Joystick');
    return active;
  }

  private onKeyDown(e: KeyboardEvent): void {
    // Avoid capturing inputs if user is typing in a form or dialog
    const target = e.target as HTMLElement | null;
    if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) {
      return;
    }

    if (!this.movementEnabled) {
      return;
    }

    const code = e.code;
    const key = e.key.toLowerCase();

    if (code === 'KeyW' || key === 'w' || key === 'arrowup') this.keys.KeyW = true;
    if (code === 'KeyA' || key === 'a' || key === 'arrowleft') this.keys.KeyA = true;
    if (code === 'KeyS' || key === 's' || key === 'arrowdown') this.keys.KeyS = true;
    if (code === 'KeyD' || key === 'd' || key === 'arrowright') this.keys.KeyD = true;
    if (code === 'ArrowUp') this.keys.ArrowUp = true;
    if (code === 'ArrowLeft') this.keys.ArrowLeft = true;
    if (code === 'ArrowDown') this.keys.ArrowDown = true;
    if (code === 'ArrowRight') this.keys.ArrowRight = true;
    if (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift') this.keys.Shift = true;
  }

  private onKeyUp(e: KeyboardEvent): void {
    const code = e.code;
    const key = e.key.toLowerCase();

    if (code === 'KeyW' || key === 'w' || key === 'arrowup') this.keys.KeyW = false;
    if (code === 'KeyA' || key === 'a' || key === 'arrowleft') this.keys.KeyA = false;
    if (code === 'KeyS' || key === 's' || key === 'arrowdown') this.keys.KeyS = false;
    if (code === 'KeyD' || key === 'd' || key === 'arrowright') this.keys.KeyD = false;
    if (code === 'ArrowUp') this.keys.ArrowUp = false;
    if (code === 'ArrowLeft') this.keys.ArrowLeft = false;
    if (code === 'ArrowDown') this.keys.ArrowDown = false;
    if (code === 'ArrowRight') this.keys.ArrowRight = false;
    if (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift') this.keys.Shift = false;
  }

  public update(delta: number, cameraYaw: number): void {
    if (!this.movementEnabled) {
      this.velocity.set(0, 0, 0);
      // Reset limbs to neutral
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, 0.2);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, 0.2);
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, 0.2);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, 0.2);
      return;
    }

    let forwardInput = 0;
    let rightInput = 0;

    // W / Up Arrow = forward
    if (this.keys.KeyW || this.keys.ArrowUp) forwardInput += 1;
    // S / Down Arrow = backward
    if (this.keys.KeyS || this.keys.ArrowDown) forwardInput -= 1;
    // D / Right Arrow = right
    if (this.keys.KeyD || this.keys.ArrowRight) rightInput += 1;
    // A / Left Arrow = left
    if (this.keys.KeyA || this.keys.ArrowLeft) rightInput -= 1;

    // Incorporate touch joystick: y < 0 is upward/forward, x > 0 is right
    if (Math.abs(this.virtualInput.x) > 0.05 || Math.abs(this.virtualInput.y) > 0.05) {
      rightInput += this.virtualInput.x;
      forwardInput -= this.virtualInput.y;
    }

    const inputMag = Math.sqrt(forwardInput * forwardInput + rightInput * rightInput);
    const isMoving = inputMag > 0.05;

    if (isMoving) {
      const normForward = forwardInput / Math.max(1, inputMag);
      const normRight = rightInput / Math.max(1, inputMag);

      // Camera horizontal forward vector:
      // When camera is at spherical angle cameraYaw looking toward target:
      // forward from camera to player in XZ is (-sin(cameraYaw), -cos(cameraYaw))
      const forwardX = -Math.sin(cameraYaw);
      const forwardZ = -Math.cos(cameraYaw);

      // Perpendicular right vector rotated 90 deg clockwise in XZ:
      // (cos(cameraYaw), -sin(cameraYaw))
      const rightX = Math.cos(cameraYaw);
      const rightZ = -Math.sin(cameraYaw);

      // Camera-relative movement direction
      const moveDirX = forwardX * normForward + rightX * normRight;
      const moveDirZ = forwardZ * normForward + rightZ * normRight;

      // Speed: Shift runs, otherwise standard walk
      const isRunning = this.keys.Shift;
      const speed = isRunning ? this.runSpeed : this.walkSpeed;

      this.velocity.x = moveDirX * speed;
      this.velocity.z = moveDirZ * speed;

      // Rotate character to face movement direction smoothly
      const targetAngle = Math.atan2(moveDirX, moveDirZ);
      this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetAngle, 0.25);

      // Walk / run cycle animation
      const animSpeed = isRunning ? 18 : 11;
      this.walkTime += delta * animSpeed;
      const legSwing = Math.sin(this.walkTime) * 0.48;
      const armSwing = Math.sin(this.walkTime) * 0.38;

      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;
      this.leftArm.rotation.x = -armSwing;
      this.rightArm.rotation.x = armSwing;
      this.bodyMesh.position.y = 1.0 + Math.abs(Math.sin(this.walkTime * 2)) * 0.06;
      this.headMesh.position.y = 1.7 + Math.abs(Math.sin(this.walkTime * 2)) * 0.06;
    } else {
      this.velocity.set(0, 0, 0);

      // Idle breathing animation
      this.walkTime += delta * 2;
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, 0.2);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, 0.2);
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, 0.2);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, 0.2);
      this.bodyMesh.position.y = 1.0 + Math.sin(this.walkTime) * 0.02;
      this.headMesh.position.y = 1.7 + Math.sin(this.walkTime) * 0.02;
    }

    // Apply movement with arena boundaries
    this.mesh.position.x += this.velocity.x * delta;
    this.mesh.position.z += this.velocity.z * delta;

    // Ground plane integrity: never fall through floor
    this.mesh.position.y = 0;

    // Arena boundary enforcement
    this.mesh.position.x = Math.max(this.arenaBounds.minX, Math.min(this.arenaBounds.maxX, this.mesh.position.x));
    this.mesh.position.z = Math.max(this.arenaBounds.minZ, Math.min(this.arenaBounds.maxZ, this.mesh.position.z));
  }

  public getPosition(): THREE.Vector3 {
    return this.mesh.position;
  }

  public setPosition(x: number, y: number, z: number): void {
    this.mesh.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('blur', this.boundBlur);
  }
}
