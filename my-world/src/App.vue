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

    <!-- Minecraft 风格主菜单 -->
    <div v-if="!started" class="minecraft-menu">
      <div class="menu-bg"></div>
      <div class="menu-content">
        <div class="menu-title-area">
          <h1 class="minecraft-title">MINECRAFT</h1>
          <p class="minecraft-subtitle">My World Edition</p>
        </div>

        <div class="menu-buttons">
          <button class="mc-btn primary" @click="startSurvival">
            <span class="mc-btn-text">单人游戏</span>
          </button>
          <button class="mc-btn" @click="startCreative">
            <span class="mc-btn-text">创造模式</span>
          </button>
          <button class="mc-btn" @click="startSuperflat">
            <span class="mc-btn-text">超平坦世界</span>
          </button>
          <button v-if="hasSave" class="mc-btn" @click="loadSavedGame">
            <span class="mc-btn-text">加载存档</span>
            <span v-if="saveTimestamp" class="mc-btn-sub">保存于 {{ formatTimestamp(saveTimestamp) }}</span>
          </button>
        </div>

        <div class="menu-seed">
          <label class="mc-label">世界种子</label>
          <input
            class="mc-input"
            v-model="seedInput"
            type="text"
            placeholder="留空随机 (如: 12345)"
            @keydown.enter="startSurvival"
          />
        </div>

        <div class="menu-footer">
          <span class="version-text">My World v0.1</span>
          <span class="copyright-text">Not an official Minecraft product</span>
        </div>

        <div v-if="gameMessage" class="game-message">{{ gameMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Engine } from '@/core/Engine'
import { usePlayerStore } from '@/ui/stores/playerStore'
import { useUIStore } from '@/ui/stores/uiStore'
import { SaveSystem } from '@/gameplay/SaveSystem'
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
const gameMode = ref<'survival' | 'creative'>('survival')
const gameMessage = ref('')

// Save system
const hasSave = ref(SaveSystem.hasSave())
const saveTimestamp = ref(SaveSystem.getSaveTimestamp())

const playerStore = usePlayerStore()
const uiStore = useUIStore()

/**
 * 将字符串种子哈希为数字
 */
function parseSeed(input: string): number | undefined {
  const trimmed = input.trim()
  if (!trimmed) return undefined
  if (/^-?\d+$/.test(trimmed)) {
    const n = parseInt(trimmed, 10)
    return ((n % 2147483647) + 2147483647) % 2147483647 || 1
  }
  let hash = 0
  for (let i = 0; i < trimmed.length; i++) {
    hash = ((hash << 5) - hash + trimmed.charCodeAt(i)) | 0
  }
  return Math.abs(hash) || 1
}

/** 格式化时间戳 */
function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

/** 启动游戏核心逻辑 */
const initGame = async (mode: 'survival' | 'creative', isSuperflat: boolean, loadSave: boolean = false) => {
  if (!gameCanvas.value || engine) return
  try {
    started.value = true
    gameMessage.value = ''
    const seed = parseSeed(seedInput.value)
    engine = new Engine(gameCanvas.value, seed, isSuperflat)
    await engine.init()

    // 设置游戏模式
    if (mode === 'creative') {
      engine.setGameMode('creative')
    }

    // 加载存档
    if (loadSave) {
      const saveData = SaveSystem.load()
      if (saveData) {
        engine.loadGame(saveData)
        gameMessage.value = '存档已加载'
        setTimeout(() => gameMessage.value = '', 3000)
      }
    }

    // 监听事件
    engine.eventBus.on('player:position', (pos: { x: number; y: number; z: number }) => {
      playerStore.position = pos
    })
    engine.eventBus.on('player:underwater', (underwater: boolean) => {
      playerStore.isUnderwater = underwater
    })
  } catch (err: any) {
    console.error('Game init error:', err)
    started.value = false
    gameMessage.value = '启动失败: ' + (err?.message || err)
  }
}

const startSurvival = () => initGame('survival', false)
const startCreative = () => initGame('creative', false)
const startSuperflat = () => initGame('survival', true)
const loadSavedGame = () => {
  const saveData = SaveSystem.load()
  if (saveData) {
    seedInput.value = String(saveData.worldSeed)
    superflatMode.value = saveData.isSuperflat
    initGame(saveData.gameMode, saveData.isSuperflat, true)
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

/* === Minecraft 风格主菜单 === */
.minecraft-menu {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.menu-bg {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background:
    linear-gradient(180deg,
      #1a1a2e 0%,
      #16213e 30%,
      #0f3460 60%,
      #1a1a2e 100%);
  z-index: -1;
}

.menu-bg::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0;
  width: 100%; height: 60px;
  background:
    repeating-linear-gradient(90deg,
      #5a3a1a 0px, #5a3a1a 16px,
      #4a2a10 16px, #4a2a10 32px);
  border-top: 4px solid #3a2a0a;
}

.menu-content {
  text-align: center;
  font-family: 'Courier New', monospace;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 20px;
  position: relative;
  z-index: 1;
}

.menu-title-area {
  margin-bottom: 20px;
}

.minecraft-title {
  font-size: 72px;
  font-weight: 900;
  color: #fff;
  text-shadow:
    3px 3px 0px #3b3b3b,
    5px 5px 0px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(100, 200, 255, 0.2);
  letter-spacing: 8px;
  line-height: 1;
}

.minecraft-subtitle {
  font-size: 16px;
  color: #ffdd57;
  text-shadow: 2px 2px 0px #000;
  margin-top: 8px;
  font-style: italic;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 400px;
  max-width: 90vw;
}

.mc-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 20px;
  min-height: 44px;
  background: #737373;
  border: 3px solid;
  border-color: #a0a0a0 #505050 #505050 #a0a0a0;
  color: #e0e0e0;
  font-family: 'Courier New', monospace;
  font-size: 18px;
  cursor: pointer;
  text-shadow: 2px 2px 0px #3b3b3b;
  transition: all 0.1s;
  outline: none;
}

.mc-btn:hover {
  background: #858585;
  border-color: #c0c0c0 #606060 #606060 #c0c0c0;
  color: #ffffa0;
}

.mc-btn:active {
  background: #606060;
  border-color: #505050 #a0a0a0 #a0a0a0 #505050;
}

.mc-btn.primary {
  background: #5a8a3c;
  border-color: #7ab05c #3a6a1c #3a6a1c #7ab05c;
}

.mc-btn.primary:hover {
  background: #6a9a4c;
  border-color: #8ac06c #4a7a2c #4a7a2c #8ac06c;
}

.mc-btn-text {
  font-weight: bold;
}

.mc-btn-sub {
  font-size: 11px;
  color: #aaa;
  margin-top: 2px;
}

.menu-seed {
  margin-top: 10px;
  width: 400px;
  max-width: 90vw;
}

.mc-label {
  display: block;
  font-size: 13px;
  color: #aaa;
  text-align: left;
  margin-bottom: 4px;
  text-shadow: 1px 1px 0 #000;
}

.mc-input {
  width: 100%;
  padding: 8px 12px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: 2px solid #555;
  border-radius: 2px;
  outline: none;
}

.mc-input:focus {
  border-color: #7ab05c;
}

.mc-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.menu-footer {
  margin-top: 20px;
  width: 400px;
  max-width: 90vw;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.game-message {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: #4caf50;
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
}
</style>
