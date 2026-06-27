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
    this.resetCameraView('w');

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

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
    // Bright ambient light to ensure black pieces on dark tiles remain clearly visible
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    this.scene.add(ambientLight);

    // Main Key Directional Light with Shadows
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.4);
    keyLight.position.set(6, 14, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 35;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // Secondary Warm Fill Light from opposite side for black pieces
    const fillLight = new THREE.DirectionalLight(0xfde68a, 0.7);
    fillLight.position.set(-8, 10, -8);
    this.scene.add(fillLight);
  }

  resetCameraView(perspective = 'w') {
    // Elegant 3D angled camera perspective matching the reference photo layout
    const targetZ = perspective === 'w' ? 8.5 : -8.5;
    const targetY = 7.2;
    const targetX = 0;

    this.camera.position.set(targetX, targetY, targetZ);
    this.camera.lookAt(0, 0.3, 0);
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
