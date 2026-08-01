/**
 * PotionEffect — 药水效果系统
 * 管理玩家身上的状态效果（增益/减益）
 */
export type EffectId =
  | 'speed' | 'slowness' | 'haste' | 'mining_fatigue'
  | 'strength' | 'instant_health' | 'instant_damage'
  | 'jump_boost' | 'nausea' | 'regeneration'
  | 'resistance' | 'fire_resistance' | 'water_breathing'
  | 'invisibility' | 'blindness' | 'night_vision'
  | 'hunger' | 'weakness' | 'poison' | 'wither'
  | 'health_boost' | 'absorption' | 'saturation'
  | 'slow_falling' | 'levitation'

export interface ActiveEffect {
  id: EffectId
  level: number        // 等级 1-4（对应 MC I-IV）
  duration: number     // 剩余时间 (秒)
  maxDuration: number  // 总时间
  particles: boolean
  icon: boolean
}

const EFFECT_COLORS: Record<EffectId, number> = {
  speed: 0x7cafc6, slowness: 0x5a6c81, haste: 0xd9c043, mining_fatigue: 0x4a4217,
  strength: 0x932423, instant_health: 0xf82423, instant_damage: 0x430a09,
  jump_boost: 0x22ff4c, nausea: 0x551d4a, regeneration: 0xcd5cab,
  resistance: 0x99453a, fire_resistance: 0xe49a3a, water_breathing: 0x2e5299,
  invisibility: 0x7f8392, blindness: 0x1f1f23, night_vision: 0x1f1fa1,
  hunger: 0x587653, weakness: 0x484d48, poison: 0x4e9331, wither: 0x352a27,
  health_boost: 0xf87d23, absorption: 0x2552a5, saturation: 0xf82423,
  slow_falling: 0xf7efcb, levitation: 0xceffff,
}

const EFFECT_NAMES: Record<EffectId, string> = {
  speed: '速度', slowness: '缓慢', haste: '急迫', mining_fatigue: '挖掘疲劳',
  strength: '力量', instant_health: '瞬间治疗', instant_damage: '瞬间伤害',
  jump_boost: '跳跃提升', nausea: '反胃', regeneration: '生命恢复',
  resistance: '抗性提升', fire_resistance: '防火', water_breathing: '水下呼吸',
  invisibility: '隐身', blindness: '失明', night_vision: '夜视',
  hunger: '饥饿', weakness: '虚弱', poison: '中毒', wither: '凋零',
  health_boost: '生命提升', absorption: '伤害吸收', saturation: '饱和',
  slow_falling: '缓降', levitation: '漂浮',
}

/** 各等级持续时间 (秒)，不含红石/萤石粉延长 */
const BASE_DURATIONS: Record<string, number> = {
  speed: 180, slowness: 90, haste: 180, mining_fatigue: 180,
  strength: 180, jump_boost: 180, regeneration: 45, resistance: 180,
  fire_resistance: 180, water_breathing: 180, invisibility: 180,
  blindness: 45, night_vision: 180, poison: 45, weakness: 90,
  slow_falling: 90, levitation: 15, nausea: 15,
  health_boost: 120, absorption: 120, saturation: 0.5,
  hunger: 30, wither: 40,
}

export class PotionEffectManager {
  private effects: Map<EffectId, ActiveEffect> = new Map()

  /** 应用一个效果 */
  apply(id: EffectId, level = 1, durationOverride?: number, particles = true, icon = true): void {
    const duration = durationOverride ?? (BASE_DURATIONS[id] ?? 30)

    // 瞬间效果直接触发
    if (id === 'instant_health' || id === 'instant_damage' || id === 'saturation') {
      this.onInstantEffect?.(id, level)
      return
    }

    const existing = this.effects.get(id)
    if (existing && existing.level === level) {
      // 同等级：延长持续时间
      existing.duration = Math.max(existing.duration, duration)
      existing.maxDuration = Math.max(existing.maxDuration, duration)
    } else if (existing && existing.level < level) {
      // 更高等级覆盖
      existing.level = level
      existing.duration = duration
      existing.maxDuration = duration
    } else if (!existing) {
      this.effects.set(id, { id, level, duration, maxDuration: duration, particles, icon })
    }
    // 已有更高级别则忽略
  }

  /** 移除一个效果 */
  remove(id: EffectId): void {
    this.effects.delete(id)
  }

  /** 清除所有效果 */
  clear(): void {
    this.effects.clear()
  }

  /** 获取效果等级 (0 = 无效果) */
  getLevel(id: EffectId): number {
    return this.effects.get(id)?.level ?? 0
  }

  /** 是否有某个效果 */
  has(id: EffectId): boolean {
    return this.effects.has(id)
  }

  /** 获取所有活跃效果 */
  getActive(): ActiveEffect[] {
    return [...this.effects.values()]
  }

  /** 获取效果颜色 (用于粒子等) */
  getColor(id: EffectId): number {
    return EFFECT_COLORS[id] ?? 0xffffff
  }

  /** 效果名称 */
  getName(id: EffectId): string {
    return EFFECT_NAMES[id] ?? id
  }

  /** 获取药水颜色 (混合所有活跃效果) */
  getPotionColor(): number {
    if (this.effects.size === 0) return 0x385dc6 // 默认水瓶蓝
    let r = 0, g = 0, b = 0
    for (const e of this.effects.values()) {
      const c = EFFECT_COLORS[e.id] ?? 0xffffff
      r += (c >> 16) & 0xff
      g += (c >> 8) & 0xff
      b += c & 0xff
    }
    const n = this.effects.size
    return ((Math.round(r / n) & 0xff) << 16) | ((Math.round(g / n) & 0xff) << 8) | (Math.round(b / n) & 0xff)
  }

  /** 每帧更新 (dt 秒) */
  update(dt: number): void {
    for (const [id, effect] of this.effects) {
      effect.duration -= dt
      if (effect.duration <= 0) {
        this.effects.delete(id)
      }
    }
  }

  /** 瞬间效果回调 */
  onInstantEffect: ((id: EffectId, level: number) => void) | null = null

  /** 获取速度倍率 (speed/slowness) */
  getSpeedMultiplier(): number {
    const speedLvl = this.getLevel('speed')
    const slowLvl = this.getLevel('slowness')
    if (speedLvl > 0) return 1 + speedLvl * 0.2
    if (slowLvl > 0) return 1 - slowLvl * 0.15
    return 1
  }

  /** 获取跳跃倍率 */
  getJumpMultiplier(): number {
    const lvl = this.getLevel('jump_boost')
    if (lvl > 0) return 1 + lvl * 0.5
    return 1
  }
}

/** 全局单例 */
export const potionEffects = new PotionEffectManager()
