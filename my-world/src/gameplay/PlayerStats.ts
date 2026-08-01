/**
 * PlayerStats — Minecraft 1:1 饥饿 + 经验系统
 *
 * 饥饿机制:
 * - 20 点饥饿值 = 10 个鸡腿图标
 * - 行走: 0.01 消耗/米 → 每 40 秒消耗 1 点
 * - 疾跑: 0.1 消耗/米 → 每 4 秒消耗 1 点
 * - 跳跃: 0.05 每次
 * - 破坏方块: 0.005 每次
 * - 受到伤害: 0.1 每点伤害
 * - 饥饿 > 18 且生命未满: 每 4 秒恢复 0.5 生命, 消耗 1.5 饥饿
 * - 饥饿 = 0: 每 4 秒造成 1 点饥饿伤害
 *
 * 经验机制:
 * - 1:1 MC 升级公式
 * - 等级 0-15:  XP所需 = 2L + 7
 * - 等级 16-30: XP所需 = 5L - 38
 * - 等级 31+:   XP所需 = 9L - 158
 */
import { reactive } from 'vue'

export interface PlayerStatsState {
  /** 饥饿值 0-20 */
  foodLevel: number
  /** 饱和值 (隐藏的内部缓冲) */
  saturation: number
  /** 累计消耗 (达到1时扣除饥饿值) */
  exhaustion: number

  /** 经验值 (当前等级内的) */
  experience: number
  /** 经验等级 */
  experienceLevel: number
  /** 累计总经验 (用于死亡掉落) */
  totalExperience: number
}

export const playerStats = reactive<PlayerStatsState>({
  foodLevel: 20,
  saturation: 5,
  exhaustion: 0,
  experience: 0,
  experienceLevel: 0,
  totalExperience: 0,
})

/** 获取升到指定等级所需累计XP */
function xpForLevel(level: number): number {
  if (level <= 15) return 2 * level + 7
  if (level <= 30) return 5 * level - 38
  return 9 * level - 158
}

/** 获取当前等级升到下一级所需的XP */
export function getXpForNextLevel(level: number): number {
  return xpForLevel(level)
}

/** 添加经验值 */
export function addExperience(amount: number): void {
  playerStats.totalExperience += amount
  playerStats.experience += amount
  while (true) {
    const needed = xpForLevel(playerStats.experienceLevel)
    if (playerStats.experience < needed) break
    playerStats.experience -= needed
    playerStats.experienceLevel++
  }
}

/** 获取经验条进度 0-1 */
export function getXpProgress(): number {
  return playerStats.experience / xpForLevel(playerStats.experienceLevel)
}

/** 消耗经验等级 */
export function spendLevels(levels: number): boolean {
  if (playerStats.experienceLevel < levels) return false
  let remaining = levels
  while (remaining > 0) {
    const cost = xpForLevel(playerStats.experienceLevel - 1)
    playerStats.totalExperience = Math.max(0, playerStats.totalExperience - cost)
    playerStats.experienceLevel--
    remaining--
  }
  playerStats.experience = 0
  return true
}

/** 食物恢复值映射 (MC 1:1) */
const FOOD_RESTORE: Record<string, { food: number; saturation: number }> = {
  apple: { food: 4, saturation: 2.4 },
  golden_apple: { food: 4, saturation: 9.6 },
  enchanted_golden_apple: { food: 4, saturation: 9.6 },
  bread: { food: 5, saturation: 6 },
  cooked_beef: { food: 8, saturation: 12.8 },
  cooked_porkchop: { food: 8, saturation: 12.8 },
  cooked_chicken: { food: 6, saturation: 7.2 },
  cooked_mutton: { food: 6, saturation: 9.6 },
  cooked_cod: { food: 5, saturation: 6 },
  cooked_salmon: { food: 6, saturation: 9.6 },
  raw_beef: { food: 3, saturation: 1.8 },
  raw_porkchop: { food: 3, saturation: 1.8 },
  raw_chicken: { food: 2, saturation: 1.2 },
  raw_mutton: { food: 2, saturation: 1.2 },
  raw_cod: { food: 2, saturation: 0.4 },
  raw_salmon: { food: 2, saturation: 0.4 },
  beef: { food: 3, saturation: 1.8 },
  porkchop: { food: 3, saturation: 1.8 },
  chicken: { food: 2, saturation: 1.2 },
  mutton: { food: 2, saturation: 1.2 },
  cod: { food: 2, saturation: 0.4 },
  salmon: { food: 2, saturation: 0.4 },
  carrot: { food: 3, saturation: 3.6 },
  potato: { food: 1, saturation: 0.6 },
  baked_potato: { food: 5, saturation: 6 },
  pumpkin_pie: { food: 8, saturation: 4.8 },
  cookie: { food: 2, saturation: 0.4 },
  melon_slice: { food: 2, saturation: 1.2 },
  golden_carrot: { food: 6, saturation: 14.4 },
  rotten_flesh: { food: 4, saturation: 0.8 },
  spider_eye: { food: 2, saturation: 3.2 },
  pufferfish: { food: 1, saturation: 0.2 },
  rabbit: { food: 3, saturation: 1.8 },
  cooked_rabbit: { food: 5, saturation: 6 },
  rabbit_stew: { food: 10, saturation: 12 },
  mushroom_stew: { food: 6, saturation: 7.2 },
  beetroot: { food: 1, saturation: 1.2 },
  beetroot_soup: { food: 6, saturation: 7.2 },
  sweet_berries: { food: 2, saturation: 0.4 },
  glow_berries: { food: 2, saturation: 0.4 },
  chorus_fruit: { food: 4, saturation: 2.4 },
  dried_kelp: { food: 1, saturation: 0.6 },
  honey_bottle: { food: 6, saturation: 1.2 },
}

/** 尝试吃食物 */
export function tryEatFood(itemId: string): boolean {
  const data = FOOD_RESTORE[itemId]
  if (!data) return false
  if (playerStats.foodLevel >= 20 && itemId !== 'golden_apple' && itemId !== 'enchanted_golden_apple') return false
  playerStats.foodLevel = Math.min(20, playerStats.foodLevel + data.food)
  playerStats.saturation = Math.min(playerStats.foodLevel, playerStats.saturation + data.saturation)
  return true
}

// 每 tick (50ms) 更新
const HEALTH_TICK = 0
let healthAccum = 0

/** 每帧更新饥饿系统 */
export function updateHunger(dt: number, isMoving: boolean, isSprinting: boolean, currentHealth: number, maxHealth: number): { newHealth: number; tookDamage: boolean } {
  let health = currentHealth
  let tookDamage = false

  // 饥饿消耗
  if (isSprinting && isMoving) {
    playerStats.exhaustion += 0.1 * dt * 20 // 归一化到约每秒
  } else if (isMoving) {
    playerStats.exhaustion += 0.01 * dt * 20
  }

  // 消耗达到 1 → 扣除饥饿值
  if (playerStats.exhaustion >= 1) {
    playerStats.exhaustion -= 1
    if (playerStats.saturation > 0) {
      playerStats.saturation = Math.max(0, playerStats.saturation - 1)
    } else {
      playerStats.foodLevel = Math.max(0, playerStats.foodLevel - 1)
    }
  }

  // 生命恢复 (饥饿 > 18 = 9个鸡腿)
  if (playerStats.foodLevel >= 18 && health < maxHealth && health > 0) {
    healthAccum += dt
    if (healthAccum >= 4) {
      healthAccum = 0
      health = Math.min(maxHealth, health + 1)
      playerStats.exhaustion += 3 // 恢复消耗
      if (playerStats.exhaustion >= 1) {
        playerStats.exhaustion -= 1
        if (playerStats.saturation > 0) playerStats.saturation--
        else playerStats.foodLevel = Math.max(0, playerStats.foodLevel - 1)
      }
    }
  } else {
    healthAccum = 0
  }

  // 饥饿伤害 (饥饿 = 0)
  if (playerStats.foodLevel <= 0) {
    healthAccum += dt
    if (healthAccum >= 4) {
      healthAccum = 0
      health = Math.max(0, health - 1)
      tookDamage = true
    }
  }

  return { newHealth: health, tookDamage }
}

/** 跳跃消耗饥饿 */
export function exhaustJump(): void {
  playerStats.exhaustion += 0.05
}

/** 破坏方块消耗 */
export function exhaustMine(): void {
  playerStats.exhaustion += 0.005
}

/** 受伤害消耗 */
export function exhaustDamage(damage: number): void {
  playerStats.exhaustion += 0.1 * damage
}
