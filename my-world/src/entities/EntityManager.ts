import { Entity } from './Entity'
import * as THREE from 'three'

/**
 * EntityManager - 管理所有实体
 */
export class EntityManager {
  private entities = new Map<string, Entity>()
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity)
    entity.updateMesh()
    entity.mesh.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
    this.scene.add(entity.mesh)
  }

  removeEntity(id: string): void {
    const entity = this.entities.get(id)
    if (entity) {
      this.scene.remove(entity.mesh)
      this.entities.delete(id)
    }
  }

  getEntity(id: string): Entity | undefined {
    return this.entities.get(id)
  }

  getAllEntities(): Entity[] {
    return Array.from(this.entities.values())
  }

  /**
   * 更新所有实体
   */
  update(dt: number): void {
    const toRemove: string[] = []

    for (const [id, entity] of this.entities) {
      entity.update(dt)
      entity.updateMesh()

      if (!entity.isAlive) {
        toRemove.push(id)
      }
    }

    // Remove dead entities
    for (const id of toRemove) {
      this.removeEntity(id)
    }
  }

  /**
   * 找到距离最近的实体
   */
  findNearest(position: THREE.Vector3, maxDist: number, filter?: (e: Entity) => boolean): Entity | null {
    let nearest: Entity | null = null
    let nearestDist = maxDist

    for (const entity of this.entities.values()) {
      if (!entity.isAlive) continue
      if (filter && !filter(entity)) continue

      const dist = position.distanceTo(entity.position)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = entity
      }
    }

    return nearest
  }

  dispose(): void {
    for (const entity of this.entities.values()) {
      this.scene.remove(entity.mesh)
    }
    this.entities.clear()
  }
}
