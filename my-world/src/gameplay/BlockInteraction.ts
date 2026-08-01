import * as THREE from 'three'
import { ChunkManager } from '@/world/ChunkManager'
import { BlockType, isBreakable, isSolid, getBlockDefinition } from '@/types/blocks'
import { DEFAULT_BREAK_HITS } from '@/utils/constants'
import { EventBus } from '@/core/EventBus'
import { calculateHitsNeeded, canHarvestDrop, shouldConsumeDurability, getMiningSpeed } from './MiningMechanics'
import { getItemDefinition } from '@/types/items'
import { useInventoryStore } from '@/ui/stores/inventoryStore'
import { getEnchantLevel } from './EnchantmentSystem'

/**
 * BlockInteraction - 方块交互系统
 * 处理挖矿（1:1 Minecraft 速度）和放方块
 */
export class BlockInteraction {
  private chunkManager: ChunkManager
  private eventBus: EventBus

  // Current target
  private targetBlock: THREE.Vector3 | null = null
  private targetNormal: THREE.Vector3 | null = null
  private breakProgress = 0
  private lastBreakBlock: THREE.Vector3 | null = null
  private cameraDirection = new THREE.Vector3(0, 0, -1)

  // Mining mechanics
  private cachedHitsNeeded = DEFAULT_BREAK_HITS
  private cachedToolId: string | null = null
  private cachedBlockType: BlockType | null = null

  // Highlight mesh
  private highlightMesh: THREE.LineSegments

  constructor(chunkManager: ChunkManager, eventBus: EventBus, scene: THREE.Scene) {
    this.chunkManager = chunkManager
    this.eventBus = eventBus

    // Create wireframe highlight for targeted block
    const highlightGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.005, 1.005, 1.005))
    const highlightMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
    this.highlightMesh = new THREE.LineSegments(highlightGeo, highlightMat)
    this.highlightMesh.visible = false
    scene.add(this.highlightMesh)
  }

  /** 获取当前手持物品 ID */
  private getHeldTool(): string | null {
    const inv = useInventoryStore()
    const slot = inv.hotbar[inv.selectedSlot]
    return slot?.item ?? null
  }

  /**
   * 每帧更新：射线检测目标方块
   */
  update(cameraPosition: THREE.Vector3, cameraDirection: THREE.Vector3): void {
    this.cameraDirection.copy(cameraDirection)
    const hit = this.chunkManager.raycast(cameraPosition, cameraDirection, 6)

    if (hit) {
      this.targetBlock = hit.position
      this.targetNormal = hit.normal

      // Update highlight position
      this.highlightMesh.position.set(
        hit.position.x + 0.5,
        hit.position.y + 0.5,
        hit.position.z + 0.5,
      )
      this.highlightMesh.visible = true

      // Reset break progress if target changed OR tool changed OR block type changed
      const currentTool = this.getHeldTool()
      const hitBlockType = this.chunkManager.getBlock(hit.position.x, hit.position.y, hit.position.z) as BlockType
      const posChanged = !this.lastBreakBlock || !this.lastBreakBlock.equals(hit.position)
      const typeChanged = hitBlockType !== this.cachedBlockType
      const toolChanged = currentTool !== this.cachedToolId

      if (posChanged || typeChanged || toolChanged) {
        this.breakProgress = 0
        this.lastBreakBlock = hit.position.clone()
        this.cachedToolId = currentTool
        this.cachedBlockType = hitBlockType

        if (hitBlockType !== BlockType.AIR && hitBlockType !== BlockType.WATER && isBreakable(hitBlockType)) {
          this.cachedHitsNeeded = calculateHitsNeeded(hitBlockType, currentTool)
        } else {
          this.cachedHitsNeeded = DEFAULT_BREAK_HITS
        }
      }
    } else {
      this.targetBlock = null
      this.targetNormal = null
      this.highlightMesh.visible = false
      this.breakProgress = 0
      this.lastBreakBlock = null
      this.cachedBlockType = null
    }
  }

  /**
   * 击打方块（左键）
   * @param instant 是否瞬间破坏（创造模式）
   */
  breakHit(instant = false, creativeBoost = false): { breaking: boolean; progress: number; canHarvest: boolean } {
    if (!this.targetBlock) return { breaking: false, progress: 0, canHarvest: false }

    const blockType = this.chunkManager.getBlock(
      this.targetBlock.x,
      this.targetBlock.y,
      this.targetBlock.z,
    )

    if (blockType === BlockType.AIR || blockType === BlockType.WATER) {
      return { breaking: false, progress: 0, canHarvest: false }
    }

    if (!isBreakable(blockType)) {
      return { breaking: false, progress: 0, canHarvest: false }
    }

    const heldTool = this.getHeldTool()
    const harvest = canHarvestDrop(blockType as BlockType, heldTool, instant || creativeBoost)

    // 遗留下来的瞬间破坏模式
    if (instant && !creativeBoost) {
      this.chunkManager.setBlock(this.targetBlock.x, this.targetBlock.y, this.targetBlock.z, BlockType.AIR)
      this.eventBus.emit('block:broke', {
        position: this.targetBlock.clone(),
        blockType: blockType,
        canHarvest: true,
      })
      this.breakProgress = 0
      this.lastBreakBlock = null
      this.cachedBlockType = null
      return { breaking: false, progress: 0, canHarvest: true }
    }

    // Increment break progress (Efficiency enchantment speeds up mining)
    const inv = useInventoryStore()
    const slot = inv.hotbar[inv.selectedSlot]
    const effLvl = getEnchantLevel(slot?.enchantments, 'efficiency')
    const creativeMult = creativeBoost ? 8.0 : 1.0
    const hitPower = (1 + effLvl * 0.3) * creativeMult
    this.breakProgress += hitPower
    const hitsNeeded = Math.max(1, this.cachedHitsNeeded)
    const progress = this.breakProgress / hitsNeeded

    // Check if block is fully broken
    if (this.breakProgress >= hitsNeeded) {
      // Consume tool durability
      if (shouldConsumeDurability(blockType as BlockType, heldTool)) {
        this.consumeToolDurability()
      }

      this.chunkManager.setBlock(this.targetBlock.x, this.targetBlock.y, this.targetBlock.z, BlockType.AIR)
      this.eventBus.emit('block:broke', {
        position: this.targetBlock.clone(),
        blockType: blockType,
        canHarvest: harvest,
      })
      this.breakProgress = 0
      this.lastBreakBlock = null
      this.cachedBlockType = null
      return { breaking: false, progress: 0, canHarvest: harvest }
    }

    return { breaking: true, progress, canHarvest: harvest }
  }

  /** 消耗当前手持工具的 1 点耐久（Unbreaking 有几率不消耗） */
  private consumeToolDurability(): void {
    const inv = useInventoryStore()
    const slot = inv.hotbar[inv.selectedSlot]
    if (!slot?.item) return

    const itemDef = getItemDefinition(slot.item)
    if (!itemDef || !itemDef.durability) return

    // Unbreaking: (level / (level+1)) chance to skip durability cost
    const unbLvl = getEnchantLevel(slot.enchantments, 'unbreaking')
    const saveChance = unbLvl / (unbLvl + 1)
    if (Math.random() < saveChance) return

    if (!slot.durabilityDamage) slot.durabilityDamage = 0
    slot.durabilityDamage++

    if (slot.durabilityDamage >= itemDef.durability) {
      // Tool is broken - remove it
      slot.item = null
      slot.count = 0
      slot.durabilityDamage = 0
    }
  }

  /**
   * 放置方块（右键）
   */
  placeBlock(selectedBlockType: BlockType, playerAABB: {
    minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number
  }): boolean {
    if (!this.targetBlock || !this.targetNormal) return false

    const placePos = this.targetBlock.clone().add(this.targetNormal)

    // Check: position must be empty
    const existingBlock = this.chunkManager.getBlock(placePos.x, placePos.y, placePos.z)
    if (existingBlock !== BlockType.AIR && existingBlock !== BlockType.WATER) return false

    // Check: must be adjacent to existing solid block
    if (!this.hasAdjacentSolid(placePos)) return false

    // Floor-mounted redstone parts cannot float or attach to walls/ceilings.
    if ((selectedBlockType === BlockType.REDSTONE_DUST || selectedBlockType === BlockType.REPEATER || selectedBlockType === BlockType.COMPARATOR) &&
      !isSolid(this.chunkManager.getBlock(placePos.x, placePos.y - 1, placePos.z) as BlockType)) return false

    // 箱子最多只能与一个相邻箱子组成双箱，避免三箱共享同一库存。
    if (selectedBlockType === BlockType.CHEST && !this.canPlaceChest(placePos)) return false

    // Check: can't overlap with player
    const blockMinX = placePos.x
    const blockMaxX = placePos.x + 1
    const blockMinY = placePos.y
    const blockMaxY = placePos.y + 1
    const blockMinZ = placePos.z
    const blockMaxZ = placePos.z + 1

    if (
      blockMinX < playerAABB.maxX && blockMaxX > playerAABB.minX &&
      blockMinY < playerAABB.maxY && blockMaxY > playerAABB.minY &&
      blockMinZ < playerAABB.maxZ && blockMaxZ > playerAABB.minZ
    ) {
      return false
    }

    this.chunkManager.setBlock(placePos.x, placePos.y, placePos.z, selectedBlockType)
    this.eventBus.emit('block:placed', {
      position: placePos.clone(),
      blockType: selectedBlockType,
      facing: selectedBlockType === BlockType.PISTON || selectedBlockType === BlockType.STICKY_PISTON || selectedBlockType === BlockType.OBSERVER
        ? this.getPlacementFacing()
        : this.getHorizontalFacing(),
      attachedFace: this.targetNormal.clone(),
    })
    return true
  }

  /**
   * 获取水平朝向：方块正面朝向玩家正在看的方向（与相机朝向一致）
   * e.g. 玩家看东(＋X) → 返回 (1,0,0)，活塞头朝东推出
   */
  private getHorizontalFacing(): THREE.Vector3 {
    if (Math.abs(this.cameraDirection.x) > Math.abs(this.cameraDirection.z)) {
      return new THREE.Vector3(this.cameraDirection.x > 0 ? 1 : -1, 0, 0)
    }
    return new THREE.Vector3(0, 0, this.cameraDirection.z > 0 ? 1 : -1)
  }

  /**
   * 获取放置朝向（活塞/侦测器专用）：
   * 优先检查垂直方向——玩家俯视/仰视时活塞朝上/朝下；
   * 否则使用水平朝向。
   */
  private getPlacementFacing(): THREE.Vector3 {
    if (Math.abs(this.cameraDirection.y) > Math.max(Math.abs(this.cameraDirection.x), Math.abs(this.cameraDirection.z))) {
      return new THREE.Vector3(0, this.cameraDirection.y > 0 ? 1 : -1, 0)
    }
    return this.getHorizontalFacing()
  }

  /**
   * 检查位置是否相邻至少一个固体方块
   */
  private hasAdjacentSolid(pos: THREE.Vector3): boolean {
    const dirs = [
      [1, 0, 0], [-1, 0, 0],
      [0, 1, 0], [0, -1, 0],
      [0, 0, 1], [0, 0, -1],
    ]

    for (const [dx, dy, dz] of dirs) {
      const block = this.chunkManager.getBlock(pos.x + dx, pos.y + dy, pos.z + dz)
      if (block !== BlockType.AIR && block !== BlockType.WATER && isSolid(block)) {
        return true
      }
    }
    return false
  }

  private canPlaceChest(pos: THREE.Vector3): boolean {
    const horizontal = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    const adjacentChests = horizontal.filter(([dx, dz]) => (
      this.chunkManager.getBlock(pos.x + dx, pos.y, pos.z + dz) === BlockType.CHEST
    ))
    if (adjacentChests.length > 1) return false

    for (const [dx, dz] of adjacentChests) {
      const neighborX = pos.x + dx
      const neighborZ = pos.z + dz
      const alreadyPaired = horizontal.some(([ndx, ndz]) => {
        const x = neighborX + ndx
        const z = neighborZ + ndz
        if (x === pos.x && z === pos.z) return false
        return this.chunkManager.getBlock(x, pos.y, z) === BlockType.CHEST
      })
      if (alreadyPaired) return false
    }
    return true
  }

  /**
   * 获取当前破坏进度
   */
  getBreakProgress(): number {
    return this.breakProgress / DEFAULT_BREAK_HITS
  }

  getTargetBlock(): { position: THREE.Vector3; blockType: BlockType } | null {
    if (!this.targetBlock) return null
    const blockType = this.chunkManager.getBlock(
      this.targetBlock.x,
      this.targetBlock.y,
      this.targetBlock.z,
    ) as BlockType
    if (blockType === BlockType.AIR) return null
    return { position: this.targetBlock.clone(), blockType }
  }

  /** 获取目标方块相邻的空气位置（用于传送门激活等场景） */
  getAdjacentPlacementPos(): THREE.Vector3 | null {
    if (!this.targetBlock || !this.targetNormal) return null
    const pos = this.targetBlock.clone().add(this.targetNormal)
    // 确保相邻位置确实在可达范围内
    if (pos.y < 0 || pos.y >= 256) return null
    return pos
  }

  dispose(): void {
    this.highlightMesh.geometry.dispose()
    if (this.highlightMesh.material instanceof THREE.Material) {
      this.highlightMesh.material.dispose()
    }
  }
}
