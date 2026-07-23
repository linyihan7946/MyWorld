import { Character } from '../Character'
import * as THREE from 'three'

/**
 * Warden - 坚守者
 * 血量: 500, 攻击力: 很高 (30)
 */
export class Warden extends Character {
  private angerLevel = 0
  private sonarPulseTimer = 0

  constructor(id: string) {
    super(id, 500, 30, 0.9, 2.9)
    this.createModel()
  }

  private createModel(): void {
    const group = new THREE.Group()
    const bodyColor = 0x0A3B4F
    const glowColor = 0x22DDDD

    // Head
    const headGeo = new THREE.BoxGeometry(0.7, 0.5, 0.6)
    const headMat = new THREE.MeshLambertMaterial({ color: bodyColor })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = 2.5
    group.add(head)

    // Chest (glowing core) — stored for pulsing animation
    const chestGeo = new THREE.BoxGeometry(0.3, 0.3, 0.05)
    const chestMat = new THREE.MeshLambertMaterial({
      color: glowColor,
      emissive: glowColor,
      emissiveIntensity: 0.5,
    })
    const chest = new THREE.Mesh(chestGeo, chestMat)
    chest.position.set(0, 2.0, 0.33)
    group.add(chest)
    this.chestCore = chest

    // Body (tall, dark)
    const bodyGeo = new THREE.BoxGeometry(0.8, 1.5, 0.5)
    const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 1.4
    group.add(body)

    // Tendrils (head appendages) — stored for sway animation
    const tendrilGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1)
    const tendrilMat = new THREE.MeshLambertMaterial({ color: 0x0D5060 })
    this.tendrils = []
    for (let i = 0; i < 4; i++) {
      // Pivot at the base of each tendril (bottom)
      const tendrilPivot = new THREE.Group()
      tendrilPivot.position.set(-0.25 + i * 0.17, 2.75, 0)
      const tendrilMesh = new THREE.Mesh(tendrilGeo, tendrilMat)
      tendrilMesh.position.y = 0.2 // extend upward from pivot
      tendrilPivot.add(tendrilMesh)
      group.add(tendrilPivot)
      this.tendrils.push(tendrilPivot)
    }

    // Arms — pivot at shoulders for walk swing
    const armGeo = new THREE.BoxGeometry(0.3, 1.8, 0.3)
    const armMat = new THREE.MeshLambertMaterial({ color: bodyColor })
    const armHeight = 1.8

    const leftShoulder = new THREE.Group()
    leftShoulder.position.set(-0.55, 1.9, 0)
    const leftArmMesh = new THREE.Mesh(armGeo, armMat)
    leftArmMesh.position.y = -armHeight / 2
    leftShoulder.add(leftArmMesh)
    group.add(leftShoulder)
    this.leftArm = leftShoulder

    const rightShoulder = new THREE.Group()
    rightShoulder.position.set(0.55, 1.9, 0)
    const rightArmMesh = new THREE.Mesh(armGeo, armMat)
    rightArmMesh.position.y = -armHeight / 2
    rightShoulder.add(rightArmMesh)
    group.add(rightShoulder)
    this.rightArm = rightShoulder

    // Legs — pivot at hips
    const legGeo = new THREE.BoxGeometry(0.35, 1.0, 0.35)
    const legMat = new THREE.MeshLambertMaterial({ color: bodyColor })
    const legHeight = 1.0

    const leftHip = new THREE.Group()
    leftHip.position.set(-0.2, legHeight, 0)
    const leftLegMesh = new THREE.Mesh(legGeo, legMat)
    leftLegMesh.position.y = -legHeight / 2
    leftHip.add(leftLegMesh)
    group.add(leftHip)
    this.leftLeg = leftHip

    const rightHip = new THREE.Group()
    rightHip.position.set(0.2, legHeight, 0)
    const rightLegMesh = new THREE.Mesh(legGeo, legMat)
    rightLegMesh.position.y = -legHeight / 2
    rightHip.add(rightLegMesh)
    group.add(rightHip)
    this.rightLeg = rightHip

    this.mesh = group
  }

  protected updateAI(dt: number): void {
    this.stateTimer -= dt
    this.sonarPulseTimer -= dt

    switch (this.state) {
      case 'idle':
        // Warden is blind, detects by sound/vibration
        if (this.stateTimer <= 0) {
          this.stateTimer = 2 + Math.random() * 3
        }
        break

      case 'attack':
        if (this.targetEntity && this.targetEntity.isAlive) {
          const dist = this.position.distanceTo(this.targetEntity.position)
          if (dist < 3.5) {
            if (this.stateTimer <= 0) {
              this.targetEntity.takeDamage(this.attackDamage)
              this.stateTimer = 2.0 // Slow but devastating
            }
          } else {
            this.targetPosition = this.targetEntity.position.clone()
          }
        } else {
          this.state = 'idle'
          this.stateTimer = 3
          this.targetEntity = null
          this.angerLevel = 0
        }
        break
    }
  }

  /**
   * 被声音吸引（玩家移动/攻击）
   */
  attractToSound(position: THREE.Vector3, intensity: number): void {
    this.angerLevel = Math.min(100, this.angerLevel + intensity)
    if (this.angerLevel > 50) {
      this.state = 'attack'
      this.targetPosition = position.clone()
    }
  }

  protected getMoveSpeed(): number {
    return this.state === 'attack' ? 4.0 : 0.5
  }
}
