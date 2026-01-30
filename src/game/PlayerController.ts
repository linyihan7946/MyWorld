import * as THREE from 'three';
import { InputManager } from '../core/InputManager';
import { World } from './World';
import { BlockType } from './Block';

export class PlayerController {
  private camera: THREE.Camera;
  private input: InputManager;
  private world: World;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private onGround: boolean = false;
  
  // Physics constants
  private gravity: number = 30;
  private speed: number = 10;
  private jumpForce: number = 12;
  
  // Interaction
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private breakCount: number = 0;
  private lastTargetBlock: THREE.Object3D | null = null;
  
  public currentBlockType: BlockType = BlockType.DIRT;

  constructor(camera: THREE.Camera, input: InputManager, world: World) {
    this.camera = camera;
    this.input = input;
    this.world = world;
    this.raycaster.far = 5; // Reach distance
  }

  public update(dt: number) {
    this.handleMovement(dt);
    this.handleInteraction();
  }

  private handleMovement(dt: number) {
    if (this.input.locked) {
      // Reset horizontal velocity for tight control (Minecraft style)
      // Or apply damping. Let's reset for simplicity.
      this.velocity.x = 0;
      this.velocity.z = 0;

      const direction = new THREE.Vector3();
      this.camera.getWorldDirection(direction);
      direction.y = 0;
      direction.normalize();

      const side = new THREE.Vector3();
      side.crossVectors(this.camera.up, direction).normalize(); // Left vector

      if (this.input.keys['KeyW']) this.velocity.add(direction.multiplyScalar(this.speed));
      if (this.input.keys['KeyS']) this.velocity.add(direction.multiplyScalar(-this.speed));
      if (this.input.keys['KeyA']) this.velocity.add(side.multiplyScalar(this.speed)); // Move Left
      if (this.input.keys['KeyD']) this.velocity.add(side.multiplyScalar(-this.speed)); // Move Right

      if (this.input.keys['Space'] && this.onGround) {
        this.velocity.y = this.jumpForce;
        this.onGround = false;
      }
    }

    // Apply Gravity
    this.velocity.y -= this.gravity * dt;

    // Apply Velocity
    const deltaPosition = this.velocity.clone().multiplyScalar(dt);
    const newPos = this.camera.position.clone().add(deltaPosition);
    
    // Simple Collision (Floor)
    // Check if feet are below ground level (Block height is 1)
    // For now, hardcode floor at 1 (since blocks are at y=0,1,2,3).
    // Player height 1.8.
    
    // Improved Collision: Check block at feet position
    const feetPos = newPos.clone();
    feetPos.y -= 1.8;

    const blockX = Math.round(feetPos.x);
    const blockY = Math.round(feetPos.y);
    const blockZ = Math.round(feetPos.z);
    
    const blockBelow = this.world.getBlock(blockX, blockY, blockZ);
    
    if (blockBelow !== BlockType.AIR) {
        // Collision with block
        // Snap to top of block
        if (this.velocity.y < 0) {
            newPos.y = blockY + 0.5 + 1.8; // Block center Y + 0.5 (half height) + Player height
            this.velocity.y = 0;
            this.onGround = true;
        }
    } else {
        this.onGround = false;
    }
    
    // Fallback floor at 0 (Bedrock usually at 0)
    if (newPos.y < 2) { // 0.5 (block half) + 1.8 (player) approx
        // newPos.y = 2;
        // this.velocity.y = 0;
        // this.onGround = true;
    }

    this.camera.position.copy(newPos);
  }

  private handleInteraction() {
    if (!this.input.locked) return;

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const meshes = this.world.getMeshes();
    const hits = this.raycaster.intersectObjects(meshes);

    if (hits.length > 0) {
      const hit = hits[0]!;
      
      // Breaking (Left Click)
      if (this.input.mouse.leftDown) {
        if (this.lastTargetBlock === hit.object) {
            this.breakCount++;
            if (this.breakCount >= 11) { // 11 ticks/frames
                const pos = hit.object.position;
                if (this.world.getBlock(pos.x, pos.y, pos.z) !== BlockType.BEDROCK) {
                    this.world.setBlock(pos.x, pos.y, pos.z, BlockType.AIR);
                }
                this.breakCount = 0;
                this.lastTargetBlock = null;
                // this.input.mouse.leftDown = false; // Optional: auto-fire or require release
            }
        } else {
            this.lastTargetBlock = hit.object;
            this.breakCount = 0;
        }
      } else {
        this.breakCount = 0;
        this.lastTargetBlock = null;
      }

      // Placing (Right Click)
      if (this.input.mouse.rightDown) {
        if (hit.face) {
            const pos = hit.object.position.clone().add(hit.face.normal);
            
            // Check collision with player
            // Player is axis aligned box approx 0.6x1.8x0.6
            // Block is 1x1x1 at pos
            const playerPos = this.camera.position;
            const dx = Math.abs(pos.x - playerPos.x);
            const dy = Math.abs(pos.y - (playerPos.y - 0.9)); // Center of player
            const dz = Math.abs(pos.z - playerPos.z);
            
            // Simple distance check or AABB
            if (dx > 0.8 || dy > 1.4 || dz > 0.8) {
                 this.world.setBlock(pos.x, pos.y, pos.z, this.currentBlockType);
                 this.input.mouse.rightDown = false; // Require click release
            }
        }
      }
    }
  }
}
