import * as THREE from 'three';
import { DecorationType, SnapPoint } from './types';

export class PandalScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private animationFrameId: number | null = null;
  private isDisposed: boolean = false;
  private clock: THREE.Clock = new THREE.Clock();

  // Raycasting
  public raycaster: THREE.Raycaster = new THREE.Raycaster();
  public snapHitboxes: THREE.Mesh[] = [];

  // Snap points & Placed items
  public snapPoints: SnapPoint[] = [];
  private snapMarkerGroups: Map<string, THREE.Group> = new Map();
  private placedItemGroups: Map<string, THREE.Group> = new Map();
  private dynamicLights: THREE.PointLight[] = [];

  // Active tool filter for marker pulsing
  public activeTool: DecorationType | null = null;

  // Particle bursts
  private particleSystem: THREE.Points | null = null;
  private particleVelocities: THREE.Vector3[] = [];
  private particleLifespans: number[] = [];

  // Interactive hover & ghost preview
  public hoveredSnapId: string | null = null;
  private previewGroup: THREE.Group = new THREE.Group();
  private previewMeshes: Map<DecorationType, THREE.Group> = new Map();

  // Fairy lights & crowd silhouettes
  private fairyLights: THREE.Mesh[] = [];
  private fairyLightMats: THREE.MeshBasicMaterial[] = [];
  private crowdDevotees: THREE.Group[] = [];

  // Celebration Mode
  public isCelebrationMode: boolean = false;
  public celebrationElapsed: number = 0;
  private celebrationPetals: THREE.Points | null = null;
  private petalPositions: Float32Array = new Float32Array(150 * 3);
  private petalVelocities: Float32Array = new Float32Array(150 * 3);

  // Callback
  public onSnapPointClicked?: (snapPoint: SnapPoint) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene setup with twilight festive backdrop
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x100826); // Deep rich royal purple night
    this.scene.fog = new THREE.FogExp2(0x100826, 0.032);

    // 2. Camera: Focused cinematic perspective of the incomplete pandal
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(44, aspect, 0.1, 100);
    this.camera.position.set(0, 2.3, 5.8);
    this.camera.lookAt(new THREE.Vector3(0, 1.2, 0.4));

    // 3. Renderer with soft shadows
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Initialize Snap Points configuration
    this.initializeSnapPoints();

    // 5. Build environment & architecture
    this.buildLighting();
    this.buildPandalArchitecture();
    this.buildSnapPointMarkers();
    this.buildPreviewMeshSystem();
    this.buildParticlePool();
    this.buildCelebrationPetalShower();

    // 6. Bind events & start loop
    this.bindEvents();
    this.startLoop();
  }

  private initializeSnapPoints() {
    this.snapPoints = [
      // 5 Diyas (pedestals & platform edges)
      {
        id: 'diya_left_front',
        index: 0,
        type: 'diya',
        position: [-1.8, 0.46, 1.25],
        label: 'Front Left Altar Diya',
        isOccupied: false,
      },
      {
        id: 'diya_left_inner',
        index: 1,
        type: 'diya',
        position: [-0.85, 0.72, 0.45],
        label: 'Inner Left Tier Diya',
        isOccupied: false,
      },
      {
        id: 'diya_center_altar',
        index: 2,
        type: 'diya',
        position: [0.0, 0.96, 0.05],
        label: 'Sacred Center Pedestal Diya',
        isOccupied: false,
      },
      {
        id: 'diya_right_inner',
        index: 3,
        type: 'diya',
        position: [0.85, 0.72, 0.45],
        label: 'Inner Right Tier Diya',
        isOccupied: false,
      },
      {
        id: 'diya_right_front',
        index: 4,
        type: 'diya',
        position: [1.8, 0.46, 1.25],
        label: 'Front Right Altar Diya',
        isOccupied: false,
      },

      // 3 Marigold Garlands (entrance arch top & pillar spirals)
      {
        id: 'garland_arch_top',
        index: 5,
        type: 'garland',
        position: [0.0, 2.52, 0.95],
        label: 'Entrance Arch Swag Toran',
        isOccupied: false,
      },
      {
        id: 'garland_pillar_left',
        index: 6,
        type: 'garland',
        position: [-1.85, 1.5, 0.55],
        label: 'Left Pillar Floral Drape',
        isOccupied: false,
      },
      {
        id: 'garland_pillar_right',
        index: 7,
        type: 'garland',
        position: [1.85, 1.5, 0.55],
        label: 'Right Pillar Floral Drape',
        isOccupied: false,
      },

      // 2 Lanterns (Kandils hanging from canopy corners)
      {
        id: 'lantern_left',
        index: 8,
        type: 'lantern',
        position: [-1.4, 2.05, 0.85],
        label: 'West Canopy Akash Kandil',
        isOccupied: false,
      },
      {
        id: 'lantern_right',
        index: 9,
        type: 'lantern',
        position: [1.4, 2.05, 0.85],
        label: 'East Canopy Akash Kandil',
        isOccupied: false,
      },

      // 1 Rangoli (courtyard center)
      {
        id: 'rangoli_center',
        index: 10,
        type: 'rangoli',
        position: [0.0, 0.06, 1.8],
        label: 'Sanctum Courtyard Rangoli',
        isOccupied: false,
      },
    ];
  }

  private buildLighting() {
    // Ambient light - starts cozy and dim, will glow warmer as decorations are placed
    const ambient = new THREE.AmbientLight(0xffecd2, 0.45);
    this.scene.add(ambient);

    // Key directional moonlight/stage spotlight
    const dirLight = new THREE.DirectionalLight(0xfff1d6, 0.9);
    dirLight.position.set(2.5, 6, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 15;
    dirLight.shadow.camera.left = -4;
    dirLight.shadow.camera.right = 4;
    dirLight.shadow.camera.top = 4;
    dirLight.shadow.camera.bottom = -4;
    this.scene.add(dirLight);

    // Warm back golden rim light
    const rimLight = new THREE.DirectionalLight(0xfb923c, 0.5);
    rimLight.position.set(-3, 4, -3);
    this.scene.add(rimLight);

    // Central altar base warm glow
    const centerWarmLight = new THREE.PointLight(0xffaa33, 0.6, 5);
    centerWarmLight.position.set(0, 1.2, 0.2);
    this.scene.add(centerWarmLight);
  }

  private buildPandalArchitecture() {
    const pandalGroup = new THREE.Group();

    // Floor / Courtyard Ground
    const groundGeo = new THREE.PlaneGeometry(16, 16);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1f1438,
      roughness: 0.85,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    pandalGroup.add(ground);

    // --- 1. Tiered Central Platform ---
    // Bottom step: Wooden teak platform
    const baseStepGeo = new THREE.BoxGeometry(4.8, 0.2, 3.4);
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.7,
      metalness: 0.1,
    });
    const baseStep = new THREE.Mesh(baseStepGeo, woodMat);
    baseStep.position.set(0, 0.1, 0.2);
    baseStep.receiveShadow = true;
    baseStep.castShadow = true;
    pandalGroup.add(baseStep);

    // Middle step: Polished marble with gold trim
    const midStepGeo = new THREE.BoxGeometry(3.6, 0.25, 2.6);
    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.5,
      metalness: 0.2,
    });
    const midStep = new THREE.Mesh(midStepGeo, marbleMat);
    midStep.position.set(0, 0.32, 0.0);
    midStep.receiveShadow = true;
    midStep.castShadow = true;
    pandalGroup.add(midStep);

    // Royal Crimson Altar Runner Carpet
    const carpetGeo = new THREE.BoxGeometry(1.6, 0.02, 3.2);
    const carpetMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Deep ruby red
      roughness: 0.9,
    });
    const carpet = new THREE.Mesh(carpetGeo, carpetMat);
    carpet.position.set(0, 0.21, 0.3);
    carpet.receiveShadow = true;
    pandalGroup.add(carpet);

    // Central Deity Sanctum / Throne Pedestal
    const pedestalBaseGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.45, 16);
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.4,
      metalness: 0.4,
    });
    const pedestalBase = new THREE.Mesh(pedestalBaseGeo, goldTrimMat);
    pedestalBase.position.set(0, 0.67, -0.2);
    pedestalBase.castShadow = true;
    pedestalBase.receiveShadow = true;
    pandalGroup.add(pedestalBase);

    // Gold Lotus Throne Silhouette on Pedestal
    const throneGeo = new THREE.CylinderGeometry(0.65, 0.75, 0.2, 8);
    const throneMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.3,
      metalness: 0.6,
    });
    const throne = new THREE.Mesh(throneGeo, throneMat);
    throne.position.set(0, 0.95, -0.2);
    throne.castShadow = true;
    pandalGroup.add(throne);

    // Stylized Silhouette of Ganesha Idol on Altar
    this.buildGaneshaSilhouette(pandalGroup);

    // --- 2. Side Pillars (4 pillars) ---
    const pillarPositions: [number, number, number][] = [
      [-1.9, 1.4, 1.1], // Front left
      [1.9, 1.4, 1.1],  // Front right
      [-1.9, 1.4, -0.9], // Back left
      [1.9, 1.4, -0.9],  // Back right
    ];

    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x92400e, // Warm carved sandalwood
      roughness: 0.6,
      metalness: 0.2,
    });
    const brassCapitalMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      metalness: 0.7,
    });

    pillarPositions.forEach((pos) => {
      const pillarGroup = new THREE.Group();
      pillarGroup.position.set(...pos);

      // Base plinth
      const plinthGeo = new THREE.BoxGeometry(0.4, 0.25, 0.4);
      const plinth = new THREE.Mesh(plinthGeo, brassCapitalMat);
      plinth.position.y = -1.25;
      plinth.castShadow = true;
      pillarGroup.add(plinth);

      // Shaft column
      const shaftGeo = new THREE.CylinderGeometry(0.14, 0.16, 2.3, 12);
      const shaft = new THREE.Mesh(shaftGeo, pillarMat);
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      pillarGroup.add(shaft);

      // Top capital
      const capitalGeo = new THREE.CylinderGeometry(0.24, 0.15, 0.25, 12);
      const capital = new THREE.Mesh(capitalGeo, brassCapitalMat);
      capital.position.y = 1.2;
      capital.castShadow = true;
      pillarGroup.add(capital);

      pandalGroup.add(pillarGroup);
    });

    // --- 3. Entrance Arch & Beams ---
    const archMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.4,
      metalness: 0.5,
    });

    // Front horizontal lintel beam
    const lintelGeo = new THREE.BoxGeometry(4.2, 0.2, 0.25);
    const lintel = new THREE.Mesh(lintelGeo, archMat);
    lintel.position.set(0, 2.65, 1.1);
    lintel.castShadow = true;
    pandalGroup.add(lintel);

    // Decorative scalloped curved arch over front
    const archCurve = new THREE.TorusGeometry(1.6, 0.08, 8, 24, Math.PI);
    const archMesh = new THREE.Mesh(archCurve, archMat);
    archMesh.position.set(0, 2.62, 1.1);
    archMesh.rotation.z = Math.PI;
    pandalGroup.add(archMesh);

    // Golden Kalash Finial at apex
    const kalashGeo = new THREE.ConeGeometry(0.2, 0.45, 8);
    const kalash = new THREE.Mesh(kalashGeo, brassCapitalMat);
    kalash.position.set(0, 2.95, 1.1);
    kalash.castShadow = true;
    pandalGroup.add(kalash);

    // --- 4. Fabric Canopy (Saffron & Magenta Draped Roof) ---
    // Canopy roof pyramid
    const canopyRoofGeo = new THREE.ConeGeometry(3.0, 1.1, 4);
    const fabricMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c, // Festive saffron orange
      roughness: 0.9,
      metalness: 0.05,
    });
    const canopyRoof = new THREE.Mesh(canopyRoofGeo, fabricMat);
    canopyRoof.position.set(0, 3.25, 0.1);
    canopyRoof.rotation.y = Math.PI / 4;
    canopyRoof.castShadow = true;
    pandalGroup.add(canopyRoof);

    // Scalloped valance frills along canopy sides (crimson pink)
    const valanceMat = new THREE.MeshStandardMaterial({
      color: 0xbe185d, // Deep festive pink/magenta
      roughness: 0.85,
    });
    const valanceFrontGeo = new THREE.BoxGeometry(4.0, 0.22, 0.06);
    const valanceFront = new THREE.Mesh(valanceFrontGeo, valanceMat);
    valanceFront.position.set(0, 2.62, 1.05);
    pandalGroup.add(valanceFront);

    // Festive Fairy Lights along front canopy beam and entrance arch
    const bulbGeo = new THREE.SphereGeometry(0.045, 8, 8);
    for (let i = -1.9; i <= 1.9; i += 0.2) {
      const bulbMat = new THREE.MeshBasicMaterial({
        color: 0xffedd5,
      });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(i, 2.52 + Math.sin((i + 1.9) * 2.5) * 0.06, 1.12);
      pandalGroup.add(bulb);
      this.fairyLights.push(bulb);
      this.fairyLightMats.push(bulbMat);
    }

    // --- 5. Empty Diya Stands (5 distinct pedestals where diyas will snap) ---
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.5,
      metalness: 0.6,
    });
    const standPositions: [number, number, number][] = [
      [-1.8, 0.35, 1.25],
      [-0.85, 0.55, 0.45],
      [0.0, 0.82, 0.05],
      [0.85, 0.55, 0.45],
      [1.8, 0.35, 1.25],
    ];
    standPositions.forEach((pos) => {
      const standGroup = new THREE.Group();
      standGroup.position.set(...pos);

      const poleGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.25, 8);
      const pole = new THREE.Mesh(poleGeo, standMat);
      standGroup.add(pole);

      const plateGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.04, 12);
      const plate = new THREE.Mesh(plateGeo, standMat);
      plate.position.y = 0.13;
      standGroup.add(plate);

      pandalGroup.add(standGroup);
    });

    // --- 6. Lantern Hooks (brass hooks dangling from front canopy corners) ---
    const hookMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.8,
      roughness: 0.3,
    });
    const hookPositions: [number, number, number][] = [
      [-1.4, 2.5, 0.85],
      [1.4, 2.5, 0.85],
    ];
    hookPositions.forEach((pos) => {
      const chainGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6);
      const chain = new THREE.Mesh(chainGeo, hookMat);
      chain.position.set(pos[0], pos[1] - 0.22, pos[2]);
      pandalGroup.add(chain);
    });

    // --- 7. Flower Baskets / Urlis flanking the entrance steps ---
    const urliMat = new THREE.MeshStandardMaterial({
      color: 0xb45309, // Brass bowl
      roughness: 0.3,
      metalness: 0.7,
    });
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Floating marigold orange
      roughness: 0.8,
    });

    const urliLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.2, 0.2, 12), urliMat);
    urliLeft.position.set(-2.2, 0.1, 1.9);
    pandalGroup.add(urliLeft);
    const petalLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 12), petalMat);
    petalLeft.position.set(-2.2, 0.19, 1.9);
    pandalGroup.add(petalLeft);

    const urliRight = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.2, 0.2, 12), urliMat);
    urliRight.position.set(2.2, 0.1, 1.9);
    pandalGroup.add(urliRight);
    const petalRight = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 12), petalMat);
    petalRight.position.set(2.2, 0.19, 1.9);
    pandalGroup.add(petalRight);

    // --- 8. Background Crowd Silhouettes ---
    this.buildCrowdSilhouettes(pandalGroup);

    this.scene.add(pandalGroup);
  }

  private buildGaneshaSilhouette(parent: THREE.Group) {
    const deityGroup = new THREE.Group();
    deityGroup.position.set(0, 1.05, -0.2);

    const goldStatueMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.35,
      metalness: 0.7,
    });

    // Body / Torso
    const bodyGeo = new THREE.SphereGeometry(0.32, 12, 12);
    bodyGeo.scale(1, 1.1, 0.9);
    const body = new THREE.Mesh(bodyGeo, goldStatueMat);
    body.position.y = 0.32;
    deityGroup.add(body);

    // Head with elephant trunk
    const headGeo = new THREE.SphereGeometry(0.24, 12, 12);
    const head = new THREE.Mesh(headGeo, goldStatueMat);
    head.position.set(0, 0.65, 0.05);
    deityGroup.add(head);

    // Curved Trunk
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.62, 0.2),
      new THREE.Vector3(0, 0.45, 0.3),
      new THREE.Vector3(0.1, 0.38, 0.32),
      new THREE.Vector3(0.18, 0.45, 0.28),
    ]);
    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 12, 0.055, 6, false);
    const trunk = new THREE.Mesh(trunkGeo, goldStatueMat);
    deityGroup.add(trunk);

    // Large ears
    const earGeo = new THREE.BoxGeometry(0.28, 0.28, 0.04);
    const leftEar = new THREE.Mesh(earGeo, goldStatueMat);
    leftEar.position.set(-0.26, 0.66, 0.02);
    leftEar.rotation.y = 0.3;
    deityGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, goldStatueMat);
    rightEar.position.set(0.26, 0.66, 0.02);
    rightEar.rotation.y = -0.3;
    deityGroup.add(rightEar);

    // Mukut (Golden Crown)
    const crownGeo = new THREE.ConeGeometry(0.16, 0.4, 8);
    const crown = new THREE.Mesh(crownGeo, goldStatueMat);
    crown.position.set(0, 0.95, 0.05);
    deityGroup.add(crown);

    // Sacred Prabhavali (Golden Halo Arch behind Bappa)
    const haloGeo = new THREE.TorusGeometry(0.55, 0.04, 6, 24);
    const halo = new THREE.Mesh(haloGeo, goldStatueMat);
    halo.position.set(0, 0.68, -0.15);
    deityGroup.add(halo);

    parent.add(deityGroup);
  }

  private buildCrowdSilhouettes(parent: THREE.Group) {
    const crowdGroup = new THREE.Group();
    crowdGroup.position.set(0, 0, -3.2);

    const silhouetteMat = new THREE.MeshBasicMaterial({
      color: 0x090414,
      transparent: true,
      opacity: 0.75,
    });

    // Series of soft low-poly silhouettes of devotees celebrating
    for (let i = -7; i <= 7; i += 1.3) {
      const devotee = new THREE.Group();
      const heightVar = 0.85 + Math.random() * 0.3;
      devotee.position.set(i + (Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.8);

      // Body cone
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.4 * heightVar, 6), silhouetteMat);
      body.position.y = 0.7 * heightVar;
      devotee.add(body);

      // Head sphere
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), silhouetteMat);
      head.position.y = 1.45 * heightVar;
      devotee.add(head);

      crowdGroup.add(devotee);
      this.crowdDevotees.push(devotee);
    }

    parent.add(crowdGroup);
  }

  // --- Snap Point Markers ---
  private buildSnapPointMarkers() {
    this.snapPoints.forEach((snap) => {
      const group = new THREE.Group();
      group.position.set(...snap.position);

      // 1. Invisible larger raycast hitbox for effortless touch/click
      const hitRadius = snap.type === 'rangoli' ? 0.75 : snap.type === 'garland' ? 0.55 : 0.45;
      const hitboxGeo = new THREE.SphereGeometry(hitRadius, 8, 8);
      const hitboxMat = new THREE.MeshBasicMaterial({
        visible: false,
      });
      const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
      hitbox.userData = { snapPointId: snap.id };
      group.add(hitbox);
      this.snapHitboxes.push(hitbox);

      // 2. Visible Glowing Visual Beacon
      const markerMesh = this.createSnapMarkerVisual(snap.type);
      markerMesh.name = 'visualMarker';
      group.add(markerMesh);

      // 3. Ground ring pulse for floor items
      if (snap.type === 'rangoli') {
        const floorRingGeo = new THREE.RingGeometry(0.4, 0.65, 24);
        const floorRingMat = new THREE.MeshBasicMaterial({
          color: 0xec4899,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
        });
        const floorRing = new THREE.Mesh(floorRingGeo, floorRingMat);
        floorRing.rotation.x = -Math.PI / 2;
        floorRing.name = 'floorRing';
        group.add(floorRing);
      }

      this.scene.add(group);
      this.snapMarkerGroups.set(snap.id, group);
    });
  }

  private createSnapMarkerVisual(type: DecorationType): THREE.Object3D {
    const markerGroup = new THREE.Group();

    if (type === 'diya') {
      // Amber glowing beacon with pulsing outer ring
      const ringGeo = new THREE.TorusGeometry(0.18, 0.035, 8, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.8,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      markerGroup.add(ring);

      // Small glowing center diamond
      const diamondGeo = new THREE.OctahedronGeometry(0.08);
      const diamondMat = new THREE.MeshBasicMaterial({
        color: 0xfffbeb,
      });
      const diamond = new THREE.Mesh(diamondGeo, diamondMat);
      diamond.position.y = 0.1;
      diamond.name = 'floater';
      markerGroup.add(diamond);
    } else if (type === 'garland') {
      // Orange beaded dashed ring
      const ringGeo = new THREE.TorusGeometry(0.28, 0.04, 8, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xea580c,
        transparent: true,
        opacity: 0.85,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      markerGroup.add(ring);

      const floater = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      floater.name = 'floater';
      markerGroup.add(floater);
    } else if (type === 'lantern') {
      // Magenta/Rose hanging diamond
      const diamondGeo = new THREE.OctahedronGeometry(0.18);
      const diamondMat = new THREE.MeshBasicMaterial({
        color: 0xe11d48,
        transparent: true,
        opacity: 0.85,
      });
      const diamond = new THREE.Mesh(diamondGeo, diamondMat);
      diamond.name = 'floater';
      markerGroup.add(diamond);

      const ringGeo = new THREE.TorusGeometry(0.24, 0.03, 8, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      markerGroup.add(ring);
    } else if (type === 'rangoli') {
      // Violet/pink glowing center star
      const starGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.02, 6);
      const starMat = new THREE.MeshBasicMaterial({
        color: 0xec4899,
        transparent: true,
        opacity: 0.7,
      });
      const star = new THREE.Mesh(starGeo, starMat);
      markerGroup.add(star);
    }

    return markerGroup;
  }

  // --- Preview Ghost Mesh System ---
  private buildPreviewMeshSystem() {
    this.previewGroup.visible = false;
    this.scene.add(this.previewGroup);

    // Diya preview
    const diyaPreview = new THREE.Group();
    const diyaMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.6,
      roughness: 0.3,
      metalness: 0.5,
    });
    const diyaBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.06, 0.08, 12), diyaMat);
    diyaPreview.add(diyaBowl);
    const diyaFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.045, 0.16, 8),
      new THREE.MeshBasicMaterial({ color: 0xffedd5, transparent: true, opacity: 0.85 })
    );
    diyaFlame.position.set(0.1, 0.08, 0);
    diyaPreview.add(diyaFlame);
    this.previewMeshes.set('diya', diyaPreview);

    // Garland preview
    const garlandPreview = new THREE.Group();
    const garlandMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.6,
      roughness: 0.5,
    });
    for (let i = -0.45; i <= 0.45; i += 0.12) {
      const gDot = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 6), garlandMat);
      gDot.position.set(i, -Math.sin((i + 0.45) * Math.PI) * 0.18, 0);
      garlandPreview.add(gDot);
    }
    this.previewMeshes.set('garland', garlandPreview);

    // Lantern preview
    const lanternPreview = new THREE.Group();
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.6,
      roughness: 0.3,
    });
    const lBody = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), lanternMat);
    lanternPreview.add(lBody);
    this.previewMeshes.set('lantern', lanternPreview);

    // Rangoli preview
    const rangoliPreview = new THREE.Group();
    const rangoliMat = new THREE.MeshBasicMaterial({
      color: 0xf472b6,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const rDisc = new THREE.Mesh(new THREE.CircleGeometry(0.85, 24), rangoliMat);
    rDisc.rotation.x = -Math.PI / 2;
    rangoliPreview.add(rDisc);
    this.previewMeshes.set('rangoli', rangoliPreview);
  }

  public updatePreviewMesh() {
    if (!this.hoveredSnapId || !this.activeTool || this.isCelebrationMode) {
      this.previewGroup.visible = false;
      return;
    }

    const snap = this.snapPoints.find((s) => s.id === this.hoveredSnapId);
    if (!snap || snap.isOccupied || snap.type !== this.activeTool) {
      this.previewGroup.visible = false;
      return;
    }

    // Set preview position and mesh
    this.previewGroup.position.set(...snap.position);

    // Clear previewGroup children
    while (this.previewGroup.children.length > 0) {
      this.previewGroup.remove(this.previewGroup.children[0]);
    }

    const mesh = this.previewMeshes.get(this.activeTool);
    if (mesh) {
      this.previewGroup.add(mesh);
      this.previewGroup.visible = true;
    }
  }

  // --- Placement Logic & 3D Object Creation ---
  public placeDecoration(snapPointId: string, type: DecorationType): boolean {
    const snap = this.snapPoints.find((s) => s.id === snapPointId);
    if (!snap || snap.isOccupied) return false;

    snap.isOccupied = true;
    snap.placedItemId = `${type}_${Date.now()}`;

    // Hide preview
    this.previewGroup.visible = false;

    // Hide snap point marker
    const markerGroup = this.snapMarkerGroups.get(snapPointId);
    if (markerGroup) {
      markerGroup.visible = false;
    }

    // Create realistic festive 3D mesh
    const itemMesh = this.createDecorationMesh(snap, type);
    itemMesh.position.set(...snap.position);

    // Initial scale-in entry bounce
    itemMesh.scale.set(0.01, 0.01, 0.01);
    itemMesh.userData = { targetScale: 1.0, currentScale: 0.01, isEntering: true };

    this.scene.add(itemMesh);
    this.placedItemGroups.set(snapPointId, itemMesh);

    // Trigger celebration particle burst
    this.triggerParticleBurst(snap.position, type);

    return true;
  }

  public removeDecoration(snapPointId: string): boolean {
    const snap = this.snapPoints.find((s) => s.id === snapPointId);
    if (!snap || !snap.isOccupied) return false;

    snap.isOccupied = false;
    snap.placedItemId = undefined;

    // Remove 3D item mesh and associated dynamic light
    const itemMesh = this.placedItemGroups.get(snapPointId);
    if (itemMesh) {
      // Remove any point lights inside
      itemMesh.traverse((child) => {
        if (child instanceof THREE.PointLight) {
          const idx = this.dynamicLights.indexOf(child);
          if (idx !== -1) this.dynamicLights.splice(idx, 1);
        }
      });
      this.scene.remove(itemMesh);
      this.placedItemGroups.delete(snapPointId);
    }

    // Re-show snap point marker
    const markerGroup = this.snapMarkerGroups.get(snapPointId);
    if (markerGroup) {
      markerGroup.visible = true;
    }

    return true;
  }

  private createDecorationMesh(snap: SnapPoint, type: DecorationType): THREE.Group {
    const group = new THREE.Group();

    if (type === 'diya') {
      // Traditional Brass Diya with sacred oil and glowing flame
      const brassMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.25,
        metalness: 0.85,
      });

      // Bowl
      const bowlGeo = new THREE.CylinderGeometry(0.16, 0.06, 0.08, 12);
      const bowl = new THREE.Mesh(bowlGeo, brassMat);
      bowl.castShadow = true;
      group.add(bowl);

      // Beak / lip of diya pointing forward
      const beakGeo = new THREE.ConeGeometry(0.06, 0.12, 4);
      const beak = new THREE.Mesh(beakGeo, brassMat);
      beak.rotation.z = -Math.PI / 2;
      beak.rotation.y = Math.PI / 4;
      beak.position.set(0.14, 0.01, 0);
      group.add(beak);

      // Flickering Teardrop Flame
      const flameGeo = new THREE.ConeGeometry(0.045, 0.16, 8);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xffedd5,
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(0.1, 0.08, 0);
      flame.name = 'diyaFlame';
      group.add(flame);

      // Warm Amber Point Light
      const diyaLight = new THREE.PointLight(0xffa116, 1.4, 4.2);
      diyaLight.position.set(0.1, 0.18, 0);
      diyaLight.castShadow = true;
      diyaLight.shadow.bias = -0.002;
      group.add(diyaLight);
      this.dynamicLights.push(diyaLight);
    } else if (type === 'garland') {
      // Lush Marigold Toran / Garland
      const isArchTop = snap.id === 'garland_arch_top';

      if (isArchTop) {
        // Grand hanging garland swag spanning across entrance arch
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(-1.8, 0, 0),
          new THREE.Vector3(0, -0.45, 0.1),
          new THREE.Vector3(1.8, 0, 0)
        );

        const points = curve.getPoints(24);
        const orangeMat = new THREE.MeshStandardMaterial({
          color: 0xea580c,
          roughness: 0.8,
        });
        const yellowMat = new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          roughness: 0.8,
        });

        points.forEach((pt, idx) => {
          const flowerGeo = new THREE.SphereGeometry(0.075, 7, 7);
          const flowerMesh = new THREE.Mesh(flowerGeo, idx % 2 === 0 ? orangeMat : yellowMat);
          flowerMesh.position.copy(pt);
          flowerMesh.castShadow = true;
          group.add(flowerMesh);

          // Small green mango leaf accents
          if (idx % 3 === 0) {
            const leafGeo = new THREE.ConeGeometry(0.04, 0.14, 4);
            const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            leaf.position.set(pt.x, pt.y - 0.07, pt.z);
            leaf.rotation.z = Math.PI;
            group.add(leaf);
          }
        });
      } else {
        // Vertical spiraling pillar garland
        const orangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.8 });
        const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.8 });

        for (let y = -0.7; y <= 0.7; y += 0.14) {
          const angle = y * 5;
          const radius = 0.22;
          const fx = Math.cos(angle) * radius;
          const fz = Math.sin(angle) * radius;

          const flower = new THREE.Mesh(
            new THREE.SphereGeometry(0.065, 6, 6),
            Math.random() > 0.4 ? orangeMat : yellowMat
          );
          flower.position.set(fx, y, fz);
          group.add(flower);
        }
      }
    } else if (type === 'lantern') {
      // Akash Kandil (Traditional Festive Lantern)
      const lanternMat = new THREE.MeshStandardMaterial({
        color: 0xbe123c, // Rose red
        roughness: 0.4,
        metalness: 0.2,
      });
      const goldAccentMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.3,
        metalness: 0.8,
      });

      // Octahedral / Star Lantern Body
      const bodyGeo = new THREE.OctahedronGeometry(0.24);
      const body = new THREE.Mesh(bodyGeo, lanternMat);
      body.castShadow = true;
      group.add(body);

      // Gold mid-band
      const bandGeo = new THREE.TorusGeometry(0.22, 0.02, 6, 12);
      const band = new THREE.Mesh(bandGeo, goldAccentMat);
      group.add(band);

      // Colorful Tail Streamers hanging from base
      const colors = [0xfacc15, 0xe11d48, 0x0284c7, 0x16a34a];
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const sx = Math.cos(angle) * 0.12;
        const sz = Math.sin(angle) * 0.12;
        const streamerGeo = new THREE.CylinderGeometry(0.015, 0.005, 0.45, 4);
        const streamerMat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
        const streamer = new THREE.Mesh(streamerGeo, streamerMat);
        streamer.position.set(sx, -0.32, sz);
        streamer.rotation.z = 0.05 * Math.sin(i);
        group.add(streamer);
      }

      // Internal Warm Glow Light
      const lanternLight = new THREE.PointLight(0xff4488, 1.2, 3.8);
      lanternLight.position.set(0, 0, 0);
      group.add(lanternLight);
      this.dynamicLights.push(lanternLight);
    } else if (type === 'rangoli') {
      // Sacred Circular Floral Rangoli
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw intricate multi-colored mandala
        const cx = 256;
        const cy = 256;

        // Base circle
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(cx, cy, 240, 0, Math.PI * 2);
        ctx.fill();

        // White border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 14;
        ctx.stroke();

        // Outer petal ring
        ctx.fillStyle = '#f59e0b';
        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2;
          const px = cx + Math.cos(angle) * 180;
          const py = cy + Math.sin(angle) * 180;
          ctx.beginPath();
          ctx.arc(px, py, 45, 0, Math.PI * 2);
          ctx.fill();
        }

        // Inner mandala star
        ctx.fillStyle = '#9333ea';
        ctx.beginPath();
        ctx.arc(cx, cy, 120, 0, Math.PI * 2);
        ctx.fill();

        // Golden center diya symbol
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(cx, cy, 60, 0, Math.PI * 2);
        ctx.fill();

        // White sacred dots
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          const px = cx + Math.cos(angle) * 135;
          const py = cy + Math.sin(angle) * 135;
          ctx.beginPath();
          ctx.arc(px, py, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const rangoliTexture = new THREE.CanvasTexture(canvas);
      rangoliTexture.anisotropy = 4;

      const rangoliGeo = new THREE.CircleGeometry(0.85, 32);
      const rangoliMat = new THREE.MeshStandardMaterial({
        map: rangoliTexture,
        roughness: 0.9,
        metalness: 0.05,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      });
      const rangoliMesh = new THREE.Mesh(rangoliGeo, rangoliMat);
      rangoliMesh.rotation.x = -Math.PI / 2;
      rangoliMesh.receiveShadow = true;
      group.add(rangoliMesh);
    }

    return group;
  }

  // --- Particle Celebration Bursts ---
  private buildParticlePool() {
    const count = 75;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -100; // park off-screen
      positions[i * 3 + 2] = 0;

      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.8;
      colors[i * 3 + 2] = 0.2;

      this.particleVelocities.push(new THREE.Vector3());
      this.particleLifespans.push(0);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });

    this.particleSystem = new THREE.Points(geo, mat);
    this.scene.add(this.particleSystem);
  }

  public triggerParticleBurst(pos: [number, number, number], type: DecorationType) {
    if (!this.particleSystem) return;
    const positions = this.particleSystem.geometry.attributes.position.array as Float32Array;
    const colors = this.particleSystem.geometry.attributes.color.array as Float32Array;

    const countPerBurst = 25;
    let activated = 0;

    for (let i = 0; i < this.particleLifespans.length && activated < countPerBurst; i++) {
      if (this.particleLifespans[i] <= 0) {
        // Spawn particle
        positions[i * 3] = pos[0];
        positions[i * 3 + 1] = pos[1];
        positions[i * 3 + 2] = pos[2];

        // Random radial outward burst
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = 0.8 + Math.random() * 1.4;

        this.particleVelocities[i].set(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed * 0.8 + 0.6,
          Math.sin(phi) * Math.sin(theta) * speed
        );

        this.particleLifespans[i] = 1.0; // 1.0s lifespan

        // Color based on decoration type
        if (type === 'diya') {
          colors[i * 3] = 1.0;
          colors[i * 3 + 1] = 0.7;
          colors[i * 3 + 2] = 0.1;
        } else if (type === 'garland') {
          colors[i * 3] = 1.0;
          colors[i * 3 + 1] = 0.45;
          colors[i * 3 + 2] = 0.05;
        } else if (type === 'lantern') {
          colors[i * 3] = 0.95;
          colors[i * 3 + 1] = 0.15;
          colors[i * 3 + 2] = 0.4;
        } else {
          colors[i * 3] = 0.9;
          colors[i * 3 + 1] = 0.3;
          colors[i * 3 + 2] = 0.85;
        }

        activated++;
      }
    }

    this.particleSystem.geometry.attributes.position.needsUpdate = true;
    this.particleSystem.geometry.attributes.color.needsUpdate = true;
  }

  // --- Celebration Mode & Petal Shower ---
  private buildCelebrationPetalShower() {
    const count = 150;
    const geo = new THREE.BufferGeometry();
    const positions = this.petalPositions;
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8.0;
      positions[i * 3 + 1] = -100; // parked offscreen
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6.0;

      this.petalVelocities[i * 3] = (Math.random() - 0.5) * 0.4;
      this.petalVelocities[i * 3 + 1] = -(0.8 + Math.random() * 0.8); // falling
      this.petalVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

      // Festive Marigold Orange, Yellow, Rose Red, and Gold Sparkles
      const colorChoice = Math.random();
      if (colorChoice < 0.35) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.55;
        colors[i * 3 + 2] = 0.05; // Marigold orange
      } else if (colorChoice < 0.65) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 0.1; // Marigold gold
      } else if (colorChoice < 0.85) {
        colors[i * 3] = 0.95;
        colors[i * 3 + 1] = 0.15;
        colors[i * 3 + 2] = 0.35; // Rose petal
      } else {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.95;
        colors[i * 3 + 2] = 0.7; // Golden shimmer
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });

    this.celebrationPetals = new THREE.Points(geo, mat);
    this.scene.add(this.celebrationPetals);
  }

  public startCelebration() {
    this.isCelebrationMode = true;
    this.celebrationElapsed = 0;
    this.activeTool = null;
    this.previewGroup.visible = false;

    // Reset petal positions to sky
    for (let i = 0; i < 150; i++) {
      this.petalPositions[i * 3] = (Math.random() - 0.5) * 9.0;
      this.petalPositions[i * 3 + 1] = 3.5 + Math.random() * 4.0;
      this.petalPositions[i * 3 + 2] = (Math.random() - 0.5) * 6.0;
    }
    if (this.celebrationPetals) {
      this.celebrationPetals.geometry.attributes.position.needsUpdate = true;
    }

    // Intensify dynamic lights
    this.dynamicLights.forEach((light) => {
      light.intensity = 2.8;
      light.distance = 6.0;
    });
  }

  public resetCelebration() {
    this.isCelebrationMode = false;
    this.celebrationElapsed = 0;
    if (this.celebrationPetals) {
      for (let i = 0; i < 150; i++) {
        this.petalPositions[i * 3 + 1] = -100;
      }
      this.celebrationPetals.geometry.attributes.position.needsUpdate = true;
    }
    this.camera.position.set(0, 2.3, 5.8);
    this.camera.lookAt(new THREE.Vector3(0, 1.2, 0.4));
  }

  // --- Interaction & Event Listeners ---
  private bindEvents() {
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.onPointerDown);
    dom.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('resize', this.onWindowResize);
  }

  private onPointerDown = (event: PointerEvent) => {
    if (this.isDisposed || this.isCelebrationMode) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
    const intersects = this.raycaster.intersectObjects(this.snapHitboxes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const snapId = hitMesh.userData.snapPointId as string;
      const snap = this.snapPoints.find((s) => s.id === snapId);
      if (snap && this.onSnapPointClicked) {
        this.onSnapPointClicked(snap);
      }
    }
  };

  private onPointerMove = (event: PointerEvent) => {
    if (this.isDisposed || this.isCelebrationMode) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
    const intersects = this.raycaster.intersectObjects(this.snapHitboxes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      this.hoveredSnapId = hitMesh.userData.snapPointId as string;
      this.renderer.domElement.style.cursor = 'pointer';
    } else {
      this.hoveredSnapId = null;
      this.renderer.domElement.style.cursor = 'default';
    }
  };

  private onWindowResize = () => {
    if (this.isDisposed || !this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  // --- Animation Loop ---
  private startLoop() {
    const loop = () => {
      if (this.isDisposed) return;
      this.animationFrameId = requestAnimationFrame(loop);

      const delta = this.clock.getDelta();
      const time = this.clock.getElapsedTime();

      // 1. Camera Movement: Subtle breathing or smooth celebration pull-back
      if (this.isCelebrationMode) {
        this.celebrationElapsed += delta;
        // Smoothly pull back camera to reveal full pandal
        this.camera.position.x = Math.sin(time * 0.3) * 0.25;
        this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 2.75, 0.025);
        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, 7.5, 0.025);
        this.camera.lookAt(new THREE.Vector3(0, 1.4, 0.2));
      } else {
        this.camera.position.x = Math.sin(time * 0.4) * 0.12;
        this.camera.position.y = 2.3 + Math.cos(time * 0.3) * 0.05;
        this.camera.lookAt(new THREE.Vector3(0, 1.2, 0.4));
      }

      // 2. Ghost preview update for hovered valid snap point
      this.updatePreviewMesh();

      // 3. Snap Point Markers: Glow gold if matching valid snap point, subtle/hidden otherwise
      this.snapPoints.forEach((snap) => {
        const markerGroup = this.snapMarkerGroups.get(snap.id);
        if (markerGroup) {
          if (snap.isOccupied || this.isCelebrationMode) {
            markerGroup.visible = false;
            return;
          }

          const isMatchingTool = this.activeTool === snap.type;
          const isHovered = this.hoveredSnapId === snap.id;

          if (this.activeTool) {
            if (isMatchingTool) {
              markerGroup.visible = true;
              const targetScale = isHovered ? 1.35 : 1.15 + Math.sin(time * 6) * 0.15;
              markerGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.18);

              const floater = markerGroup.getObjectByName('floater');
              if (floater) {
                floater.position.y = 0.1 + Math.sin(time * 4 + snap.index) * 0.06;
                floater.rotation.y = time * 3.0;
              }
            } else {
              // Non-matching snap points are hidden/subtle
              markerGroup.visible = false;
            }
          } else {
            markerGroup.visible = true;
            markerGroup.scale.lerp(new THREE.Vector3(1.0, 1.0, 1.0), 0.15);
          }
        }
      });

      // 4. Animate Placed Items (Entry bounce & gentle candle flickers)
      this.placedItemGroups.forEach((itemGroup) => {
        // Entry scale lerp
        if (itemGroup.userData.isEntering) {
          const current = itemGroup.userData.currentScale || 0.01;
          const target = itemGroup.userData.targetScale || 1.0;
          const next = current + (target - current) * 0.22;
          itemGroup.scale.set(next, next, next);
          itemGroup.userData.currentScale = next;
          if (Math.abs(target - next) < 0.01) {
            itemGroup.scale.set(target, target, target);
            itemGroup.userData.isEntering = false;
          }
        }

        // Diya flame flickering
        const flame = itemGroup.getObjectByName('diyaFlame');
        if (flame) {
          const flicker = 1.0 + (Math.random() - 0.5) * 0.25;
          flame.scale.set(flicker, 1.0 + Math.sin(time * 12) * 0.15, flicker);
        }
      });

      // 5. Fairy Lights Twinkling (Intense & colorful during celebration)
      if (this.fairyLights.length > 0) {
        const palette = [0xf59e0b, 0xfacc15, 0xec4899, 0x38bdf8, 0x34d399, 0xffedd5];
        this.fairyLights.forEach((bulb, idx) => {
          const mat = this.fairyLightMats[idx];
          if (this.isCelebrationMode) {
            const cIdx = Math.floor((time * 4 + idx) % palette.length);
            mat.color.setHex(palette[cIdx]);
            bulb.scale.setScalar(1.2 + Math.sin(time * 8 + idx) * 0.35);
          } else {
            mat.color.setHex(0xffecd2);
            bulb.scale.setScalar(0.85 + Math.sin(time * 2 + idx) * 0.1);
          }
        });
      }

      // 6. Crowd Silhouettes Dancing during Celebration
      if (this.isCelebrationMode && this.crowdDevotees.length > 0) {
        this.crowdDevotees.forEach((devotee, idx) => {
          devotee.position.y = Math.abs(Math.sin(time * 6 + idx * 0.7)) * 0.22;
          devotee.rotation.z = Math.sin(time * 5 + idx) * 0.08;
        });
      }

      // 7. Falling Petals during Celebration
      if (this.isCelebrationMode && this.celebrationPetals) {
        const pArr = this.celebrationPetals.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < 150; i++) {
          pArr[i * 3] += this.petalVelocities[i * 3] * delta;
          pArr[i * 3 + 1] += this.petalVelocities[i * 3 + 1] * delta;
          pArr[i * 3 + 2] += this.petalVelocities[i * 3 + 2] * delta;

          // Wind flutter
          pArr[i * 3] += Math.sin(time * 3 + i) * 0.008;

          // Reset to top when landing on floor
          if (pArr[i * 3 + 1] < 0.05) {
            pArr[i * 3 + 1] = 4.0 + Math.random() * 2.0;
            pArr[i * 3] = (Math.random() - 0.5) * 9.0;
            pArr[i * 3 + 2] = (Math.random() - 0.5) * 6.0;
          }
        }
        this.celebrationPetals.geometry.attributes.position.needsUpdate = true;
      }

      // 8. Update Placement Particle Bursts
      if (this.particleSystem) {
        const positions = this.particleSystem.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < this.particleLifespans.length; i++) {
          if (this.particleLifespans[i] > 0) {
            this.particleLifespans[i] -= delta * 1.3;

            // Apply gravity
            this.particleVelocities[i].y -= 2.2 * delta;

            positions[i * 3] += this.particleVelocities[i].x * delta;
            positions[i * 3 + 1] += this.particleVelocities[i].y * delta;
            positions[i * 3 + 2] += this.particleVelocities[i].z * delta;

            if (this.particleLifespans[i] <= 0) {
              positions[i * 3 + 1] = -100; // offscreen
            }
          }
        }
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
      }

      this.renderer.render(this.scene, this.camera);
    };

    loop();
  }

  // --- Disposal & Cleanup ---
  public destroy() {
    this.isDisposed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onPointerDown);
    dom.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('resize', this.onWindowResize);

    // Dispose renderer
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
