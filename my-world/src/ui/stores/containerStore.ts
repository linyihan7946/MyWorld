import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { BlockType } from '@/types/blocks'
import type { InventorySlot } from './inventoryStore'

export interface ContainerPart {
  key: string
  x: number
  y: number
  z: number
}

interface ContainerData {
  slots: InventorySlot[]
}

export interface ActiveContainer {
  type: BlockType.CHEST | BlockType.BARREL | BlockType.HOPPER
  title: string
  parts: ContainerPart[]
}

const emptySlot = (): InventorySlot => ({ item: null, count: 0 })

export const containerPositionKey = (x: number, y: number, z: number): string => `${x},${y},${z}`

export const useContainerStore = defineStore('containers', () => {
  const containers = ref<Record<string, ContainerData>>({})
  const active = ref<ActiveContainer | null>(null)

  const activeSlots = computed<InventorySlot[]>(() => {
    if (!active.value) return []
    return active.value.parts.flatMap(part => containers.value[part.key]?.slots ?? [])
  })

  function ensureContainer(part: ContainerPart, size: number): void {
    if (!containers.value[part.key]) {
      containers.value[part.key] = {
        slots: Array.from({ length: size }, emptySlot),
      }
    }
  }

  function openContainer(
    type: BlockType.CHEST | BlockType.BARREL | BlockType.HOPPER,
    positions: Array<{ x: number; y: number; z: number }>,
  ): void {
    const parts = positions
      .map(position => ({
        ...position,
        key: containerPositionKey(position.x, position.y, position.z),
      }))
      .sort((a, b) => a.x - b.x || a.z - b.z || a.y - b.y)

    for (const part of parts) ensureContainer(part, type === BlockType.HOPPER ? 5 : 27)
    active.value = {
      type,
      title: type === BlockType.HOPPER ? '漏斗' : type === BlockType.BARREL ? '木桶' : parts.length === 2 ? '大型箱子' : '箱子',
      parts,
    }
  }

  function closeContainer(): void {
    active.value = null
  }

  function removeContainer(x: number, y: number, z: number): InventorySlot[] {
    const key = containerPositionKey(x, y, z)
    const contents = (containers.value[key]?.slots ?? [])
      .filter(slot => slot.item && slot.count > 0)
      .map(slot => ({ ...slot }))
    delete containers.value[key]
    if (active.value?.parts.some(part => part.key === key)) closeContainer()
    return contents
  }

  return { containers, active, activeSlots, openContainer, closeContainer, removeContainer }
})
