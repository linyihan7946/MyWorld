import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const showInventory = ref(false)
  const showCrafting = ref(false)
  const showPause = ref(false)
  const showDebug = ref(true)
  const showAnvil = ref(false)
  const anvilX = ref(0)
  const anvilY = ref(0)
  const anvilZ = ref(0)
  const cameraMode = ref<'firstPerson' | 'thirdPerson'>('firstPerson')
  /** 睡觉渐黑遮罩透明度 0..1 */
  const sleepFade = ref(0)

  // === MC 快捷键状态 ===
  const showHUD = ref(true)              // F1
  const showHitboxes = ref(false)        // F3+B
  const showChunkBorders = ref(false)    // F3+G
  const showAdvancedTooltips = ref(false) // F3+H

  function closeAll() {
    showInventory.value = false
    showCrafting.value = false
    showAnvil.value = false
  }

  return {
    showInventory, showCrafting, showPause, showDebug, showAnvil, anvilX, anvilY, anvilZ, cameraMode, closeAll,
    showHUD, showHitboxes, showChunkBorders, showAdvancedTooltips,
    sleepFade,
  }
})
