/**
 * EnchantmentSystem — Minecraft enchantment registry and helpers.
 */
export interface EnchantmentDef {
  id: string
  name: string
  maxLevel: number
  /** Which tool/weapon/armor types this can be applied to. */
  applicableTo: string[]
  description: string
}

// ── All vanilla Minecraft enchantments ────────────────────────────────

export const ENCHANTMENTS: Record<string, EnchantmentDef> = {

  // ═══ Sword / Axe ═══
  sharpness: {
    id: 'sharpness', name: '锋利', maxLevel: 5,
    applicableTo: ['sword', 'axe'],
    description: '增加近战伤害',
  },
  smite: {
    id: 'smite', name: '亡灵杀手', maxLevel: 5,
    applicableTo: ['sword', 'axe'],
    description: '对亡灵生物造成额外伤害',
  },
  bane_of_arthropods: {
    id: 'bane_of_arthropods', name: '节肢杀手', maxLevel: 5,
    applicableTo: ['sword', 'axe'],
    description: '对节肢生物造成额外伤害',
  },
  knockback: {
    id: 'knockback', name: '击退', maxLevel: 2,
    applicableTo: ['sword'],
    description: '增加击退距离',
  },
  fire_aspect: {
    id: 'fire_aspect', name: '火焰附加', maxLevel: 2,
    applicableTo: ['sword'],
    description: '点燃目标',
  },
  looting: {
    id: 'looting', name: '抢夺', maxLevel: 3,
    applicableTo: ['sword'],
    description: '生物掉落更多物品',
  },

  // ═══ Tools (pickaxe / shovel / axe / hoe) ═══
  efficiency: {
    id: 'efficiency', name: '效率', maxLevel: 5,
    applicableTo: ['pickaxe', 'shovel', 'axe', 'hoe', 'shears'],
    description: '加快挖掘速度',
  },
  fortune: {
    id: 'fortune', name: '时运', maxLevel: 3,
    applicableTo: ['pickaxe', 'shovel', 'axe', 'hoe'],
    description: '增加方块掉落数量',
  },
  silk_touch: {
    id: 'silk_touch', name: '精准采集', maxLevel: 1,
    applicableTo: ['pickaxe', 'shovel', 'axe', 'hoe'],
    description: '挖掘方块掉落自身',
  },

  // ═══ Armor ═══
  protection: {
    id: 'protection', name: '保护', maxLevel: 4,
    applicableTo: ['helmet', 'chestplate', 'leggings', 'boots'],
    description: '减少大部分伤害',
  },
  fire_protection: {
    id: 'fire_protection', name: '火焰保护', maxLevel: 4,
    applicableTo: ['helmet', 'chestplate', 'leggings', 'boots'],
    description: '减少火焰伤害',
  },
  blast_protection: {
    id: 'blast_protection', name: '爆炸保护', maxLevel: 4,
    applicableTo: ['helmet', 'chestplate', 'leggings', 'boots'],
    description: '减少爆炸伤害',
  },
  projectile_protection: {
    id: 'projectile_protection', name: '弹射物保护', maxLevel: 4,
    applicableTo: ['helmet', 'chestplate', 'leggings', 'boots'],
    description: '减少弹射物伤害',
  },
  feather_falling: {
    id: 'feather_falling', name: '摔落保护', maxLevel: 4,
    applicableTo: ['boots'],
    description: '减少摔落伤害',
  },
  thorns: {
    id: 'thorns', name: '荆棘', maxLevel: 3,
    applicableTo: ['chestplate'],
    description: '反弹伤害给攻击者',
  },
  respiration: {
    id: 'respiration', name: '水下呼吸', maxLevel: 3,
    applicableTo: ['helmet'],
    description: '延长水下呼吸时间',
  },
  aqua_affinity: {
    id: 'aqua_affinity', name: '水下速掘', maxLevel: 1,
    applicableTo: ['helmet'],
    description: '水下挖掘速度不减',
  },
  depth_strider: {
    id: 'depth_strider', name: '深海探索者', maxLevel: 3,
    applicableTo: ['boots'],
    description: '增加水下移动速度',
  },

  // ═══ Bow / Crossbow ═══
  power: {
    id: 'power', name: '力量', maxLevel: 5,
    applicableTo: ['bow'],
    description: '增加弓箭伤害',
  },
  punch: {
    id: 'punch', name: '冲击', maxLevel: 2,
    applicableTo: ['bow'],
    description: '增加弓箭击退',
  },
  flame: {
    id: 'flame', name: '火矢', maxLevel: 1,
    applicableTo: ['bow'],
    description: '射出着火的箭',
  },
  infinity: {
    id: 'infinity', name: '无限', maxLevel: 1,
    applicableTo: ['bow'],
    description: '射箭不消耗箭矢',
  },

  // ═══ Fishing Rod ═══
  luck_of_the_sea: {
    id: 'luck_of_the_sea', name: '海之眷顾', maxLevel: 3,
    applicableTo: ['fishing_rod'],
    description: '提高钓鱼获得宝藏几率',
  },
  lure: {
    id: 'lure', name: '饵钓', maxLevel: 3,
    applicableTo: ['fishing_rod'],
    description: '减少钓鱼等待时间',
  },

  // ═══ Trident ═══
  loyalty: {
    id: 'loyalty', name: '忠诚', maxLevel: 3,
    applicableTo: ['trident'],
    description: '投掷后自动返回',
  },
  channeling: {
    id: 'channeling', name: '引雷', maxLevel: 1,
    applicableTo: ['trident'],
    description: '雷暴天击中召唤闪电',
  },
  riptide: {
    id: 'riptide', name: '激流', maxLevel: 3,
    applicableTo: ['trident'],
    description: '水中/雨中投掷推动玩家',
  },

  // ═══ Universal ═══
  unbreaking: {
    id: 'unbreaking', name: '耐久', maxLevel: 3,
    applicableTo: ['pickaxe', 'shovel', 'axe', 'hoe', 'sword', 'bow', 'crossbow', 'fishing_rod', 'trident', 'helmet', 'chestplate', 'leggings', 'boots', 'shears', 'flint_and_steel', 'shield', 'elytra'],
    description: '降低耐久消耗几率',
  },
  mending: {
    id: 'mending', name: '经验修补', maxLevel: 1,
    applicableTo: ['pickaxe', 'shovel', 'axe', 'hoe', 'sword', 'bow', 'crossbow', 'fishing_rod', 'trident', 'helmet', 'chestplate', 'leggings', 'boots', 'shears', 'flint_and_steel', 'shield', 'elytra'],
    description: '用经验修复耐久',
  },
}

/** Maps item IDs to their category for enchantment applicability. */
export function getItemEnchantCategory(itemId: string): string | null {
  // Match by naming convention and item type patterns
  const catByItem: Record<string, string> = {
    bow: 'bow', crossbow: 'crossbow', trident: 'trident',
    fishing_rod: 'fishing_rod', shears: 'shears',
    flint_and_steel: 'flint_and_steel', shield: 'shield', elytra: 'elytra',
  }
  if (catByItem[itemId]) return catByItem[itemId]

  // Tools / weapons by suffix
  const toolSuffixes: [string, string][] = [
    ['_pickaxe', 'pickaxe'], ['_axe', 'axe'], ['_shovel', 'shovel'],
    ['_hoe', 'hoe'], ['_sword', 'sword'],
  ]
  for (const [suffix, cat] of toolSuffixes) {
    if (itemId.endsWith(suffix)) return cat
  }

  // Armor by suffix
  const armorSuffixes: [string, string][] = [
    ['_helmet', 'helmet'], ['_chestplate', 'chestplate'],
    ['_leggings', 'leggings'], ['_boots', 'boots'],
  ]
  for (const [suffix, cat] of armorSuffixes) {
    if (itemId.endsWith(suffix)) return cat
  }

  return null
}

/** Returns the list of enchantments valid for a given item. */
export function getAvailableEnchantments(itemId: string): EnchantmentDef[] {
  const cat = getItemEnchantCategory(itemId)
  if (!cat) return []
  return Object.values(ENCHANTMENTS).filter(e => e.applicableTo.includes(cat))
}

/** Compute total enchantment level from slot enchantments map. */
export function getEnchantLevel(enchants: Record<string, number> | undefined, id: string): number {
  return enchants?.[id] ?? 0
}
