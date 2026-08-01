<template>
  <div class="mobile-controls" @touchstart.prevent @touchend.prevent @touchmove.prevent>
    <!-- 摇杆 (左下) -->
    <div class="joystick-zone" ref="joystickZone"
      @touchstart="onJoystickStart" @touchmove="onJoystickMove" @touchend="onJoystickEnd">
      <div class="joystick-base">
        <div class="joystick-thumb" :style="{ transform: `translate(${joyX}px, ${joyY}px)` }"></div>
      </div>
    </div>

    <!-- 相机拖拽区 (右侧大半屏) -->
    <div class="look-zone" ref="lookZone"
      @touchstart="onLookStart" @touchmove="onLookMove" @touchend="onLookEnd"></div>

    <!-- 动作按钮 (右下，紧凑 3×2) -->
    <div class="action-buttons">
      <button class="act-btn place-btn" @touchstart.stop="startAction('place')" @touchend.stop="stopAction('place')">
        <span class="btn-icon">🖐</span>
      </button>
      <button class="act-btn attack-btn" @touchstart.stop="startAction('attack')" @touchend.stop="stopAction('attack')">
        <span class="btn-icon">⛏</span>
      </button>
      <button class="act-btn jump-btn" @touchstart.stop="startAction('jump')" @touchend.stop="stopAction('jump')">
        <span class="btn-icon">⬆</span>
      </button>
      <button class="act-btn sneak-btn" @touchstart.stop="startAction('sneak')" @touchend.stop="stopAction('sneak')">
        <span class="btn-icon">⬇</span>
      </button>
      <button class="act-btn inv-btn" @touchstart.stop="emit('openInventory')">
        <span class="btn-icon">📦</span>
      </button>
      <button class="act-btn cam-btn" @touchstart.stop="emit('toggleCamera')">
        <span class="btn-icon">📷</span>
      </button>
    </div>

    <!-- 热键栏触摸区 (底部) -->
    <div class="hotbar-touch" @touchstart="onHotbarTouch($event)">
      <div v-for="i in 9" :key="i" class="hotbar-dot" :class="{ active: selectedSlot === i - 1 }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'move', dx: number, dz: number): void
  (e: 'look', dx: number, dy: number): void
  (e: 'action', action: string, pressed: boolean): void
  (e: 'openInventory'): void
  (e: 'toggleCamera'): void
  (e: 'selectSlot', slot: number): void
}>()

const props = defineProps<{ selectedSlot: number }>()

// ── 摇杆 ──
const joystickZone = ref<HTMLElement | null>(null)
const joyX = ref(0)
const joyY = ref(0)
const joyRadius = 35
let joyTouchId: number | null = null
let joyBase = { x: 0, y: 0 }

// ── 相机拖拽 ──
const lookZone = ref<HTMLElement | null>(null)
let lookTouchId: number | null = null
let lookPrev = { x: 0, y: 0 }

function getTouchPos(e: TouchEvent, id: number): { x: number; y: number } | null {
  for (let i = 0; i < e.touches.length; i++) {
    if (e.touches[i].identifier === id) return { x: e.touches[i].clientX, y: e.touches[i].clientY }
  }
  return null
}

// ── 摇杆事件 ──
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
function onJoystickEnd(e: TouchEvent) {
  let ended = false
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === joyTouchId) { ended = true; break }
  }
  if (!ended) return
  // 尝试迁移到备用手指
  if (e.touches.length > 0 && joystickZone.value) {
    const rect = joystickZone.value.getBoundingClientRect()
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i]
      if (t.clientX >= rect.left && t.clientX <= rect.right && t.clientY >= rect.top && t.clientY <= rect.bottom) {
        joyTouchId = t.identifier
        joyBase = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        updateJoystick(t.clientX, t.clientY)
        return
      }
    }
  }
  joyTouchId = null; joyX.value = 0; joyY.value = 0; emit('move', 0, 0)
}
function updateJoystick(cx: number, cy: number) {
  let dx = cx - joyBase.x, dy = cy - joyBase.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist > joyRadius) { dx = (dx / dist) * joyRadius; dy = (dy / dist) * joyRadius }
  joyX.value = dx; joyY.value = dy
  emit('move', -dy / joyRadius, dx / joyRadius)
}

// ── 相机拖拽事件 ──
function onLookStart(e: TouchEvent) {
  if (lookTouchId !== null) return
  const t = e.changedTouches[0]
  lookTouchId = t.identifier
  lookPrev = { x: t.clientX, y: t.clientY }
}
function onLookMove(e: TouchEvent) {
  if (lookTouchId === null) return
  const pos = getTouchPos(e, lookTouchId)
  if (!pos) return
  const dx = pos.x - lookPrev.x, dy = pos.y - lookPrev.y
  lookPrev = { x: pos.x, y: pos.y }
  if (dx !== 0 || dy !== 0) emit('look', dx, dy)
}
function onLookEnd(e: TouchEvent) {
  let ended = false
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === lookTouchId) { ended = true; break }
  }
  if (!ended) return
  if (e.touches.length > 0 && lookZone.value) {
    const rect = lookZone.value.getBoundingClientRect()
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i]
      if (t.clientX >= rect.left && t.clientX <= rect.right && t.clientY >= rect.top && t.clientY <= rect.bottom) {
        lookTouchId = t.identifier; lookPrev = { x: t.clientX, y: t.clientY }; return
      }
    }
  }
  lookTouchId = null
}

// ── 动作按钮 ──
function startAction(a: string) { emit('action', a, true) }
function stopAction(a: string) { emit('action', a, false) }

// ── 热键栏触摸 ──
function onHotbarTouch(e: TouchEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const slot = Math.floor((e.touches[0].clientX - rect.left) / (rect.width / 9))
  if (slot >= 0 && slot < 9) emit('selectSlot', slot)
}
</script>

<style scoped>
.mobile-controls {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 100;
  touch-action: none; -webkit-touch-callout: none;
}
.mobile-controls > * { pointer-events: auto; }

/* ── 摇杆 ── */
.joystick-zone {
  position: absolute; bottom: 54px; left: 18px;
  width: 90px; height: 90px;
}
.joystick-base {
  width: 100%; height: 100%; border-radius: 50%;
  background: rgba(255,255,255,0.10); border: 2px solid rgba(255,255,255,0.20);
  display: flex; align-items: center; justify-content: center;
}
.joystick-thumb {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(255,255,255,0.38); border: 2px solid rgba(255,255,255,0.5);
}

/* ── 相机拖拽 ── */
.look-zone {
  position: absolute; top: 0; right: 0; width: 55%; height: 68%;
  touch-action: none;
}

/* ── 动作按钮 (右下 3×2 紧凑) ── */
.action-buttons {
  position: absolute; bottom: 38px; right: 10px;
  display: grid;
  grid-template-columns: 44px 44px 44px;
  grid-template-rows: 44px 44px;
  gap: 5px;
  z-index: 1;
}
.act-btn {
  width: 44px; height: 44px; border-radius: 10px;
  border: 2px solid rgba(255,255,255,0.28);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; user-select: none; -webkit-user-select: none;
  touch-action: manipulation;
}
.btn-icon { font-size: 17px; line-height: 1; }
.act-btn:active { transform: scale(0.88); border-color: rgba(255,255,255,0.7); }

/* 按钮颜色 */
.inv-btn   { background: rgba(80,60,140,0.65); }
.cam-btn   { background: rgba(60,80,60,0.65); }
.place-btn { background: rgba(60,100,180,0.65); }
.attack-btn{ background: rgba(180,60,60,0.65); }
.jump-btn  { background: rgba(60,160,80,0.65); }
.sneak-btn { background: rgba(140,140,160,0.65); }

/* ── 热键栏 ── */
.hotbar-touch {
  position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%);
  width: 240px; height: 26px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 6px; z-index: 1;
}
.hotbar-dot {
  width: 9px; height: 9px; border-radius: 50%;
  background: rgba(255,255,255,0.28); transition: background 0.15s;
}
.hotbar-dot.active { background: rgba(255,255,255,0.85); box-shadow: 0 0 5px rgba(255,255,255,0.4); }

/* ── 横屏 ── */
@media (orientation: landscape), (max-height: 500px) {
  .joystick-zone { bottom: 24px; left: 12px; width: 74px; height: 74px; }
  .joystick-thumb { width: 32px; height: 32px; }
  .look-zone { height: 62%; }
  .action-buttons {
    bottom: 14px; right: 8px;
    grid-template-columns: 38px 38px 38px;
    grid-template-rows: 38px 38px;
    gap: 4px;
  }
  .act-btn { width: 38px; height: 38px; border-radius: 8px; }
  .btn-icon { font-size: 14px; }
  .hotbar-touch { bottom: 2px; width: 200px; height: 22px; }
  .hotbar-dot { width: 7px; height: 7px; }
}
</style>
