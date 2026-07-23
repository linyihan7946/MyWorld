import { Character } from '../Character'
import * as THREE from 'three'

/**
 * IronGolem - 铁傀儡
 * 血量: 100, 攻击力: 很高 (20)
 */
export class IronGolem extends Character {
  constructor(id: string) {
    super(id, 100, 20, 1.4, 2.7)
    this.createModel()
  }

  private createModel(): void {
    const group = new THREE.Group()
    const ironColor = 0xC8C8C8
    const darkIron = 0x909090

    // Head
    const headGeo = new THREE.BoxGeometry(0.8, 0.6, 0.6)
    const headMat = new THREE.MeshLambertMaterial({ color: ironColor })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = 2.3
    group.add(head)

    // Nose
    const noseGeo = new THREE.BoxGeometry(0.2, 0.3, 0.3)
    const noseMat = new THREE.MeshLambertMaterial({ color: darkIron })
    const nose = new THREE.Mesh(noseGeo, noseMat)
    nose.position.set(0, 2.2, 0.4)
    group.add(nose)

    // Eyes (red)
    const eyeGeo = new THREE.BoxGeometry(0.15, 0.1, 0.05)
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0xCC3333 })
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
    leftEye.position.set(-0.2, 2.35, 0.31)
    group.add(leftEye)
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
    rightEye.position.set(0.2, 2.35, 0.31)
    group.add(rightEye)

    // Body (large)
    const bodyGeo = new THREE.BoxGeometry(1.2, 1.2, 0.6)
    const bodyMat = new THREE.MeshLambertMaterial({ color: ironColor })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 1.3
    group.add(body)

    // Arms (thick) — pivots at shoulders for swing animation
    const armGeo = new THREE.BoxGeometry(0.4, 1.4, 0.4)
    const armMat = new THREE.MeshLambertMaterial({ color: darkIron })
    const armHeight = 1.4

    const leftShoulder = new THREE.Group()
    leftShoulder.position.set(-0.8, 1.8, 0)
    const leftArmMesh = new THREE.Mesh(armGeo, armMat)
    leftArmMesh.position.y = -armHeight / 2
    leftShoulder.add(leftArmMesh)
    group.add(leftShoulder)
    this.leftArm = leftShoulder

    const rightShoulder = new THREE.Group()
    rightShoulder.position.set(0.8, 1.8, 0)
    const rightArmMesh = new THREE.Mesh(armGeo, armMat)
    rightArmMesh.position.y = -armHeight / 2
    rightShoulder.add(rightArmMesh)
    group.add(rightShoulder)
    this.rightArm = rightShoulder

    // Legs — pivots at hips
    const legGeo = new THREE.BoxGeometry(0.4, 0.8, 0.4)
    const legMat = new THREE.MeshLambertMaterial({ color: darkIron })
    const legHeight = 0.8

    const leftHip = new THREE.Group()
    leftHip.position.set(-0.3, legHeight, 0)
    const leftLegMesh = new THREE.Mesh(legGeo, legMat)
    leftLegMesh.position.y = -legHeight / 2
    leftHip.add(leftLegMesh)
    group.add(leftHip)
    this.leftLeg = leftHip

    const rightHip = new THREE.Group()
    rightHip.position.set(0.3, legHeight, 0)
    const rightLegMesh = new THREE.Mesh(legGeo, legMat)
    rightLegMesh.position.y = -legHeight / 2
    rightHip.add(rightLegMesh)
    group.add(rightHip)
    this.rightLeg = rightHip

    // Vine/flower detail — small red flower on the left shoulder
    const flowerStem = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.25, 0.06),
      new THREE.MeshLambertMaterial({ color: 0x2d6b2d }),
    )
    flowerStem.position.set(-0.8, 1.95, 0.15)
    group.add(flowerStem)

    const flowerHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.18, 0.18),
      new THREE.MeshLambertMaterial({ color: 0xDD3333 }),
    )
    flowerHead.position.set(-0.8, 2.12, 0.15)
    group.add(flowerHead)

    this.mesh = group
  }

  protected updateAI(dt: number): void {
    this.stateTimer -= dt

    switch (this.state) {
      case 'idle':
        if (this.stateTimer <= 0) {
          this.state = 'wander'
          this.stateTimer = 5 + Math.random() * 10
          this.targetPosition = this.position.clone().add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 15,
              0,
              (Math.random() - 0.5) * 15,
            )
          )
        }
        break

      case 'wander':
        if (this.stateTimer <= 0) {
          this.state = 'idle'
          this.stateTimer = 3 + Math.random() * 5
        }
        break

      case 'attack':
        if (this.targetEntity && this.targetEntity.isAlive) {
          const dist = this.position.distanceTo(this.targetEntity.position)
          if (dist < 3) {
            if (this.stateTimer <= 0) {
              this.targetEntity.takeDamage(this.attackDamage)
              this.stateTimer = 1.5 // Attack cooldown
            }
          } else {
            this.targetPosition = this.targetEntity.position.clone()
          }
        } else {
          this.state = 'idle'
          this.stateTimer = 2
          this.targetEntity = null
        }
        break
    }
  }

  protected getMoveSpeed(): number {
    return this.state === 'attack' ? 3.0 : 1.2
  }
}
