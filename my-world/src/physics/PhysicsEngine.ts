import * as THREE from 'three'
import { ChunkManager } from '@/world/ChunkManager'
import { GRAVITY, TERMINAL_VELOCITY, PLAYER_WIDTH, PLAYER_HEIGHT } from '@/utils/constants'
import { BlockType, isSolid } from '@/types/blocks'

/**
 * PhysicsEngine - 物理引擎
 * 处理重力和碰撞检测
 */
export class PhysicsEngine {
  private chunkManager: ChunkManager

  constructor(chunkManager: ChunkManager) {
    this.chunkManager = chunkManager
  }

  /**
   * 更新实体物理
   */
  update(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    dt: number,
    onGround: boolean,
    gravityScale = 1,
  ): { position: THREE.Vector3; velocity: THREE.Vector3; onGround: boolean } {
    const newPos = position.clone()
    const newVel = velocity.clone()
    let newOnGround = onGround

    // Apply gravity
    if (!onGround && gravityScale > 0) {
      newVel.y += GRAVITY * gravityScale * dt
      newVel.y = Math.max(newVel.y, TERMINAL_VELOCITY)
    }

    // Move axis by axis with collision detection
    // X axis
    newPos.x += newVel.x * dt
    if (this.collidesWithWorld(newPos)) {
      newPos.x = position.x
      newVel.x = 0
    }

    // Y axis
    newPos.y += newVel.y * dt
    if (this.collidesWithWorld(newPos)) {
      if (newVel.y < 0) {
        newOnGround = true
      }
      newPos.y = position.y
      newVel.y = 0
    } else {
      newOnGround = false
    }

    // Z axis
    newPos.z += newVel.z * dt
    if (this.collidesWithWorld(newPos)) {
      newPos.z = position.z
      newVel.z = 0
    }

    return { position: newPos, velocity: newVel, onGround: newOnGround }
  }

  /**
   * 游泳时尝试越过一格高的岸沿。仅在水平移动被挡住时抬升玩家，
   * 不会让玩家借此穿过更高的墙。
   */
  trySwimStepUp(
    position: THREE.Vector3,
    horizontalVelocity: THREE.Vector3,
    dt: number,
    maxStepHeight = 1.25,
  ): THREE.Vector3 | null {
    const horizontalTarget = position.clone()
    horizontalTarget.x += horizontalVelocity.x * dt
    horizontalTarget.z += horizontalVelocity.z * dt

    if (!this.collidesWithWorld(horizontalTarget)) return null

    for (let step = 0.2; step <= maxStepHeight; step += 0.2) {
      const candidate = horizontalTarget.clone()
      candidate.y += step
      if (!this.collidesWithWorld(candidate)) return candidate
    }
    return null
  }

  /**
   * 检查实体是否与固体方块碰撞
   */
  private collidesWithWorld(position: THREE.Vector3): boolean {
    const halfWidth = PLAYER_WIDTH / 2
    const minX = Math.floor(position.x - halfWidth)
    const maxX = Math.floor(position.x + halfWidth)
    const minY = Math.floor(position.y)
    const maxY = Math.floor(position.y + PLAYER_HEIGHT)
    const minZ = Math.floor(position.z - halfWidth)
    const maxZ = Math.floor(position.z + halfWidth)

    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        for (let x = minX; x <= maxX; x++) {
          const block = this.chunkManager.getBlock(x, y, z)
          if (block !== BlockType.AIR && block !== BlockType.WATER) {
            if (isSolid(block)) {
              return true
            }
          }
        }
      }
    }

    return false
  }

  /**
   * 检查位置下方是否有地面
   */
  isOnGround(position: THREE.Vector3): boolean {
    const halfWidth = PLAYER_WIDTH / 2
    const y = Math.floor(position.y - 0.01)

    for (let z = Math.floor(position.z - halfWidth); z <= Math.floor(position.z + halfWidth); z++) {
      for (let x = Math.floor(position.x - halfWidth); x <= Math.floor(position.x + halfWidth); x++) {
        const block = this.chunkManager.getBlock(x, y, z)
        if (block !== BlockType.AIR && block !== BlockType.WATER && isSolid(block)) {
          return true
        }
      }
    }
    return false
  }
}
