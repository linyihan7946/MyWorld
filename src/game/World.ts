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
    const size = 32; // -32 to 32, roughly 64x64
    const height = 10;
    
    // Generate terrain
    for (let x = -size; x < size; x++) {
      for (let z = -size; z < size; z++) {
        this.setBlock(x, 0, z, BlockType.BEDROCK);
        
        // Simple Perlin-ish noise or random height
        const h = Math.floor(Math.abs(Math.sin(x * 0.1) * Math.cos(z * 0.1) * 5) + 3);
        
        for (let y = 1; y < h; y++) {
             this.setBlock(x, y, z, BlockType.DIRT);
        }
        this.setBlock(x, h, z, BlockType.GRASS);

        // Random features
        if (Math.random() > 0.98) {
          // Tree
          this.generateTree(x, h + 1, z);
        }
      }
    }
  }

  private generateTree(x: number, y: number, z: number) {
    for (let i = 0; i < 4; i++) {
      this.setBlock(x, y + i, z, BlockType.WOOD);
    }
    // Leaves
    for (let lx = x - 2; lx <= x + 2; lx++) {
      for (let lz = z - 2; lz <= z + 2; lz++) {
        for (let ly = y + 2; ly <= y + 4; ly++) {
          if (lx === x && lz === z && ly < y + 4) continue; // Don't replace trunk
          if (Math.abs(lx - x) + Math.abs(lz - z) + Math.abs(ly - (y + 2)) < 4) {
             this.setBlock(lx, ly, lz, BlockType.GRASS); // Using Grass as leaves for now, or add LEAVES type
          }
        }
      }
    }
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
