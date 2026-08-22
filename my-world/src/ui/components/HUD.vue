<template>
  <div class="hud">
    <!-- Underwater overlay -->
    <div v-if="playerStore.isUnderwater" class="underwater-overlay"></div>

    <!-- Weather atmosphere overlay -->
    <div v-if="playerStore.weather !== 'clear'" class="weather-overlay" :class="playerStore.weather"></div>

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
      <span v-if="playerStore.canUseCommandBlocks" class="cheat-badge cheat-on">🔓 作弊</span>
      <span v-else-if="playerStore.gameMode === 'creative'" class="cheat-badge cheat-off">🔒 作弊</span>
      <span v-if="playerStore.isFlying" class="fly-badge">飞行中</span>
      <span class="weather-badge">{{ weatherEmoji }} {{ weatherLabel }}</span>
      <span class="biome-badge">{{ playerStore.biome }}</span>
      <span class="time-badge">{{ formattedTime }} · {{ isNight ? '夜晚' : '白天' }}</span>
    </div>

    <!-- Oxygen bar (underwater) -->
    <div v-if="playerStore.isUnderwater && playerStore.gameMode === 'survival'" class="oxygen-bar">
      <div v-for="i in playerStore.maxOxygen" :key="i" class="bubble" :class="{ full: i <= playerStore.oxygen }">○</div>
    </div>

    <!-- Health bar (survival only) — 物品栏左侧 -->
    <div v-if="playerStore.gameMode === 'survival'" class="health-bar">
      <div v-for="i in 10" :key="i" class="heart" :class="{ full: i <= Math.ceil(playerStore.health / 2) }">♥</div>
    </div>

    <!-- Food bar (survival only) — 物品栏右侧 -->
    <div v-if="playerStore.gameMode === 'survival'" class="food-bar">
      <div v-for="i in 10" :key="i" class="drumstick" :class="{ full: i * 2 <= stats.foodLevel }">🍗</div>
    </div>

    <!-- XP bar — 紧贴物品栏上方居中 -->
    <div v-if="playerStore.gameMode === 'survival'" class="xp-bar">
      <div class="xp-bar-bg">
        <div class="xp-bar-fill" :style="{ width: (stats.xpProgress * 100) + '%' }"></div>
      </div>
      <span class="xp-level">{{ stats.xpLevel }}</span>
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

    <!-- Controls hint (PC only) -->
    <div v-if="playerStore.controlMode === 'pc'" class="controls-hint">
      G: 模式 | F: 作弊 | V: 视角 | Y: 天气 | R: 手机/PC | H: 保存 | 双击空格: 飞行
    </div>

    <!-- Active potion effects -->
    <div v-if="activeEffects.length > 0" class="effects-bar">
      <div v-for="eff in activeEffects" :key="eff.id" class="effect-icon" :style="{ background: eff.color }">
        <span class="effect-lvl" v-if="eff.level > 1">{{ eff.level }}</span>
        <span class="effect-time">{{ eff.time }}</span>
      </div>
    </div>

    <!-- Save status notification -->
    <div v-if="saveMessage" class="save-notify">{{ saveMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/ui/stores/playerStore'
import { useInventoryStore } from '@/ui/stores/inventoryStore'
import { ITEM_REGISTRY } from '@/types/items'
import { getItemIconStyle } from '@/ui/itemIcon'
import { potionEffects } from '@/gameplay/PotionEffect'
import { playerStats, getXpProgress } from '@/gameplay/PlayerStats'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const playerStore = usePlayerStore()
const inventoryStore = useInventoryStore()

// Save notification
const saveMessage = ref('')
const effectTick = ref(0)
const statsTick = ref(0)
setInterval(() => { statsTick.value++ }, 100)

const stats = computed(() => {
  statsTick.value // 强制刷新
  return {
    foodLevel: playerStats.foodLevel,
    xpLevel: playerStats.experienceLevel,
    xpProgress: getXpProgress(),
  }
})

// 每 0.5 秒刷新药水效果显示
setInterval(() => { effectTick.value++ }, 500)
const activeEffects = computed(() => {
  effectTick.value // 强制重新计算
  return potionEffects.getActive().map(e => ({
    id: e.id,
    name: potionEffects.getName(e.id),
    level: e.level,
    time: Math.ceil(e.duration),
    color: '#' + potionEffects.getColor(e.id).toString(16).padStart(6, '0'),
  }))
})

watch(() => playerStore.breakToolName, (name) => {
  if (name === '✓ 已保存' || name === '✗ 保存失败') {
    saveMessage.value = name
    setTimeout(() => { saveMessage.value = '' }, 2500)
  }
})

const isNight = computed(() => playerStore.timeOfDay < 0.23 || playerStore.timeOfDay > 0.77)

const weatherEmoji = computed(() => {
  const map: Record<string, string> = { clear: '☀', rain: '🌧', drizzle: '🌦', snow: '❄', blizzard: '🌨', thunder: '⛈', sandstorm: '🏜', foggy: '🌫' }
  return map[playerStore.weather] ?? '☀'
})
const weatherLabel = computed(() => {
  const map: Record<string, string> = { clear: '晴', rain: '雨', drizzle: '毛毛雨', snow: '雪', blizzard: '暴风雪', thunder: '雷暴', sandstorm: '沙尘暴', foggy: '浓雾' }
  return map[playerStore.weather] ?? '晴'
})
const formattedTime = computed(() => {
  const totalMinutes = Math.floor(playerStore.timeOfDay * 24 * 60)
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0')
  const minutes = (totalMinutes % 60).toString().padStart(2, '0')
  return `${hours}:${minutes}`
})

const getItemShortName = (itemId: string): string => ITEM_REGISTRY[itemId]?.name.substring(0, 2) ?? itemId.substring(0, 2)

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.code >= 'Digit1' && e.code <= 'Digit9') {
    const slot = parseInt(e.code.replace('Digit', '')) - 1
    inventoryStore.selectSlot(slot)
    playerStore.selectedSlot = slot
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

.weather-overlay {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 4;
  transition: background 2s ease;
}
.weather-overlay.rain {
  background: rgba(30, 45, 65, 0.15);
}
.weather-overlay.drizzle {
  background: rgba(30, 40, 55, 0.08);
}
.weather-overlay.snow {
  background: rgba(180, 195, 210, 0.12);
}
.weather-overlay.blizzard {
  background: rgba(200, 210, 225, 0.2);
}
.weather-overlay.thunder {
  background: rgba(10, 15, 30, 0.25);
}
.weather-overlay.sandstorm {
  background: rgba(180, 140, 80, 0.18);
}
.weather-overlay.foggy {
  background: rgba(180, 190, 200, 0.2);
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
.cheat-badge {
  padding: 4px 10px;
  font-family: 'Courier New', monospace;
  font-size: 13px; font-weight: bold;
  border-radius: 3px;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.5);
}
.cheat-badge.cheat-on {
  background: rgba(60, 180, 60, 0.7);
  color: #d0ffd0;
}
.cheat-badge.cheat-off {
  background: rgba(180, 60, 60, 0.7);
  color: #ffd0d0;
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
.weather-badge {
  padding: 4px 10px;
  background: rgba(20, 40, 70, 0.72);
  color: #e8f0ff;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  font-weight: bold;
  border-radius: 3px;
  text-shadow: 1px 1px 0 #000;
  letter-spacing: 1px;
}
.biome-badge {
  padding: 4px 10px;
  background: rgba(30, 60, 30, 0.72);
  color: #b8e8b8;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: bold;
  border-radius: 3px;
  text-shadow: 1px 1px 0 #000;
}

/* 血条：紧贴物品栏左侧，上移靠近经验条 */
.health-bar {
  position: absolute;
  bottom: calc(20px + 36px);
  right: calc(50% + 233px + 8px);
  display: flex; align-items: center; gap: 2px;
}
.heart { font-size: 16px; color: #333; text-shadow: 1px 1px 0 #000; }
.heart.full { color: #e33; }

/* 饱食度：紧贴物品栏右侧，上移靠近经验条 */
.food-bar {
  position: absolute;
  bottom: calc(20px + 36px);
  left: calc(50% + 233px + 8px);
  display: flex; align-items: center; gap: 2px;
}
.drumstick { font-size: 14px; color: #333; text-shadow: 1px 1px 0 #000; opacity: 0.5; }
.drumstick.full { opacity: 1; }

/* 经验条：紧贴物品栏上方，居中显示 */
.xp-bar {
  position: absolute;
  bottom: calc(20px + 58px);
  left: 50%;
  transform: translateX(-50%);
  display: flex; align-items: center; gap: 4px;
}
.xp-bar-bg {
  width: 180px; height: 6px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 3px; overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.xp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #40c040, #80ff40);
  border-radius: 3px; transition: width 0.2s;
}
.xp-level {
  font-size: 14px; color: #40ff40; font-weight: bold;
  text-shadow: 1px 1px 0 #000; font-family: monospace; min-width: 24px;
}

/* 氧气条：血条上方（水下时显示，血条此时仍可见） */
.oxygen-bar {
  position: absolute;
  bottom: calc(20px + 68px);
  right: calc(50% + 233px + 8px);
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

.save-notify {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #4caf50;
  padding: 10px 24px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  text-shadow: 1px 1px 0 #000;
  z-index: 20;
  animation: fadeIn 0.3s ease;
}

.effects-bar {
  position: absolute; top: 50px; right: 10px;
  display: flex; flex-direction: column; gap: 3px;
  z-index: 12;
}
.effect-icon {
  width: 28px; height: 28px;
  border-radius: 3px; border: 1px solid rgba(255,255,255,0.3);
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.effect-lvl {
  font-size: 10px; color: white; font-weight: bold;
  text-shadow: 1px 1px 0 #000;
}
.effect-time {
  position: absolute; bottom: 1px; left: 2px;
  font-size: 8px; color: white;
  text-shadow: 1px 1px 0 #000;
  font-family: monospace;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* ── 横屏适配 ── */
@media (orientation: landscape), (max-height: 500px) {
  .mode-indicator {
    top: 4px; right: 4px;
    gap: 4px;
  }
  .mode-badge, .fly-badge, .cheat-badge, .time-badge, .weather-badge, .biome-badge {
    padding: 2px 6px;
    font-size: 10px;
  }

  /* 横屏：物品栏 bottom:8px, slot 38px → outer top at bottom:48px */
  .health-bar {
    bottom: calc(8px + 38px + 2px);
    right: calc(50% + (38px * 9 + 2px * 8 + 4px) / 2 + 6px);
  }
  .heart { font-size: 13px; }

  .food-bar {
    bottom: calc(8px + 38px + 2px);
    left: calc(50% + (38px * 9 + 2px * 8 + 4px) / 2 + 6px);
  }
  .drumstick { font-size: 11px; }

  .xp-bar {
    bottom: calc(8px + 38px + 2px + 2px + 6px);
  }
  .xp-bar-bg { width: 140px; }
  .xp-level { font-size: 12px; }

  .oxygen-bar {
    bottom: calc(8px + 38px + 2px + 20px);
    right: calc(50% + (38px * 9 + 2px * 8 + 4px) / 2 + 6px);
  }
  .bubble { font-size: 13px; }

  .hotbar {
    bottom: 8px;
    padding: 2px;
    gap: 1px;
  }
  .hotbar-slot {
    width: 38px; height: 38px;
  }
  .item-icon {
    width: 28px; height: 28px;
  }
  .item-name { font-size: 8px; }
  .item-count { font-size: 10px; }
  .slot-number { font-size: 8px; }

  .controls-hint {
    display: none;
  }

  .mining-progress {
    min-width: 120px;
  }
  .mining-bar-bg {
    height: 4px;
  }
  .mining-tool { font-size: 9px; }
  .mining-warning { font-size: 8px; }
}
</style>
