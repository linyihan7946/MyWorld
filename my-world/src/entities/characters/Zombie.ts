import * as THREE from 'three'
import { Character } from '../Character'

/** 夜间生成的敌对生物，会追逐并伤害玩家。 */
export class Zombie extends Character {
  private playerPosition: () => THREE.Vector3
  private attackPlayer: (damage: number) => void
  private shouldChase: () => boolean
  private attackCooldown = 0

  constructor(
    id: string,
    playerPosition: () => THREE.Vector3,
    attackPlayer: (damage: number) => void,
    shouldChase: () => boolean = () => true,
  ) {
    super(id, 20, 2, 0.65, 1.85)
    this.playerPosition = playerPosition
    this.attackPlayer = attackPlayer
    this.shouldChase = shouldChase
    this.mesh = this.createZombieModel()
  }

  protected updateAI(dt: number): void {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt)
    if (!this.shouldChase()) {
      this.state = 'idle'
      this.targetPosition = null
      this.velocity.x *= 0.75
      this.velocity.z *= 0.75
      return
    }
    const player = this.playerPosition()
    const distance = this.position.distanceTo(player)

    if (distance <= 28) {
      this.state = 'attack'
      this.targetPosition = player.clone()
      if (distance < 1.55 && this.attackCooldown <= 0) {
        this.attackPlayer(this.attackDamage)
        this.attackCooldown = 1.2
      }
      return
    }

    this.stateTimer -= dt
    if (this.stateTimer <= 0) {
      this.state = 'wander'
      this.stateTimer = 2 + Math.random() * 4
      this.targetPosition = this.position.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        0,
        (Math.random() - 0.5) * 12,
      ))
    }
  }

  protected getMoveSpeed(): number {
    return this.state === 'attack' ? 2.6 : 1.0
  }

  private createZombieModel(): THREE.Group {
    // createBlockModel gives us legs + arms with pivots and stores refs
    const group = this.createBlockModel(0x3f6b45, 0x4e7a4a, 0.65, 1.85)

    // Eyes (dark pupils)
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x1a0f08 })
    for (const x of [-0.13, 0.13]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.03), eyeMaterial)
      eye.position.set(x, 1.53, 0.24)
      group.add(eye)
    }

    // Outstretched arms — permanently rotated forward ~90deg, no swing
    if (this.leftArm) {
      this.leftArm.rotation.x = -Math.PI / 2
      // Disable animation by clearing ref (arms stay stiff)
      this.leftArm = null
    }
    if (this.rightArm) {
      this.rightArm.rotation.x = -Math.PI / 2
      this.rightArm = null
    }

    // Torn clothing — dark green patches on the body
    const patchMat = new THREE.MeshLambertMaterial({ color: 0x223d24 })
    const patches: Array<[number, number, number, number, number, number]> = [
      // [x, y, z, w, h, d]
      [-0.22, 0.85, 0.17, 0.18, 0.22, 0.02],
      [0.18, 1.0, 0.17, 0.14, 0.16, 0.02],
      [-0.1, 0.7, 0.17, 0.1, 0.1, 0.02],
      [0.25, 0.78, 0.17, 0.08, 0.12, 0.02],
    ]
    for (const [x, y, z, w, h, d] of patches) {
      const patch = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), patchMat)
      patch.position.set(x, y, z)
      group.add(patch)
    }

    return group
  }
}
