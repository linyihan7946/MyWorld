import { createNoise2D, createNoise3D } from 'simplex-noise'
import { Chunk } from './Chunk'
import { CHUNK_SIZE, CHUNK_HEIGHT } from '@/utils/constants'
import { BlockType } from '@/types/blocks'
import { Village, PillagerOutpost, Shipwreck, AncientCity, Stronghold } from './structures/Structures'

/**
 * WorldGenerator - 程序化世界生成
 */
export class WorldGenerator {
  private noise2D: ReturnType<typeof createNoise2D>
  private noise2D2: ReturnType<typeof createNoise2D>
  private noise3D: ReturnType<typeof createNoise3D>
  private biomeNoise: ReturnType<typeof createNoise2D>
  private treeNoise: ReturnType<typeof createNoise2D>
  private caveNoise: ReturnType<typeof createNoise3D>
  private lushNoise: ReturnType<typeof createNoise3D>
  private superflat: boolean

  constructor(seed: number, superflat = false) {
    this.superflat = superflat
    // Create seeded random
    const rng = this.seededRandom(seed)
    const rng2 = this.seededRandom(seed + 1)
    const rng3 = this.seededRandom(seed + 2)
    const rng4 = this.seededRandom(seed + 3)
    const rng5 = this.seededRandom(seed + 4)
    const rng6 = this.seededRandom(seed + 5)
    const rng7 = this.seededRandom(seed + 6)

    this.noise2D = createNoise2D(rng)
    this.noise2D2 = createNoise2D(rng2)
    this.noise3D = createNoise3D(rng3)
    this.biomeNoise = createNoise2D(rng4)
    this.treeNoise = createNoise2D(rng5)
    this.caveNoise = createNoise3D(rng6)
    this.lushNoise = createNoise3D(rng7)
  }

  private seededRandom(seed: number): () => number {
    let s = seed
    return () => {
      s = (s * 16807 + 0) % 2147483647
      return (s - 1) / 2147483646
    }
  }

  /**
   * 生成区块地形
   */
  generateChunk(chunk: Chunk): void {
    const worldX = chunk.chunkX * CHUNK_SIZE
    const worldZ = chunk.chunkZ * CHUNK_SIZE

    if (this.superflat) {
      this.generateFlatChunk(chunk)
      return
    }

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const wx = worldX + x
        const wz = worldZ + z

        // Get height
        const height = this.getHeight(wx, wz)
        const biome = this.getBiome(wx, wz)

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          let blockType = BlockType.AIR

          if (y === 0) {
            blockType = BlockType.BEDROCK
          } else if (y < height - 4) {
            blockType = BlockType.STONE
          } else if (y < height) {
            blockType = this.getSubsurface(biome)
          } else if (y === height) {
            blockType = this.getSurface(biome)
          } else if (y <= 62 && blockType === BlockType.AIR) {
            // Water level
            blockType = BlockType.WATER
          }

          // Ore generation
          if (blockType === BlockType.STONE) {
            blockType = this.generateOre(wx, y, wz)
          }

          chunk.setBlock(x, y, z, blockType)
        }

        // Continuous underground cave tunnels. A second noise field marks lush
        // sections with moss, clay and ceiling light so they remain navigable.
        for (let y = 5; y < Math.min(height - 4, 58); y++) {
          if (!this.isCave(wx, y, wz)) continue
          chunk.setBlock(x, y, z, BlockType.AIR)
          if (!this.isLushCave(wx, y, wz)) continue
          if (!this.isCave(wx, y - 1, wz)) {
            const floor = this.lushNoise(wx * 0.18, y * 0.18, wz * 0.18) > 0.35
              ? BlockType.MOSSY_COBBLESTONE : BlockType.CLAY
            chunk.setBlock(x, y - 1, z, floor)
          }
          if (!this.isCave(wx, y + 1, wz) && this.lushNoise(wx * 0.31 + 90, y * 0.31, wz * 0.31) > 0.74) {
            chunk.setBlock(x, y + 1, z, BlockType.GLOWSTONE)
          }
        }

        // Tree placement
        if (height > 62 && biome === 'forest') {
          const treeVal = this.treeNoise(wx * 0.5, wz * 0.5)
          if (treeVal > 0.7 && x > 2 && x < CHUNK_SIZE - 2 && z > 2 && z < CHUNK_SIZE - 2) {
            this.placeTree(chunk, x, height + 1, z)
          }
        } else if (height > 62 && biome === 'plains') {
          const treeVal = this.treeNoise(wx * 0.5, wz * 0.5)
          if (treeVal > 0.9 && x > 2 && x < CHUNK_SIZE - 2 && z > 2 && z < CHUNK_SIZE - 2) {
            this.placeTree(chunk, x, height + 1, z)
          }
        }
      }
    }

    // Structure placement (based on chunk coordinates)
    this.tryPlaceStructures(chunk)
  }

  /**
   * 尝试在区块中放置建筑物
   */
  private tryPlaceStructures(chunk: Chunk): void {
    const wx = chunk.chunkX * CHUNK_SIZE
    const wz = chunk.chunkZ * CHUNK_SIZE

    // Village in plains (every ~20 chunks) - only on flat land above water
    if (Math.abs(chunk.chunkX % 20) < 2 && Math.abs(chunk.chunkZ % 20) < 2) {
      const biome = this.getBiome(wx + 8, wz + 8)
      if (biome === 'plains') {
        const height = this.getFlatFoundationHeight(wx, wz, CHUNK_SIZE, CHUNK_SIZE)
        if (height !== null) {
          const village = new Village()
          // 留出两格边距，村庄道路和主体都不会绕回区块另一侧。
          village.placeInChunk(chunk, 2, height, 2)
        }
      }
    }

    // Surface buildings only appear on a fully plains, nearly level footprint.
    if (chunk.chunkX % 30 === 5 && chunk.chunkZ % 30 === 5) {
      const center = wx + 8
      const centerZ = wz + 8
      const biome = this.getBiome(center, centerZ)
      const height = this.getFlatFoundationHeight(wx + 2, wz + 2, 11, 11)
      if (height !== null && biome === 'plains') {
        const outpost = new PillagerOutpost()
        outpost.placeInChunk(chunk, 5, height, 5)
      }
    }

    // Shipwreck is the explicit underwater ruin exception, not a surface building.
    if (Math.abs(chunk.chunkX % 31) === 9 && Math.abs(chunk.chunkZ % 31) === 9 && this.getBiome(wx + 8, wz + 8) === 'ocean') {
      const shipwreck = new Shipwreck()
      shipwreck.placeInChunk(chunk, 4, Math.min(56, this.getHeight(wx + 8, wz + 8) + 1), 0, false)
    }

    // Rare underground landmarks. Direct placement preserves the terrain above.
    if (Math.abs(chunk.chunkX % 47) === 12 && Math.abs(chunk.chunkZ % 47) === 12) {
      new AncientCity().placeInChunk(chunk, 0, 14, 0, false)
    }
    if (Math.abs(chunk.chunkX % 53) === 17 && Math.abs(chunk.chunkZ % 53) === 17) {
      new Stronghold().placeInChunk(chunk, 0, 26, 0, false)
    }
  }

  /**
   * 返回可用于建筑地基的高度。整个占地逐格检查，任一点位于水面、
   * 海洋/沙滩或总高度差超过一格时都拒绝生成。
   */
  private getFlatFoundationHeight(
    startX: number,
    startZ: number,
    width: number,
    depth: number,
  ): number | null {
    let minHeight = Infinity
    let maxHeight = -Infinity

    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < depth; dz++) {
        const worldX = startX + dx
        const worldZ = startZ + dz
        const height = this.getHeight(worldX, worldZ)
        const biome = this.getBiome(worldX, worldZ)

        if (height <= 63 || biome !== 'plains') return null

        minHeight = Math.min(minHeight, height)
        maxHeight = Math.max(maxHeight, height)
        if (maxHeight - minHeight > 1) return null
      }
    }

    return maxHeight
  }

  /**
   * 超平坦世界区块生成
   * 层: 基岩 → 泥土×2 → 草方块, 高度=3
   */
  private generateFlatChunk(chunk: Chunk): void {
    const worldX = chunk.chunkX * CHUNK_SIZE
    const worldZ = chunk.chunkZ * CHUNK_SIZE

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const wx = worldX + x
        const wz = worldZ + z

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          let blockType = BlockType.AIR
          if (y === 0) blockType = BlockType.BEDROCK
          else if (y <= 2) blockType = BlockType.DIRT
          else if (y === 3) blockType = BlockType.GRASS_BLOCK

          chunk.setBlock(x, y, z, blockType)
        }

        // 少量随机树木装饰
        if (x > 2 && x < CHUNK_SIZE - 2 && z > 2 && z < CHUNK_SIZE - 2) {
          const treeVal = this.treeNoise(wx * 0.5, wz * 0.5)
          if (treeVal > 0.92) {
            this.placeTree(chunk, x, 4, z)
          }
        }
      }
    }
  }

  /**
   * 获取地形高度
   */
  getHeight(worldX: number, worldZ: number): number {
    if (this.superflat) return 3

    // Multi-octave noise for terrain
    const base = this.noise2D(worldX * 0.005, worldZ * 0.005) * 40
    const detail = this.noise2D2(worldX * 0.02, worldZ * 0.02) * 10
    const hills = this.noise2D(worldX * 0.01, worldZ * 0.01) * 20

    return Math.floor(64 + base + detail + hills)
  }

  /**
   * 获取生物群系
   */
  getBiome(worldX: number, worldZ: number): string {
    const val = this.biomeNoise(worldX * 0.003, worldZ * 0.003)
    const moisture = this.noise2D2(worldX * 0.004, worldZ * 0.004)

    if (val < -0.3) return 'ocean'
    if (val < -0.1) return 'beach'
    if (val > 0.4 && moisture < -0.2) return 'desert'
    if (moisture > 0.3) return 'forest'
    if (moisture > 0.1 && val > 0.2) return 'jungle'
    return 'plains'
  }

  private getSurface(biome: string): BlockType {
    switch (biome) {
      case 'desert': return BlockType.SAND
      case 'beach': return BlockType.SAND
      case 'ocean': return BlockType.SAND
      default: return BlockType.GRASS_BLOCK
    }
  }

  private getSubsurface(biome: string): BlockType {
    switch (biome) {
      case 'desert': return BlockType.SAND
      case 'beach': return BlockType.SAND
      default: return BlockType.DIRT
    }
  }

  /**
   * 矿石生成
   */
  private generateOre(worldX: number, y: number, worldZ: number): BlockType {
    // Coal: common, any height
    if (y < 128) {
      const coalNoise = this.noise3D(worldX * 0.1, y * 0.1, worldZ * 0.1)
      if (coalNoise > 0.7) return BlockType.COAL_ORE
    }

    // Iron: medium, below y=64
    if (y < 64) {
      const ironNoise = this.noise3D(worldX * 0.12 + 100, y * 0.12, worldZ * 0.12)
      if (ironNoise > 0.75) return BlockType.IRON_ORE
    }

    // Gold: rare, below y=32
    if (y < 32) {
      const goldNoise = this.noise3D(worldX * 0.15 + 200, y * 0.15, worldZ * 0.15)
      if (goldNoise > 0.8) return BlockType.GOLD_ORE
    }

    // Diamond: very rare, below y=16
    if (y < 16) {
      const diamondNoise = this.noise3D(worldX * 0.15 + 300, y * 0.15, worldZ * 0.15)
      if (diamondNoise > 0.85) return BlockType.DIAMOND_ORE
    }

    return BlockType.STONE
  }

  private isCave(worldX: number, y: number, worldZ: number): boolean {
    const tunnel = this.caveNoise(worldX * 0.035, y * 0.045, worldZ * 0.035)
    const chamber = this.caveNoise(worldX * 0.012 + 120, y * 0.018, worldZ * 0.012)
    return tunnel > 0.56 || (chamber > 0.7 && y < 46)
  }

  private isLushCave(worldX: number, y: number, worldZ: number): boolean {
    return y < 52 && this.lushNoise(worldX * 0.012, y * 0.018, worldZ * 0.012) > 0.48
  }

  /**
   * 放置树木
   */
  private placeTree(chunk: Chunk, x: number, y: number, z: number): void {
    const trunkHeight = 4 + Math.floor(Math.random() * 2)

    // Trunk
    for (let h = 0; h < trunkHeight; h++) {
      if (y + h < CHUNK_HEIGHT) {
        chunk.setBlock(x, y + h, z, BlockType.OAK_LOG)
      }
    }

    // Leaves
    const leafStart = y + trunkHeight - 2
    const leafEnd = y + trunkHeight + 1
    for (let ly = leafStart; ly <= leafEnd; ly++) {
      const radius = ly === leafEnd ? 1 : 2
      for (let lx = -radius; lx <= radius; lx++) {
        for (let lz = -radius; lz <= radius; lz++) {
          if (Math.abs(lx) === radius && Math.abs(lz) === radius && Math.random() > 0.5) continue
          const bx = x + lx
          const bz = z + lz
          if (bx >= 0 && bx < CHUNK_SIZE && bz >= 0 && bz < CHUNK_SIZE && ly < CHUNK_HEIGHT) {
            if (chunk.getBlock(bx, ly, bz) === BlockType.AIR) {
              chunk.setBlock(bx, ly, bz, BlockType.OAK_LEAVES)
            }
          }
        }
      }
    }
  }
}
