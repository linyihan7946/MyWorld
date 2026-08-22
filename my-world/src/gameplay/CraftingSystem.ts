import { ITEM_REGISTRY } from '@/types/items'

/**
 * 合成配方类型
 */
export interface ShapedRecipe {
  type: 'shaped'
  pattern: string[]       // e.g., ["DDD", " S ", " S "]
  keys: Record<string, string>  // D = diamond, S = stick
  result: { item: string; count: number }
}

export interface ShapelessRecipe {
  type: 'shapeless'
  ingredients: string[]   // ["planks", "planks", "planks", "planks"]
  result: { item: string; count: number }
}

export type Recipe = ShapedRecipe | ShapelessRecipe

/**
 * 所有合成配方 - 完整 Minecraft 配方
 */
export const RECIPES: Recipe[] = [
  // ==========================================
  // === 基础材料 ===
  // ==========================================

  // 木板从原木
  { type: 'shapeless', ingredients: ['oak_log'], result: { item: 'oak_planks', count: 4 } },
  { type: 'shapeless', ingredients: ['spruce_log'], result: { item: 'spruce_planks', count: 4 } },
  { type: 'shapeless', ingredients: ['birch_log'], result: { item: 'birch_planks', count: 4 } },
  { type: 'shapeless', ingredients: ['jungle_log'], result: { item: 'jungle_planks', count: 4 } },
  { type: 'shapeless', ingredients: ['acacia_log'], result: { item: 'acacia_planks', count: 4 } },
  { type: 'shapeless', ingredients: ['dark_oak_log'], result: { item: 'dark_oak_planks', count: 4 } },

  // 木棍
  { type: 'shaped', pattern: ['P', 'P'], keys: { P: 'oak_planks' }, result: { item: 'stick', count: 4 } },
  { type: 'shaped', pattern: ['P', 'P'], keys: { P: 'spruce_planks' }, result: { item: 'stick', count: 4 } },
  { type: 'shaped', pattern: ['P', 'P'], keys: { P: 'birch_planks' }, result: { item: 'stick', count: 4 } },
  { type: 'shaped', pattern: ['P', 'P'], keys: { P: 'jungle_planks' }, result: { item: 'stick', count: 4 } },
  { type: 'shaped', pattern: ['P', 'P'], keys: { P: 'acacia_planks' }, result: { item: 'stick', count: 4 } },
  { type: 'shaped', pattern: ['P', 'P'], keys: { P: 'dark_oak_planks' }, result: { item: 'stick', count: 4 } },

  // 火把
  { type: 'shaped', pattern: ['C', 'S'], keys: { C: 'coal', S: 'stick' }, result: { item: 'torch', count: 4 } },
  { type: 'shaped', pattern: ['C', 'S'], keys: { C: 'charcoal', S: 'stick' }, result: { item: 'torch', count: 4 } },
  { type: 'shaped', pattern: [' S ', 'SBS', ' S '], keys: { S: 'iron_ingot', B: 'torch' }, result: { item: 'lantern', count: 1 } },

  // 纸
  { type: 'shaped', pattern: ['SSS'], keys: { S: 'sugar_cane' }, result: { item: 'paper', count: 3 } },

  // 书
  { type: 'shaped', pattern: ['PPP', ' L '], keys: { P: 'paper', L: 'leather' }, result: { item: 'book', count: 1 } },

  // 书架
  { type: 'shaped', pattern: ['PPP', 'BBB', 'PPP'], keys: { P: 'oak_planks', B: 'book' }, result: { item: 'bookshelf', count: 1 } },

  // TNT
  { type: 'shaped', pattern: ['G G', 'GPG', 'G G'], keys: { G: 'gunpowder', P: 'sand' }, result: { item: 'tnt', count: 1 } },

  // 骨粉
  { type: 'shapeless', ingredients: ['bone'], result: { item: 'bone_meal', count: 3 } },

  // 糖
  { type: 'shapeless', ingredients: ['sugar_cane'], result: { item: 'sugar', count: 1 } },

  // 粘土球
  { type: 'shapeless', ingredients: ['clay'], result: { item: 'clay_ball', count: 4 } },

  // 红砖
  { type: 'shapeless', ingredients: ['bricks'], result: { item: 'brick_item', count: 4 } },

  // 荧石
  { type: 'shaped', pattern: ['DD', 'DD'], keys: { D: 'glowstone_dust' }, result: { item: 'glowstone', count: 1 } },
  { type: 'shapeless', ingredients: ['glowstone'], result: { item: 'glowstone_dust', count: 4 } },

  // 烈焰粉
  { type: 'shapeless', ingredients: ['blaze_rod'], result: { item: 'blaze_powder', count: 2 } },

  // 末影之眼
  { type: 'shapeless', ingredients: ['ender_pearl', 'blaze_powder'], result: { item: 'ender_eye', count: 1 } },

  // 墨水囊 → 黑色染料
  { type: 'shapeless', ingredients: ['ink_sac'], result: { item: 'black_dye', count: 1 } },

  // 骨粉作为白色染料
  { type: 'shapeless', ingredients: ['bone_meal'], result: { item: 'white_dye', count: 1 } },

  // ==========================================
  // === 工作台 ===
  // ==========================================
  { type: 'shaped', pattern: ['PP', 'PP'], keys: { P: 'oak_planks' }, result: { item: 'crafting_table', count: 1 } },
  { type: 'shaped', pattern: ['PP', 'PP'], keys: { P: 'spruce_planks' }, result: { item: 'crafting_table', count: 1 } },
  { type: 'shaped', pattern: ['PP', 'PP'], keys: { P: 'birch_planks' }, result: { item: 'crafting_table', count: 1 } },

  // 熔炉
  { type: 'shaped', pattern: ['CCC', 'C C', 'CCC'], keys: { C: 'cobblestone' }, result: { item: 'furnace', count: 1 } },

  // 高炉
  { type: 'shaped', pattern: ['III', 'IF ', 'III'], keys: { I: 'iron_ingot', F: 'furnace' }, result: { item: 'blast_furnace', count: 1 } },

  // 烟熏炉
  { type: 'shaped', pattern: [' L ', 'LF ', ' L '], keys: { L: 'oak_log', F: 'furnace' }, result: { item: 'smoker', count: 1 } },

  // 切石机
  { type: 'shaped', pattern: [' I ', 'SSS'], keys: { I: 'iron_ingot', S: 'stone' }, result: { item: 'stonecutter', count: 1 } },

  // 砂轮
  { type: 'shaped', pattern: ['S S', 'P P'], keys: { S: 'stick', P: 'oak_planks' }, result: { item: 'grindstone', count: 1 } },

  // 织布机
  { type: 'shaped', pattern: ['SS', 'PP'], keys: { S: 'string', P: 'oak_planks' }, result: { item: 'loom', count: 1 } },

  // 锻造台
  { type: 'shaped', pattern: ['II', 'PP', 'PP'], keys: { I: 'iron_ingot', P: 'oak_planks' }, result: { item: 'smithing_table', count: 1 } },

  // 制图台
  { type: 'shaped', pattern: ['PP', 'PP'], keys: { P: 'oak_planks' }, result: { item: 'cartography_table', count: 1 } },

  // 制箭台
  { type: 'shaped', pattern: ['FF', 'PP', 'PP'], keys: { F: 'flint', P: 'oak_planks' }, result: { item: 'fletching_table', count: 1 } },

  // 堆肥桶
  { type: 'shaped', pattern: ['S S', 'S S', 'SSS'], keys: { S: 'oak_planks' }, result: { item: 'composter', count: 1 } },

  // 木桶
  { type: 'shaped', pattern: ['P P', 'P P', 'PPP'], keys: { P: 'oak_planks' }, result: { item: 'barrel', count: 1 } },

  // 讲台
  { type: 'shaped', pattern: ['SSS', ' B ', ' P '], keys: { S: 'oak_planks', B: 'book', P: 'oak_planks' }, result: { item: 'lectern', count: 1 } },

  // 箱子
  { type: 'shaped', pattern: ['PPP', 'P P', 'PPP'], keys: { P: 'oak_planks' }, result: { item: 'chest', count: 1 } },
  { type: 'shaped', pattern: ['PPP', 'P P', 'PPP'], keys: { P: 'spruce_planks' }, result: { item: 'chest', count: 1 } },
  { type: 'shaped', pattern: ['PPP', 'P P', 'PPP'], keys: { P: 'birch_planks' }, result: { item: 'chest', count: 1 } },

  // ==========================================
  // === 工具：镐 ===
  // ==========================================
  { type: 'shaped', pattern: ['PPP', ' S ', ' S '], keys: { P: 'oak_planks', S: 'stick' }, result: { item: 'wooden_pickaxe', count: 1 } },
  { type: 'shaped', pattern: ['CCC', ' S ', ' S '], keys: { C: 'cobblestone', S: 'stick' }, result: { item: 'stone_pickaxe', count: 1 } },
  { type: 'shaped', pattern: ['III', ' S ', ' S '], keys: { I: 'iron_ingot', S: 'stick' }, result: { item: 'iron_pickaxe', count: 1 } },
  { type: 'shaped', pattern: ['GGG', ' S ', ' S '], keys: { G: 'gold_ingot', S: 'stick' }, result: { item: 'gold_pickaxe', count: 1 } },
  { type: 'shaped', pattern: ['DDD', ' S ', ' S '], keys: { D: 'diamond', S: 'stick' }, result: { item: 'diamond_pickaxe', count: 1 } },
  { type: 'shaped', pattern: ['NNN', ' S ', ' S '], keys: { N: 'netherite_ingot', S: 'stick' }, result: { item: 'netherite_pickaxe', count: 1 } },

  // ==========================================
  // === 工具：斧 ===
  // ==========================================
  { type: 'shaped', pattern: ['PP', 'PS', ' S'], keys: { P: 'oak_planks', S: 'stick' }, result: { item: 'wooden_axe', count: 1 } },
  { type: 'shaped', pattern: ['CC', 'CS', ' S'], keys: { C: 'cobblestone', S: 'stick' }, result: { item: 'stone_axe', count: 1 } },
  { type: 'shaped', pattern: ['II', 'IS', ' S'], keys: { I: 'iron_ingot', S: 'stick' }, result: { item: 'iron_axe', count: 1 } },
  { type: 'shaped', pattern: ['GG', 'GS', ' S'], keys: { G: 'gold_ingot', S: 'stick' }, result: { item: 'gold_axe', count: 1 } },
  { type: 'shaped', pattern: ['DD', 'DS', ' S'], keys: { D: 'diamond', S: 'stick' }, result: { item: 'diamond_axe', count: 1 } },
  { type: 'shaped', pattern: ['NN', 'NS', ' S'], keys: { N: 'netherite_ingot', S: 'stick' }, result: { item: 'netherite_axe', count: 1 } },

  // ==========================================
  // === 工具：铲 ===
  // ==========================================
  { type: 'shaped', pattern: ['P', 'S', 'S'], keys: { P: 'oak_planks', S: 'stick' }, result: { item: 'wooden_shovel', count: 1 } },
  { type: 'shaped', pattern: ['C', 'S', 'S'], keys: { C: 'cobblestone', S: 'stick' }, result: { item: 'stone_shovel', count: 1 } },
  { type: 'shaped', pattern: ['I', 'S', 'S'], keys: { I: 'iron_ingot', S: 'stick' }, result: { item: 'iron_shovel', count: 1 } },
  { type: 'shaped', pattern: ['G', 'S', 'S'], keys: { G: 'gold_ingot', S: 'stick' }, result: { item: 'gold_shovel', count: 1 } },
  { type: 'shaped', pattern: ['D', 'S', 'S'], keys: { D: 'diamond', S: 'stick' }, result: { item: 'diamond_shovel', count: 1 } },
  { type: 'shaped', pattern: ['N', 'S', 'S'], keys: { N: 'netherite_ingot', S: 'stick' }, result: { item: 'netherite_shovel', count: 1 } },

  // ==========================================
  // === 工具：锄 ===
  // ==========================================
  { type: 'shaped', pattern: ['PP', ' S', ' S'], keys: { P: 'oak_planks', S: 'stick' }, result: { item: 'wooden_hoe', count: 1 } },
  { type: 'shaped', pattern: ['CC', ' S', ' S'], keys: { C: 'cobblestone', S: 'stick' }, result: { item: 'stone_hoe', count: 1 } },
  { type: 'shaped', pattern: ['II', ' S', ' S'], keys: { I: 'iron_ingot', S: 'stick' }, result: { item: 'iron_hoe', count: 1 } },
  { type: 'shaped', pattern: ['GG', ' S', ' S'], keys: { G: 'gold_ingot', S: 'stick' }, result: { item: 'gold_hoe', count: 1 } },
  { type: 'shaped', pattern: ['DD', ' S', ' S'], keys: { D: 'diamond', S: 'stick' }, result: { item: 'diamond_hoe', count: 1 } },
  { type: 'shaped', pattern: ['NN', ' S', ' S'], keys: { N: 'netherite_ingot', S: 'stick' }, result: { item: 'netherite_hoe', count: 1 } },

  // ==========================================
  // === 武器：剑 ===
  // ==========================================
  { type: 'shaped', pattern: ['P', 'P', 'S'], keys: { P: 'oak_planks', S: 'stick' }, result: { item: 'wooden_sword', count: 1 } },
  { type: 'shaped', pattern: ['C', 'C', 'S'], keys: { C: 'cobblestone', S: 'stick' }, result: { item: 'stone_sword', count: 1 } },
  { type: 'shaped', pattern: ['I', 'I', 'S'], keys: { I: 'iron_ingot', S: 'stick' }, result: { item: 'iron_sword', count: 1 } },
  { type: 'shaped', pattern: ['G', 'G', 'S'], keys: { G: 'gold_ingot', S: 'stick' }, result: { item: 'gold_sword', count: 1 } },
  { type: 'shaped', pattern: ['D', 'D', 'S'], keys: { D: 'diamond', S: 'stick' }, result: { item: 'diamond_sword', count: 1 } },
  { type: 'shaped', pattern: ['N', 'N', 'S'], keys: { N: 'netherite_ingot', S: 'stick' }, result: { item: 'netherite_sword', count: 1 } },

  // Steel tools (best tier — above netherite)
  { type: 'shaped', pattern: ['SSS', ' W ', ' W '], keys: { S: 'steel_ingot', W: 'stick' }, result: { item: 'steel_pickaxe', count: 1 } },
  { type: 'shaped', pattern: ['SS', 'SW', ' W'], keys: { S: 'steel_ingot', W: 'stick' }, result: { item: 'steel_axe', count: 1 } },
  { type: 'shaped', pattern: ['S', 'W', 'W'], keys: { S: 'steel_ingot', W: 'stick' }, result: { item: 'steel_shovel', count: 1 } },
  { type: 'shaped', pattern: ['SS', ' W', ' W'], keys: { S: 'steel_ingot', W: 'stick' }, result: { item: 'steel_hoe', count: 1 } },
  { type: 'shaped', pattern: ['S', 'S', 'W'], keys: { S: 'steel_ingot', W: 'stick' }, result: { item: 'steel_sword', count: 1 } },

  // ==========================================
  // === 武器：远程 ===
  // ==========================================
  // 弓
  { type: 'shaped', pattern: [' SL', 'S L', ' SL'], keys: { S: 'stick', L: 'string' }, result: { item: 'bow', count: 1 } },

  // 箭
  { type: 'shaped', pattern: ['F', 'S', 'E'], keys: { F: 'flint', S: 'stick', E: 'feather' }, result: { item: 'arrow', count: 4 } },

  // 弩
  { type: 'shaped', pattern: ['S S', 'STS', ' S '], keys: { S: 'stick', T: 'string' }, result: { item: 'crossbow', count: 1 } },

  // 三叉戟 (简化配方)
  { type: 'shaped', pattern: [' P ', 'PPP', ' S '], keys: { P: 'prismarine_shard', S: 'stick' }, result: { item: 'trident', count: 1 } },

  // 盾牌
  { type: 'shaped', pattern: ['P P', 'PPP', ' P '], keys: { P: 'oak_planks' }, result: { item: 'shield', count: 1 } },

  // ==========================================
  // === 盔甲 ===
  // ==========================================

  // 皮革盔甲
  { type: 'shaped', pattern: ['LLL', 'L L'], keys: { L: 'leather' }, result: { item: 'leather_helmet', count: 1 } },
  { type: 'shaped', pattern: ['L L', 'LLL', 'LLL'], keys: { L: 'leather' }, result: { item: 'leather_chestplate', count: 1 } },
  { type: 'shaped', pattern: ['LLL', 'L L', 'L L'], keys: { L: 'leather' }, result: { item: 'leather_leggings', count: 1 } },
  { type: 'shaped', pattern: ['L L', 'L L'], keys: { L: 'leather' }, result: { item: 'leather_boots', count: 1 } },

  // 锁链盔甲 (用铁锭代替)
  { type: 'shaped', pattern: ['III', 'I I'], keys: { I: 'iron_ingot' }, result: { item: 'chainmail_helmet', count: 1 } },
  { type: 'shaped', pattern: ['I I', 'III', 'III'], keys: { I: 'iron_ingot' }, result: { item: 'chainmail_chestplate', count: 1 } },
  { type: 'shaped', pattern: ['III', 'I I', 'I I'], keys: { I: 'iron_ingot' }, result: { item: 'chainmail_leggings', count: 1 } },
  { type: 'shaped', pattern: ['I I', 'I I'], keys: { I: 'iron_ingot' }, result: { item: 'chainmail_boots', count: 1 } },

  // 铁盔甲
  { type: 'shaped', pattern: ['III', 'I I'], keys: { I: 'iron_ingot' }, result: { item: 'iron_helmet', count: 1 } },
  { type: 'shaped', pattern: ['I I', 'III', 'III'], keys: { I: 'iron_ingot' }, result: { item: 'iron_chestplate', count: 1 } },
  { type: 'shaped', pattern: ['III', 'I I', 'I I'], keys: { I: 'iron_ingot' }, result: { item: 'iron_leggings', count: 1 } },
  { type: 'shaped', pattern: ['I I', 'I I'], keys: { I: 'iron_ingot' }, result: { item: 'iron_boots', count: 1 } },

  // 金盔甲
  { type: 'shaped', pattern: ['GGG', 'G G'], keys: { G: 'gold_ingot' }, result: { item: 'golden_helmet', count: 1 } },
  { type: 'shaped', pattern: ['G G', 'GGG', 'GGG'], keys: { G: 'gold_ingot' }, result: { item: 'golden_chestplate', count: 1 } },
  { type: 'shaped', pattern: ['GGG', 'G G', 'G G'], keys: { G: 'gold_ingot' }, result: { item: 'golden_leggings', count: 1 } },
  { type: 'shaped', pattern: ['G G', 'G G'], keys: { G: 'gold_ingot' }, result: { item: 'golden_boots', count: 1 } },

  // 钻石盔甲
  { type: 'shaped', pattern: ['DDD', 'D D'], keys: { D: 'diamond' }, result: { item: 'diamond_helmet', count: 1 } },
  { type: 'shaped', pattern: ['D D', 'DDD', 'DDD'], keys: { D: 'diamond' }, result: { item: 'diamond_chestplate', count: 1 } },
  { type: 'shaped', pattern: ['DDD', 'D D', 'D D'], keys: { D: 'diamond' }, result: { item: 'diamond_leggings', count: 1 } },
  { type: 'shaped', pattern: ['D D', 'D D'], keys: { D: 'diamond' }, result: { item: 'diamond_boots', count: 1 } },

  // 下界合金盔甲 (用下界合金锭)
  { type: 'shaped', pattern: ['NNN', 'N N'], keys: { N: 'netherite_ingot' }, result: { item: 'netherite_helmet', count: 1 } },
  { type: 'shaped', pattern: ['N N', 'NNN', 'NNN'], keys: { N: 'netherite_ingot' }, result: { item: 'netherite_chestplate', count: 1 } },
  { type: 'shaped', pattern: ['NNN', 'N N', 'N N'], keys: { N: 'netherite_ingot' }, result: { item: 'netherite_leggings', count: 1 } },
  { type: 'shaped', pattern: ['N N', 'N N'], keys: { N: 'netherite_ingot' }, result: { item: 'netherite_boots', count: 1 } },

  // Steel armor (best tier)
  { type: 'shaped', pattern: ['SSS', 'S S'], keys: { S: 'steel_ingot' }, result: { item: 'steel_helmet', count: 1 } },
  { type: 'shaped', pattern: ['S S', 'SSS', 'SSS'], keys: { S: 'steel_ingot' }, result: { item: 'steel_chestplate', count: 1 } },
  { type: 'shaped', pattern: ['SSS', 'S S', 'S S'], keys: { S: 'steel_ingot' }, result: { item: 'steel_leggings', count: 1 } },
  { type: 'shaped', pattern: ['S S', 'S S'], keys: { S: 'steel_ingot' }, result: { item: 'steel_boots', count: 1 } },

  // 龟壳头盔 (简化)
  { type: 'shaped', pattern: ['SSS', 'S S'], keys: { S: 'iron_ingot' }, result: { item: 'iron_helmet', count: 1 } },

  // ==========================================
  // === 矿物块 ↔ 矿物 ===
  // ==========================================
  { type: 'shaped', pattern: ['III', 'III', 'III'], keys: { I: 'iron_ingot' }, result: { item: 'iron_block', count: 1 } },
  { type: 'shaped', pattern: ['GGG', 'GGG', 'GGG'], keys: { G: 'gold_ingot' }, result: { item: 'gold_block', count: 1 } },
  { type: 'shaped', pattern: ['DDD', 'DDD', 'DDD'], keys: { D: 'diamond' }, result: { item: 'diamond_block', count: 1 } },
  { type: 'shaped', pattern: ['NNN', 'NNN', 'NNN'], keys: { N: 'netherite_ingot' }, result: { item: 'netherite_block', count: 1 } },
  { type: 'shaped', pattern: ['CCC', 'CCC', 'CCC'], keys: { C: 'copper_ingot' }, result: { item: 'copper_block', count: 1 } },
  { type: 'shaped', pattern: ['EEE', 'EEE', 'EEE'], keys: { E: 'emerald' }, result: { item: 'emerald_block', count: 1 } },
  { type: 'shaped', pattern: ['LLL', 'LLL', 'LLL'], keys: { L: 'lapis_lazuli' }, result: { item: 'lapis_block', count: 1 } },
  { type: 'shaped', pattern: ['RRR', 'RRR', 'RRR'], keys: { R: 'redstone_dust' }, result: { item: 'redstone_block', count: 1 } },
  { type: 'shaped', pattern: ['QQQ', 'QQQ', 'QQQ'], keys: { Q: 'quartz' }, result: { item: 'quartz_block', count: 1 } },
  { type: 'shaped', pattern: ['SSS', 'SSS', 'SSS'], keys: { S: 'steel_ingot' }, result: { item: 'steel_block', count: 1 } },

  // 反向：块 → 9个矿物
  { type: 'shapeless', ingredients: ['iron_block'], result: { item: 'iron_ingot', count: 9 } },
  { type: 'shapeless', ingredients: ['gold_block'], result: { item: 'gold_ingot', count: 9 } },
  { type: 'shapeless', ingredients: ['diamond_block'], result: { item: 'diamond', count: 9 } },
  { type: 'shapeless', ingredients: ['netherite_block'], result: { item: 'netherite_ingot', count: 9 } },
  { type: 'shapeless', ingredients: ['copper_block'], result: { item: 'copper_ingot', count: 9 } },
  { type: 'shapeless', ingredients: ['emerald_block'], result: { item: 'emerald', count: 9 } },
  { type: 'shapeless', ingredients: ['lapis_block'], result: { item: 'lapis_lazuli', count: 9 } },
  { type: 'shapeless', ingredients: ['redstone_block'], result: { item: 'redstone_dust', count: 9 } },
  { type: 'shapeless', ingredients: ['quartz_block'], result: { item: 'quartz', count: 9 } },
  { type: 'shapeless', ingredients: ['steel_block'], result: { item: 'steel_ingot', count: 9 } },

  // ==========================================
  // === 建筑材料 ===
  // ==========================================

  // 石砖
  { type: 'shaped', pattern: ['CC', 'CC'], keys: { C: 'stone' }, result: { item: 'stone_bricks', count: 4 } },

  // 砖块
  { type: 'shaped', pattern: ['BB', 'BB'], keys: { B: 'brick_item' }, result: { item: 'bricks', count: 1 } },

  // 砂岩
  { type: 'shaped', pattern: ['SS', 'SS'], keys: { S: 'sand' }, result: { item: 'sandstone', count: 1 } },

  // 红砂岩
  { type: 'shaped', pattern: ['SS', 'SS'], keys: { S: 'red_sand' }, result: { item: 'red_sandstone', count: 1 } },

  // 末地石砖
  { type: 'shaped', pattern: ['EE', 'EE'], keys: { E: 'end_stone' }, result: { item: 'end_stone_bricks', count: 4 } },

  // 紫珀块
  { type: 'shaped', pattern: ['PP', 'PP'], keys: { P: 'quartz' }, result: { item: 'purpur_block', count: 4 } },

  // 海晶石
  { type: 'shaped', pattern: ['SS', 'SS'], keys: { S: 'iron_ingot' }, result: { item: 'prismarine', count: 1 } },

  // 海晶灯
  { type: 'shaped', pattern: ['SSS', 'SSS', 'SSS'], keys: { S: 'iron_ingot' }, result: { item: 'sea_lantern', count: 1 } },

  // 平滑石头
  { type: 'shaped', pattern: ['SS', 'SS'], keys: { S: 'stone' }, result: { item: 'smooth_stone', count: 1 } },

  // 花岗岩
  { type: 'shapeless', ingredients: ['diorite', 'quartz'], result: { item: 'granite', count: 1 } },

  // 安山岩
  { type: 'shapeless', ingredients: ['cobblestone', 'diorite'], result: { item: 'andesite', count: 1 } },

  // 磨制 variants
  { type: 'shaped', pattern: ['SS', 'SS'], keys: { S: 'granite' }, result: { item: 'polished_granite', count: 4 } },
  { type: 'shaped', pattern: ['SS', 'SS'], keys: { S: 'diorite' }, result: { item: 'polished_diorite', count: 4 } },
  { type: 'shaped', pattern: ['SS', 'SS'], keys: { S: 'andesite' }, result: { item: 'polished_andesite', count: 4 } },

  // 雪块
  { type: 'shaped', pattern: ['SS', 'SS'], keys: { S: 'snow_block' }, result: { item: 'snow_block', count: 1 } },

  // 骨块
  { type: 'shaped', pattern: ['BBB'], keys: { B: 'bone_meal' }, result: { item: 'bone_block', count: 1 } },

  // 干海带块
  { type: 'shaped', pattern: ['KKK', 'KKK', 'KKK'], keys: { K: 'dried_kelp' }, result: { item: 'hay_bale', count: 1 } },

  // ==========================================
  // === 羊毛 ===
  // ==========================================
  { type: 'shaped', pattern: ['WW', 'WW'], keys: { W: 'string' }, result: { item: 'white_wool', count: 1 } },

  // ==========================================
  // === 楼梯 ===
  // ==========================================
  { type: 'shaped', pattern: ['  S', ' SS', 'SSS'], keys: { S: 'cobblestone' }, result: { item: 'cobblestone_stairs', count: 4 } },
  { type: 'shaped', pattern: ['  S', ' SS', 'SSS'], keys: { S: 'stone_bricks' }, result: { item: 'stone_brick_stairs', count: 4 } },
  { type: 'shaped', pattern: ['  S', ' SS', 'SSS'], keys: { S: 'bricks' }, result: { item: 'brick_stairs', count: 4 } },
  { type: 'shaped', pattern: ['  S', ' SS', 'SSS'], keys: { S: 'oak_planks' }, result: { item: 'oak_stairs', count: 4 } },
  { type: 'shaped', pattern: ['  S', ' SS', 'SSS'], keys: { S: 'spruce_planks' }, result: { item: 'spruce_stairs', count: 4 } },
  { type: 'shaped', pattern: ['  S', ' SS', 'SSS'], keys: { S: 'birch_planks' }, result: { item: 'birch_stairs', count: 4 } },
  { type: 'shaped', pattern: ['  S', ' SS', 'SSS'], keys: { S: 'sandstone' }, result: { item: 'sandstone_stairs', count: 4 } },

  // ==========================================
  // === 台阶 ===
  // ==========================================
  { type: 'shaped', pattern: ['SSS'], keys: { S: 'stone' }, result: { item: 'stone_slab', count: 6 } },
  { type: 'shaped', pattern: ['SSS'], keys: { S: 'cobblestone' }, result: { item: 'cobblestone_slab', count: 6 } },
  { type: 'shaped', pattern: ['SSS'], keys: { S: 'stone_bricks' }, result: { item: 'stone_brick_slab', count: 6 } },
  { type: 'shaped', pattern: ['SSS'], keys: { S: 'bricks' }, result: { item: 'brick_slab', count: 6 } },
  { type: 'shaped', pattern: ['SSS'], keys: { S: 'oak_planks' }, result: { item: 'oak_slab', count: 6 } },
  { type: 'shaped', pattern: ['SSS'], keys: { S: 'spruce_planks' }, result: { item: 'spruce_slab', count: 6 } },
  { type: 'shaped', pattern: ['SSS'], keys: { S: 'birch_planks' }, result: { item: 'birch_slab', count: 6 } },
  { type: 'shaped', pattern: ['SSS'], keys: { S: 'sandstone' }, result: { item: 'sandstone_slab', count: 6 } },

  // ==========================================
  // === 栅栏 ===
  // ==========================================
  { type: 'shaped', pattern: ['PSP', 'PSP'], keys: { P: 'oak_planks', S: 'stick' }, result: { item: 'oak_fence', count: 3 } },
  { type: 'shaped', pattern: ['PSP', 'PSP'], keys: { P: 'spruce_planks', S: 'stick' }, result: { item: 'spruce_fence', count: 3 } },
  { type: 'shaped', pattern: ['PSP', 'PSP'], keys: { P: 'birch_planks', S: 'stick' }, result: { item: 'birch_fence', count: 3 } },
  { type: 'shaped', pattern: ['PSP', 'PSP'], keys: { P: 'jungle_planks', S: 'stick' }, result: { item: 'jungle_fence', count: 3 } },
  { type: 'shaped', pattern: ['PSP', 'PSP'], keys: { P: 'acacia_planks', S: 'stick' }, result: { item: 'acacia_fence', count: 3 } },
  { type: 'shaped', pattern: ['PSP', 'PSP'], keys: { P: 'dark_oak_planks', S: 'stick' }, result: { item: 'dark_oak_fence', count: 3 } },
  { type: 'shaped', pattern: ['B B', 'B B'], keys: { B: 'nether_bricks' }, result: { item: 'nether_brick_fence', count: 1 } },

  // ==========================================
  // === 墙 ===
  // ==========================================
  { type: 'shaped', pattern: ['BBB', 'BBB'], keys: { B: 'cobblestone' }, result: { item: 'cobblestone_wall', count: 6 } },
  { type: 'shaped', pattern: ['BBB', 'BBB'], keys: { B: 'mossy_cobblestone' }, result: { item: 'mossy_cobblestone_wall', count: 6 } },
  { type: 'shaped', pattern: ['BBB', 'BBB'], keys: { B: 'stone_bricks' }, result: { item: 'stone_brick_wall', count: 6 } },
  { type: 'shaped', pattern: ['BBB', 'BBB'], keys: { B: 'bricks' }, result: { item: 'brick_wall', count: 6 } },
  { type: 'shaped', pattern: ['BBB', 'BBB'], keys: { B: 'andesite' }, result: { item: 'andesite_wall', count: 6 } },
  { type: 'shaped', pattern: ['BBB', 'BBB'], keys: { B: 'diorite' }, result: { item: 'diorite_wall', count: 6 } },
  { type: 'shaped', pattern: ['BBB', 'BBB'], keys: { B: 'granite' }, result: { item: 'granite_wall', count: 6 } },

  // ==========================================
  // === 门 ===
  // ==========================================
  { type: 'shaped', pattern: ['PP', 'PP', 'PP'], keys: { P: 'oak_planks' }, result: { item: 'oak_door', count: 3 } },
  { type: 'shaped', pattern: ['PP', 'PP', 'PP'], keys: { P: 'spruce_planks' }, result: { item: 'spruce_door', count: 3 } },
  { type: 'shaped', pattern: ['PP', 'PP', 'PP'], keys: { P: 'birch_planks' }, result: { item: 'birch_door', count: 3 } },
  { type: 'shaped', pattern: ['PP', 'PP', 'PP'], keys: { P: 'jungle_planks' }, result: { item: 'jungle_door', count: 3 } },
  { type: 'shaped', pattern: ['PP', 'PP', 'PP'], keys: { P: 'acacia_planks' }, result: { item: 'acacia_door', count: 3 } },
  { type: 'shaped', pattern: ['PP', 'PP', 'PP'], keys: { P: 'dark_oak_planks' }, result: { item: 'dark_oak_door', count: 3 } },
  { type: 'shaped', pattern: ['II', 'II', 'II'], keys: { I: 'iron_ingot' }, result: { item: 'iron_door', count: 3 } },

  // ==========================================
  // === 活板门 ===
  // ==========================================
  { type: 'shaped', pattern: ['PPP', 'PPP'], keys: { P: 'oak_planks' }, result: { item: 'oak_trapdoor', count: 2 } },
  { type: 'shaped', pattern: ['PPP', 'PPP'], keys: { P: 'spruce_planks' }, result: { item: 'spruce_trapdoor', count: 2 } },
  { type: 'shaped', pattern: ['PPP', 'PPP'], keys: { P: 'birch_planks' }, result: { item: 'birch_trapdoor', count: 2 } },
  { type: 'shaped', pattern: ['PPP', 'PPP'], keys: { P: 'jungle_planks' }, result: { item: 'jungle_trapdoor', count: 2 } },
  { type: 'shaped', pattern: ['PPP', 'PPP'], keys: { P: 'acacia_planks' }, result: { item: 'acacia_trapdoor', count: 2 } },
  { type: 'shaped', pattern: ['PPP', 'PPP'], keys: { P: 'dark_oak_planks' }, result: { item: 'dark_oak_trapdoor', count: 2 } },
  { type: 'shaped', pattern: ['III'], keys: { I: 'iron_ingot' }, result: { item: 'iron_trapdoor', count: 1 } },

  // ==========================================
  // === 按钮和压力板 ===
  // ==========================================
  { type: 'shaped', pattern: ['P'], keys: { P: 'oak_planks' }, result: { item: 'oak_button', count: 1 } },
  { type: 'shaped', pattern: ['S'], keys: { S: 'stone' }, result: { item: 'stone_button', count: 1 } },
  { type: 'shaped', pattern: ['PP'], keys: { P: 'oak_planks' }, result: { item: 'oak_pressure_plate', count: 1 } },
  { type: 'shaped', pattern: ['SS'], keys: { S: 'stone' }, result: { item: 'stone_pressure_plate', count: 1 } },
  { type: 'shaped', pattern: ['GG'], keys: { G: 'gold_ingot' }, result: { item: 'light_weighted_pressure_plate', count: 1 } },
  { type: 'shaped', pattern: ['II'], keys: { I: 'iron_ingot' }, result: { item: 'heavy_weighted_pressure_plate', count: 1 } },

  // ==========================================
  // === 食物 ===
  // ==========================================
  // 面包
  { type: 'shaped', pattern: ['WWW'], keys: { W: 'wheat' }, result: { item: 'bread', count: 1 } },

  // 蛋糕
  { type: 'shaped', pattern: ['MMM', 'SES', 'WWW'], keys: { M: 'milk_bucket', S: 'sugar', E: 'egg', W: 'wheat' }, result: { item: 'cake', count: 1 } },

  // 曲奇
  { type: 'shaped', pattern: ['WCW'], keys: { W: 'wheat', C: 'ink_sac' }, result: { item: 'cookie', count: 8 } },

  // 南瓜派
  { type: 'shaped', pattern: [' P ', ' E ', ' W '], keys: { P: 'pumpkin', E: 'egg', W: 'sugar' }, result: { item: 'pumpkin_pie', count: 1 } },

  // 金苹果
  { type: 'shaped', pattern: ['GGG', 'GAG', 'GGG'], keys: { G: 'gold_ingot', A: 'apple' }, result: { item: 'golden_apple', count: 1 } },

  // 附魔金苹果
  { type: 'shaped', pattern: ['GGG', 'GAG', 'GGG'], keys: { G: 'gold_block', A: 'apple' }, result: { item: 'enchanted_golden_apple', count: 1 } },

  // 金胡萝卜
  { type: 'shaped', pattern: ['GGG', 'GCG', 'GGG'], keys: { G: 'gold_ingot', C: 'carrot' }, result: { item: 'golden_carrot', count: 1 } },

  // 蘑菇煲
  { type: 'shapeless', ingredients: ['brown_mushroom_block', 'red_mushroom_block'], result: { item: 'mushroom_stew', count: 1 } },

  // 甜菜汤
  { type: 'shaped', pattern: ['BBB', 'BBB', ' B '], keys: { B: 'beetroot' }, result: { item: 'beetroot_soup', count: 1 } },

  // ==========================================
  // === 实用物品 ===
  // ==========================================
  // 打火石
  { type: 'shaped', pattern: ['F ', ' I'], keys: { F: 'flint', I: 'iron_ingot' }, result: { item: 'flint_and_steel', count: 1 } },

  // 剪刀
  { type: 'shaped', pattern: [' I', 'I '], keys: { I: 'iron_ingot' }, result: { item: 'shears', count: 1 } },

  // 钓鱼竿
  { type: 'shaped', pattern: ['  S', ' ST', 'S T'], keys: { S: 'stick', T: 'string' }, result: { item: 'fishing_rod', count: 1 } },

  // 指南针
  { type: 'shaped', pattern: [' I ', 'IRI', ' I '], keys: { I: 'iron_ingot', R: 'redstone_dust' }, result: { item: 'compass', count: 1 } },

  // 时钟
  { type: 'shaped', pattern: [' G ', 'GRG', ' G '], keys: { G: 'gold_ingot', R: 'redstone_dust' }, result: { item: 'clock', count: 1 } },

  // 桶
  { type: 'shaped', pattern: ['I I', ' I '], keys: { I: 'iron_ingot' }, result: { item: 'bucket', count: 1 } },

  // 拴绳
  { type: 'shaped', pattern: ['SS ', 'SO ', '  S'], keys: { S: 'string', O: 'slime_ball' }, result: { item: 'lead', count: 2 } },

  // 命名牌 (简化)
  { type: 'shaped', pattern: [' S ', ' IP', ' I '], keys: { S: 'string', I: 'iron_ingot', P: 'paper' }, result: { item: 'name_tag', count: 1 } },

  // 望远镜
  { type: 'shaped', pattern: [' C ', ' I ', ' I '], keys: { C: 'amethyst_shard', I: 'copper_ingot' }, result: { item: 'spyglass', count: 1 } },

  // ==========================================
  // === 染料 ===
  // ==========================================
  // 基本染料转换
  { type: 'shapeless', ingredients: ['coal'], result: { item: 'black_dye', count: 1 } },
  { type: 'shapeless', ingredients: ['bone_meal'], result: { item: 'white_dye', count: 1 } },
  { type: 'shapeless', ingredients: ['lapis_lazuli'], result: { item: 'blue_dye', count: 1 } },
  { type: 'shapeless', ingredients: ['ink_sac'], result: { item: 'black_dye', count: 1 } },

  // 混合染料
  { type: 'shapeless', ingredients: ['red_dye', 'yellow_dye'], result: { item: 'orange_dye', count: 2 } },
  { type: 'shapeless', ingredients: ['red_dye', 'white_dye'], result: { item: 'pink_dye', count: 2 } },
  { type: 'shapeless', ingredients: ['blue_dye', 'green_dye'], result: { item: 'cyan_dye', count: 2 } },
  { type: 'shapeless', ingredients: ['blue_dye', 'white_dye'], result: { item: 'light_blue_dye', count: 2 } },
  { type: 'shapeless', ingredients: ['white_dye', 'gray_dye'], result: { item: 'light_gray_dye', count: 2 } },
  { type: 'shapeless', ingredients: ['black_dye', 'white_dye'], result: { item: 'gray_dye', count: 2 } },
  { type: 'shapeless', ingredients: ['blue_dye', 'red_dye'], result: { item: 'purple_dye', count: 2 } },
  { type: 'shapeless', ingredients: ['red_dye', 'green_dye'], result: { item: 'brown_dye', count: 2 } },
  { type: 'shapeless', ingredients: ['green_dye', 'white_dye'], result: { item: 'lime_dye', count: 2 } },
  { type: 'shapeless', ingredients: ['blue_dye', 'red_dye', 'white_dye'], result: { item: 'magenta_dye', count: 3 } },

  // ==========================================
  // === 铁砧 ===
  // ==========================================
  { type: 'shaped', pattern: ['BBB', ' I ', 'III'], keys: { B: 'iron_block', I: 'iron_ingot' }, result: { item: 'anvil', count: 1 } },

  // ==========================================
  // === 信标 ===
  // ==========================================
  { type: 'shaped', pattern: ['GGG', 'GSG', 'OOO'], keys: { G: 'glass', S: 'nether_star', O: 'obsidian' }, result: { item: 'beacon', count: 1 } },

  // ==========================================
  // === 钟 ===
  // ==========================================
  { type: 'shaped', pattern: [' G ', 'GIG', ' G '], keys: { G: 'gold_ingot', I: 'iron_ingot' }, result: { item: 'bell', count: 1 } },

  // ==========================================
  // === 梯子 ===
  // ==========================================
  { type: 'shaped', pattern: ['S S', 'SSS', 'S S'], keys: { S: 'stick' }, result: { item: 'ladder', count: 3 } },

  // ==========================================
  // === 铁轨 ===
  // ==========================================
  { type: 'shaped', pattern: ['I I', 'ISI', 'I I'], keys: { I: 'iron_ingot', S: 'stick' }, result: { item: 'rail', count: 16 } },
  { type: 'shaped', pattern: ['G G', 'GSG', 'GRG'], keys: { G: 'gold_ingot', S: 'stick', R: 'redstone_dust' }, result: { item: 'powered_rail', count: 6 } },
  { type: 'shaped', pattern: ['I I', 'ISI', 'IRI'], keys: { I: 'iron_ingot', S: 'stone_pressure_plate', R: 'redstone_dust' }, result: { item: 'detector_rail', count: 6 } },
  { type: 'shaped', pattern: ['I I', 'ISI', 'IRI'], keys: { I: 'iron_ingot', S: 'stick', R: 'redstone_torch' }, result: { item: 'activator_rail', count: 6 } },

  // ==========================================
  // === 红石组件 ===
  // ==========================================
  // 红石火把
  { type: 'shaped', pattern: ['R', 'S'], keys: { R: 'redstone_dust', S: 'stick' }, result: { item: 'redstone_torch', count: 1 } },
  // 拉杆
  { type: 'shaped', pattern: ['S', 'C'], keys: { S: 'stick', C: 'cobblestone' }, result: { item: 'lever', count: 1 } },
  // 中继器
  { type: 'shaped', pattern: ['T T', 'TTT', 'SSS'], keys: { T: 'redstone_torch', S: 'stone' }, result: { item: 'repeater', count: 1 } },
  // 比较器
  { type: 'shaped', pattern: [' T ', 'TRT', 'SSS'], keys: { T: 'redstone_torch', R: 'quartz', S: 'stone' }, result: { item: 'comparator', count: 1 } },
  // 活塞
  { type: 'shaped', pattern: ['PPP', 'CIC', 'CRC'], keys: { P: 'oak_planks', C: 'cobblestone', I: 'iron_ingot', R: 'redstone_dust' }, result: { item: 'piston', count: 1 } },
  // 粘性活塞
  { type: 'shapeless', ingredients: ['piston', 'slime_ball'], result: { item: 'sticky_piston', count: 1 } },
  // 侦测器
  { type: 'shaped', pattern: ['CCC', 'RRQ', 'CCC'], keys: { C: 'cobblestone', R: 'redstone_dust', Q: 'quartz' }, result: { item: 'observer', count: 1 } },
  // 漏斗
  { type: 'shaped', pattern: ['I I', 'ICI', ' I '], keys: { I: 'iron_ingot', C: 'chest' }, result: { item: 'hopper', count: 1 } },
]

/**
 * CraftingSystem - 合成系统
 */
export class CraftingSystem {
  /**
   * 检查3x3网格中是否有匹配的配方
   * grid 是 3x3 数组, 每格为 item id 或 null
   */
  checkCraft(grid: (string | null)[][]): { item: string; count: number } | null {
    for (const recipe of RECIPES) {
      if (recipe.type === 'shaped') {
        const result = this.checkShaped(grid, recipe)
        if (result) return result
      } else {
        const result = this.checkShapeless(grid, recipe)
        if (result) return result
      }
    }
    return null
  }

  private checkShaped(grid: (string | null)[][], recipe: ShapedRecipe): { item: string; count: number } | null {
    const patternHeight = recipe.pattern.length
    const patternWidth = Math.max(...recipe.pattern.map(r => r.length))

    // Try all possible offsets within the 3x3 grid
    for (let offsetY = 0; offsetY <= 3 - patternHeight; offsetY++) {
      for (let offsetX = 0; offsetX <= 3 - patternWidth; offsetX++) {
        if (this.matchesShaped(grid, recipe, offsetX, offsetY)) {
          return { ...recipe.result }
        }
      }
    }
    return null
  }

  private matchesShaped(grid: (string | null)[][], recipe: ShapedRecipe, offsetX: number, offsetY: number): boolean {
    const patternHeight = recipe.pattern.length
    const patternWidth = Math.max(...recipe.pattern.map(r => r.length))

    // Check that pattern matches
    for (let py = 0; py < patternHeight; py++) {
      const row = recipe.pattern[py]
      for (let px = 0; px < row.length; px++) {
        const key = row[px]
        const gridItem = grid[py + offsetY]?.[px + offsetX]
        const expectedItem = key === ' ' ? null : recipe.keys[key]

        if (gridItem !== expectedItem) return false
      }
    }

    // Check that all other cells are empty
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const inPattern =
          x >= offsetX && x < offsetX + patternWidth &&
          y >= offsetY && y < offsetY + patternHeight

        if (!inPattern && grid[y]?.[x] !== null && grid[y]?.[x] !== undefined) {
          return false
        }
      }
    }

    return true
  }

  private checkShapeless(grid: (string | null)[][], recipe: ShapelessRecipe): { item: string; count: number } | null {
    const ingredients = [...recipe.ingredients]
    const gridItems: string[] = []

    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        if (grid[y]?.[x]) {
          gridItems.push(grid[y][x]!)
        }
      }
    }

    if (gridItems.length !== ingredients.length) return null

    // Check if all ingredients are present (order doesn't matter)
    const remaining = [...ingredients]
    for (const item of gridItems) {
      const idx = remaining.indexOf(item)
      if (idx === -1) return null
      remaining.splice(idx, 1)
    }

    return remaining.length === 0 ? { ...recipe.result } : null
  }
}
