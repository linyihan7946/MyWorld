import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { BlockType } from '@/types/blocks'
import { ITEM_REGISTRY } from '@/types/items'
import { getEnchantLevel } from '@/gameplay/EnchantmentSystem'

export interface InventorySlot {
  item: string | null
  count: number
  blockType?: BlockType
  /** 工具已消耗的耐久点数 */
  durabilityDamage?: number
  /** 附魔 { enchantId: level } */
  enchantments?: Record<string, number>
}

export interface ArmorSlot {
  item: string | null
  slotType: 'helmet' | 'chestplate' | 'leggings' | 'boots'
  enchantments?: Record<string, number>
}

const emptySlot = (): InventorySlot => ({ item: null, count: 0 })
const emptyArmorSlot = (type: 'helmet' | 'chestplate' | 'leggings' | 'boots'): ArmorSlot => ({ item: null, slotType: type })

const CREATIVE_BLOCKS: { item: string; blockType: BlockType }[] = [
  { item: 'grass_block', blockType: BlockType.GRASS_BLOCK },
  { item: 'dirt', blockType: BlockType.DIRT },
  { item: 'stone', blockType: BlockType.STONE },
  { item: 'cobblestone', blockType: BlockType.COBBLESTONE },
  { item: 'oak_planks', blockType: BlockType.OAK_PLANKS },
  { item: 'oak_log', blockType: BlockType.OAK_LOG },
  { item: 'sand', blockType: BlockType.SAND },
  { item: 'glass', blockType: BlockType.GLASS },
  { item: 'stone_bricks', blockType: BlockType.STONE_BRICKS },
]

// === 指令专属方块 (需要创造模式+作弊) ===
const COMMAND_EXCLUSIVE_BLOCKS: { item: string; blockType: BlockType }[] = [
  { item: 'command_block', blockType: BlockType.COMMAND_BLOCK },
  { item: 'chain_command_block', blockType: BlockType.CHAIN_COMMAND_BLOCK },
  { item: 'repeat_command_block', blockType: BlockType.REPEAT_COMMAND_BLOCK },
  { item: 'barrier', blockType: BlockType.BARRIER },
  { item: 'structure_block', blockType: BlockType.STRUCTURE_BLOCK },
  { item: 'jigsaw_block', blockType: BlockType.JIGSAW_BLOCK },
  { item: 'light_block', blockType: BlockType.LIGHT_BLOCK },
  { item: 'structure_void', blockType: BlockType.STRUCTURE_VOID },
  { item: 'debug_stick', blockType: BlockType.AIR }, // 调试棒不是方块
]

export const useInventoryStore = defineStore('inventory', () => {
  // Survival mode: start with empty hotbar
  const hotbar = ref<InventorySlot[]>(Array.from({ length: 9 }, emptySlot))
  const mainInventory = ref<InventorySlot[]>(Array.from({ length: 27 }, emptySlot))
  const armor = ref<ArmorSlot[]>([
    emptyArmorSlot('helmet'),
    emptyArmorSlot('chestplate'),
    emptyArmorSlot('leggings'),
    emptyArmorSlot('boots'),
  ])

  const selectedSlot = ref(0)
  const showInventory = ref(false)

  /** Whether the player is wearing a full set of steel armor. */
  const hasFullSteelArmor = computed(() =>
    armor.value.every(s => s.item?.startsWith('steel_'))
  )

  function selectSlot(slot: number) {
    selectedSlot.value = Math.max(0, Math.min(8, slot))
  }

  /** 切换到创造模式：填满快捷栏 */
  function setCreativeInventory(): void {
    for (let i = 0; i < 9; i++) {
      hotbar.value[i] = {
        item: CREATIVE_BLOCKS[i].item,
        count: 64,
        blockType: CREATIVE_BLOCKS[i].blockType,
      }
    }
  }

  /** 切换到生存模式：清空背包 */
  function setSurvivalInventory(): void {
    for (let i = 0; i < 9; i++) hotbar.value[i] = emptySlot()
    for (let i = 0; i < 27; i++) mainInventory.value[i] = emptySlot()
  }

  function addToHotbar(blockType: BlockType, name: string, count = 1): boolean {
    for (const slot of hotbar.value) {
      if (slot.blockType === blockType && slot.count < 64) {
        slot.count = Math.min(64, slot.count + count)
        return true
      }
    }
    for (let i = 0; i < hotbar.value.length; i++) {
      if (!hotbar.value[i].item) {
        hotbar.value[i] = { item: name, count, blockType }
        return true
      }
    }
    return false
  }

  /** Add an arbitrary item to hotbar/main inventory and return the amount that did not fit. */
  function addItem(item: string, count: number, blockType?: BlockType): number {
    const slots = [...hotbar.value, ...mainInventory.value]
    const stackSize = ITEM_REGISTRY[item]?.stackSize ?? 64
    for (const slot of slots) {
      if (slot.item !== item || slot.count >= stackSize) continue
      const moved = Math.min(count, stackSize - slot.count)
      slot.count += moved
      count -= moved
      if (count === 0) return 0
    }
    for (const slot of slots) {
      if (slot.item) continue
      const moved = Math.min(count, stackSize)
      slot.item = item
      slot.count = moved
      slot.blockType = blockType
      count -= moved
      if (count === 0) return 0
    }
    return count
  }

  function removeFromSelected(): void {
    const slot = hotbar.value[selectedSlot.value]
    if (slot && slot.count > 0) {
      slot.count--
      if (slot.count <= 0) {
        slot.item = null
        slot.blockType = undefined
      }
    }
  }

  /**
   * Calculate total armor defense points
   */
  function getArmorDefense(): number {
    const armorPoints: Record<string, number> = {
      leather_helmet: 1, leather_chestplate: 3, leather_leggings: 2, leather_boots: 1,
      chainmail_helmet: 2, chainmail_chestplate: 5, chainmail_leggings: 4, chainmail_boots: 1,
      iron_helmet: 2, iron_chestplate: 6, iron_leggings: 5, iron_boots: 2,
      golden_helmet: 2, golden_chestplate: 5, golden_leggings: 3, golden_boots: 1,
      diamond_helmet: 3, diamond_chestplate: 8, diamond_leggings: 6, diamond_boots: 3,
      netherite_helmet: 3, netherite_chestplate: 8, netherite_leggings: 6, netherite_boots: 3,
      steel_helmet: 4, steel_chestplate: 9, steel_leggings: 7, steel_boots: 4,
    }
    let total = 0
    for (const slot of armor.value) {
      if (slot.item && armorPoints[slot.item]) {
        total += armorPoints[slot.item]
        // Protection enchantment: +0.5 armor per level per piece
        const protLvl = getEnchantLevel(slot.enchantments, 'protection')
        if (protLvl > 0) total += protLvl * 0.5
      }
    }
    return total
  }

  /**
   * Try to equip armor from an item
   */
  function equipArmor(itemId: string): boolean {
    const armorTypeMap: Record<string, 'helmet' | 'chestplate' | 'leggings' | 'boots'> = {
      leather_helmet: 'helmet', chainmail_helmet: 'helmet', iron_helmet: 'helmet',
      golden_helmet: 'helmet', diamond_helmet: 'helmet', netherite_helmet: 'helmet',
      leather_chestplate: 'chestplate', chainmail_chestplate: 'chestplate', iron_chestplate: 'chestplate',
      golden_chestplate: 'chestplate', diamond_chestplate: 'chestplate', netherite_chestplate: 'chestplate',
      leather_leggings: 'leggings', chainmail_leggings: 'leggings', iron_leggings: 'leggings',
      golden_leggings: 'leggings', diamond_leggings: 'leggings', netherite_leggings: 'leggings',
      leather_boots: 'boots', chainmail_boots: 'boots', iron_boots: 'boots',
      golden_boots: 'boots', diamond_boots: 'boots', netherite_boots: 'boots',
      steel_helmet: 'helmet', steel_chestplate: 'chestplate', steel_leggings: 'leggings', steel_boots: 'boots',
    }

    const slotType = armorTypeMap[itemId]
    if (!slotType) return false

    const slot = armor.value.find(s => s.slotType === slotType)
    if (slot) {
      slot.item = itemId
      return true
    }
    return false
  }

  /** 获取指令专属物品列表 (创造+作弊可见) */
  function getCommandExclusiveBlocks() {
    return COMMAND_EXCLUSIVE_BLOCKS
  }

  return { hotbar, mainInventory, armor, selectedSlot, showInventory, selectSlot, addToHotbar, addItem, removeFromSelected, setCreativeInventory, setSurvivalInventory, getArmorDefense, equipArmor, hasFullSteelArmor, getCommandExclusiveBlocks }
})
