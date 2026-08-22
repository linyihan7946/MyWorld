<template>
  <div
    v-if="inventoryStore.showInventory"
    class="inventory-screen"
    @click.self="close"
    @contextmenu.prevent
  >
    <div class="inventory-container">
      <h2>{{ craftingTitle }}</h2>

      <!-- Crafting area (2×2 in inventory, 3×3 at crafting table) -->
      <div v-if="playerStore.gameMode === 'survival'" class="craft-area">
        <div class="craft-grid" :class="'craft-' + craftSize + 'x' + craftSize">
          <div
            v-for="i in (craftSize * craftSize)"
            :key="'craft-' + i"
            class="craft-slot"
            @click.left="handleSlotClick('craft', i - 1, 0, $event)"
            @click.right="handleSlotClick('craft', i - 1, 2, $event)"
            @touchstart.prevent="onSlotTouchStart($event, 'craft', i - 1)"
            @touchend="onSlotTouchEnd($event)"
            @touchcancel="onSlotTouchCancel()"
          >
            <div
              v-if="craftGrid[Math.floor((i-1)/craftSize)][(i-1)%craftSize]"
              class="item"
              :style="getInventoryIconStyle(craftGrid[Math.floor((i-1)/craftSize)][(i-1)%craftSize])"
            >
              <span
                v-if="getCraftSlotCount(Math.floor((i-1)/craftSize), (i-1)%craftSize) > 1"
                class="count"
              >{{ getCraftSlotCount(Math.floor((i-1)/craftSize), (i-1)%craftSize) }}</span>
            </div>
          </div>
        </div>
        <div class="craft-arrow">→</div>
        <div class="craft-result" @click.left="handleCraftResultClick" @touchstart.prevent="onCraftResultTouchStart($event)" @touchend="onCraftResultTouchEnd($event)">
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
            @touchstart.prevent="onArmorTouchStart($event, idx)"
            @touchend="onArmorTouchEnd($event)"
            @touchcancel="onSlotTouchCancel()"
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
            :class="{
              active: creativeCategory === category.id,
              locked: category.id === 'command' && !playerStore.canUseCommandBlocks
            }"
            @click.stop="switchCreativeCategory(category.id)"
          >
            {{ category.name }}
            <span v-if="category.id === 'command' && !playerStore.canUseCommandBlocks">🔒</span>
            <span v-else>({{ categoryCounts[category.id] || 0 }})</span>
          </button>
        </div>
        <div class="creative-label">
          {{ activeCreativeCategoryName }}（{{ creativeItems.length }}）
          <span v-if="creativeCategory === 'command' && !playerStore.canUseCommandBlocks" class="cheat-warning">
            ⚠️ 需要创造模式 + 按F键开启作弊才能获取指令方块
          </span>
        </div>
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
          @touchstart.prevent="onSlotTouchStart($event, 'main', i - 1)"
          @touchend="onSlotTouchEnd($event)"
          @touchcancel="onSlotTouchCancel()"
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
          @touchstart.prevent="onSlotTouchStart($event, 'hotbar', i - 1)"
          @touchend="onSlotTouchEnd($event)"
          @touchcancel="onSlotTouchCancel()"
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

    <!-- Anvil naming UI -->
    <div v-if="uiStore.showAnvil" class="anvil-overlay" @click.self="uiStore.closeAll()">
      <div class="anvil-box">
        <div class="anvil-title">🔨 铁砧 — 重命名物品</div>
        <div class="anvil-slot" @click.left="handleAnvilSlotClick">
          <div v-if="anvilItem" class="item" :style="getInventoryIconStyle(anvilItem)">{{ getSlotShortName(anvilItem) }}</div>
          <div v-else class="anvil-placeholder">拖放物品</div>
        </div>
        <input
          v-model="anvilName"
          class="anvil-input"
          placeholder="输入新名称..."
          maxlength="35"
          @keydown.enter="doAnvilRename"
        />
        <div class="anvil-cost" v-if="anvilItem">费用: {{ anvilCost }} 级经验</div>
        <div class="anvil-buttons">
          <button class="anvil-btn" :disabled="!anvilItem || !anvilName" @click="doAnvilRename">✅ 命名</button>
          <button class="anvil-btn cancel" @click="uiStore.closeAll()">✖ 关闭</button>
        </div>
      </div>
    </div>

    <!-- Cursor item — Teleport to body to always render on top -->
    <Teleport to="body">
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
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useInventoryStore } from '@/ui/stores/inventoryStore'
import { usePlayerStore } from '@/ui/stores/playerStore'
import { useUIStore } from '@/ui/stores/uiStore'
import { CraftingSystem } from '@/gameplay/CraftingSystem'
import { ITEM_REGISTRY } from '@/types/items'
import { BLOCK_REGISTRY, BlockType, getBlockTypeForItem } from '@/types/blocks'
import { getItemIconStyle } from '@/ui/itemIcon'
import { useContainerStore } from '@/ui/stores/containerStore'
import { playerStats, spendLevels } from '@/gameplay/PlayerStats'

// ── Touch device detection ──
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches

// ── Long-press timer for right-click simulation on mobile ──
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let longPressSlotType = ''
let longPressSlotIndex = 0
let longPressEvent: MouseEvent | null = null

function onSlotTouchStart(e: TouchEvent, type: string, index: number) {
  if (!isTouchDevice) return
  e.preventDefault()
  longPressSlotType = type
  longPressSlotIndex = index
  longPressEvent = e as unknown as MouseEvent
  longPressTimer = setTimeout(() => {
    // Long press → right-click
    handleSlotClick(longPressSlotType as any, longPressSlotIndex, 2, longPressEvent!)
    longPressTimer = null
    // Vibrate briefly if supported
    if (navigator.vibrate) navigator.vibrate(20)
  }, 500)
}

function onSlotTouchEnd(e: TouchEvent) {
  if (!isTouchDevice || !longPressTimer) return
  // Short tap → left-click
  clearTimeout(longPressTimer)
  longPressTimer = null
  handleSlotClick(longPressSlotType as any, longPressSlotIndex, 0, longPressEvent!)
}

function onSlotTouchCancel() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function onArmorTouchStart(e: TouchEvent, index: number) {
  if (!isTouchDevice) return
  e.preventDefault()
  longPressSlotType = 'armor'
  longPressSlotIndex = index
  longPressEvent = e as unknown as MouseEvent
  longPressTimer = setTimeout(() => {
    handleArmorClick(longPressSlotIndex, 2, longPressEvent!)
    longPressTimer = null
    if (navigator.vibrate) navigator.vibrate(20)
  }, 500)
}

function onArmorTouchEnd(_e: TouchEvent) {
  if (!isTouchDevice || !longPressTimer) return
  clearTimeout(longPressTimer)
  longPressTimer = null
  handleArmorClick(longPressSlotIndex, 0, longPressEvent!)
}

function onCraftResultTouchStart(e: TouchEvent) {
  if (!isTouchDevice) return
  e.preventDefault()
  longPressTimer = setTimeout(() => {
    // Long press craft result → craft all possible (same as normal click)
    handleCraftResultClick()
    longPressTimer = null
  }, 300)
}

function onCraftResultTouchEnd(_e: TouchEvent) {
  if (!isTouchDevice || !longPressTimer) return
  clearTimeout(longPressTimer)
  longPressTimer = null
  handleCraftResultClick()
}

const inventoryStore = useInventoryStore()
const playerStore = usePlayerStore()
const uiStore = useUIStore()
const containerStore = useContainerStore()
const craftingSystem = new CraftingSystem()

const craftSize = computed(() => uiStore.showCrafting ? 3 : 2)
const craftingTitle = computed(() => {
  if (playerStore.gameMode === 'creative') return '创造物品栏'
  return uiStore.showCrafting ? '工作台' : '背包'
})

type CreativeCategory = 'blocks' | 'redstone' | 'tools' | 'combat' | 'armor' | 'items' | 'command'
interface CreativeEntry { item: string; name: string; blockType?: BlockType; stackSize: number; category: CreativeCategory; enchantments?: Record<string, number> }

const creativeCategory = ref<CreativeCategory>('blocks')
const creativeCategories: Array<{ id: CreativeCategory; name: string }> = [
  { id: 'blocks', name: '方块' }, { id: 'redstone', name: '红石' },
  { id: 'tools', name: '工具' }, { id: 'combat', name: '战斗' },
  { id: 'armor', name: '盔甲' }, { id: 'items', name: '物品' },
  { id: 'command', name: '⚡ 指令' },
]
const redstoneItems = new Set(['redstone_block', 'redstone_dust', 'piston', 'sticky_piston', 'repeater', 'comparator', 'observer', 'hopper', 'lever', 'redstone_torch', 'oak_button', 'stone_button', 'oak_pressure_plate', 'stone_pressure_plate', 'light_weighted_pressure_plate', 'heavy_weighted_pressure_plate'])
const commandItems = new Set([
  'command_block', 'chain_command_block', 'repeat_command_block',
  'barrier', 'structure_block', 'jigsaw_block', 'light_block', 'structure_void',
  'debug_stick',
])

const allCreativeItems = computed<CreativeEntry[]>(() => {
  const entries: CreativeEntry[] = Object.values(BLOCK_REGISTRY)
    .filter(definition => definition.id !== BlockType.AIR && definition.id !== BlockType.PISTON_HEAD)
    .sort((a, b) => a.id - b.id)
    .map(definition => {
      const item = String(BlockType[definition.id]).toLowerCase()
      let category: CreativeCategory = redstoneItems.has(item) ? 'redstone' : 'blocks'
      if (commandItems.has(item)) category = 'command'
      return { item, name: definition.name, blockType: definition.id, stackSize: 64, category }
    })
  const knownBlocks = new Set(entries.map(entry => entry.item))
  for (const definition of Object.values(ITEM_REGISTRY)) {
    if (knownBlocks.has(definition.id)) continue
    let category: CreativeCategory = 'items'
    if (redstoneItems.has(definition.id)) category = 'redstone'
    else if (commandItems.has(definition.id)) category = 'command'
    else if (definition.type === 'tool') category = 'tools'
    else if (definition.type === 'weapon') category = 'combat'
    else if (definition.type === 'armor') category = 'armor'
    entries.push({ item: definition.id, name: definition.name, stackSize: definition.stackSize, category })
  }

  // 附魔书变体
  const enchantedBooks: Array<{ name: string; enchants: Record<string, number> }> = [
    { name: '附魔书 (保护 IV)', enchants: { protection: 4 } },
    { name: '附魔书 (火焰保护 IV)', enchants: { fire_protection: 4 } },
    { name: '附魔书 (爆炸保护 IV)', enchants: { blast_protection: 4 } },
    { name: '附魔书 (弹射物保护 IV)', enchants: { projectile_protection: 4 } },
    { name: '附魔书 (锋利 V)', enchants: { sharpness: 5 } },
    { name: '附魔书 (亡灵杀手 V)', enchants: { smite: 5 } },
    { name: '附魔书 (节肢杀手 V)', enchants: { bane_of_arthropods: 5 } },
    { name: '附魔书 (效率 V)', enchants: { efficiency: 5 } },
    { name: '附魔书 (时运 III)', enchants: { fortune: 3 } },
    { name: '附魔书 (精准采集)', enchants: { silk_touch: 1 } },
    { name: '附魔书 (耐久 III)', enchants: { unbreaking: 3 } },
    { name: '附魔书 (经验修补)', enchants: { mending: 1 } },
    { name: '附魔书 (力量 V)', enchants: { power: 5 } },
    { name: '附魔书 (冲击 II)', enchants: { punch: 2 } },
    { name: '附魔书 (火焰)', enchants: { flame: 1 } },
    { name: '附魔书 (无限)', enchants: { infinity: 1 } },
    { name: '附魔书 (海之眷顾 III)', enchants: { luck_of_the_sea: 3 } },
    { name: '附魔书 (饵钓 III)', enchants: { lure: 3 } },
    { name: '附魔书 (忠诚 III)', enchants: { loyalty: 3 } },
    { name: '附魔书 (激流 III)', enchants: { riptide: 3 } },
    { name: '附魔书 (引雷)', enchants: { channeling: 1 } },
    { name: '附魔书 (穿刺 V)', enchants: { impaling: 5 } },
  ]
  for (const book of enchantedBooks) {
    entries.push({ item: 'enchanted_book', name: book.name, stackSize: 1, category: 'items', enchantments: book.enchants })
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
  let filtered = allCreativeItems.value.filter(entry => entry.category === creativeCategory.value)
  // 指令专属物品需要作弊开启才显示
  if (!playerStore.canUseCommandBlocks && creativeCategory.value === 'command') {
    filtered = []
  }
  return filtered
})
const activeCreativeCategoryName = computed(() => creativeCategories.find(category => category.id === creativeCategory.value)?.name ?? '')

function selectCreativeItem(entry: CreativeEntry): void {
  inventoryStore.hotbar[inventoryStore.selectedSlot] = {
    item: entry.item, count: entry.stackSize,
    ...(entry.blockType === undefined ? {} : { blockType: entry.blockType }),
    ...(entry.enchantments ? { enchantments: { ...entry.enchantments } } : {}),
  }
}

// Craft grid: 动态大小 (2×2 或 3×3)
const craftGrid = ref<(string | null)[][]>([
  [null, null, null],
  [null, null, null],
  [null, null, null],
])

// 监听 craftSize 变化，重置合成格
watch(craftSize, () => {
  craftGrid.value = Array.from({ length: craftSize.value }, () => Array(craftSize.value).fill(null))
  craftResult.value = null
})

const craftResult = ref<{ item: string; count: number } | null>(null)

// Cursor item: the item currently held by the mouse cursor
const cursorItem = ref<{ item: string; count: number } | null>(null)
const cursorX = ref(0)
const cursorY = ref(0)

// Anvil state
const anvilItem = ref<string | null>(null)
const anvilName = ref('')
const anvilCost = computed(() => anvilItem.value ? 1 : 0)

function handleAnvilSlotClick() {
  if (!cursorItem.value && anvilItem.value) {
    cursorItem.value = { item: anvilItem.value, count: 1 }
    anvilItem.value = null
  } else if (cursorItem.value && !anvilItem.value) {
    anvilItem.value = cursorItem.value.item
    anvilName.value = ''
    cursorItem.value.count--
    if (cursorItem.value.count <= 0) cursorItem.value = null
  } else if (cursorItem.value && anvilItem.value) {
    const old = anvilItem.value
    anvilItem.value = cursorItem.value.item
    anvilName.value = ''
    cursorItem.value = { item: old, count: 1 }
  }
}

function doAnvilRename() {
  if (!anvilItem.value || !anvilName.value.trim()) return
  if (playerStats.experienceLevel < anvilCost.value) return
  spendLevels(anvilCost.value)
  const inv = useInventoryStore()
  for (const slot of [...inv.hotbar, ...inv.mainInventory]) {
    if (slot.item === anvilItem.value) {
      slot.item = anvilName.value.trim()
      break
    }
  }
  anvilItem.value = null
  anvilName.value = ''
  uiStore.closeAll()
}

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
    const row = Math.floor(index / craftSize.value)
    const col = index % craftSize.value
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
  for (let r = 0; r < craftSize.value; r++) {
    for (let c = 0; c < craftSize.value; c++) {
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

  // 右键：快速交换（不验证类型）
  if (button === 2) {
    if (!cursorItem.value && slot.item) {
      cursorItem.value = { item: slot.item, count: 1 }
      slot.item = null
    } else if (cursorItem.value && !slot.item) {
      slot.item = cursorItem.value.item
      cursorItem.value.count--
      if (cursorItem.value.count <= 0) cursorItem.value = null
    } else if (cursorItem.value && slot.item) {
      const oldItem = slot.item
      slot.item = cursorItem.value.item
      cursorItem.value = { item: oldItem, count: 1 }
    }
    return
  }

  // 左键
  if (!cursorItem.value && slot.item) {
    // Pick up armor from slot
    cursorItem.value = { item: slot.item, count: 1 }
    slot.item = null
  } else if (cursorItem.value && !slot.item) {
    // Try to equip armor
    const armorTypes: Record<string, string[]> = {
      helmet: ['leather_helmet', 'chainmail_helmet', 'iron_helmet', 'golden_helmet', 'diamond_helmet', 'netherite_helmet', 'steel_helmet', 'copper_helmet'],
      chestplate: ['leather_chestplate', 'chainmail_chestplate', 'iron_chestplate', 'golden_chestplate', 'diamond_chestplate', 'netherite_chestplate', 'steel_chestplate', 'copper_chestplate'],
      leggings: ['leather_leggings', 'chainmail_leggings', 'iron_leggings', 'golden_leggings', 'diamond_leggings', 'netherite_leggings', 'steel_leggings', 'copper_leggings'],
      boots: ['leather_boots', 'chainmail_boots', 'iron_boots', 'golden_boots', 'diamond_boots', 'netherite_boots', 'steel_boots', 'copper_boots'],
    }

    const validItems = armorTypes[slot.slotType]
    if (validItems && validItems.includes(cursorItem.value.item)) {
      slot.item = cursorItem.value.item
      cursorItem.value.count--
      if (cursorItem.value.count <= 0) cursorItem.value = null
    }
  } else if (cursorItem.value && slot.item) {
    // Swap armor (only if the new item is valid for this slot type)
    const armorTypes: Record<string, string[]> = {
      helmet: ['leather_helmet', 'chainmail_helmet', 'iron_helmet', 'golden_helmet', 'diamond_helmet', 'netherite_helmet', 'steel_helmet', 'copper_helmet'],
      chestplate: ['leather_chestplate', 'chainmail_chestplate', 'iron_chestplate', 'golden_chestplate', 'diamond_chestplate', 'netherite_chestplate', 'steel_chestplate', 'copper_chestplate'],
      leggings: ['leather_leggings', 'chainmail_leggings', 'iron_leggings', 'golden_leggings', 'diamond_leggings', 'netherite_leggings', 'steel_leggings', 'copper_leggings'],
      boots: ['leather_boots', 'chainmail_boots', 'iron_boots', 'golden_boots', 'diamond_boots', 'netherite_boots', 'steel_boots', 'copper_boots'],
    }
    const validItems = armorTypes[slot.slotType]
    if (validItems && validItems.includes(cursorItem.value.item)) {
      const oldItem = slot.item
      slot.item = cursorItem.value.item
      cursorItem.value = { item: oldItem, count: 1 }
    }
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
  if (cursorItem.value) {
    if (!addToHotbar(cursorItem.value.item, cursorItem.value.count)) {
      addToMainInventory(cursorItem.value.item, cursorItem.value.count)
    }
    cursorItem.value = null
  }
  inventoryStore.showInventory = false
  uiStore.closeAll()
}

// E key to toggle
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'KeyE') {
    if (containerStore.active) return
    const willClose = inventoryStore.showInventory
    inventoryStore.showInventory = !inventoryStore.showInventory
    if (willClose) {
      if (cursorItem.value) {
        if (!addToHotbar(cursorItem.value.item, cursorItem.value.count)) {
          addToMainInventory(cursorItem.value.item, cursorItem.value.count)
        }
        cursorItem.value = null
      }
      uiStore.closeAll()
    }
  }
  // Press Q to drop cursor item into the world
  if (e.code === 'KeyQ' && cursorItem.value) {
    inventoryStore.pendingDrop = {
      item: cursorItem.value.item,
      count: cursorItem.value.count,
      blockType: getBlockTypeForItem(cursorItem.value.item),
    }
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
  touch-action: manipulation;
  -webkit-overflow-scrolling: touch;
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
  gap: 2px;
}
.craft-grid.craft-2x2 {
  grid-template-columns: repeat(2, 40px);
}
.craft-grid.craft-3x3 {
  grid-template-columns: repeat(3, 40px);
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

.creative-tab.locked {
  background: #666;
  color: #999;
  border-color: #555 #444 #444 #555;
  opacity: 0.6;
}

.creative-tab.locked:hover {
  background: #777;
}

.cheat-warning {
  display: inline-block;
  margin-left: 10px;
  padding: 3px 8px;
  background: rgba(244, 67, 54, 0.2);
  border: 1px solid #f44336;
  border-radius: 3px;
  color: #f44336;
  font-size: 11px;
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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

/* Cursor item — teleported to body, always on top */
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
  z-index: 99999;
  margin-left: -16px;
  margin-top: -16px;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

/* Anvil UI */
.anvil-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;
  z-index: 200;
}
.anvil-box {
  background: #c6c6c6; border: 3px solid #555; padding: 20px; border-radius: 4px;
  display: flex; flex-direction: column; align-items: center; gap: 12px; min-width: 280px;
}
.anvil-title { font-size: 18px; font-weight: bold; }
.anvil-slot { width: 50px; height: 50px; background: #8b8b8b; border: 2px solid; border-color: #555 #fff #fff #555; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.anvil-placeholder { font-size: 10px; color: #666; }
.anvil-input { width: 200px; padding: 6px 10px; font-family: monospace; font-size: 14px; border: 2px solid #555; outline: none; }
.anvil-input:focus { border-color: #7ab05c; }
.anvil-cost { font-size: 12px; color: #2a8a2a; }
.anvil-buttons { display: flex; gap: 10px; }
.anvil-btn { padding: 8px 20px; font-family: monospace; font-size: 14px; border: 2px solid #555; background: #999; cursor: pointer; }
.anvil-btn:hover { background: #b0b0b0; }
.anvil-btn:disabled { opacity: 0.4; cursor: default; }
.anvil-btn.cancel { background: #c66; }
.anvil-btn.cancel:hover { background: #d88; }
</style>
