<template>
  <div
    v-if="containerStore.active"
    class="container-screen"
    @click.self="close"
    @contextmenu.prevent
  >
    <div class="container-panel">
      <div class="title-row">
        <h2>{{ containerStore.active.title }}</h2>
        <button class="close-button" @click="close">×</button>
      </div>

      <div class="section-label">容器</div>
      <div class="slot-grid container-grid">
        <button
          v-for="(slot, index) in containerStore.activeSlots"
          :key="'container-' + index"
          class="slot"
          @click.left="handleSlot('container', index, 0, $event)"
          @click.right="handleSlot('container', index, 2, $event)"
          @touchstart.prevent="onSlotTouchStart($event, 'container', index)"
          @touchend="onSlotTouchEnd($event)"
          @touchcancel="onSlotTouchCancel()"
        >
          <span v-if="slot.item" class="item" :style="iconStyle(slot.item, slot.blockType)">
            <span v-if="slot.blockType === undefined" class="item-label">{{ shortName(slot.item) }}</span>
            <span v-if="slot.count > 1" class="count">{{ slot.count }}</span>
          </span>
        </button>
      </div>

      <div class="section-label player-label">玩家背包</div>
      <div class="slot-grid">
        <button
          v-for="(slot, index) in inventoryStore.mainInventory"
          :key="'main-' + index"
          class="slot"
          @click.left="handleSlot('main', index, 0, $event)"
          @click.right="handleSlot('main', index, 2, $event)"
          @touchstart.prevent="onSlotTouchStart($event, 'main', index)"
          @touchend="onSlotTouchEnd($event)"
          @touchcancel="onSlotTouchCancel()"
        >
          <span v-if="slot.item" class="item" :style="iconStyle(slot.item, slot.blockType)">
            <span v-if="slot.blockType === undefined" class="item-label">{{ shortName(slot.item) }}</span>
            <span v-if="slot.count > 1" class="count">{{ slot.count }}</span>
          </span>
        </button>
      </div>

      <div class="slot-grid hotbar-grid">
        <button
          v-for="(slot, index) in inventoryStore.hotbar"
          :key="'hotbar-' + index"
          class="slot"
          :class="{ selected: index === inventoryStore.selectedSlot }"
          @click.left="handleSlot('hotbar', index, 0, $event)"
          @click.right="handleSlot('hotbar', index, 2, $event)"
          @touchstart.prevent="onSlotTouchStart($event, 'hotbar', index)"
          @touchend="onSlotTouchEnd($event)"
          @touchcancel="onSlotTouchCancel()"
        >
          <span v-if="slot.item" class="item" :style="iconStyle(slot.item, slot.blockType)">
            <span v-if="slot.blockType === undefined" class="item-label">{{ shortName(slot.item) }}</span>
            <span v-if="slot.count > 1" class="count">{{ slot.count }}</span>
          </span>
        </button>
      </div>
      <p class="hint">Shift + 点击可在容器和背包之间快速移动</p>
    </div>

    <div
      v-if="cursorItem"
      class="cursor-item"
      :style="[iconStyle(cursorItem.item, cursorItem.blockType), { left: cursorX + 'px', top: cursorY + 'px' }]"
    >
      <span v-if="cursorItem.blockType === undefined" class="item-label">{{ shortName(cursorItem.item) }}</span>
      <span v-if="cursorItem.count > 1" class="count">{{ cursorItem.count }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useContainerStore } from '@/ui/stores/containerStore'
import { useInventoryStore, type InventorySlot } from '@/ui/stores/inventoryStore'
import { usePlayerStore } from '@/ui/stores/playerStore'
import { getBlockTypeForItem, type BlockType } from '@/types/blocks'
import { ITEM_REGISTRY } from '@/types/items'
import { getItemIconStyle } from '@/ui/itemIcon'

type SlotSection = 'container' | 'main' | 'hotbar'
type HeldItem = { item: string; count: number; blockType?: BlockType }

const containerStore = useContainerStore()
const inventoryStore = useInventoryStore()
const playerStore = usePlayerStore()
const cursorItem = ref<HeldItem | null>(null)
const cursorX = ref(0)
const cursorY = ref(0)

const iconStyle = (item: string, blockType?: BlockType) => getItemIconStyle(item, blockType)
const shortName = (item: string) => ITEM_REGISTRY[item]?.name.substring(0, 4) ?? item.substring(0, 4)
const maxStack = (item: string) => ITEM_REGISTRY[item]?.stackSize ?? 64

// ── Touch device detection & long-press for right-click ──
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let longPressInfo: { section: SlotSection; index: number; event: MouseEvent } | null = null

function onSlotTouchStart(e: TouchEvent, section: SlotSection, index: number) {
  if (!isTouchDevice) return
  e.preventDefault()
  longPressInfo = { section, index, event: e as unknown as MouseEvent }
  longPressTimer = setTimeout(() => {
    if (longPressInfo) {
      handleSlot(longPressInfo.section, longPressInfo.index, 2, longPressInfo.event)
      longPressInfo = null
      longPressTimer = null
      if (navigator.vibrate) navigator.vibrate(20)
    }
  }, 500)
}

function onSlotTouchEnd(_e: TouchEvent) {
  if (!isTouchDevice || !longPressTimer || !longPressInfo) return
  clearTimeout(longPressTimer)
  longPressTimer = null
  handleSlot(longPressInfo.section, longPressInfo.index, 0, longPressInfo.event)
  longPressInfo = null
}

function onSlotTouchCancel() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
    longPressInfo = null
  }
}

function getSlots(section: SlotSection): InventorySlot[] {
  if (section === 'container') return containerStore.activeSlots
  if (section === 'main') return inventoryStore.mainInventory
  return inventoryStore.hotbar
}

function writeSlot(slot: InventorySlot, item: string | null, count: number, blockType?: BlockType): void {
  slot.item = item
  slot.count = item ? count : 0
  slot.blockType = item ? (blockType ?? getBlockTypeForItem(item)) : undefined
}

function moveInto(item: HeldItem, slots: InventorySlot[]): number {
  let remaining = item.count
  const limit = maxStack(item.item)

  for (const slot of slots) {
    if (slot.item !== item.item || slot.count >= limit) continue
    const moved = Math.min(remaining, limit - slot.count)
    slot.count += moved
    remaining -= moved
    if (remaining === 0) return 0
  }

  for (const slot of slots) {
    if (slot.item) continue
    const moved = Math.min(remaining, limit)
    writeSlot(slot, item.item, moved, item.blockType)
    remaining -= moved
    if (remaining === 0) return 0
  }
  return remaining
}

function handleSlot(section: SlotSection, index: number, button: number, event: MouseEvent): void {
  event.stopPropagation()
  const slots = getSlots(section)
  const slot = slots[index]
  if (!slot) return

  if (event.shiftKey && !cursorItem.value && slot.item) {
    const targetSlots = section === 'container'
      ? [...inventoryStore.mainInventory, ...inventoryStore.hotbar]
      : containerStore.activeSlots
    const remaining = moveInto({ item: slot.item, count: slot.count, blockType: slot.blockType }, targetSlots)
    if (remaining === 0) writeSlot(slot, null, 0)
    else slot.count = remaining
    return
  }

  if (button === 0) {
    if (!cursorItem.value && slot.item) {
      cursorItem.value = { item: slot.item, count: slot.count, blockType: slot.blockType }
      writeSlot(slot, null, 0)
    } else if (cursorItem.value && !slot.item) {
      writeSlot(slot, cursorItem.value.item, cursorItem.value.count, cursorItem.value.blockType)
      cursorItem.value = null
    } else if (cursorItem.value && slot.item === cursorItem.value.item) {
      const moved = Math.min(cursorItem.value.count, maxStack(slot.item) - slot.count)
      slot.count += moved
      cursorItem.value.count -= moved
      if (cursorItem.value.count === 0) cursorItem.value = null
    } else if (cursorItem.value && slot.item) {
      const previous = { item: slot.item, count: slot.count, blockType: slot.blockType }
      writeSlot(slot, cursorItem.value.item, cursorItem.value.count, cursorItem.value.blockType)
      cursorItem.value = previous
    }
    return
  }

  if (!cursorItem.value && slot.item) {
    const amount = Math.ceil(slot.count / 2)
    cursorItem.value = { item: slot.item, count: amount, blockType: slot.blockType }
    const remaining = slot.count - amount
    if (remaining === 0) writeSlot(slot, null, 0)
    else slot.count = remaining
  } else if (cursorItem.value && !slot.item) {
    writeSlot(slot, cursorItem.value.item, 1, cursorItem.value.blockType)
    cursorItem.value.count--
    if (cursorItem.value.count === 0) cursorItem.value = null
  } else if (cursorItem.value && slot.item === cursorItem.value.item && slot.count < maxStack(slot.item)) {
    slot.count++
    cursorItem.value.count--
    if (cursorItem.value.count === 0) cursorItem.value = null
  }
}

function close(): void {
  if (cursorItem.value) {
    let remaining = moveInto(cursorItem.value, [...inventoryStore.hotbar, ...inventoryStore.mainInventory])
    if (remaining > 0) {
      remaining = moveInto({ ...cursorItem.value, count: remaining }, containerStore.activeSlots)
    }
    if (remaining > 0) return
    cursorItem.value = null
  }
  containerStore.closeContainer()
}

const onMouseMove = (event: MouseEvent) => {
  cursorX.value = event.clientX
  cursorY.value = event.clientY
}
const onKeyDown = (event: KeyboardEvent) => {
  if (containerStore.active && (event.code === 'KeyE' || event.code === 'Escape')) close()
}

watch(() => playerStore.isDead, dead => {
  if (dead && containerStore.active) close()
})

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('keydown', onKeyDown)
})
onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.container-screen {
  position: absolute;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
}
.container-panel {
  width: 420px;
  max-height: 94vh;
  overflow-y: auto;
  padding: 16px;
  background: #c6c6c6;
  border: 3px solid;
  border-color: #f2f2f2 #555 #555 #f2f2f2;
  font-family: 'Courier New', monospace;
  touch-action: manipulation;
  -webkit-overflow-scrolling: touch;
}
.title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
h2 { color: #333; font-size: 17px; }
.close-button { width: 28px; height: 28px; font-size: 20px; cursor: pointer; }
.section-label { margin: 7px 0 5px; color: #333; font-size: 12px; font-weight: bold; }
.player-label { margin-top: 14px; border-top: 2px solid #888; padding-top: 10px; }
.slot-grid { display: grid; grid-template-columns: repeat(9, 40px); gap: 2px; }
.hotbar-grid { margin-top: 9px; padding-top: 8px; border-top: 2px solid #777; }
.slot {
  width: 40px; height: 40px; padding: 0;
  background: #8b8b8b;
  border: 2px solid;
  border-color: #555 #fff #fff #555;
  display: flex; align-items: center; justify-content: center;
  position: relative; cursor: pointer;
}
.slot:hover, .slot.selected { border-color: #fff #555 #555 #fff; background: #aaa; }
.item, .cursor-item {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  position: relative; image-rendering: pixelated;
  color: white; font-size: 9px; text-shadow: 1px 1px #000;
}
.count { position: absolute; right: 1px; bottom: 0; font-weight: bold; font-size: 10px; }
.item-label { pointer-events: none; }
.hint { margin: 10px 0 0; color: #555; text-align: center; font-size: 10px; }
.cursor-item {
  position: fixed; z-index: 100;
  transform: translate(-50%, -50%);
  pointer-events: none;
  border: 2px solid rgba(255,255,255,.6);
}
</style>
