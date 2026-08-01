import { createNoise2D, createNoise3D } from 'simplex-noise'
import { Chunk } from './Chunk'
import { CHUNK_SIZE, CHUNK_HEIGHT } from '@/utils/constants'
import { BlockType } from '@/types/blocks'
import { BIOMES, type BiomeId, type BiomeDef } from './BiomeRegistry'
import { Village, PillagerOutpost, Shipwreck, AncientCity, Stronghold, NetherFortress, BastionRemnant, SoulSandValley, WarpedForest, EndShip } from './structures/Structures'
import type { Dimension } from '@/gameplay/PortalSystem'

/**
 * WorldGenerator — Minecraft-style multi-biome world generation.
 * Uses temperature + moisture noise layers to distribute 40+ biomes.
 */
export class WorldGenerator {
  private noise2D: ReturnType<typeof createNoise2D>
  private noise2D2: ReturnType<typeof createNoise2D>
  private noise3D: ReturnType<typeof createNoise3D>
  private tempNoise: ReturnType<typeof createNoise2D>
  private moistNoise: ReturnType<typeof createNoise2D>
  private treeNoise: ReturnType<typeof createNoise2D>
  private caveNoise: ReturnType<typeof createNoise3D>
  private lushNoise: ReturnType<typeof createNoise3D>
  private riverNoise: ReturnType<typeof createNoise2D>
  private superflat: boolean

  /** 当前维度（用于地形生成） */
  private currentDimension: Dimension = 'overworld'

  constructor(seed: number, superflat = false) {
    this.superflat = superflat
    const rng = (s: number) => this.seededRandom(s)
    this.noise2D  = createNoise2D(rng(seed))
    this.noise2D2 = createNoise2D(rng(seed + 1))
    this.noise3D  = createNoise3D(rng(seed + 2))
    this.tempNoise = createNoise2D(rng(seed + 3))
    this.moistNoise = createNoise2D(rng(seed + 4))
    this.treeNoise = createNoise2D(rng(seed + 5))
    this.caveNoise = createNoise3D(rng(seed + 6))
    this.lushNoise = createNoise3D(rng(seed + 7))
    this.riverNoise = createNoise2D(rng(seed + 8))
  }

  private seededRandom(seed: number): () => number {
    let s = seed
    return () => {
      s = (s * 16807 + 0) % 2147483647
      return (s - 1) / 2147483646
    }
  }

  /** 设置当前维度 */
  setDimension(dimension: Dimension): void {
    this.currentDimension = dimension
  }

  /**
   * 生成区块地形
   */
  generateChunk(chunk: Chunk): void {
    if (this.superflat) {
      this.generateFlatChunk(chunk)
      chunk.rebuildHeightmap()
      return
    }

    switch (this.currentDimension) {
      case 'nether': this.generateNetherChunk(chunk); return
      case 'end': this.generateEndChunk(chunk); return
      default: this.generateOverworldChunk(chunk)
    }
  }

  /** 主世界地形生成 */
  private generateOverworldChunk(chunk: Chunk): void {
    const worldX = chunk.chunkX * CHUNK_SIZE
    const worldZ = chunk.chunkZ * CHUNK_SIZE

    const treeOk = (x: number, z: number) =>
      x > 2 && x < CHUNK_SIZE - 2 && z > 2 && z < CHUNK_SIZE - 2

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const wx = worldX + x
        const wz = worldZ + z

        // Get height and biome
        const height = this.getHeight(wx, wz)
        const biome = this.getBiome(wx, wz)
        const biomeDef = BIOMES[biome]
        const waterLevel = 62
        // 提前退出：只遍历到最高方块的略上方（树木+10）
        const maxY = Math.min(CHUNK_HEIGHT - 1, Math.max(height, waterLevel) + 15)

        for (let y = 0; y <= maxY; y++) {
          let blockType = BlockType.AIR

          if (y === 0) {
            blockType = BlockType.BEDROCK
          } else if (y < height - 4) {
            blockType = BlockType.STONE
          } else if (y < height) {
            blockType = biomeDef.subsurface
          } else if (y === height) {
            blockType = biomeDef.surface
          } else if (y <= waterLevel && height < waterLevel) {
            // Ocean / river — fill with water above seabed
            if (y > height) blockType = BlockType.WATER
          }

          // Ore generation
          if (blockType === BlockType.STONE) {
            blockType = this.generateOre(wx, y, wz)
          }

          chunk.setBlock(x, y, z, blockType)
        }

        // Caves
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

        // Tree placement (biome-specific type and density)
        if (height > waterLevel && treeOk(x, z) && biomeDef.treeType) {
          const treeVal = this.treeNoise(wx * 0.5, wz * 0.5)
          if (treeVal > biomeDef.treeDensity) {
            this.placeTree(chunk, x, height + 1, z, biomeDef.treeType)
          }
        }
      }
    }

    // Structure placement (based on chunk coordinates)
    this.tryPlaceStructures(chunk)

    // 重建高度图（供网格生成器跳过空气层）
    chunk.rebuildHeightmap()
  }

  /** 下界地形生成 */
  private generateNetherChunk(chunk: Chunk): void {
    const worldX = chunk.chunkX * CHUNK_SIZE
    const worldZ = chunk.chunkZ * CHUNK_SIZE

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const wx = worldX + x
        const wz = worldZ + z

        // 下界地形：顶部 bedrock 天花板 + 中间空洞 + 底部 bedrock
        const terrainHeight = 32 + Math.floor(this.noise2D(wx * 0.02, wz * 0.02) * 12)
        const ceilingLow = 96 + Math.floor(this.noise2D2(wx * 0.015, wz * 0.015) * 12)

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          let blockType = BlockType.AIR

          if (y === 0) {
            blockType = BlockType.BEDROCK
          } else if (y < 5) {
            // 底部 bedrock + 一些 netherrack
            blockType = Math.random() < 0.6 ? BlockType.BEDROCK : BlockType.NETHERRACK
          } else if (y >= 122) {
            blockType = BlockType.BEDROCK
          } else if (y >= ceilingLow) {
            // 天花板：netherrack 混合 bedrock
            blockType = y >= 126 ? BlockType.BEDROCK : BlockType.NETHERRACK
          } else if (y <= terrainHeight) {
            blockType = BlockType.NETHERRACK
          }

          // 熔岩海（低处替换为岩浆）
          if (blockType === BlockType.NETHERRACK && y < 32 && y > 5) {
            const lavaNoise = this.noise3D(wx * 0.03, y * 0.05, wz * 0.03)
            if (lavaNoise > 0.55 && y < 20) {
              blockType = BlockType.MAGMA_BLOCK
            }
          }

          // 灵魂沙区域
          if (blockType === BlockType.NETHERRACK && y >= terrainHeight - 1 && y <= terrainHeight) {
            const soulNoise = this.noise2D2(wx * 0.04, wz * 0.04)
            if (soulNoise > 0.75) {
              blockType = BlockType.SOUL_SAND
            }
          }

          // 萤石簇（天花板附近）
          if (blockType === BlockType.NETHERRACK && y > 60 && y < 110) {
            const glowNoise = this.noise3D(wx * 0.1 + 10, y * 0.08, wz * 0.1 + 10)
            if (glowNoise > 0.88) {
              blockType = BlockType.GLOWSTONE
            }
          }

          // 下界石英矿
          if (blockType === BlockType.NETHERRACK && y > 10 && y < 114) {
            const quartzNoise = this.noise3D(wx * 0.12 + 300, y * 0.12, wz * 0.12)
            if (quartzNoise > 0.82) {
              blockType = BlockType.NETHER_QUARTZ_ORE
            }
          }

          // 黑曜石矿脉（极稀有，低层）
          if (blockType === BlockType.NETHERRACK && y > 8 && y < 22) {
            const debrisNoise = this.noise3D(wx * 0.15 + 600, y * 0.15, wz * 0.15)
            if (debrisNoise > 0.94) {
              blockType = BlockType.OBSIDIAN
            }
          }

          chunk.setBlock(x, y, z, blockType)
        }
      }
    }

    // 下界结构
    this.tryPlaceNetherStructures(chunk)
    chunk.rebuildHeightmap()
  }

  /** 末地地形生成 */
  private generateEndChunk(chunk: Chunk): void {
    const worldX = chunk.chunkX * CHUNK_SIZE
    const worldZ = chunk.chunkZ * CHUNK_SIZE

    // 末地中心浮岛距离
    const centerDist = Math.sqrt(worldX * worldX + worldZ * worldZ)

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const wx = worldX + x
        const wz = worldZ + z
        const dist = Math.sqrt(wx * wx + wz * wz)

        // 主岛在中心，外围是小浮岛
        let terrainHeight: number
        if (dist < 80) {
          // 主岛：中间高四周低
          terrainHeight = 56 + Math.floor((80 - dist) * 0.15)
        } else {
          // 外围浮岛：噪点控制
          const islandNoise = this.noise2D2(wx * 0.03, wz * 0.03)
          terrainHeight = 40 + Math.floor(islandNoise * 20)
          // 远处密度降低
          if (dist > 200 && Math.abs(islandNoise) < 0.3) {
            terrainHeight = 0 // 虚空
          }
        }

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          let blockType = BlockType.AIR

          if (y === 0 && terrainHeight > 0) {
            blockType = BlockType.BEDROCK
          } else if (y < terrainHeight - 3) {
            blockType = BlockType.END_STONE
          } else if (y < terrainHeight) {
            blockType = BlockType.END_STONE
          } else if (y === terrainHeight && terrainHeight > 0) {
            blockType = BlockType.END_STONE
          }

          chunk.setBlock(x, y, z, blockType)
        }

        // 黑曜石柱（主岛附近）
        if (dist < 50 && dist > 10 && terrainHeight > 45) {
          const pillarNoise = this.noise2D2(wx * 0.2, wz * 0.2)
          if (pillarNoise > 0.88) {
            const pillarHeight = 4 + Math.floor(Math.abs(this.noise2D(wx * 0.3, wz * 0.3)) * 8)
            for (let py = terrainHeight + 1; py <= terrainHeight + pillarHeight && py < CHUNK_HEIGHT; py++) {
              chunk.setBlock(x, py, z, BlockType.OBSIDIAN)
            }
          }
        }
      }
    }

    // 末地结构（末地船）
    this.tryPlaceEndStructures(chunk)
    chunk.rebuildHeightmap()
  }

  /** 下界结构放置 */
  private tryPlaceNetherStructures(chunk: Chunk): void {
    // Nether Fortress
    if (Math.abs(chunk.chunkX % 25) === 7 && Math.abs(chunk.chunkZ % 25) === 7) {
      new NetherFortress().placeInChunk(chunk, 0, 35, 0, true)
    }
    // Bastion Remnant
    if (Math.abs(chunk.chunkX % 31) === 13 && Math.abs(chunk.chunkZ % 31) === 13) {
      new BastionRemnant().placeInChunk(chunk, 0, 35, 0, true)
    }
    // Soul Sand Valley decoration
    if (Math.abs(chunk.chunkX % 13) === 3 && Math.abs(chunk.chunkZ % 13) === 3) {
      new SoulSandValley().placeInChunk(chunk, 0, 30, 0, true)
    }
    // Warped Forest decoration
    if (Math.abs(chunk.chunkX % 17) === 5 && Math.abs(chunk.chunkZ % 17) === 5) {
      new WarpedForest().placeInChunk(chunk, 0, 30, 0, true)
    }
  }

  /** 末地结构放置 */
  private tryPlaceEndStructures(chunk: Chunk): void {
    // End Ship
    if (Math.abs(chunk.chunkX % 23) === 11 && Math.abs(chunk.chunkZ % 23) === 11) {
      new EndShip().placeInChunk(chunk, 4, 45, 0, true)
    }
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
      if (biome.startsWith('plains') || biome === 'sunflower_plains' || biome === 'meadow') {
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
      if (height !== null && (biome === 'plains' || biome === 'sunflower_plains')) {
        const outpost = new PillagerOutpost()
        outpost.placeInChunk(chunk, 5, height, 5)
      }
    }

    // Shipwreck is the explicit underwater ruin exception, not a surface building.
    if (Math.abs(chunk.chunkX % 31) === 9 && Math.abs(chunk.chunkZ % 31) === 9 && this.getBiome(wx + 8, wz + 8).includes('ocean')) {
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

        if (height <= 63 || (biome !== 'plains' && biome !== 'sunflower_plains' && biome !== 'meadow')) return null

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
            this.placeTree(chunk, x, 4, z, 'oak')
          }
        }
      }
    }
  }

  // ── Temperature / moisture accessors ──

  getTemperature(wx: number, wz: number): number {
    return (this.tempNoise(wx * 0.0012, wz * 0.0012) + 1) / 2
  }

  getMoisture(wx: number, wz: number): number {
    return (this.moistNoise(wx * 0.0012, wz * 0.0012) + 1) / 2
  }

  /**
   * 获取地形高度 (combines base terrain + biome height).
   */
  getHeight(worldX: number, worldZ: number): number {
    if (this.superflat) return 3

    const biome = this.getBiome(worldX, worldZ)
    const def = BIOMES[biome]
    const base = this.noise2D(worldX * 0.005, worldZ * 0.005) * 30
    const detail = this.noise2D2(worldX * 0.02, worldZ * 0.02) * 5
    const hills = this.noise2D(worldX * 0.008, worldZ * 0.008) * def.heightVariation
    const biomeBase = def.heightBase + hills
    return Math.floor(biomeBase + base + detail)
  }

  /**
   * 获取生物群系 — temperature × moisture noise map.
   */
  getBiome(worldX: number, worldZ: number): BiomeId {
    // Continentalness (0 = deep ocean, 1 = inland)
    const continent = (this.noise2D2(worldX * 0.0015, worldZ * 0.0015) + 1) / 2
    const temp = this.getTemperature(worldX, worldZ)
    const moist = this.getMoisture(worldX, worldZ)

    // River carving (low continentalness + river noise)
    const riverVal = this.riverNoise(worldX * 0.004, worldZ * 0.004)
    const isRiver = continent > 0.25 && continent < 0.55 && Math.abs(riverVal) < 0.06
    if (isRiver) {
      return temp < 0.1 ? 'frozen_river' : 'river'
    }

    // Ocean / deep ocean
    if (continent < 0.28) {
      if (temp > 0.7) return 'warm_ocean'
      if (temp > 0.5) return 'lukewarm_ocean'
      if (temp < 0.1) return continent < 0.18 ? 'frozen_ocean' : 'cold_ocean'
      return continent < 0.18 ? 'deep_ocean' : 'ocean'
    }

    // Beach / shore transition
    if (continent < 0.35) {
      if (temp < 0.1) return 'snowy_beach'
      if (temp > 0.6 && moist < 0.3) return 'beach'
      return moist < 0.35 ? 'beach' : 'stony_shore'
    }

    // Mushroom fields (very rare)
    if (Math.abs(continent - 0.55) < 0.03 && Math.abs(moist - 0.85) < 0.04) {
      return 'mushroom_fields'
    }

    // Mountains — high continentalness
    if (continent > 0.72) {
      if (continent > 0.85) {
        if (temp < 0.1) return 'frozen_peaks'
        if (temp > 0.6) return 'stony_peaks'
        return 'jagged_peaks'
      }
      if (temp < 0.15) return 'grove'
      if (temp < 0.35) return 'windswept_forest'
      if (moist > 0.55) return 'windswept_forest'
      if (temp > 0.65) return 'stony_peaks'
      if (moist < 0.2) return 'windswept_gravelly_hills'
      if (continent > 0.78) return 'meadow'
      return 'windswept_hills'
    }

    // Hot + dry → desert variants
    if (temp > 0.7 && moist < 0.2) {
      if (continent > 0.62) return 'badlands'
      return 'desert'
    }
    if (temp > 0.65 && moist < 0.1) return 'wooded_badlands'

    // Hot + wet → jungle variants
    if (temp > 0.65 && moist > 0.7) {
      if (moist > 0.85) return 'jungle'
      if (temp > 0.7) return 'sparse_jungle'
      return 'bamboo_jungle'
    }

    // Hot + medium → savanna
    if (temp > 0.65) {
      return continent > 0.62 ? 'savanna_plateau' : 'savanna'
    }

    // Cold → snowy / taiga variants
    if (temp < 0.2) {
      if (moist > 0.5) return temp < 0.08 ? 'snowy_taiga' : 'taiga'
      if (moist > 0.35) return 'old_growth_taiga'
      if (temp < 0.05) return 'ice_spikes'
      return 'snowy_plains'
    }
    if (temp < 0.3 && moist > 0.45) return 'taiga'

    // Wet → forest variants
    if (moist > 0.65) {
      if (temp < 0.35) return 'dark_forest'
      if (continent > 0.6) return 'flower_forest'
      return 'forest'
    }
    if (moist > 0.45 && temp > 0.3) {
      return moist > 0.55 ? 'birch_forest' : 'forest'
    }

    // Swamp (warm + very wet + low elevation)
    if (temp > 0.5 && moist > 0.75 && continent < 0.55) {
      return temp > 0.6 ? 'mangrove_swamp' : 'swamp'
    }

    // Default: plains
    return 'plains'
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

    // Steel: extremely rare, deepest level, below y=12
    if (y < 12) {
      const steelNoise = this.noise3D(worldX * 0.18 + 500, y * 0.18, worldZ * 0.18)
      if (steelNoise > 0.92) return BlockType.STEEL_ORE
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
   * 放置树木 — supports oak, spruce, birch, jungle, acacia, dark oak.
   */
  private placeTree(chunk: Chunk, x: number, y: number, z: number, type: string): void {
    switch (type) {
      case 'spruce':   this.placeSpruceTree(chunk, x, y, z); break
      case 'birch':    this.placeBirchTree(chunk, x, y, z); break
      case 'jungle':   this.placeJungleTree(chunk, x, y, z); break
      case 'acacia':   this.placeAcaciaTree(chunk, x, y, z); break
      case 'dark_oak': this.placeDarkOakTree(chunk, x, y, z); break
      default:         this.placeOakTree(chunk, x, y, z); break
    }
  }

  private placeOakTree(chunk: Chunk, x: number, y: number, z: number): void {
    const trunkH = 4 + Math.floor(Math.random() * 2)
    for (let h = 0; h < trunkH; h++) {
      if (y + h < CHUNK_HEIGHT) chunk.setBlock(x, y + h, z, BlockType.OAK_LOG)
    }
    const ls = y + trunkH - 2, le = y + trunkH + 1
    for (let ly = ls; ly <= le; ly++) {
      const r = ly === le ? 1 : 2
      for (let lx = -r; lx <= r; lx++) for (let lz = -r; lz <= r; lz++) {
        if (Math.abs(lx) === r && Math.abs(lz) === r && Math.random() > 0.5) continue
        const bx = x + lx, bz = z + lz
        if (bx >= 0 && bx < CHUNK_SIZE && bz >= 0 && bz < CHUNK_SIZE && ly < CHUNK_HEIGHT) {
          if (chunk.getBlock(bx, ly, bz) === BlockType.AIR) chunk.setBlock(bx, ly, bz, BlockType.OAK_LEAVES)
        }
      }
    }
  }

  private placeSpruceTree(chunk: Chunk, x: number, y: number, z: number): void {
    const trunkH = 6 + Math.floor(Math.random() * 4)
    for (let h = 0; h < trunkH; h++) {
      if (y + h < CHUNK_HEIGHT) chunk.setBlock(x, y + h, z, BlockType.SPRUCE_LOG)
    }
    // Conical leaf shape
    for (let ly = y + 1; ly <= y + trunkH + 1; ly++) {
      const r = Math.max(0, 1 + Math.floor((trunkH - (ly - y)) / 2))
      for (let lx = -r; lx <= r; lx++) for (let lz = -r; lz <= r; lz++) {
        if (ly >= CHUNK_HEIGHT) continue
        const bx = x + lx, bz = z + lz
        if (bx >= 0 && bx < CHUNK_SIZE && bz >= 0 && bz < CHUNK_SIZE) {
          if (chunk.getBlock(bx, ly, bz) === BlockType.AIR) chunk.setBlock(bx, ly, bz, BlockType.SPRUCE_LEAVES)
        }
      }
    }
  }

  private placeBirchTree(chunk: Chunk, x: number, y: number, z: number): void {
    const trunkH = 5 + Math.floor(Math.random() * 2)
    for (let h = 0; h < trunkH; h++) {
      if (y + h < CHUNK_HEIGHT) chunk.setBlock(x, y + h, z, BlockType.BIRCH_LOG)
    }
    const ls = y + trunkH - 2, le = y + trunkH + 1
    for (let ly = ls; ly <= le; ly++) {
      const r = ly === le ? 1 : 2
      for (let lx = -r; lx <= r; lx++) for (let lz = -r; lz <= r; lz++) {
        if (Math.abs(lx) === r && Math.abs(lz) === r && Math.random() > 0.4) continue
        const bx = x + lx, bz = z + lz
        if (bx >= 0 && bx < CHUNK_SIZE && bz >= 0 && bz < CHUNK_SIZE && ly < CHUNK_HEIGHT) {
          if (chunk.getBlock(bx, ly, bz) === BlockType.AIR) chunk.setBlock(bx, ly, bz, BlockType.BIRCH_LEAVES)
        }
      }
    }
  }

  private placeJungleTree(chunk: Chunk, x: number, y: number, z: number): void {
    const trunkH = 8 + Math.floor(Math.random() * 5)
    for (let h = 0; h < trunkH; h++) {
      if (y + h < CHUNK_HEIGHT) chunk.setBlock(x, y + h, z, BlockType.JUNGLE_LOG)
    }
    // Wide canopy
    const ls = y + trunkH - 3, le = y + trunkH + 1
    for (let ly = ls; ly <= le; ly++) {
      const r = ly >= y + trunkH - 1 ? 2 : 3
      for (let lx = -r; lx <= r; lx++) for (let lz = -r; lz <= r; lz++) {
        if (Math.abs(lx) === r && Math.abs(lz) === r && Math.random() > 0.4) continue
        const bx = x + lx, bz = z + lz
        if (bx >= 0 && bx < CHUNK_SIZE && bz >= 0 && bz < CHUNK_SIZE && ly < CHUNK_HEIGHT) {
          if (chunk.getBlock(bx, ly, bz) === BlockType.AIR) chunk.setBlock(bx, ly, bz, BlockType.JUNGLE_LEAVES)
        }
      }
    }
  }

  private placeAcaciaTree(chunk: Chunk, x: number, y: number, z: number): void {
    const trunkH = 4 + Math.floor(Math.random() * 3)
    for (let h = 0; h < trunkH; h++) {
      if (y + h < CHUNK_HEIGHT) chunk.setBlock(x, y + h, z, BlockType.ACACIA_LOG)
    }
    // Flat canopy
    const ls = y + trunkH - 1, le = y + trunkH + 1
    for (let ly = ls; ly <= le; ly++) {
      const r = ly >= y + trunkH ? 3 : 2
      for (let lx = -r; lx <= r; lx++) for (let lz = -r; lz <= r; lz++) {
        if (Math.abs(lx) === r && Math.abs(lz) === r && Math.random() > 0.5) continue
        const bx = x + lx, bz = z + lz
        if (bx >= 0 && bx < CHUNK_SIZE && bz >= 0 && bz < CHUNK_SIZE && ly < CHUNK_HEIGHT) {
          if (chunk.getBlock(bx, ly, bz) === BlockType.AIR) chunk.setBlock(bx, ly, bz, BlockType.ACACIA_LEAVES)
        }
      }
    }
  }

  private placeDarkOakTree(chunk: Chunk, x: number, y: number, z: number): void {
    // 2×2 trunk
    const trunkH = 5 + Math.floor(Math.random() * 3)
    for (let h = 0; h < trunkH; h++) {
      for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) {
        if (y + h < CHUNK_HEIGHT) chunk.setBlock(x + dx, y + h, z + dz, BlockType.DARK_OAK_LOG)
      }
    }
    const ls = y + trunkH - 2, le = y + trunkH + 1
    for (let ly = ls; ly <= le; ly++) {
      const r = ly === le ? 1 : 3
      for (let lx = -r; lx <= r + 1; lx++) for (let lz = -r; lz <= r + 1; lz++) {
        if (Math.abs(lx) === r + 1 && Math.abs(lz) === r + 1 && Math.random() > 0.4) continue
        const bx = x + lx, bz = z + lz
        if (bx >= 0 && bx < CHUNK_SIZE && bz >= 0 && bz < CHUNK_SIZE && ly < CHUNK_HEIGHT) {
          if (chunk.getBlock(bx, ly, bz) === BlockType.AIR) chunk.setBlock(bx, ly, bz, BlockType.DARK_OAK_LEAVES)
        }
      }
    }
  }
}
