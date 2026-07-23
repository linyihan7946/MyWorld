<template>
  <div class="hud">
    <!-- Underwater overlay -->
    <div v-if="playerStore.isUnderwater" class="underwater-overlay"></div>

    <!-- Crosshair -->
    <div class="crosshair">
      <div class="crosshair-h"></div>
      <div class="crosshair-v"></div>
    </div>

    <!-- Mining progress bar -->
    <div v-if="playerStore.breakProgress > 0" class="mining-progress">
      <div class="mining-bar-bg">
        <div class="mining-bar-fill" :style="{ width: (playerStore.breakProgress * 100) + '%' }"></div>
      </div>
      <div class="mining-info">
        <span class="mining-tool">{{ playerStore.breakToolName ?? '' }}</span>
        <span v-if="!playerStore.breakCanHarvest" class="mining-warning">⚠ 无法采集掉落物</span>
      </div>
    </div>

    <!-- Game mode indicator -->
    <div class="mode-indicator">
      <span class="mode-badge" :class="playerStore.gameMode">
        {{ playerStore.gameMode === 'creative' ? '创造模式' : '生存模式' }}
      </span>
      <span v-if="playerStore.isFlying" class="fly-badge">飞行中</span>
      <span class="time-badge">{{ formattedTime }} · {{ isNight ? '夜晚' : '白天' }}</span>
    </div>

    <!-- Health bar (survival only) -->
    <div v-if="playerStore.gameMode === 'survival'" class="health-bar">
      <div v-for="i in 10" :key="i" class="heart" :class="{ full: i <= playerStore.health }">♥</div>
    </div>

    <!-- Oxygen bar (underwater) -->
    <div v-if="playerStore.isUnderwater && playerStore.gameMode === 'survival'" class="oxygen-bar">
      <div v-for="i in playerStore.maxOxygen" :key="i" class="bubble" :class="{ full: i <= playerStore.oxygen }">○</div>
    </div>

    <!-- Hotbar -->
    <div class="hotbar">
      <div
        v-for="(slot, index) in inventoryStore.hotbar"
        :key="index"
        class="hotbar-slot"
        :class="{ active: index === inventoryStore.selectedSlot }"
      >
        <div v-if="slot.item" class="item-icon" :style="getItemIconStyle(slot.item, slot.blockType)">
          <span v-if="slot.blockType === undefined" class="item-name">{{ getItemShortName(slot.item) }}</span>
        </div>
        <span v-if="slot.count > 1 && playerStore.gameMode === 'survival'" class="item-count">{{ slot.count }}</span>
        <span class="slot-number">{{ index + 1 }}</span>
      </div>
    </div>

    <!-- Controls hint -->
    <div class="controls-hint">
      G: 切换模式 | 双击空格: 飞行
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/ui/stores/playerStore'
import { useInventoryStore } from '@/ui/stores/inventoryStore'
import { ITEM_REGISTRY } from '@/types/items'
import { getItemIconStyle } from '@/ui/itemIcon'
import { computed, onMounted, onUnmounted } from 'vue'

const playerStore = usePlayerStore()
const inventoryStore = useInventoryStore()

const isNight = computed(() => playerStore.timeOfDay < 0.23 || playerStore.timeOfDay > 0.77)
const formattedTime = computed(() => {
  const totalMinutes = Math.floor(playerStore.timeOfDay * 24 * 60)
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0')
  const minutes = (totalMinutes % 60).toString().padStart(2, '0')
  return `${hours}:${minutes}`
})

const getItemShortName = (itemId: string): string => ITEM_REGISTRY[itemId]?.name.substring(0, 2) ?? itemId.substring(0, 2)

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.code >= 'Digit1' && e.code <= 'Digit9') {
    inventoryStore.selectSlot(parseInt(e.code.replace('Digit', '')) - 1)
  }
}

onMounted(() => document.addEventListener('keydown', handleKeyDown))
onUnmounted(() => document.removeEventListener('keydown', handleKeyDown))
</script>

<style scoped>
.hud {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none; z-index: 10;
}

.underwater-overlay {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(20, 60, 120, 0.35);
  pointer-events: none;
  z-index: 5;
}

.crosshair {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 24px; height: 24px;
}
.crosshair-h {
  position: absolute; top: 50%; left: 0;
  width: 100%; height: 2px; background: white;
  transform: translateY(-50%); mix-blend-mode: difference;
}
.crosshair-v {
  position: absolute; left: 50%; top: 0;
  width: 2px; height: 100%; background: white;
  transform: translateX(-50%); mix-blend-mode: difference;
}

.mining-progress {
  position: absolute; top: calc(50% + 24px); left: 50%;
  transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  min-width: 160px;
}
.mining-bar-bg {
  width: 100%; height: 6px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 3px; overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.mining-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  border-radius: 3px;
  transition: width 50ms linear;
}
.mining-info {
  display: flex; gap: 8px; align-items: center;
}
.mining-tool {
  font-family: 'Courier New', monospace;
  font-size: 11px; color: rgba(255, 255, 255, 0.7);
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.8);
}
.mining-warning {
  font-family: 'Courier New', monospace;
  font-size: 10px; color: #ff6b6b;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.8);
  animation: blink 0.8s ease-in-out infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.mode-indicator {
  position: absolute; top: 10px; right: 10px;
  display: flex; gap: 6px; align-items: center;
}
.mode-badge {
  padding: 4px 10px;
  font-family: 'Courier New', monospace;
  font-size: 13px; font-weight: bold;
  border-radius: 3px;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.5);
}
.mode-badge.creative {
  background: rgba(100, 60, 180, 0.7);
  color: #e8d0ff;
}
.mode-badge.survival {
  background: rgba(180, 60, 60, 0.7);
  color: #ffd0d0;
}
.fly-badge {
  padding: 4px 10px;
  background: rgba(60, 140, 220, 0.7);
  color: #d0e8ff;
  font-family: 'Courier New', monospace;
  font-size: 13px; font-weight: bold;
  border-radius: 3px;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.5);
}
.time-badge {
  padding: 4px 10px;
  background: rgba(20, 30, 55, 0.72);
  color: #e8ecff;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  font-weight: bold;
  border-radius: 3px;
  text-shadow: 1px 1px 0 #000;
}

.health-bar {
  position: absolute; bottom: 70px; left: 50%;
  transform: translateX(-50%);
  display: flex; gap: 2px;
}
.heart { font-size: 16px; color: #333; text-shadow: 1px 1px 0 #000; }
.heart.full { color: #e33; }

.oxygen-bar {
  position: absolute; bottom: 90px; left: 50%;
  transform: translateX(-50%);
  display: flex; gap: 2px;
}
.bubble {
  font-size: 16px; color: #555; text-shadow: 1px 1px 0 #000;
}
.bubble.full { color: #6cf; }

.hotbar {
  position: absolute; bottom: 20px; left: 50%;
  transform: translateX(-50%);
  display: flex; gap: 2px;
  background: rgba(0, 0, 0, 0.5);
  padding: 4px; border-radius: 4px;
}
.hotbar-slot {
  width: 50px; height: 50px;
  background: rgba(80, 80, 80, 0.7);
  border: 2px solid rgba(50, 50, 50, 0.8);
  position: relative;
  display: flex; align-items: center; justify-content: center;
}
.hotbar-slot.active { border-color: #fff; background: rgba(120, 120, 120, 0.7); }
.item-icon {
  width: 36px; height: 36px; border-radius: 3px;
  display: flex; align-items: center; justify-content: center;
}
.item-name {
  font-size: 10px; color: white;
  text-shadow: 1px 1px 0 #000; font-family: monospace;
}
.item-count {
  position: absolute; bottom: 2px; right: 4px;
  font-size: 12px; color: white;
  text-shadow: 1px 1px 0 #000;
  font-family: monospace; font-weight: bold;
}
.slot-number {
  position: absolute; top: 1px; left: 3px;
  font-size: 9px; color: rgba(255, 255, 255, 0.5);
  font-family: monospace;
}

.controls-hint {
  position: absolute; bottom: 4px; left: 50%;
  transform: translateX(-50%);
  font-family: monospace; font-size: 11px;
  color: rgba(255,255,255,0.4);
  text-shadow: 1px 1px 0 rgba(0,0,0,0.5);
}
</style>
