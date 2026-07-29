import * as THREE from 'three'
import { Character } from '../Character'

export type AnimalKind =
  | 'cow' | 'pig' | 'sheep' | 'chicken' | 'rabbit'
  | 'horse' | 'donkey'
  | 'wolf' | 'fox' | 'cat' | 'ocelot'
  | 'polar_bear' | 'panda'
  | 'turtle' | 'frog'
  | 'parrot'
  | 'goat'
  | 'squid'
  | 'bee'

/** Passive animal that wanders near its spawn point. */
export class Animal extends Character {
  public readonly kind: AnimalKind
  private readonly home = new THREE.Vector3()
  private hopTimer = 0 // chicken / rabbit hop

  constructor(id: string, kind: AnimalKind) {
    // width, height vary per kind
    const dims = Animal.getDimensions(kind)
    super(id, Animal.getBaseHealth(kind), 0, dims.width, dims.height)
    this.kind = kind
    this.mesh = this.createModel(kind)
  }

  setHome(position: THREE.Vector3): void {
    this.home.copy(position)
  }

  private static getBaseHealth(kind: AnimalKind): number {
    switch (kind) {
      case 'horse': case 'donkey': case 'polar_bear': case 'panda': return 20
      case 'wolf': case 'goat': case 'turtle': return 12
      case 'fox': case 'cat': case 'ocelot': return 10
      case 'chicken': case 'rabbit': case 'parrot': case 'bee': return 4
      default: return 10
    }
  }

  private static getDimensions(kind: AnimalKind): { width: number; height: number } {
    switch (kind) {
      case 'horse': return { width: 1.2, height: 2.2 }
      case 'donkey': return { width: 1.1, height: 2.0 }
      case 'polar_bear': return { width: 1.3, height: 2.0 }
      case 'panda': return { width: 1.1, height: 1.6 }
      case 'cow': case 'pig': case 'sheep': case 'goat': return { width: 0.9, height: 1.35 }
      case 'wolf': return { width: 0.7, height: 1.0 }
      case 'fox': return { width: 0.6, height: 0.7 }
      case 'cat': case 'ocelot': return { width: 0.5, height: 0.7 }
      case 'turtle': return { width: 0.8, height: 0.4 }
      case 'frog': return { width: 0.5, height: 0.5 }
      case 'chicken': return { width: 0.5, height: 0.8 }
      case 'rabbit': return { width: 0.4, height: 0.5 }
      case 'parrot': return { width: 0.4, height: 0.5 }
      case 'squid': return { width: 0.8, height: 0.8 }
      case 'bee': return { width: 0.4, height: 0.5 }
    }
  }

  protected updateAI(dt: number): void {
    this.stateTimer -= dt
    if (this.stateTimer > 0 && this.targetPosition) return

    if (Math.random() < 0.3) {
      this.targetPosition = null
      this.state = 'idle'
      this.stateTimer = 1.5 + Math.random() * 3
      return
    }

    this.state = 'wander'
    this.stateTimer = 3 + Math.random() * 5
    const range = this.kind === 'horse' || this.kind === 'polar_bear' ? 24
      : this.kind === 'chicken' || this.kind === 'rabbit' ? 8 : 16
    this.targetPosition = this.home.clone().add(new THREE.Vector3(
      (Math.random() - 0.5) * range, 0, (Math.random() - 0.5) * range,
    ))
  }

  protected getMoveSpeed(): number {
    switch (this.kind) {
      case 'horse': return 4.5
      case 'wolf': case 'fox': return 2.8
      case 'donkey': return 3.5
      case 'chicken': return 1.6
      case 'rabbit': return 2.5
      case 'polar_bear': return 2.2
      case 'cat': case 'ocelot': return 2.0
      case 'turtle': return 0.8
      case 'frog': return 1.5
      case 'squid': return 1.2
      case 'bee': return 2.0
      default: return 1.5
    }
  }

  // ─── 3D model builders ──────────────────────────────────────────────

  private createModel(kind: AnimalKind): THREE.Group {
    switch (kind) {
      case 'cow':   return this.makeCow()
      case 'pig':   return this.makePig()
      case 'sheep': return this.makeSheep()
      case 'chicken': return this.makeChicken()
      case 'rabbit': return this.makeRabbit()
      case 'horse': case 'donkey': return this.makeHorse(kind)
      case 'wolf':  return this.makeWolf()
      case 'fox':   return this.makeFox()
      case 'cat': case 'ocelot': return this.makeCat(kind)
      case 'polar_bear': return this.makePolarBear()
      case 'panda': return this.makePanda()
      case 'turtle': return this.makeTurtle()
      case 'frog':  return this.makeFrog()
      case 'parrot': return this.makeParrot()
      case 'goat':  return this.makeGoat()
      case 'squid': return this.makeSquid()
      case 'bee':   return this.makeBee()
      default: return new THREE.Group()
    }
  }

  private box(w: number, h: number, d: number, color: number): THREE.Mesh {
    return new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({ color }),
    )
  }

  // ── Cow ──
  private makeCow(): THREE.Group {
    const g = new THREE.Group()
    g.add(this.place(this.box(1.05, 0.72, 0.65, 0x6b4935), 0, 0.88, 0))
    for (const [x, y, z] of [[-0.35,0.95,0.33],[0.3,0.82,0.33],[-0.25,0.78,-0.33],[0.38,1.0,-0.33]]) {
      g.add(this.place(this.box(0.25, 0.25, 0.02, 0x1a1a1a), x, y, z))
    }
    g.add(this.place(this.box(0.5, 0.52, 0.5, 0x5a3828), 0, 0.94, 0.55))
    g.add(this.place(this.box(0.32, 0.2, 0.18, 0xf0e6d2), 0, 0.86, 0.86))
    this.addLegs(g, 0x5a3828, 0.55, 0.88)
    return g
  }

  // ── Pig ──
  private makePig(): THREE.Group {
    const g = new THREE.Group()
    g.add(this.place(this.box(1.05, 0.72, 0.65, 0xf29aaa), 0, 0.88, 0))
    g.add(this.place(this.box(0.5, 0.52, 0.5, 0xf5a8b5), 0, 0.94, 0.55))
    g.add(this.place(this.box(0.32, 0.2, 0.18, 0xd97889), 0, 0.86, 0.86))
    for (let i = 0; i < 4; i++) {
      const t = i / 4
      g.add(this.place(this.box(0.06, 0.06, 0.06, 0xd97889),
        Math.sin(t * Math.PI * 1.5) * 0.08, 0.95 + t * 0.12, -0.35 - t * 0.08))
    }
    this.addLegs(g, 0xf5a8b5, 0.55, 0.88)
    return g
  }

  // ── Sheep ──
  private makeSheep(): THREE.Group {
    const g = new THREE.Group()
    g.add(this.place(this.box(1.05, 0.72, 0.65, 0xe8e5dc), 0, 0.88, 0))
    g.add(this.place(this.box(1.18, 0.82, 0.78, 0xf8f6ef), 0, 0.92, 0))
    g.add(this.place(this.box(0.5, 0.52, 0.5, 0x77736d), 0, 0.94, 0.55))
    g.add(this.place(this.box(0.32, 0.2, 0.18, 0xc9c6bd), 0, 0.86, 0.86))
    this.addLegs(g, 0x77736d, 0.55, 0.88)
    return g
  }

  // ── Chicken ──
  private makeChicken(): THREE.Group {
    const g = new THREE.Group()
    g.add(this.place(this.box(0.4, 0.35, 0.5, 0xf8f8f8), 0, 0.35, 0))
    g.add(this.place(this.box(0.3, 0.3, 0.28, 0xf0f0f0), 0, 0.55, 0.28))
    g.add(this.place(this.box(0.08, 0.2, 0.05, 0xf09020), 0, 0.52, 0.44)) // beak
    g.add(this.place(this.box(0.06, 0.15, 0.04, 0xe02020), 0, 0.63, 0.46)) // comb
    // wings
    g.add(this.place(this.box(0.05, 0.2, 0.35, 0xe8e8e8), -0.23, 0.38, 0))
    g.add(this.place(this.box(0.05, 0.2, 0.35, 0xe8e8e8), 0.23, 0.38, 0))
    this.addLegs2(g, 0xf09020, 0.2, 0.32, 0.14)
    return g
  }

  // ── Rabbit ──
  private makeRabbit(): THREE.Group {
    const g = new THREE.Group()
    g.add(this.place(this.box(0.35, 0.25, 0.4, 0xc8b090), 0, 0.25, 0))
    g.add(this.place(this.box(0.25, 0.28, 0.22, 0xd8c0a0), 0, 0.42, 0.24))
    // ears
    g.add(this.place(this.box(0.07, 0.2, 0.06, 0xd8c0a0), -0.06, 0.58, 0.2))
    g.add(this.place(this.box(0.07, 0.2, 0.06, 0xd8c0a0), 0.06, 0.58, 0.2))
    g.add(this.place(this.box(0.08, 0.15, 0.06, 0xf0c8c0), 0, 0.48, 0.36)) // nose
    // tail
    g.add(this.place(this.box(0.12, 0.12, 0.12, 0xf8f8f8), 0, 0.28, -0.22))
    this.addLegs2(g, 0xb8a080, 0.16, 0.2, 0.12)
    return g
  }

  // ── Horse / Donkey ──
  private makeHorse(kind: 'horse' | 'donkey'): THREE.Group {
    const g = new THREE.Group()
    const bodyC = kind === 'horse' ? 0x8B5E3C : 0x7B6B5B
    g.add(this.place(this.box(1.2, 0.9, 0.7, bodyC), 0, 1.1, 0))
    // neck
    g.add(this.place(this.box(0.4, 0.7, 0.35, bodyC), 0, 1.45, 0.45))
    g.add(this.place(this.box(0.5, 0.55, 0.55, 0x6B4E3C), 0, 1.7, 0.65)) // head
    g.add(this.place(this.box(0.3, 0.2, 0.15, 0x9B7E6C), 0, 1.62, 0.95)) // snout
    // mane
    if (kind === 'horse') {
      for (let i = 0; i < 5; i++) {
        g.add(this.place(this.box(0.02, 0.12, 0.02, 0x3A2A1A), -0.2, 1.65 + i * 0.1, 0.4 + i * 0.02))
        g.add(this.place(this.box(0.02, 0.12, 0.02, 0x3A2A1A), 0.2, 1.65 + i * 0.1, 0.4 + i * 0.02))
      }
    }
    // ears
    g.add(this.place(this.box(0.1, 0.2, 0.06, bodyC), -0.15, 1.88, 0.62))
    g.add(this.place(this.box(0.1, 0.2, 0.06, bodyC), 0.15, 1.88, 0.62))
    // tail
    for (let i = 0; i < 4; i++) {
      g.add(this.place(this.box(0.04, 0.08, 0.04, 0x3A2A1A), 0, 1.2 - i * 0.08, -0.4 - i * 0.05))
    }
    // legs (tall)
    const legC = kind === 'horse' ? 0x7B5E3C : 0x6B5B4B
    this.addLegsTall(g, legC, 0.8, 1.0, 0.18)
    return g
  }

  // ── Wolf ──
  private makeWolf(): THREE.Group {
    const g = new THREE.Group()
    g.add(this.place(this.box(0.7, 0.5, 0.4, 0x9e9e9e), 0, 0.5, 0))
    g.add(this.place(this.box(0.5, 0.45, 0.4, 0xb0b0b0), 0, 0.5, 0.32))
    g.add(this.place(this.box(0.2, 0.2, 0.25, 0x808080), 0, 0.45, 0.58)) // snout
    // ears
    g.add(this.place(this.box(0.12, 0.18, 0.1, 0x707070), -0.18, 0.78, 0.28))
    g.add(this.place(this.box(0.12, 0.18, 0.1, 0x707070), 0.18, 0.78, 0.28))
    // tail
    for (let i = 0; i < 3; i++) {
      g.add(this.place(this.box(0.08, 0.08, 0.08, 0x808080), 0, 0.65 - i * 0.06, -0.28 - i * 0.08))
    }
    this.addLegs2(g, 0x7a7a7a, 0.35, 0.42, 0.14)
    return g
  }

  // ── Fox ──
  private makeFox(): THREE.Group {
    const g = new THREE.Group()
    g.add(this.place(this.box(0.55, 0.38, 0.32, 0xe87830), 0, 0.35, 0))
    g.add(this.place(this.box(0.4, 0.35, 0.28, 0xf09048), 0, 0.35, 0.22))
    g.add(this.place(this.box(0.18, 0.16, 0.2, 0xf8f0e0), 0, 0.3, 0.42)) // snout
    // ears (pointed)
    g.add(this.place(this.box(0.1, 0.2, 0.1, 0xe87830), -0.16, 0.58, 0.18))
    g.add(this.place(this.box(0.1, 0.2, 0.1, 0xe87830), 0.16, 0.58, 0.18))
    // tail (big fluffy)
    for (let i = 0; i < 5; i++) {
      g.add(this.place(this.box(0.1, 0.1, 0.1, 0xf09048), 0, 0.48 - i * 0.06, -0.25 - i * 0.08))
    }
    g.add(this.place(this.box(0.14, 0.14, 0.1, 0xf8f0e0), 0, 0.1, -0.32)) // tail tip
    this.addLegs2(g, 0x3a2a1a, 0.28, 0.3, 0.11)
    return g
  }

  // ── Cat / Ocelot ──
  private makeCat(kind: 'cat' | 'ocelot'): THREE.Group {
    const g = new THREE.Group()
    const bodyC = kind === 'ocelot' ? 0xd4a858 : 0x8B6B4B
    g.add(this.place(this.box(0.45, 0.3, 0.25, bodyC), 0, 0.3, 0))
    g.add(this.place(this.box(0.3, 0.28, 0.22, bodyC), 0, 0.3, 0.2))
    g.add(this.place(this.box(0.15, 0.15, 0.12, 0xf0c8a0), 0, 0.26, 0.35)) // snout
    // ears
    g.add(this.place(this.box(0.1, 0.16, 0.08, bodyC), -0.12, 0.5, 0.16))
    g.add(this.place(this.box(0.1, 0.16, 0.08, bodyC), 0.12, 0.5, 0.16))
    // tail
    for (let i = 0; i < 4; i++) {
      g.add(this.place(this.box(0.06, 0.06, 0.06, bodyC), 0, 0.38 - i * 0.04, -0.2 - i * 0.06))
    }
    this.addLegs2(g, 0x6B4B3B, 0.22, 0.25, 0.1)
    return g
  }

  // ── Polar Bear ──
  private makePolarBear(): THREE.Group {
    const g = new THREE.Group()
    g.add(this.place(this.box(1.3, 0.9, 0.8, 0xf8f4f0), 0, 0.9, 0))
    g.add(this.place(this.box(0.7, 0.65, 0.6, 0xf0ece8), 0, 0.95, 0.55))
    g.add(this.place(this.box(0.35, 0.3, 0.25, 0x202020), 0, 0.85, 0.9)) // nose
    // ears
    g.add(this.place(this.box(0.2, 0.2, 0.15, 0xf0ece8), -0.25, 1.3, 0.4))
    g.add(this.place(this.box(0.2, 0.2, 0.15, 0xf0ece8), 0.25, 1.3, 0.4))
    // tail
    g.add(this.place(this.box(0.2, 0.2, 0.2, 0xf8f4f0), 0, 0.85, -0.45))
    this.addLegsTall(g, 0xf0ece8, 0.6, 0.85, 0.25)
    return g
  }

  // ── Panda ──
  private makePanda(): THREE.Group {
    const g = new THREE.Group()
    g.add(this.place(this.box(1.1, 0.8, 0.7, 0xf8f8f8), 0, 0.8, 0))
    // black patches
    g.add(this.place(this.box(0.55, 0.5, 0.02, 0x1a1a1a), -0.3, 0.95, 0.36))
    g.add(this.place(this.box(0.55, 0.5, 0.02, 0x1a1a1a), 0.3, 0.95, 0.36))
    g.add(this.place(this.box(0.7, 0.55, 0.5, 0xf8f8f8), 0, 0.85, 0.5)) // head
    // eye patches
    g.add(this.place(this.box(0.18, 0.15, 0.05, 0x1a1a1a), -0.18, 1.02, 0.72))
    g.add(this.place(this.box(0.18, 0.15, 0.05, 0x1a1a1a), 0.18, 1.02, 0.72))
    g.add(this.place(this.box(0.2, 0.2, 0.15, 0x1a1a1a), 0, 0.82, 0.38)) // nose
    // ears
    g.add(this.place(this.box(0.2, 0.25, 0.2, 0x1a1a1a), -0.3, 1.15, 0.4))
    g.add(this.place(this.box(0.2, 0.25, 0.2, 0x1a1a1a), 0.3, 1.15, 0.4))
    this.addLegsTall(g, 0x1a1a1a, 0.5, 0.75, 0.22)
    return g
  }

  // ── Turtle ──
  private makeTurtle(): THREE.Group {
    const g = new THREE.Group()
    // shell
    g.add(this.place(this.box(0.8, 0.35, 0.7, 0x4a7a3a), 0, 0.25, 0))
    g.add(this.place(this.box(0.75, 0.08, 0.65, 0x5a8a4a), 0, 0.42, 0)) // top
    // body/head
    g.add(this.place(this.box(0.3, 0.2, 0.25, 0x6a9a4a), 0, 0.12, 0.5))
    g.add(this.place(this.box(0.08, 0.06, 0.06, 0x202020), 0.06, 0.14, 0.62)) // eye
    g.add(this.place(this.box(0.08, 0.06, 0.06, 0x202020), -0.06, 0.14, 0.62))
    // legs (short, splayed)
    const legC = 0x5a8a3a
    ;[[-0.35,0.08,0.25],[0.35,0.08,0.25],[-0.35,0.08,-0.25],[0.35,0.08,-0.25]].forEach(([lx,ly,lz]) => {
      g.add(this.place(this.box(0.15, 0.08, 0.12, legC), lx, ly, lz))
    })
    return g
  }

  // ── Frog ──
  private makeFrog(): THREE.Group {
    const g = new THREE.Group()
    g.add(this.place(this.box(0.45, 0.28, 0.35, 0x5a8a3a), 0, 0.25, 0))
    g.add(this.place(this.box(0.35, 0.25, 0.2, 0x6a9a4a), 0, 0.32, 0.24)) // head
    // eyes (bulging)
    g.add(this.place(this.box(0.1, 0.12, 0.1, 0xf8f8f8), -0.12, 0.42, 0.3))
    g.add(this.place(this.box(0.1, 0.12, 0.1, 0xf8f8f8), 0.12, 0.42, 0.3))
    g.add(this.place(this.box(0.06, 0.06, 0.06, 0x202020), -0.12, 0.45, 0.35))
    g.add(this.place(this.box(0.06, 0.06, 0.06, 0x202020), 0.12, 0.45, 0.35))
    // back legs (folded)
    this.addLegs2(g, 0x4a7a2a, 0.18, 0.2, 0.13)
    return g
  }

  // ── Parrot ──
  private makeParrot(): THREE.Group {
    const g = new THREE.Group()
    const colors = [0xe02020, 0x2060e0, 0x20c020, 0xf0c020, 0x40c0e0]
    const c = colors[Math.floor(Math.random() * colors.length)]
    g.add(this.place(this.box(0.22, 0.2, 0.3, c), 0, 0.25, 0))
    g.add(this.place(this.box(0.2, 0.2, 0.18, c), 0, 0.38, 0.18)) // head
    g.add(this.place(this.box(0.06, 0.1, 0.06, 0xf09020), 0, 0.35, 0.3)) // beak
    // tail feathers
    for (let i = 0; i < 3; i++) {
      g.add(this.place(this.box(0.04, 0.22, 0.04, c), 0, 0.15 - i * 0.05, -0.22 - i * 0.06))
    }
    // wings
    g.add(this.place(this.box(0.04, 0.15, 0.25, c), -0.13, 0.28, 0))
    g.add(this.place(this.box(0.04, 0.15, 0.25, c), 0.13, 0.28, 0))
    this.addLegs2(g, 0xf09020, 0.1, 0.2, 0.08)
    return g
  }

  // ── Goat ──
  private makeGoat(): THREE.Group {
    const g = new THREE.Group()
    g.add(this.place(this.box(0.9, 0.7, 0.55, 0xe8e0d8), 0, 0.8, 0))
    g.add(this.place(this.box(0.45, 0.5, 0.45, 0xf0e8e0), 0, 0.9, 0.45))
    g.add(this.place(this.box(0.25, 0.2, 0.18, 0xd8d0c8), 0, 0.8, 0.72)) // snout
    // horns
    g.add(this.place(this.box(0.06, 0.3, 0.06, 0x808080), -0.12, 1.25, 0.4))
    g.add(this.place(this.box(0.06, 0.3, 0.06, 0x808080), 0.12, 1.25, 0.4))
    // ears
    g.add(this.place(this.box(0.15, 0.1, 0.04, 0xd0c8c0), -0.25, 1.05, 0.42))
    g.add(this.place(this.box(0.15, 0.1, 0.04, 0xd0c8c0), 0.25, 1.05, 0.42))
    // beard
    for (let i = 0; i < 3; i++) {
      g.add(this.place(this.box(0.03, 0.1, 0.03, 0xc0b8b0), 0, 0.75 - i * 0.08, 0.6 + i * 0.02))
    }
    this.addLegs(g, 0xc0b8b0, 0.5, 0.78)
    return g
  }

  // ── Squid ──
  private makeSquid(): THREE.Group {
    const g = new THREE.Group()
    g.add(this.place(this.box(0.55, 0.55, 0.55, 0x204080), 0, 0.35, 0))
    // tentacles
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const tx = Math.cos(angle) * 0.3
      const tz = Math.sin(angle) * 0.3
      for (let j = 0; j < 3; j++) {
        g.add(this.place(this.box(0.04, 0.1, 0.04, 0x183060), tx, 0.05 - j * 0.08, tz))
      }
    }
    // eyes
    g.add(this.place(this.box(0.1, 0.1, 0.02, 0xf8f8f8), -0.15, 0.5, 0.28))
    g.add(this.place(this.box(0.1, 0.1, 0.02, 0xf8f8f8), 0.15, 0.5, 0.28))
    return g
  }

  // ── Bee ──
  private makeBee(): THREE.Group {
    const g = new THREE.Group()
    // body (yellow + black stripes)
    g.add(this.place(this.box(0.3, 0.2, 0.35, 0xf0c820), 0, 0.25, 0))
    g.add(this.place(this.box(0.32, 0.1, 0.1, 0x202020), 0, 0.25, -0.05))
    g.add(this.place(this.box(0.32, 0.1, 0.1, 0x202020), 0, 0.25, 0.12))
    g.add(this.place(this.box(0.2, 0.2, 0.15, 0x202020), 0, 0.25, -0.22)) // head
    // antennae
    g.add(this.place(this.box(0.02, 0.12, 0.02, 0x202020), -0.05, 0.4, -0.22))
    g.add(this.place(this.box(0.02, 0.12, 0.02, 0x202020), 0.05, 0.4, -0.22))
    // wings (translucent — use light gray)
    g.add(this.place(this.box(0.04, 0.08, 0.2, 0xd8d8e8), -0.17, 0.32, 0))
    g.add(this.place(this.box(0.04, 0.08, 0.2, 0xd8d8e8), 0.17, 0.32, 0))
    // stinger
    g.add(this.place(this.box(0.06, 0.06, 0.12, 0x404040), 0, 0.22, 0.22))
    this.addLegs2(g, 0x202020, 0.1, 0.2, 0.08)
    return g
  }

  // ── Leg helpers ──────────────────────────────────────────────────────

  private place(mesh: THREE.Mesh, x: number, y: number, z: number): THREE.Mesh {
    mesh.position.set(x, y, z)
    return mesh
  }

  /** Standard 4 legs with hip pivots (for animation). */
  private addLegs(g: THREE.Group, color: number, legH: number, bodyY: number): void {
    const geo = new THREE.BoxGeometry(0.2, legH, 0.2)
    const mat = new THREE.MeshLambertMaterial({ color })
    const placements: Array<{ x: number; z: number; key: 'fl'|'fr'|'bl'|'br' }> = [
      { x: -0.35, z: 0.2, key: 'fl' }, { x: 0.35, z: 0.2, key: 'fr' },
      { x: -0.35, z: -0.2, key: 'bl' }, { x: 0.35, z: -0.2, key: 'br' },
    ]
    for (const p of placements) {
      const hip = new THREE.Group()
      hip.position.set(p.x, legH, p.z)
      const leg = new THREE.Mesh(geo, mat)
      leg.position.y = -legH / 2
      hip.add(leg)
      g.add(hip)
      switch (p.key) {
        case 'fl': this.frontLeftLeg = hip; break
        case 'fr': this.frontRightLeg = hip; break
        case 'bl': this.backLeftLeg = hip; break
        case 'br': this.backRightLeg = hip; break
      }
    }
  }

  /** Shorter legs (chickens, rabbits, cats, etc). */
  private addLegs2(g: THREE.Group, color: number, legH: number, bodyY: number, offset: number): void {
    const geo = new THREE.BoxGeometry(0.12, legH, 0.12)
    const mat = new THREE.MeshLambertMaterial({ color })
    ;[ [-offset,0.15], [offset,0.15], [-offset,-0.1], [offset,-0.1] ].forEach(([x,z]) => {
      const hip = new THREE.Group()
      hip.position.set(x, legH, z)
      const leg = new THREE.Mesh(geo, mat)
      leg.position.y = -legH / 2
      hip.add(leg)
      g.add(hip)
    })
  }

  /** Tall legs (horse, bear, etc). */
  private addLegsTall(g: THREE.Group, color: number, legH: number, bodyY: number, thick: number): void {
    const geo = new THREE.BoxGeometry(thick, legH, thick)
    const mat = new THREE.MeshLambertMaterial({ color })
    ;[ [-0.4,0.2], [0.4,0.2], [-0.4,-0.2], [0.4,-0.2] ].forEach(([x,z]) => {
      const hip = new THREE.Group()
      hip.position.set(x, legH, z)
      const leg = new THREE.Mesh(geo, mat)
      leg.position.y = -legH / 2
      hip.add(leg)
      g.add(hip)
    })
  }
}
