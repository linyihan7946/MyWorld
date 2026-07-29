import { Entity } from './Entity'
import * as THREE from 'three'
import { GRAVITY, TERMINAL_VELOCITY } from '@/utils/constants'
import { ChunkManager } from '@/world/ChunkManager'
import { BlockType, isSolid } from '@/types/blocks'

/**
 * Character - 基础角色类
 * 包含AI、移动和行走动画逻辑
 */
export abstract class Character extends Entity {
  protected chunkManager: ChunkManager | null = null

  // AI state
  protected state: 'idle' | 'wander' | 'follow' | 'flee' | 'attack' = 'idle'
  protected stateTimer = 0
  protected targetPosition: THREE.Vector3 | null = null
  protected targetEntity: Entity | null = null

  // Walk animation — pivot groups (rotate these, not the meshes directly)
  protected walkClock = 0
  protected leftLeg: THREE.Object3D | null = null
  protected rightLeg: THREE.Object3D | null = null
  protected leftArm: THREE.Object3D | null = null
  protected rightArm: THREE.Object3D | null = null
  // Quadruped legs (animals)
  protected frontLeftLeg: THREE.Object3D | null = null
  protected frontRightLeg: THREE.Object3D | null = null
  protected backLeftLeg: THREE.Object3D | null = null
  protected backRightLeg: THREE.Object3D | null = null
  // Warden-specific effects
  protected chestCore: THREE.Mesh | null = null
  protected tendrils: THREE.Object3D[] = []

  protected constructor(
    id: string,
    health: number,
    attackDamage: number,
    width: number,
    height: number,
  ) {
    super(id, health, attackDamage, width, height)
  }

  setChunkManager(cm: ChunkManager): void {
    this.chunkManager = cm
  }

  update(dt: number): void {
    if (!this.isAlive) return

    // Update AI
    this.updateAI(dt)

    // Apply movement
    this.applyMovement(dt)

    // Apply gravity
    if (!this.onGround) {
      this.velocity.y += GRAVITY * dt
      this.velocity.y = Math.max(this.velocity.y, TERMINAL_VELOCITY)
    }

    // Simple collision
    if (this.chunkManager) {
      this.applyCollision(dt)
    }

    // Visual animations
    this.updateAnimations(dt)
  }

  /**
   * Drive all walk + creature-specific visual animations.
   * Called every frame from update().
   */
  protected updateAnimations(dt: number): void {
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2)

    if (speed > 0.3) {
      this.walkClock += dt * speed * 3
      const swing = Math.sin(this.walkClock) * 0.5

      // Humanoid legs
      if (this.leftLeg) this.leftLeg.rotation.x = swing
      if (this.rightLeg) this.rightLeg.rotation.x = -swing
      // Humanoid arms (opposite phase to legs)
      if (this.leftArm) this.leftArm.rotation.x = -swing
      if (this.rightArm) this.rightArm.rotation.x = swing

      // Quadruped legs — diagonal pairs swing together
      if (this.frontLeftLeg) this.frontLeftLeg.rotation.x = swing
      if (this.backRightLeg) this.backRightLeg.rotation.x = swing
      if (this.frontRightLeg) this.frontRightLeg.rotation.x = -swing
      if (this.backLeftLeg) this.backLeftLeg.rotation.x = -swing
    } else {
      // Ease back toward idle pose
      const decay = 0.82
      if (this.leftLeg) this.leftLeg.rotation.x *= decay
      if (this.rightLeg) this.rightLeg.rotation.x *= decay
      if (this.leftArm) this.leftArm.rotation.x *= decay
      if (this.rightArm) this.rightArm.rotation.x *= decay
      if (this.frontLeftLeg) this.frontLeftLeg.rotation.x *= decay
      if (this.frontRightLeg) this.frontRightLeg.rotation.x *= decay
      if (this.backLeftLeg) this.backLeftLeg.rotation.x *= decay
      if (this.backRightLeg) this.backRightLeg.rotation.x *= decay
    }

    // Warden: pulsing chest core
    if (this.chestCore) {
      const mat = this.chestCore.material as THREE.MeshLambertMaterial
      mat.emissiveIntensity = 0.4 + Math.sin(Date.now() * 0.004) * 0.5
    }

    // Warden: tendril sway
    if (this.tendrils.length > 0) {
      const t = Date.now() * 0.002
      this.tendrils.forEach((tendril, i) => {
        tendril.rotation.x = Math.sin(t + i * 0.6) * 0.18
        tendril.rotation.z = Math.cos(t * 0.8 + i * 0.6) * 0.12
      })
    }
  }

  protected abstract updateAI(dt: number): void

  /**
   * Public wrapper for animation updates — used by player character
   * which has its movement driven externally instead of via updateAI().
   */
  updateAnimationsPublic(dt: number): void {
    this.updateAnimations(dt)
  }

  protected applyMovement(dt: number): void {
    if (this.targetPosition) {
      const dir = new THREE.Vector3()
        .subVectors(this.targetPosition, this.position)
        .setY(0)

      if (dir.lengthSq() > 0.5) {
        dir.normalize()
        const speed = this.getMoveSpeed()
        this.velocity.x = dir.x * speed
        this.velocity.z = dir.z * speed
      } else {
        this.velocity.x = 0
        this.velocity.z = 0
        this.targetPosition = null
      }
    } else {
      this.velocity.x *= 0.8 // Friction
      this.velocity.z *= 0.8
    }
  }

  protected applyCollision(dt: number): void {
    if (!this.chunkManager) return

    const newPos = this.position.clone()

    // Move X
    newPos.x += this.velocity.x * dt
    if (this.collidesAt(newPos)) {
      newPos.x = this.position.x
      this.velocity.x = 0
    }

    // Move Y
    newPos.y += this.velocity.y * dt
    if (this.collidesAt(newPos)) {
      if (this.velocity.y < 0) this.onGround = true
      newPos.y = this.position.y
      this.velocity.y = 0
    } else {
      this.onGround = false
    }

    // Move Z
    newPos.z += this.velocity.z * dt
    if (this.collidesAt(newPos)) {
      newPos.z = this.position.z
      this.velocity.z = 0
    }

    this.position.copy(newPos)
  }

  private collidesAt(pos: THREE.Vector3): boolean {
    if (!this.chunkManager) return false
    const aabb = this.getAABB(pos)
    const minX = Math.floor(aabb.minX)
    const maxX = Math.floor(aabb.maxX)
    const minY = Math.floor(aabb.minY)
    const maxY = Math.floor(aabb.maxY)
    const minZ = Math.floor(aabb.minZ)
    const maxZ = Math.floor(aabb.maxZ)

    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        for (let x = minX; x <= maxX; x++) {
          const block = this.chunkManager.getBlock(x, y, z)
          if (block !== BlockType.AIR && block !== BlockType.WATER && isSolid(block)) {
            return true
          }
        }
      }
    }
    return false
  }

  protected getMoveSpeed(): number {
    return 2.0
  }

  /**
   * 创建简单的方块角色模型 (body + head + arms + legs with pivots).
   * Limb references are stored for walk animation.
   */
  protected createBlockModel(
    bodyColor: number,
    headColor: number,
    width: number,
    height: number,
  ): THREE.Group {
    const group = new THREE.Group()

    // Body
    const bodyGeo = new THREE.BoxGeometry(width, height * 0.5, width * 0.6)
    const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = height * 0.35
    group.add(body)

    // Head
    const headSize = width * 0.7
    const headGeo = new THREE.BoxGeometry(headSize, headSize, headSize)
    const headMat = new THREE.MeshLambertMaterial({ color: headColor })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = height * 0.75
    group.add(head)

    // Legs (pivot at hip so rotation looks natural)
    const legWidth = width * 0.25
    const legHeight = height * 0.35
    const legGeo = new THREE.BoxGeometry(legWidth, legHeight, legWidth)
    const legMat = new THREE.MeshLambertMaterial({ color: 0x333366 })

    const leftHip = new THREE.Group()
    leftHip.position.set(-width * 0.15, legHeight, 0)
    const leftLegMesh = new THREE.Mesh(legGeo, legMat)
    leftLegMesh.position.y = -legHeight / 2
    leftHip.add(leftLegMesh)
    group.add(leftHip)
    this.leftLeg = leftHip

    const rightHip = new THREE.Group()
    rightHip.position.set(width * 0.15, legHeight, 0)
    const rightLegMesh = new THREE.Mesh(legGeo, legMat)
    rightLegMesh.position.y = -legHeight / 2
    rightHip.add(rightLegMesh)
    group.add(rightHip)
    this.rightLeg = rightHip

    // Arms (pivot at shoulder)
    const armWidth = width * 0.25
    const armHeight = height * 0.45
    const armGeo = new THREE.BoxGeometry(armWidth, armHeight, armWidth)
    const armMat = new THREE.MeshLambertMaterial({ color: bodyColor })
    const shoulderY = height * 0.35 + height * 0.25 - armHeight / 2

    const leftShoulder = new THREE.Group()
    leftShoulder.position.set(-width / 2 - armWidth / 2, shoulderY + armHeight / 2, 0)
    const leftArmMesh = new THREE.Mesh(armGeo, armMat)
    leftArmMesh.position.y = -armHeight / 2
    leftShoulder.add(leftArmMesh)
    group.add(leftShoulder)
    this.leftArm = leftShoulder

    const rightShoulder = new THREE.Group()
    rightShoulder.position.set(width / 2 + armWidth / 2, shoulderY + armHeight / 2, 0)
    const rightArmMesh = new THREE.Mesh(armGeo, armMat)
    rightArmMesh.position.y = -armHeight / 2
    rightShoulder.add(rightArmMesh)
    group.add(rightShoulder)
    this.rightArm = rightShoulder

    return group
  }
}
