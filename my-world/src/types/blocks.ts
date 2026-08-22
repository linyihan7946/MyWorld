/**
 * BlockType 枚举 - 所有方块类型
 */
export enum BlockType {
  AIR = 0,
  STONE = 1,
  DIRT = 2,
  GRASS_BLOCK = 3,
  BEDROCK = 4,
  COBBLESTONE = 5,
  OAK_PLANKS = 6,
  OAK_LOG = 7,
  OAK_LEAVES = 8,
  SAND = 9,
  SANDSTONE = 10,
  WATER = 11,
  COAL_ORE = 12,
  IRON_ORE = 13,
  GOLD_ORE = 14,
  DIAMOND_ORE = 15,
  GRAVEL = 16,
  CLAY = 17,
  CRAFTING_TABLE = 18,
  FURNACE = 19,

  // Nether blocks
  NETHERRACK = 20,
  SOUL_SAND = 21,
  SOUL_SOIL = 22,
  BASALT = 23,
  BLACKSTONE = 24,
  CRIMSON_NYLIUM = 25,
  WARPED_NYLIUM = 26,
  MAGMA_BLOCK = 27,
  GLOWSTONE = 28,
  NETHER_BRICKS = 29,

  // End blocks
  END_STONE = 30,
  OBSIDIAN = 31,
  PURPUR_BLOCK = 32,

  // Building blocks
  STONE_BRICKS = 33,
  MOSSY_STONE_BRICKS = 34,
  BRICKS = 35,
  BOOKSHELF = 36,
  TNT = 37,
  GLASS = 38,

  // Mineral blocks
  IRON_BLOCK = 40,
  GOLD_BLOCK = 41,
  DIAMOND_BLOCK = 42,
  NETHERITE_BLOCK = 43,

  // Special
  CHEST = 50,
  SPAWNER = 51,

  // === NEW: Stone variants ===
  GRANITE = 60,
  POLISHED_GRANITE = 61,
  DIORITE = 62,
  POLISHED_DIORITE = 63,
  ANDESITE = 64,
  POLISHED_ANDESITE = 65,
  SMOOTH_STONE = 66,
  MOSSY_COBBLESTONE = 67,

  // === NEW: Wood variants ===
  SPRUCE_LOG = 70,
  SPRUCE_PLANKS = 71,
  SPRUCE_LEAVES = 72,
  BIRCH_LOG = 73,
  BIRCH_PLANKS = 74,
  BIRCH_LEAVES = 75,
  JUNGLE_LOG = 76,
  JUNGLE_PLANKS = 77,
  JUNGLE_LEAVES = 78,
  ACACIA_LOG = 79,
  ACACIA_PLANKS = 80,
  ACACIA_LEAVES = 81,
  DARK_OAK_LOG = 82,
  DARK_OAK_PLANKS = 83,
  DARK_OAK_LEAVES = 84,

  // === NEW: More ores ===
  EMERALD_ORE = 90,
  REDSTONE_ORE = 91,
  LAPIS_ORE = 92,
  COPPER_ORE = 93,
  DEEPSLATE = 94,
  COPPER_BLOCK = 95,
  EMERALD_BLOCK = 96,
  LAPIS_BLOCK = 97,
  REDSTONE_BLOCK = 98,

  // === NEW: Building blocks ===
  WHITE_WOOL = 100,
  ORANGE_WOOL = 101,
  MAGENTA_WOOL = 102,
  LIGHT_BLUE_WOOL = 103,
  YELLOW_WOOL = 104,
  LIME_WOOL = 105,
  PINK_WOOL = 106,
  GRAY_WOOL = 107,
  LIGHT_GRAY_WOOL = 108,
  CYAN_WOOL = 109,
  PURPLE_WOOL = 110,
  BLUE_WOOL = 111,
  BROWN_WOOL = 112,
  GREEN_WOOL = 113,
  RED_WOOL = 114,
  BLACK_WOOL = 115,

  // === NEW: More building ===
  COBBLESTONE_STAIRS = 120,
  STONE_BRICK_STAIRS = 121,
  BRICK_STAIRS = 122,
  OAK_STAIRS = 123,
  SPRUCE_STAIRS = 124,
  BIRCH_STAIRS = 125,
  SANDSTONE_STAIRS = 126,

  // === NEW: Glass variants ===
  WHITE_STAINED_GLASS = 130,
  ORANGE_STAINED_GLASS = 131,
  MAGENTA_STAINED_GLASS = 132,
  LIGHT_BLUE_STAINED_GLASS = 133,
  YELLOW_STAINED_GLASS = 134,
  LIME_STAINED_GLASS = 135,
  PINK_STAINED_GLASS = 136,
  GRAY_STAINED_GLASS = 137,
  LIGHT_GRAY_STAINED_GLASS = 138,
  CYAN_STAINED_GLASS = 139,
  PURPLE_STAINED_GLASS = 140,
  BLUE_STAINED_GLASS = 141,
  BROWN_STAINED_GLASS = 142,
  GREEN_STAINED_GLASS = 143,
  RED_STAINED_GLASS = 144,
  BLACK_STAINED_GLASS = 145,

  // === NEW: Concrete ===
  WHITE_CONCRETE = 150,
  ORANGE_CONCRETE = 151,
  YELLOW_CONCRETE = 152,
  LIGHT_BLUE_CONCRETE = 153,
  LIME_CONCRETE = 154,
  PINK_CONCRETE = 155,
  GRAY_CONCRETE = 156,
  CYAN_CONCRETE = 157,
  PURPLE_CONCRETE = 158,
  BLUE_CONCRETE = 159,
  BROWN_CONCRETE = 160,
  GREEN_CONCRETE = 161,
  RED_CONCRETE = 162,
  BLACK_CONCRETE = 163,

  // === NEW: Terracotta ===
  TERRACOTTA = 170,
  WHITE_TERRACOTTA = 171,
  ORANGE_TERRACOTTA = 172,
  YELLOW_TERRACOTTA = 173,
  LIGHT_BLUE_TERRACOTTA = 174,
  LIME_TERRACOTTA = 175,
  PINK_TERRACOTTA = 176,
  GRAY_TERRACOTTA = 177,
  CYAN_TERRACOTTA = 178,
  PURPLE_TERRACOTTA = 179,
  BLUE_TERRACOTTA = 180,
  BROWN_TERRACOTTA = 181,
  GREEN_TERRACOTTA = 182,
  RED_TERRACOTTA = 183,
  BLACK_TERRACOTTA = 184,

  // === NEW: Sandstone variants ===
  CHISELED_SANDSTONE = 190,
  SMOOTH_SANDSTONE = 191,
  RED_SAND = 192,
  RED_SANDSTONE = 193,

  // === NEW: Nether variants ===
  POLISHED_BLACKSTONE = 200,
  CRACKED_NETHER_BRICKS = 201,
  RED_NETHER_BRICKS = 202,
  NETHER_GOLD_ORE = 203,
  NETHER_QUARTZ_ORE = 204,
  QUARTZ_BLOCK = 205,
  SMOOTH_QUARTZ = 206,
  CHISELED_QUARTZ = 207,

  // === NEW: End variants ===
  END_STONE_BRICKS = 210,
  PURPUR_PILLAR = 211,
  CRYING_OBSIDIAN = 212,

  // === NEW: Utility blocks ===
  ANVIL = 220,
  CHIPPED_ANVIL = 221,
  DAMAGED_ANVIL = 222,
  GRINDSTONE = 223,
  STONECUTTER = 224,
  LOOM = 225,
  CARTOGRAPHY_TABLE = 226,
  FLETCHING_TABLE = 227,
  SMITHING_TABLE = 228,
  BLAST_FURNACE = 229,
  SMOKER = 230,
  COMPOSTER = 231,
  BARREL = 232,
  BELL = 233,
  LECTERN = 234,
  BEACON = 235,

  // === NEW: Ice and snow ===
  ICE = 240,
  PACKED_ICE = 241,
  BLUE_ICE = 242,
  SNOW_BLOCK = 243,
  SNOW = 244,
  FROSTED_ICE = 245,

  // === NEW: Plants ===
  CACTUS = 250,
  SUGAR_CANE = 251,
  PUMPKIN = 252,
  MELON = 253,
  HAY_BALE = 254,
  BONE_BLOCK = 255,
  DRIED_KELP_BLOCK = 256,
  BAMBOO_BLOCK = 257,

  // === NEW: Coral and prismarine ===
  PRISMARINE = 260,
  PRISMARINE_BRICKS = 261,
  DARK_PRISMARINE = 262,
  SEA_LANTERN = 263,

  // === NEW: Mushroom blocks ===
  MUSHROOM_STEM = 270,
  RED_MUSHROOM_BLOCK = 271,
  BROWN_MUSHROOM_BLOCK = 272,
  MYCELIUM = 273,

  // === NEW: Slabs (decorative) ===
  STONE_SLAB = 280,
  COBBLESTONE_SLAB = 281,
  STONE_BRICK_SLAB = 282,
  BRICK_SLAB = 283,
  OAK_SLAB = 284,
  SPRUCE_SLAB = 285,
  BIRCH_SLAB = 286,
  SANDSTONE_SLAB = 287,

  // === NEW: Fences ===
  OAK_FENCE = 290,
  SPRUCE_FENCE = 291,
  BIRCH_FENCE = 292,
  JUNGLE_FENCE = 293,
  ACACIA_FENCE = 294,
  DARK_OAK_FENCE = 295,
  NETHER_BRICK_FENCE = 296,

  // === NEW: Walls ===
  COBBLESTONE_WALL = 300,
  MOSSY_COBBLESTONE_WALL = 301,
  STONE_BRICK_WALL = 302,
  BRICK_WALL = 303,
  ANDESITE_WALL = 304,
  DIORITE_WALL = 305,
  GRANITE_WALL = 306,

  // === NEW: Doors and trapdoors ===
  OAK_DOOR = 310,
  SPRUCE_DOOR = 311,
  BIRCH_DOOR = 312,
  JUNGLE_DOOR = 313,
  ACACIA_DOOR = 314,
  DARK_OAK_DOOR = 315,
  IRON_DOOR = 316,

  OAK_TRAPDOOR = 320,
  SPRUCE_TRAPDOOR = 321,
  BIRCH_TRAPDOOR = 322,
  JUNGLE_TRAPDOOR = 323,
  ACACIA_TRAPDOOR = 324,
  DARK_OAK_TRAPDOOR = 325,
  IRON_TRAPDOOR = 326,

  // === NEW: Buttons and pressure plates ===
  OAK_BUTTON = 330,
  STONE_BUTTON = 331,
  OAK_PRESSURE_PLATE = 332,
  STONE_PRESSURE_PLATE = 333,
  LIGHT_WEIGHTED_PRESSURE_PLATE = 334,
  HEAVY_WEIGHTED_PRESSURE_PLATE = 335,

  // === NEW: Miscellaneous ===
  LADDER = 340,
  RAIL = 341,
  POWERED_RAIL = 342,
  DETECTOR_RAIL = 343,
  ACTIVATOR_RAIL = 344,
  TORCH = 345,
  SOUL_TORCH = 346,
  LANTERN = 347,
  SOUL_LANTERN = 348,
  CHAIN = 349,

  // === NEW: Beds ===
  WHITE_BED = 350,
  ORANGE_BED = 351,
  MAGENTA_BED = 352,
  LIGHT_BLUE_BED = 353,
  YELLOW_BED = 354,
  LIME_BED = 355,
  PINK_BED = 356,
  GRAY_BED = 357,
  LIGHT_GRAY_BED = 358,
  CYAN_BED = 359,
  PURPLE_BED = 360,
  BLUE_BED = 361,
  BROWN_BED = 362,
  GREEN_BED = 363,
  RED_BED = 364,
  BLACK_BED = 365,

  // Redstone components
  REDSTONE_DUST = 380,
  PISTON = 381,
  STICKY_PISTON = 382,
  REPEATER = 383,
  COMPARATOR = 384,
  OBSERVER = 385,
  HOPPER = 386,
  PISTON_HEAD = 387,
  LEVER = 388,                  // 拉杆
  LEVER_ON = 389,               // 激活的拉杆
  REDSTONE_TORCH = 390,         // 红石火把 (未充能)
  REDSTONE_TORCH_ON = 391,      // 红石火把 (充能)

  // === 指令专属方块 (创造模式+作弊) ===
  COMMAND_BLOCK = 400,          // 脉冲命令方块 (橙色)
  CHAIN_COMMAND_BLOCK = 401,    // 连锁命令方块 (绿色)
  REPEAT_COMMAND_BLOCK = 402,   // 循环命令方块 (紫色)
  BARRIER = 403,                // 屏障 (隐形不可破坏)
  STRUCTURE_BLOCK = 404,        // 结构方块 (青色)
  JIGSAW_BLOCK = 405,           // 拼图方块 (黄色)
  LIGHT_BLOCK = 406,            // 光源方块 (可调亮度)
  STRUCTURE_VOID = 407,         // 结构空位 (半透明)
  STEEL_ORE = 408,              // 钢矿石 (最稀有)
  STEEL_BLOCK = 409,            // 钢块

  // === 传送门 ===
  NETHER_PORTAL = 410,          // 地狱传送门（紫色漩涡）
  END_PORTAL = 411,             // 末地传送门（星空表面）
  END_PORTAL_FRAME = 412,       // 末地传送门框架
}

/**
 * 方块属性
 */
export interface BlockDefinition {
  id: BlockType
  name: string
  solid: boolean
  transparent: boolean
  breakable: boolean
  hardness: number // 默认击打次数
  textures: {
    top?: number
    bottom?: number
    side?: number
    all?: number // 如果所有面共用一张纹理
  }
  commandExclusive?: boolean // 是否指令专属(创造+作弊才能获取)
}

/**
 * 方块注册表
 */
export const BLOCK_REGISTRY: Record<number, BlockDefinition> = {
  [BlockType.AIR]: { id: BlockType.AIR, name: 'Air', solid: false, transparent: true, breakable: false, hardness: 0, textures: {} },
  [BlockType.STONE]: { id: BlockType.STONE, name: '石头', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 1 } },
  [BlockType.DIRT]: { id: BlockType.DIRT, name: '泥土', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 2 } },
  [BlockType.GRASS_BLOCK]: { id: BlockType.GRASS_BLOCK, name: '草方块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { top: 3, bottom: 2, side: 4 } },
  [BlockType.BEDROCK]: { id: BlockType.BEDROCK, name: '基岩', solid: true, transparent: false, breakable: false, hardness: Infinity, textures: { all: 5 } },
  [BlockType.COBBLESTONE]: { id: BlockType.COBBLESTONE, name: '圆石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 6 } },
  [BlockType.OAK_PLANKS]: { id: BlockType.OAK_PLANKS, name: '橡木木板', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 7 } },
  [BlockType.OAK_LOG]: { id: BlockType.OAK_LOG, name: '橡木原木', solid: true, transparent: false, breakable: true, hardness: 11, textures: { top: 8, bottom: 8, side: 9 } },
  [BlockType.OAK_LEAVES]: { id: BlockType.OAK_LEAVES, name: '橡木树叶', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 10 } },
  [BlockType.SAND]: { id: BlockType.SAND, name: '沙子', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 11 } },
  [BlockType.SANDSTONE]: { id: BlockType.SANDSTONE, name: '砂岩', solid: true, transparent: false, breakable: true, hardness: 11, textures: { top: 12, bottom: 12, side: 13 } },
  [BlockType.WATER]: { id: BlockType.WATER, name: '水', solid: false, transparent: true, breakable: false, hardness: 0, textures: { all: 14 } },
  [BlockType.COAL_ORE]: { id: BlockType.COAL_ORE, name: '煤矿石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 15 } },
  [BlockType.IRON_ORE]: { id: BlockType.IRON_ORE, name: '铁矿石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 16 } },
  [BlockType.GOLD_ORE]: { id: BlockType.GOLD_ORE, name: '金矿石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 17 } },
  [BlockType.DIAMOND_ORE]: { id: BlockType.DIAMOND_ORE, name: '钻石矿石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 18 } },
  [BlockType.GRAVEL]: { id: BlockType.GRAVEL, name: '沙砾', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 19 } },
  [BlockType.CLAY]: { id: BlockType.CLAY, name: '粘土', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 20 } },
  [BlockType.CRAFTING_TABLE]: { id: BlockType.CRAFTING_TABLE, name: '工作台', solid: true, transparent: false, breakable: true, hardness: 11, textures: { top: 21, bottom: 7, side: 22 } },
  [BlockType.FURNACE]: { id: BlockType.FURNACE, name: '熔炉', solid: true, transparent: false, breakable: true, hardness: 11, textures: { top: 1, bottom: 1, side: 23 } },

  // Nether
  [BlockType.NETHERRACK]: { id: BlockType.NETHERRACK, name: '下界岩', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 30 } },
  [BlockType.SOUL_SAND]: { id: BlockType.SOUL_SAND, name: '灵魂沙', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 31 } },
  [BlockType.SOUL_SOIL]: { id: BlockType.SOUL_SOIL, name: '灵魂土', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 32 } },
  [BlockType.BASALT]: { id: BlockType.BASALT, name: '玄武岩', solid: true, transparent: false, breakable: true, hardness: 11, textures: { top: 33, bottom: 33, side: 34 } },
  [BlockType.BLACKSTONE]: { id: BlockType.BLACKSTONE, name: '黑石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 35 } },
  [BlockType.CRIMSON_NYLIUM]: { id: BlockType.CRIMSON_NYLIUM, name: '绯红菌岩', solid: true, transparent: false, breakable: true, hardness: 11, textures: { top: 36, bottom: 1, side: 37 } },
  [BlockType.WARPED_NYLIUM]: { id: BlockType.WARPED_NYLIUM, name: '诡异菌岩', solid: true, transparent: false, breakable: true, hardness: 11, textures: { top: 38, bottom: 1, side: 39 } },
  [BlockType.MAGMA_BLOCK]: { id: BlockType.MAGMA_BLOCK, name: '岩浆块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 40 } },
  [BlockType.GLOWSTONE]: { id: BlockType.GLOWSTONE, name: '荧石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 41 } },
  [BlockType.NETHER_BRICKS]: { id: BlockType.NETHER_BRICKS, name: '下界砖块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 42 } },

  // End
  [BlockType.END_STONE]: { id: BlockType.END_STONE, name: '末地石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 50 } },
  [BlockType.OBSIDIAN]: { id: BlockType.OBSIDIAN, name: '黑曜石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 51 } },
  [BlockType.PURPUR_BLOCK]: { id: BlockType.PURPUR_BLOCK, name: '紫珀块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 52 } },

  // Building
  [BlockType.STONE_BRICKS]: { id: BlockType.STONE_BRICKS, name: '石砖', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 60 } },
  [BlockType.MOSSY_STONE_BRICKS]: { id: BlockType.MOSSY_STONE_BRICKS, name: '苔石砖', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 61 } },
  [BlockType.BRICKS]: { id: BlockType.BRICKS, name: '砖块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 62 } },
  [BlockType.BOOKSHELF]: { id: BlockType.BOOKSHELF, name: '书架', solid: true, transparent: false, breakable: true, hardness: 11, textures: { top: 7, bottom: 7, side: 63 } },
  [BlockType.GLASS]: { id: BlockType.GLASS, name: '玻璃', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 64 } },
  [BlockType.TNT]: { id: BlockType.TNT, name: 'TNT', solid: true, transparent: false, breakable: true, hardness: 11, textures: { top: 82, bottom: 83, side: 84 } },

  // Mineral blocks
  [BlockType.IRON_BLOCK]: { id: BlockType.IRON_BLOCK, name: '铁块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 70 } },
  [BlockType.GOLD_BLOCK]: { id: BlockType.GOLD_BLOCK, name: '金块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 71 } },
  [BlockType.DIAMOND_BLOCK]: { id: BlockType.DIAMOND_BLOCK, name: '钻石块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 72 } },
  [BlockType.NETHERITE_BLOCK]: { id: BlockType.NETHERITE_BLOCK, name: '下界合金块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 73 } },

  // Special
  [BlockType.CHEST]: { id: BlockType.CHEST, name: '箱子', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 80 } },
  [BlockType.SPAWNER]: { id: BlockType.SPAWNER, name: '刷怪笼', solid: true, transparent: true, breakable: false, hardness: Infinity, textures: { all: 81 } },

  // Stone variants
  [BlockType.GRANITE]: { id: BlockType.GRANITE, name: '花岗岩', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 85 } },
  [BlockType.POLISHED_GRANITE]: { id: BlockType.POLISHED_GRANITE, name: '磨制花岗岩', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 86 } },
  [BlockType.DIORITE]: { id: BlockType.DIORITE, name: '闪长岩', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 87 } },
  [BlockType.POLISHED_DIORITE]: { id: BlockType.POLISHED_DIORITE, name: '磨制闪长岩', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 88 } },
  [BlockType.ANDESITE]: { id: BlockType.ANDESITE, name: '安山岩', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 89 } },
  [BlockType.POLISHED_ANDESITE]: { id: BlockType.POLISHED_ANDESITE, name: '磨制安山岩', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 90 } },
  [BlockType.SMOOTH_STONE]: { id: BlockType.SMOOTH_STONE, name: '平滑石头', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 91 } },
  [BlockType.MOSSY_COBBLESTONE]: { id: BlockType.MOSSY_COBBLESTONE, name: '苔圆石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 92 } },

  // Wood variants
  [BlockType.SPRUCE_LOG]: { id: BlockType.SPRUCE_LOG, name: '云杉原木', solid: true, transparent: false, breakable: true, hardness: 11, textures: { top: 8, bottom: 8, side: 93 } },
  [BlockType.SPRUCE_PLANKS]: { id: BlockType.SPRUCE_PLANKS, name: '云杉木板', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 94 } },
  [BlockType.SPRUCE_LEAVES]: { id: BlockType.SPRUCE_LEAVES, name: '云杉树叶', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 95 } },
  [BlockType.BIRCH_LOG]: { id: BlockType.BIRCH_LOG, name: '白桦原木', solid: true, transparent: false, breakable: true, hardness: 11, textures: { top: 8, bottom: 8, side: 96 } },
  [BlockType.BIRCH_PLANKS]: { id: BlockType.BIRCH_PLANKS, name: '白桦木板', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 97 } },
  [BlockType.BIRCH_LEAVES]: { id: BlockType.BIRCH_LEAVES, name: '白桦树叶', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 98 } },
  [BlockType.JUNGLE_LOG]: { id: BlockType.JUNGLE_LOG, name: '丛林原木', solid: true, transparent: false, breakable: true, hardness: 11, textures: { top: 8, bottom: 8, side: 99 } },
  [BlockType.JUNGLE_PLANKS]: { id: BlockType.JUNGLE_PLANKS, name: '丛林木板', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 100 } },
  [BlockType.JUNGLE_LEAVES]: { id: BlockType.JUNGLE_LEAVES, name: '丛林树叶', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 101 } },
  [BlockType.ACACIA_LOG]: { id: BlockType.ACACIA_LOG, name: '金合欢原木', solid: true, transparent: false, breakable: true, hardness: 11, textures: { top: 8, bottom: 8, side: 102 } },
  [BlockType.ACACIA_PLANKS]: { id: BlockType.ACACIA_PLANKS, name: '金合欢木板', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 103 } },
  [BlockType.ACACIA_LEAVES]: { id: BlockType.ACACIA_LEAVES, name: '金合欢树叶', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 104 } },
  [BlockType.DARK_OAK_LOG]: { id: BlockType.DARK_OAK_LOG, name: '深色橡木原木', solid: true, transparent: false, breakable: true, hardness: 11, textures: { top: 8, bottom: 8, side: 105 } },
  [BlockType.DARK_OAK_PLANKS]: { id: BlockType.DARK_OAK_PLANKS, name: '深色橡木木板', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 106 } },
  [BlockType.DARK_OAK_LEAVES]: { id: BlockType.DARK_OAK_LEAVES, name: '深色橡木树叶', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 107 } },

  // More ores
  [BlockType.EMERALD_ORE]: { id: BlockType.EMERALD_ORE, name: '绿宝石矿石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 108 } },
  [BlockType.REDSTONE_ORE]: { id: BlockType.REDSTONE_ORE, name: '红石矿石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 109 } },
  [BlockType.LAPIS_ORE]: { id: BlockType.LAPIS_ORE, name: '青金石矿石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 110 } },
  [BlockType.COPPER_ORE]: { id: BlockType.COPPER_ORE, name: '铜矿石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 111 } },
  [BlockType.DEEPSLATE]: { id: BlockType.DEEPSLATE, name: '深板岩', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 112 } },
  [BlockType.COPPER_BLOCK]: { id: BlockType.COPPER_BLOCK, name: '铜块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 113 } },
  [BlockType.EMERALD_BLOCK]: { id: BlockType.EMERALD_BLOCK, name: '绿宝石块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 114 } },
  [BlockType.LAPIS_BLOCK]: { id: BlockType.LAPIS_BLOCK, name: '青金石块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 115 } },
  [BlockType.REDSTONE_BLOCK]: { id: BlockType.REDSTONE_BLOCK, name: '红石块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 116 } },

  // Wool - use single color texture (colored by material)
  [BlockType.WHITE_WOOL]: { id: BlockType.WHITE_WOOL, name: '白色羊毛', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 117 } },
  [BlockType.ORANGE_WOOL]: { id: BlockType.ORANGE_WOOL, name: '橙色羊毛', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 118 } },
  [BlockType.MAGENTA_WOOL]: { id: BlockType.MAGENTA_WOOL, name: '品红色羊毛', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 119 } },
  [BlockType.LIGHT_BLUE_WOOL]: { id: BlockType.LIGHT_BLUE_WOOL, name: '淡蓝色羊毛', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 120 } },
  [BlockType.YELLOW_WOOL]: { id: BlockType.YELLOW_WOOL, name: '黄色羊毛', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 121 } },
  [BlockType.LIME_WOOL]: { id: BlockType.LIME_WOOL, name: '黄绿色羊毛', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 122 } },
  [BlockType.PINK_WOOL]: { id: BlockType.PINK_WOOL, name: '粉色羊毛', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 123 } },
  [BlockType.GRAY_WOOL]: { id: BlockType.GRAY_WOOL, name: '灰色羊毛', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 124 } },
  [BlockType.LIGHT_GRAY_WOOL]: { id: BlockType.LIGHT_GRAY_WOOL, name: '淡灰色羊毛', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 125 } },
  [BlockType.CYAN_WOOL]: { id: BlockType.CYAN_WOOL, name: '青色羊毛', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 126 } },
  [BlockType.PURPLE_WOOL]: { id: BlockType.PURPLE_WOOL, name: '紫色羊毛', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 127 } },
  [BlockType.BLUE_WOOL]: { id: BlockType.BLUE_WOOL, name: '蓝色羊毛', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 128 } },
  [BlockType.BROWN_WOOL]: { id: BlockType.BROWN_WOOL, name: '棕色羊毛', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 129 } },
  [BlockType.GREEN_WOOL]: { id: BlockType.GREEN_WOOL, name: '绿色羊毛', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 130 } },
  [BlockType.RED_WOOL]: { id: BlockType.RED_WOOL, name: '红色羊毛', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 131 } },
  [BlockType.BLACK_WOOL]: { id: BlockType.BLACK_WOOL, name: '黑色羊毛', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 132 } },

  // Stairs - reuse parent texture
  [BlockType.COBBLESTONE_STAIRS]: { id: BlockType.COBBLESTONE_STAIRS, name: '圆石楼梯', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 6 } },
  [BlockType.STONE_BRICK_STAIRS]: { id: BlockType.STONE_BRICK_STAIRS, name: '石砖楼梯', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 60 } },
  [BlockType.BRICK_STAIRS]: { id: BlockType.BRICK_STAIRS, name: '砖楼梯', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 62 } },
  [BlockType.OAK_STAIRS]: { id: BlockType.OAK_STAIRS, name: '橡木楼梯', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 7 } },
  [BlockType.SPRUCE_STAIRS]: { id: BlockType.SPRUCE_STAIRS, name: '云杉楼梯', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 94 } },
  [BlockType.BIRCH_STAIRS]: { id: BlockType.BIRCH_STAIRS, name: '白桦楼梯', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 97 } },
  [BlockType.SANDSTONE_STAIRS]: { id: BlockType.SANDSTONE_STAIRS, name: '砂岩楼梯', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 13 } },

  // Stained Glass - 各自对应颜色贴图
  [BlockType.WHITE_STAINED_GLASS]: { id: BlockType.WHITE_STAINED_GLASS, name: '白色染色玻璃', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 239 } },
  [BlockType.ORANGE_STAINED_GLASS]: { id: BlockType.ORANGE_STAINED_GLASS, name: '橙色染色玻璃', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 240 } },
  [BlockType.MAGENTA_STAINED_GLASS]: { id: BlockType.MAGENTA_STAINED_GLASS, name: '品红色染色玻璃', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 241 } },
  [BlockType.LIGHT_BLUE_STAINED_GLASS]: { id: BlockType.LIGHT_BLUE_STAINED_GLASS, name: '淡蓝色染色玻璃', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 242 } },
  [BlockType.YELLOW_STAINED_GLASS]: { id: BlockType.YELLOW_STAINED_GLASS, name: '黄色染色玻璃', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 243 } },
  [BlockType.LIME_STAINED_GLASS]: { id: BlockType.LIME_STAINED_GLASS, name: '黄绿色染色玻璃', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 244 } },
  [BlockType.PINK_STAINED_GLASS]: { id: BlockType.PINK_STAINED_GLASS, name: '粉色染色玻璃', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 245 } },
  [BlockType.GRAY_STAINED_GLASS]: { id: BlockType.GRAY_STAINED_GLASS, name: '灰色染色玻璃', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 246 } },
  [BlockType.LIGHT_GRAY_STAINED_GLASS]: { id: BlockType.LIGHT_GRAY_STAINED_GLASS, name: '淡灰色染色玻璃', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 247 } },
  [BlockType.CYAN_STAINED_GLASS]: { id: BlockType.CYAN_STAINED_GLASS, name: '青色染色玻璃', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 248 } },
  [BlockType.PURPLE_STAINED_GLASS]: { id: BlockType.PURPLE_STAINED_GLASS, name: '紫色染色玻璃', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 249 } },
  [BlockType.BLUE_STAINED_GLASS]: { id: BlockType.BLUE_STAINED_GLASS, name: '蓝色染色玻璃', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 250 } },
  [BlockType.BROWN_STAINED_GLASS]: { id: BlockType.BROWN_STAINED_GLASS, name: '棕色染色玻璃', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 251 } },
  [BlockType.GREEN_STAINED_GLASS]: { id: BlockType.GREEN_STAINED_GLASS, name: '绿色染色玻璃', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 252 } },
  [BlockType.RED_STAINED_GLASS]: { id: BlockType.RED_STAINED_GLASS, name: '红色染色玻璃', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 253 } },
  [BlockType.BLACK_STAINED_GLASS]: { id: BlockType.BLACK_STAINED_GLASS, name: '黑色染色玻璃', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 254 } },

  // Concrete
  [BlockType.WHITE_CONCRETE]: { id: BlockType.WHITE_CONCRETE, name: '白色混凝土', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 133 } },
  [BlockType.ORANGE_CONCRETE]: { id: BlockType.ORANGE_CONCRETE, name: '橙色混凝土', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 134 } },
  [BlockType.YELLOW_CONCRETE]: { id: BlockType.YELLOW_CONCRETE, name: '黄色混凝土', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 135 } },
  [BlockType.LIGHT_BLUE_CONCRETE]: { id: BlockType.LIGHT_BLUE_CONCRETE, name: '淡蓝色混凝土', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 136 } },
  [BlockType.LIME_CONCRETE]: { id: BlockType.LIME_CONCRETE, name: '黄绿色混凝土', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 137 } },
  [BlockType.PINK_CONCRETE]: { id: BlockType.PINK_CONCRETE, name: '粉色混凝土', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 138 } },
  [BlockType.GRAY_CONCRETE]: { id: BlockType.GRAY_CONCRETE, name: '灰色混凝土', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 139 } },
  [BlockType.CYAN_CONCRETE]: { id: BlockType.CYAN_CONCRETE, name: '青色混凝土', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 140 } },
  [BlockType.PURPLE_CONCRETE]: { id: BlockType.PURPLE_CONCRETE, name: '紫色混凝土', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 141 } },
  [BlockType.BLUE_CONCRETE]: { id: BlockType.BLUE_CONCRETE, name: '蓝色混凝土', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 142 } },
  [BlockType.BROWN_CONCRETE]: { id: BlockType.BROWN_CONCRETE, name: '棕色混凝土', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 143 } },
  [BlockType.GREEN_CONCRETE]: { id: BlockType.GREEN_CONCRETE, name: '绿色混凝土', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 144 } },
  [BlockType.RED_CONCRETE]: { id: BlockType.RED_CONCRETE, name: '红色混凝土', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 145 } },
  [BlockType.BLACK_CONCRETE]: { id: BlockType.BLACK_CONCRETE, name: '黑色混凝土', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 146 } },

  // Terracotta
  [BlockType.TERRACOTTA]: { id: BlockType.TERRACOTTA, name: '陶瓦', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 147 } },
  [BlockType.WHITE_TERRACOTTA]: { id: BlockType.WHITE_TERRACOTTA, name: '白色陶瓦', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 223 } },
  [BlockType.ORANGE_TERRACOTTA]: { id: BlockType.ORANGE_TERRACOTTA, name: '橙色陶瓦', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 224 } },
  [BlockType.YELLOW_TERRACOTTA]: { id: BlockType.YELLOW_TERRACOTTA, name: '黄色陶瓦', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 225 } },
  [BlockType.LIGHT_BLUE_TERRACOTTA]: { id: BlockType.LIGHT_BLUE_TERRACOTTA, name: '淡蓝色陶瓦', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 226 } },
  [BlockType.LIME_TERRACOTTA]: { id: BlockType.LIME_TERRACOTTA, name: '黄绿色陶瓦', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 227 } },
  [BlockType.PINK_TERRACOTTA]: { id: BlockType.PINK_TERRACOTTA, name: '粉色陶瓦', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 228 } },
  [BlockType.GRAY_TERRACOTTA]: { id: BlockType.GRAY_TERRACOTTA, name: '灰色陶瓦', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 229 } },
  [BlockType.CYAN_TERRACOTTA]: { id: BlockType.CYAN_TERRACOTTA, name: '青色陶瓦', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 230 } },
  [BlockType.PURPLE_TERRACOTTA]: { id: BlockType.PURPLE_TERRACOTTA, name: '紫色陶瓦', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 231 } },
  [BlockType.BLUE_TERRACOTTA]: { id: BlockType.BLUE_TERRACOTTA, name: '蓝色陶瓦', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 232 } },
  [BlockType.BROWN_TERRACOTTA]: { id: BlockType.BROWN_TERRACOTTA, name: '棕色陶瓦', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 233 } },
  [BlockType.GREEN_TERRACOTTA]: { id: BlockType.GREEN_TERRACOTTA, name: '绿色陶瓦', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 234 } },
  [BlockType.RED_TERRACOTTA]: { id: BlockType.RED_TERRACOTTA, name: '红色陶瓦', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 235 } },
  [BlockType.BLACK_TERRACOTTA]: { id: BlockType.BLACK_TERRACOTTA, name: '黑色陶瓦', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 236 } },

  // Sandstone variants
  [BlockType.CHISELED_SANDSTONE]: { id: BlockType.CHISELED_SANDSTONE, name: '雕纹砂岩', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 12 } },
  [BlockType.SMOOTH_SANDSTONE]: { id: BlockType.SMOOTH_SANDSTONE, name: '平滑砂岩', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 12 } },
  [BlockType.RED_SAND]: { id: BlockType.RED_SAND, name: '红沙', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 24 } },
  [BlockType.RED_SANDSTONE]: { id: BlockType.RED_SANDSTONE, name: '红砂岩', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 25 } },

  // Nether variants
  [BlockType.POLISHED_BLACKSTONE]: { id: BlockType.POLISHED_BLACKSTONE, name: '磨制黑石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 35 } },
  [BlockType.CRACKED_NETHER_BRICKS]: { id: BlockType.CRACKED_NETHER_BRICKS, name: '裂纹下界砖块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 42 } },
  [BlockType.RED_NETHER_BRICKS]: { id: BlockType.RED_NETHER_BRICKS, name: '红色下界砖块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 150 } },
  [BlockType.NETHER_GOLD_ORE]: { id: BlockType.NETHER_GOLD_ORE, name: '下界金矿石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 151 } },
  [BlockType.NETHER_QUARTZ_ORE]: { id: BlockType.NETHER_QUARTZ_ORE, name: '下界石英矿石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 152 } },
  [BlockType.QUARTZ_BLOCK]: { id: BlockType.QUARTZ_BLOCK, name: '石英块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 153 } },
  [BlockType.SMOOTH_QUARTZ]: { id: BlockType.SMOOTH_QUARTZ, name: '平滑石英', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 153 } },
  [BlockType.CHISELED_QUARTZ]: { id: BlockType.CHISELED_QUARTZ, name: '雕纹石英块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 153 } },

  // End variants
  [BlockType.END_STONE_BRICKS]: { id: BlockType.END_STONE_BRICKS, name: '末地石砖', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 154 } },
  [BlockType.PURPUR_PILLAR]: { id: BlockType.PURPUR_PILLAR, name: '紫珀柱', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 52 } },
  [BlockType.CRYING_OBSIDIAN]: { id: BlockType.CRYING_OBSIDIAN, name: '哭泣的黑曜石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 155 } },

  // Utility blocks
  [BlockType.ANVIL]: { id: BlockType.ANVIL, name: '铁砧', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 156 } },
  [BlockType.CHIPPED_ANVIL]: { id: BlockType.CHIPPED_ANVIL, name: '开裂的铁砧', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 156 } },
  [BlockType.DAMAGED_ANVIL]: { id: BlockType.DAMAGED_ANVIL, name: '损坏的铁砧', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 156 } },
  [BlockType.GRINDSTONE]: { id: BlockType.GRINDSTONE, name: '砂轮', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 157 } },
  [BlockType.STONECUTTER]: { id: BlockType.STONECUTTER, name: '切石机', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 158 } },
  [BlockType.LOOM]: { id: BlockType.LOOM, name: '织布机', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 159 } },
  [BlockType.CARTOGRAPHY_TABLE]: { id: BlockType.CARTOGRAPHY_TABLE, name: '制图台', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 160 } },
  [BlockType.FLETCHING_TABLE]: { id: BlockType.FLETCHING_TABLE, name: '制箭台', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 161 } },
  [BlockType.SMITHING_TABLE]: { id: BlockType.SMITHING_TABLE, name: '锻造台', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 162 } },
  [BlockType.BLAST_FURNACE]: { id: BlockType.BLAST_FURNACE, name: '高炉', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 163 } },
  [BlockType.SMOKER]: { id: BlockType.SMOKER, name: '烟熏炉', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 164 } },
  [BlockType.COMPOSTER]: { id: BlockType.COMPOSTER, name: '堆肥桶', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 165 } },
  [BlockType.BARREL]: { id: BlockType.BARREL, name: '木桶', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 166 } },
  [BlockType.BELL]: { id: BlockType.BELL, name: '钟', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 167 } },
  [BlockType.LECTERN]: { id: BlockType.LECTERN, name: '讲台', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 168 } },
  [BlockType.BEACON]: { id: BlockType.BEACON, name: '信标', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 169 } },

  // Ice and snow
  [BlockType.ICE]: { id: BlockType.ICE, name: '冰', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 170 } },
  [BlockType.PACKED_ICE]: { id: BlockType.PACKED_ICE, name: '浮冰', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 171 } },
  [BlockType.BLUE_ICE]: { id: BlockType.BLUE_ICE, name: '蓝冰', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 172 } },
  [BlockType.SNOW_BLOCK]: { id: BlockType.SNOW_BLOCK, name: '雪块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 173 } },
  [BlockType.SNOW]: { id: BlockType.SNOW, name: '雪', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 173 } },
  [BlockType.FROSTED_ICE]: { id: BlockType.FROSTED_ICE, name: '霜冰', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 170 } },

  // Plants
  [BlockType.CACTUS]: { id: BlockType.CACTUS, name: '仙人掌', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 174 } },
  [BlockType.SUGAR_CANE]: { id: BlockType.SUGAR_CANE, name: '甘蔗', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 175 } },
  [BlockType.PUMPKIN]: { id: BlockType.PUMPKIN, name: '南瓜', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 176 } },
  [BlockType.MELON]: { id: BlockType.MELON, name: '西瓜', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 177 } },
  [BlockType.HAY_BALE]: { id: BlockType.HAY_BALE, name: '干草块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 178 } },
  [BlockType.BONE_BLOCK]: { id: BlockType.BONE_BLOCK, name: '骨块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 179 } },
  [BlockType.DRIED_KELP_BLOCK]: { id: BlockType.DRIED_KELP_BLOCK, name: '干海带块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 180 } },
  [BlockType.BAMBOO_BLOCK]: { id: BlockType.BAMBOO_BLOCK, name: '竹子块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 181 } },

  // Coral and prismarine
  [BlockType.PRISMARINE]: { id: BlockType.PRISMARINE, name: '海晶石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 182 } },
  [BlockType.PRISMARINE_BRICKS]: { id: BlockType.PRISMARINE_BRICKS, name: '海晶石砖', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 183 } },
  [BlockType.DARK_PRISMARINE]: { id: BlockType.DARK_PRISMARINE, name: '暗海晶石', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 184 } },
  [BlockType.SEA_LANTERN]: { id: BlockType.SEA_LANTERN, name: '海晶灯', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 185 } },

  // Mushroom blocks
  [BlockType.MUSHROOM_STEM]: { id: BlockType.MUSHROOM_STEM, name: '蘑菇柄', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 186 } },
  [BlockType.RED_MUSHROOM_BLOCK]: { id: BlockType.RED_MUSHROOM_BLOCK, name: '红色蘑菇块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 187 } },
  [BlockType.BROWN_MUSHROOM_BLOCK]: { id: BlockType.BROWN_MUSHROOM_BLOCK, name: '棕色蘑菇块', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 188 } },
  [BlockType.MYCELIUM]: { id: BlockType.MYCELIUM, name: '菌丝', solid: true, transparent: false, breakable: true, hardness: 11, textures: { all: 189 } },

  // Slabs
  [BlockType.STONE_SLAB]: { id: BlockType.STONE_SLAB, name: '石头台阶', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 1 } },
  [BlockType.COBBLESTONE_SLAB]: { id: BlockType.COBBLESTONE_SLAB, name: '圆石台阶', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 6 } },
  [BlockType.STONE_BRICK_SLAB]: { id: BlockType.STONE_BRICK_SLAB, name: '石砖台阶', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 60 } },
  [BlockType.BRICK_SLAB]: { id: BlockType.BRICK_SLAB, name: '砖台阶', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 62 } },
  [BlockType.OAK_SLAB]: { id: BlockType.OAK_SLAB, name: '橡木台阶', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 7 } },
  [BlockType.SPRUCE_SLAB]: { id: BlockType.SPRUCE_SLAB, name: '云杉台阶', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 94 } },
  [BlockType.BIRCH_SLAB]: { id: BlockType.BIRCH_SLAB, name: '白桦台阶', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 97 } },
  [BlockType.SANDSTONE_SLAB]: { id: BlockType.SANDSTONE_SLAB, name: '砂岩台阶', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 13 } },

  // Fences
  [BlockType.OAK_FENCE]: { id: BlockType.OAK_FENCE, name: '橡木栅栏', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 7 } },
  [BlockType.SPRUCE_FENCE]: { id: BlockType.SPRUCE_FENCE, name: '云杉栅栏', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 94 } },
  [BlockType.BIRCH_FENCE]: { id: BlockType.BIRCH_FENCE, name: '白桦栅栏', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 97 } },
  [BlockType.JUNGLE_FENCE]: { id: BlockType.JUNGLE_FENCE, name: '丛林栅栏', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 100 } },
  [BlockType.ACACIA_FENCE]: { id: BlockType.ACACIA_FENCE, name: '金合欢栅栏', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 103 } },
  [BlockType.DARK_OAK_FENCE]: { id: BlockType.DARK_OAK_FENCE, name: '深色橡木栅栏', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 106 } },
  [BlockType.NETHER_BRICK_FENCE]: { id: BlockType.NETHER_BRICK_FENCE, name: '下界砖栅栏', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 42 } },

  // Walls
  [BlockType.COBBLESTONE_WALL]: { id: BlockType.COBBLESTONE_WALL, name: '圆石墙', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 6 } },
  [BlockType.MOSSY_COBBLESTONE_WALL]: { id: BlockType.MOSSY_COBBLESTONE_WALL, name: '苔圆石墙', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 92 } },
  [BlockType.STONE_BRICK_WALL]: { id: BlockType.STONE_BRICK_WALL, name: '石砖墙', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 60 } },
  [BlockType.BRICK_WALL]: { id: BlockType.BRICK_WALL, name: '砖墙', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 62 } },
  [BlockType.ANDESITE_WALL]: { id: BlockType.ANDESITE_WALL, name: '安山岩墙', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 89 } },
  [BlockType.DIORITE_WALL]: { id: BlockType.DIORITE_WALL, name: '闪长岩墙', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 87 } },
  [BlockType.GRANITE_WALL]: { id: BlockType.GRANITE_WALL, name: '花岗岩墙', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 85 } },

  // Doors
  [BlockType.OAK_DOOR]: { id: BlockType.OAK_DOOR, name: '橡木门', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 43 } },
  [BlockType.SPRUCE_DOOR]: { id: BlockType.SPRUCE_DOOR, name: '云杉木门', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 44 } },
  [BlockType.BIRCH_DOOR]: { id: BlockType.BIRCH_DOOR, name: '白桦木门', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 45 } },
  [BlockType.JUNGLE_DOOR]: { id: BlockType.JUNGLE_DOOR, name: '丛林木门', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 46 } },
  [BlockType.ACACIA_DOOR]: { id: BlockType.ACACIA_DOOR, name: '金合欢木门', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 47 } },
  [BlockType.DARK_OAK_DOOR]: { id: BlockType.DARK_OAK_DOOR, name: '深色橡木门', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 48 } },
  [BlockType.IRON_DOOR]: { id: BlockType.IRON_DOOR, name: '铁门', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 49 } },

  // Trapdoors
  [BlockType.OAK_TRAPDOOR]: { id: BlockType.OAK_TRAPDOOR, name: '橡木活板门', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 53 } },
  [BlockType.SPRUCE_TRAPDOOR]: { id: BlockType.SPRUCE_TRAPDOOR, name: '云杉木活板门', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 54 } },
  [BlockType.BIRCH_TRAPDOOR]: { id: BlockType.BIRCH_TRAPDOOR, name: '白桦木活板门', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 55 } },
  [BlockType.JUNGLE_TRAPDOOR]: { id: BlockType.JUNGLE_TRAPDOOR, name: '丛林木活板门', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 56 } },
  [BlockType.ACACIA_TRAPDOOR]: { id: BlockType.ACACIA_TRAPDOOR, name: '金合欢木活板门', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 57 } },
  [BlockType.DARK_OAK_TRAPDOOR]: { id: BlockType.DARK_OAK_TRAPDOOR, name: '深色橡木活板门', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 58 } },
  [BlockType.IRON_TRAPDOOR]: { id: BlockType.IRON_TRAPDOOR, name: '铁活板门', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 59 } },

  // Buttons and pressure plates
  [BlockType.OAK_BUTTON]: { id: BlockType.OAK_BUTTON, name: '橡木按钮', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 7 } },
  [BlockType.STONE_BUTTON]: { id: BlockType.STONE_BUTTON, name: '石头按钮', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 1 } },
  [BlockType.OAK_PRESSURE_PLATE]: { id: BlockType.OAK_PRESSURE_PLATE, name: '橡木压力板', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 7 } },
  [BlockType.STONE_PRESSURE_PLATE]: { id: BlockType.STONE_PRESSURE_PLATE, name: '石头压力板', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 1 } },
  [BlockType.LIGHT_WEIGHTED_PRESSURE_PLATE]: { id: BlockType.LIGHT_WEIGHTED_PRESSURE_PLATE, name: '轻质测重压力板', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 71 } },
  [BlockType.HEAVY_WEIGHTED_PRESSURE_PLATE]: { id: BlockType.HEAVY_WEIGHTED_PRESSURE_PLATE, name: '重质测重压力板', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 70 } },

  // Miscellaneous
  [BlockType.LADDER]: { id: BlockType.LADDER, name: '梯子', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 65 } },
  [BlockType.RAIL]: { id: BlockType.RAIL, name: '铁轨', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 190 } },
  [BlockType.POWERED_RAIL]: { id: BlockType.POWERED_RAIL, name: '充能铁轨', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 190 } },
  [BlockType.DETECTOR_RAIL]: { id: BlockType.DETECTOR_RAIL, name: '探测铁轨', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 190 } },
  [BlockType.ACTIVATOR_RAIL]: { id: BlockType.ACTIVATOR_RAIL, name: '激活铁轨', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 190 } },
  [BlockType.TORCH]: { id: BlockType.TORCH, name: '火把', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 191 } },
  [BlockType.SOUL_TORCH]: { id: BlockType.SOUL_TORCH, name: '灵魂火把', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 192 } },
  [BlockType.LANTERN]: { id: BlockType.LANTERN, name: '灯笼', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 193 } },
  [BlockType.SOUL_LANTERN]: { id: BlockType.SOUL_LANTERN, name: '灵魂灯笼', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 194 } },
  [BlockType.CHAIN]: { id: BlockType.CHAIN, name: '锁链', solid: false, transparent: true, breakable: true, hardness: 11, textures: { all: 195 } },

  // Beds - simplified, use wool texture
  [BlockType.WHITE_BED]: { id: BlockType.WHITE_BED, name: '白色床', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 117 } },
  [BlockType.ORANGE_BED]: { id: BlockType.ORANGE_BED, name: '橙色床', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 118 } },
  [BlockType.MAGENTA_BED]: { id: BlockType.MAGENTA_BED, name: '品红色床', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 119 } },
  [BlockType.LIGHT_BLUE_BED]: { id: BlockType.LIGHT_BLUE_BED, name: '淡蓝色床', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 120 } },
  [BlockType.YELLOW_BED]: { id: BlockType.YELLOW_BED, name: '黄色床', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 121 } },
  [BlockType.LIME_BED]: { id: BlockType.LIME_BED, name: '黄绿色床', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 122 } },
  [BlockType.PINK_BED]: { id: BlockType.PINK_BED, name: '粉色床', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 123 } },
  [BlockType.GRAY_BED]: { id: BlockType.GRAY_BED, name: '灰色床', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 124 } },
  [BlockType.LIGHT_GRAY_BED]: { id: BlockType.LIGHT_GRAY_BED, name: '淡灰色床', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 125 } },
  [BlockType.CYAN_BED]: { id: BlockType.CYAN_BED, name: '青色床', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 126 } },
  [BlockType.PURPLE_BED]: { id: BlockType.PURPLE_BED, name: '紫色床', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 127 } },
  [BlockType.BLUE_BED]: { id: BlockType.BLUE_BED, name: '蓝色床', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 128 } },
  [BlockType.BROWN_BED]: { id: BlockType.BROWN_BED, name: '棕色床', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 129 } },
  [BlockType.GREEN_BED]: { id: BlockType.GREEN_BED, name: '绿色床', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 130 } },
  [BlockType.RED_BED]: { id: BlockType.RED_BED, name: '红色床', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 131 } },
  [BlockType.BLACK_BED]: { id: BlockType.BLACK_BED, name: '黑色床', solid: true, transparent: true, breakable: true, hardness: 11, textures: { all: 132 } },
  // Redstone components
  [BlockType.REDSTONE_DUST]: { id: BlockType.REDSTONE_DUST, name: '红石粉', solid: false, transparent: true, breakable: true, hardness: 1, textures: { all: 196 } },
  [BlockType.PISTON]: { id: BlockType.PISTON, name: '活塞', solid: true, transparent: false, breakable: true, hardness: 12, textures: { top: 197, bottom: 66, side: 198 } },
  [BlockType.STICKY_PISTON]: { id: BlockType.STICKY_PISTON, name: '粘性活塞', solid: true, transparent: false, breakable: true, hardness: 12, textures: { top: 199, bottom: 66, side: 198 } },
  [BlockType.REPEATER]: { id: BlockType.REPEATER, name: '红石中继器', solid: false, transparent: true, breakable: true, hardness: 2, textures: { all: 200 } },
  [BlockType.COMPARATOR]: { id: BlockType.COMPARATOR, name: '红石比较器', solid: false, transparent: true, breakable: true, hardness: 2, textures: { all: 201 } },
  [BlockType.OBSERVER]: { id: BlockType.OBSERVER, name: '侦测器', solid: true, transparent: false, breakable: true, hardness: 12, textures: { all: 202 } },
  [BlockType.HOPPER]: { id: BlockType.HOPPER, name: '漏斗', solid: true, transparent: false, breakable: true, hardness: 12, textures: { all: 203 } },
  [BlockType.PISTON_HEAD]: { id: BlockType.PISTON_HEAD, name: '活塞头', solid: true, transparent: false, breakable: true, hardness: 2, textures: { all: 197 } },
  [BlockType.LEVER]: { id: BlockType.LEVER, name: '拉杆', solid: false, transparent: true, breakable: true, hardness: 2, textures: { all: 206 } },
  [BlockType.LEVER_ON]: { id: BlockType.LEVER_ON, name: '激活的拉杆', solid: false, transparent: true, breakable: true, hardness: 2, textures: { all: 207 } },
  [BlockType.REDSTONE_TORCH]: { id: BlockType.REDSTONE_TORCH, name: '红石火把', solid: false, transparent: true, breakable: true, hardness: 0.5, textures: { all: 204 } },
  [BlockType.REDSTONE_TORCH_ON]: { id: BlockType.REDSTONE_TORCH_ON, name: '红石火把(充能)', solid: false, transparent: true, breakable: true, hardness: 0.5, textures: { all: 205 } },

  // === 指令专属方块 (创造模式+作弊才能获取) ===
  [BlockType.COMMAND_BLOCK]: { id: BlockType.COMMAND_BLOCK, name: '命令方块', solid: true, transparent: false, breakable: true, hardness: 1, textures: { all: 210 }, commandExclusive: true },
  [BlockType.CHAIN_COMMAND_BLOCK]: { id: BlockType.CHAIN_COMMAND_BLOCK, name: '连锁命令方块', solid: true, transparent: false, breakable: true, hardness: 1, textures: { all: 211 }, commandExclusive: true },
  [BlockType.REPEAT_COMMAND_BLOCK]: { id: BlockType.REPEAT_COMMAND_BLOCK, name: '循环命令方块', solid: true, transparent: false, breakable: true, hardness: 1, textures: { all: 212 }, commandExclusive: true },
  [BlockType.BARRIER]: { id: BlockType.BARRIER, name: '屏障', solid: true, transparent: true, breakable: false, hardness: Infinity, textures: { all: 213 }, commandExclusive: true },
  [BlockType.STRUCTURE_BLOCK]: { id: BlockType.STRUCTURE_BLOCK, name: '结构方块', solid: true, transparent: false, breakable: true, hardness: 1, textures: { all: 214 }, commandExclusive: true },
  [BlockType.JIGSAW_BLOCK]: { id: BlockType.JIGSAW_BLOCK, name: '拼图方块', solid: true, transparent: false, breakable: true, hardness: 1, textures: { all: 215 }, commandExclusive: true },
  [BlockType.LIGHT_BLOCK]: { id: BlockType.LIGHT_BLOCK, name: '光源方块', solid: false, transparent: true, breakable: true, hardness: 1, textures: { all: 216 }, commandExclusive: true },
  [BlockType.STRUCTURE_VOID]: { id: BlockType.STRUCTURE_VOID, name: '结构空位', solid: false, transparent: true, breakable: true, hardness: 1, textures: { all: 217 }, commandExclusive: true },

  // Steel (custom — rarest ore, best gear)
  [BlockType.STEEL_ORE]: { id: BlockType.STEEL_ORE, name: '钢矿石', solid: true, transparent: false, breakable: true, hardness: 15, textures: { all: 218 } },
  [BlockType.STEEL_BLOCK]: { id: BlockType.STEEL_BLOCK, name: '钢块', solid: true, transparent: false, breakable: true, hardness: 15, textures: { all: 219 } },

  // === 传送门 ===
  [BlockType.NETHER_PORTAL]: { id: BlockType.NETHER_PORTAL, name: '地狱传送门', solid: false, transparent: true, breakable: false, hardness: Infinity, textures: { all: 220 } },
  [BlockType.END_PORTAL]: { id: BlockType.END_PORTAL, name: '末地传送门', solid: false, transparent: true, breakable: false, hardness: Infinity, textures: { all: 221 } },
  [BlockType.END_PORTAL_FRAME]: { id: BlockType.END_PORTAL_FRAME, name: '末地传送门框架', solid: true, transparent: false, breakable: false, hardness: Infinity, textures: { all: 222 } },
}

export function getBlockDefinition(type: BlockType): BlockDefinition {
  return BLOCK_REGISTRY[type] || BLOCK_REGISTRY[BlockType.AIR]
}

export function isSolid(type: BlockType): boolean {
  return getBlockDefinition(type).solid
}

export function isTransparent(type: BlockType): boolean {
  return getBlockDefinition(type).transparent
}

export function isBreakable(type: BlockType): boolean {
  return getBlockDefinition(type).breakable
}

/** Resolve a placeable inventory item such as `oak_planks` to its block type. */
export function getBlockTypeForItem(itemId: string | null): BlockType | undefined {
  if (!itemId) return undefined
  const value = (BlockType as unknown as Record<string, unknown>)[itemId.toUpperCase()]
  if (typeof value !== 'number' || value === BlockType.AIR || !BLOCK_REGISTRY[value]) return undefined
  return value as BlockType
}
