<template>
  <div class="mobile-controls" @touchstart.prevent @touchend.prevent @touchmove.prevent>
    <!-- Virtual Joystick -->
    <div
      class="joystick-zone"
      ref="joystickZone"
      @touchstart="onJoystickStart"
      @touchmove="onJoystickMove"
      @touchend="onJoystickEnd"
    >
      <div class="joystick-base">
        <div
          class="joystick-thumb"
          :style="{ transform: `translate(${joyX}px, ${joyY}px)` }"
        ></div>
      </div>
    </div>

    <!-- Action Buttons (right side) -->
    <div class="action-buttons">
      <!-- Inventory -->
      <button class="act-btn inv-btn" @touchstart.stop="emit('openInventory')">
        <span class="btn-icon">📦</span><span class="btn-label">背包</span>
      </button>

      <!-- Camera toggle -->
      <button class="act-btn cam-btn" @touchstart.stop="emit('toggleCamera')">
        <span class="btn-icon">📷</span><span class="btn-label">视角</span>
      </button>

      <!-- Place / Use -->
      <button
        class="act-btn place-btn"
        @touchstart.stop="startAction('place')"
        @touchend.stop="stopAction('place')"
      ><span class="btn-icon">🖐</span><span class="btn-label">放置</span></button>

      <!-- Attack / Mine -->
      <button
        class="act-btn attack-btn"
        @touchstart.stop="startAction('attack')"
        @touchend.stop="stopAction('attack')"
      ><span class="btn-icon">⛏</span><span class="btn-label">挖掘</span></button>

      <!-- Jump -->
      <button
        class="act-btn jump-btn"
        @touchstart.stop="startAction('jump')"
        @touchend.stop="stopAction('jump')"
      ><span class="btn-icon">⬆</span><span class="btn-label">跳跃</span></button>

      <!-- Sneak -->
      <button
        class="act-btn sneak-btn"
        @touchstart.stop="startAction('sneak')"
        @touchend.stop="stopAction('sneak')"
      ><span class="btn-icon">⬇</span><span class="btn-label">潜行</span></button>
    </div>

    <!-- Hotbar selector (swipe zone at bottom) -->
    <div class="hotbar-touch" @touchstart="onHotbarTouch($event)">
      <div
        v-for="i in 9"
        :key="i"
        class="hotbar-dot"
        :class="{ active: selectedSlot === i - 1 }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits<{
  (e: 'move', dx: number, dz: number): void
  (e: 'action', action: string, pressed: boolean): void
  (e: 'openInventory'): void
  (e: 'toggleCamera'): void
  (e: 'selectSlot', slot: number): void
}>()

const props = defineProps<{ selectedSlot: number }>()

// ── Joystick state ──
const joystickZone = ref<HTMLElement | null>(null)
const joyX = ref(0)
const joyY = ref(0)
const joyRadius = 45
let joyTouchId: number | null = null
let joyBase = { x: 0, y: 0 }

function getTouchPos(e: TouchEvent, id: number): { x: number; y: number } | null {
  for (let i = 0; i < e.touches.length; i++) {
    if (e.touches[i].identifier === id) {
      return { x: e.touches[i].clientX, y: e.touches[i].clientY }
    }
  }
  return null
}

function onJoystickStart(e: TouchEvent) {
  const t = e.changedTouches[0]
  joyTouchId = t.identifier
  const rect = joystickZone.value!.getBoundingClientRect()
  joyBase = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  updateJoystick(t.clientX, t.clientY)
}

function onJoystickMove(e: TouchEvent) {
  if (joyTouchId === null) return
  const pos = getTouchPos(e, joyTouchId)
  if (pos) updateJoystick(pos.x, pos.y)
}

function onJoystickEnd(_e: TouchEvent) {
  joyTouchId = null
  joyX.value = 0
  joyY.value = 0
  emit('move', 0, 0)
}

function updateJoystick(cx: number, cy: number) {
  let dx = cx - joyBase.x
  let dy = cy - joyBase.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist > joyRadius) {
    dx = (dx / dist) * joyRadius
    dy = (dy / dist) * joyRadius
  }
  joyX.value = dx
  joyY.value = dy
  // Normalize to -1..1 and emit
  const nx = dx / joyRadius
  const ny = dy / joyRadius
  emit('move', -ny, nx) // forward=-Y (up), right=+X
}

// ── Action buttons ──
function startAction(action: string) {
  emit('action', action, true)
}
function stopAction(action: string) {
  emit('action', action, false)
}

// ── Hotbar swipe ──
function onHotbarTouch(e: TouchEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.touches[0].clientX - rect.left
  const slotWidth = rect.width / 9
  const slot = Math.floor(x / slotWidth)
  if (slot >= 0 && slot < 9) {
    emit('selectSlot', slot)
  }
}
</script>

<style scoped>
.mobile-controls {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none; z-index: 100;
}
.mobile-controls > * {
  pointer-events: auto;
}

/* ── Joystick ── */
.joystick-zone {
  position: absolute; bottom: 80px; left: 30px;
  width: 120px; height: 120px;
}
.joystick-base {
  width: 100%; height: 100%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  border: 3px solid rgba(255, 255, 255, 0.25);
  display: flex; align-items: center; justify-content: center;
}
.joystick-thumb {
  width: 50px; height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
  border: 2px solid rgba(255, 255, 255, 0.6);
  transition: none;
}

/* ── Action buttons ── */
.action-buttons {
  position: absolute; bottom: 60px; right: 20px;
  display: grid;
  grid-template-columns: 62px 62px 62px;
  grid-template-rows: 62px 62px 62px;
  gap: 8px;
}
.act-btn {
  width: 62px; height: 62px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}
.btn-icon {
  font-size: 18px;
  line-height: 1;
}
.btn-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.7);
  font-family: 'Courier New', monospace;
  font-weight: bold;
  line-height: 1;
}
.inv-btn  { background: rgba(80, 60, 140, 0.7); grid-column: 1; grid-row: 1; }
.cam-btn  { background: rgba(60, 80, 60, 0.7);  grid-column: 3; grid-row: 1; }
.place-btn{ background: rgba(60, 100, 180, 0.7); grid-column: 3; grid-row: 2; }
.attack-btn{ background: rgba(180, 60, 60, 0.7); grid-column: 3; grid-row: 3; }
.jump-btn  { background: rgba(60, 160, 80, 0.7);  grid-column: 2; grid-row: 3; }
.sneak-btn { background: rgba(140, 140, 160, 0.7); grid-column: 1; grid-row: 3; }

.act-btn:active {
  transform: scale(0.9);
  border-color: rgba(255, 255, 255, 0.8);
}

/* ── Hotbar touch ── */
.hotbar-touch {
  position: absolute; bottom: 4px; left: 50%;
  transform: translateX(-50%);
  width: 280px; height: 30px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 8px;
}
.hotbar-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: background 0.15s;
}
.hotbar-dot.active {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
}

/* ── 横屏适配 ── */
@media (orientation: landscape), (max-height: 500px) {
  .joystick-zone {
    bottom: 30px; left: 20px;
    width: 100px; height: 100px;
  }
  .joystick-thumb {
    width: 42px; height: 42px;
  }

  .action-buttons {
    bottom: 20px; right: 12px;
    grid-template-columns: 50px 50px 50px;
    grid-template-rows: 50px 50px 50px;
    gap: 6px;
  }
  .act-btn {
    width: 50px; height: 50px;
    border-radius: 10px;
  }
  .btn-icon { font-size: 15px; }
  .btn-label { font-size: 9px; }

  .hotbar-touch {
    bottom: 2px;
    width: 240px; height: 24px;
  }
  .hotbar-dot {
    width: 8px; height: 8px;
  }
}
</style>
