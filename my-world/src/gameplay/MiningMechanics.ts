import { BlockType, getBlockDefinition } from '@/types/blocks'
import { getItemDefinition } from '@/types/items'

// ============================================================================
// Minecraft 精确挖矿机制
// 公式: hits = ceil(hardness × 30 / effectiveSpeed)
// effectiveSpeed = miningSpeed (正确工具+等级) 或 1/5 (错误工具)
// 50ms 间隔 → 时间 = hits × 0.05s
// ============================================================================

/** Minecraft 原版工具挖掘速度 */
const TOOL_MINING_SPEED: Record<string, Record<string, number>> = {
  pickaxe: { wood: 2, stone: 4, iron: 6, gold: 12, diamond: 8, netherite: 9 },
  axe:     { wood: 2, stone: 4, iron: 6, gold: 12, diamond: 8, netherite: 9 },
  shovel:  { wood: 2, stone: 4, iron: 6, gold: 12, diamond: 8, netherite: 9 },
  hoe:     { wood: 2, stone: 4, iron: 6, gold: 12, diamond: 8, netherite: 9 },
  sword:   { wood: 1, stone: 1, iron: 1, gold: 1, diamond: 1, netherite: 1 },
}

/** 工具等级 → 挖掘等级 */
const TOOL_HARVEST_LEVEL: Record<string, number> = {
  wood: 0, stone: 1, iron: 2, gold: 2, diamond: 3, netherite: 3,
}

// ===================== 方块所需工具类型 =====================

const HAND_MINEABLE = new Set<BlockType>([
  BlockType.DIRT, BlockType.GRASS_BLOCK, BlockType.SAND, BlockType.GRAVEL,
  BlockType.CLAY, BlockType.SOUL_SAND, BlockType.SOUL_SOIL,
  BlockType.MYCELIUM, BlockType.CRIMSON_NYLIUM, BlockType.WARPED_NYLIUM,
  BlockType.SNOW, BlockType.SNOW_BLOCK, BlockType.ICE, BlockType.PACKED_ICE,
  BlockType.BLUE_ICE, BlockType.FROSTED_ICE,
  BlockType.MAGMA_BLOCK, // 可手挖但受伤
])

const SHOVEL_BLOCKS = new Set<BlockType>([
  BlockType.SAND, BlockType.SANDSTONE, BlockType.RED_SAND, BlockType.RED_SANDSTONE,
  BlockType.CHISELED_SANDSTONE, BlockType.SMOOTH_SANDSTONE,
  BlockType.GRAVEL, BlockType.CLAY, BlockType.SOUL_SAND, BlockType.SOUL_SOIL,
  BlockType.MYCELIUM, BlockType.CRIMSON_NYLIUM, BlockType.WARPED_NYLIUM,
  BlockType.SNOW, BlockType.SNOW_BLOCK,
  BlockType.DIRT, BlockType.GRASS_BLOCK,
  // COARSE_DIRT, PODZOL 等变体映射到基础方块
  // 本游戏未定义这些变体
])

const AXE_BLOCKS = new Set<BlockType>([
  // Logs
  BlockType.OAK_LOG, BlockType.SPRUCE_LOG, BlockType.BIRCH_LOG,
  BlockType.JUNGLE_LOG, BlockType.ACACIA_LOG, BlockType.DARK_OAK_LOG,
  // Planks
  BlockType.OAK_PLANKS, BlockType.SPRUCE_PLANKS, BlockType.BIRCH_PLANKS,
  BlockType.JUNGLE_PLANKS, BlockType.ACACIA_PLANKS, BlockType.DARK_OAK_PLANKS,
  // Wooden utilities
  BlockType.CRAFTING_TABLE, BlockType.BOOKSHELF, BlockType.CHEST, BlockType.BARREL,
  BlockType.LECTERN, BlockType.COMPOSTER, BlockType.LOOM,
  BlockType.CARTOGRAPHY_TABLE, BlockType.FLETCHING_TABLE, BlockType.SMITHING_TABLE,
  // Doors
  BlockType.OAK_DOOR, BlockType.SPRUCE_DOOR, BlockType.BIRCH_DOOR,
  BlockType.JUNGLE_DOOR, BlockType.ACACIA_DOOR, BlockType.DARK_OAK_DOOR,
  BlockType.IRON_DOOR,
  // Trapdoors
  BlockType.OAK_TRAPDOOR, BlockType.SPRUCE_TRAPDOOR, BlockType.BIRCH_TRAPDOOR,
  BlockType.JUNGLE_TRAPDOOR, BlockType.ACACIA_TRAPDOOR, BlockType.DARK_OAK_TRAPDOOR,
  BlockType.IRON_TRAPDOOR,
  // Fences
  BlockType.OAK_FENCE, BlockType.SPRUCE_FENCE, BlockType.BIRCH_FENCE,
  BlockType.JUNGLE_FENCE, BlockType.ACACIA_FENCE, BlockType.DARK_OAK_FENCE,
  BlockType.NETHER_BRICK_FENCE,
  // Stairs (wooden)
  BlockType.OAK_STAIRS, BlockType.SPRUCE_STAIRS, BlockType.BIRCH_STAIRS,
  BlockType.SANDSTONE_STAIRS,
  // Slabs (wooden)
  BlockType.OAK_SLAB, BlockType.SPRUCE_SLAB, BlockType.BIRCH_SLAB,
  BlockType.SANDSTONE_SLAB,
  // Signs, beds, bamboo
  BlockType.BAMBOO_BLOCK,
  BlockType.HAY_BALE,
  BlockType.OAK_BUTTON, BlockType.STONE_BUTTON,
  BlockType.OAK_PRESSURE_PLATE, BlockType.STONE_PRESSURE_PLATE,
  BlockType.LADDER,
  BlockType.BONE_BLOCK,
])

const HOE_BLOCKS = new Set<BlockType>([
  BlockType.OAK_LEAVES, BlockType.SPRUCE_LEAVES, BlockType.BIRCH_LEAVES,
  BlockType.JUNGLE_LEAVES, BlockType.ACACIA_LEAVES, BlockType.DARK_OAK_LEAVES,
  BlockType.DRIED_KELP_BLOCK,
])

/**
 * 获取方块所需的工具类型。null 表示可空手挖掘。
 */
export function getRequiredTool(blockType: BlockType): 'pickaxe' | 'axe' | 'shovel' | 'hoe' | 'sword' | null {
  if (HAND_MINEABLE.has(blockType)) return null
  if (AXE_BLOCKS.has(blockType)) return 'axe'
  if (SHOVEL_BLOCKS.has(blockType)) return 'shovel'
  if (HOE_BLOCKS.has(blockType)) return 'hoe'
  // 默认: 大部分方块需要镐
  return 'pickaxe'
}

// ===================== 方块挖掘等级要求 =====================

/** 不需要工具或任何等级工具即可采集掉落物 */
const HARVEST_LEVEL_0 = new Set<BlockType>([
  BlockType.STONE, BlockType.COBBLESTONE, BlockType.STONE_BRICKS,
  BlockType.MOSSY_STONE_BRICKS, BlockType.CRACKED_NETHER_BRICKS as BlockType,
  BlockType.COAL_ORE,
  BlockType.GRANITE, BlockType.POLISHED_GRANITE,
  BlockType.DIORITE, BlockType.POLISHED_DIORITE,
  BlockType.ANDESITE, BlockType.POLISHED_ANDESITE,
  BlockType.SMOOTH_STONE, BlockType.MOSSY_COBBLESTONE,
  BlockType.BRICKS, BlockType.NETHER_BRICKS,
  BlockType.NETHERRACK, BlockType.RED_NETHER_BRICKS,
  BlockType.END_STONE, BlockType.END_STONE_BRICKS,
  BlockType.SANDSTONE, BlockType.RED_SANDSTONE,
  BlockType.CHISELED_SANDSTONE, BlockType.SMOOTH_SANDSTONE,
  BlockType.CHISELED_QUARTZ, BlockType.QUARTZ_BLOCK, BlockType.SMOOTH_QUARTZ,
  BlockType.PURPUR_BLOCK, BlockType.PURPUR_PILLAR,
  BlockType.PRISMARINE, BlockType.PRISMARINE_BRICKS, BlockType.DARK_PRISMARINE,
  BlockType.SEA_LANTERN,
  BlockType.COBBLESTONE_STAIRS, BlockType.STONE_BRICK_STAIRS, BlockType.BRICK_STAIRS,
  BlockType.SANDSTONE_STAIRS,
  BlockType.COBBLESTONE_SLAB, BlockType.STONE_SLAB, BlockType.STONE_BRICK_SLAB,
  BlockType.BRICK_SLAB, BlockType.SANDSTONE_SLAB,
  BlockType.IRON_ORE, BlockType.LAPIS_ORE,  // 石镐即可
])

/** 需要石镐或更好 */
const HARVEST_LEVEL_1 = new Set<BlockType>([
  BlockType.IRON_ORE, BlockType.LAPIS_ORE,
])

/** 需要铁镐或更好 */
const HARVEST_LEVEL_2 = new Set<BlockType>([
  BlockType.GOLD_ORE, BlockType.DIAMOND_ORE, BlockType.EMERALD_ORE,
  BlockType.REDSTONE_ORE, BlockType.NETHER_GOLD_ORE, BlockType.NETHER_QUARTZ_ORE,
  BlockType.COPPER_ORE,
])

/** 需要钻石镐或更好 */
const HARVEST_LEVEL_3 = new Set<BlockType>([
  BlockType.OBSIDIAN, BlockType.CRYING_OBSIDIAN,
])

/**
 * 获取方块采集掉落物所需的最低工具等级。0 = 任何镐, 1 = 石, 2 = 铁, 3 = 钻石
 */
export function getHarvestLevel(blockType: BlockType): number {
  if (HARVEST_LEVEL_3.has(blockType)) return 3
  if (HARVEST_LEVEL_2.has(blockType)) return 2
  if (HARVEST_LEVEL_1.has(blockType)) return 1
  if (HARVEST_LEVEL_0.has(blockType)) return 0
  // 金属块和矿物块需要对应等级
  if (blockType === BlockType.IRON_BLOCK || blockType === BlockType.COPPER_BLOCK) return 1
  if (blockType === BlockType.GOLD_BLOCK) return 2
  if (blockType === BlockType.DIAMOND_BLOCK || blockType === BlockType.EMERALD_BLOCK || blockType === BlockType.LAPIS_BLOCK) return 2
  if (blockType === BlockType.NETHERITE_BLOCK) return 3
  if (blockType === BlockType.REDSTONE_BLOCK) return 1
  if (blockType === BlockType.COAL_ORE) return 0
  // 不可破坏的方块
  if (blockType === BlockType.BEDROCK) return Infinity
  if (blockType === BlockType.OBSIDIAN) return 3
  // 默认: 任何镐即可
  return 0
}

// ===================== MC 精确方块硬度 =====================

/** 覆盖 blocks.ts 中的 hardness，使用 Minecraft 原版数值 */
const MC_HARDNESS: Partial<Record<BlockType, number>> = {
  // === 手挖方块 ===
  [BlockType.DIRT]: 0.5,
  [BlockType.GRASS_BLOCK]: 0.6,
  [BlockType.SAND]: 0.5,
  [BlockType.GRAVEL]: 0.6,
  [BlockType.CLAY]: 0.6,
  [BlockType.SOUL_SAND]: 0.5,
  [BlockType.SOUL_SOIL]: 0.5,
  [BlockType.MYCELIUM]: 0.6,
  [BlockType.CRIMSON_NYLIUM]: 0.6,
  [BlockType.WARPED_NYLIUM]: 0.6,
  [BlockType.SNOW]: 0.1,
  [BlockType.SNOW_BLOCK]: 0.2,
  [BlockType.ICE]: 0.5,
  [BlockType.PACKED_ICE]: 0.5,
  [BlockType.BLUE_ICE]: 0.5,
  [BlockType.FROSTED_ICE]: 0.5,
  [BlockType.MAGMA_BLOCK]: 0.5,

  // === 需要木镐 (等级0) ===
  [BlockType.STONE]: 1.5,
  [BlockType.COBBLESTONE]: 2.0,
  [BlockType.STONE_BRICKS]: 1.5,
  [BlockType.MOSSY_STONE_BRICKS]: 1.5,
  [BlockType.SMOOTH_STONE]: 2.0,
  [BlockType.MOSSY_COBBLESTONE]: 2.0,
  [BlockType.BRICKS]: 2.0,
  [BlockType.NETHER_BRICKS]: 2.0,
  [BlockType.CRACKED_NETHER_BRICKS]: 2.0,
  [BlockType.RED_NETHER_BRICKS]: 2.0,
  [BlockType.GRANITE]: 1.5,
  [BlockType.POLISHED_GRANITE]: 1.5,
  [BlockType.DIORITE]: 1.5,
  [BlockType.POLISHED_DIORITE]: 1.5,
  [BlockType.ANDESITE]: 1.5,
  [BlockType.POLISHED_ANDESITE]: 1.5,
  [BlockType.COAL_ORE]: 3.0,
  [BlockType.NETHERRACK]: 0.4,
  [BlockType.END_STONE]: 3.0,
  [BlockType.END_STONE_BRICKS]: 3.0,
  [BlockType.SANDSTONE]: 0.8,
  [BlockType.RED_SANDSTONE]: 0.8,
  [BlockType.CHISELED_SANDSTONE]: 0.8,
  [BlockType.SMOOTH_SANDSTONE]: 2.0,
  [BlockType.CHISELED_QUARTZ]: 0.8,
  [BlockType.QUARTZ_BLOCK]: 0.8,
  [BlockType.SMOOTH_QUARTZ]: 2.0,
  [BlockType.PURPUR_BLOCK]: 1.5,
  [BlockType.PURPUR_PILLAR]: 1.5,
  [BlockType.PRISMARINE]: 1.5,
  [BlockType.PRISMARINE_BRICKS]: 1.5,
  [BlockType.DARK_PRISMARINE]: 1.5,
  [BlockType.SEA_LANTERN]: 0.3,
  // 楼梯/台阶
  [BlockType.COBBLESTONE_STAIRS]: 2.0,
  [BlockType.STONE_BRICK_STAIRS]: 1.5,
  [BlockType.BRICK_STAIRS]: 2.0,
  [BlockType.SANDSTONE_STAIRS]: 0.8,
  [BlockType.COBBLESTONE_SLAB]: 2.0,
  [BlockType.STONE_SLAB]: 2.0,
  [BlockType.STONE_BRICK_SLAB]: 1.5,
  [BlockType.BRICK_SLAB]: 2.0,
  [BlockType.SANDSTONE_SLAB]: 0.8,

  // === 需要石镐 (等级1) ===
  [BlockType.IRON_ORE]: 3.0,
  [BlockType.LAPIS_ORE]: 3.0,
  [BlockType.IRON_BLOCK]: 5.0,
  [BlockType.COPPER_ORE]: 3.0,
  [BlockType.COPPER_BLOCK]: 5.0,

  // === 需要铁镐 (等级2) ===
  [BlockType.GOLD_ORE]: 3.0,
  [BlockType.DIAMOND_ORE]: 3.0,
  [BlockType.EMERALD_ORE]: 3.0,
  [BlockType.REDSTONE_ORE]: 3.0,
  [BlockType.NETHER_GOLD_ORE]: 3.0,
  [BlockType.NETHER_QUARTZ_ORE]: 3.0,
  [BlockType.GOLD_BLOCK]: 5.0,  // MC 中是 3.0 但铁镐即可
  [BlockType.DIAMOND_BLOCK]: 5.0,
  [BlockType.EMERALD_BLOCK]: 5.0,
  [BlockType.LAPIS_BLOCK]: 5.0,
  [BlockType.REDSTONE_BLOCK]: 5.0,

  // === 需要钻石镐 (等级3) ===
  [BlockType.OBSIDIAN]: 50,
  [BlockType.CRYING_OBSIDIAN]: 50,

  // === 需要斧头 ===
  [BlockType.OAK_LOG]: 2.0,
  [BlockType.SPRUCE_LOG]: 2.0,
  [BlockType.BIRCH_LOG]: 2.0,
  [BlockType.JUNGLE_LOG]: 2.0,
  [BlockType.ACACIA_LOG]: 2.0,
  [BlockType.DARK_OAK_LOG]: 2.0,
  [BlockType.OAK_PLANKS]: 2.0,
  [BlockType.SPRUCE_PLANKS]: 2.0,
  [BlockType.BIRCH_PLANKS]: 2.0,
  [BlockType.JUNGLE_PLANKS]: 2.0,
  [BlockType.ACACIA_PLANKS]: 2.0,
  [BlockType.DARK_OAK_PLANKS]: 2.0,
  [BlockType.CRAFTING_TABLE]: 2.5,
  [BlockType.CHEST]: 2.5,
  [BlockType.BARREL]: 2.5,
  [BlockType.BOOKSHELF]: 1.5,
  [BlockType.OAK_DOOR]: 3.0,
  [BlockType.SPRUCE_DOOR]: 3.0,
  [BlockType.BIRCH_DOOR]: 3.0,
  [BlockType.JUNGLE_DOOR]: 3.0,
  [BlockType.ACACIA_DOOR]: 3.0,
  [BlockType.DARK_OAK_DOOR]: 3.0,
  [BlockType.IRON_DOOR]: 5.0,
  [BlockType.OAK_TRAPDOOR]: 3.0,
  [BlockType.SPRUCE_TRAPDOOR]: 3.0,
  [BlockType.BIRCH_TRAPDOOR]: 3.0,
  [BlockType.JUNGLE_TRAPDOOR]: 3.0,
  [BlockType.ACACIA_TRAPDOOR]: 3.0,
  [BlockType.DARK_OAK_TRAPDOOR]: 3.0,
  [BlockType.IRON_TRAPDOOR]: 5.0,
  [BlockType.OAK_FENCE]: 2.0,
  [BlockType.SPRUCE_FENCE]: 2.0,
  [BlockType.BIRCH_FENCE]: 2.0,
  [BlockType.JUNGLE_FENCE]: 2.0,
  [BlockType.ACACIA_FENCE]: 2.0,
  [BlockType.DARK_OAK_FENCE]: 2.0,
  [BlockType.NETHER_BRICK_FENCE]: 2.0,
  [BlockType.OAK_STAIRS]: 2.0,
  [BlockType.SPRUCE_STAIRS]: 2.0,
  [BlockType.BIRCH_STAIRS]: 2.0,
  [BlockType.OAK_SLAB]: 2.0,
  [BlockType.SPRUCE_SLAB]: 2.0,
  [BlockType.BIRCH_SLAB]: 2.0,
  [BlockType.LECTERN]: 2.5,
  [BlockType.COMPOSTER]: 2.0,
  [BlockType.LOOM]: 2.5,
  [BlockType.CARTOGRAPHY_TABLE]: 2.5,
  [BlockType.FLETCHING_TABLE]: 2.5,
  [BlockType.SMITHING_TABLE]: 2.5,
  [BlockType.OAK_BUTTON]: 0.5,
  [BlockType.STONE_BUTTON]: 0.5,
  [BlockType.OAK_PRESSURE_PLATE]: 0.5,
  [BlockType.STONE_PRESSURE_PLATE]: 0.5,
  [BlockType.LADDER]: 0.4,
  [BlockType.BAMBOO_BLOCK]: 1.0,
  [BlockType.BONE_BLOCK]: 2.0,
  [BlockType.HAY_BALE]: 0.5,

  // === 需要锄头 ===
  [BlockType.OAK_LEAVES]: 0.2,
  [BlockType.SPRUCE_LEAVES]: 0.2,
  [BlockType.BIRCH_LEAVES]: 0.2,
  [BlockType.JUNGLE_LEAVES]: 0.2,
  [BlockType.ACACIA_LEAVES]: 0.2,
  [BlockType.DARK_OAK_LEAVES]: 0.2,
  [BlockType.DRIED_KELP_BLOCK]: 0.5,

  // === 特殊 ===
  [BlockType.BEDROCK]: Infinity,
  [BlockType.SPAWNER]: 5.0,
  [BlockType.FURNACE]: 3.5,
  [BlockType.BLAST_FURNACE]: 3.5,
  [BlockType.SMOKER]: 3.5,
  [BlockType.ANVIL]: 5.0,
  [BlockType.CHIPPED_ANVIL]: 5.0,
  [BlockType.DAMAGED_ANVIL]: 5.0,
  [BlockType.BEACON]: 3.0,
  [BlockType.BELL]: 5.0,
  [BlockType.GRINDSTONE]: 2.0,
  [BlockType.STONECUTTER]: 3.5,
  [BlockType.TNT]: 0, // TNT 瞬间破坏
  [BlockType.GLASS]: 0.3,
  [BlockType.GLOWSTONE]: 0.3,
  [BlockType.NETHERITE_BLOCK]: 50, // 需要钻石镐

  // === 红石元件 ===
  [BlockType.REDSTONE_DUST]: 0.5,
  [BlockType.PISTON]: 1.5,
  [BlockType.STICKY_PISTON]: 1.5,
  [BlockType.REPEATER]: 0,
  [BlockType.COMPARATOR]: 0,
  [BlockType.OBSERVER]: 3.0,
  [BlockType.HOPPER]: 3.0,
  [BlockType.PISTON_HEAD]: 1.5,

  // === 羊毛 (需要任何工具，但剪刀最快) ===
  [BlockType.WHITE_WOOL]: 0.8,
  [BlockType.ORANGE_WOOL]: 0.8,
  [BlockType.MAGENTA_WOOL]: 0.8,
  [BlockType.LIGHT_BLUE_WOOL]: 0.8,
  [BlockType.YELLOW_WOOL]: 0.8,
  [BlockType.LIME_WOOL]: 0.8,
  [BlockType.PINK_WOOL]: 0.8,
  [BlockType.GRAY_WOOL]: 0.8,
  [BlockType.LIGHT_GRAY_WOOL]: 0.8,
  [BlockType.CYAN_WOOL]: 0.8,
  [BlockType.PURPLE_WOOL]: 0.8,
  [BlockType.BLUE_WOOL]: 0.8,
  [BlockType.BROWN_WOOL]: 0.8,
  [BlockType.GREEN_WOOL]: 0.8,
  [BlockType.RED_WOOL]: 0.8,
  [BlockType.BLACK_WOOL]: 0.8,

  // === 混凝土 ===
  [BlockType.WHITE_CONCRETE]: 1.8,
  [BlockType.ORANGE_CONCRETE]: 1.8,
  [BlockType.YELLOW_CONCRETE]: 1.8,
  [BlockType.LIGHT_BLUE_CONCRETE]: 1.8,
  [BlockType.LIME_CONCRETE]: 1.8,
  [BlockType.PINK_CONCRETE]: 1.8,
  [BlockType.GRAY_CONCRETE]: 1.8,
  [BlockType.CYAN_CONCRETE]: 1.8,
  [BlockType.PURPLE_CONCRETE]: 1.8,
  [BlockType.BLUE_CONCRETE]: 1.8,
  [BlockType.BROWN_CONCRETE]: 1.8,
  [BlockType.GREEN_CONCRETE]: 1.8,
  [BlockType.RED_CONCRETE]: 1.8,
  [BlockType.BLACK_CONCRETE]: 1.8,

  // === 陶瓦 ===
  [BlockType.TERRACOTTA]: 1.25,
  [BlockType.WHITE_TERRACOTTA]: 1.25,
  [BlockType.ORANGE_TERRACOTTA]: 1.25,
  [BlockType.YELLOW_TERRACOTTA]: 1.25,
  [BlockType.LIGHT_BLUE_TERRACOTTA]: 1.25,
  [BlockType.LIME_TERRACOTTA]: 1.25,
  [BlockType.PINK_TERRACOTTA]: 1.25,
  [BlockType.GRAY_TERRACOTTA]: 1.25,
  [BlockType.CYAN_TERRACOTTA]: 1.25,
  [BlockType.PURPLE_TERRACOTTA]: 1.25,
  [BlockType.BLUE_TERRACOTTA]: 1.25,
  [BlockType.BROWN_TERRACOTTA]: 1.25,
  [BlockType.GREEN_TERRACOTTA]: 1.25,
  [BlockType.RED_TERRACOTTA]: 1.25,
  [BlockType.BLACK_TERRACOTTA]: 1.25,

  // === 植物 ===
  [BlockType.CACTUS]: 0.4,
  [BlockType.SUGAR_CANE]: 0.4,
  [BlockType.PUMPKIN]: 1.0,
  [BlockType.MELON]: 1.0,

  // === 蘑菇 ===
  [BlockType.MUSHROOM_STEM]: 0.2,
  [BlockType.RED_MUSHROOM_BLOCK]: 0.2,
  [BlockType.BROWN_MUSHROOM_BLOCK]: 0.2,

  // === 基座/墙 ===
  [BlockType.COBBLESTONE_WALL]: 2.0,
  [BlockType.MOSSY_COBBLESTONE_WALL]: 2.0,
  [BlockType.STONE_BRICK_WALL]: 1.5,
  [BlockType.BRICK_WALL]: 2.0,
  [BlockType.ANDESITE_WALL]: 1.5,
  [BlockType.DIORITE_WALL]: 1.5,
  [BlockType.GRANITE_WALL]: 1.5,

  // === 特殊光源 ===
  [BlockType.TORCH]: 0.5, // 这些其实不常用镐
  [BlockType.SOUL_TORCH]: 0.5,
  [BlockType.LANTERN]: 3.5,
  [BlockType.SOUL_LANTERN]: 3.5,
  [BlockType.CHAIN]: 5.0,

  // === 床 ===
  [BlockType.WHITE_BED]: 0.2,
  [BlockType.ORANGE_BED]: 0.2,
  [BlockType.MAGENTA_BED]: 0.2,
  [BlockType.LIGHT_BLUE_BED]: 0.2,
  [BlockType.YELLOW_BED]: 0.2,
  [BlockType.LIME_BED]: 0.2,
  [BlockType.PINK_BED]: 0.2,
  [BlockType.GRAY_BED]: 0.2,
  [BlockType.LIGHT_GRAY_BED]: 0.2,
  [BlockType.CYAN_BED]: 0.2,
  [BlockType.PURPLE_BED]: 0.2,
  [BlockType.BLUE_BED]: 0.2,
  [BlockType.BROWN_BED]: 0.2,
  [BlockType.GREEN_BED]: 0.2,
  [BlockType.RED_BED]: 0.2,
  [BlockType.BLACK_BED]: 0.2,

  // === 铁轨 ===
  [BlockType.RAIL]: 0.7,
  [BlockType.POWERED_RAIL]: 0.7,
  [BlockType.DETECTOR_RAIL]: 0.7,
  [BlockType.ACTIVATOR_RAIL]: 0.7,

  // === 矿石方块 ===
  [BlockType.BASALT]: 1.25,
  [BlockType.BLACKSTONE]: 1.5,
  [BlockType.POLISHED_BLACKSTONE]: 2.0,

  // === 下界砖相关 ===
  [BlockType.NETHER_QUARTZ_ORE]: 3.0,

  // === 染色玻璃 ===
  [BlockType.GLASS]: 0.3,
  [BlockType.WHITE_STAINED_GLASS]: 0.3,
  [BlockType.ORANGE_STAINED_GLASS]: 0.3,
  [BlockType.MAGENTA_STAINED_GLASS]: 0.3,
  [BlockType.LIGHT_BLUE_STAINED_GLASS]: 0.3,
  [BlockType.YELLOW_STAINED_GLASS]: 0.3,
  [BlockType.LIME_STAINED_GLASS]: 0.3,
  [BlockType.PINK_STAINED_GLASS]: 0.3,
  [BlockType.GRAY_STAINED_GLASS]: 0.3,
  [BlockType.LIGHT_GRAY_STAINED_GLASS]: 0.3,
  [BlockType.CYAN_STAINED_GLASS]: 0.3,
  [BlockType.PURPLE_STAINED_GLASS]: 0.3,
  [BlockType.BLUE_STAINED_GLASS]: 0.3,
  [BlockType.BROWN_STAINED_GLASS]: 0.3,
  [BlockType.GREEN_STAINED_GLASS]: 0.3,
  [BlockType.RED_STAINED_GLASS]: 0.3,
  [BlockType.BLACK_STAINED_GLASS]: 0.3,

  // 测重压力板
  [BlockType.LIGHT_WEIGHTED_PRESSURE_PLATE]: 0.5,
  [BlockType.HEAVY_WEIGHTED_PRESSURE_PLATE]: 0.5,
}

/**
 * 获取方块的 Minecraft 精确硬度值
 */
export function getBlockHardness(blockType: BlockType): number {
  if (MC_HARDNESS[blockType] !== undefined) return MC_HARDNESS[blockType]!
  // 回退到 blocks.ts 中的值, 但将 11 映射为合理默认值
  const def = getBlockDefinition(blockType)
  if (def.hardness === Infinity) return Infinity
  if (def.hardness >= 10) return 2.0 // 默认 "中等" 硬度
  return def.hardness
}

// ============================================================================
// 核心计算函数
// ============================================================================

/**
 * 获取工具对方块的实际挖掘速度
 * @returns 挖掘速度乘数, 1 = 默认空手速度
 */
export function getMiningSpeed(blockType: BlockType, toolItemId: string | null): number {
  if (!toolItemId) return 1

  const itemDef = getItemDefinition(toolItemId)
  if (!itemDef || !itemDef.toolType) return 1

  const requiredTool = getRequiredTool(blockType)

  // 工具类型匹配才有效果
  if (requiredTool !== null && itemDef.toolType !== requiredTool) {
    // 工具类型不匹配, 速度 = 1 (像空手一样)
    return 1
  }

  const speedTable = TOOL_MINING_SPEED[itemDef.toolType]
  if (!speedTable || !itemDef.toolLevel) return 1

  return speedTable[itemDef.toolLevel] ?? 1
}

/**
 * 计算破坏方块需要的击打次数
 * 公式: ceil(hardness × 30 / effectiveSpeed)
 * 错误工具: 有效硬度 = hardness × 5
 */
export function calculateHitsNeeded(blockType: BlockType, toolItemId: string | null): number {
  const hardness = getBlockHardness(blockType)
  if (hardness === Infinity || hardness <= 0) return 1

  const requiredTool = getRequiredTool(blockType)
  const itemDef = toolItemId ? getItemDefinition(toolItemId) : null
  const toolType = itemDef?.toolType ?? null
  const toolLevel = itemDef?.toolLevel ? (TOOL_HARVEST_LEVEL[itemDef.toolLevel] ?? 0) : 0

  // 检查工具是否 "有效" (类型匹配且等级足够)
  const isEffective = requiredTool === null || (toolType === requiredTool && toolLevel >= getHarvestLevel(blockType))

  const effectiveHardness = isEffective ? hardness : hardness * 5
  const speed = getMiningSpeed(blockType, toolItemId)
  const effectiveSpeed = Math.max(speed, 0.1) // 防止除零

  const hits = Math.ceil((effectiveHardness * 30) / effectiveSpeed)
  return Math.max(1, hits)
}

/**
 * 判断当前工具是否能采集方块掉落物
 * - 创造模式: 始终可以
 * - 空手挖掘不需要工具的方块: 可以
 * - 正确工具类型 + 足够等级: 可以
 * - 其他情况: 不可以 (方块被破坏但不掉落)
 */
export function canHarvestDrop(blockType: BlockType, toolItemId: string | null, creativeMode = false): boolean {
  if (creativeMode) return true

  const requiredTool = getRequiredTool(blockType)
  if (requiredTool === null) return true // 不需要工具

  if (!toolItemId) return false

  const itemDef = getItemDefinition(toolItemId)
  if (!itemDef || !itemDef.toolType || !itemDef.toolLevel) return false

  if (itemDef.toolType !== requiredTool) return false

  const toolLevel = TOOL_HARVEST_LEVEL[itemDef.toolLevel] ?? 0
  return toolLevel >= getHarvestLevel(blockType)
}

/**
 * 判断挖掘是否应消耗工具耐久
 * 规则: 工具类型匹配时才消耗（即使等级不够）
 */
export function shouldConsumeDurability(blockType: BlockType, toolItemId: string | null): boolean {
  if (!toolItemId) return false
  const requiredTool = getRequiredTool(blockType)
  if (requiredTool === null) return false // 手挖方块不消耗

  const itemDef = getItemDefinition(toolItemId)
  if (!itemDef || !itemDef.toolType) return false

  return itemDef.toolType === requiredTool
}
