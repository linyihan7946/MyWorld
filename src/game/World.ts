import * as THREE from 'three';
import { BlockType, BlockProperties } from './Block';

export class World {
  private blocks: Map<string, BlockType> = new Map();
  public meshes: Map<string, THREE.Mesh> = new Map();
  private scene: THREE.Scene;
  private materialMap: Map<BlockType, THREE.Material> = new Map();
  private geometry: THREE.BoxGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.initMaterials();
  }

  private initMaterials() {
    this.materialMap.set(BlockType.DIRT, new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
    this.materialMap.set(BlockType.STONE, new THREE.MeshLambertMaterial({ color: 0x808080 }));
    this.materialMap.set(BlockType.BEDROCK, new THREE.MeshLambertMaterial({ color: 0x000000 }));
    this.materialMap.set(BlockType.ORE, new THREE.MeshLambertMaterial({ color: 0xFFD700 }));
    this.materialMap.set(BlockType.WOOD, new THREE.MeshLambertMaterial({ color: 0xA0522D }));
    this.materialMap.set(BlockType.GRASS, new THREE.MeshLambertMaterial({ color: 0x228B22 }));
  }

  public generate() {
    // Generate a flat floor of bedrock
    for (let x = -5; x < 5; x++) {
      for (let z = -5; z < 5; z++) {
        this.setBlock(x, 0, z, BlockType.BEDROCK);
        for (let y = 1; y < 3; y++) {
             this.setBlock(x, y, z, BlockType.DIRT);
        }
        this.setBlock(x, 3, z, BlockType.GRASS);
      }
    }
    
    // Some features
    this.setBlock(0, 4, 0, BlockType.WOOD);
    this.setBlock(0, 5, 0, BlockType.WOOD);
    this.setBlock(0, 6, 0, BlockType.WOOD); // Tree trunk
  }

  public getBlock(x: number, y: number, z: number): BlockType {
    const key = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
    return this.blocks.get(key) || BlockType.AIR;
  }

  public setBlock(x: number, y: number, z: number, type: BlockType) {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const rz = Math.round(z);
    const key = `${rx},${ry},${rz}`;
    
    // Remove existing mesh
    if (this.meshes.has(key)) {
      const mesh = this.meshes.get(key)!;
      this.scene.remove(mesh);
      this.meshes.delete(key);
    }
    
    // Remove logical block
    if (type === BlockType.AIR) {
      this.blocks.delete(key);
      return;
    }

    this.blocks.set(key, type);
    
    // Add new mesh
    const props = BlockProperties[type];
    if (props && props.visible) {
      const material = this.materialMap.get(type);
      const mesh = new THREE.Mesh(this.geometry, material);
      mesh.position.set(rx, ry, rz);
      mesh.name = key; // Store key in name for raycasting
      
      this.scene.add(mesh);
      this.meshes.set(key, mesh);
    }
  }

  public getMeshes(): THREE.Object3D[] {
    return Array.from(this.meshes.values());
  }
}
