import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePlayerStore = defineStore('player', () => {
  const position = ref({ x: 0, y: 0, z: 0 })
  const health = ref(10)
  const maxHealth = ref(10)
  const oxygen = ref(10)
  const maxOxygen = ref(10)
  const selectedSlot = ref(0)
  const character = ref('steve')
  const gameMode = ref<'survival' | 'creative'>('creative')
  const isFlying = ref(false)
  const isUnderwater = ref(false)
  const worldSeed = ref<number | null>(null)
  const isDead = ref(false)
  const deathCount = ref(0)
  const timeOfDay = ref(0.4)
  const weather = ref<'clear' | 'rain' | 'snow' | 'thunder'>('clear')
  const biome = ref('plains')

  // === 控制模式 ===
  const controlMode = ref<'pc' | 'mobile'>('pc')
  function toggleControlMode() {
    controlMode.value = controlMode.value === 'pc' ? 'mobile' : 'pc'
  }
  function autoDetectControlMode() {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    controlMode.value = hasTouch ? 'mobile' : 'pc'
  }

  // === 作弊系统 ===
  const cheatsEnabled = ref(true)  // 默认开启作弊

  // 是否可以使用指令方块 (需要创造模式+作弊开启)
  const canUseCommandBlocks = computed(() =>
    gameMode.value === 'creative' && cheatsEnabled.value
  )

  // Mining progress (0 = not mining, 0-1 = breaking progress)
  const breakProgress = ref(0)
  const breakCanHarvest = ref(true)
  const breakToolName = ref<string | null>(null)

  // Save callback - set by Engine when initialized
  const saveCallback = ref<(() => boolean) | null>(null)

  // 切换作弊
  function toggleCheats() {
    cheatsEnabled.value = !cheatsEnabled.value
  }

  return {
    position, health, maxHealth, oxygen, maxOxygen, selectedSlot, character,
    gameMode, isFlying, isUnderwater, worldSeed, isDead, deathCount, timeOfDay, weather, biome,
    cheatsEnabled, canUseCommandBlocks, toggleCheats,
    breakProgress, breakCanHarvest, breakToolName, saveCallback,
    controlMode, toggleControlMode, autoDetectControlMode,
  }
})
