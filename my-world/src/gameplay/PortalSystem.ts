import * as THREE from 'three'
import { ChunkManager } from '@/world/ChunkManager'
import { BlockType } from '@/types/blocks'

export type Dimension = 'overworld' | 'nether' | 'end'

/**
 * 框架数据结构
 */
interface FrameRect {
  minW: number; maxW: number  // 水平轴边界
  minY: number; maxY: number  // 垂直轴边界
  fixed: number               // 固定轴坐标
  axis: 'x' | 'z'             // 朝向
}

/**
 * PortalSystem - 传送门系统 (Minecraft 1:1)
 *
 * 框架检测算法：
 * 1. 从被点击的黑曜石出发，沿框架平面四个方向追踪
 * 2. 找到完整的黑曜石矩形边框
 * 3. 验证边框完整性 + 内部为空气
 * 4. 填充传送门方块
 *
 * Minecraft 1:1 规范：
 * - 最小框架: 4×5 (内部 2×3)
 * - 最大框架: 23×23 (内部 21×21)
 * - 传送延迟: 4 秒 (80 ticks)
 */
export class PortalSystem {
  private chunkManager: ChunkManager

  public currentDimension: Dimension = 'overworld'

  private teleportCooldown = 0
  private inPortalTimer = 0
  private readonly PORTAL_DELAY = 4 // Minecraft: 4 秒传送延迟

  private dimensionPositions: Map<Dimension, THREE.Vector3> = new Map()

  // 框架尺寸限制 (Minecraft 1:1)
  private readonly MIN_FRAME = 4   // 最小外框 4×5
  private readonly MAX_FRAME = 23  // 最大外框 23×23

  constructor(chunkManager: ChunkManager) {
    this.chunkManager = chunkManager
  }

  // ═══════════════════════════════════════════════════════════════
  // 每帧更新
  // ═══════════════════════════════════════════════════════════════

  update(
    playerPos: THREE.Vector3,
    dt: number,
  ): { shouldTeleport: boolean; targetDimension: Dimension } | null {
    if (this.teleportCooldown > 0) {
      this.teleportCooldown -= dt
      this.inPortalTimer = 0
      return null
    }

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
        this.teleportCooldown = 5

        const targetDimension: Dimension = inNetherPortal
          ? (this.currentDimension === 'nether' ? 'overworld' : 'nether')
          : (this.currentDimension === 'end' ? 'overworld' : 'end')

        return { shouldTeleport: true, targetDimension }
      }
    } else {
      this.inPortalTimer = 0
    }

    return null
  }

  getPortalProgress(): number {
    return Math.min(1, this.inPortalTimer / this.PORTAL_DELAY)
  }

  // ═══════════════════════════════════════════════════════════════
  // 传送门激活
  // ═══════════════════════════════════════════════════════════════

  /**
   * 尝试激活地狱传送门
   * 点击黑曜石框架上的任意黑曜石方块触发
   */
  tryActivateNetherPortal(clickX: number, clickY: number, clickZ: number): boolean {
    const block = this.chunkManager.getBlock(clickX, clickY, clickZ)

    // 必须点击黑曜石
    if (block !== BlockType.OBSIDIAN && block !== BlockType.CRYING_OBSIDIAN) return false

    // 尝试在 X 平面 (Z 固定) 找框架
    const xFrame = this.detectFrameInXPlane(clickX, clickY, clickZ)
    if (xFrame) {
      this.fillPortalBlocks(xFrame)
      return true
    }

    // 尝试在 Z 平面 (X 固定) 找框架
    const zFrame = this.detectFrameInZPlane(clickX, clickY, clickZ)
    if (zFrame) {
      this.fillPortalBlocks(zFrame)
      return true
    }

    return false
  }

  /**
   * 在 X 平面 (固定 Z) 检测传送门框架
   * 从被点击的黑曜石出发，追踪完整的黑曜石矩形边框
   */
  private detectFrameInXPlane(ox: number, oy: number, oz: number): FrameRect | null {
    const isFrame = (x: number, y: number) => this.isObsidian(x, y, oz)

    let maxY = oy
    while (maxY < 255 && isFrame(ox, maxY + 1)) maxY++
    let minY = oy
    while (minY > 0 && isFrame(ox, minY - 1)) minY--

    const height = maxY - minY + 1
    if (height < this.MIN_FRAME || height > this.MAX_FRAME) return null

    let minX = ox
    while (minX > 0 && isFrame(minX - 1, minY)) minX--
    let maxX = ox
    while (maxX < 255 && isFrame(maxX + 1, minY)) maxX++

    let topMinX = ox
    while (topMinX > 0 && isFrame(topMinX - 1, maxY)) topMinX--
    let topMaxX = ox
    while (topMaxX < 255 && isFrame(topMaxX + 1, maxY)) topMaxX++

    minX = Math.min(minX, topMinX)
    maxX = Math.max(maxX, topMaxX)

    const width = maxX - minX + 1
    if (width < this.MIN_FRAME || width > this.MAX_FRAME) return null

    if (!this.validateFrameRect(minX, maxX, minY, maxY, oz, 'x')) return null

    return { minW: minX, maxW: maxX, minY, maxY, fixed: oz, axis: 'x' }
  }

  /**
   * 在 Z 平面 (固定 X) 检测传送门框架
   */
  private detectFrameInZPlane(ox: number, oy: number, oz: number): FrameRect | null {
    const isFrame = (z: number, y: number) =>
      this.isObsidian(ox, y, z)

    // 向上追踪顶部边界
    let maxY = oy
    while (maxY < 255 && isFrame(oz, maxY + 1)) maxY++

    // 向下追踪底部边界
    let minY = oy
    while (minY > 0 && isFrame(oz, minY - 1)) minY--

    const height = maxY - minY + 1
    if (height < this.MIN_FRAME || height > this.MAX_FRAME) return null

    // 沿底部追踪前后边界
    let minZ = oz
    while (minZ > 0 && isFrame(minZ - 1, minY)) minZ--

    let maxZ = oz
    while (maxZ < 255 && isFrame(maxZ + 1, minY)) maxZ++

    // 沿顶部验证宽度
    let topMinZ = oz
    while (topMinZ > 0 && isFrame(topMinZ - 1, maxY)) topMinZ--
    let topMaxZ = oz
    while (topMaxZ < 255 && isFrame(topMaxZ + 1, maxY)) topMaxZ++

    minZ = Math.min(minZ, topMinZ)
    maxZ = Math.max(maxZ, topMaxZ)

    const width = maxZ - minZ + 1
    if (width < this.MIN_FRAME || width > this.MAX_FRAME) return null

    if (!this.validateFrameRect(minZ, maxZ, minY, maxY, ox, 'z')) return null

    return { minW: minZ, maxW: maxZ, minY, maxY, fixed: ox, axis: 'z' }
  }

  /**
   * 验证矩形边框是否为完整的黑曜石框架 + 内部为空气
   */
  private validateFrameRect(
    minW: number, maxW: number,
    minY: number, maxY: number,
    fixed: number,
    axis: 'x' | 'z',
  ): boolean {
    // 验证底边和顶边全部是黑曜石
    for (let w = minW; w <= maxW; w++) {
      const [bx, bz] = axis === 'x' ? [w, fixed] : [fixed, w]
      if (!this.isObsidian(bx, minY, bz)) return false
      if (!this.isObsidian(bx, maxY, bz)) return false
    }

    // 验证左右两边全部是黑曜石
    for (let y = minY; y <= maxY; y++) {
      const [lx, lz] = axis === 'x' ? [minW, fixed] : [fixed, minW]
      const [rx, rz] = axis === 'x' ? [maxW, fixed] : [fixed, maxW]
      if (!this.isObsidian(lx, y, lz)) return false
      if (!this.isObsidian(rx, y, rz)) return false
    }

    // 验证内部全是空气（或已有传送门方块）
    for (let w = minW + 1; w < maxW; w++) {
      for (let y = minY + 1; y < maxY; y++) {
        const [bx, bz] = axis === 'x' ? [w, fixed] : [fixed, w]
        const block = this.chunkManager.getBlock(bx, y, bz)
        if (block !== BlockType.AIR && block !== BlockType.NETHER_PORTAL) return false
      }
    }

    return true
  }

  /**
   * 填充传送门方块
   */
  private fillPortalBlocks(frame: FrameRect): void {
    const { minW, maxW, minY, maxY, fixed, axis } = frame
    for (let w = minW + 1; w < maxW; w++) {
      for (let y = minY + 1; y < maxY; y++) {
        const [bx, bz] = axis === 'x' ? [w, fixed] : [fixed, w]
        this.chunkManager.setBlock(bx, y, bz, BlockType.NETHER_PORTAL)
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 末地传送门
  // ═══════════════════════════════════════════════════════════════

  tryActivateEndPortalFrame(x: number, y: number, z: number): boolean {
    const block = this.chunkManager.getBlock(x, y, z)
    if (block !== BlockType.END_PORTAL_FRAME) return false

    this.chunkManager.setBlock(x, y, z, BlockType.END_PORTAL)

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

  // ═══════════════════════════════════════════════════════════════
  // 工具方法
  // ═══════════════════════════════════════════════════════════════

  private isObsidian(x: number, y: number, z: number): boolean {
    const block = this.chunkManager.getBlock(x, y, z)
    return block === BlockType.OBSIDIAN || block === BlockType.CRYING_OBSIDIAN
  }

  savePosition(dimension: Dimension, pos: THREE.Vector3): void {
    this.dimensionPositions.set(dimension, pos.clone())
  }

  getSavedPosition(dimension: Dimension): THREE.Vector3 | null {
    return this.dimensionPositions.get(dimension) ?? null
  }

  dispose(): void {}
}
