import { Character } from '../Character'
import * as THREE from 'three'

/**
 * Villager - 村民
 * 血量: 10, 攻击力: 1
 */
export class Villager extends Character {
  constructor(id: string) {
    super(id, 10, 1, 0.6, 1.8)
    this.createModel()
  }

  private createModel(): void {
    const group = new THREE.Group()

    // Head (skin)
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5)
    const headMat = new THREE.MeshLambertMaterial({ color: 0xD4A574 })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = 1.55
    group.add(head)

    // Nose (prominent)
    const noseGeo = new THREE.BoxGeometry(0.15, 0.2, 0.15)
    const noseMat = new THREE.MeshLambertMaterial({ color: 0xC49565 })
    const nose = new THREE.Mesh(noseGeo, noseMat)
    nose.position.set(0, 1.5, 0.3)
    group.add(nose)

    // Unibrow — small dark box above the nose, connecting both eyes
    const browGeo = new THREE.BoxGeometry(0.36, 0.06, 0.08)
    const browMat = new THREE.MeshLambertMaterial({ color: 0x2B1B0E })
    const brow = new THREE.Mesh(browGeo, browMat)
    brow.position.set(0, 1.66, 0.27)
    group.add(brow)

    // Body (brown robe) — slightly wider to suggest arms are hidden inside
    const bodyGeo = new THREE.BoxGeometry(0.55, 0.75, 0.35)
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x8B6B3D })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.95
    group.add(body)

    // Robe front fold (hands hidden inside — subtle vertical line)
    const foldGeo = new THREE.BoxGeometry(0.04, 0.6, 0.02)
    const foldMat = new THREE.MeshLambertMaterial({ color: 0x6B4B2D })
    const fold = new THREE.Mesh(foldGeo, foldMat)
    fold.position.set(0, 0.98, 0.19)
    group.add(fold)

    // Legs (mostly hidden by robe, but still animate for walk)
    const legGeo = new THREE.BoxGeometry(0.22, 0.55, 0.22)
    const legMat = new THREE.MeshLambertMaterial({ color: 0x6B4B2D })

    const leftHip = new THREE.Group()
    leftHip.position.set(-0.125, 0.55, 0)
    const leftLegMesh = new THREE.Mesh(legGeo, legMat)
    leftLegMesh.position.y = -0.275
    leftHip.add(leftLegMesh)
    group.add(leftHip)
    this.leftLeg = leftHip

    const rightHip = new THREE.Group()
    rightHip.position.set(0.125, 0.55, 0)
    const rightLegMesh = new THREE.Mesh(legGeo, legMat)
    rightLegMesh.position.y = -0.275
    rightHip.add(rightLegMesh)
    group.add(rightHip)
    this.rightLeg = rightHip

    // Arms hidden inside robe — no visible arm meshes from front
    // (leftArm/rightArm remain null; no swing animation)

    this.mesh = group
  }

  protected updateAI(dt: number): void {
    this.stateTimer -= dt

    switch (this.state) {
      case 'idle':
        if (this.stateTimer <= 0) {
          this.state = 'wander'
          this.stateTimer = 3 + Math.random() * 5
          this.targetPosition = this.position.clone().add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 10,
              0,
              (Math.random() - 0.5) * 10,
            )
          )
        }
        break

      case 'wander':
        if (this.stateTimer <= 0 || !this.targetPosition) {
          this.state = 'idle'
          this.stateTimer = 2 + Math.random() * 3
        }
        break

      case 'flee':
        if (this.stateTimer <= 0) {
          this.state = 'idle'
          this.stateTimer = 2
        }
        break
    }
  }

  takeDamage(amount: number): void {
    super.takeDamage(amount)
    // Villager flees when attacked
    this.state = 'flee'
    this.stateTimer = 5
    this.targetPosition = this.position.clone().add(
      new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        0,
        (Math.random() - 0.5) * 20,
      )
    )
  }

  protected getMoveSpeed(): number {
    return this.state === 'flee' ? 3.5 : 1.5
  }
}
