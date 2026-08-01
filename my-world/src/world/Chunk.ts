import * as THREE from 'three'
import { CHUNK_SIZE, CHUNK_HEIGHT } from '@/utils/constants'

/**
 * Chunk - 区块数据
 * 16 x 256 x 16 方块存储 + 高度图
 */
export class Chunk {
  public readonly blocks: Uint16Array
  public readonly chunkX: number
  public readonly chunkZ: number
  public dirty = true

  /** 高度图: 每列最高的非空气方块 Y，-1 表示空列 */
  public readonly heightmap: Int16Array

  constructor(chunkX: number, chunkZ: number) {
    this.chunkX = chunkX
    this.chunkZ = chunkZ
    this.blocks = new Uint16Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE)
    this.heightmap = new Int16Array(CHUNK_SIZE * CHUNK_SIZE)
    this.heightmap.fill(-1)
  }

  getBlock(x: number, y: number, z: number): number {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return 0
    }
    return this.blocks[this.getIndex(x, y, z)]
  }

  setBlock(x: number, y: number, z: number, type: number): void {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return
    }
    this.blocks[this.getIndex(x, y, z)] = type
    this.updateHeightmap(x, y, z, type)
    this.dirty = true
  }

  /** 更新列高度图 */
  private updateHeightmap(x: number, y: number, z: number, type: number): void {
    const colIdx = z * CHUNK_SIZE + x
    const isSolid = type !== 0 // AIR = 0

    if (isSolid && y > this.heightmap[colIdx]) {
      // 新方块比当前最高更高 → 提升高度图
      this.heightmap[colIdx] = y
    } else if (!isSolid && y === this.heightmap[colIdx]) {
      // 移除了当前最高方块 → 向下搜索新最高点
      let newMax = -1
      for (let sy = y - 1; sy >= 0; sy--) {
        if (this.blocks[this.getIndex(x, sy, z)] !== 0) {
          newMax = sy
          break
        }
      }
      this.heightmap[colIdx] = newMax
    }
  }

  /** 重建完整高度图 (区块生成后调用) */
  rebuildHeightmap(): void {
    this.heightmap.fill(-1)
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
          if (this.blocks[this.getIndex(x, y, z)] !== 0) {
            this.heightmap[z * CHUNK_SIZE + x] = y
            break
          }
        }
      }
    }
  }

  private getIndex(x: number, y: number, z: number): number {
    return y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x
  }

  getWorldPos(): THREE.Vector3 {
    return new THREE.Vector3(this.chunkX * CHUNK_SIZE, 0, this.chunkZ * CHUNK_SIZE)
  }

  fill(type: number): void {
    this.blocks.fill(type)
    const h = type !== 0 ? CHUNK_HEIGHT - 1 : -1
    this.heightmap.fill(h)
    this.dirty = true
  }
}
