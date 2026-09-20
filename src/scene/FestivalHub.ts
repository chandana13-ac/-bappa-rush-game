import * as THREE from 'three';
import { FESTIVAL_STATIONS, StationInfo } from '../data/festivalData';
import { PlayerController } from './PlayerController';
import { CameraController } from './CameraController';
import { InteractionSystem } from './InteractionSystem';
import { SettingsManager } from '../game/SettingsManager';

export class FestivalHub {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public player: PlayerController;
  public cameraController: CameraController;
  public interactionSystem: InteractionSystem;

  private container: HTMLElement;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private isDisposed: boolean = false;

  // Station visual objects for pulsing/animating
  private stationMeshes: Map<string, THREE.Group> = new Map();
  private stationLights: Map<string, THREE.PointLight> = new Map();
  private floatingPetals: THREE.Points | null = null;
  private diyaFlames: THREE.PointLight[] = [];
  private fairyLightBulbs: THREE.Mesh[] = [];

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene & Environment
    this.scene = new THREE.Scene();
    // Night festival atmosphere: deep twilight royal blue & purple
    this.scene.background = new THREE.Color(0x0c0926);
    this.scene.fog = new THREE.FogExp2(0x0c0926, 0.024);

    // 2. Camera & Renderer
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 3. Controllers
    this.player = new PlayerController();
    this.scene.add(this.player.mesh);

    this.cameraController = new CameraController(this.camera, this.renderer.domElement);
    this.interactionSystem = new InteractionSystem();

    // 4. Build Environment
    this.buildLighting();
    this.buildCourtyard();
    this.buildGrandPandalSanctuary();
    this.buildStations();
    this.buildFairyLights();
    this.buildFestiveCrowdSilhouettes();
    this.buildFloatingPetals();

    // 5. Start loop
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    this.animate();

    // Resize observer
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  private buildLighting(): void {
    // Ambient light - deep warm indigo
    const ambient = new THREE.AmbientLight(0x3a2c5a, 0.9);
    this.scene.add(ambient);

    // Moonlight / overarching twilight direction
    const moonLight = new THREE.DirectionalLight(0xa5b4fc, 0.6);
    moonLight.position.set(15, 25, 10);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 60;
    moonLight.shadow.camera.left = -22;
    moonLight.shadow.camera.right = 22;
    moonLight.shadow.camera.top = 22;
    moonLight.shadow.camera.bottom = -22;
    this.scene.add(moonLight);

    // Warm central festival plaza glow (golden lantern light)
    const centralGlow = new THREE.PointLight(0xf59e0b, 1.8, 30);
    centralGlow.position.set(0, 4.5, 0);
    this.scene.add(centralGlow);
  }

  private buildCourtyard(): void {
    // Festival courtyard floor
    const groundGeo = new THREE.PlaneGeometry(42, 42);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x181432, // Dark festive courtyard stone
      roughness: 0.85,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Central Rangoli decorative circle
    const rangoliGeo = new THREE.RingGeometry(0.2, 3.8, 32);
    const rangoliMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e, // Rose pink rangoli base
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const rangoli = new THREE.Mesh(rangoliGeo, rangoliMat);
    rangoli.rotation.x = -Math.PI / 2;
    rangoli.position.y = 0.01;
    this.scene.add(rangoli);

    // Inner Rangoli Petals (Golden ring)
    const innerGeo = new THREE.RingGeometry(1.2, 2.6, 8);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24, // Bright marigold gold
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const innerRing = new THREE.Mesh(innerGeo, innerMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.rotation.z = Math.PI / 8;
    innerRing.position.y = 0.02;
    this.scene.add(innerRing);

    // Boundary Courtyard Walls (Low-poly carved stone balustrade)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x2e1b4d,
      roughness: 0.8,
    });
    const wallGeo = new THREE.BoxGeometry(40, 1.2, 0.6);

    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 0.6, -19.5);
    this.scene.add(backWall);

    const frontWall = new THREE.Mesh(wallGeo, wallMat);
    frontWall.position.set(0, 0.6, 19.5);
    this.scene.add(frontWall);

    const sideWallGeo = new THREE.BoxGeometry(0.6, 1.2, 40);
    const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
    leftWall.position.set(-19.5, 0.6, 0);
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
    rightWall.position.set(19.5, 0.6, 0);
    this.scene.add(rightWall);
  }

  private buildGrandPandalSanctuary(): void {
    const sanctuaryGroup = new THREE.Group();
    sanctuaryGroup.position.set(0, 0, -15);

    // 1. Raised Sanctuary Platform
    const platformGeo = new THREE.BoxGeometry(16, 1.0, 7);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x3b1d54, // Regal purple marble
      roughness: 0.5,
      metalness: 0.2,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = 0.5;
    platform.receiveShadow = true;
    sanctuaryGroup.add(platform);

    // Front steps
    const stepGeo = new THREE.BoxGeometry(8, 0.4, 1.2);
    const step = new THREE.Mesh(stepGeo, platformMat);
    step.position.set(0, 0.2, 4.0);
    sanctuaryGroup.add(step);

    // 2. Ornate Sanctuary Pillars (4 pillars supporting the Toran arch)
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Polished brass / golden luster
      roughness: 0.35,
      metalness: 0.5,
    });
    const pillarGeo = new THREE.CylinderGeometry(0.35, 0.4, 5.0, 8);

    const pillarPositions = [-6, -2, 2, 6];
    pillarPositions.forEach((x) => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(x, 3.5, 2.5);
      pillar.castShadow = true;
      sanctuaryGroup.add(pillar);

      // Decorative pillar capital
      const capGeo = new THREE.BoxGeometry(0.9, 0.3, 0.9);
      const cap = new THREE.Mesh(capGeo, pillarMat);
      cap.position.set(x, 6.1, 2.5);
      sanctuaryGroup.add(cap);
    });

    // 3. Ornate Toran Arch & Canopy
    const roofGeo = new THREE.ConeGeometry(9.5, 3.2, 4);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Festive saffron cloth canopy
      roughness: 0.6,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 7.8, 0);
    roof.rotation.y = Math.PI / 4;
    sanctuaryGroup.add(roof);

    // 4. Central Bappa Idol Silhouette & Golden Mandap
    const mandapBackGeo = new THREE.BoxGeometry(5.5, 4.5, 0.3);
    const mandapMat = new THREE.MeshStandardMaterial({
      color: 0x581c87, // Deep royal purple velvet background
      roughness: 0.7,
    });
    const mandapBack = new THREE.Mesh(mandapBackGeo, mandapMat);
    mandapBack.position.set(0, 3.2, -1.8);
    sanctuaryGroup.add(mandapBack);

    // Glowing Golden Prabhavali (Aura Arch)
    const haloGeo = new THREE.TorusGeometry(1.8, 0.18, 10, 24, Math.PI);
    const haloMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.set(0, 3.8, -1.5);
    sanctuaryGroup.add(halo);

    // Low-poly Lord Ganesha Idol Representation (sacred, respectful geometric silhouette)
    const idolGroup = new THREE.Group();
    idolGroup.position.set(0, 2.0, -1.0);

    const goldIdolMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.7,
      roughness: 0.3,
    });

    // Torso / Rounded belly
    const bellyGeo = new THREE.SphereGeometry(0.75, 12, 10);
    const belly = new THREE.Mesh(bellyGeo, goldIdolMat);
    belly.position.y = 0.7;
    idolGroup.add(belly);

    // Chest & Shoulders
    const chestGeo = new THREE.CylinderGeometry(0.5, 0.65, 0.8, 10);
    const chest = new THREE.Mesh(chestGeo, goldIdolMat);
    chest.position.y = 1.25;
    idolGroup.add(chest);

    // Head
    const headGeo = new THREE.SphereGeometry(0.48, 10, 10);
    const head = new THREE.Mesh(headGeo, goldIdolMat);
    head.position.set(0, 1.85, 0.1);
    idolGroup.add(head);

    // Curved Trunk
    const trunkCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 1.7, 0.45),
      new THREE.Vector3(0.2, 1.3, 0.75),
      new THREE.Vector3(-0.15, 1.1, 0.65)
    );
    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 12, 0.14, 8, false);
    const trunk = new THREE.Mesh(trunkGeo, goldIdolMat);
    idolGroup.add(trunk);

    // Large ears (left & right fan ears)
    const earGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.05, 8);
    const leftEar = new THREE.Mesh(earGeo, goldIdolMat);
    leftEar.rotation.z = Math.PI / 2;
    leftEar.rotation.y = 0.3;
    leftEar.position.set(-0.55, 1.9, 0.05);
    idolGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, goldIdolMat);
    rightEar.rotation.z = Math.PI / 2;
    rightEar.rotation.y = -0.3;
    rightEar.position.set(0.55, 1.9, 0.05);
    idolGroup.add(rightEar);

    // Golden Mukut (Crown)
    const crownGeo = new THREE.ConeGeometry(0.35, 0.7, 8);
    const crown = new THREE.Mesh(crownGeo, goldIdolMat);
    crown.position.set(0, 2.45, 0.05);
    idolGroup.add(crown);

    sanctuaryGroup.add(idolGroup);

    // Divine warm golden spotlight illuminating Bappa
    const divineSpot = new THREE.SpotLight(0xffedd5, 3.5, 20, Math.PI / 5, 0.4, 1.2);
    divineSpot.position.set(0, 8, 4);
    divineSpot.target = idolGroup;
    sanctuaryGroup.add(divineSpot);

    // Holy Kalash Pots with Coconut (Left & Right)
    [-3.8, 3.8].forEach((kx) => {
      const kalashMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.6,
        roughness: 0.3,
      });
      const potGeo = new THREE.SphereGeometry(0.4, 8, 8);
      const pot = new THREE.Mesh(potGeo, kalashMat);
      pot.position.set(kx, 1.35, 2.0);
      sanctuaryGroup.add(pot);

      const coconutGeo = new THREE.SphereGeometry(0.22, 6, 6);
      const coconutMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
      const coconut = new THREE.Mesh(coconutGeo, coconutMat);
      coconut.position.set(kx, 1.7, 2.0);
      sanctuaryGroup.add(coconut);
    });

    // Marigold Garlands draping along the sanctuary
    this.buildMarigoldGarland(sanctuaryGroup, new THREE.Vector3(-6, 5.8, 2.5), new THREE.Vector3(6, 5.8, 2.5), 18);

    this.scene.add(sanctuaryGroup);
  }

  private buildMarigoldGarland(
    parent: THREE.Group,
    start: THREE.Vector3,
    end: THREE.Vector3,
    count: number
  ): void {
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.8 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.8 });
    const beadGeo = new THREE.SphereGeometry(0.14, 6, 6);

    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const x = THREE.MathUtils.lerp(start.x, end.x, t);
      const sag = Math.sin(t * Math.PI) * 0.7; // Garland sag
      const y = THREE.MathUtils.lerp(start.y, end.y, t) - sag;
      const z = THREE.MathUtils.lerp(start.z, end.z, t);

      const mat = i % 2 === 0 ? orangeMat : yellowMat;
      const bead = new THREE.Mesh(beadGeo, mat);
      bead.position.set(x, y, z);
      parent.add(bead);
    }
  }

  private buildStations(): void {
    FESTIVAL_STATIONS.forEach((station) => {
      const group = new THREE.Group();
      group.position.set(...station.position);

      const themeHex = parseInt(station.themeColor.replace('#', '0x'), 16);
      const accentHex = parseInt(station.accentColor.replace('#', '0x'), 16);

      // Base stone platform
      const baseGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.4, 12);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x24183e,
        roughness: 0.7,
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.2;
      base.receiveShadow = true;
      group.add(base);

      // Glowing Station Ring on floor
      const ringGeo = new THREE.RingGeometry(2.0, 2.3, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: themeHex,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.41;
      group.add(ring);

      // Central Station Totem / Pedestal
      const totemGeo = new THREE.CylinderGeometry(0.4, 0.5, 1.4, 8);
      const totemMat = new THREE.MeshStandardMaterial({
        color: 0x3b1d54,
        metalness: 0.3,
        roughness: 0.5,
      });
      const totem = new THREE.Mesh(totemGeo, totemMat);
      totem.position.y = 1.0;
      totem.castShadow = true;
      group.add(totem);

      // Station specific thematic props on pedestal:
      if (station.id === 'diyaDash') {
        // Brass Diya Lamp
        const diyaGeo = new THREE.SphereGeometry(0.35, 8, 8);
        const brassMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.8,
          roughness: 0.2,
        });
        const diya = new THREE.Mesh(diyaGeo, brassMat);
        diya.scale.set(1, 0.4, 1.4);
        diya.position.y = 1.85;
        group.add(diya);

        // Flame point light
        const flameLight = new THREE.PointLight(0xf97316, 2.0, 7);
        flameLight.position.set(0, 2.1, 0.4);
        group.add(flameLight);
        this.diyaFlames.push(flameLight);
      } else if (station.id === 'rangoliRecall') {
        // Rangoli color bowls
        const bowlMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.5 });
        const bowlGeo = new THREE.CylinderGeometry(0.4, 0.25, 0.25, 8);
        const bowl = new THREE.Mesh(bowlGeo, bowlMat);
        bowl.position.y = 1.8;
        group.add(bowl);
      } else if (station.id === 'modakFactory') {
        // Plate with golden modak sweet
        const plateGeo = new THREE.CylinderGeometry(0.5, 0.45, 0.08, 10);
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7 });
        const plate = new THREE.Mesh(plateGeo, brassMat);
        plate.position.y = 1.75;
        group.add(plate);

        const modakGeo = new THREE.ConeGeometry(0.24, 0.38, 8);
        const modakMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });
        const modak = new THREE.Mesh(modakGeo, modakMat);
        modak.position.y = 1.95;
        group.add(modak);
      } else if (station.id === 'dholEcho') {
        // Drum prop
        const dholGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 10);
        const drumMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.6 });
        const drum = new THREE.Mesh(dholGeo, drumMat);
        drum.rotation.z = Math.PI / 2;
        drum.position.y = 1.9;
        group.add(drum);
      } else if (station.id === 'pandalPerfect') {
        // Flower garland pillar prop
        const flowerGeo = new THREE.TorusGeometry(0.35, 0.12, 6, 12);
        const flowerMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.6 });
        const garland = new THREE.Mesh(flowerGeo, flowerMat);
        garland.position.y = 1.9;
        garland.rotation.x = Math.PI / 2;
        group.add(garland);
      }

      // Station Beacon Light
      const beacon = new THREE.PointLight(themeHex, 2.2, 10);
      beacon.position.set(0, 2.6, 0);
      group.add(beacon);
      this.stationLights.set(station.id, beacon);

      // Floating station diamond icon marker
      const diamondGeo = new THREE.OctahedronGeometry(0.35, 0);
      const diamondMat = new THREE.MeshStandardMaterial({
        color: accentHex,
        emissive: themeHex,
        emissiveIntensity: 0.7,
        roughness: 0.2,
      });
      const diamond = new THREE.Mesh(diamondGeo, diamondMat);
      diamond.position.y = 3.2;
      diamond.name = 'floatingMarker';
      group.add(diamond);

      this.scene.add(group);
      this.stationMeshes.set(station.id, group);
    });
  }

  private buildFairyLights(): void {
    // Strings of colorful festive fairy light bulbs along the perimeter
    const colors = [0xf59e0b, 0xec4899, 0x10b981, 0x3b82f6, 0xfacc15];
    const bulbGeo = new THREE.SphereGeometry(0.12, 6, 6);

    const perimeter = [
      { start: [-18, 4.5, -18], end: [18, 4.5, -18] },
      { start: [18, 4.5, -18], end: [18, 4.5, 18] },
      { start: [18, 4.5, 18], end: [-18, 4.5, 18] },
      { start: [-18, 4.5, 18], end: [-18, 4.5, -18] },
    ];

    perimeter.forEach((edge) => {
      const start = new THREE.Vector3(...(edge.start as [number, number, number]));
      const end = new THREE.Vector3(...(edge.end as [number, number, number]));
      const count = 12;

      for (let i = 0; i <= count; i++) {
        const t = i / count;
        const color = colors[i % colors.length];
        const mat = new THREE.MeshBasicMaterial({ color });
        const bulb = new THREE.Mesh(bulbGeo, mat);

        const x = THREE.MathUtils.lerp(start.x, end.x, t);
        const sag = Math.sin(t * Math.PI) * 0.6;
        const y = THREE.MathUtils.lerp(start.y, end.y, t) - sag;
        const z = THREE.MathUtils.lerp(start.z, end.z, t);

        bulb.position.set(x, y, z);
        this.scene.add(bulb);
        this.fairyLightBulbs.push(bulb);
      }
    });
  }

  private buildFestiveCrowdSilhouettes(): void {
    // Low-poly crowd silhouettes standing along outer barriers celebrating
    const crowdGroup = new THREE.Group();
    const silhouetteMat = new THREE.MeshStandardMaterial({
      color: 0x130e28, // Deep shadow silhouette
      roughness: 0.9,
    });

    const personGeo = new THREE.CylinderGeometry(0.25, 0.35, 1.6, 6);
    const headGeo = new THREE.SphereGeometry(0.2, 6, 6);

    for (let i = -16; i <= 16; i += 2.8) {
      if (Math.abs(i) < 4) continue; // Entrance gap

      // Back row
      const person1 = new THREE.Mesh(personGeo, silhouetteMat);
      person1.position.set(i + (Math.random() - 0.5) * 0.5, 0.8, -18.2);
      crowdGroup.add(person1);

      const head1 = new THREE.Mesh(headGeo, silhouetteMat);
      head1.position.set(person1.position.x, 1.7, person1.position.z);
      crowdGroup.add(head1);

      // Side rows
      const person2 = new THREE.Mesh(personGeo, silhouetteMat);
      person2.position.set(-18.2, 0.8, i + (Math.random() - 0.5) * 0.5);
      crowdGroup.add(person2);

      const head2 = new THREE.Mesh(headGeo, silhouetteMat);
      head2.position.set(person2.position.x, 1.7, person2.position.z);
      crowdGroup.add(head2);
    }

    this.scene.add(crowdGroup);
  }

  private buildFloatingPetals(): void {
    // Ambient floating marigold and gulal particles
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorA = new THREE.Color(0xf97316); // Orange marigold
    const colorB = new THREE.Color(0xfacc15); // Yellow marigold
    const colorC = new THREE.Color(0xec4899); // Rose petal

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 36;
      positions[i * 3 + 1] = Math.random() * 8 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 36;

      const pick = Math.random();
      const c = pick < 0.45 ? colorA : pick < 0.75 ? colorB : colorC;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });

    this.floatingPetals = new THREE.Points(geometry, material);
    this.scene.add(this.floatingPetals);
  }

  public setHighlightStation(stationId: string | null): void {
    this.stationLights.forEach((light, id) => {
      if (id === stationId) {
        light.intensity = 4.2;
        light.distance = 14;
      } else {
        light.intensity = 2.0;
        light.distance = 9;
      }
    });
  }

  public setMovementEnabled(enabled: boolean): void {
    this.player.setMovementEnabled(enabled);
    this.interactionSystem.setEnabled(enabled);
  }

  public isMovementEnabled(): boolean {
    return this.player.isMovementEnabled();
  }

  private animate(): void {
    if (this.isDisposed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    const timeSec = now * 0.001;

    // 1. Update Player
    const cameraYaw = this.cameraController.getYaw();
    this.player.update(delta, cameraYaw);

    // 2. Update Camera Tracking
    this.cameraController.update(this.player.getPosition());

    // 3. Update Proximity & Interactions
    this.interactionSystem.update(this.player.getPosition());

    // 4. Animate floating station icons
    this.stationMeshes.forEach((group) => {
      const marker = group.getObjectByName('floatingMarker');
      if (marker) {
        marker.position.y = 3.2 + Math.sin(timeSec * 3 + group.position.x) * 0.18;
        marker.rotation.y = timeSec * 1.5;
      }
    });

    // 5. Animate Diya flame flickering
    this.diyaFlames.forEach((flame, idx) => {
      flame.intensity = 1.8 + Math.sin(timeSec * 12 + idx) * 0.4;
    });

    // 6. Animate floating flower petals drift
    if (this.floatingPetals) {
      const posAttr = this.floatingPetals.geometry.attributes.position;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        // Drift downwards and horizontally
        arr[i * 3 + 1] -= delta * 0.6; // Y drift
        arr[i * 3] += Math.sin(timeSec + i) * delta * 0.3; // X sway
        arr[i * 3 + 2] += Math.cos(timeSec * 0.8 + i) * delta * 0.3; // Z sway

        // Reset when falling beneath floor
        if (arr[i * 3 + 1] < 0.1) {
          arr[i * 3 + 1] = 8.0;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 7. Render
    this.renderer.render(this.scene, this.camera);
  }

  private handleResize(): void {
    if (!this.container || this.isDisposed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

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

    window.removeEventListener('resize', this.handleResize);

    this.cameraController.dispose();
    this.player.dispose();
    this.interactionSystem.dispose();

    // Dispose all scene geometries and materials
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh || (obj as THREE.Points).isPoints) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
