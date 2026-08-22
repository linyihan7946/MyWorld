<template>
  <div v-if="furnaceStore.activeData" class="furnace-screen" @click.self="close" @contextmenu.prevent>
    <div class="furnace-box">
      <div class="furnace-header">
        <h2>{{ furnaceStore.title }}</h2>
        <button class="close-button" @click="close">×</button>
      </div>

      <div class="furnace-body">
        <!-- 左侧: 输入 + 燃料 -->
        <div class="furnace-column">
          <div
            class="furnace-slot"
            :class="{ hover: heldItem }"
            @click.left="slotClick('input')"
            @click.right="slotClick('input', true)"
          >
            <div v-if="furnaceStore.activeData.input.item" class="item" :style="iconStyle(furnaceStore.activeData.input.item)">
              <span v-if="!isBlockItem(furnaceStore.activeData.input.item)">{{ shortName(furnaceStore.activeData.input.item) }}</span>
              <span v-if="furnaceStore.activeData.input.count > 1" class="count">{{ furnaceStore.activeData.input.count }}</span>
            </div>
          </div>
          <div
            class="furnace-slot fuel"
            :class="{ hover: heldItem }"
            @click.left="slotClick('fuel')"
            @click.right="slotClick('fuel', true)"
          >
            <div v-if="furnaceStore.activeData.fuel.item" class="item" :style="iconStyle(furnaceStore.activeData.fuel.item)">
              <span v-if="!isBlockItem(furnaceStore.activeData.fuel.item)">{{ shortName(furnaceStore.activeData.fuel.item) }}</span>
              <span v-if="furnaceStore.activeData.fuel.count > 1" class="count">{{ furnaceStore.activeData.fuel.count }}</span>
            </div>
          </div>
        </div>

        <!-- 中间: 进度 -->
        <div class="furnace-center">
          <div class="flame" :class="{ on: furnaceStore.activeData.burnTime > 0 }">{{ furnaceStore.activeData.burnTime > 0 ? '🔥' : '·' }}</div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: (furnaceStore.activeData.progress * 100) + '%' }"></div>
          </div>
          <div class="arrow">⬇</div>
        </div>

        <!-- 右侧: 输出 -->
        <div class="furnace-column">
          <div
            class="furnace-slot out"
            :class="{ hover: heldItem }"
            @click.left="slotClick('output')"
            @click.right="slotClick('output', true)"
          >
            <div v-if="furnaceStore.activeData.output.item" class="item" :style="iconStyle(furnaceStore.activeData.output.item)">
              <span v-if="!isBlockItem(furnaceStore.activeData.output.item)">{{ shortName(furnaceStore.activeData.output.item) }}</span>
              <span v-if="furnaceStore.activeData.output.count > 1" class="count">{{ furnaceStore.activeData.output.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 手持物品 -->
      <div v-if="heldItem" class="held-indicator">
        手持: {{ heldItemName }} ×{{ heldItem.count }}
        <button class="held-return" @click="returnHeld">放回背包</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFurnaceStore } from '@/ui/stores/furnaceStore'
import { useInventoryStore } from '@/ui/stores/inventoryStore'
import { ITEM_REGISTRY } from '@/types/items'
import { getBlockTypeForItem } from '@/types/blocks'
import { getItemIconStyle } from '@/ui/itemIcon'

const furnaceStore = useFurnaceStore()
const inventoryStore = useInventoryStore()

interface HeldItem { item: string; count: number }
const heldItem = ref<HeldItem | null>(null)

const heldItemName = computed(() => heldItem.value ? (ITEM_REGISTRY[heldItem.value.item]?.name ?? heldItem.value.item) : '')

const isBlockItem = (item: string | null): boolean => getBlockTypeForItem(item) !== undefined

const shortName = (item: string): string => {
  const name = ITEM_REGISTRY[item]?.name ?? item
  return name.length > 3 ? name.slice(0, 3) : name
}

const iconStyle = (item: string): ReturnType<typeof getItemIconStyle> => getItemIconStyle(item)

function close(): void {
  // 关闭时手中物品放回背包
  if (heldItem.value) {
    inventoryStore.addItem(heldItem.value.item, heldItem.value.count)
    heldItem.value = null
  }
  furnaceStore.closeFurnace()
}

function returnHeld(): void {
  if (!heldItem.value) return
  inventoryStore.addItem(heldItem.value.item, heldItem.value.count)
  heldItem.value = null
}

/** 点击格子: 拿起/放入/合并/单个放入 */
function slotClick(slot: 'input' | 'fuel' | 'output', single = false): void {
  const data = furnaceStore.activeData
  if (!data) return
  const target = data[slot]

  if (!heldItem.value) {
    // 空手: 拿起格子里的物品
    if (target.item) {
      const take = single ? Math.max(1, Math.floor(target.count / 2)) : target.count
      heldItem.value = { item: target.item, count: take }
      target.count -= take
      if (target.count <= 0) Object.assign(target, { item: null, count: 0 })
    }
    return
  }

  if (!target.item) {
    // 放入: 单击放 1 个, 再次点击放全部? 保持简单: 单击放 1 个, 右键放全部
    const put = single ? heldItem.value.count : 1
    const move = Math.min(put, heldItem.value.count)
    Object.assign(target, { item: heldItem.value.item, count: move })
    heldItem.value.count -= move
    if (heldItem.value.count <= 0) heldItem.value = null
    return
  }

  if (target.item === heldItem.value.item) {
    // 合并
    const space = 64 - target.count
    const move = Math.min(space, heldItem.value.count)
    target.count += move
    heldItem.value.count -= move
    if (heldItem.value.count <= 0) heldItem.value = null
    return
  }

  // 交换
  const swap = { item: target.item, count: target.count }
  Object.assign(target, { item: heldItem.value.item, count: heldItem.value.count })
  heldItem.value = swap
}

defineExpose({ close })
</script>

<style scoped>
.furnace-screen {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
}

.furnace-box {
  background: #c6c6c6;
  border: 3px solid #555;
  border-radius: 4px;
  padding: 12px 16px;
  min-width: 300px;
  color: #222;
}

.furnace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.furnace-header h2 { font-size: 18px; margin: 0; }

.close-button {
  background: #9e9e9e;
  border: 2px solid #555;
  border-radius: 4px;
  color: #000;
  font-size: 16px;
  line-height: 1;
  padding: 2px 8px;
  cursor: pointer;
}

.close-button:hover { background: #f44336; color: #fff; }

.furnace-body {
  display: flex;
  align-items: center;
  gap: 20px;
}

.furnace-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.furnace-slot {
  width: 48px;
  height: 48px;
  background: #8b8b8b;
  border: 2px solid;
  border-color: #373737 #fff #fff #373737;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.furnace-slot.hover:hover { outline: 2px solid #fff; }

.furnace-slot .item {
  width: 36px; height: 36px;
  background-size: cover;
  image-rendering: pixelated;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  font-size: 10px;
  position: relative;
}

.furnace-slot .count {
  position: absolute;
  right: 1px; bottom: 1px;
  font-size: 12px;
  color: #fff;
  text-shadow: 1px 1px 0 #000;
}

.furnace-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.flame { font-size: 22px; filter: grayscale(1); opacity: 0.4; }
.flame.on { filter: none; opacity: 1; animation: flicker 0.4s infinite alternate; }

@keyframes flicker {
  from { transform: scale(1); }
  to { transform: scale(1.15); }
}

.progress-track {
  width: 90px;
  height: 10px;
  background: #6b6b6b;
  border: 2px solid #373737;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: #ff9800;
  transition: width 0.1s linear;
}

.arrow { font-size: 16px; }

.held-indicator {
  margin-top: 12px;
  padding: 6px 10px;
  background: #555;
  color: #fff;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.held-return {
  background: #ff9800;
  border: none;
  color: #000;
  font-weight: bold;
  padding: 3px 8px;
  cursor: pointer;
}
</style>
