<template>
  <div class="debug-overlay">
    <div>FPS: {{ fps }}</div>
    <div>坐标: {{ pos.x }}, {{ pos.y }}, {{ pos.z }}</div>
    <div>区块: {{ chunkX }}, {{ chunkZ }}</div>
    <div v-if="playerStore.worldSeed !== null">种子: {{ playerStore.worldSeed }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { usePlayerStore } from '@/ui/stores/playerStore'

const playerStore = usePlayerStore()
const fps = ref(0)
const pos = computed(() => playerStore.position)
const chunkX = computed(() => Math.floor(pos.value.x / 16))
const chunkZ = computed(() => Math.floor(pos.value.z / 16))

let frameCount = 0
let lastTime = performance.now()
let animId: number

const updateFps = () => {
  frameCount++
  const now = performance.now()
  if (now - lastTime >= 1000) {
    fps.value = frameCount
    frameCount = 0
    lastTime = now
  }
  animId = requestAnimationFrame(updateFps)
}

onMounted(() => {
  animId = requestAnimationFrame(updateFps)
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
})
</script>

<style scoped>
.debug-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  color: white;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  text-shadow: 1px 1px 0 #000;
  line-height: 1.5;
  z-index: 20;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.3);
  padding: 6px 10px;
  border-radius: 4px;
}
</style>
