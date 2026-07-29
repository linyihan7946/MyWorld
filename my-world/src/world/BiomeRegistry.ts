/**
 * BiomeRegistry — all Minecraft biomes with terrain, vegetation, and colour properties.
 */
import { BlockType } from '@/types/blocks'

export type BiomeId = string

export interface BiomeDef {
  id: BiomeId
  name: string
  /** Surface block (top layer at height). */
  surface: BlockType
  /** Sub-surface blocks (3–4 layers below surface). */
  subsurface: BlockType
  /** Height offset added to base terrain height. */
  heightBase: number     // base height (default 64)
  heightVariation: number // amplitude of extra variation
  /** Tree type — null = no trees. */
  treeType: 'oak' | 'spruce' | 'birch' | 'jungle' | 'acacia' | 'dark_oak' | null
  /** Tree density threshold (higher = fewer trees). */
  treeDensity: number
  /** Grass / foliage colour tint in 0xRRGGBB. */
  grassColor: number
  /** Water surface colour override (null = default). */
  waterColor: number | null
  /** Temperature 0..1 (cold → hot). */
  temperature: number
  /** Moisture 0..1 (dry → wet). */
  moisture: number
}

// ── Biome definitions ──────────────────────────────────────────────────

const G = BlockType.GRASS_BLOCK
const D = BlockType.DIRT
const S = BlockType.SAND
const R = BlockType.RED_SAND
const W = BlockType.WATER
const T = BlockType.TERRACOTTA
const C = BlockType.DIRT

export const BIOMES: Record<BiomeId, BiomeDef> = {

  // ═══ Plains family ═══
  plains: {
    id: 'plains', name: '平原',
    surface: G, subsurface: D,
    heightBase: 64, heightVariation: 3,
    treeType: 'oak', treeDensity: 0.92,
    grassColor: 0x7CBD6B, waterColor: null,
    temperature: 0.5, moisture: 0.4,
  },
  sunflower_plains: {
    id: 'sunflower_plains', name: '向日葵平原',
    surface: G, subsurface: D,
    heightBase: 64, heightVariation: 3,
    treeType: 'oak', treeDensity: 0.95,
    grassColor: 0x8CCD7B, waterColor: null,
    temperature: 0.5, moisture: 0.4,
  },

  // ═══ Forest family ═══
  forest: {
    id: 'forest', name: '森林',
    surface: G, subsurface: D,
    heightBase: 66, heightVariation: 6,
    treeType: 'oak', treeDensity: 0.65,
    grassColor: 0x5DA84D, waterColor: null,
    temperature: 0.5, moisture: 0.7,
  },
  flower_forest: {
    id: 'flower_forest', name: '繁花森林',
    surface: G, subsurface: D,
    heightBase: 66, heightVariation: 6,
    treeType: 'oak', treeDensity: 0.75,
    grassColor: 0x6DB85D, waterColor: null,
    temperature: 0.5, moisture: 0.8,
  },
  birch_forest: {
    id: 'birch_forest', name: '白桦森林',
    surface: G, subsurface: D,
    heightBase: 66, heightVariation: 5,
    treeType: 'birch', treeDensity: 0.6,
    grassColor: 0x7BBF6B, waterColor: null,
    temperature: 0.5, moisture: 0.6,
  },
  dark_forest: {
    id: 'dark_forest', name: '黑森林',
    surface: G, subsurface: D,
    heightBase: 66, heightVariation: 8,
    treeType: 'dark_oak', treeDensity: 0.4,
    grassColor: 0x4D903D, waterColor: null,
    temperature: 0.5, moisture: 0.75,
  },

  // ═══ Taiga family ═══
  taiga: {
    id: 'taiga', name: '针叶林',
    surface: G, subsurface: D,
    heightBase: 66, heightVariation: 8,
    treeType: 'spruce', treeDensity: 0.55,
    grassColor: 0x80A865, waterColor: null,
    temperature: 0.2, moisture: 0.5,
  },
  snowy_taiga: {
    id: 'snowy_taiga', name: '积雪针叶林',
    surface: BlockType.SNOW_BLOCK, subsurface: D,
    heightBase: 66, heightVariation: 8,
    treeType: 'spruce', treeDensity: 0.6,
    grassColor: 0x90B875, waterColor: null,
    temperature: 0.05, moisture: 0.5,
  },
  old_growth_taiga: {
    id: 'old_growth_taiga', name: '原始针叶林',
    surface: G, subsurface: D,
    heightBase: 68, heightVariation: 10,
    treeType: 'spruce', treeDensity: 0.35,
    grassColor: 0x709058, waterColor: null,
    temperature: 0.2, moisture: 0.6,
  },

  // ═══ Snowy family ═══
  snowy_plains: {
    id: 'snowy_plains', name: '积雪平原',
    surface: BlockType.SNOW_BLOCK, subsurface: D,
    heightBase: 64, heightVariation: 2,
    treeType: null, treeDensity: 1,
    grassColor: 0xA0C090, waterColor: 0x3D57D6,
    temperature: 0.0, moisture: 0.3,
  },
  ice_spikes: {
    id: 'ice_spikes', name: '冰刺之地',
    surface: BlockType.SNOW_BLOCK, subsurface: BlockType.PACKED_ICE,
    heightBase: 66, heightVariation: 4,
    treeType: null, treeDensity: 1,
    grassColor: 0xB0D0A0, waterColor: 0x3D57D6,
    temperature: 0.0, moisture: 0.2,
  },

  // ═══ Desert family ═══
  desert: {
    id: 'desert', name: '沙漠',
    surface: S, subsurface: S,
    heightBase: 64, heightVariation: 4,
    treeType: null, treeDensity: 1,
    grassColor: 0xBFB755, waterColor: 0x32A598,
    temperature: 0.9, moisture: 0.05,
  },
  savanna: {
    id: 'savanna', name: '热带草原',
    surface: G, subsurface: D,
    heightBase: 66, heightVariation: 5,
    treeType: 'acacia', treeDensity: 0.85,
    grassColor: 0x9AB055, waterColor: null,
    temperature: 0.8, moisture: 0.15,
  },
  savanna_plateau: {
    id: 'savanna_plateau', name: '热带高原',
    surface: G, subsurface: D,
    heightBase: 80, heightVariation: 8,
    treeType: 'acacia', treeDensity: 0.88,
    grassColor: 0x8AA845, waterColor: null,
    temperature: 0.8, moisture: 0.1,
  },
  badlands: {
    id: 'badlands', name: '恶地',
    surface: T, subsurface: T,
    heightBase: 74, heightVariation: 20,
    treeType: null, treeDensity: 1,
    grassColor: 0x9E814D, waterColor: 0x4E7F81,
    temperature: 0.9, moisture: 0.02,
  },
  wooded_badlands: {
    id: 'wooded_badlands', name: '疏林恶地',
    surface: T, subsurface: T,
    heightBase: 74, heightVariation: 18,
    treeType: 'oak', treeDensity: 0.9,
    grassColor: 0x8E7140, waterColor: 0x4E7F81,
    temperature: 0.85, moisture: 0.05,
  },

  // ═══ Jungle family ═══
  jungle: {
    id: 'jungle', name: '丛林',
    surface: G, subsurface: D,
    heightBase: 66, heightVariation: 10,
    treeType: 'jungle', treeDensity: 0.3,
    grassColor: 0x3D9E2D, waterColor: null,
    temperature: 0.75, moisture: 0.85,
  },
  sparse_jungle: {
    id: 'sparse_jungle', name: '稀疏丛林',
    surface: G, subsurface: D,
    heightBase: 66, heightVariation: 8,
    treeType: 'jungle', treeDensity: 0.6,
    grassColor: 0x4DAE3D, waterColor: null,
    temperature: 0.75, moisture: 0.75,
  },
  bamboo_jungle: {
    id: 'bamboo_jungle', name: '竹林',
    surface: G, subsurface: D,
    heightBase: 66, heightVariation: 6,
    treeType: 'jungle', treeDensity: 0.5,
    grassColor: 0x5DBF4D, waterColor: null,
    temperature: 0.75, moisture: 0.8,
  },

  // ═══ Swamp family ═══
  swamp: {
    id: 'swamp', name: '沼泽',
    surface: G, subsurface: D,
    heightBase: 62, heightVariation: 2,
    treeType: 'oak', treeDensity: 0.75,
    grassColor: 0x5A6B3F, waterColor: 0x617B64,
    temperature: 0.6, moisture: 0.9,
  },
  mangrove_swamp: {
    id: 'mangrove_swamp', name: '红树林沼泽',
    surface: G, subsurface: BlockType.CLAY ?? D,
    heightBase: 62, heightVariation: 2,
    treeType: 'oak', treeDensity: 0.7,
    grassColor: 0x6A7B4F, waterColor: 0x3D6B54,
    temperature: 0.65, moisture: 0.9,
  },

  // ═══ Mountain / Hill family ═══
  windswept_hills: {
    id: 'windswept_hills', name: '风袭丘陵',
    surface: G, subsurface: D,
    heightBase: 80, heightVariation: 28,
    treeType: 'oak', treeDensity: 0.93,
    grassColor: 0x7CB860, waterColor: null,
    temperature: 0.35, moisture: 0.45,
  },
  windswept_forest: {
    id: 'windswept_forest', name: '风袭森林',
    surface: G, subsurface: D,
    heightBase: 80, heightVariation: 26,
    treeType: 'spruce', treeDensity: 0.65,
    grassColor: 0x6CA850, waterColor: null,
    temperature: 0.3, moisture: 0.5,
  },
  windswept_gravelly_hills: {
    id: 'windswept_gravelly_hills', name: '沙砾山地',
    surface: BlockType.GRAVEL, subsurface: D,
    heightBase: 82, heightVariation: 30,
    treeType: null, treeDensity: 1,
    grassColor: 0x8CB070, waterColor: null,
    temperature: 0.35, moisture: 0.4,
  },
  meadow: {
    id: 'meadow', name: '草甸',
    surface: G, subsurface: D,
    heightBase: 78, heightVariation: 8,
    treeType: 'oak', treeDensity: 0.95,
    grassColor: 0x8CCD6B, waterColor: null,
    temperature: 0.4, moisture: 0.45,
  },
  grove: {
    id: 'grove', name: '雪林',
    surface: BlockType.SNOW_BLOCK, subsurface: D,
    heightBase: 80, heightVariation: 10,
    treeType: 'spruce', treeDensity: 0.5,
    grassColor: 0x90C878, waterColor: null,
    temperature: 0.1, moisture: 0.5,
  },
  jagged_peaks: {
    id: 'jagged_peaks', name: '尖峭山峰',
    surface: BlockType.STONE, subsurface: BlockType.STONE,
    heightBase: 100, heightVariation: 48,
    treeType: null, treeDensity: 1,
    grassColor: 0x8CB860, waterColor: null,
    temperature: 0.2, moisture: 0.3,
  },
  frozen_peaks: {
    id: 'frozen_peaks', name: '冰封山峰',
    surface: BlockType.SNOW_BLOCK, subsurface: BlockType.STONE,
    heightBase: 100, heightVariation: 46,
    treeType: null, treeDensity: 1,
    grassColor: 0xA0C898, waterColor: 0x3D57D6,
    temperature: 0.0, moisture: 0.3,
  },
  stony_peaks: {
    id: 'stony_peaks', name: '裸岩山峰',
    surface: BlockType.STONE, subsurface: BlockType.STONE,
    heightBase: 100, heightVariation: 44,
    treeType: null, treeDensity: 1,
    grassColor: 0x9CA870, waterColor: null,
    temperature: 0.5, moisture: 0.25,
  },

  // ═══ Beach / River / Shore ═══
  beach: {
    id: 'beach', name: '沙滩',
    surface: S, subsurface: S,
    heightBase: 62, heightVariation: 3,
    treeType: null, treeDensity: 1,
    grassColor: 0x91BD59, waterColor: null,
    temperature: 0.5, moisture: 0.4,
  },
  snowy_beach: {
    id: 'snowy_beach', name: '积雪沙滩',
    surface: BlockType.SNOW_BLOCK, subsurface: D,
    heightBase: 62, heightVariation: 2,
    treeType: null, treeDensity: 1,
    grassColor: 0xA0C898, waterColor: null,
    temperature: 0.05, moisture: 0.3,
  },
  stony_shore: {
    id: 'stony_shore', name: '石岸',
    surface: BlockType.STONE, subsurface: BlockType.STONE,
    heightBase: 64, heightVariation: 6,
    treeType: null, treeDensity: 1,
    grassColor: 0x7CB860, waterColor: null,
    temperature: 0.4, moisture: 0.4,
  },
  river: {
    id: 'river', name: '河流',
    surface: G, subsurface: D,
    heightBase: 60, heightVariation: 2,
    treeType: null, treeDensity: 1,
    grassColor: 0x6DBD5D, waterColor: 0x3D5DA0,
    temperature: 0.5, moisture: 0.5,
  },
  frozen_river: {
    id: 'frozen_river', name: '冻河',
    surface: BlockType.ICE, subsurface: D,
    heightBase: 60, heightVariation: 2,
    treeType: null, treeDensity: 1,
    grassColor: 0xA0C898, waterColor: 0x3D57D6,
    temperature: 0.0, moisture: 0.3,
  },

  // ═══ Ocean family ═══
  ocean: {
    id: 'ocean', name: '海洋',
    surface: G, subsurface: D,
    heightBase: 50, heightVariation: 8,
    treeType: null, treeDensity: 1,
    grassColor: 0x6DA85D, waterColor: null,
    temperature: 0.5, moisture: 0.6,
  },
  deep_ocean: {
    id: 'deep_ocean', name: '深海',
    surface: G, subsurface: D,
    heightBase: 38, heightVariation: 8,
    treeType: null, treeDensity: 1,
    grassColor: 0x6DA85D, waterColor: null,
    temperature: 0.5, moisture: 0.6,
  },
  warm_ocean: {
    id: 'warm_ocean', name: '暖水海洋',
    surface: S, subsurface: S,
    heightBase: 50, heightVariation: 6,
    treeType: null, treeDensity: 1,
    grassColor: 0x7DBD6D, waterColor: 0x43D5EE,
    temperature: 0.8, moisture: 0.6,
  },
  lukewarm_ocean: {
    id: 'lukewarm_ocean', name: '温水海洋',
    surface: S, subsurface: D,
    heightBase: 46, heightVariation: 8,
    treeType: null, treeDensity: 1,
    grassColor: 0x6DA85D, waterColor: null,
    temperature: 0.6, moisture: 0.6,
  },
  cold_ocean: {
    id: 'cold_ocean', name: '冷水海洋',
    surface: G, subsurface: D,
    heightBase: 50, heightVariation: 8,
    treeType: null, treeDensity: 1,
    grassColor: 0x80A870, waterColor: 0x3D5DD0,
    temperature: 0.2, moisture: 0.6,
  },
  frozen_ocean: {
    id: 'frozen_ocean', name: '冻洋',
    surface: BlockType.ICE, subsurface: D,
    heightBase: 48, heightVariation: 6,
    treeType: null, treeDensity: 1,
    grassColor: 0x90B880, waterColor: 0x3D57D6,
    temperature: 0.0, moisture: 0.6,
  },

  // ═══ Special ═══
  mushroom_fields: {
    id: 'mushroom_fields', name: '蘑菇岛',
    surface: BlockType.MYCELIUM, subsurface: D,
    heightBase: 64, heightVariation: 4,
    treeType: null, treeDensity: 1,
    grassColor: 0xF0A0B0, waterColor: null,
    temperature: 0.5, moisture: 0.9,
  },
}
