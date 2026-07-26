/**
 * SaveSystem - 存档保存/加载系统
 */

export interface SaveData {
  version: 1
  timestamp: number
  playerPosition: { x: number; y: number; z: number }
  playerVelocity: { x: number; y: number; z: number }
  health: number
  oxygen: number
  gameMode: 'survival' | 'creative'
  isFlying: boolean
  timeOfDay: number
  worldSeed: number
  isSuperflat: boolean
  yaw: number
  pitch: number
  hotbar: Array<{ item: string | null; count: number; blockType?: number; durabilityDamage?: number }>
  mainInventory: Array<{ item: string | null; count: number; blockType?: number }>
  armor: Array<{ item: string | null; slotType: string }>
}

export class SaveSystem {
  static SAVE_KEY = 'myworld_save'

  /** 保存游戏状态 */
  static save(data: SaveData): boolean {
    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(data))
      return true
    } catch (err) {
      console.error('[SaveSystem] Failed to save:', err)
      return false
    }
  }

  /** 加载游戏状态 */
  static load(): SaveData | null {
    try {
      const raw = localStorage.getItem(this.SAVE_KEY)
      if (!raw) return null
      const data = JSON.parse(raw) as SaveData
      if (data.version !== 1) {
        console.warn('[SaveSystem] Incompatible save version')
        return null
      }
      return data
    } catch (err) {
      console.error('[SaveSystem] Failed to load:', err)
      return null
    }
  }

  /** 检查是否有存档 */
  static hasSave(): boolean {
    return localStorage.getItem(this.SAVE_KEY) !== null
  }

  /** 删除存档 */
  static deleteSave(): void {
    localStorage.removeItem(this.SAVE_KEY)
  }

  /** 获取存档时间戳 */
  static getSaveTimestamp(): number | null {
    const data = this.load()
    return data?.timestamp ?? null
  }
}
