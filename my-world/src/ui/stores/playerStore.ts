import { defineStore } from 'pinia'
import { ref } from 'vue'

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

  // Mining progress (0 = not mining, 0-1 = breaking progress)
  const breakProgress = ref(0)
  const breakCanHarvest = ref(true)
  const breakToolName = ref<string | null>(null)

  // Save callback - set by Engine when initialized
  const saveCallback = ref<(() => boolean) | null>(null)

  return {
    position, health, maxHealth, oxygen, maxOxygen, selectedSlot, character,
    gameMode, isFlying, isUnderwater, worldSeed, isDead, deathCount, timeOfDay,
    breakProgress, breakCanHarvest, breakToolName, saveCallback,
  }
})
