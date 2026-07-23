import { Character } from '../Character'
import * as THREE from 'three'

/**
 * EnderDragon - 末影龙
 * 血量: 200, 攻击力: 不高 (5, but large area)
 */
export class EnderDragon extends Character {
  private phase: 'circling' | 'diving' | 'perching' = 'circling'
  private circleAngle = 0
  private circleRadius = 30
  private circleCenter = new THREE.Vector3(0, 60, 0)
  private wingAngle = 0

  constructor(id: string = 'ender_dragon') {
    super(id, 200, 5, 8, 5)
    this.createModel()
  }

  private createModel(): void {
    const group = new THREE.Group()
    const bodyColor = 0x1A1A1A
    const purpleAccent = 0x6B238B

    // Body (long, serpentine)
    const bodyGeo = new THREE.BoxGeometry(2, 1.5, 5)
    const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    group.add(body)

    // Head
    const headGeo = new THREE.BoxGeometry(1.5, 1.2, 2)
    const headMat = new THREE.MeshLambertMaterial({ color: bodyColor })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.set(0, 0.3, 3.2)
    group.add(head)

    // Eyes (purple)
    const eyeGeo = new THREE.BoxGeometry(0.3, 0.2, 0.1)
    const eyeMat = new THREE.MeshLambertMaterial({ color: purpleAccent, emissive: purpleAccent, emissiveIntensity: 0.8 })
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
    leftEye.position.set(-0.4, 0.5, 4.15)
    group.add(leftEye)
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
    rightEye.position.set(0.4, 0.5, 4.15)
    group.add(rightEye)

    // Wings
    const wingGeo = new THREE.BoxGeometry(6, 0.1, 3)
    const wingMat = new THREE.MeshLambertMaterial({ color: 0x2A2A2A, transparent: true, opacity: 0.8 })
    const leftWing = new THREE.Mesh(wingGeo, wingMat)
    leftWing.position.set(-4, 0.5, -0.5)
    leftWing.name = 'leftWing'
    group.add(leftWing)
    const rightWing = new THREE.Mesh(wingGeo, wingMat)
    rightWing.position.set(4, 0.5, -0.5)
    rightWing.name = 'rightWing'
    group.add(rightWing)

    // Tail segments
    for (let i = 0; i < 5; i++) {
      const segSize = 1.2 - i * 0.15
      const segGeo = new THREE.BoxGeometry(segSize, segSize * 0.8, 1.5)
      const segMat = new THREE.MeshLambertMaterial({ color: bodyColor })
      const seg = new THREE.Mesh(segGeo, segMat)
      seg.position.set(0, 0, -3 - i * 1.5)
      group.add(seg)
    }

    // Horns
    const hornGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15)
    const hornMat = new THREE.MeshLambertMaterial({ color: 0x333333 })
    const leftHorn = new THREE.Mesh(hornGeo, hornMat)
    leftHorn.position.set(-0.5, 1.1, 3)
    group.add(leftHorn)
    const rightHorn = new THREE.Mesh(hornGeo, hornMat)
    rightHorn.position.set(0.5, 1.1, 3)
    group.add(rightHorn)

    this.mesh = group
  }

  protected updateAI(dt: number): void {
    this.stateTimer -= dt
    this.wingAngle += dt * 3

    // Animate wings
    const leftWing = this.mesh.getObjectByName('leftWing')
    const rightWing = this.mesh.getObjectByName('rightWing')
    if (leftWing && rightWing) {
      leftWing.rotation.z = Math.sin(this.wingAngle) * 0.3
      rightWing.rotation.z = -Math.sin(this.wingAngle) * 0.3
    }

    switch (this.phase) {
      case 'circling':
        this.circleAngle += dt * 0.3
        const targetX = this.circleCenter.x + Math.cos(this.circleAngle) * this.circleRadius
        const targetZ = this.circleCenter.z + Math.sin(this.circleAngle) * this.circleRadius
        const targetY = this.circleCenter.y + Math.sin(this.circleAngle * 0.5) * 10

        this.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), dt * 0.5)
        this.velocity.set(0, 0, 0)

        // Face direction of travel
        this.mesh.rotation.y = -this.circleAngle + Math.PI / 2

        // Randomly dive
        if (this.stateTimer <= 0) {
          this.phase = 'diving'
          this.stateTimer = 5
        }
        break

      case 'diving':
        // Dive toward center
        const diveTarget = this.circleCenter.clone()
        diveTarget.y -= 20
        this.position.lerp(diveTarget, dt * 0.8)
        this.mesh.lookAt(diveTarget)

        if (this.stateTimer <= 0) {
          this.phase = 'circling'
          this.stateTimer = 10 + Math.random() * 10
        }
        break

      case 'perching':
        if (this.stateTimer <= 0) {
          this.phase = 'circling'
          this.stateTimer = 15
        }
        break
    }

    this.velocity.set(0, 0, 0) // Dragon flies, no gravity
    this.onGround = false
  }

  protected applyMovement(_dt: number): void {
    // Dragon flies, skip ground movement
  }

  protected applyCollision(_dt: number): void {
    // Dragon flies, skip collision
  }

  protected getMoveSpeed(): number {
    return 5
  }
}
