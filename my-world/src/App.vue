<template>
  <div class="game-container">
    <div ref="gameCanvas" class="game-canvas"></div>
    <HUD v-if="uiStore.showHUD" />
    <MobileControls
      v-if="playerStore.controlMode === 'mobile' && started"
      :selectedSlot="playerStore.selectedSlot"
      @move="onMobileMove"
      @look="onMobileLook"
      @action="onMobileAction"
      @openInventory="onMobileInventory"
      @toggleCamera="onMobileCamera"
      @selectSlot="onMobileSelectSlot"
    />
    <InventoryScreen />
    <ContainerScreen />
    <CommandBlockUI ref="commandBlockUI" />
    <DebugOverlay />

    <!-- 暂停菜单覆盖层 -->
    <div v-if="uiStore.showPause" class="pause-overlay" @click.self="uiStore.showPause = false">
      <div class="pause-menu">
        <h2>游戏暂停</h2>
        <button @click="uiStore.showPause = false; tryLockPointer()">继续游戏</button>
        <button @click="toggleFullscreen">全屏切换 (F11)</button>
        <button @click="returnToMenu">返回主菜单</button>
      </div>
    </div>

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
          <button v-if="hasSave" class="mc-btn delete-btn" @click="deleteSavedGame">
            <span class="mc-btn-text">删除存档</span>
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
          <span class="version-text">My World v0.2</span>
          <span class="copyright-text">Not an official Minecraft product</span>
        </div>

        <!-- 功能一览 -->
        <div class="menu-features">
          <div class="feature-col">
            <div class="feat-title">🎮 操作</div>
            <div class="feat-line">WASD 移动 · Space 跳跃</div>
            <div class="feat-line">Shift 奔跑 · 双击空格 飞行</div>
            <div class="feat-line">鼠标左键 挖掘 · 右键 放置</div>
            <div class="feat-line">E 背包 · 1-9 热键栏</div>
            <div class="feat-line">V/F5 切换视角</div>
          </div>
          <div class="feature-col">
            <div class="feat-title">⚡ 功能键</div>
            <div class="feat-line">G 切换创造/生存</div>
            <div class="feat-line">F 作弊开关 · Y 切换天气</div>
            <div class="feat-line">H 保存 · R 手机/PC模式</div>
            <div class="feat-line">Esc 暂停 · F11 全屏</div>
            <div class="feat-line">F1 隐藏HUD · F3 调试屏幕</div>
          </div>
          <div class="feature-col">
            <div class="feat-title">🔧 F3 调试</div>
            <div class="feat-line">F3+A 刷新区块</div>
            <div class="feat-line">F3+B 显示碰撞箱</div>
            <div class="feat-line">F3+G 显示区块边界</div>
            <div class="feat-line">F3+H 高级提示框</div>
          </div>
          <div class="feature-col">
            <div class="feat-title">🔴 红石</div>
            <div class="feat-line">红石粉 · 中继器 · 比较器</div>
            <div class="feat-line">活塞 · 粘性活塞 · 侦测器</div>
            <div class="feat-line">拉杆 · 漏斗</div>
            <div class="feat-line">右键中继器 切换延迟</div>
            <div class="feat-line">右键比较器 切换减法</div>
          </div>
        </div>

        <div v-if="gameMessage" class="game-message">{{ gameMessage }}</div>
      </div>
    </div>

    <!-- 竖屏旋转提示（仅手机端） -->
    <div v-if="isPortrait && started" class="rotate-overlay" @click="tryLockLandscape">
      <div class="rotate-icon">📱</div>
      <div class="rotate-text">请旋转手机至横屏</div>
      <div class="rotate-hint">点击屏幕尝试自动旋转</div>
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
import CommandBlockUI from '@/ui/components/CommandBlockUI.vue'
import DebugOverlay from '@/ui/components/DebugOverlay.vue'
import MobileControls from '@/ui/components/MobileControls.vue'

const gameCanvas = ref<HTMLElement | null>(null)
let engine: Engine | null = null
const started = ref(false)
const seedInput = ref('')
const superflatMode = ref(false)
const gameMode = ref<'survival' | 'creative'>('survival')
const gameMessage = ref('')

// Save system
const hasSave = ref(SaveSystem.hasSave())
const saveTimestamp = ref(SaveSystem.getSaveTimestamp())

const playerStore = usePlayerStore()
const uiStore = useUIStore()
const commandBlockUI = ref<InstanceType<typeof CommandBlockUI> | null>(null)

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

    // 移动端尝试强制横屏
    if (playerStore.controlMode === 'mobile') {
      tryLockLandscape()
    }

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

    // 命令方块UI事件
    engine.eventBus.on('commandBlock:open', (data: { x: number; y: number; z: number; blockType: number }) => {
      commandBlockUI.value?.open(data)
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

const deleteSavedGame = () => {
  if (confirm('确定要删除存档吗？此操作不可恢复！')) {
    SaveSystem.deleteSave()
    hasSave.value = SaveSystem.hasSave()
    saveTimestamp.value = SaveSystem.getSaveTimestamp()
    gameMessage.value = '存档已删除'
    setTimeout(() => { gameMessage.value = '' }, 3000)
  }
}

const respawn = () => {
  if (engine) {
    engine.respawn()
  }
}

const returnToMenu = () => {
  uiStore.showPause = false
  started.value = false
  engine?.dispose()
  engine = null
}

// ── Mobile control handlers ──
const onMobileMove = (forward: number, right: number) => {
  engine?.inputManager.setVirtualMovement(forward, right)
}
const onMobileLook = (dx: number, dy: number) => {
  engine?.inputManager.setVirtualLook(dx, dy)
}
const onMobileAction = (action: string, pressed: boolean) => {
  engine?.inputManager.setVirtualAction(action, pressed)
}
const onMobileInventory = () => {
  engine?.inputManager.setVirtualAction('inventory', true)
  setTimeout(() => engine?.inputManager.setVirtualAction('inventory', false), 100)
}
const onMobileCamera = () => {
  engine?.inputManager.setVirtualAction('toggleCamera', true)
  setTimeout(() => engine?.inputManager.setVirtualAction('toggleCamera', false), 100)
}
const onMobileSelectSlot = (slot: number) => {
  engine?.inputManager.setVirtualAction(`slot${slot}`, true)
  setTimeout(() => engine?.inputManager.setVirtualAction(`slot${slot}`, false), 100)
}

// Pointer lock 辅助
const tryLockPointer = () => {
  if (engine && !engine.inputManager.locked) {
    gameCanvas.value?.querySelector('canvas')?.requestPointerLock()
  }
}

// 全屏切换
const toggleFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen()
  }
}

// Auto-detect control mode
playerStore.autoDetectControlMode()

// 横竖屏切换时强制重新计算画布尺寸
const handleOrientationChange = () => {
  // 等浏览器完成旋转后再触发 resize
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 200)
}
window.addEventListener('orientationchange', handleOrientationChange)
// 部分安卓浏览器不触发 orientationchange，监听 resize 兜底
window.addEventListener('resize', handleOrientationChange)

// 移动端强制横屏（需要全屏 API 支持）
const tryLockLandscape = async () => {
  try {
    // 先进入全屏，然后锁定横屏方向
    const el = document.documentElement
    if (el.requestFullscreen) {
      await el.requestFullscreen()
    }
    if (screen.orientation && 'lock' in screen.orientation) {
      await (screen.orientation as any).lock('landscape')
    }
  } catch {
    // 浏览器不支持或用户拒绝，静默失败
  }
}

// 监听是否竖屏（显示旋转提示）
const isPortrait = ref(false)
const checkOrientation = () => {
  isPortrait.value = window.innerHeight > window.innerWidth && playerStore.controlMode === 'mobile'
}
window.addEventListener('resize', checkOrientation)
window.addEventListener('orientationchange', checkOrientation)
setTimeout(checkOrientation, 500)

onUnmounted(() => {
  window.removeEventListener('orientationchange', handleOrientationChange)
  window.removeEventListener('resize', handleOrientationChange)
  window.removeEventListener('resize', checkOrientation)
  window.removeEventListener('orientationchange', checkOrientation)
  engine?.dispose()
  engine = null
})
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; }

.game-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #000;
}

.game-canvas {
  width: 100%;
  height: 100%;
  touch-action: none;
  -webkit-touch-callout: none;
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
  gap: 10px;
  padding: 20px;
  position: relative;
  z-index: 1;
  max-height: 96vh;
  overflow-y: auto;
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

.mc-btn.delete-btn {
  background: #8a3c3c;
  border-color: #b05c5c #6a1c1c #6a1c1c #b05c5c;
}

.mc-btn.delete-btn:hover {
  background: #9a4c4c;
  border-color: #c06c6c #7a2c2c #7a2c2c #c06c6c;
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
  margin-top: 16px;
  width: 400px;
  max-width: 90vw;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

/* ── 功能一览 ── */
.menu-features {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
  width: 620px;
  max-width: 92vw;
}
.feature-col {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 4px;
  padding: 8px 12px;
  min-width: 135px;
  text-align: left;
}
.feat-title {
  font-size: 12px; font-weight: bold; color: #ffdd57;
  margin-bottom: 4px; text-shadow: 1px 1px 0 #000;
}
.feat-line {
  font-size: 10px; color: rgba(255,255,255,0.58);
  line-height: 1.5; font-family: 'Courier New', monospace;
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

/* ── 横屏适配 ── */
@media (orientation: landscape), (max-height: 500px) {
  .minecraft-title {
    font-size: 42px;
    letter-spacing: 4px;
  }
  .minecraft-subtitle {
    font-size: 12px;
    margin-top: 4px;
  }
  .menu-title-area {
    margin-bottom: 8px;
  }
  .menu-content {
    gap: 8px;
    padding: 10px 20px;
  }
  .menu-buttons {
    width: 320px;
    gap: 4px;
  }
  .mc-btn {
    padding: 6px 16px;
    min-height: 34px;
    font-size: 14px;
  }
  .mc-btn-sub {
    font-size: 10px;
    margin-top: 1px;
  }
  .menu-seed {
    width: 320px;
    margin-top: 6px;
  }
  .mc-label {
    font-size: 11px;
    margin-bottom: 2px;
  }
  .mc-input {
    padding: 6px 10px;
    font-size: 12px;
  }
  .menu-footer {
    margin-top: 8px;
    font-size: 10px;
  }
  .game-message {
    bottom: 40px;
    font-size: 12px;
    padding: 6px 14px;
  }

  /* 死亡屏幕 */
  .death-content h1 {
    font-size: 40px;
  }
  .death-content .death-stats {
    font-size: 16px;
    margin-bottom: 16px;
  }
  .death-content button {
    font-size: 18px;
    padding: 10px 40px;
  }
}

/* ── 竖屏旋转提示 ── */
.rotate-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.rotate-icon {
  font-size: 80px;
  animation: rotateShake 1.5s ease-in-out infinite;
}
.rotate-text {
  color: white;
  font-size: 24px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  margin-top: 20px;
  text-shadow: 2px 2px 0 #000;
}
.rotate-hint {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-family: 'Courier New', monospace;
  margin-top: 12px;
}
@keyframes rotateShake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(90deg); }
  75% { transform: rotate(90deg); }
}

/* ── 暂停菜单 ── */
.pause-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.pause-menu {
  background: #c6c6c6;
  border: 3px solid #555;
  padding: 30px 40px;
  border-radius: 4px;
  text-align: center;
  font-family: 'Courier New', monospace;
  display: flex; flex-direction: column; gap: 10px;
  min-width: 260px;
}
.pause-menu h2 { color: #333; font-size: 24px; margin-bottom: 8px; }
.pause-menu button {
  padding: 10px 20px;
  font-family: 'Courier New', monospace;
  font-size: 15px;
  border: 2px solid #555;
  background: #999;
  color: #222;
  cursor: pointer;
  font-weight: bold;
}
.pause-menu button:hover { background: #b0b0b0; }
</style>
