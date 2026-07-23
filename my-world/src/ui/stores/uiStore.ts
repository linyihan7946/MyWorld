import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const showInventory = ref(false)
  const showCrafting = ref(false)
  const showPause = ref(false)
  const showDebug = ref(true)
  const cameraMode = ref<'firstPerson' | 'thirdPerson'>('firstPerson')

  return { showInventory, showCrafting, showPause, showDebug, cameraMode }
})
