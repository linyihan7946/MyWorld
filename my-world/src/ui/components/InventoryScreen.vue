<template>
  <div
    v-if="inventoryStore.showInventory"
    class="inventory-screen"
    @click.self="close"
    @contextmenu.prevent
  >
    <div class="inventory-container">
      <h2>{{ playerStore.gameMode === 'creative' ? '创造物品栏' : '背包' }}</h2>

      <!-- Crafting area -->
      <div v-if="playerStore.gameMode === 'survival'" class="craft-area">
        <div class="craft-grid">
          <div
            v-for="i in 9"
            :key="'craft-' + i"
            class="craft-slot"
            @click.left="handleSlotClick('craft', i - 1, 0, $event)"
            @click.right="handleSlotClick('craft', i - 1, 2, $event)"
          >
            <div
              v-if="craftGrid[Math.floor((i-1)/3)][(i-1)%3]"
              class="item"
              :style="getInventoryIconStyle(craftGrid[Math.floor((i-1)/3)][(i-1)%3])"
            >
              <span
                v-if="getCraftSlotCount(Math.floor((i-1)/3), (i-1)%3) > 1"
                class="count"
              >{{ getCraftSlotCount(Math.floor((i-1)/3), (i-1)%3) }}</span>
            </div>
          </div>
        </div>
        <div class="craft-arrow">→</div>
        <div class="craft-result" @click.left="handleCraftResultClick">
          <div
            v-if="craftResult"
            class="item result"
            :style="getInventoryIconStyle(craftResult.item)"
          >
            <span v-if="!isBlockItem(craftResult.item)">{{ getSlotShortName(craftResult.item) }}</span>
            <span v-if="craftResult.count > 1" class="count">{{ craftResult.count }}</span>
          </div>
        </div>
      </div>

      <!-- Armor slots -->
      <div v-if="playerStore.gameMode === 'survival'" class="armor-area">
        <div class="armor-label">盔甲</div>
        <div class="armor-slots">
          <div
            v-for="(slot, idx) in inventoryStore.armor"
            :key="'armor-' + idx"
            class="armor-slot"
            :class="slot.slotType"
            @click.left="handleArmorClick(idx, 0, $event)"
            @click.right="handleArmorClick(idx, 2, $event)"
          >
            <div
              v-if="slot.item"
              class="item"
              :style="getInventoryIconStyle(slot.item)"
            >
              {{ getSlotShortName(slot.item) }}
            </div>
            <div v-else class="armor-icon">{{ getArmorIcon(slot.slotType) }}</div>
          </div>
        </div>
        <div class="armor-defense" v-if="inventoryStore.getArmorDefense() > 0">
          防御: {{ inventoryStore.getArmorDefense() }}
        </div>
      </div>

      <!-- Creative item catalog -->
      <div v-if="playerStore.gameMode === 'creative'" class="creative-catalog">
        <div class="creative-tabs">
          <button
            v-for="category in creativeCategories"
            :key="category.id"
            type="button"
            class="creative-tab"
            :class="{ active: creativeCategory === category.id }"
            @click.stop="switchCreativeCategory(category.id)"
          >{{ category.name }} ({{ categoryCounts[category.id] || 0 }})</button>
        </div>
        <div class="creative-label">{{ activeCreativeCategoryName }}（{{ creativeItems.length }}）</div>
        <div class="creative-grid">
          <button
            v-for="entry in creativeItems"
            :key="entry.item"
            class="creative-slot"
            :title="entry.name"
            @click.stop="selectCreativeItem(entry)"
          >
            <span class="item" :style="getInventoryIconStyle(entry.item)">
              <span v-if="entry.blockType === undefined">{{ getSlotShortName(entry.item) }}</span>
            </span>
            <span class="creative-item-name">{{ entry.name }}</span>
          </button>
        </div>
      </div>

      <!-- Main inventory (3 rows x 9) -->
      <div v-if="playerStore.gameMode === 'survival'" class="main-inventory">
        <div
          v-for="i in 27"
          :key="'main-' + i"
          class="inv-slot"
          @click.left="handleSlotClick('main', i - 1, 0, $event)"
          @click.right="handleSlotClick('main', i - 1, 2, $event)"
        >
          <div
            v-if="inventoryStore.mainInventory[i-1]?.item"
            class="item"
            :style="getInventoryIconStyle(inventoryStore.mainInventory[i-1].item)"
          >
            <span v-if="!isBlockItem(inventoryStore.mainInventory[i-1].item)">
              {{ getSlotShortName(inventoryStore.mainInventory[i-1].item) }}
            </span>
            <span v-if="inventoryStore.mainInventory[i-1].count > 1" class="count">
              {{ inventoryStore.mainInventory[i-1].count }}
            </span>
          </div>
        </div>
      </div>

      <!-- Hotbar -->
      <div class="hotbar-section">
        <div
          v-for="i in 9"
          :key="'hot-' + i"
          class="inv-slot"
          :class="{ active: i - 1 === inventoryStore.selectedSlot }"
          @click.left="handleSlotClick('hotbar', i - 1, 0, $event)"
          @click.right="handleSlotClick('hotbar', i - 1, 2, $event)"
        >
          <div
            v-if="inventoryStore.hotbar[i-1]?.item"
            class="item"
            :style="getInventoryIconStyle(inventoryStore.hotbar[i-1].item)"
          >
            <span v-if="!isBlockItem(inventoryStore.hotbar[i-1].item)">
              {{ getSlotShortName(inventoryStore.hotbar[i-1].item) }}
            </span>
            <span v-if="inventoryStore.hotbar[i-1].count > 1" class="count">
              {{ inventoryStore.hotbar[i-1].count }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Cursor item (follows mouse) -->
    <div
      v-if="cursorItem"
      class="cursor-item"
      :style="[
        getInventoryIconStyle(cursorItem.item),
        { left: cursorX + 'px', top: cursorY + 'px' },
      ]"
    >
      <span v-if="!isBlockItem(cursorItem.item)">{{ getSlotShortName(cursorItem.item) }}</span>
      <span v-if="cursorItem.count > 1" class="count">{{ cursorItem.count }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useInventoryStore } from '@/ui/stores/inventoryStore'
import { usePlayerStore } from '@/ui/stores/playerStore'
import { CraftingSystem } from '@/gameplay/CraftingSystem'
import { ITEM_REGISTRY } from '@/types/items'
import { BLOCK_REGISTRY, BlockType, getBlockTypeForItem } from '@/types/blocks'
import { getItemIconStyle } from '@/ui/itemIcon'
import { useContainerStore } from '@/ui/stores/containerStore'

const inventoryStore = useInventoryStore()
const playerStore = usePlayerStore()
const containerStore = useContainerStore()
const craftingSystem = new CraftingSystem()

type CreativeCategory = 'blocks' | 'redstone' | 'tools' | 'combat' | 'armor' | 'items'
interface CreativeEntry { item: string; name: string; blockType?: BlockType; stackSize: number; category: CreativeCategory }

const creativeCategory = ref<CreativeCategory>('blocks')
const creativeCategories: Array<{ id: CreativeCategory; name: string }> = [
  { id: 'blocks', name: '方块' }, { id: 'redstone', name: '红石' },
  { id: 'tools', name: '工具' }, { id: 'combat', name: '战斗' },
  { id: 'armor', name: '盔甲' }, { id: 'items', name: '物品' },
]
const redstoneItems = new Set(['redstone', 'redstone_block', 'redstone_dust', 'piston', 'sticky_piston', 'repeater', 'comparator', 'observer', 'hopper'])

const allCreativeItems = computed<CreativeEntry[]>(() => {
  const entries: CreativeEntry[] = Object.values(BLOCK_REGISTRY)
    .filter(definition => definition.id !== BlockType.AIR && definition.id !== BlockType.PISTON_HEAD)
    .sort((a, b) => a.id - b.id)
    .map(definition => {
      const item = String(BlockType[definition.id]).toLowerCase()
      return { item, name: definition.name, blockType: definition.id, stackSize: 64,
        category: redstoneItems.has(item) ? 'redstone' : 'blocks' }
    })
  const knownBlocks = new Set(entries.map(entry => entry.item))
  for (const definition of Object.values(ITEM_REGISTRY)) {
    if (knownBlocks.has(definition.id)) continue
    let category: CreativeCategory = 'items'
    if (redstoneItems.has(definition.id)) category = 'redstone'
    else if (definition.type === 'tool') category = 'tools'
    else if (definition.type === 'weapon') category = 'combat'
    else if (definition.type === 'armor') category = 'armor'
    entries.push({ item: definition.id, name: definition.name, stackSize: definition.stackSize, category })
  }
  return entries
})
function switchCreativeCategory(id: CreativeCategory) {
  creativeCategory.value = id
}

// 各分类物品数量（用于标签显示）
const categoryCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const entry of allCreativeItems.value) {
    counts[entry.category] = (counts[entry.category] || 0) + 1
  }
  return counts
})

const creativeItems = computed(() => {
  const filtered = allCreativeItems.value.filter(entry => entry.category === creativeCategory.value)
  return filtered
})
const activeCreativeCategoryName = computed(() => creativeCategories.find(category => category.id === creativeCategory.value)?.name ?? '')

function selectCreativeItem(entry: CreativeEntry): void {
  inventoryStore.hotbar[inventoryStore.selectedSlot] = {
    item: entry.item, count: entry.stackSize,
    ...(entry.blockType === undefined ? {} : { blockType: entry.blockType }),
  }
}

// Craft grid: 3x3
const craftGrid = ref<(string | null)[][]>([
  [null, null, null],
  [null, null, null],
  [null, null, null],
])

const craftResult = ref<{ item: string; count: number } | null>(null)

// Cursor item: the item currently held by the mouse cursor
const cursorItem = ref<{ item: string; count: number } | null>(null)
const cursorX = ref(0)
const cursorY = ref(0)

// Track mouse position for cursor item
const onMouseMove = (e: MouseEvent) => {
  cursorX.value = e.clientX
  cursorY.value = e.clientY
}

// Watch grid changes and check recipes
watch(craftGrid, () => {
  const result = craftingSystem.checkCraft(craftGrid.value)
  craftResult.value = result
}, { deep: true })

function getCraftSlotCount(row: number, col: number): number {
  return craftGrid.value[row][col] ? 1 : 0
}

// Unified slot click handler
function handleSlotClick(
  type: 'craft' | 'main' | 'hotbar',
  index: number,
  button: number,
  e: MouseEvent,
) {
  e.stopPropagation()
  const shiftHeld = e.shiftKey

  // Get the target slot reference
  let targetItem: string | null = null
  let targetCount = 0
  let craftCell: { row: number; col: number } | null = null

  if (type === 'craft') {
    const row = Math.floor(index / 3)
    const col = index % 3
    craftCell = { row, col }
    targetItem = craftGrid.value[row][col]
    targetCount = targetItem ? 1 : 0
  } else if (type === 'main') {
    const slot = inventoryStore.mainInventory[index]
    targetItem = slot.item
    targetCount = slot.count
  } else {
    const slot = inventoryStore.hotbar[index]
    targetItem = slot.item
    targetCount = slot.count
  }

  // Helper to write back to the slot
  const setSlot = (item: string | null, count: number) => {
    if (type === 'craft' && craftCell) {
      craftGrid.value[craftCell.row][craftCell.col] = item
    } else if (type === 'main') {
      const slot = inventoryStore.mainInventory[index]
      slot.item = item
      slot.count = count
      slot.blockType = getBlockTypeForItem(item)
    } else {
      const slot = inventoryStore.hotbar[index]
      slot.item = item
      slot.count = count
      slot.blockType = getBlockTypeForItem(item)
    }
  }

  // Shift+click: quick move between sections (ignores cursor)
  if (shiftHeld && !cursorItem.value && targetItem) {
    if (type === 'hotbar') {
      if (addToMainInventory(targetItem, targetCount)) {
        setSlot(null, 0)
      }
    } else if (type === 'main') {
      if (addToHotbar(targetItem, targetCount)) {
        setSlot(null, 0)
      }
    } else if (type === 'craft') {
      // Return craft item to main inventory
      if (addToMainInventory(targetItem, targetCount)) {
        setSlot(null, 0)
      }
    }
    return
  }

  // === Crafting slots: simplified interaction ===
  if (type === 'craft') {
    if (button === 0) {
      if (!cursorItem.value && targetItem) {
        // Pick up item from craft slot
        cursorItem.value = { item: targetItem, count: 1 }
        setSlot(null, 0)
      } else if (cursorItem.value && !targetItem) {
        // Place one item into craft slot
        setSlot(cursorItem.value.item, 1)
        cursorItem.value.count--
        if (cursorItem.value.count <= 0) cursorItem.value = null
      } else if (cursorItem.value && targetItem && targetItem !== cursorItem.value.item) {
        // Swap
        setSlot(cursorItem.value.item, 1)
        cursorItem.value = { item: targetItem, count: 1 }
      }
      // cursorItem same as targetItem in craft slot: no-op (can't stack in craft)
    } else if (button === 2) {
      // Right click on craft slot: place one if cursor has item
      if (cursorItem.value && !targetItem) {
        setSlot(cursorItem.value.item, 1)
        cursorItem.value.count--
        if (cursorItem.value.count <= 0) cursorItem.value = null
      } else if (!cursorItem.value && targetItem) {
        // Pick up from craft (same as left click for single items)
        cursorItem.value = { item: targetItem, count: 1 }
        setSlot(null, 0)
      }
    }
    return
  }

  // === Normal inventory slots ===
  if (button === 0) {
    // Left click
    if (!cursorItem.value && targetItem) {
      // Pick up all items
      cursorItem.value = { item: targetItem, count: targetCount }
      setSlot(null, 0)
    } else if (cursorItem.value && !targetItem) {
      // Place all items
      setSlot(cursorItem.value.item, cursorItem.value.count)
      cursorItem.value = null
    } else if (cursorItem.value && targetItem === cursorItem.value.item) {
      // Stack (up to 64)
      const canStack = 64 - targetCount
      const toAdd = Math.min(canStack, cursorItem.value.count)
      setSlot(targetItem, targetCount + toAdd)
      cursorItem.value.count -= toAdd
      if (cursorItem.value.count <= 0) cursorItem.value = null
    } else if (cursorItem.value && targetItem && targetItem !== cursorItem.value.item) {
      // Swap
      const oldItem = targetItem
      const oldCount = targetCount
      setSlot(cursorItem.value.item, cursorItem.value.count)
      cursorItem.value = { item: oldItem, count: oldCount }
    }
  } else if (button === 2) {
    // Right click
    if (!cursorItem.value && targetItem) {
      // Pick up half
      const half = Math.ceil(targetCount / 2)
      cursorItem.value = { item: targetItem, count: half }
      setSlot(targetItem, targetCount - half)
      if (targetCount - half <= 0) setSlot(null, 0)
    } else if (cursorItem.value && !targetItem) {
      // Place one item
      setSlot(cursorItem.value.item, 1)
      cursorItem.value.count--
      if (cursorItem.value.count <= 0) cursorItem.value = null
    } else if (cursorItem.value && targetItem === cursorItem.value.item && targetCount < 64) {
      // Add one to stack
      setSlot(targetItem, targetCount + 1)
      cursorItem.value.count--
      if (cursorItem.value.count <= 0) cursorItem.value = null
    } else if (cursorItem.value && targetItem && targetItem !== cursorItem.value.item) {
      // Swap (same as left click for right click)
      const oldItem = targetItem
      const oldCount = targetCount
      setSlot(cursorItem.value.item, cursorItem.value.count)
      cursorItem.value = { item: oldItem, count: oldCount }
    }
  }
}

function handleCraftResultClick() {
  if (!craftResult.value) return

  const { item, count } = craftResult.value

  if (!cursorItem.value) {
    cursorItem.value = { item, count }
  } else if (cursorItem.value.item === item) {
    const canStack = 64 - cursorItem.value.count
    if (canStack < count) return
    cursorItem.value.count += count
  } else {
    return
  }

  // Consume ingredients
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (craftGrid.value[r][c]) {
        craftGrid.value[r][c] = null
      }
    }
  }
}

function addToMainInventory(itemId: string, count: number): boolean {
  // First pass: stack with existing items
  for (const slot of inventoryStore.mainInventory) {
    if (slot.item === itemId && slot.count < 64) {
      const canAdd = 64 - slot.count
      const toAdd = Math.min(canAdd, count)
      slot.count += toAdd
      count -= toAdd
      if (count <= 0) return true
    }
  }
  // Second pass: use empty slots
  for (const slot of inventoryStore.mainInventory) {
    if (!slot.item) {
      slot.item = itemId
      slot.count = count
      slot.blockType = getBlockTypeForItem(itemId)
      return true
    }
  }
  return false
}

function addToHotbar(itemId: string, count: number): boolean {
  for (const slot of inventoryStore.hotbar) {
    if (slot.item === itemId && slot.count < 64) {
      const canAdd = 64 - slot.count
      const toAdd = Math.min(canAdd, count)
      slot.count += toAdd
      count -= toAdd
      if (count <= 0) return true
    }
  }
  for (const slot of inventoryStore.hotbar) {
    if (!slot.item) {
      slot.item = itemId
      slot.count = count
      slot.blockType = getBlockTypeForItem(itemId)
      return true
    }
  }
  return false
}

// Armor slot click handler
function handleArmorClick(index: number, button: number, e: MouseEvent) {
  e.stopPropagation()
  const slot = inventoryStore.armor[index]

  if (!cursorItem.value && slot.item) {
    // Pick up armor from slot
    cursorItem.value = { item: slot.item, count: 1 }
    slot.item = null
  } else if (cursorItem.value && !slot.item) {
    // Try to equip armor
    const armorTypes: Record<string, string[]> = {
      helmet: ['leather_helmet', 'chainmail_helmet', 'iron_helmet', 'golden_helmet', 'diamond_helmet', 'netherite_helmet'],
      chestplate: ['leather_chestplate', 'chainmail_chestplate', 'iron_chestplate', 'golden_chestplate', 'diamond_chestplate', 'netherite_chestplate'],
      leggings: ['leather_leggings', 'chainmail_leggings', 'iron_leggings', 'golden_leggings', 'diamond_leggings', 'netherite_leggings'],
      boots: ['leather_boots', 'chainmail_boots', 'iron_boots', 'golden_boots', 'diamond_boots', 'netherite_boots'],
    }

    const validItems = armorTypes[slot.slotType]
    if (validItems && validItems.includes(cursorItem.value.item)) {
      slot.item = cursorItem.value.item
      cursorItem.value.count--
      if (cursorItem.value.count <= 0) cursorItem.value = null
    }
  } else if (cursorItem.value && slot.item) {
    // Swap armor
    const oldItem = slot.item
    slot.item = cursorItem.value.item
    cursorItem.value = { item: oldItem, count: 1 }
  }
}

// Get armor slot icon
function getArmorIcon(slotType: string): string {
  const icons: Record<string, string> = {
    helmet: '⛑',
    chestplate: '🛡',
    leggings: '👖',
    boots: '👢',
  }
  return icons[slotType] || ''
}

// Block color helper
const blockColors: Record<string, string> = {
  // Basic
  oak_planks: '#BC9862', oak_log: '#6B5030', cobblestone: '#7A7A7A',
  dirt: '#8B5E3C', stone: '#808080', sand: '#E8D5A0', sandstone: '#E0CDA0',
  gravel: '#8A7A7A', clay: '#9DA4AE', glass: '#C8DCF0', obsidian: '#1A0A2A',
  grass_block: '#5D9B37', glowstone: '#FCDB8D', bookshelf: '#BC9862',
  // Stone variants
  granite: '#9B6B5A', polished_granite: '#A07060', diorite: '#C8C0B8',
  polished_diorite: '#D0C8C0', andesite: '#8A8A8A', polished_andesite: '#909090',
  smooth_stone: '#909090', mossy_cobblestone: '#6A8A6A',
  stone_bricks: '#808080', mossy_stone_bricks: '#708070', bricks: '#9B5B4B',
  // Wood variants
  spruce_log: '#3B2810', spruce_planks: '#6B5030',
  birch_log: '#D8D0C0', birch_planks: '#D8D0B0',
  jungle_log: '#6B5030', jungle_planks: '#A07050',
  acacia_log: '#5A5050', acacia_planks: '#B06030',
  dark_oak_log: '#3A2810', dark_oak_planks: '#4B3020',
  // Nether
  netherrack: '#8B3030', soul_sand: '#5B4030', basalt: '#4A4A50',
  blackstone: '#2A2A30', magma_block: '#8B3030', nether_bricks: '#2A1520',
  // End
  end_stone: '#D8D8A0', purpur_block: '#A070B0', end_stone_bricks: '#D8D8A0',
  crying_obsidian: '#2A1040',
  // Mineral blocks
  iron_block: '#D8D8D8', gold_block: '#FCDB4D', diamond_block: '#5DECF0',
  netherite_block: '#3A3238', copper_block: '#C07040', emerald_block: '#40C040',
  lapis_block: '#2040E0', redstone_block: '#E02020', quartz_block: '#E8E0D0',
  // Ice/snow
  ice: '#80B0E0', packed_ice: '#90C0E0', blue_ice: '#4080D0', snow_block: '#F0F0F0',
  // Plants
  cactus: '#30802A', pumpkin: '#D08020', melon: '#60A030', hay_bale: '#C0A040',
  bone_block: '#E0E0C0',
  // Prismarine
  prismarine: '#609080', prismarine_bricks: '#609080', dark_prismarine: '#304830',
  sea_lantern: '#A0D0D0',
  // Utility
  crafting_table: '#BC9862', furnace: '#808080', chest: '#A07030',
  anvil: '#4A4A4A', beacon: '#4060C0',
  // Materials
  stick: '#A08050', coal: '#2A2A2A', iron_ingot: '#D8D8D8', gold_ingot: '#FCDB4D',
  diamond: '#5DECF0', emerald: '#40C040', lapis_lazuli: '#2040E0',
  redstone: '#E02020', quartz: '#E8E0D0', netherite_ingot: '#3A3238',
  copper_ingot: '#C07040', string: '#E8E8E8',
  // Tools
  wooden_pickaxe: '#BC9862', stone_pickaxe: '#7A7A7A', iron_pickaxe: '#D8D8D8',
  gold_pickaxe: '#FCDB4D', diamond_pickaxe: '#5DECF0', netherite_pickaxe: '#3A3238',
  wooden_sword: '#BC9862', stone_sword: '#7A7A7A', iron_sword: '#D8D8D8',
  gold_sword: '#FCDB4D', diamond_sword: '#5DECF0', netherite_sword: '#3A3238',
  // Wool
  white_wool: '#E8E8E8', orange_wool: '#E08040', magenta_wool: '#B040C0',
  light_blue_wool: '#6090E0', yellow_wool: '#E0D040', lime_wool: '#60D040',
  pink_wool: '#E070A0', gray_wool: '#505050', light_gray_wool: '#A0A0A0',
  cyan_wool: '#3090A0', purple_wool: '#8040B0', blue_wool: '#3040B0',
  brown_wool: '#704020', green_wool: '#407020', red_wool: '#A03030', black_wool: '#1A1A1A',
}

function getSlotColor(itemId: string | null): string {
  if (!itemId) return 'transparent'
  return blockColors[itemId] || '#888'
}

function isBlockItem(itemId: string | null): boolean {
  return getBlockTypeForItem(itemId) !== undefined
}

function getInventoryIconStyle(itemId: string | null) {
  return getItemIconStyle(itemId)
}

function getSlotShortName(itemId: string | null): string {
  if (!itemId) return ''
  const def = ITEM_REGISTRY[itemId]
  return def ? def.name.substring(0, 4) : itemId.substring(0, 4)
}

function close() {
  // Return cursor item to inventory on close
  if (cursorItem.value) {
    if (!addToHotbar(cursorItem.value.item, cursorItem.value.count)) {
      addToMainInventory(cursorItem.value.item, cursorItem.value.count)
    }
    cursorItem.value = null
  }
  inventoryStore.showInventory = false
}

// E key to toggle
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'KeyE') {
    if (containerStore.active) return
    inventoryStore.showInventory = !inventoryStore.showInventory
    if (!inventoryStore.showInventory && cursorItem.value) {
      if (!addToHotbar(cursorItem.value.item, cursorItem.value.count)) {
        addToMainInventory(cursorItem.value.item, cursorItem.value.count)
      }
      cursorItem.value = null
    }
  }
  // Press Q to drop cursor item
  if (e.code === 'KeyQ' && cursorItem.value) {
    cursorItem.value = null
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('mousemove', onMouseMove)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('mousemove', onMouseMove)
})
</script>

<style scoped>
.inventory-screen {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  pointer-events: auto;
}

.inventory-container {
  background: #C6C6C6;
  border: 3px solid #555;
  padding: 20px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  min-width: 480px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  z-index: 101;
  pointer-events: auto;
}

.inventory-container h2 {
  text-align: center;
  margin-bottom: 15px;
  font-size: 16px;
}

.craft-area {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
}

.craft-grid {
  display: grid;
  grid-template-columns: repeat(3, 40px);
  gap: 2px;
}

.craft-arrow {
  font-size: 24px;
  color: #333;
}

.craft-result {
  width: 50px;
  height: 50px;
}

.armor-area {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.armor-label {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.armor-slots {
  display: flex;
  gap: 4px;
}

.armor-slot {
  width: 40px;
  height: 40px;
  background: #8B8B8B;
  border: 2px solid;
  border-color: #555 #FFF #FFF #555;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.armor-slot.helmet { border-color: #AA5555 #FFAAAA #FFAAAA #AA5555; }
.armor-slot.chestplate { border-color: #55AA55 #AAFFAA #AAFFAA #55AA55; }
.armor-slot.leggings { border-color: #5555AA #AAAAFF #AAAAFF #5555AA; }
.armor-slot.boots { border-color: #AAAA55 #FFFFAA #FFFFAA #AAAA55; }

.armor-icon {
  font-size: 20px;
  opacity: 0.3;
}

.armor-defense {
  font-size: 12px;
  color: #2a6;
  font-weight: bold;
  margin-left: 10px;
}

.inv-slot, .craft-slot {
  width: 40px;
  height: 40px;
  background: #8B8B8B;
  border: 2px solid;
  border-color: #555 #FFF #FFF #555;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.inv-slot.active {
  border-color: #FFF #555 #555 #FFF;
}

.main-inventory {
  display: grid;
  grid-template-columns: repeat(9, 40px);
  gap: 2px;
  margin-bottom: 10px;
}

.creative-catalog {
  margin-bottom: 12px;
}

.creative-label {
  color: #333;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 6px;
}

.creative-catalog {
  margin-top: 10px;
  position: relative;
  z-index: 102;
}

.creative-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 7px;
}

.creative-tab {
  padding: 6px 12px;
  border: 2px solid;
  border-color: #eee #555 #555 #eee;
  background: #999;
  color: #222;
  cursor: pointer;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  position: relative;
  user-select: none;
  outline: none;
}

.creative-tab:hover {
  background: #b0b0b0;
}

.creative-tab.active {
  background: #d4d4d4;
  border-color: #555 #eee #eee #555;
  color: #000;
}

.creative-label {
  font-size: 12px;
  color: #444;
  margin-bottom: 4px;
}

.creative-grid {
  display: grid;
  grid-template-columns: repeat(6, 72px);
  gap: 3px;
  max-height: min(50vh, 330px);
  overflow-y: auto;
  padding: 3px;
  background: #777;
  border: 2px solid;
  border-color: #555 #eee #eee #555;
  position: relative;
}

.creative-slot {
  width: 72px;
  min-height: 62px;
  padding: 4px 2px 3px;
  border: 2px solid;
  border-color: #555 #fff #fff #555;
  background: #8b8b8b;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.creative-slot:hover {
  background: #9b9b9b;
  border-color: #fff #555 #555 #fff;
}

.creative-item-name {
  display: block;
  width: 100%;
  margin-top: 2px;
  color: #181818;
  font-size: 10px;
  line-height: 12px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.creative-slot:hover {
  background: #aaa;
  border-color: #fff #555 #555 #fff;
}

.hotbar-section {
  display: grid;
  grid-template-columns: repeat(9, 40px);
  gap: 2px;
  border-top: 2px solid #555;
  padding-top: 10px;
}

.item {
  width: 32px;
  height: 32px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  color: white;
  text-shadow: 1px 1px 0 #000;
  position: relative;
  pointer-events: none;
}

.item.result {
  width: 40px;
  height: 40px;
}

.count {
  position: absolute;
  bottom: 0;
  right: 2px;
  font-size: 10px;
  font-weight: bold;
}

/* Cursor item that follows the mouse */
.cursor-item {
  position: fixed;
  width: 32px;
  height: 32px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  color: white;
  text-shadow: 1px 1px 0 #000;
  pointer-events: none;
  z-index: 100;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(255, 255, 255, 0.5);
}
</style>
