import * as THREE from 'three'
import { Chunk } from './Chunk'
import { WorldGenerator } from './WorldGenerator'
import { ChunkMesher } from '@/rendering/ChunkMesher'
import { CHUNK_HEIGHT, CHUNK_SIZE, RENDER_DISTANCE } from '@/utils/constants'
import { BlockType } from '@/types/blocks'
import type { Dimension } from '@/gameplay/PortalSystem'
import { DIMENSIONS } from './dimensions/Dimension'

interface ChunkMeshes {
  opaque: THREE.Mesh | null
  transparent: THREE.Mesh | null
}

export class ChunkManager {
  private chunks = new Map<string, Chunk>()
  private meshData = new Map<string, ChunkMeshes>()
  private scene: THREE.Scene
  private mesher: ChunkMesher
  private generator: WorldGenerator

  /** 当前维度 */
  public currentDimension: Dimension = 'overworld'

  private loadQueue: string[] = []
  private queuedLoads = new Set<string>()
  private maxLoadsPerFrame = 32  // 每帧最多加载 32 个新区块
  private lightSources = new Map<string, { position: THREE.Vector3; color: THREE.Color; chunkKey: string }>()

  // Flowing water stores a level from 1..7. Generated water and water placed by
  // the player have no entry and are treated as source blocks.
  private fluidLevels = new Map<string, number>()
  private fluidQueue: Array<{ x: number; y: number; z: number }> = []
  private queuedFluids = new Set<string>()
  private fluidAccumulator = 0

  /** 屏障方块可见性 - 只有手持屏障时才显示 */
  public showBarriers = false

  constructor(scene: THREE.Scene, mesher: ChunkMesher, generator: WorldGenerator) {
    this.scene = scene
    this.mesher = mesher
    this.generator = generator
  }

  async updateChunks(centerX: number, centerZ: number): Promise<void> {
    const renderDist = RENDER_DISTANCE
    const neededChunks = new Set<string>()

    const chunksToLoad: { key: string; dist: number }[] = []
    for (let dx = -renderDist; dx <= renderDist; dx++) {
      for (let dz = -renderDist; dz <= renderDist; dz++) {
        if (dx * dx + dz * dz > renderDist * renderDist) continue
        const key = this.chunkKey(centerX + dx, centerZ + dz)
        neededChunks.add(key)
        if (!this.chunks.has(key) && !this.queuedLoads.has(key)) {
          chunksToLoad.push({ key, dist: dx * dx + dz * dz })
        }
      }
    }

    // 丢弃玩家已经远离的排队任务，避免旧队列拖慢当前区块加载。
    this.loadQueue = this.loadQueue.filter(key => neededChunks.has(key))
    this.queuedLoads = new Set(this.loadQueue)

    chunksToLoad.sort((a, b) => a.dist - b.dist)
    for (const c of chunksToLoad) {
      this.loadQueue.push(c.key)
      this.queuedLoads.add(c.key)
    }

    for (const [key] of this.chunks) {
      if (!neededChunks.has(key)) {
        this.unloadChunk(key)
      }
    }

    let loaded = 0
    const maxLoad = this.chunks.size === 0 ? 128 : this.maxLoadsPerFrame
    while (this.loadQueue.length > 0 && loaded < maxLoad) {
      const key = this.loadQueue.shift()!
      this.queuedLoads.delete(key)
      if (!this.chunks.has(key)) {
        const [_dim, cx, cz] = this.parseChunkKey(key)
        this.loadChunk(cx, cz)
        loaded++
      }
    }

    this.rebuildDirtyMeshes()
  }

  private loadChunk(cx: number, cz: number): void {
    const key = this.chunkKey(cx, cz)
    if (this.chunks.has(key)) return
    const chunk = new Chunk(cx, cz)
    this.generator.generateChunk(chunk)
    this.chunks.set(key, chunk)
    this.scanChunkLights(chunk, key)
    this.markHorizontalNeighborsDirty(cx, cz)
  }

  private unloadChunk(key: string): void {
    const [_dim, cx, cz] = this.parseChunkKey(key)
    const meshes = this.meshData.get(key)
    if (meshes) {
      if (meshes.opaque) {
        this.scene.remove(meshes.opaque)
        this.mesher.disposeMesh(meshes.opaque)
      }
      if (meshes.transparent) {
        this.scene.remove(meshes.transparent)
        this.mesher.disposeMesh(meshes.transparent)
      }
      this.meshData.delete(key)
    }
    this.chunks.delete(key)
    for (const [lightKey, light] of this.lightSources) {
      if (light.chunkKey === key) this.lightSources.delete(lightKey)
    }
    // 相邻区块需要重新补出原来被剔除的边界面，否则会看到世界内部。
    this.markHorizontalNeighborsDirty(cx, cz)
  }

  private rebuildDirtyMeshes(maxRebuilds = 16): void {
    let rebuilt = 0

    for (const [key, chunk] of this.chunks) {
      if (!chunk.dirty || rebuilt >= maxRebuilds) continue

      const neighbors = this.getNeighbors(chunk)
      const result = this.mesher.generateMesh(chunk, neighbors, this.showBarriers)

      // Remove old meshes
      const old = this.meshData.get(key)
      if (old) {
        if (old.opaque) { this.scene.remove(old.opaque); this.mesher.disposeMesh(old.opaque) }
        if (old.transparent) { this.scene.remove(old.transparent); this.mesher.disposeMesh(old.transparent) }
      }

      // Add new meshes
      if (result.opaque) this.scene.add(result.opaque)
      if (result.transparent) this.scene.add(result.transparent)
      this.meshData.set(key, result)

      chunk.dirty = false
      rebuilt++
    }
  }

  /**
   * 仅重建脏网格，不重新计算区块加载（用于玩家未跨区块时的每帧刷新）
   */
  public rebuildDirtyOnly(): void {
    this.rebuildDirtyMeshes(16)
  }

  /**
   * 更新水面动画时间
   */
  updateAnimation(time: number): void {
    this.mesher.update(time)
  }

  updateDynamicLights(center: THREE.Vector3): void {
    const nearest = [...this.lightSources.values()]
      .map(light => ({ ...light, distanceSq: light.position.distanceToSquared(center) }))
      .filter(light => light.distanceSq <= 48 * 48)
      .sort((a, b) => a.distanceSq - b.distanceSq)
      .slice(0, 16)
    this.mesher.updateLights(nearest)
  }

  /**
   * 固定频率更新流体，限制每帧工作量，避免一片水造成卡顿。
   */
  updateFluids(deltaTime: number): void {
    this.fluidAccumulator += deltaTime
    if (this.fluidAccumulator < 0.12 || this.fluidQueue.length === 0) return
    this.fluidAccumulator %= 0.12

    let updates = 0
    while (this.fluidQueue.length > 0 && updates < 96) {
      const pos = this.fluidQueue.shift()!
      this.queuedFluids.delete(this.blockKey(pos.x, pos.y, pos.z))
      this.updateFluidCell(pos.x, pos.y, pos.z)
      updates++
    }

    // 流体一次可能改变多个方块；完成本批次后统一刷新网格（限制数量防止卡顿）
    this.rebuildDirtyMeshes(16)
  }

  private getNeighbors(chunk: Chunk): { px?: Chunk; nx?: Chunk; pz?: Chunk; nz?: Chunk } {
    return {
      px: this.chunks.get(this.chunkKey(chunk.chunkX + 1, chunk.chunkZ)),
      nx: this.chunks.get(this.chunkKey(chunk.chunkX - 1, chunk.chunkZ)),
      pz: this.chunks.get(this.chunkKey(chunk.chunkX, chunk.chunkZ + 1)),
      nz: this.chunks.get(this.chunkKey(chunk.chunkX, chunk.chunkZ - 1)),
    }
  }

  getBlock(worldX: number, worldY: number, worldZ: number): number {
    const cx = Math.floor(worldX / CHUNK_SIZE)
    const cz = Math.floor(worldZ / CHUNK_SIZE)
    const chunk = this.chunks.get(this.chunkKey(cx, cz))
    if (!chunk) return BlockType.AIR
    const lx = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
    const lz = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
    return chunk.getBlock(lx, worldY, lz)
  }

  setBlock(worldX: number, worldY: number, worldZ: number, type: number): void {
    const x = Math.floor(worldX)
    const y = Math.floor(worldY)
    const z = Math.floor(worldZ)
    if (!this.writeBlock(x, y, z, type as BlockType)) return

    this.enqueueFluidAround(x, y, z)

    // 当前区块与边界相邻区块一起立即刷新，避免边界方块残影。
    const cx = Math.floor(x / CHUNK_SIZE)
    const cz = Math.floor(z / CHUNK_SIZE)
    this.rebuildDirtyAround(cx, cz)
  }

  private writeBlock(
    worldX: number,
    worldY: number,
    worldZ: number,
    type: BlockType,
    flowLevel?: number,
  ): boolean {
    if (worldY < 0 || worldY >= CHUNK_HEIGHT) return false

    const cx = Math.floor(worldX / CHUNK_SIZE)
    const cz = Math.floor(worldZ / CHUNK_SIZE)
    const chunk = this.chunks.get(this.chunkKey(cx, cz))
    if (!chunk) return false

    const lx = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
    const lz = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
    const previous = chunk.getBlock(lx, worldY, lz) as BlockType
    const key = this.blockKey(worldX, worldY, worldZ)

    if (previous === type) {
      if (type !== BlockType.WATER || flowLevel === undefined) return false
      const oldLevel = this.fluidLevels.get(key)
      // A source (no level) must never be weakened by flowing water.
      if (oldLevel === undefined || oldLevel <= flowLevel) return false
      this.fluidLevels.set(key, flowLevel)
      return true
    }

    chunk.setBlock(lx, worldY, lz, type)
    if (this.isLightBlock(previous)) this.lightSources.delete(key)
    if (this.isLightBlock(type)) this.registerLight(worldX, worldY, worldZ, type, this.chunkKey(cx, cz))
    if (type === BlockType.WATER && flowLevel !== undefined) {
      this.fluidLevels.set(key, flowLevel)
    } else {
      this.fluidLevels.delete(key)
    }

    if (lx === 0) this.markDirty(cx - 1, cz)
    if (lx === CHUNK_SIZE - 1) this.markDirty(cx + 1, cz)
    if (lz === 0) this.markDirty(cx, cz - 1)
    if (lz === CHUNK_SIZE - 1) this.markDirty(cx, cz + 1)
    return true
  }

  private updateFluidCell(x: number, y: number, z: number): void {
    if (y < 0 || y >= CHUNK_HEIGHT) return

    const type = this.getBlock(x, y, z) as BlockType
    if (type !== BlockType.AIR && type !== BlockType.WATER) return

    const key = this.blockKey(x, y, z)
    let level = type === BlockType.WATER ? (this.fluidLevels.get(key) ?? 0) : Infinity

    // Flowing blocks disappear or weaken when their supplying water is gone.
    if (type === BlockType.WATER && this.fluidLevels.has(key)) {
      const suppliedLevel = this.findSuppliedFluidLevel(x, y, z)
      if (suppliedLevel === null) {
        if (this.writeBlock(x, y, z, BlockType.AIR)) this.enqueueFluidAround(x, y, z)
        return
      }
      if (suppliedLevel !== level) {
        this.fluidLevels.set(key, suppliedLevel)
        level = suppliedLevel
      }
    }

    if (type === BlockType.AIR) {
      const suppliedLevel = this.findSuppliedFluidLevel(x, y, z)
      if (suppliedLevel === null) return
      if (!this.writeBlock(x, y, z, BlockType.WATER, suppliedLevel)) return
      level = suppliedLevel
    }

    // Water falls first; only spread sideways when it cannot fall.
    if (this.getBlock(x, y - 1, z) === BlockType.AIR) {
      const fallingLevel = Math.max(1, level)
      if (this.writeBlock(x, y - 1, z, BlockType.WATER, fallingLevel)) {
        this.enqueueFluidAround(x, y - 1, z)
      }
      return
    }

    if (level >= 7) return
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx
      const nz = z + dz
      if (this.getBlock(nx, y, nz) !== BlockType.AIR) continue
      if (this.writeBlock(nx, y, nz, BlockType.WATER, level + 1)) {
        this.enqueueFluidAround(nx, y, nz)
      }
    }
  }

  private findSuppliedFluidLevel(x: number, y: number, z: number): number | null {
    if (this.getBlock(x, y + 1, z) === BlockType.WATER) {
      return Math.max(1, this.getFluidLevel(x, y + 1, z))
    }

    let best = Infinity
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (this.getBlock(x + dx, y, z + dz) !== BlockType.WATER) continue
      best = Math.min(best, this.getFluidLevel(x + dx, y, z + dz) + 1)
    }
    return best <= 7 ? best : null
  }

  private getFluidLevel(x: number, y: number, z: number): number {
    return this.fluidLevels.get(this.blockKey(x, y, z)) ?? 0
  }

  private enqueueFluidAround(x: number, y: number, z: number): void {
    const positions = [
      [x, y, z], [x, y + 1, z], [x, y - 1, z],
      [x + 1, y, z], [x - 1, y, z], [x, y, z + 1], [x, y, z - 1],
    ]
    for (const [px, py, pz] of positions) {
      if (py < 0 || py >= CHUNK_HEIGHT) continue
      const key = this.blockKey(px, py, pz)
      if (this.queuedFluids.has(key)) continue
      this.queuedFluids.add(key)
      this.fluidQueue.push({ x: px, y: py, z: pz })
    }
  }

  /**
   * 立即重建单个区块的网格
   */
  private rebuildChunkMesh(chunk: Chunk): void {
    const key = this.chunkKey(chunk.chunkX, chunk.chunkZ)
    if (!chunk.dirty) return

    const neighbors = this.getNeighbors(chunk)
    const result = this.mesher.generateMesh(chunk, neighbors, this.showBarriers)

    // Remove old meshes
    const old = this.meshData.get(key)
    if (old) {
      if (old.opaque) { this.scene.remove(old.opaque); this.mesher.disposeMesh(old.opaque) }
      if (old.transparent) { this.scene.remove(old.transparent); this.mesher.disposeMesh(old.transparent) }
    }

    // Add new meshes
    if (result.opaque) this.scene.add(result.opaque)
    if (result.transparent) this.scene.add(result.transparent)
    this.meshData.set(key, result)

    chunk.dirty = false
  }

  private rebuildDirtyAround(cx: number, cz: number): void {
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const chunk = this.chunks.get(this.chunkKey(cx + dx, cz + dz))
      if (chunk?.dirty) this.rebuildChunkMesh(chunk)
    }
  }

  /**
   * 红石能量变化等外部触发: 立即重建指定区块 (及其水平邻居) 的网格,
   * 用于让粉尘点亮状态即时反映到渲染。
   */
  public rebuildMeshesAt(cx: number, cz: number): void {
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const chunk = this.chunks.get(this.chunkKey(cx + dx, cz + dz))
      if (chunk) chunk.dirty = true
    }
    this.rebuildDirtyAround(cx, cz)
  }

  /** 标记世界坐标处方块所在区块为dirty (用于方块状态变更后触发重建) */
  public markBlockDirty(worldX: number, _worldY: number, worldZ: number): void {
    const cx = Math.floor(worldX / CHUNK_SIZE)
    const cz = Math.floor(worldZ / CHUNK_SIZE)
    this.markDirty(cx, cz)
    this.markHorizontalNeighborsDirty(cx, cz)
  }

  /** 标记所有已加载区块为dirty (用于全局渲染条件变更，如屏障可见性切换) */
  public markAllDirty(): void {
    for (const [, chunk] of this.chunks) {
      chunk.dirty = true
    }
  }

  private markDirty(cx: number, cz: number): void {
    const chunk = this.chunks.get(this.chunkKey(cx, cz))
    if (chunk) chunk.dirty = true
  }

  private markHorizontalNeighborsDirty(cx: number, cz: number): void {
    this.markDirty(cx + 1, cz)
    this.markDirty(cx - 1, cz)
    this.markDirty(cx, cz + 1)
    this.markDirty(cx, cz - 1)
  }

  private scanChunkLights(chunk: Chunk, chunkKey: string): void {
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const type = chunk.getBlock(x, y, z) as BlockType
          if (!this.isLightBlock(type)) continue
          this.registerLight(chunk.chunkX * CHUNK_SIZE + x, y, chunk.chunkZ * CHUNK_SIZE + z, type, chunkKey)
        }
      }
    }
  }

  private registerLight(x: number, y: number, z: number, type: BlockType, chunkKey: string): void {
    const soul = type === BlockType.SOUL_TORCH || type === BlockType.SOUL_LANTERN
    const color = soul ? new THREE.Color(0x55dff7) : new THREE.Color(0xffb347)
    this.lightSources.set(this.blockKey(x, y, z), {
      position: new THREE.Vector3(x + 0.5, y + 0.65, z + 0.5), color, chunkKey,
    })
  }

  private isLightBlock(type: BlockType): boolean {
    return type === BlockType.TORCH || type === BlockType.SOUL_TORCH ||
      type === BlockType.LANTERN || type === BlockType.SOUL_LANTERN ||
      type === BlockType.GLOWSTONE || type === BlockType.SEA_LANTERN
  }

  getHeightAt(worldX: number, worldZ: number, maxSearchY?: number): number {
    const startY = maxSearchY ?? (CHUNK_HEIGHT - 1)
    for (let y = startY; y >= 0; y--) {
      const block = this.getBlock(worldX, y, worldZ)
      if (block !== BlockType.AIR && block !== BlockType.WATER) return y + 1
    }
    return 64
  }

  raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDist: number): {
    position: THREE.Vector3
    normal: THREE.Vector3
    blockType: number
    distance: number
  } | null {
    const step = new THREE.Vector3(
      direction.x >= 0 ? 1 : -1,
      direction.y >= 0 ? 1 : -1,
      direction.z >= 0 ? 1 : -1,
    )
    let x = Math.floor(origin.x)
    let y = Math.floor(origin.y)
    let z = Math.floor(origin.z)
    const axisDelta = (component: number) => Math.abs(component) < 1e-10 ? Infinity : Math.abs(1 / component)
    const tDelta = new THREE.Vector3(axisDelta(direction.x), axisDelta(direction.y), axisDelta(direction.z))
    const firstBoundary = (component: number, coordinate: number, cell: number, delta: number) => {
      if (!Number.isFinite(delta)) return Infinity
      return component > 0 ? (cell + 1 - coordinate) * delta : (coordinate - cell) * delta
    }
    const tMax = new THREE.Vector3(
      firstBoundary(direction.x, origin.x, x, tDelta.x),
      firstBoundary(direction.y, origin.y, y, tDelta.y),
      firstBoundary(direction.z, origin.z, z, tDelta.z),
    )
    let normal = new THREE.Vector3(0, 0, 0)
    let dist = 0
    while (dist < maxDist) {
      const block = this.getBlock(x, y, z)
      if (block !== BlockType.AIR && block !== BlockType.WATER) {
        return { position: new THREE.Vector3(x, y, z), normal: normal.clone(), blockType: block, distance: dist }
      }
      if (tMax.x < tMax.y && tMax.x < tMax.z) {
        x += step.x; dist = tMax.x; tMax.x += tDelta.x; normal.set(-step.x, 0, 0)
      } else if (tMax.y < tMax.z) {
        y += step.y; dist = tMax.y; tMax.y += tDelta.y; normal.set(0, -step.y, 0)
      } else {
        z += step.z; dist = tMax.z; tMax.z += tDelta.z; normal.set(0, 0, -step.z)
      }
    }
    return null
  }

  private chunkKey(cx: number, cz: number): string { return `${this.currentDimension}:${cx},${cz}` }
  private blockKey(x: number, y: number, z: number): string { return `${x},${y},${z}` }
  private parseChunkKey(key: string): [string, number, number] {
    // 格式: "dimension:cx,cz"
    const colonIdx = key.indexOf(':')
    const dim = key.slice(0, colonIdx)
    const [cx, cz] = key.slice(colonIdx + 1).split(',').map(Number)
    return [dim, cx, cz]
  }

  /**
   * 卸载当前维度的所有区块（保留区块数据不销毁，仅从场景移除网格）
   */
  private unloadAllChunks(): void {
    for (const [key] of this.chunks) {
      const meshes = this.meshData.get(key)
      if (meshes) {
        if (meshes.opaque) {
          this.scene.remove(meshes.opaque)
          this.mesher.disposeMesh(meshes.opaque)
        }
        if (meshes.transparent) {
          this.scene.remove(meshes.transparent)
          this.mesher.disposeMesh(meshes.transparent)
        }
        this.meshData.delete(key)
      }
    }
    // 清除光源（它们会在新维度的区块加载时重新扫描）
    this.lightSources.clear()
    // 清除流体队列（维度间流体不应跨维度流动）
    this.fluidLevels.clear()
    this.fluidQueue = []
    this.queuedFluids.clear()
    this.loadQueue = []
    this.queuedLoads.clear()
  }

  /**
   * 切换到目标维度：卸载当前区块，切换维度，然后加载新维度的区块
   */
  async switchDimension(targetDimension: Dimension, spawnX: number, spawnZ: number): Promise<void> {
    // 卸载旧维度的网格（保留区块数据在内存中以便返回时恢复）
    this.unloadAllChunks()
    // 切换维度（chunkKey 会自动使用新维度前缀）
    this.currentDimension = targetDimension
    // 更新 WorldGenerator 的维度
    this.generator.setDimension(targetDimension)
    // 加载新维度的区块
    const cx = Math.floor(spawnX / CHUNK_SIZE)
    const cz = Math.floor(spawnZ / CHUNK_SIZE)
    await this.updateChunks(cx, cz)
    // ★ 强制重建所有已加载区块的网格（updateChunks 默认只重建3个）
    this.rebuildDirtyMeshes(999)
  }

  dispose(): void {
    for (const [key] of this.meshData) {
      this.unloadChunk(key)
    }
    this.chunks.clear()
  }
}
