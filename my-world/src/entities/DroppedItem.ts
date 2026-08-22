import * as THREE from 'three'
import { Entity } from './Entity'
import { BLOCK_REGISTRY } from '@/types/blocks'
import { ITEM_REGISTRY } from '@/types/items'

// Simple color map for items without block textures
const ITEM_COLORS: Record<string, number> = {
  stick: 0x8B6914,
  iron_ingot: 0xD4D4D4,
  gold_ingot: 0xFFD700,
  diamond: 0x33E5FF,
  netherite_ingot: 0x4A3947,
  emerald: 0x50FF50,
  coal: 0x333333,
  redstone: 0xFF0000,
  lapis_lazuli: 0x2244CC,
  flint: 0x555555,
  string: 0xDDDDDD,
  feather: 0xEEEEEE,
  leather: 0xC68642,
  gunpowder: 0x777777,
  bone: 0xEEFFCC,
  arrow: 0xBBAA88,
  bow: 0xBB8844,
  fishing_rod: 0xAA8844,
  apple: 0xFF3333,
  bread: 0xBB8844,
  bucket: 0x888888,
  water_bucket: 0x4488FF,
  lava_bucket: 0xFF4400,
  paper: 0xFFFFFF,
  book: 0x884422,
  slime_ball: 0x77FF77,
  ender_pearl: 0x116644,
  blaze_rod: 0xFFAA00,
  blaze_powder: 0xFFCC44,
}

const BLOCK_TO_DISPLAY_COLOR: Record<number, number> = {
  2: 0x8B6914,  // grass_block → brown-ish
  3: 0x8B6914,  // dirt
  1: 0x888888,  // stone
  4: 0x777777,  // cobblestone
  12: 0xD4C8A0, // sand
  17: 0xA08060, // oak_log
  5: 0xC4A050, // oak_planks
  20: 0xCCFFFF, // glass
  85: 0xDDDDFF, // iron_block
  41: 0xFFFF44, // gold_block
  57: 0x33FFDD, // diamond_block
}

function getItemColor(itemId: string, blockType?: number): number {
  if (blockType !== undefined && BLOCK_TO_DISPLAY_COLOR[blockType]) {
    return BLOCK_TO_DISPLAY_COLOR[blockType]
  }
  if (blockType !== undefined && BLOCK_REGISTRY[blockType]) {
    // Derive a color from the block type value
    return ((blockType * 1234567) & 0xFFFFFF)
  }
  if (ITEM_COLORS[itemId]) {
    return ITEM_COLORS[itemId]
  }
  // Derive a color from the item name hash
  let hash = 0
  for (let i = 0; i < itemId.length; i++) {
    hash = ((hash << 5) - hash) + itemId.charCodeAt(i)
    hash |= 0
  }
  return (hash & 0xFFFFFF) | 0x444444
}

export class DroppedItem extends Entity {
  public itemId: string
  public count: number
  public blockType?: number
  public age: number = 0
  public pickupDelay: number = 800 // ms before pickup allowed
  public despawnTime: number = 300000 // 5 minutes

  private bobOffset: number
  private spinSpeed: number
  private itemMesh: THREE.Mesh

  constructor(
    id: string,
    itemId: string,
    count: number,
    position: THREE.Vector3,
    blockType?: number,
  ) {
    super(id, 100, 0, 0.25, 0.25)
    this.itemId = itemId
    this.count = count
    this.blockType = blockType
    this.position.copy(position)

    // Slight random velocity so items scatter
    this.velocity.set(
      (Math.random() - 0.5) * 2,
      3 + Math.random() * 2,
      (Math.random() - 0.5) * 2,
    )

    this.bobOffset = Math.random() * Math.PI * 2
    this.spinSpeed = 1.5 + Math.random() * 2

    // Create item mesh
    const size = 0.15
    const geometry = new THREE.BoxGeometry(size, size, size)
    const color = getItemColor(itemId, blockType)
    const material = new THREE.MeshLambertMaterial({ color })
    this.itemMesh = new THREE.Mesh(geometry, material)
    this.mesh.add(this.itemMesh)

    // Add a subtle outline/glow
    const outlineGeo = new THREE.BoxGeometry(size * 1.15, size * 1.15, size * 1.15)
    const outlineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, wireframe: false })
    const outline = new THREE.Mesh(outlineGeo, outlineMat)
    this.mesh.add(outline)
  }

  update(dt: number): void {
    this.age += dt * 1000

    // Bob animation
    this.bobOffset += dt * 3
    const bobY = Math.sin(this.bobOffset) * 0.05
    this.itemMesh.position.y = bobY

    // Spin
    this.itemMesh.rotation.y += dt * this.spinSpeed

    // Gravity
    if (!this.onGround) {
      this.velocity.y -= 15 * dt
    }

    // Apply velocity
    this.position.x += this.velocity.x * dt
    this.position.y += this.velocity.y * dt
    this.position.z += this.velocity.z * dt

    // Friction
    this.velocity.x *= Math.pow(0.1, dt)
    this.velocity.z *= Math.pow(0.1, dt)

    // Stop small movements
    if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0
    if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0

    // Update mesh position
    this.mesh.position.copy(this.position)
  }

  /** Whether the player can pick this up */
  canPickup(): boolean {
    return this.age > this.pickupDelay
  }

  /** Whether this item should despawn */
  shouldDespawn(): boolean {
    return this.age > this.despawnTime
  }
}
