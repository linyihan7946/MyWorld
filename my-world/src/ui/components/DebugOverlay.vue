<template>
  <div v-if="uiStore.showDebug" class="debug-overlay">
    <!-- 左栏: MC F3 调试信息 -->
    <div class="debug-left">
      <div>Minecraft MyWorld {{ playerStore.gameMode === 'creative' ? 'Creative' : 'Survival' }}</div>
      <div>FPS: {{ fps }} {{ fps >= 60 ? '✓' : fps < 30 ? '⚠' : '' }}</div>
      <div>&nbsp;</div>
      <div>XYZ: {{ pos.x.toFixed(3) }} / {{ pos.y.toFixed(3) }} / {{ pos.z.toFixed(3) }}</div>
      <div>Block: {{ Math.floor(pos.x) }} {{ Math.floor(pos.y) }} {{ Math.floor(pos.z) }}</div>
      <div>Chunk: {{ chunkX }} {{ Math.floor(pos.y) }} {{ chunkZ }} in {{ chunkLocalX }} {{ Math.floor(pos.y) }} {{ chunkLocalZ }}</div>
      <div>Facing: {{ facing }} ({{ facingAxis }})</div>
      <div>Biome: {{ playerStore.biome }}</div>
      <div>Weather: {{ playerStore.weather }}</div>
      <div>Time: {{ formattedTime }} (day {{ dayCount }})</div>
      <div>&nbsp;</div>
      <div v-if="playerStore.worldSeed !== null">Seed: {{ playerStore.worldSeed }}</div>
      <div>Dimension: overworld</div>
      <div>Gamemode: {{ playerStore.gameMode }}</div>
    </div>
    <!-- 右栏: 性能 / 高级信息 -->
    <div class="debug-right">
      <div>Memory: {{ memoryMB }} MB</div>
      <div>Entities: {{ entityCount }}</div>
      <div>Loaded chunks: {{ chunkCount }}</div>
      <div>&nbsp;</div>
      <div>F3+A = 刷新区块</div>
      <div>F3+B = 碰撞箱 {{ uiStore.showHitboxes ? '§aON' : '§7OFF' }}</div>
      <div>F3+G = 区块边界 {{ uiStore.showChunkBorders ? '§aON' : '§7OFF' }}</div>
      <div>F3+H = 高级提示 {{ uiStore.showAdvancedTooltips ? '§aON' : '§7OFF' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from '@/ui/stores/playerStore'
import { useUIStore } from '@/ui/stores/uiStore'

const playerStore = usePlayerStore()
const uiStore = useUIStore()
const fps = ref(0)
const entityCount = ref(0)
const chunkCount = ref(0)
const memoryMB = ref(0)
const dayCount = ref(0)

const pos = computed(() => playerStore.position)
const chunkX = computed(() => Math.floor(pos.value.x / 16))
const chunkZ = computed(() => Math.floor(pos.value.z / 16))
const chunkLocalX = computed(() => {
  const v = pos.value.x % 16
  return v < 0 ? Math.floor(16 + v) : Math.floor(v)
})
const chunkLocalZ = computed(() => {
  const v = pos.value.z % 16
  return v < 0 ? Math.floor(16 + v) : Math.floor(v)
})

// 朝向
const facing = computed(() => {
  // 从 playerStore 获取 yaw/pitch 不可用，使用简化计算
  return '' // 由 engine 通过 eventBus 更新
})
const facingAxis = computed(() => '')

const formattedTime = computed(() => {
  const totalMinutes = Math.floor(playerStore.timeOfDay * 24 * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
})

// FPS + 性能计数器
let frameCount = 0
let lastTime = performance.now()
let animId: number

const updatePerf = () => {
  frameCount++
  const now = performance.now()
  if (now - lastTime >= 1000) {
    fps.value = frameCount
    frameCount = 0
    lastTime = now
    // 内存估算
    if ((performance as any).memory) {
      memoryMB.value = Math.round((performance as any).memory.usedJSHeapSize / 1048576)
    }
  }
  animId = requestAnimationFrame(updatePerf)
}

// 接收引擎事件
const onStats = (data: any) => {
  if (data.entityCount !== undefined) entityCount.value = data.entityCount
  if (data.chunkCount !== undefined) chunkCount.value = data.chunkCount
  if (data.dayCount !== undefined) dayCount.value = data.dayCount
}

// 全局事件监听 (engine 通过 eventBus 发送)
const handler = (e: CustomEvent) => onStats(e.detail)
if (typeof window !== 'undefined') {
  window.addEventListener('engine:stats', handler as EventListener)
}

onMounted(() => {
  animId = requestAnimationFrame(updatePerf)
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  if (typeof window !== 'undefined') {
    window.removeEventListener('engine:stats', handler as EventListener)
  }
})
</script>

<style scoped>
.debug-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  color: #e0e0e0;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.8);
  line-height: 1.45;
  z-index: 20;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.55);
  padding: 8px 12px;
  border-radius: 4px;
  display: flex;
  gap: 40px;
}
.debug-left, .debug-right {
  white-space: nowrap;
}
</style>
