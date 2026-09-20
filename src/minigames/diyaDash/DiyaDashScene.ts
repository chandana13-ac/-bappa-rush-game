import * as THREE from 'three';

export interface ScreenCoord {
  x: number; // percentage (0 to 100)
  y: number; // percentage (0 to 100)
}

interface DiyaVisual {
  group: THREE.Group;
  bowlMesh: THREE.Mesh;
  wickMesh: THREE.Mesh;
  flameMesh: THREE.Mesh;
  flameLight: THREE.PointLight;
  glowRing: THREE.Mesh;
  baseY: number;
  isLit: boolean;
  isActive: boolean;
}

export class DiyaDashScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Visual Diya models
  public diyas: DiyaVisual[] = [];
  private activeDiyaIndex: number = -1;

  // Background & Atmosphere
  private particleSystem: THREE.Points | null = null;
  private celebrationParticles: THREE.Points | null = null;
  private celebrationStartTime: number = 0;
  private isCelebrating: boolean = false;

  // Callbacks
  public onPositionsUpdated?: (positions: ScreenCoord[]) => void;
  public onRenderFrame?: () => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060c1c); // Deep twilight navy
    this.scene.fog = new THREE.FogExp2(0x060c1c, 0.045);

    // 2. Camera: Fixed cinematic view facing the altar
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const aspect = width / height;

    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.updateCameraDistance(aspect);
    this.camera.lookAt(0, 0.15, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = false; // Keep high FPS on mobile
    this.container.appendChild(this.renderer.domElement);

    // 4. Build Environment
    this.buildLighting();
    this.buildTempleArchitecture();
    this.buildDiyas();
    this.buildAtmosphericParticles();
    this.buildCelebrationParticles();

    // 5. Setup Resize Observer
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    // 6. Start Render Loop
    this.render = this.render.bind(this);
    this.animFrameId = requestAnimationFrame(this.render);

    // Initial position broadcast
    setTimeout(() => {
      this.broadcastScreenPositions();
    }, 50);
  }

  // --------------------------------------------------------------------------
  // Camera & Screen Projection
  // --------------------------------------------------------------------------

  private updateCameraDistance(aspect: number): void {
    // Dynamically adjust camera Z to keep all 12 positions fully visible on landscape or portrait
    const targetZ = aspect < 1.0 ? 8.4 : aspect < 1.4 ? 7.6 : 6.8;
    this.camera.position.set(0, 0.25, targetZ);
  }

  public getDiyaWorldPosition(index: number): THREE.Vector3 | null {
    if (!this.diyas || index < 0 || index >= this.diyas.length) return null;
    const worldPos = new THREE.Vector3();
    this.diyas[index].group.getWorldPosition(worldPos);
    worldPos.y += 0.28; // Focus on the flame/bowl center
    return worldPos;
  }

  public getDiyaPixelPosition(index: number): {
    x: number;
    y: number;
    inBounds: boolean;
    worldPos: THREE.Vector3;
  } | null {
    if (!this.diyas || index < 0 || index >= this.diyas.length || !this.renderer) return null;
    const canvas = this.renderer.domElement;
    if (!canvas) return null;

    const worldPos = this.getDiyaWorldPosition(index);
    if (!worldPos) return null;

    const rect = canvas.getBoundingClientRect();
    const projected = worldPos.clone().project(this.camera);

    const isFront = projected.z > -1.0 && projected.z < 1.0;
    const pixelX = rect.left + ((projected.x + 1) / 2) * rect.width;
    const pixelY = rect.top + ((-projected.y + 1) / 2) * rect.height;

    // Safe bounds check: away from top HUD (time/score/pause), away from screen edges
    const inBounds =
      isFront &&
      pixelX >= rect.left + 35 &&
      pixelX <= rect.right - 35 &&
      pixelY >= rect.top + 80 &&
      pixelY <= rect.bottom - 35;

    return {
      x: Math.round(pixelX),
      y: Math.round(pixelY),
      inBounds,
      worldPos,
    };
  }

  public getScreenPositions(): ScreenCoord[] {
    const coords: ScreenCoord[] = [];
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    for (const diya of this.diyas) {
      const worldPos = new THREE.Vector3();
      diya.group.getWorldPosition(worldPos);

      // Offset slightly towards the flame peak
      worldPos.y += 0.28;

      const projected = worldPos.clone().project(this.camera);
      const xPercent = ((projected.x + 1) / 2) * 100;
      const yPercent = ((-projected.y + 1) / 2) * 100;

      coords.push({
        x: Math.max(5, Math.min(95, parseFloat(xPercent.toFixed(2)))),
        y: Math.max(5, Math.min(95, parseFloat(yPercent.toFixed(2)))),
      });
    }

    return coords;
  }

  public broadcastScreenPositions(): void {
    if (this.onPositionsUpdated) {
      this.onPositionsUpdated(this.getScreenPositions());
    }
  }

  private handleResize(): void {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    const aspect = width / height;
    this.camera.aspect = aspect;
    this.updateCameraDistance(aspect);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    this.broadcastScreenPositions();
  }

  // --------------------------------------------------------------------------
  // Scene Construction
  // --------------------------------------------------------------------------

  private buildLighting(): void {
    // Ambient soft blue night light
    const ambientLight = new THREE.AmbientLight(0x28385e, 1.4);
    this.scene.add(ambientLight);

    // Warm top-down temple lamp light
    const overheadLight = new THREE.DirectionalLight(0xffdf9e, 1.6);
    overheadLight.position.set(0, 8, 4);
    this.scene.add(overheadLight);

    // Subtle golden rim light from behind the altar
    const backRimLight = new THREE.DirectionalLight(0xd4af37, 1.1);
    backRimLight.position.set(0, -1, -4);
    this.scene.add(backRimLight);
  }

  private buildTempleArchitecture(): void {
    const templeGroup = new THREE.Group();

    // 1. Back Wall / Tapestry with warm mandap pattern
    const wallGeo = new THREE.PlaneGeometry(16, 11);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0a1428,
      roughness: 0.85,
      metalness: 0.1,
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 0.5, -2.5);
    templeGroup.add(backWall);

    // 2. Stepped Altar Podiums (3 Tiers supporting the 12 Diyas)
    const altarMat = new THREE.MeshStandardMaterial({
      color: 0x162038,
      roughness: 0.6,
      metalness: 0.25,
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.3,
      metalness: 0.85,
      emissive: 0x4a360a,
      emissiveIntensity: 0.25,
    });

    // Top tier
    const topStep = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.45, 1.4), altarMat);
    topStep.position.set(0, 1.0, -0.6);
    const topTrim = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.08, 1.44), goldTrimMat);
    topTrim.position.set(0, 1.25, -0.6);
    templeGroup.add(topStep, topTrim);

    // Middle tier
    const midStep = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.45, 1.5), altarMat);
    midStep.position.set(0, -0.2, 0.0);
    const midTrim = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.08, 1.54), goldTrimMat);
    midTrim.position.set(0, 0.05, 0.0);
    templeGroup.add(midStep, midTrim);

    // Bottom tier
    const botStep = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.45, 1.4), altarMat);
    botStep.position.set(0, -1.4, 0.6);
    const botTrim = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.08, 1.44), goldTrimMat);
    botTrim.position.set(0, -1.15, 0.6);
    templeGroup.add(botStep, botTrim);

    // 3. Golden Temple Pillars (Left and Right)
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0xc8982a,
      roughness: 0.35,
      metalness: 0.75,
    });

    [-4.6, 4.6].forEach((xPos) => {
      // Main column
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 5.6, 16), pillarMat);
      col.position.set(xPos, 0.2, -0.5);
      // Capital & Base
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.9), goldTrimMat);
      cap.position.set(xPos, 2.9, -0.5);
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 1.0), goldTrimMat);
      base.position.set(xPos, -2.5, -0.5);
      templeGroup.add(col, cap, base);
    });

    // 4. Majestic Golden Torana / Arch across top
    const archBar = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.4, 0.7), pillarMat);
    archBar.position.set(0, 3.0, -0.5);
    templeGroup.add(archBar);

    // Central Temple Crest
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.9, 8), goldTrimMat);
    crest.position.set(0, 3.65, -0.45);
    templeGroup.add(crest);

    // 5. Marigold Garland Drapes
    this.buildGarlands(templeGroup);

    this.scene.add(templeGroup);
  }

  private buildGarlands(parent: THREE.Group): void {
    // Strings of spherical saffron and gold marigold blossoms
    const orangeMat = new THREE.MeshStandardMaterial({
      color: 0xff6f00,
      roughness: 0.7,
      metalness: 0.05,
    });
    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xffc400,
      roughness: 0.7,
      metalness: 0.05,
    });

    const sphereGeo = new THREE.SphereGeometry(0.09, 8, 8);

    // Arc of blossoms hanging across the arch
    const flowerCount = 28;
    for (let i = 0; i <= flowerCount; i++) {
      const t = i / flowerCount;
      const x = (t - 0.5) * 8.6;
      // Parabolic drape curve
      const y = 2.7 - Math.sin(t * Math.PI) * 0.9;
      const z = -0.25;

      const flower = new THREE.Mesh(sphereGeo, i % 2 === 0 ? orangeMat : yellowMat);
      flower.position.set(x, y, z);
      parent.add(flower);
    }

    // Side garland drops along pillars
    [-4.3, 4.3].forEach((pillarX) => {
      for (let j = 0; j < 14; j++) {
        const flower = new THREE.Mesh(sphereGeo, j % 2 === 0 ? orangeMat : yellowMat);
        flower.position.set(pillarX, 2.7 - j * 0.35, -0.3);
        parent.add(flower);
      }
    });
  }

  private buildDiyas(): void {
    // 12 Diya positions arranged symmetrically across the 3 podium tiers
    // Row 0: Top Tier (4 diyas)
    // Row 1: Middle Tier (4 diyas)
    // Row 2: Bottom Tier (4 diyas)
    const positions: THREE.Vector3[] = [
      // Top Row (0..3)
      new THREE.Vector3(-3.0, 1.45, -0.5),
      new THREE.Vector3(-1.0, 1.45, -0.5),
      new THREE.Vector3(1.0, 1.45, -0.5),
      new THREE.Vector3(3.0, 1.45, -0.5),

      // Middle Row (4..7)
      new THREE.Vector3(-3.4, 0.25, 0.05),
      new THREE.Vector3(-1.15, 0.25, 0.05),
      new THREE.Vector3(1.15, 0.25, 0.05),
      new THREE.Vector3(3.4, 0.25, 0.05),

      // Bottom Row (8..11)
      new THREE.Vector3(-3.0, -0.95, 0.65),
      new THREE.Vector3(-1.0, -0.95, 0.65),
      new THREE.Vector3(1.0, -0.95, 0.65),
      new THREE.Vector3(3.0, -0.95, 0.65),
    ];

    // Shared Geometries & Materials
    const bowlGeo = new THREE.CylinderGeometry(0.38, 0.24, 0.24, 16);
    const rimGeo = new THREE.TorusGeometry(0.38, 0.045, 8, 20);
    const wickGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.16, 8);
    const flameGeo = new THREE.ConeGeometry(0.16, 0.44, 12);
    const ringGeo = new THREE.RingGeometry(0.46, 0.58, 24);

    const terracottaMat = new THREE.MeshStandardMaterial({
      color: 0x7a3a20, // Warm earthy terracotta
      roughness: 0.75,
      metalness: 0.15,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.35,
      metalness: 0.8,
    });
    const wickMat = new THREE.MeshStandardMaterial({
      color: 0x1f1a17,
      roughness: 0.9,
    });

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffd54f, // Bright warm golden core
      toneMapped: false,
    });

    const glowRingMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
    });

    this.diyas = positions.map((pos) => {
      const group = new THREE.Group();
      group.position.copy(pos);

      // Clay bowl
      const bowl = new THREE.Mesh(bowlGeo, terracottaMat);
      bowl.position.y = 0.12;

      // Brass rim
      const rim = new THREE.Mesh(rimGeo, brassMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.24;

      // Wick
      const wick = new THREE.Mesh(wickGeo, wickMat);
      wick.position.y = 0.28;

      // Glowing Flame (hidden initially)
      const flame = new THREE.Mesh(flameGeo, flameMat.clone());
      flame.position.y = 0.46;
      flame.scale.set(0, 0, 0); // Extinguished initially

      // Flame Dynamic Light
      const flameLight = new THREE.PointLight(0xffa022, 0.0, 3.0);
      flameLight.position.set(0, 0.6, 0.2);

      // Glow Ring at base of diya (highlights active target)
      const glowRing = new THREE.Mesh(ringGeo, glowRingMat.clone());
      glowRing.rotation.x = -Math.PI / 2;
      glowRing.position.y = 0.02;

      group.add(bowl, rim, wick, flame, flameLight, glowRing);
      this.scene.add(group);

      return {
        group,
        bowlMesh: bowl,
        wickMesh: wick,
        flameMesh: flame,
        flameLight,
        glowRing,
        baseY: pos.y,
        isLit: false,
        isActive: false,
      };
    });
  }

  private buildAtmosphericParticles(): void {
    // Subtle floating festive golden sparks in the air
    const count = 75;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffd97d,
      size: 0.08,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);
  }

  private buildCelebrationParticles(): void {
    const count = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = 0;
      positions[i * 3 + 1] = -100; // Offscreen initially
      positions[i * 3 + 2] = 0;

      velocities[i * 3 + 0] = (Math.random() - 0.5) * 4;
      velocities[i * 3 + 1] = Math.random() * 3.5 + 1.5;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.16,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });

    this.celebrationParticles = new THREE.Points(geometry, material);
    this.scene.add(this.celebrationParticles);
  }

  // --------------------------------------------------------------------------
  // Diya State Control
  // --------------------------------------------------------------------------

  public setActiveDiya(index: number): void {
    // Extinguish old active diya if any
    if (this.activeDiyaIndex >= 0 && this.activeDiyaIndex < this.diyas.length && this.activeDiyaIndex !== index) {
      this.clearDiyaState(this.activeDiyaIndex);
    }

    this.activeDiyaIndex = index;
    if (index < 0 || index >= this.diyas.length) return;

    const diya = this.diyas[index];
    diya.isActive = true;
    diya.isLit = false;

    // Show active flame
    diya.flameMesh.scale.set(1.0, 1.2, 1.0);
    diya.flameLight.intensity = 2.2;
    diya.flameLight.color.setHex(0xffaa22);

    // Show glowing ring
    (diya.glowRing.material as THREE.MeshBasicMaterial).opacity = 0.85;
    diya.glowRing.scale.set(1.0, 1.0, 1.0);
  }

  public flashDiyaLit(index: number): void {
    if (index < 0 || index >= this.diyas.length) return;

    const diya = this.diyas[index];
    diya.isLit = true;
    diya.isActive = false;

    // Instant celebration burst on flame
    diya.flameMesh.scale.set(1.8, 2.2, 1.8);
    diya.flameLight.intensity = 4.5;
    diya.flameLight.color.setHex(0xffdf6d);

    // Trigger celebration spark particles around the diya
    this.triggerCelebrationBurst(diya.group.position);
  }

  public clearDiyaState(index: number): void {
    if (index < 0 || index >= this.diyas.length) return;

    const diya = this.diyas[index];
    diya.isActive = false;
    diya.isLit = false;
    diya.flameMesh.scale.set(0, 0, 0);
    diya.flameLight.intensity = 0.0;
    (diya.glowRing.material as THREE.MeshBasicMaterial).opacity = 0.0;
  }

  public resetAllDiyas(): void {
    this.activeDiyaIndex = -1;
    for (let i = 0; i < this.diyas.length; i++) {
      this.clearDiyaState(i);
    }
  }

  private triggerCelebrationBurst(origin: THREE.Vector3): void {
    if (!this.celebrationParticles) return;

    const posAttr = this.celebrationParticles.geometry.attributes.position as THREE.BufferAttribute;
    const velAttr = this.celebrationParticles.geometry.attributes.velocity as THREE.BufferAttribute;

    const count = posAttr.count;
    for (let i = 0; i < count; i++) {
      posAttr.setXYZ(i, origin.x, origin.y + 0.35, origin.z);
      const theta = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.8 + 1.0;
      velAttr.setXYZ(
        i,
        Math.cos(theta) * speed,
        Math.random() * 2.5 + 0.8,
        Math.sin(theta) * speed
      );
    }
    posAttr.needsUpdate = true;
    velAttr.needsUpdate = true;

    (this.celebrationParticles.material as THREE.PointsMaterial).opacity = 0.95;
    this.celebrationStartTime = performance.now();
    this.isCelebrating = true;
  }

  // --------------------------------------------------------------------------
  // Animation & Render Loop
  // --------------------------------------------------------------------------

  private render(): void {
    this.animFrameId = requestAnimationFrame(this.render);

    const time = performance.now() * 0.001;

    // 1. Animate active diya flame pulsation & flicker
    if (this.activeDiyaIndex >= 0 && this.activeDiyaIndex < this.diyas.length) {
      const activeDiya = this.diyas[this.activeDiyaIndex];
      if (activeDiya.isActive) {
        const pulse = 1.0 + Math.sin(time * 10) * 0.12 + (Math.random() - 0.5) * 0.05;
        activeDiya.flameMesh.scale.set(pulse, pulse * 1.25, pulse);
        activeDiya.flameLight.intensity = 2.0 + Math.sin(time * 12) * 0.4;

        // Glow ring pulsing
        const ringPulse = 1.0 + Math.sin(time * 6) * 0.15;
        activeDiya.glowRing.scale.set(ringPulse, ringPulse, 1.0);
      }
    }

    // 2. Animate lit diya flame settling down
    for (const diya of this.diyas) {
      if (diya.isLit && diya.flameMesh.scale.x > 0.05) {
        diya.flameMesh.scale.multiplyScalar(0.92);
        diya.flameLight.intensity *= 0.92;
        if (diya.flameMesh.scale.x <= 0.05) {
          diya.flameMesh.scale.set(0, 0, 0);
          diya.flameLight.intensity = 0;
          diya.isLit = false;
        }
      }
    }

    // 3. Subtle drift for ambient sparkle particles
    if (this.particleSystem) {
      const posAttr = this.particleSystem.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        let y = posAttr.getY(i) + 0.004;
        if (y > 4.0) y = -2.5;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
    }

    // 4. Update celebration burst particles
    if (this.isCelebrating && this.celebrationParticles) {
      const elapsed = (performance.now() - this.celebrationStartTime) * 0.001;
      const mat = this.celebrationParticles.material as THREE.PointsMaterial;

      if (elapsed > 0.6) {
        mat.opacity = 0;
        this.isCelebrating = false;
      } else {
        mat.opacity = Math.max(0, 0.95 * (1 - elapsed / 0.6));
        const posAttr = this.celebrationParticles.geometry.attributes.position as THREE.BufferAttribute;
        const velAttr = this.celebrationParticles.geometry.attributes.velocity as THREE.BufferAttribute;

        for (let i = 0; i < posAttr.count; i++) {
          posAttr.setXYZ(
            i,
            posAttr.getX(i) + velAttr.getX(i) * 0.016,
            posAttr.getY(i) + velAttr.getY(i) * 0.016 - 0.02, // gravity
            posAttr.getZ(i) + velAttr.getZ(i) * 0.016
          );
        }
        posAttr.needsUpdate = true;
      }
    }

    this.renderer.render(this.scene, this.camera);
    if (this.onRenderFrame) {
      this.onRenderFrame();
    }
  }

  // --------------------------------------------------------------------------
  // Teardown & Disposal
  // --------------------------------------------------------------------------

  public dispose(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.onPositionsUpdated = undefined;

    // Traverse and clean all geometries and materials
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh || (obj as THREE.Points).isPoints) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }

    this.diyas = [];
  }
}
