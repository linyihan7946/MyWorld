import * as THREE from 'three'
import { FOV, NEAR_PLANE, FAR_PLANE } from '@/utils/constants'

/**
 * CameraManager - 管理第一/第三人称相机切换
 */
export class CameraManager {
  public perspectiveCamera: THREE.PerspectiveCamera
  public mode: 'firstPerson' | 'thirdPerson' = 'firstPerson'

  // Third person settings
  private thirdPersonDistance = 5
  private thirdPersonPitch = -0.3

  // Player reference
  private targetPosition = new THREE.Vector3(0, 70, 0)
  private yaw = 0
  private pitch = 0
  private collisionRaycast: ((origin: THREE.Vector3, direction: THREE.Vector3, distance: number) => number | null) | null = null

  constructor(aspect: number) {
    this.perspectiveCamera = new THREE.PerspectiveCamera(FOV, aspect, NEAR_PLANE, FAR_PLANE)
    this.perspectiveCamera.position.set(0, 70, 0)
  }

  get activeCamera(): THREE.PerspectiveCamera {
    return this.perspectiveCamera
  }

  /**
   * 设置目标位置（玩家位置）
   */
  setTargetPosition(pos: THREE.Vector3): void {
    this.targetPosition.copy(pos)
  }

  /**
   * 设置相机朝向
   */
  setRotation(yaw: number, pitch: number): void {
    this.yaw = yaw
    this.pitch = pitch
  }

  getRotation(): { yaw: number; pitch: number } {
    return { yaw: this.yaw, pitch: this.pitch }
  }

  /**
   * 切换相机模式
   */
  toggleMode(): void {
    this.mode = this.mode === 'firstPerson' ? 'thirdPerson' : 'firstPerson'
  }

  setCollisionRaycast(
    raycast: (origin: THREE.Vector3, direction: THREE.Vector3, distance: number) => number | null,
  ): void {
    this.collisionRaycast = raycast
  }

  /**
   * 每帧更新相机位置
   */
  update(): void {
    if (this.mode === 'firstPerson') {
      this.updateFirstPerson()
    } else {
      this.updateThirdPerson()
    }
  }

  private updateFirstPerson(): void {
    this.perspectiveCamera.position.copy(this.targetPosition)
    this.perspectiveCamera.position.y += 1.62 // Eye height

    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ')
    this.perspectiveCamera.quaternion.setFromEuler(euler)
  }

  private updateThirdPerson(): void {
    const focus = this.targetPosition.clone().add(new THREE.Vector3(0, 1.4, 0))
    const offset = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.thirdPersonPitch) * this.thirdPersonDistance,
      -Math.sin(this.thirdPersonPitch) * this.thirdPersonDistance + 0.6,
      Math.cos(this.yaw) * Math.cos(this.thirdPersonPitch) * this.thirdPersonDistance,
    )
    const distance = offset.length()
    const direction = offset.clone().normalize()
    let cameraDistance = distance

    // 将相机拉到碰撞面之前，防止第三人称相机穿墙后产生“透视”。
    const hitDistance = this.collisionRaycast?.(focus, direction, distance)
    if (hitDistance !== null && hitDistance !== undefined) {
      cameraDistance = Math.max(0.25, hitDistance - 0.15)
    }

    this.perspectiveCamera.position.copy(focus).addScaledVector(direction, cameraDistance)
    this.perspectiveCamera.lookAt(focus)
  }

  /**
   * 更新宽高比
   */
  setAspect(aspect: number): void {
    this.perspectiveCamera.aspect = aspect
    this.perspectiveCamera.updateProjectionMatrix()
  }

  /**
   * 获取相机前方方向向量
   */
  getForwardDirection(): THREE.Vector3 {
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'))
    return direction.normalize()
  }
}
