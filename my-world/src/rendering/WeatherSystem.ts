import * as THREE from 'three'

export type WeatherType = 'clear' | 'rain' | 'snow' | 'thunder'

/**
 * WeatherSystem — particle-based rain, snow, and thunder effects.
 * Spawns particles in a cylinder around the player and follows the camera.
 */
interface LightningBolt {
  group: THREE.Group
  age: number
  lifetime: number
  groundPos: THREE.Vector3
}

export class WeatherSystem {
  public current: WeatherType = 'clear'
  public target: WeatherType = 'clear'

  private transition = 0
  public intensity = 0
  private lastActiveWeather: WeatherType = 'clear'

  // Rain / Snow
  private rainParticles: THREE.Points | null = null
  private rainVelocities: Float32Array | null = null
  private snowParticles: THREE.Points | null = null
  private snowVelocities: Float32Array | null = null

  // Thunder
  private thunderFlash = 0
  private thunderTimer = 0
  private thunderStrikes: number[] = []
  private thunderStrikeDelay = 0

  // Lightning bolt meshes
  private bolts: LightningBolt[] = []
  private scene: THREE.Scene | null = null

  /** Callbacks */
  public onThunder: ((loudness: number) => void) | null = null
  /** Called with the world-space ground position where lightning strikes. */
  public onLightningStrike: ((pos: THREE.Vector3) => void) | null = null
  /** Returns the terrain height at (x, z). */
  public getGroundHeight: ((x: number, z: number) => number) | null = null
  /** Returns current player world position. */
  public getPlayerPos: (() => THREE.Vector3) | null = null

  // Config
  private readonly rainCount = 6000
  private readonly snowCount = 4000
  private readonly radius = 48
  private readonly rainHeight = 40
  private readonly snowHeight = 36
  private readonly boltHeight = 140   // bolt starts this high above ground

  constructor() {
    this.createRain()
    this.createSnow()
    this.scheduleThunder()
  }

  // ─── Rain particle system ───

  private createRain(): void {
    const count = this.rainCount
    const positions = new Float32Array(count * 3)
    this.rainVelocities = new Float32Array(count) // only Y speed; wx/wz by wind
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * this.radius * 2
      positions[i * 3 + 1] = Math.random() * this.rainHeight
      positions[i * 3 + 2] = (Math.random() - 0.5) * this.radius * 2
      this.rainVelocities[i] = 18 + Math.random() * 14 // fall speed m/s
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const mat = new THREE.PointsMaterial({
      color: 0x6688bb,
      size: 0.12,
      transparent: true,
      opacity: 0.55,
      blending: THREE.NormalBlending,
      depthWrite: false,
    })

    this.rainParticles = new THREE.Points(geo, mat)
    this.rainParticles.visible = false
    this.rainParticles.renderOrder = 998
  }

  // ─── Snow particle system ───

  private createSnow(): void {
    const count = this.snowCount
    const positions = new Float32Array(count * 3)
    this.snowVelocities = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * this.radius * 2
      positions[i * 3 + 1] = Math.random() * this.snowHeight
      positions[i * 3 + 2] = (Math.random() - 0.5) * this.radius * 2
      this.snowVelocities[i] = 0.6 + Math.random() * 1.2
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.18,
      transparent: true,
      opacity: 0.7,
      blending: THREE.NormalBlending,
      depthWrite: false,
    })

    this.snowParticles = new THREE.Points(geo, mat)
    this.snowParticles.visible = false
    this.snowParticles.renderOrder = 998
  }

  // ─── Thunder scheduling ───

  private scheduleThunder(): void {
    // Next strike group in 1.5–8 seconds (much more frequent)
    this.thunderTimer = 1.5 + Math.random() * 6.5
  }

  /** Start a multi-strike flash group (1–4 rapid strikes). */
  private startThunderGroup(): void {
    const count = 1 + Math.floor(Math.random() * 4) // 1–4 strikes
    this.thunderStrikes = []
    for (let i = 0; i < count; i++) {
      this.thunderStrikes.push(0.5 + Math.random() * 0.5) // brightness 0.5–1.0
    }
    this.thunderStrikeDelay = 0
  }

  /** Pick a random position near the player and spawn a bolt to ground. */
  private spawnBoltAtRandomPos(): void {
    const playerPos = this.getPlayerPos?.()
    if (!playerPos) return
    const angle = Math.random() * Math.PI * 2
    const dist = 3 + Math.random() * 20 // 3–23 blocks from player
    const gx = playerPos.x + Math.cos(angle) * dist
    const gz = playerPos.z + Math.sin(angle) * dist
    const gy = this.getGroundHeight?.(gx, gz) ?? (playerPos.y - 2)
    this.spawnLightningBolt(gx, gz, gy)
  }

  // ─── Public API ───

  /** Request a weather change. Transitions smoothly. */
  request(type: WeatherType): void {
    if (this.target === type) return
    this.target = type
    this.transition = 0
  }

  /** Immediate cut — useful on world load. */
  force(type: WeatherType): void {
    this.current = type
    this.target = type
    this.transition = 1
    this.intensity = type === 'clear' ? 0 : (type === 'thunder' ? 1 : 0.8)
  }

  getThunderFlash(): number {
    return this.thunderFlash
  }

  // ─── Per-frame update ───

  update(playerPos: THREE.Vector3, dt: number, _daylight: number): void {
    // Transition
    if (this.current !== this.target) {
      this.transition = Math.min(1, this.transition + dt * 0.3) // ~3s fade
      if (this.transition >= 1) {
        this.current = this.target
      }
    }

    // Intensity
    const targetIntensity = this.current === 'clear' ? 0
      : (this.current === 'thunder' ? 1.0 : 0.8)
    this.intensity += (targetIntensity - this.intensity) * Math.min(dt * 2, 1)

    const active = this.current !== 'clear'
    const isSnow = this.current === 'snow'

    // Rain
    if (this.rainParticles) {
      this.rainParticles.visible = active && !isSnow
      if (this.rainParticles.visible) {
        this.updateRain(playerPos, dt)
      }
    }

    // Snow
    if (this.snowParticles) {
      this.snowParticles.visible = active && isSnow
      if (this.snowParticles.visible) {
        this.updateSnow(playerPos, dt)
      }
    }

    // Thunder — start immediately on transition
    if (this.current === 'thunder') {
      if (this.lastActiveWeather !== 'thunder') {
        this.thunderTimer = 0.3 // first flash almost immediately
        this.thunderStrikes = []
        this.thunderStrikeDelay = 0
        this.lastActiveWeather = 'thunder'
      }
      this.updateThunder(dt)
    } else {
      this.thunderFlash = 0
      this.lastActiveWeather = this.current
    }

    // Always update bolt meshes (fade / remove expired)
    this.updateBolts(dt)
  }

  // ─── Lightning bolt 3D mesh ───

  /** Create a jagged lightning bolt from the sky to a ground position. */
  private spawnLightningBolt(groundX: number, groundZ: number, groundY: number): void {
    if (!this.scene) return

    const startY = groundY + this.boltHeight
    const end = new THREE.Vector3(groundX, groundY, groundZ)
    const start = new THREE.Vector3(groundX, groundY + this.boltHeight, groundZ)
    // Add slight random offset to the top so bolts aren't perfectly vertical
    start.x += (Math.random() - 0.5) * 6
    start.z += (Math.random() - 0.5) * 6

    const group = new THREE.Group()

    // Main bolt + 1–3 branches
    const branchCount = 1 + Math.floor(Math.random() * 3)
    for (let b = 0; b < branchCount; b++) {
      const isMain = b === 0
      const branchEnd = end.clone()
      if (!isMain) {
        // Branches fork off halfway down and go sideways
        const forkT = 0.3 + Math.random() * 0.4
        const forkPoint = start.clone().lerp(end, forkT)
        branchEnd.copy(forkPoint).add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            -Math.random() * 4,
            (Math.random() - 0.5) * 8,
          ),
        )
      }

      const segments = 10 + Math.floor(Math.random() * 8)
      const points: THREE.Vector3[] = [start.clone()]
      const fullDir = branchEnd.clone().sub(start)
      const length = fullDir.length()
      const step = length / segments
      const stepDir = fullDir.normalize()
      const perp1 = new THREE.Vector3(-stepDir.z, 0, stepDir.x).normalize()
      const perp2 = new THREE.Vector3().crossVectors(stepDir, perp1).normalize()

      for (let i = 1; i < segments; i++) {
        const t = i / segments
        const p = start.clone().addScaledVector(stepDir, t * length)
        // Max offset near the middle of the bolt, less at ends
        const jitter = (1 - Math.abs(t - 0.5) * 1.8) * length * 0.08
        p.addScaledVector(perp1, (Math.random() - 0.5) * jitter)
        p.addScaledVector(perp2, (Math.random() - 0.5) * jitter)
        points.push(p)
      }
      points.push(branchEnd.clone())

      const curve = new THREE.CatmullRomCurve3(points)
      const radius = isMain ? 0.06 : 0.03
      const tubeGeo = new THREE.TubeGeometry(curve, segments * 2, radius, 5, false)
      const mat = new THREE.MeshBasicMaterial({
        color: isMain ? 0xffffff : 0xccddff,
        transparent: true,
        opacity: isMain ? 1 : 0.7,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(tubeGeo, mat)
      group.add(mesh)
    }

    // Glow sphere at strike point
    const glowGeo = new THREE.SphereGeometry(0.5, 6, 6)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xaaccff,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.position.copy(end)
    group.add(glow)

    this.scene.add(group)

    const lifetime = 0.12 + Math.random() * 0.18
    this.bolts.push({
      group,
      age: 0,
      lifetime,
      groundPos: end.clone(),
    })

    // Notify about the strike position
    this.onLightningStrike?.(end.clone())
  }

  private updateBolts(dt: number): void {
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const bolt = this.bolts[i]
      bolt.age += dt
      const remaining = 1 - bolt.age / bolt.lifetime
      if (remaining <= 0) {
        this.scene?.remove(bolt.group)
        bolt.group.traverse((c) => {
          if (c instanceof THREE.Mesh) {
            c.geometry.dispose()
            ;(c.material as THREE.Material).dispose()
          }
        })
        this.bolts.splice(i, 1)
      } else {
        // Fade out
        bolt.group.children.forEach((c) => {
          if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshBasicMaterial) {
            c.material.opacity = remaining
          }
        })
      }
    }
  }

  private updateRain(origin: THREE.Vector3, dt: number): void {
    const pts = this.rainParticles!
    const pos = pts.geometry.attributes.position.array as Float32Array
    const count = this.rainCount
    const cx = origin.x, cy = origin.y, cz = origin.z
    const windX = 2.5, windZ = 1.2
    const r2 = this.radius

    for (let i = 0; i < count; i++) {
      const j = i * 3
      // Fall
      pos[j + 1] -= (this.rainVelocities?.[i] ?? 25) * dt
      // Wind drift
      pos[j]     += windX * dt
      pos[j + 2] += windZ * dt

      // Respawn above if below kill plane
      if (pos[j + 1] < cy - 2) {
        pos[j]     = cx + (Math.random() - 0.5) * r2 * 2
        pos[j + 1] = cy + this.rainHeight + Math.random() * 8
        pos[j + 2] = cz + (Math.random() - 0.5) * r2 * 2
      }
      // Wrap horizontally
      if (Math.abs(pos[j] - cx) > r2) pos[j] = cx + (Math.random() - 0.5) * r2 * 2
      if (Math.abs(pos[j + 2] - cz) > r2) pos[j + 2] = cz + (Math.random() - 0.5) * r2 * 2
    }
    pts.geometry.attributes.position.needsUpdate = true

    // Fade rain opacity with intensity
    const mat = pts.material as THREE.PointsMaterial
    mat.opacity = this.intensity * 0.55
  }

  private updateSnow(origin: THREE.Vector3, dt: number): void {
    const pts = this.snowParticles!
    const pos = pts.geometry.attributes.position.array as Float32Array
    const count = this.snowCount
    const cx = origin.x, cy = origin.y, cz = origin.z
    const r2 = this.radius
    const driftStrength = 0.6
    const t = performance.now() * 0.001

    for (let i = 0; i < count; i++) {
      const j = i * 3
      const fallSpeed = this.snowVelocities?.[i] ?? 1.0
      // Gentle fall
      pos[j + 1] -= fallSpeed * dt
      // Swaying drift
      pos[j]     += Math.sin(t * 1.3 + i * 0.07) * driftStrength * dt
      pos[j + 2] += Math.cos(t * 1.7 + i * 0.11) * driftStrength * dt

      if (pos[j + 1] < cy - 2) {
        pos[j]     = cx + (Math.random() - 0.5) * r2 * 2
        pos[j + 1] = cy + this.snowHeight + Math.random() * 6
        pos[j + 2] = cz + (Math.random() - 0.5) * r2 * 2
      }
      if (Math.abs(pos[j] - cx) > r2) pos[j] = cx + (Math.random() - 0.5) * r2 * 2
      if (Math.abs(pos[j + 2] - cz) > r2) pos[j + 2] = cz + (Math.random() - 0.5) * r2 * 2
    }
    pts.geometry.attributes.position.needsUpdate = true

    const mat = pts.material as THREE.PointsMaterial
    mat.opacity = this.intensity * 0.7
  }

  private updateThunder(dt: number): void {
    // ── Phase 1: inter-strike gap (delay ticking down) ──
    if (this.thunderStrikeDelay > 0) {
      this.thunderStrikeDelay -= dt
      // Flash naturally decays during the gap between strikes
      this.thunderFlash = Math.max(0, this.thunderFlash - dt * 5)

      // Delay expired → fire next strike or exit decay phase
      if (this.thunderStrikeDelay <= 0) {
        if (this.thunderStrikes.length > 0) {
          // More strikes queued — fire immediately
          const b = this.thunderStrikes.shift()!
          this.thunderFlash = b
          this.thunderStrikeDelay = 0.08 + Math.random() * 0.27
          this.onThunder?.(b)
          this.spawnBoltAtRandomPos()
        }
        // else: no more strikes — fall through to decay below
      }
      return
    }

    // ── Phase 2: fire first strike (no delay, strikes queued) ──
    if (this.thunderStrikes.length > 0) {
      const b = this.thunderStrikes.shift()!
      this.thunderFlash = b
      this.thunderStrikeDelay = this.thunderStrikes.length > 0
        ? 0.08 + Math.random() * 0.27
        : 0
      this.onThunder?.(b)
      this.spawnBoltAtRandomPos()
      return
    }

    // ── Phase 3: flash decay (all strikes done, no delay pending) ──
    if (this.thunderFlash > 0) {
      this.thunderFlash = Math.max(0, this.thunderFlash - dt * 3.5)
      if (this.thunderFlash <= 0) {
        this.thunderFlash = 0
        this.scheduleThunder()
      }
      return
    }

    // ── Phase 4: wait before next group ──
    this.thunderTimer -= dt
    if (this.thunderTimer <= 0) {
      this.startThunderGroup()
    }
  }

  /** Add both particle systems to a scene. */
  addToScene(scene: THREE.Scene): void {
    this.scene = scene
    if (this.rainParticles) scene.add(this.rainParticles)
    if (this.snowParticles) scene.add(this.snowParticles)
  }

  dispose(): void {
    if (this.rainParticles) {
      this.rainParticles.geometry.dispose()
      const mat = this.rainParticles.material as THREE.Material
      mat.dispose()
    }
    if (this.snowParticles) {
      this.snowParticles.geometry.dispose()
      const mat = this.snowParticles.material as THREE.Material
      mat.dispose()
    }
    // Clean up any remaining bolts
    for (const bolt of this.bolts) {
      this.scene?.remove(bolt.group)
      bolt.group.traverse((c) => {
        if (c instanceof THREE.Mesh) {
          c.geometry.dispose()
          ;(c.material as THREE.Material).dispose()
        }
      })
    }
    this.bolts = []
  }
}
