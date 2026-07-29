/**
 * Item Registry - 所有物品定义
 */

export interface ItemDefinition {
  id: string
  name: string
  type: 'block' | 'tool' | 'weapon' | 'material' | 'food' | 'armor' | 'utility'
  stackSize: number
  damage?: number
  durability?: number
  toolType?: 'pickaxe' | 'axe' | 'shovel' | 'hoe' | 'sword'
  toolLevel?: 'wood' | 'stone' | 'iron' | 'gold' | 'diamond' | 'netherite' | 'steel'
  miningSpeed?: number
  armorType?: 'helmet' | 'chestplate' | 'leggings' | 'boots'
  armorPoints?: number
}

export const ITEM_REGISTRY: Record<string, ItemDefinition> = {
  // === Block items (all placeable blocks) ===
  dirt: { id: 'dirt', name: '泥土', type: 'block', stackSize: 64 },
  stone: { id: 'stone', name: '石头', type: 'block', stackSize: 64 },
  grass_block: { id: 'grass_block', name: '草方块', type: 'block', stackSize: 64 },
  cobblestone: { id: 'cobblestone', name: '圆石', type: 'block', stackSize: 64 },
  oak_planks: { id: 'oak_planks', name: '橡木木板', type: 'block', stackSize: 64 },
  oak_log: { id: 'oak_log', name: '橡木原木', type: 'block', stackSize: 64 },
  sand: { id: 'sand', name: '沙子', type: 'block', stackSize: 64 },
  sandstone: { id: 'sandstone', name: '砂岩', type: 'block', stackSize: 64 },
  gravel: { id: 'gravel', name: '沙砾', type: 'block', stackSize: 64 },
  clay: { id: 'clay', name: '粘土', type: 'block', stackSize: 64 },
  crafting_table: { id: 'crafting_table', name: '工作台', type: 'block', stackSize: 64 },
  furnace: { id: 'furnace', name: '熔炉', type: 'block', stackSize: 64 },
  obsidian: { id: 'obsidian', name: '黑曜石', type: 'block', stackSize: 64 },
  netherrack: { id: 'netherrack', name: '下界岩', type: 'block', stackSize: 64 },
  soul_sand: { id: 'soul_sand', name: '灵魂沙', type: 'block', stackSize: 64 },
  end_stone: { id: 'end_stone', name: '末地石', type: 'block', stackSize: 64 },
  chest: { id: 'chest', name: '箱子', type: 'block', stackSize: 64 },
  bookshelf: { id: 'bookshelf', name: '书架', type: 'block', stackSize: 64 },
  tnt: { id: 'tnt', name: 'TNT', type: 'block', stackSize: 64 },
  glass: { id: 'glass', name: '玻璃', type: 'block', stackSize: 64 },
  glowstone: { id: 'glowstone', name: '荧石', type: 'block', stackSize: 64 },

  // Stone variants
  granite: { id: 'granite', name: '花岗岩', type: 'block', stackSize: 64 },
  polished_granite: { id: 'polished_granite', name: '磨制花岗岩', type: 'block', stackSize: 64 },
  diorite: { id: 'diorite', name: '闪长岩', type: 'block', stackSize: 64 },
  polished_diorite: { id: 'polished_diorite', name: '磨制闪长岩', type: 'block', stackSize: 64 },
  andesite: { id: 'andesite', name: '安山岩', type: 'block', stackSize: 64 },
  polished_andesite: { id: 'polished_andesite', name: '磨制安山岩', type: 'block', stackSize: 64 },
  smooth_stone: { id: 'smooth_stone', name: '平滑石头', type: 'block', stackSize: 64 },
  mossy_cobblestone: { id: 'mossy_cobblestone', name: '苔圆石', type: 'block', stackSize: 64 },
  stone_bricks: { id: 'stone_bricks', name: '石砖', type: 'block', stackSize: 64 },
  mossy_stone_bricks: { id: 'mossy_stone_bricks', name: '苔石砖', type: 'block', stackSize: 64 },
  bricks: { id: 'bricks', name: '砖块', type: 'block', stackSize: 64 },

  // Wood variants
  spruce_log: { id: 'spruce_log', name: '云杉原木', type: 'block', stackSize: 64 },
  spruce_planks: { id: 'spruce_planks', name: '云杉木板', type: 'block', stackSize: 64 },
  birch_log: { id: 'birch_log', name: '白桦原木', type: 'block', stackSize: 64 },
  birch_planks: { id: 'birch_planks', name: '白桦木板', type: 'block', stackSize: 64 },
  jungle_log: { id: 'jungle_log', name: '丛林原木', type: 'block', stackSize: 64 },
  jungle_planks: { id: 'jungle_planks', name: '丛林木板', type: 'block', stackSize: 64 },
  acacia_log: { id: 'acacia_log', name: '金合欢原木', type: 'block', stackSize: 64 },
  acacia_planks: { id: 'acacia_planks', name: '金合欢木板', type: 'block', stackSize: 64 },
  dark_oak_log: { id: 'dark_oak_log', name: '深色橡木原木', type: 'block', stackSize: 64 },
  dark_oak_planks: { id: 'dark_oak_planks', name: '深色橡木木板', type: 'block', stackSize: 64 },

  // Nether blocks
  basalt: { id: 'basalt', name: '玄武岩', type: 'block', stackSize: 64 },
  blackstone: { id: 'blackstone', name: '黑石', type: 'block', stackSize: 64 },
  crimson_nylium: { id: 'crimson_nylium', name: '绯红菌岩', type: 'block', stackSize: 64 },
  warped_nylium: { id: 'warped_nylium', name: '诡异菌岩', type: 'block', stackSize: 64 },
  magma_block: { id: 'magma_block', name: '岩浆块', type: 'block', stackSize: 64 },
  nether_bricks: { id: 'nether_bricks', name: '下界砖块', type: 'block', stackSize: 64 },

  // End blocks
  purpur_block: { id: 'purpur_block', name: '紫珀块', type: 'block', stackSize: 64 },
  end_stone_bricks: { id: 'end_stone_bricks', name: '末地石砖', type: 'block', stackSize: 64 },
  crying_obsidian: { id: 'crying_obsidian', name: '哭泣的黑曜石', type: 'block', stackSize: 64 },

  // Mineral blocks
  iron_block: { id: 'iron_block', name: '铁块', type: 'block', stackSize: 64 },
  gold_block: { id: 'gold_block', name: '金块', type: 'block', stackSize: 64 },
  diamond_block: { id: 'diamond_block', name: '钻石块', type: 'block', stackSize: 64 },
  netherite_block: { id: 'netherite_block', name: '下界合金块', type: 'block', stackSize: 64 },
  copper_block: { id: 'copper_block', name: '铜块', type: 'block', stackSize: 64 },
  emerald_block: { id: 'emerald_block', name: '绿宝石块', type: 'block', stackSize: 64 },
  lapis_block: { id: 'lapis_block', name: '青金石块', type: 'block', stackSize: 64 },
  redstone_block: { id: 'redstone_block', name: '红石块', type: 'block', stackSize: 64 },
  quartz_block: { id: 'quartz_block', name: '石英块', type: 'block', stackSize: 64 },

  // Prismarine
  prismarine: { id: 'prismarine', name: '海晶石', type: 'block', stackSize: 64 },
  prismarine_bricks: { id: 'prismarine_bricks', name: '海晶石砖', type: 'block', stackSize: 64 },
  dark_prismarine: { id: 'dark_prismarine', name: '暗海晶石', type: 'block', stackSize: 64 },
  sea_lantern: { id: 'sea_lantern', name: '海晶灯', type: 'block', stackSize: 64 },

  // Ice and snow
  ice: { id: 'ice', name: '冰', type: 'block', stackSize: 64 },
  packed_ice: { id: 'packed_ice', name: '浮冰', type: 'block', stackSize: 64 },
  blue_ice: { id: 'blue_ice', name: '蓝冰', type: 'block', stackSize: 64 },
  snow_block: { id: 'snow_block', name: '雪块', type: 'block', stackSize: 64 },

  // Plants
  cactus: { id: 'cactus', name: '仙人掌', type: 'block', stackSize: 64 },
  pumpkin: { id: 'pumpkin', name: '南瓜', type: 'block', stackSize: 64 },
  melon: { id: 'melon', name: '西瓜', type: 'block', stackSize: 64 },
  hay_bale: { id: 'hay_bale', name: '干草块', type: 'block', stackSize: 64 },
  bone_block: { id: 'bone_block', name: '骨块', type: 'block', stackSize: 64 },

  // Wool
  white_wool: { id: 'white_wool', name: '白色羊毛', type: 'block', stackSize: 64 },
  orange_wool: { id: 'orange_wool', name: '橙色羊毛', type: 'block', stackSize: 64 },
  magenta_wool: { id: 'magenta_wool', name: '品红色羊毛', type: 'block', stackSize: 64 },
  light_blue_wool: { id: 'light_blue_wool', name: '淡蓝色羊毛', type: 'block', stackSize: 64 },
  yellow_wool: { id: 'yellow_wool', name: '黄色羊毛', type: 'block', stackSize: 64 },
  lime_wool: { id: 'lime_wool', name: '黄绿色羊毛', type: 'block', stackSize: 64 },
  pink_wool: { id: 'pink_wool', name: '粉色羊毛', type: 'block', stackSize: 64 },
  gray_wool: { id: 'gray_wool', name: '灰色羊毛', type: 'block', stackSize: 64 },
  light_gray_wool: { id: 'light_gray_wool', name: '淡灰色羊毛', type: 'block', stackSize: 64 },
  cyan_wool: { id: 'cyan_wool', name: '青色羊毛', type: 'block', stackSize: 64 },
  purple_wool: { id: 'purple_wool', name: '紫色羊毛', type: 'block', stackSize: 64 },
  blue_wool: { id: 'blue_wool', name: '蓝色羊毛', type: 'block', stackSize: 64 },
  brown_wool: { id: 'brown_wool', name: '棕色羊毛', type: 'block', stackSize: 64 },
  green_wool: { id: 'green_wool', name: '绿色羊毛', type: 'block', stackSize: 64 },
  red_wool: { id: 'red_wool', name: '红色羊毛', type: 'block', stackSize: 64 },
  black_wool: { id: 'black_wool', name: '黑色羊毛', type: 'block', stackSize: 64 },

  // Concrete
  white_concrete: { id: 'white_concrete', name: '白色混凝土', type: 'block', stackSize: 64 },
  orange_concrete: { id: 'orange_concrete', name: '橙色混凝土', type: 'block', stackSize: 64 },
  yellow_concrete: { id: 'yellow_concrete', name: '黄色混凝土', type: 'block', stackSize: 64 },
  light_blue_concrete: { id: 'light_blue_concrete', name: '淡蓝色混凝土', type: 'block', stackSize: 64 },
  lime_concrete: { id: 'lime_concrete', name: '黄绿色混凝土', type: 'block', stackSize: 64 },
  pink_concrete: { id: 'pink_concrete', name: '粉色混凝土', type: 'block', stackSize: 64 },
  gray_concrete: { id: 'gray_concrete', name: '灰色混凝土', type: 'block', stackSize: 64 },
  cyan_concrete: { id: 'cyan_concrete', name: '青色混凝土', type: 'block', stackSize: 64 },
  purple_concrete: { id: 'purple_concrete', name: '紫色混凝土', type: 'block', stackSize: 64 },
  blue_concrete: { id: 'blue_concrete', name: '蓝色混凝土', type: 'block', stackSize: 64 },
  brown_concrete: { id: 'brown_concrete', name: '棕色混凝土', type: 'block', stackSize: 64 },
  green_concrete: { id: 'green_concrete', name: '绿色混凝土', type: 'block', stackSize: 64 },
  red_concrete: { id: 'red_concrete', name: '红色混凝土', type: 'block', stackSize: 64 },
  black_concrete: { id: 'black_concrete', name: '黑色混凝土', type: 'block', stackSize: 64 },

  // Terracotta
  terracotta: { id: 'terracotta', name: '陶瓦', type: 'block', stackSize: 64 },

  // Utility blocks
  anvil: { id: 'anvil', name: '铁砧', type: 'block', stackSize: 64 },
  grindstone: { id: 'grindstone', name: '砂轮', type: 'block', stackSize: 64 },
  stonecutter: { id: 'stonecutter', name: '切石机', type: 'block', stackSize: 64 },
  loom: { id: 'loom', name: '织布机', type: 'block', stackSize: 64 },
  cartography_table: { id: 'cartography_table', name: '制图台', type: 'block', stackSize: 64 },
  fletching_table: { id: 'fletching_table', name: '制箭台', type: 'block', stackSize: 64 },
  smithing_table: { id: 'smithing_table', name: '锻造台', type: 'block', stackSize: 64 },
  blast_furnace: { id: 'blast_furnace', name: '高炉', type: 'block', stackSize: 64 },
  smoker: { id: 'smoker', name: '烟熏炉', type: 'block', stackSize: 64 },
  composter: { id: 'composter', name: '堆肥桶', type: 'block', stackSize: 64 },
  barrel: { id: 'barrel', name: '木桶', type: 'block', stackSize: 64 },
  bell: { id: 'bell', name: '钟', type: 'block', stackSize: 64 },
  lectern: { id: 'lectern', name: '讲台', type: 'block', stackSize: 64 },
  beacon: { id: 'beacon', name: '信标', type: 'block', stackSize: 64 },

  // Redstone components
  redstone_dust: { id: 'redstone_dust', name: '红石粉', type: 'block', stackSize: 64 },
  piston: { id: 'piston', name: '活塞', type: 'block', stackSize: 64 },
  sticky_piston: { id: 'sticky_piston', name: '粘性活塞', type: 'block', stackSize: 64 },
  repeater: { id: 'repeater', name: '红石中继器', type: 'block', stackSize: 64 },
  comparator: { id: 'comparator', name: '红石比较器', type: 'block', stackSize: 64 },
  observer: { id: 'observer', name: '侦测器', type: 'block', stackSize: 64 },
  hopper: { id: 'hopper', name: '漏斗', type: 'block', stackSize: 64 },

  // === Materials ===
  stick: { id: 'stick', name: '木棍', type: 'material', stackSize: 64 },
  coal: { id: 'coal', name: '煤炭', type: 'material', stackSize: 64 },
  charcoal: { id: 'charcoal', name: '木炭', type: 'material', stackSize: 64 },
  iron_ingot: { id: 'iron_ingot', name: '铁锭', type: 'material', stackSize: 64 },
  gold_ingot: { id: 'gold_ingot', name: '金锭', type: 'material', stackSize: 64 },
  copper_ingot: { id: 'copper_ingot', name: '铜锭', type: 'material', stackSize: 64 },
  netherite_ingot: { id: 'netherite_ingot', name: '下界合金锭', type: 'material', stackSize: 64 },
  netherite_scrap: { id: 'netherite_scrap', name: '下界合金碎片', type: 'material', stackSize: 64 },
  diamond: { id: 'diamond', name: '钻石', type: 'material', stackSize: 64 },
  emerald: { id: 'emerald', name: '绿宝石', type: 'material', stackSize: 64 },
  lapis_lazuli: { id: 'lapis_lazuli', name: '青金石', type: 'material', stackSize: 64 },
  redstone: { id: 'redstone', name: '红石粉', type: 'material', stackSize: 64 },
  quartz: { id: 'quartz', name: '下界石英', type: 'material', stackSize: 64 },
  amethyst_shard: { id: 'amethyst_shard', name: '紫水晶碎片', type: 'material', stackSize: 64 },
  flint: { id: 'flint', name: '燧石', type: 'material', stackSize: 64 },
  string: { id: 'string', name: '线', type: 'material', stackSize: 64 },
  feather: { id: 'feather', name: '羽毛', type: 'material', stackSize: 64 },
  leather: { id: 'leather', name: '皮革', type: 'material', stackSize: 64 },
  brick_item: { id: 'brick_item', name: '红砖', type: 'material', stackSize: 64 },
  clay_ball: { id: 'clay_ball', name: '粘土球', type: 'material', stackSize: 64 },
  paper: { id: 'paper', name: '纸', type: 'material', stackSize: 64 },
  book: { id: 'book', name: '书', type: 'material', stackSize: 64 },
  ink_sac: { id: 'ink_sac', name: '墨囊', type: 'material', stackSize: 64 },
  glowstone_dust: { id: 'glowstone_dust', name: '荧石粉', type: 'material', stackSize: 64 },
  gunpowder: { id: 'gunpowder', name: '火药', type: 'material', stackSize: 64 },
  blaze_rod: { id: 'blaze_rod', name: '烈焰棒', type: 'material', stackSize: 64 },
  blaze_powder: { id: 'blaze_powder', name: '烈焰粉', type: 'material', stackSize: 64 },
  ender_pearl: { id: 'ender_pearl', name: '末影珍珠', type: 'material', stackSize: 16 },
  ender_eye: { id: 'ender_eye', name: '末影之眼', type: 'material', stackSize: 64 },
  nether_star: { id: 'nether_star', name: '下界之星', type: 'material', stackSize: 64 },
  bone: { id: 'bone', name: '骨头', type: 'material', stackSize: 64 },
  bone_meal: { id: 'bone_meal', name: '骨粉', type: 'material', stackSize: 64 },
  sugar: { id: 'sugar', name: '糖', type: 'material', stackSize: 64 },
  wheat: { id: 'wheat', name: '小麦', type: 'material', stackSize: 64 },
  wheat_seeds: { id: 'wheat_seeds', name: '小麦种子', type: 'material', stackSize: 64 },
  melon_seeds: { id: 'melon_seeds', name: '西瓜种子', type: 'material', stackSize: 64 },
  pumpkin_seeds: { id: 'pumpkin_seeds', name: '南瓜种子', type: 'material', stackSize: 64 },

  // === Food ===
  apple: { id: 'apple', name: '苹果', type: 'food', stackSize: 64 },
  golden_apple: { id: 'golden_apple', name: '金苹果', type: 'food', stackSize: 64 },
  enchanted_golden_apple: { id: 'enchanted_golden_apple', name: '附魔金苹果', type: 'food', stackSize: 64 },
  bread: { id: 'bread', name: '面包', type: 'food', stackSize: 64 },
  cooked_beef: { id: 'cooked_beef', name: '牛排', type: 'food', stackSize: 64 },
  cooked_porkchop: { id: 'cooked_porkchop', name: '熟猪排', type: 'food', stackSize: 64 },
  cooked_chicken: { id: 'cooked_chicken', name: '熟鸡肉', type: 'food', stackSize: 64 },
  cooked_mutton: { id: 'cooked_mutton', name: '熟羊肉', type: 'food', stackSize: 64 },
  cooked_cod: { id: 'cooked_cod', name: '熟鳕鱼', type: 'food', stackSize: 64 },
  cooked_salmon: { id: 'cooked_salmon', name: '熟鲑鱼', type: 'food', stackSize: 64 },
  raw_beef: { id: 'raw_beef', name: '生牛肉', type: 'food', stackSize: 64 },
  raw_porkchop: { id: 'raw_porkchop', name: '生猪排', type: 'food', stackSize: 64 },
  raw_chicken: { id: 'raw_chicken', name: '生鸡肉', type: 'food', stackSize: 64 },
  raw_mutton: { id: 'raw_mutton', name: '生羊肉', type: 'food', stackSize: 64 },
  raw_cod: { id: 'raw_cod', name: '生鳕鱼', type: 'food', stackSize: 64 },
  raw_salmon: { id: 'raw_salmon', name: '生鲑鱼', type: 'food', stackSize: 64 },
  carrot: { id: 'carrot', name: '胡萝卜', type: 'food', stackSize: 64 },
  golden_carrot: { id: 'golden_carrot', name: '金胡萝卜', type: 'food', stackSize: 64 },
  potato: { id: 'potato', name: '马铃薯', type: 'food', stackSize: 64 },
  baked_potato: { id: 'baked_potato', name: '烤马铃薯', type: 'food', stackSize: 64 },
  melon_slice: { id: 'melon_slice', name: '西瓜片', type: 'food', stackSize: 64 },
  cookie: { id: 'cookie', name: '曲奇', type: 'food', stackSize: 64 },
  cake: { id: 'cake', name: '蛋糕', type: 'food', stackSize: 1 },
  pumpkin_pie: { id: 'pumpkin_pie', name: '南瓜派', type: 'food', stackSize: 64 },
  mushroom_stew: { id: 'mushroom_stew', name: '蘑菇煲', type: 'food', stackSize: 1 },
  beetroot: { id: 'beetroot', name: '甜菜根', type: 'food', stackSize: 64 },
  beetroot_soup: { id: 'beetroot_soup', name: '甜菜汤', type: 'food', stackSize: 1 },
  rabbit_stew: { id: 'rabbit_stew', name: '兔肉煲', type: 'food', stackSize: 1 },
  dried_kelp: { id: 'dried_kelp', name: '干海带', type: 'food', stackSize: 64 },
  sweet_berries: { id: 'sweet_berries', name: '甜浆果', type: 'food', stackSize: 64 },

  // === Tools: Pickaxes ===
  wooden_pickaxe: { id: 'wooden_pickaxe', name: '木镐', type: 'tool', stackSize: 1, toolType: 'pickaxe', toolLevel: 'wood', durability: 60, miningSpeed: 2 },
  stone_pickaxe: { id: 'stone_pickaxe', name: '石镐', type: 'tool', stackSize: 1, toolType: 'pickaxe', toolLevel: 'stone', durability: 132, miningSpeed: 4 },
  iron_pickaxe: { id: 'iron_pickaxe', name: '铁镐', type: 'tool', stackSize: 1, toolType: 'pickaxe', toolLevel: 'iron', durability: 251, miningSpeed: 6 },
  gold_pickaxe: { id: 'gold_pickaxe', name: '金镐', type: 'tool', stackSize: 1, toolType: 'pickaxe', toolLevel: 'gold', durability: 33, miningSpeed: 12 },
  diamond_pickaxe: { id: 'diamond_pickaxe', name: '钻石镐', type: 'tool', stackSize: 1, toolType: 'pickaxe', toolLevel: 'diamond', durability: 1562, miningSpeed: 8 },
  netherite_pickaxe: { id: 'netherite_pickaxe', name: '下界合金镐', type: 'tool', stackSize: 1, toolType: 'pickaxe', toolLevel: 'netherite', durability: 2032, miningSpeed: 9 },

  // === Tools: Axes ===
  wooden_axe: { id: 'wooden_axe', name: '木斧', type: 'tool', stackSize: 1, damage: 7, durability: 60, toolType: 'axe', toolLevel: 'wood', miningSpeed: 2 },
  stone_axe: { id: 'stone_axe', name: '石斧', type: 'tool', stackSize: 1, damage: 9, durability: 132, toolType: 'axe', toolLevel: 'stone', miningSpeed: 4 },
  iron_axe: { id: 'iron_axe', name: '铁斧', type: 'tool', stackSize: 1, damage: 9, durability: 251, toolType: 'axe', toolLevel: 'iron', miningSpeed: 6 },
  gold_axe: { id: 'gold_axe', name: '金斧', type: 'tool', stackSize: 1, damage: 7, durability: 33, toolType: 'axe', toolLevel: 'gold', miningSpeed: 12 },
  diamond_axe: { id: 'diamond_axe', name: '钻石斧', type: 'tool', stackSize: 1, damage: 9, durability: 1562, toolType: 'axe', toolLevel: 'diamond', miningSpeed: 8 },
  netherite_axe: { id: 'netherite_axe', name: '下界合金斧', type: 'tool', stackSize: 1, damage: 10, durability: 2032, toolType: 'axe', toolLevel: 'netherite', miningSpeed: 9 },

  // === Tools: Shovels ===
  wooden_shovel: { id: 'wooden_shovel', name: '木铲', type: 'tool', stackSize: 1, damage: 1, durability: 60, toolType: 'shovel', toolLevel: 'wood', miningSpeed: 2 },
  stone_shovel: { id: 'stone_shovel', name: '石铲', type: 'tool', stackSize: 1, damage: 2, durability: 132, toolType: 'shovel', toolLevel: 'stone', miningSpeed: 4 },
  iron_shovel: { id: 'iron_shovel', name: '铁铲', type: 'tool', stackSize: 1, damage: 3, durability: 251, toolType: 'shovel', toolLevel: 'iron', miningSpeed: 6 },
  gold_shovel: { id: 'gold_shovel', name: '金铲', type: 'tool', stackSize: 1, damage: 1, durability: 33, toolType: 'shovel', toolLevel: 'gold', miningSpeed: 12 },
  diamond_shovel: { id: 'diamond_shovel', name: '钻石铲', type: 'tool', stackSize: 1, damage: 4, durability: 1562, toolType: 'shovel', toolLevel: 'diamond', miningSpeed: 8 },
  netherite_shovel: { id: 'netherite_shovel', name: '下界合金铲', type: 'tool', stackSize: 1, damage: 5, durability: 2032, toolType: 'shovel', toolLevel: 'netherite', miningSpeed: 9 },

  // === Tools: Hoes ===
  wooden_hoe: { id: 'wooden_hoe', name: '木锄', type: 'tool', stackSize: 1, damage: 1, durability: 60, toolType: 'hoe', toolLevel: 'wood' },
  stone_hoe: { id: 'stone_hoe', name: '石锄', type: 'tool', stackSize: 1, damage: 1, durability: 132, toolType: 'hoe', toolLevel: 'stone' },
  iron_hoe: { id: 'iron_hoe', name: '铁锄', type: 'tool', stackSize: 1, damage: 1, durability: 251, toolType: 'hoe', toolLevel: 'iron' },
  gold_hoe: { id: 'gold_hoe', name: '金锄', type: 'tool', stackSize: 1, damage: 1, durability: 33, toolType: 'hoe', toolLevel: 'gold' },
  diamond_hoe: { id: 'diamond_hoe', name: '钻石锄', type: 'tool', stackSize: 1, damage: 1, durability: 1562, toolType: 'hoe', toolLevel: 'diamond' },
  netherite_hoe: { id: 'netherite_hoe', name: '下界合金锄', type: 'tool', stackSize: 1, damage: 1, durability: 2032, toolType: 'hoe', toolLevel: 'netherite' },

  // === Weapons: Swords ===
  wooden_sword: { id: 'wooden_sword', name: '木剑', type: 'weapon', stackSize: 1, damage: 4, durability: 60, toolType: 'sword', toolLevel: 'wood' },
  stone_sword: { id: 'stone_sword', name: '石剑', type: 'weapon', stackSize: 1, damage: 5, durability: 132, toolType: 'sword', toolLevel: 'stone' },
  iron_sword: { id: 'iron_sword', name: '铁剑', type: 'weapon', stackSize: 1, damage: 6, durability: 251, toolType: 'sword', toolLevel: 'iron' },
  gold_sword: { id: 'gold_sword', name: '金剑', type: 'weapon', stackSize: 1, damage: 4, durability: 33, toolType: 'sword', toolLevel: 'gold' },
  diamond_sword: { id: 'diamond_sword', name: '钻石剑', type: 'weapon', stackSize: 1, damage: 7, durability: 1562, toolType: 'sword', toolLevel: 'diamond' },
  netherite_sword: { id: 'netherite_sword', name: '下界合金剑', type: 'weapon', stackSize: 1, damage: 8, durability: 2032, toolType: 'sword', toolLevel: 'netherite' },

  // === Steel (custom — rarest, most powerful) ===
  steel_ore: { id: 'steel_ore', name: '钢矿石', type: 'block', stackSize: 64 },
  steel_ingot: { id: 'steel_ingot', name: '钢锭', type: 'material', stackSize: 64 },
  steel_block: { id: 'steel_block', name: '钢块', type: 'block', stackSize: 64 },

  steel_pickaxe: { id: 'steel_pickaxe', name: '钢镐', type: 'tool', stackSize: 1, toolType: 'pickaxe', toolLevel: 'steel', durability: 3100, miningSpeed: 12 },
  steel_axe:     { id: 'steel_axe', name: '钢斧', type: 'tool', stackSize: 1, damage: 11, durability: 3100, toolType: 'axe', toolLevel: 'steel', miningSpeed: 11 },
  steel_shovel:  { id: 'steel_shovel', name: '钢铲', type: 'tool', stackSize: 1, damage: 6, durability: 3100, toolType: 'shovel', toolLevel: 'steel', miningSpeed: 11 },
  steel_hoe:     { id: 'steel_hoe', name: '钢锄', type: 'tool', stackSize: 1, damage: 2, durability: 3100, toolType: 'hoe', toolLevel: 'steel' },
  steel_sword:   { id: 'steel_sword', name: '钢剑', type: 'weapon', stackSize: 1, damage: 10, durability: 3100, toolType: 'sword', toolLevel: 'steel' },

  steel_helmet:     { id: 'steel_helmet', name: '钢头盔', type: 'armor', stackSize: 1, armorType: 'helmet', armorPoints: 4, durability: 550 },
  steel_chestplate:  { id: 'steel_chestplate', name: '钢胸甲', type: 'armor', stackSize: 1, armorType: 'chestplate', armorPoints: 9, durability: 750 },
  steel_leggings:   { id: 'steel_leggings', name: '钢护腿', type: 'armor', stackSize: 1, armorType: 'leggings', armorPoints: 7, durability: 700 },
  steel_boots:      { id: 'steel_boots', name: '钢靴子', type: 'armor', stackSize: 1, armorType: 'boots', armorPoints: 4, durability: 600 },

  // === Weapons: Ranged ===
  bow: { id: 'bow', name: '弓', type: 'weapon', stackSize: 1, durability: 385 },
  crossbow: { id: 'crossbow', name: '弩', type: 'weapon', stackSize: 1, durability: 465 },
  trident: { id: 'trident', name: '三叉戟', type: 'weapon', stackSize: 1, damage: 9, durability: 250 },
  arrow: { id: 'arrow', name: '箭', type: 'material', stackSize: 64 },
  spectral_arrow: { id: 'spectral_arrow', name: '光灵箭', type: 'material', stackSize: 64 },
  tipped_arrow: { id: 'tipped_arrow', name: '药箭', type: 'material', stackSize: 64 },

  // === Armor: Leather ===
  leather_helmet: { id: 'leather_helmet', name: '皮革帽子', type: 'armor', stackSize: 1, armorType: 'helmet', armorPoints: 1, durability: 56 },
  leather_chestplate: { id: 'leather_chestplate', name: '皮革外套', type: 'armor', stackSize: 1, armorType: 'chestplate', armorPoints: 3, durability: 80 },
  leather_leggings: { id: 'leather_leggings', name: '皮革裤子', type: 'armor', stackSize: 1, armorType: 'leggings', armorPoints: 2, durability: 75 },
  leather_boots: { id: 'leather_boots', name: '皮革靴子', type: 'armor', stackSize: 1, armorType: 'boots', armorPoints: 1, durability: 65 },

  // === Armor: Chainmail ===
  chainmail_helmet: { id: 'chainmail_helmet', name: '锁链头盔', type: 'armor', stackSize: 1, armorType: 'helmet', armorPoints: 2, durability: 77 },
  chainmail_chestplate: { id: 'chainmail_chestplate', name: '锁链胸甲', type: 'armor', stackSize: 1, armorType: 'chestplate', armorPoints: 5, durability: 112 },
  chainmail_leggings: { id: 'chainmail_leggings', name: '锁链护腿', type: 'armor', stackSize: 1, armorType: 'leggings', armorPoints: 4, durability: 105 },
  chainmail_boots: { id: 'chainmail_boots', name: '锁链靴子', type: 'armor', stackSize: 1, armorType: 'boots', armorPoints: 1, durability: 91 },

  // === Armor: Iron ===
  iron_helmet: { id: 'iron_helmet', name: '铁头盔', type: 'armor', stackSize: 1, armorType: 'helmet', armorPoints: 2, durability: 166 },
  iron_chestplate: { id: 'iron_chestplate', name: '铁胸甲', type: 'armor', stackSize: 1, armorType: 'chestplate', armorPoints: 6, durability: 240 },
  iron_leggings: { id: 'iron_leggings', name: '铁护腿', type: 'armor', stackSize: 1, armorType: 'leggings', armorPoints: 5, durability: 225 },
  iron_boots: { id: 'iron_boots', name: '铁靴子', type: 'armor', stackSize: 1, armorType: 'boots', armorPoints: 2, durability: 195 },

  // === Armor: Gold ===
  golden_helmet: { id: 'golden_helmet', name: '金头盔', type: 'armor', stackSize: 1, armorType: 'helmet', armorPoints: 2, durability: 77 },
  golden_chestplate: { id: 'golden_chestplate', name: '金胸甲', type: 'armor', stackSize: 1, armorType: 'chestplate', armorPoints: 5, durability: 112 },
  golden_leggings: { id: 'golden_leggings', name: '金护腿', type: 'armor', stackSize: 1, armorType: 'leggings', armorPoints: 3, durability: 105 },
  golden_boots: { id: 'golden_boots', name: '金靴子', type: 'armor', stackSize: 1, armorType: 'boots', armorPoints: 1, durability: 91 },

  // === Armor: Diamond ===
  diamond_helmet: { id: 'diamond_helmet', name: '钻石头盔', type: 'armor', stackSize: 1, armorType: 'helmet', armorPoints: 3, durability: 364 },
  diamond_chestplate: { id: 'diamond_chestplate', name: '钻石胸甲', type: 'armor', stackSize: 1, armorType: 'chestplate', armorPoints: 8, durability: 528 },
  diamond_leggings: { id: 'diamond_leggings', name: '钻石护腿', type: 'armor', stackSize: 1, armorType: 'leggings', armorPoints: 6, durability: 495 },
  diamond_boots: { id: 'diamond_boots', name: '钻石靴子', type: 'armor', stackSize: 1, armorType: 'boots', armorPoints: 3, durability: 429 },

  // === Armor: Netherite ===
  netherite_helmet: { id: 'netherite_helmet', name: '下界合金头盔', type: 'armor', stackSize: 1, armorType: 'helmet', armorPoints: 3, durability: 407 },
  netherite_chestplate: { id: 'netherite_chestplate', name: '下界合金胸甲', type: 'armor', stackSize: 1, armorType: 'chestplate', armorPoints: 8, durability: 592 },
  netherite_leggings: { id: 'netherite_leggings', name: '下界合金护腿', type: 'armor', stackSize: 1, armorType: 'leggings', armorPoints: 6, durability: 555 },
  netherite_boots: { id: 'netherite_boots', name: '下界合金靴子', type: 'armor', stackSize: 1, armorType: 'boots', armorPoints: 3, durability: 481 },

  // === Utility items ===
  shield: { id: 'shield', name: '盾牌', type: 'utility', stackSize: 1, durability: 336 },
  flint_and_steel: { id: 'flint_and_steel', name: '打火石', type: 'utility', stackSize: 1, durability: 64 },
  shears: { id: 'shears', name: '剪刀', type: 'utility', stackSize: 1, durability: 238 },
  fishing_rod: { id: 'fishing_rod', name: '钓鱼竿', type: 'utility', stackSize: 1, durability: 64 },
  carrot_on_a_stick: { id: 'carrot_on_a_stick', name: '胡萝卜钓竿', type: 'utility', stackSize: 1, durability: 25 },
  warped_fungus_on_a_stick: { id: 'warped_fungus_on_a_stick', name: '诡异菌钓竿', type: 'utility', stackSize: 1, durability: 100 },
  compass: { id: 'compass', name: '指南针', type: 'utility', stackSize: 64 },
  clock: { id: 'clock', name: '时钟', type: 'utility', stackSize: 64 },
  map: { id: 'map', name: '空地图', type: 'utility', stackSize: 64 },
  filled_map: { id: 'filled_map', name: '地图', type: 'utility', stackSize: 1 },
  bucket: { id: 'bucket', name: '桶', type: 'utility', stackSize: 16 },
  water_bucket: { id: 'water_bucket', name: '水桶', type: 'utility', stackSize: 1 },
  lava_bucket: { id: 'lava_bucket', name: '岩浆桶', type: 'utility', stackSize: 1 },
  milk_bucket: { id: 'milk_bucket', name: '奶桶', type: 'utility', stackSize: 1 },
  lead: { id: 'lead', name: '拴绳', type: 'utility', stackSize: 64 },
  name_tag: { id: 'name_tag', name: '命名牌', type: 'utility', stackSize: 64 },
  saddle: { id: 'saddle', name: '鞍', type: 'utility', stackSize: 1 },
  elytra: { id: 'elytra', name: '鞘翅', type: 'utility', stackSize: 1, durability: 432 },
  totem_of_undying: { id: 'totem_of_undying', name: '不死图腾', type: 'utility', stackSize: 1 },
  spyglass: { id: 'spyglass', name: '望远镜', type: 'utility', stackSize: 1 },

  // === Dyes ===
  white_dye: { id: 'white_dye', name: '白色染料', type: 'material', stackSize: 64 },
  orange_dye: { id: 'orange_dye', name: '橙色染料', type: 'material', stackSize: 64 },
  magenta_dye: { id: 'magenta_dye', name: '品红色染料', type: 'material', stackSize: 64 },
  light_blue_dye: { id: 'light_blue_dye', name: '淡蓝色染料', type: 'material', stackSize: 64 },
  yellow_dye: { id: 'yellow_dye', name: '黄色染料', type: 'material', stackSize: 64 },
  lime_dye: { id: 'lime_dye', name: '黄绿色染料', type: 'material', stackSize: 64 },
  pink_dye: { id: 'pink_dye', name: '粉色染料', type: 'material', stackSize: 64 },
  gray_dye: { id: 'gray_dye', name: '灰色染料', type: 'material', stackSize: 64 },
  light_gray_dye: { id: 'light_gray_dye', name: '淡灰色染料', type: 'material', stackSize: 64 },
  cyan_dye: { id: 'cyan_dye', name: '青色染料', type: 'material', stackSize: 64 },
  purple_dye: { id: 'purple_dye', name: '紫色染料', type: 'material', stackSize: 64 },
  blue_dye: { id: 'blue_dye', name: '蓝色染料', type: 'material', stackSize: 64 },
  brown_dye: { id: 'brown_dye', name: '棕色染料', type: 'material', stackSize: 64 },
  green_dye: { id: 'green_dye', name: '绿色染料', type: 'material', stackSize: 64 },
  red_dye: { id: 'red_dye', name: '红色染料', type: 'material', stackSize: 64 },
  black_dye: { id: 'black_dye', name: '黑色染料', type: 'material', stackSize: 64 },

  // === Music discs (placeholder) ===
  music_disc_13: { id: 'music_disc_13', name: '音乐唱片', type: 'utility', stackSize: 1 },
  music_disc_cat: { id: 'music_disc_cat', name: '音乐唱片', type: 'utility', stackSize: 1 },

  // === Miscellaneous ===
  torch: { id: 'torch', name: '火把', type: 'block', stackSize: 64 },
  soul_torch: { id: 'soul_torch', name: '灵魂火把', type: 'block', stackSize: 64 },
  lantern: { id: 'lantern', name: '灯笼', type: 'block', stackSize: 64 },
  soul_lantern: { id: 'soul_lantern', name: '灵魂灯笼', type: 'block', stackSize: 64 },
  ladder: { id: 'ladder', name: '梯子', type: 'block', stackSize: 64 },

  // === 指令专属物品 (创造模式+作弊) ===
  command_block: { id: 'command_block', name: '命令方块', type: 'block', stackSize: 64 },
  chain_command_block: { id: 'chain_command_block', name: '连锁命令方块', type: 'block', stackSize: 64 },
  repeat_command_block: { id: 'repeat_command_block', name: '循环命令方块', type: 'block', stackSize: 64 },
  barrier: { id: 'barrier', name: '屏障', type: 'block', stackSize: 64 },
  structure_block: { id: 'structure_block', name: '结构方块', type: 'block', stackSize: 64 },
  jigsaw_block: { id: 'jigsaw_block', name: '拼图方块', type: 'block', stackSize: 64 },
  light_block: { id: 'light_block', name: '光源方块', type: 'block', stackSize: 64 },
  structure_void: { id: 'structure_void', name: '结构空位', type: 'block', stackSize: 64 },

  // 调试棒 (工具 - 翻转方块状态)
  debug_stick: { id: 'debug_stick', name: '调试棒', type: 'tool', stackSize: 1 },

  // === 附魔书 ===
  enchanted_book: { id: 'enchanted_book', name: '附魔书', type: 'utility', stackSize: 1 },
}

export function getItemDefinition(id: string): ItemDefinition | undefined {
  return ITEM_REGISTRY[id]
}
