import { GameLoop } from '../core/GameLoop';
import { SceneManager } from '../core/SceneManager';
import { InputManager } from '../core/InputManager';
import { World } from './World';
import { PlayerController } from './PlayerController';
import * as THREE from 'three';

export class Game {
  private loop: GameLoop;
  private sceneManager: SceneManager;
  private inputManager: InputManager;
  private world: World;
  private player: PlayerController;

  constructor(container: HTMLElement) {
    this.sceneManager = new SceneManager(container);
    this.inputManager = new InputManager(container);
    this.loop = new GameLoop();
    this.world = new World(this.sceneManager.scene);
    this.player = new PlayerController(this.sceneManager.camera, this.inputManager, this.world);

    this.init();
  }

  private init() {
    this.world.generate();
    
    // Add light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.sceneManager.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    this.sceneManager.scene.add(dirLight);

    this.loop.add((dt) => {
      this.player.update(dt);
      
      // Update camera rotation based on mouse
      const mouse = this.inputManager.getMovement();
      this.sceneManager.camera.rotation.y -= mouse.x * 0.002;
      this.sceneManager.camera.rotation.x -= mouse.y * 0.002;
      this.sceneManager.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.sceneManager.camera.rotation.x));
      // Note: Camera rotation order needs to be YXZ for FPS usually, default is XYZ.
      this.sceneManager.camera.rotation.order = 'YXZ';

      this.sceneManager.render();
    });

    this.loop.start();
  }
  
  public dispose() {
    this.loop.stop();
    // Cleanup could go here
  }
}
