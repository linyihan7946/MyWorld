/**
 * BrewingSystem — 酿造和药水使用
 * 管理药水饮用效果映射和酿造配方
 */
import type { EffectId } from './PotionEffect'
import { potionEffects } from './PotionEffect'

interface PotionEffectDef {
  effects: Array<{ id: EffectId; level: number; duration?: number }>
}

/** 药水 → 效果映射 */
const POTION_EFFECTS: Record<string, PotionEffectDef> = {
  potion_healing: { effects: [{ id: 'instant_health', level: 1 }] },
  potion_healing_2: { effects: [{ id: 'instant_health', level: 2 }] },
  potion_strength: { effects: [{ id: 'strength', level: 1 }] },
  potion_strength_2: { effects: [{ id: 'strength', level: 2 }] },
  potion_swiftness: { effects: [{ id: 'speed', level: 1 }] },
  potion_swiftness_2: { effects: [{ id: 'speed', level: 2 }] },
  potion_fire_resistance: { effects: [{ id: 'fire_resistance', level: 1, duration: 180 }] },
  potion_fire_resistance_l: { effects: [{ id: 'fire_resistance', level: 1, duration: 480 }] },
  potion_regeneration: { effects: [{ id: 'regeneration', level: 1 }] },
  potion_regeneration_2: { effects: [{ id: 'regeneration', level: 2 }] },
  potion_night_vision: { effects: [{ id: 'night_vision', level: 1, duration: 180 }] },
  potion_night_vision_l: { effects: [{ id: 'night_vision', level: 1, duration: 480 }] },
  potion_invisibility: { effects: [{ id: 'invisibility', level: 1, duration: 180 }] },
  potion_invisibility_l: { effects: [{ id: 'invisibility', level: 1, duration: 480 }] },
  potion_water_breathing: { effects: [{ id: 'water_breathing', level: 1, duration: 180 }] },
  potion_water_breathing_l: { effects: [{ id: 'water_breathing', level: 1, duration: 480 }] },
  potion_leaping: { effects: [{ id: 'jump_boost', level: 1 }] },
  potion_leaping_2: { effects: [{ id: 'jump_boost', level: 2 }] },
  potion_slow_falling: { effects: [{ id: 'slow_falling', level: 1, duration: 90 }] },
  potion_slow_falling_l: { effects: [{ id: 'slow_falling', level: 1, duration: 240 }] },
  potion_poison: { effects: [{ id: 'poison', level: 1 }] },
  potion_poison_2: { effects: [{ id: 'poison', level: 2 }] },
  potion_weakness: { effects: [{ id: 'weakness', level: 1, duration: 90 }] },
  potion_weakness_l: { effects: [{ id: 'weakness', level: 1, duration: 240 }] },
  potion_slowness: { effects: [{ id: 'slowness', level: 1, duration: 90 }] },
  potion_slowness_l: { effects: [{ id: 'slowness', level: 1, duration: 240 }] },
  potion_harming: { effects: [{ id: 'instant_damage', level: 1 }] },
  potion_harming_2: { effects: [{ id: 'instant_damage', level: 2 }] },
  // 喷溅药水（效果相同，可通过投掷使用）
  splash_healing: { effects: [{ id: 'instant_health', level: 1 }] },
  splash_healing_2: { effects: [{ id: 'instant_health', level: 2 }] },
  splash_harming: { effects: [{ id: 'instant_damage', level: 1 }] },
  splash_harming_2: { effects: [{ id: 'instant_damage', level: 2 }] },
  splash_poison: { effects: [{ id: 'poison', level: 1 }] },
  splash_poison_2: { effects: [{ id: 'poison', level: 2 }] },
  splash_slowness: { effects: [{ id: 'slowness', level: 1, duration: 60 }] },
  splash_weakness: { effects: [{ id: 'weakness', level: 1, duration: 60 }] },
  splash_regeneration: { effects: [{ id: 'regeneration', level: 1 }] },
  splash_strength: { effects: [{ id: 'strength', level: 1 }] },
  splash_swiftness: { effects: [{ id: 'speed', level: 1 }] },
  splash_fire_resistance: { effects: [{ id: 'fire_resistance', level: 1, duration: 120 }] },
}

export class BrewingSystem {
  /** 饮用药水，返回是否成功 */
  static drinkPotion(itemId: string, isSplash = false): boolean {
    const def = POTION_EFFECTS[itemId]
    if (!def) return false

    for (const eff of def.effects) {
      potionEffects.apply(eff.id, eff.level, eff.duration)
    }
    return true
  }

  /** 检查是否是药水 */
  static isPotion(itemId: string): boolean {
    return itemId in POTION_EFFECTS
  }

  /** 检查是否是喷溅药水 */
  static isSplash(itemId: string): boolean {
    return itemId.startsWith('splash_')
  }

  /** 获取药水效果描述 */
  static getEffectDescription(itemId: string): string {
    const def = POTION_EFFECTS[itemId]
    if (!def) return ''
    return def.effects.map(e => {
      const name = potionEffects.getName(e.id)
      const lvl = e.level > 1 ? ` ${'I'.repeat(e.level)}` : ''
      const dur = e.duration ? ` (${Math.round(e.duration)}s)` : ''
      return `${name}${lvl}${dur}`
    }).join(' + ')
  }
}
