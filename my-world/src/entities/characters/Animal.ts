import * as THREE from 'three'
import { Character } from '../Character'

export type AnimalKind = 'cow' | 'pig' | 'sheep'

/** 简单的被动物：会在出生点附近随机游走。 */
export class Animal extends Character {
  public readonly kind: AnimalKind
  private readonly home = new THREE.Vector3()

  constructor(id: string, kind: AnimalKind) {
    super(id, 10, 0, 0.9, 1.35)
    this.kind = kind
    this.mesh = this.createAnimalModel(kind)
  }

  setHome(position: THREE.Vector3): void {
    this.home.copy(position)
  }

  protected updateAI(dt: number): void {
    this.stateTimer -= dt
    if (this.stateTimer > 0 && this.targetPosition) return

    if (Math.random() < 0.35) {
      this.targetPosition = null
      this.state = 'idle'
      this.stateTimer = 1.5 + Math.random() * 3
      return
    }

    this.state = 'wander'
    this.stateTimer = 3 + Math.random() * 5
    this.targetPosition = this.home.clone().add(new THREE.Vector3(
      (Math.random() - 0.5) * 18,
      0,
      (Math.random() - 0.5) * 18,
    ))
  }

  protected getMoveSpeed(): number {
    return 1.25
  }

  private createAnimalModel(kind: AnimalKind): THREE.Group {
    const group = new THREE.Group()
    const colors: Record<AnimalKind, { body: number; head: number; patch: number }> = {
      cow: { body: 0x6b4935, head: 0x5a3828, patch: 0xf0e6d2 },
      pig: { body: 0xf29aaa, head: 0xf5a8b5, patch: 0xd97889 },
      sheep: { body: 0xe8e5dc, head: 0x77736d, patch: 0xc9c6bd },
    }
    const color = colors[kind]

    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.72, 0.65),
      new THREE.MeshLambertMaterial({ color: color.body }),
    )
    body.position.y = 0.88
    group.add(body)

    // Sheep: fluffy wool overlay (slightly larger, lighter)
    if (kind === 'sheep') {
      const wool = new THREE.Mesh(
        new THREE.BoxGeometry(1.18, 0.82, 0.78),
        new THREE.MeshLambertMaterial({ color: 0xf8f6ef }),
      )
      wool.position.y = 0.92
      group.add(wool)
    }

    // Cow: black patches on body sides
    if (kind === 'cow') {
      const patchMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
      const patchPositions: Array<[number, number, number]> = [
        [-0.35, 0.95, 0.33],
        [0.3, 0.82, 0.33],
        [-0.25, 0.78, -0.33],
        [0.38, 1.0, -0.33],
      ]
      for (const [x, y, z] of patchPositions) {
        const patch = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.02), patchMat)
        patch.position.set(x, y, z)
        group.add(patch)
      }
    }

    // Head
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.52, 0.5),
      new THREE.MeshLambertMaterial({ color: color.head }),
    )
    head.position.set(0, 0.94, 0.55)
    group.add(head)

    // Snout
    const snout = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.2, 0.18),
      new THREE.MeshLambertMaterial({ color: color.patch }),
    )
    snout.position.set(0, 0.86, 0.86)
    group.add(snout)

    // Pig: curly tail (small pink boxes in a slight curl)
    if (kind === 'pig') {
      const tailMat = new THREE.MeshLambertMaterial({ color: 0xd97889 })
      const tailSegments = 4
      for (let i = 0; i < tailSegments; i++) {
        const seg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), tailMat)
        const t = i / tailSegments
        seg.position.set(
          Math.sin(t * Math.PI * 1.5) * 0.08,
          0.95 + t * 0.12,
          -0.35 - t * 0.08,
        )
        group.add(seg)
      }
    }

    // 4 legs with pivots at hip for walk animation
    const legMaterial = new THREE.MeshLambertMaterial({ color: color.head })
    const legHeight = 0.55
    const legGeo = new THREE.BoxGeometry(0.2, legHeight, 0.2)

    // Front legs (z > 0), back legs (z < 0)
    const legDefs: Array<{ name: 'fl' | 'fr' | 'bl' | 'br'; x: number; z: number }> = [
      { name: 'fl', x: -0.35, z: 0.2 },
      { name: 'fr', x: 0.35, z: 0.2 },
      { name: 'bl', x: -0.35, z: -0.2 },
      { name: 'br', x: 0.35, z: -0.2 },
    ]

    for (const def of legDefs) {
      const hip = new THREE.Group()
      hip.position.set(def.x, legHeight, def.z)
      const leg = new THREE.Mesh(legGeo, legMaterial)
      leg.position.y = -legHeight / 2
      hip.add(leg)
      group.add(hip)

      switch (def.name) {
        case 'fl': this.frontLeftLeg = hip; break
        case 'fr': this.frontRightLeg = hip; break
        case 'bl': this.backLeftLeg = hip; break
        case 'br': this.backRightLeg = hip; break
      }
    }

    return group
  }
}
