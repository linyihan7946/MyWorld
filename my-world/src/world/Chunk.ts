import * as THREE from 'three'
import { CHUNK_SIZE, CHUNK_HEIGHT } from '@/utils/constants'

/**
 * Chunk - 区块数据
 * 16 x 256 x 16 方块存储
 */
export class Chunk {
  public readonly blocks: Uint16Array
  public readonly chunkX: number
  public readonly chunkZ: number
  public dirty = true // 需要重新生成网格

  constructor(chunkX: number, chunkZ: number) {
    this.chunkX = chunkX
    this.chunkZ = chunkZ
    this.blocks = new Uint16Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE)
  }

  /**
   * 获取方块类型
   */
  getBlock(x: number, y: number, z: number): number {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return 0 // AIR
    }
    return this.blocks[this.getIndex(x, y, z)]
  }

  /**
   * 设置方块类型
   */
  setBlock(x: number, y: number, z: number, type: number): void {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return
    }
    this.blocks[this.getIndex(x, y, z)] = type
    this.dirty = true
  }

  /**
   * 获取扁平数组索引
   */
  private getIndex(x: number, y: number, z: number): number {
    return y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x
  }

  /**
   * 获取世界坐标
   */
  getWorldPos(): THREE.Vector3 {
    return new THREE.Vector3(
      this.chunkX * CHUNK_SIZE,
      0,
      this.chunkZ * CHUNK_SIZE
    )
  }

  /**
   * 填充整个区块为一种方块
   */
  fill(type: number): void {
    this.blocks.fill(type)
    this.dirty = true
  }
}
