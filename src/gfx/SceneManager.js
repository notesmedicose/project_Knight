import * as THREE from 'three';

/**
 * SceneManager handles Three.js setup: Scene, Camera, Lighting, Renderer, Raycasting.
 */
export class SceneManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090c10);
    this.scene.fog = new THREE.FogExp2(0x090c10, 0.03);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Camera Modes: 0 = 3D White Perspective, 1 = Top-Down Aerial, 2 = 3D Black Perspective
    this.cameraMode = 0;
    this.resetCameraView('w');

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.2 : 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = isMobile ? 0.8 : 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.container.appendChild(this.renderer.domElement);

    // Raycaster & Input tracking
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Setup Lighting
    this.setupLighting();

    // Event listeners
    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupLighting() {
    // 1. Soft Warm Ambient Base Light
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 0.6);
    this.scene.add(ambientLight);

    // 2. Realistic Hemisphere Bounce Light (Warm sky bounce, rich mahogany ground bounce)
    const hemiLight = new THREE.HemisphereLight(0xfff0dd, 0x221105, 0.65);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    // 3. Main Royal Key Chandelier Directional Light with Soft Shadows
    const keyLight = new THREE.DirectionalLight(0xfffaed, 1.5);
    keyLight.position.set(5, 15, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = isMobile ? 512 : 2048;
    keyLight.shadow.mapSize.height = isMobile ? 512 : 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 35;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // 4. FOUR ROYAL AMBIENT CORNER LIGHTS (Matching User's Green Corner Circles!)
    // Warm golden amber point lights positioned around the 4 corners of the board
    const cornerPositions = [
      [-4.6, 1.5, -4.6],
      [4.6, 1.5, -4.6],
      [-4.6, 1.5, 4.6],
      [4.6, 1.5, 4.6]
    ];

    cornerPositions.forEach(pos => {
      const cornerLight = new THREE.PointLight(0xffb84d, 3.2, 12.0, 2.0);
      cornerLight.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(cornerLight);
    });

    // 5. Secondary Soft Warm Rim Light from back
    const rimLight = new THREE.DirectionalLight(0xfde68a, 0.6);
    rimLight.position.set(-7, 8, -7);
    this.scene.add(rimLight);
  }

  resetCameraView(perspective = 'w') {
    if (perspective === 'b') {
      this.cameraMode = 2;
      this.camera.position.set(0, 7.2, -8.5);
      this.camera.lookAt(0, 0.3, 0);
    } else {
      this.cameraMode = 0;
      this.camera.position.set(0, 7.2, 8.5);
      this.camera.lookAt(0, 0.3, 0);
    }
  }

  toggleCameraView() {
    this.cameraMode = (this.cameraMode + 1) % 3;
    if (this.cameraMode === 0) {
      // 3D Angled White View
      this.camera.position.set(0, 7.2, 8.5);
      this.camera.lookAt(0, 0.3, 0);
    } else if (this.cameraMode === 1) {
      // Top-Down Aerial 2D View
      this.camera.position.set(0, 11.2, 0.01);
      this.camera.lookAt(0, 0, 0);
    } else {
      // 3D Angled Black View
      this.camera.position.set(0, 7.2, -8.5);
      this.camera.lookAt(0, 0.3, 0);
    }
    return this.cameraMode;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}





