import { Character } from '../Character'
import * as THREE from 'three'

/**
 * Steve - 玩家角色
 * 血量: 10, 攻击力: 10
 */
export class Steve extends Character {
  constructor(id: string = 'steve') {
    super(id, 10, 10, 0.6, 1.8)
    this.createModel()
  }

  private createModel(): void {
    const group = new THREE.Group()

    // Head (skin colored)
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5)
    const headMat = new THREE.MeshLambertMaterial({ color: 0xD4A574 })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = 1.55
    group.add(head)

    // Hair (dark brown)
    const hairGeo = new THREE.BoxGeometry(0.52, 0.25, 0.52)
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x3B2507 })
    const hair = new THREE.Mesh(hairGeo, hairMat)
    hair.position.y = 1.7
    group.add(hair)

    // Body (cyan shirt)
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.75, 0.25)
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x00AAAA })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.95
    group.add(body)

    // Arms (pivot at shoulder for swing animation)
    const armGeo = new THREE.BoxGeometry(0.25, 0.75, 0.25)
    const armMat = new THREE.MeshLambertMaterial({ color: 0xD4A574 })

    const leftShoulder = new THREE.Group()
    leftShoulder.position.set(-0.375, 1.325, 0)
    const leftArmMesh = new THREE.Mesh(armGeo, armMat)
    leftArmMesh.position.y = -0.375
    leftShoulder.add(leftArmMesh)
    group.add(leftShoulder)
    this.leftArm = leftShoulder

    const rightShoulder = new THREE.Group()
    rightShoulder.position.set(0.375, 1.325, 0)
    const rightArmMesh = new THREE.Mesh(armGeo, armMat)
    rightArmMesh.position.y = -0.375
    rightShoulder.add(rightArmMesh)
    group.add(rightShoulder)
    this.rightArm = rightShoulder

    // Legs (pivot at hip for walk animation)
    const legGeo = new THREE.BoxGeometry(0.25, 0.75, 0.25)
    const legMat = new THREE.MeshLambertMaterial({ color: 0x1A1A6B })

    const leftHip = new THREE.Group()
    leftHip.position.set(-0.125, 0.75, 0)
    const leftLegMesh = new THREE.Mesh(legGeo, legMat)
    leftLegMesh.position.y = -0.375
    leftHip.add(leftLegMesh)
    group.add(leftHip)
    this.leftLeg = leftHip

    const rightHip = new THREE.Group()
    rightHip.position.set(0.125, 0.75, 0)
    const rightLegMesh = new THREE.Mesh(legGeo, legMat)
    rightLegMesh.position.y = -0.375
    rightHip.add(rightLegMesh)
    group.add(rightHip)
    this.rightLeg = rightHip

    this.mesh = group
  }

  protected updateAI(_dt: number): void {
    // Player is controlled by input, no AI
  }
}
