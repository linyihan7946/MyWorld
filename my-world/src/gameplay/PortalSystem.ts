import * as THREE from 'three'
import { ChunkManager } from '@/world/ChunkManager'
import { BlockType } from '@/types/blocks'

export type Dimension = 'overworld' | 'nether' | 'end'

/**
 * PortalSystem - 传送门系统
 * 处理地狱传送门和末地传送门的激活和传送
 */
export class PortalSystem {
  private chunkManager: ChunkManager

  // 当前维度
  public currentDimension: Dimension = 'overworld'

  // 传送冷却（防止重复触发）
  private teleportCooldown = 0
  private inPortalTimer = 0
  private readonly PORTAL_DELAY = 2 // 站在传送门中 2 秒后传送

  // 维度位置记忆（返回时使用）
  private dimensionPositions: Map<Dimension, THREE.Vector3> = new Map()

  constructor(chunkManager: ChunkManager) {
    this.chunkManager = chunkManager
  }

  /**
   * 每帧更新：检测玩家是否在传送门中
   * @returns 是否触发了传送
   */
  update(
    playerPos: THREE.Vector3,
    dt: number,
  ): { shouldTeleport: boolean; targetDimension: Dimension } | null {
    // 冷却中
    if (this.teleportCooldown > 0) {
      this.teleportCooldown -= dt
      this.inPortalTimer = 0
      return null
    }

    // 检测玩家是否站在传送门方块中
    const px = Math.floor(playerPos.x)
    const py = Math.floor(playerPos.y)
    const pz = Math.floor(playerPos.z)

    const blockAtFeet = this.chunkManager.getBlock(px, py, pz)
    const blockAtHead = this.chunkManager.getBlock(px, py + 1, pz)

    const inNetherPortal = blockAtFeet === BlockType.NETHER_PORTAL || blockAtHead === BlockType.NETHER_PORTAL
    const inEndPortal = blockAtFeet === BlockType.END_PORTAL || blockAtHead === BlockType.END_PORTAL

    if (inNetherPortal || inEndPortal) {
      this.inPortalTimer += dt
      if (this.inPortalTimer >= this.PORTAL_DELAY) {
        this.inPortalTimer = 0
        this.teleportCooldown = 5 // 5 秒冷却

        let targetDimension: Dimension
        if (inNetherPortal) {
          targetDimension = this.currentDimension === 'nether' ? 'overworld' : 'nether'
        } else {
          targetDimension = this.currentDimension === 'end' ? 'overworld' : 'end'
        }

        return { shouldTeleport: true, targetDimension }
      }
    } else {
      this.inPortalTimer = 0
    }

    return null
  }

  /**
   * 获取传送门的进度（0-1），用于 UI 显示
   */
  getPortalProgress(): number {
    return Math.min(1, this.inPortalTimer / this.PORTAL_DELAY)
  }

  /**
   * 尝试激活地狱传送门
   * 使用打火石右键点击黑曜石框架内的空气方块
   * @returns 是否成功激活
   */
  tryActivateNetherPortal(x: number, y: number, z: number): boolean {
    const block = this.chunkManager.getBlock(x, y, z)
    if (block !== BlockType.AIR) return false

    // 检查是否是有效的传送门框架
    const orientation = this.detectNetherPortalFrame(x, y, z)
    if (!orientation) return false

    // 在框架内填充传送门方块
    this.fillNetherPortal(x, y, z, orientation)
    return true
  }

  /**
   * 检测指定位置是否处于有效的地狱传送门框架内
   * @returns 'x' 或 'z'（传送门朝向）或 null
   */
  private detectNetherPortalFrame(x: number, y: number, z: number): 'x' | 'z' | null {
    // 尝试两种朝向
    if (this.isValidNetherFrame(x, y, z, 'x')) return 'x'
    if (this.isValidNetherFrame(x, y, z, 'z')) return 'z'
    return null
  }

  /**
   * 检查 X 或 Z 朝向的传送门框架是否有效
   * 框架最小 3x4（内部 1x2），最大 23x23
   */
  private isValidNetherFrame(x: number, y: number, z: number, axis: 'x' | 'z'): boolean {
    // 找到框架的左下角
    let minX = x, maxX = x, minY = y, maxY = y, minZ = z, maxZ = z

    // 向下找底部
    while (minY > 0 && this.isObsidian(minX, minY - 1, minZ)) minY--
    // 向上找顶部
    while (maxY < 255 && this.isObsidian(minX, maxY + 1, minZ)) maxY++

    const height = maxY - minY + 1
    if (height < 3 || height > 23) return false

    if (axis === 'x') {
      // 传送门在 X 平面上（朝 Z 方向看）
      while (minX > 0 && this.isObsidian(minX - 1, minY, minZ)) minX--
      while (maxX < 255 && this.isObsidian(maxX + 1, minY, minZ)) maxX++
      const width = maxX - minX + 1
      if (width < 2 || width > 23) return false

      // 验证框架：左右两列必须是黑曜石，顶部和底部必须是黑曜石
      // 底部
      for (let bx = minX; bx <= maxX; bx++) {
        if (!this.isObsidian(bx, minY, minZ)) return false
      }
      // 顶部
      for (let bx = minX; bx <= maxX; bx++) {
        if (!this.isObsidian(bx, maxY, minZ)) return false
      }
      // 左右两列
      for (let by = minY; by <= maxY; by++) {
        if (!this.isObsidian(minX, by, minZ)) return false
        if (!this.isObsidian(maxX, by, minZ)) return false
      }

      // 检查内部是空气（当前点所在的内部区域）
      for (let bx = minX + 1; bx < maxX; bx++) {
        for (let by = minY + 1; by < maxY; by++) {
          const b = this.chunkManager.getBlock(bx, by, minZ)
          if (b !== BlockType.AIR && b !== BlockType.NETHER_PORTAL) return false
        }
      }
      return true
    } else {
      // 传送门在 Z 平面上（朝 X 方向看）
      while (minZ > 0 && this.isObsidian(minX, minY, minZ - 1)) minZ--
      while (maxZ < 255 && this.isObsidian(minX, minY, maxZ + 1)) maxZ++
      const width = maxZ - minZ + 1
      if (width < 2 || width > 23) return false

      // 底部
      for (let bz = minZ; bz <= maxZ; bz++) {
        if (!this.isObsidian(minX, minY, bz)) return false
      }
      // 顶部
      for (let bz = minZ; bz <= maxZ; bz++) {
        if (!this.isObsidian(minX, maxY, bz)) return false
      }
      // 左右两列
      for (let by = minY; by <= maxY; by++) {
        if (!this.isObsidian(minX, by, minZ)) return false
        if (!this.isObsidian(minX, by, maxZ)) return false
      }

      // 检查内部是空气
      for (let bz = minZ + 1; bz < maxZ; bz++) {
        for (let by = minY + 1; by < maxY; by++) {
          const b = this.chunkManager.getBlock(minX, by, bz)
          if (b !== BlockType.AIR && b !== BlockType.NETHER_PORTAL) return false
        }
      }
      return true
    }
  }

  private isObsidian(x: number, y: number, z: number): boolean {
    return this.chunkManager.getBlock(x, y, z) === BlockType.OBSIDIAN
  }

  /**
   * 填充传送门框架内部为传送门方块
   */
  private fillNetherPortal(x: number, y: number, z: number, axis: 'x' | 'z'): void {
    if (axis === 'x') {
      // 找到框架边界
      let minX = x, maxX = x, minY = y, maxY = y
      while (minY > 0 && this.isObsidian(minX, minY - 1, z)) minY--
      while (maxY < 255 && this.isObsidian(minX, maxY + 1, z)) maxY++
      while (minX > 0 && this.isObsidian(minX - 1, minY, z)) minX--
      while (maxX < 255 && this.isObsidian(maxX + 1, minY, z)) maxX++

      // 填充内部
      for (let bx = minX + 1; bx < maxX; bx++) {
        for (let by = minY + 1; by < maxY; by++) {
          this.chunkManager.setBlock(bx, by, z, BlockType.NETHER_PORTAL)
        }
      }
    } else {
      let minZ = z, maxZ = z, minY = y, maxY = y
      while (minY > 0 && this.isObsidian(x, minY - 1, minZ)) minY--
      while (maxY < 255 && this.isObsidian(x, maxY + 1, minZ)) maxY++
      while (minZ > 0 && this.isObsidian(x, minY, minZ - 1)) minZ--
      while (maxZ < 255 && this.isObsidian(x, minY, maxZ + 1)) maxZ++

      for (let bz = minZ + 1; bz < maxZ; bz++) {
        for (let by = minY + 1; by < maxY; by++) {
          this.chunkManager.setBlock(x, by, bz, BlockType.NETHER_PORTAL)
        }
      }
    }
  }

  /**
   * 激活末地传送门框架（右键点击时放置末影之眼）
   */
  tryActivateEndPortalFrame(x: number, y: number, z: number): boolean {
    const block = this.chunkManager.getBlock(x, y, z)
    if (block !== BlockType.END_PORTAL_FRAME) return false

    // 简单处理：直接在这个位置生成末地传送门方块
    // 实际 MC 中需要 12 个框架都有末影之眼，这里简化为点击任意框架激活整个传送门
    this.chunkManager.setBlock(x, y, z, BlockType.END_PORTAL)

    // 检查附近是否有其他框架方块也激活它们
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        if (dx === 0 && dz === 0) continue
        if (this.chunkManager.getBlock(x + dx, y, z + dz) === BlockType.END_PORTAL_FRAME) {
          this.chunkManager.setBlock(x + dx, y, z + dz, BlockType.END_PORTAL)
        }
      }
    }
    return true
  }

  /**
   * 记录当前维度的玩家位置
   */
  savePosition(dimension: Dimension, pos: THREE.Vector3): void {
    this.dimensionPositions.set(dimension, pos.clone())
  }

  /**
   * 获取之前保存在某维度的位置
   */
  getSavedPosition(dimension: Dimension): THREE.Vector3 | null {
    return this.dimensionPositions.get(dimension) ?? null
  }

  dispose(): void {
    // nothing to dispose
  }
}
