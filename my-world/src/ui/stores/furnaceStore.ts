import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { BlockType } from '@/types/blocks'
import type { InventorySlot } from './inventoryStore'

export type FurnaceKind = BlockType.FURNACE | BlockType.BLAST_FURNACE | BlockType.SMOKER

export interface FurnaceData {
  kind: FurnaceKind
  input: InventorySlot
  fuel: InventorySlot
  output: InventorySlot
  /** 烧炼进度 0..1 */
  progress: number
  /** 当前燃料剩余燃烧时间（秒） */
  burnTime: number
  burnTotal: number
}

/** 烧炼配方: 输入物品 → 输出物品 */
export const SMELT_RECIPES: Record<string, string> = {
  raw_beef: 'cooked_beef',
  raw_porkchop: 'cooked_porkchop',
  raw_chicken: 'cooked_chicken',
  raw_mutton: 'cooked_mutton',
  raw_cod: 'cooked_cod',
  raw_salmon: 'cooked_salmon',
  potato: 'baked_potato',
  clay: 'brick_item',
}

/** 燃料: 物品 → 燃烧秒数（原版煤炭可烧 8 个物品 ≈ 80 秒） */
export const FUEL_SECONDS: Record<string, number> = {
  coal: 80,
  charcoal: 80,
  oak_planks: 15,
  spruce_planks: 15,
  birch_planks: 15,
  jungle_planks: 15,
  acacia_planks: 15,
  dark_oak_planks: 15,
  oak_log: 15,
  spruce_log: 15,
  birch_log: 15,
  jungle_log: 15,
  acacia_log: 15,
  dark_oak_log: 15,
  stick: 5,
}

const emptySlot = (): InventorySlot => ({ item: null, count: 0 })

const posKey = (x: number, y: number, z: number): string => `${x},${y},${z}`

/** 烧炼一个物品的基础耗时（秒）；高炉/烟熏炉快一倍 */
const BASE_SMELT_SECONDS = 10

export const useFurnaceStore = defineStore('furnaces', () => {
  const furnaces = ref<Record<string, FurnaceData>>({})
  const active = ref<{ x: number; y: number; z: number } | null>(null)

  const activeData = computed<FurnaceData | null>(() => {
    if (!active.value) return null
    return furnaces.value[posKey(active.value.x, active.value.y, active.value.z)] ?? null
  })

  const title = computed(() => {
    if (!activeData.value) return '熔炉'
    return activeData.value.kind === BlockType.BLAST_FURNACE ? '高炉' : activeData.value.kind === BlockType.SMOKER ? '烟熏炉' : '熔炉'
  })

  function openFurnace(kind: FurnaceKind, x: number, y: number, z: number): void {
    const key = posKey(x, y, z)
    if (!furnaces.value[key]) {
      furnaces.value[key] = {
        kind,
        input: emptySlot(),
        fuel: emptySlot(),
        output: emptySlot(),
        progress: 0,
        burnTime: 0,
        burnTotal: 0,
      }
    }
    active.value = { x, y, z }
  }

  function closeFurnace(): void {
    active.value = null
  }

  function removeFurnace(x: number, y: number, z: number): InventorySlot[] {
    const key = posKey(x, y, z)
    const data = furnaces.value[key]
    const contents = data
      ? [data.input, data.fuel, data.output]
          .filter(slot => slot.item && slot.count > 0)
          .map(slot => ({ ...slot }))
      : []
    delete furnaces.value[key]
    if (active.value && posKey(active.value.x, active.value.y, active.value.z) === key) closeFurnace()
    return contents
  }

  /** 由引擎每帧调用，驱动所有熔炉的烧炼进度 */
  function update(dt: number): void {
    for (const data of Object.values(furnaces.value)) {
      const recipe = data.input.item ? SMELT_RECIPES[data.input.item] : undefined
      const outputFits = !!recipe && (data.output.item === null || (data.output.item === recipe && data.output.count < 64))
      const burning = data.burnTime > 0

      // 需要燃料且未在燃烧: 消耗 1 个燃料
      if (!burning && outputFits && data.fuel.item) {
        const fuelSecs = FUEL_SECONDS[data.fuel.item] ?? 5
        data.fuel.count -= 1
        if (data.fuel.count <= 0) data.fuel = emptySlot()
        data.burnTime = fuelSecs
        data.burnTotal = fuelSecs
      }

      if (data.burnTime > 0) {
        data.burnTime = Math.max(0, data.burnTime - dt)
        if (outputFits && recipe) {
          const speed = data.kind === BlockType.FURNACE ? 1 : 2
          data.progress += (dt * speed) / BASE_SMELT_SECONDS
          if (data.progress >= 1) {
            data.progress = 0
            data.input.count -= 1
            if (data.input.count <= 0) data.input = emptySlot()
            if (data.output.item === recipe) {
              data.output.count += 1
            } else {
              data.output = { item: recipe, count: 1 }
            }
          }
        } else {
          // 没有可烧炼的物品时进度清空
          data.progress = 0
        }
      }
    }
  }

  return { furnaces, active, activeData, title, openFurnace, closeFurnace, removeFurnace, update }
})
