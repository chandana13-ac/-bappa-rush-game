import * as THREE from 'three';

export class RangoliRecallScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private isDisposed: boolean = false;
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Scene elements
  private diyas: Array<{ flameMesh: THREE.Mesh; light: THREE.PointLight; baseIntensity: number }> = [];
  private petalParticles: THREE.Points | null = null;
  private petalGeo: THREE.BufferGeometry | null = null;
  private burstParticles: THREE.Points | null = null;
  private burstGeo: THREE.BufferGeometry | null = null;
  private burstVelocities: Float32Array | null = null;
  private burstLifespan: number = 0;

  private clock: THREE.Clock;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0c0714'); // Warm deep night festival sky
    this.scene.fog = new THREE.FogExp2('#0c0714', 0.05);

    // 2. Camera setup - Fixed cinematic angle pointing at the central rangoli platform
    const aspect = (this.container.clientWidth || 800) / (this.container.clientHeight || 600);
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
    this.camera.position.set(0, 4.2, 5.8);
    this.camera.lookAt(0, 0.4, 0);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth || 800, this.container.clientHeight || 600);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. Build 3D environment
    this.setupLighting();
    this.buildCircularPlatform();
    this.buildCentralAltarTable();
    this.buildFlowerBaskets();
    this.buildDiyasAroundEdges();
    this.buildMarigoldGarlands();
    this.buildSubtlePetalParticles();

    // 5. Resize observer
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    // 6. Start render loop
    this.animate();
  }

  // --------------------------------------------------------------------------
  // Lighting
  // --------------------------------------------------------------------------
  private setupLighting(): void {
    // Warm festive ambient light
    const ambientLight = new THREE.AmbientLight('#3b1a40', 1.8);
    this.scene.add(ambientLight);

    // Key directional light (golden temple glow)
    const keyLight = new THREE.DirectionalLight('#fed7aa', 1.4);
    keyLight.position.set(3, 8, 4);
    this.scene.add(keyLight);

    // Soft cool fill light from top-back
    const fillLight = new THREE.DirectionalLight('#818cf8', 0.5);
    fillLight.position.set(-4, 6, -3);
    this.scene.add(fillLight);

    // Center warm glow over the rangoli altar
    const centerPointLight = new THREE.PointLight('#f59e0b', 2.0, 8);
    centerPointLight.position.set(0, 2.0, 0.3);
    this.scene.add(centerPointLight);
  }

  // --------------------------------------------------------------------------
  // Platform & Altar
  // --------------------------------------------------------------------------
  private buildCircularPlatform(): void {
    // Base circular courtyard platform
    const platformGeo = new THREE.CylinderGeometry(4.2, 4.4, 0.4, 32);
    const platformMat = new THREE.MeshStandardMaterial({
      color: '#1f132b',
      roughness: 0.8,
      metalness: 0.1,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -0.2;
    this.scene.add(platform);

    // Outer decorative stone ring
    const ringGeo = new THREE.TorusGeometry(3.9, 0.08, 12, 48);
    const ringMat = new THREE.MeshStandardMaterial({
      color: '#d97706',
      roughness: 0.4,
      metalness: 0.7,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    this.scene.add(ring);

    // Subtle inner mandala ring
    const innerRingGeo = new THREE.TorusGeometry(2.6, 0.05, 8, 40);
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      roughness: 0.3,
      metalness: 0.8,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = Math.PI / 2;
    innerRing.position.y = 0.015;
    this.scene.add(innerRing);
  }

  private buildCentralAltarTable(): void {
    // Central low-poly rangoli altar pedestal
    const altarBaseGeo = new THREE.CylinderGeometry(1.7, 1.9, 0.5, 24);
    const altarBaseMat = new THREE.MeshStandardMaterial({
      color: '#2d1838',
      roughness: 0.6,
      metalness: 0.2,
    });
    const altarBase = new THREE.Mesh(altarBaseGeo, altarBaseMat);
    altarBase.position.y = 0.25;
    this.scene.add(altarBase);

    // Altar Tabletop with brass/copper trim
    const topGeo = new THREE.CylinderGeometry(1.65, 1.65, 0.08, 32);
    const topMat = new THREE.MeshStandardMaterial({
      color: '#1a0c24',
      roughness: 0.4,
      metalness: 0.3,
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.52;
    this.scene.add(top);

    // Brass Rim
    const rimGeo = new THREE.TorusGeometry(1.66, 0.04, 12, 40);
    const rimMat = new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      roughness: 0.3,
      metalness: 0.85,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.54;
    this.scene.add(rim);
  }

  // --------------------------------------------------------------------------
  // Decorative Flower Baskets
  // --------------------------------------------------------------------------
  private buildFlowerBaskets(): void {
    const basketPositions = [
      { x: -2.3, z: 0.8, color: '#f97316' }, // Marigold orange
      { x: 2.3, z: 0.8, color: '#eab308' },  // Marigold yellow
      { x: -2.1, z: -1.4, color: '#ec4899' }, // Rose pink
      { x: 2.1, z: -1.4, color: '#a855f7' },  // Orchid purple
    ];

    basketPositions.forEach((b) => {
      const basketGroup = new THREE.Group();
      basketGroup.position.set(b.x, 0, b.z);

      // Woven basket base
      const bowlGeo = new THREE.CylinderGeometry(0.35, 0.22, 0.28, 12);
      const bowlMat = new THREE.MeshStandardMaterial({
        color: '#78350f',
        roughness: 0.9,
      });
      const bowl = new THREE.Mesh(bowlGeo, bowlMat);
      bowl.position.y = 0.14;
      basketGroup.add(bowl);

      // Mound of colorful flower petals
      const flowerMoundGeo = new THREE.SphereGeometry(0.33, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const flowerMoundMat = new THREE.MeshStandardMaterial({
        color: b.color,
        roughness: 0.6,
      });
      const mound = new THREE.Mesh(flowerMoundGeo, flowerMoundMat);
      mound.position.y = 0.26;
      basketGroup.add(mound);

      // A few low-poly flower petal accents
      for (let i = 0; i < 5; i++) {
        const petalGeo = new THREE.ConeGeometry(0.06, 0.12, 5);
        const petalMat = new THREE.MeshStandardMaterial({ color: b.color });
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.set(
          (Math.random() - 0.5) * 0.35,
          0.32 + Math.random() * 0.06,
          (Math.random() - 0.5) * 0.35
        );
        petal.rotation.set(Math.random(), Math.random(), Math.random());
        basketGroup.add(petal);
      }

      this.scene.add(basketGroup);
    });
  }

  // --------------------------------------------------------------------------
  // Glowing Diyas Around Edges
  // --------------------------------------------------------------------------
  private buildDiyasAroundEdges(): void {
    const diyaCount = 8;
    const radius = 3.5;

    for (let i = 0; i < diyaCount; i++) {
      const angle = (i / diyaCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const diyaGroup = new THREE.Group();
      diyaGroup.position.set(x, 0.05, z);

      // Terracotta clay bowl
      const bowlGeo = new THREE.CylinderGeometry(0.16, 0.08, 0.1, 12);
      const bowlMat = new THREE.MeshStandardMaterial({
        color: '#b45309',
        roughness: 0.7,
      });
      const bowl = new THREE.Mesh(bowlGeo, bowlMat);
      diyaGroup.add(bowl);

      // Golden rim
      const rimGeo = new THREE.TorusGeometry(0.16, 0.02, 6, 16);
      const rimMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.8 });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.05;
      diyaGroup.add(rim);

      // Flame
      const flameGeo = new THREE.ConeGeometry(0.05, 0.15, 8);
      const flameMat = new THREE.MeshBasicMaterial({ color: '#fbbf24' });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.y = 0.12;
      diyaGroup.add(flame);

      // Diya point light
      const diyaLight = new THREE.PointLight('#f59e0b', 0.8, 2.5);
      diyaLight.position.set(0, 0.22, 0);
      diyaGroup.add(diyaLight);

      this.scene.add(diyaGroup);
      this.diyas.push({ flameMesh: flame, light: diyaLight, baseIntensity: 0.8 });
    }
  }

  // --------------------------------------------------------------------------
  // Marigold Garlands
  // --------------------------------------------------------------------------
  private buildMarigoldGarlands(): void {
    const garlandGroup = new THREE.Group();
    const radius = 3.8;
    const segments = 48;

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      // Draped sine wave height
      const drape = Math.sin(angle * 6) * 0.12 + 0.15;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const isYellow = i % 2 === 0;
      const beadGeo = new THREE.SphereGeometry(0.07, 6, 6);
      const beadMat = new THREE.MeshStandardMaterial({
        color: isYellow ? '#facc15' : '#ea580c',
        roughness: 0.8,
      });
      const bead = new THREE.Mesh(beadGeo, beadMat);
      bead.position.set(x, drape, z);
      garlandGroup.add(bead);
    }

    this.scene.add(garlandGroup);
  }

  // --------------------------------------------------------------------------
  // Subtle Drifting Flower Petal Particles
  // --------------------------------------------------------------------------
  private buildSubtlePetalParticles(): void {
    const count = 120;
    this.petalGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const palette = [
      new THREE.Color('#f97316'), // orange
      new THREE.Color('#eab308'), // yellow
      new THREE.Color('#ec4899'), // pink
      new THREE.Color('#a855f7'), // purple
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = Math.random() * 5 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    this.petalGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.petalGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const petalMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    this.petalParticles = new THREE.Points(this.petalGeo, petalMat);
    this.scene.add(this.petalParticles);
  }

  // --------------------------------------------------------------------------
  // Victory Particle Burst & Diya Glow
  // --------------------------------------------------------------------------
  public triggerVictoryBurst(): void {
    // 1. Flare all diyas temporarily
    this.diyas.forEach((d) => {
      d.light.intensity = 2.4;
      d.flameMesh.scale.set(1.6, 2.0, 1.6);
    });

    // 2. Spawn golden flower petal burst
    if (this.burstParticles) {
      this.scene.remove(this.burstParticles);
      this.burstGeo?.dispose();
    }

    const count = 180;
    this.burstGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this.burstVelocities = new Float32Array(count * 3);

    const goldPalette = [
      new THREE.Color('#f59e0b'),
      new THREE.Color('#fbbf24'),
      new THREE.Color('#f43f5e'),
      new THREE.Color('#38bdf8'),
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0.8;
      positions[i * 3 + 2] = 0;

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.2;
      this.burstVelocities[i * 3] = Math.cos(angle) * speed;
      this.burstVelocities[i * 3 + 1] = 1.8 + Math.random() * 2.5;
      this.burstVelocities[i * 3 + 2] = Math.sin(angle) * speed;

      const col = goldPalette[Math.floor(Math.random() * goldPalette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    this.burstGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.burstGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const burstMat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
    });

    this.burstParticles = new THREE.Points(this.burstGeo, burstMat);
    this.burstLifespan = 2.2; // lasts 2.2s
    this.scene.add(this.burstParticles);
  }

  // --------------------------------------------------------------------------
  // Animation Loop
  // --------------------------------------------------------------------------
  private animate = (): void => {
    if (this.isDisposed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // 1. Gentle diya flame flicker
    this.diyas.forEach((d, idx) => {
      const flicker = Math.sin(time * 12 + idx) * 0.15 + Math.cos(time * 8 + idx * 2) * 0.1;
      const targetIntensity = d.baseIntensity + flicker;
      d.light.intensity = THREE.MathUtils.lerp(d.light.intensity, targetIntensity, 0.1);
      d.flameMesh.scale.y = 1.0 + flicker * 0.4;
    });

    // 2. Drifting flower petals
    if (this.petalGeo) {
      const pos = this.petalGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        // Slow downward drift
        pos[i * 3 + 1] -= delta * 0.6;
        // Gentle sway in X and Z
        pos[i * 3] += Math.sin(time * 1.5 + i) * delta * 0.25;
        pos[i * 3 + 2] += Math.cos(time * 1.2 + i) * delta * 0.25;

        // Reset if below floor
        if (pos[i * 3 + 1] < 0.1) {
          pos[i * 3 + 1] = 5.0;
        }
      }
      this.petalGeo.attributes.position.needsUpdate = true;
    }

    // 3. Victory burst update
    if (this.burstParticles && this.burstGeo && this.burstVelocities && this.burstLifespan > 0) {
      this.burstLifespan -= delta;
      const pos = this.burstGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3] += this.burstVelocities[i * 3] * delta;
        pos[i * 3 + 1] += this.burstVelocities[i * 3 + 1] * delta;
        pos[i * 3 + 2] += this.burstVelocities[i * 3 + 2] * delta;

        // Gravity
        this.burstVelocities[i * 3 + 1] -= delta * 3.5;
      }
      this.burstGeo.attributes.position.needsUpdate = true;

      const burstMat = this.burstParticles.material as THREE.PointsMaterial;
      burstMat.opacity = Math.max(0, this.burstLifespan / 2.2);

      if (this.burstLifespan <= 0) {
        this.scene.remove(this.burstParticles);
        this.burstGeo.dispose();
        this.burstParticles = null;
        this.burstGeo = null;
        this.burstVelocities = null;
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  // --------------------------------------------------------------------------
  // Resize & Cleanup
  // --------------------------------------------------------------------------
  private handleResize(): void {
    if (this.isDisposed || !this.container) return;
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose(): void {
    this.isDisposed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Dispose scene objects
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });

    if (this.petalGeo) {
      this.petalGeo.dispose();
      this.petalGeo = null;
    }

    if (this.burstGeo) {
      this.burstGeo.dispose();
      this.burstGeo = null;
    }

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    this.renderer.dispose();
  }
}
