<template>
  <div class="game-container">
    <div ref="gameCanvas" class="game-canvas"></div>
    <HUD />
    <InventoryScreen />
    <ContainerScreen />
    <DebugOverlay v-if="showDebug" />

    <!-- Death screen -->
    <div v-if="playerStore.isDead" class="death-screen">
      <div class="death-content">
        <h1>你死了！</h1>
        <p class="death-stats">死亡次数: {{ playerStore.deathCount }}</p>
        <button @click="respawn">重生</button>
      </div>
    </div>

    <div v-if="!started" class="start-screen">
      <div class="start-content">
        <h1>My World</h1>
        <p>3D方块世界</p>
        <div class="seed-input">
          <label for="world-seed">世界种子</label>
          <input
            id="world-seed"
            v-model="seedInput"
            type="text"
            placeholder="留空随机生成 (如: 12345 或 mchello)"
            @keydown.enter="startGame"
          />
          <p class="seed-hint">支持数字或文字种子，相同种子生成相同世界</p>
        </div>
        <div class="world-options">
          <label class="option-check">
            <input type="checkbox" v-model="superflatMode" />
            <span>超平坦世界</span>
          </label>
          <p class="seed-hint">基岩 + 2层泥土 + 草方块，完全平坦的地形</p>
        </div>
        <button @click="startGame">开始游戏</button>
        <div class="controls-info">
          <h3>操作说明</h3>
          <p>WASD - 移动 | 空格 - 跳跃 | Shift - 冲刺</p>
          <p>鼠标 - 视角 | 左键 - 拆方块 | 右键 - 打开容器 | Shift+右键 - 强制放置</p>
          <p>F5 - 切换视角 | E - 背包 | 1-9 - 快捷栏</p>
          <p>点击画面锁定鼠标</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted } from 'vue'
import { markRaw } from 'vue'
import { Engine } from '@/core/Engine'
import { usePlayerStore } from '@/ui/stores/playerStore'
import { useUIStore } from '@/ui/stores/uiStore'
import HUD from '@/ui/components/HUD.vue'
import InventoryScreen from '@/ui/components/InventoryScreen.vue'
import ContainerScreen from '@/ui/components/ContainerScreen.vue'
import DebugOverlay from '@/ui/components/DebugOverlay.vue'

const gameCanvas = ref<HTMLElement | null>(null)
let engine: Engine | null = null
const started = ref(false)
const showDebug = ref(true)
const seedInput = ref('')
const superflatMode = ref(false)

const playerStore = usePlayerStore()
const uiStore = useUIStore()

/**
 * 将字符串种子哈希为数字（类似 Minecraft 的 seed 哈希）
 * 空字符串返回 null（使用随机种子）
 */
function parseSeed(input: string): number | undefined {
  const trimmed = input.trim()
  if (!trimmed) return undefined

  // 纯数字：直接解析
  if (/^-?\d+$/.test(trimmed)) {
    const n = parseInt(trimmed, 10)
    // 限制在 safe 范围内
    return ((n % 2147483647) + 2147483647) % 2147483647 || 1
  }

  // 文字种子：Java String.hashCode 风格
  let hash = 0
  for (let i = 0; i < trimmed.length; i++) {
    hash = ((hash << 5) - hash + trimmed.charCodeAt(i)) | 0
  }
  return Math.abs(hash) || 1
}

const startGame = async () => {
  if (!gameCanvas.value || engine) return

  try {
    started.value = true
    const seed = parseSeed(seedInput.value)
    engine = new Engine(gameCanvas.value, seed, superflatMode.value)
    await engine.init()

    // Listen to engine events
    engine.eventBus.on('player:position', (pos: { x: number; y: number; z: number }) => {
      playerStore.position = pos
    })
    engine.eventBus.on('player:underwater', (underwater: boolean) => {
      playerStore.isUnderwater = underwater
    })
  } catch (err: any) {
    console.error('Game init error:', err)
    started.value = false
    alert('游戏初始化出错: ' + (err?.message || err))
  }
}

const respawn = () => {
  if (engine) {
    engine.respawn()
  }
}

onUnmounted(() => {
  engine?.dispose()
  engine = null
})
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; }

.game-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #000;
}

.game-canvas {
  width: 100%;
  height: 100%;
}

.game-canvas canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.death-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(150, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.death-content {
  text-align: center;
  color: white;
  font-family: 'Courier New', monospace;
}

.death-content h1 {
  font-size: 64px;
  text-shadow: 4px 4px 0 #000;
  margin-bottom: 20px;
  color: #ff3333;
}

.death-content .death-stats {
  font-size: 20px;
  margin-bottom: 30px;
  text-shadow: 2px 2px 0 #000;
}

.death-content button {
  font-family: 'Courier New', monospace;
  font-size: 24px;
  padding: 15px 60px;
  background: #4a8a4a;
  color: white;
  border: 3px solid #2d6b2d;
  cursor: pointer;
  text-shadow: 2px 2px 0 #000;
  transition: all 0.2s;
}

.death-content button:hover {
  background: #5a9a5a;
  transform: scale(1.05);
}

.start-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a4a1a 0%, #2d6b2d 30%, #1a4a1a 60%, #0d300d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.start-content {
  text-align: center;
  color: white;
  font-family: 'Courier New', monospace;
}

.start-content h1 {
  font-size: 72px;
  text-shadow: 4px 4px 0 #000, -2px -2px 0 #333;
  margin-bottom: 10px;
  letter-spacing: 4px;
}

.start-content p {
  font-size: 18px;
  margin-bottom: 30px;
  color: #ccc;
}

.seed-input {
  margin: 20px auto;
  max-width: 400px;
  text-align: left;
}

.seed-input label {
  display: block;
  font-size: 14px;
  color: #aaa;
  margin-bottom: 6px;
  text-shadow: 1px 1px 0 #000;
}

.seed-input input {
  width: 100%;
  padding: 10px 14px;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: 2px solid #555;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.2s;
}

.seed-input input:focus {
  border-color: #4a8a4a;
}

.seed-input input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.seed-hint {
  font-size: 11px !important;
  color: #888 !important;
  margin-top: 6px !important;
  margin-bottom: 10px !important;
}

.world-options {
  margin: 12px auto;
  max-width: 400px;
  text-align: left;
}

.option-check {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 15px;
  color: #ddd;
  text-shadow: 1px 1px 0 #000;
}

.option-check input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #4a8a4a;
  cursor: pointer;
}

.start-content button {
  font-family: 'Courier New', monospace;
  font-size: 24px;
  padding: 15px 60px;
  background: #4a8a4a;
  color: white;
  border: 3px solid #2d6b2d;
  cursor: pointer;
  text-shadow: 2px 2px 0 #000;
  transition: all 0.2s;
}

.start-content button:hover {
  background: #5a9a5a;
  transform: scale(1.05);
}

.controls-info {
  margin-top: 40px;
  padding: 20px;
  background: rgba(0,0,0,0.3);
  border-radius: 8px;
}

.controls-info h3 {
  margin-bottom: 10px;
  font-size: 16px;
}

.controls-info p {
  font-size: 13px;
  margin: 5px 0;
  color: #aaa;
}
</style>
