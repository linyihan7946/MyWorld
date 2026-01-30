import * as THREE from 'three';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky color

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 20, 0); // Start high above center
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    
    container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  public render() {
    this.renderer.render(this.scene, this.camera);
  }
}
