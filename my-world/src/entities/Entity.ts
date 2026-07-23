import * as THREE from 'three'

/**
 * Entity - 基础实体类
 */
export abstract class Entity {
  public id: string
  public position: THREE.Vector3
  public velocity: THREE.Vector3
  public rotation = new THREE.Euler(0, 0, 0)
  public onGround = false
  public isAlive = true
  public health: number
  public maxHealth: number
  public attackDamage: number
  public mesh: THREE.Group

  // AABB bounds
  public width: number
  public height: number

  protected constructor(id: string, health: number, attackDamage: number, width: number, height: number) {
    this.id = id
    this.health = health
    this.maxHealth = health
    this.attackDamage = attackDamage
    this.width = width
    this.height = height
    this.position = new THREE.Vector3()
    this.velocity = new THREE.Vector3()
    this.mesh = new THREE.Group()
  }

  /**
   * 获取AABB包围盒
   */
  getAABB(pos?: THREE.Vector3): { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number } {
    const p = pos || this.position
    const hw = this.width / 2
    return {
      minX: p.x - hw,
      maxX: p.x + hw,
      minY: p.y,
      maxY: p.y + this.height,
      minZ: p.z - hw,
      maxZ: p.z + hw,
    }
  }

  /**
   * 受到伤害
   */
  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount)
    if (this.health <= 0) {
      this.isAlive = false
      this.onDeath()
    }
  }

  /**
   * 攻击另一个实体
   */
  attack(target: Entity): void {
    if (!this.isAlive || !target.isAlive) return
    const dist = this.position.distanceTo(target.position)
    if (dist < 4) { // Attack range
      target.takeDamage(this.attackDamage)
    }
  }

  protected onDeath(): void {
    // Override in subclasses
  }

  /**
   * 每帧更新
   */
  abstract update(dt: number): void

  /**
   * 更新网格位置
   */
  updateMesh(): void {
    this.mesh.position.copy(this.position)
  }
}
