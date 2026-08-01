import * as THREE from 'three'
import { BlockType, getBlockDefinition } from '@/types/blocks'
import { getItemDefinition } from '@/types/items'
import { ChunkManager } from '@/world/ChunkManager'
import { EventBus } from '@/core/EventBus'
import { containerPositionKey, useContainerStore } from '@/ui/stores/containerStore'

type Direction = { x: number; y: number; z: number }

interface RedstoneState {
  type: BlockType
  facing: Direction
  powered: boolean
  extended: boolean
  delay: number
  subtractMode: boolean
  outputPower: number
  pendingPower: boolean | null
  transitionAt: number
  pulseUntil: number
  hopperCooldown: number
}

const DIRECTIONS: Direction[] = [
  { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 },
]

const HORIZONTAL: Direction[] = DIRECTIONS.filter(direction => direction.y === 0)
const REDSTONE_TYPES = new Set<BlockType>([
  BlockType.REDSTONE_DUST, BlockType.PISTON, BlockType.STICKY_PISTON,
  BlockType.REPEATER, BlockType.COMPARATOR, BlockType.OBSERVER, BlockType.HOPPER,
])

/**
 * Deterministic redstone simulation for the block engine. It follows the same
 * core rules as the game: 15-level wire attenuation, directional repeaters and
 * comparators, two-tick observer pulses, 12-block pistons and locked hoppers.
 */
export class RedstoneSystem {
  private states = new Map<string, RedstoneState>()
  private dustPower = new Map<string, number>()
  private changedBlocks = new Set<string>()
  private movedPistons = new Set<string>()
  private accumulator = 0
  private clock = 0

  private readonly onPlaced = (data: {
    position: THREE.Vector3
    blockType: BlockType
    facing?: THREE.Vector3
    attachedFace?: THREE.Vector3
  }) => {
    const position = this.roundPosition(data.position)
    this.changedBlocks.add(this.key(position))
    if (!REDSTONE_TYPES.has(data.blockType)) return

    let facing = this.normalizeDirection(data.facing ?? new THREE.Vector3(0, 0, 1))
    if (data.blockType === BlockType.HOPPER && data.attachedFace) {
      facing = this.normalizeDirection(this.negate(data.attachedFace), true)
    }
    this.states.set(this.key(position), this.createState(data.blockType, facing))
    this.accumulator = 0.05
  }

  private readonly onBroken = (data: { position: THREE.Vector3; blockType: BlockType }) => {
    const position = this.roundPosition(data.position)
    const key = this.key(position)
    const state = this.states.get(key)
    if (state?.extended) {
      const head = this.add(position, state.facing)
      if (this.chunks.getBlock(head.x, head.y, head.z) === BlockType.PISTON_HEAD) this.setBlock(head, BlockType.AIR)
    }
    this.states.delete(key)
    this.dustPower.delete(key)
    this.changedBlocks.add(key)

    if (data.blockType === BlockType.PISTON_HEAD) {
      for (const direction of DIRECTIONS) {
        const base = this.add(position, direction)
        const piston = this.states.get(this.key(base))
        if (!piston || !this.isPiston(piston.type)) continue
        const head = this.add(base, piston.facing)
        if (this.key(head) === key) piston.extended = false
      }
    }
  }

  constructor(
    private readonly chunks: ChunkManager,
    private readonly eventBus: EventBus,
  ) {
    eventBus.on('block:placed', this.onPlaced)
    eventBus.on('block:broke', this.onBroken)
  }

  update(deltaTime: number): void {
    this.clock += deltaTime
    this.accumulator += deltaTime
    while (this.accumulator >= 0.05) {
      this.accumulator -= 0.05
      this.tick(0.05)
    }
  }

  interact(position: THREE.Vector3): boolean {
    const state = this.states.get(this.key(this.roundPosition(position)))
    if (!state) return false
    if (state.type === BlockType.REPEATER) {
      state.delay = state.delay % 4 + 1
      return true
    }
    if (state.type === BlockType.COMPARATOR) {
      state.subtractMode = !state.subtractMode
      return true
    }
    return false
  }

  getPowerLevel(position: THREE.Vector3): number {
    return this.dustPower.get(this.key(this.roundPosition(position))) ?? 0
  }

  dispose(): void {
    this.eventBus.off('block:placed', this.onPlaced)
    this.eventBus.off('block:broke', this.onBroken)
    this.states.clear()
    this.dustPower.clear()
    this.movedPistons.clear()
  }

  private tick(deltaTime: number): void {
    const changesForObservers = new Set(this.changedBlocks)
    this.changedBlocks.clear()
    this.removeMissingDevices()
    this.updateObservers(changesForObservers)
    this.rebuildDustPower()
    this.updateRepeatersAndComparators()
    this.rebuildDustPower()
    this.updatePistons()
    // Pistons may have moved blocks; let observers react to the movement.
    if (this.changedBlocks.size > 0) {
      this.updateObservers(new Set(this.changedBlocks))
    }
    this.updateHoppers(deltaTime)
  }

  private createState(type: BlockType, facing: Direction): RedstoneState {
    return {
      type, facing, powered: false, extended: false, delay: 1,
      subtractMode: false, outputPower: 0, pendingPower: null,
      transitionAt: 0, pulseUntil: 0, hopperCooldown: type === BlockType.HOPPER ? 0.4 : 0,
    }
  }

  private removeMissingDevices(): void {
    for (const [key, state] of this.states) {
      const position = this.parseKey(key)
      const actual = this.chunks.getBlock(position.x, position.y, position.z)
      if (actual === state.type) continue

      // Pistons may have been pushed by another piston. Check the head position.
      if (this.isPiston(state.type)) {
        if (this.movedPistons.has(key)) continue
        const head = this.add(position, state.facing)
        if (state.extended && this.chunks.getBlock(head.x, head.y, head.z) === BlockType.PISTON_HEAD) continue
        // Check if the piston was moved to a nearby position
        const wasMoved = DIRECTIONS.some(direction => {
          const neighbor = this.add(position, direction)
          return this.chunks.getBlock(neighbor.x, neighbor.y, neighbor.z) === state.type
        })
        if (wasMoved) continue
      }

      // The piston base remains unchanged while its temporary head is extended.
      this.states.delete(key)
      this.dustPower.delete(key)
    }
    this.movedPistons.clear()
  }

  private updateObservers(changes: Set<string>): void {
    for (const [key, state] of this.states) {
      if (state.type !== BlockType.OBSERVER) continue
      const position = this.parseKey(key)
      const observed = this.add(position, state.facing)
      if (changes.has(this.key(observed)) && this.clock >= state.pulseUntil) {
        // Minecraft observer pulse lasts two game ticks (one redstone tick).
        state.pulseUntil = this.clock + 0.1
      }
      state.powered = this.clock < state.pulseUntil
      state.outputPower = state.powered ? 15 : 0
    }
  }

  private rebuildDustPower(): void {
    this.dustPower.clear()
    const queue: Array<{ position: Direction; power: number }> = []

    for (const [key, state] of this.states) {
      if (state.type !== BlockType.REDSTONE_DUST) continue
      const position = this.parseKey(key)
      const directPower = this.getDirectPower(position)
      if (directPower > 0) queue.push({ position, power: directPower })
    }

    while (queue.length > 0) {
      const current = queue.shift()!
      const key = this.key(current.position)
      if ((this.dustPower.get(key) ?? -1) >= current.power) continue
      this.dustPower.set(key, current.power)
      if (current.power <= 1) continue

      for (const direction of DIRECTIONS) {
        const neighbor = this.add(current.position, direction)
        const neighborState = this.states.get(this.key(neighbor))
        if (neighborState?.type === BlockType.REDSTONE_DUST) {
          queue.push({ position: neighbor, power: current.power - 1 })
        }
      }
    }
  }

  private updateRepeatersAndComparators(): void {
    for (const [key, state] of this.states) {
      if (state.type !== BlockType.REPEATER && state.type !== BlockType.COMPARATOR) continue
      const position = this.parseKey(key)
      const rear = this.add(position, this.negate(state.facing))
      const sideA = this.add(position, { x: state.facing.z, y: 0, z: -state.facing.x })
      const sideB = this.add(position, { x: -state.facing.z, y: 0, z: state.facing.x })
      const rearPower = state.type === BlockType.COMPARATOR
        ? Math.max(this.signalDeliveredFrom(rear, position), this.containerSignal(rear))
        : this.signalDeliveredFrom(rear, position)
      const sidePower = Math.max(
        this.signalDeliveredFrom(sideA, position),
        this.signalDeliveredFrom(sideB, position),
      )

      if (state.type === BlockType.REPEATER) {
        // A side-powered repeater locks its current output exactly as in-game.
        const sideAType = this.states.get(this.key(sideA))?.type
        const sideBType = this.states.get(this.key(sideB))?.type
        const locked = (sideAType === BlockType.REPEATER || sideAType === BlockType.COMPARATOR ||
          sideBType === BlockType.REPEATER || sideBType === BlockType.COMPARATOR) && sidePower > 0
        if (locked) continue
        const requested = rearPower > 0
        if (requested === state.powered) {
          state.pendingPower = null
        } else if (state.pendingPower !== requested) {
          state.pendingPower = requested
          state.transitionAt = this.clock + state.delay * 0.1
        }
        if (state.pendingPower !== null && this.clock >= state.transitionAt) {
          state.powered = state.pendingPower
          state.pendingPower = null
        }
        state.outputPower = state.powered ? 15 : 0
      } else {
        const output = state.subtractMode
          ? Math.max(0, rearPower - sidePower)
          : (rearPower >= sidePower ? rearPower : 0)
        state.outputPower = output
        state.powered = output > 0
      }
    }
  }

  private updatePistons(): void {
    for (const [key, state] of this.states) {
      if (!this.isPiston(state.type)) continue
      const position = this.parseKey(key)
      const head = this.add(position, state.facing)
      if (state.extended && this.chunks.getBlock(head.x, head.y, head.z) !== BlockType.PISTON_HEAD) {
        state.extended = false
      }
      const shouldExtend = this.getPistonPower(position) > 0
      if (shouldExtend && !state.extended) this.extendPiston(position, state)
      if (!shouldExtend && state.extended) this.retractPiston(position, state)
    }
  }

  private extendPiston(position: Direction, state: RedstoneState): void {
    const line: Array<{ position: Direction; type: BlockType }> = []
    for (let distance = 1; distance <= 13; distance++) {
      const target = this.add(position, this.scale(state.facing, distance))
      const type = this.chunks.getBlock(target.x, target.y, target.z) as BlockType
      if (type === BlockType.AIR || type === BlockType.WATER) break
      if (distance > 12 || !this.canPistonMove(type)) return
      line.push({ position: target, type })
    }

    const destination = this.add(position, this.scale(state.facing, line.length + 1))
    const destinationType = this.chunks.getBlock(destination.x, destination.y, destination.z)
    if (destinationType !== BlockType.AIR && destinationType !== BlockType.WATER) return

    for (let i = line.length - 1; i >= 0; i--) {
      const moved = line[i]
      const target = this.add(moved.position, state.facing)
      this.moveBlock(moved.position, target, moved.type)
      // Track moved pistons so removeMissingDevices doesn't delete them.
      if (this.isPiston(moved.type)) this.movedPistons.add(this.key(moved.position))
    }
    // Mark all moved positions as changed so observers can detect the movement.
    for (const moved of line) {
      this.changedBlocks.add(this.key(this.add(moved.position, state.facing)))
      this.changedBlocks.add(this.key(moved.position))
    }
    const head = this.add(position, state.facing)
    this.setBlock(head, BlockType.PISTON_HEAD)
    state.extended = true
  }

  private retractPiston(position: Direction, state: RedstoneState): void {
    const head = this.add(position, state.facing)
    if (this.chunks.getBlock(head.x, head.y, head.z) === BlockType.PISTON_HEAD) this.setBlock(head, BlockType.AIR)
    this.changedBlocks.add(this.key(head))
    if (state.type === BlockType.STICKY_PISTON) {
      const source = this.add(position, this.scale(state.facing, 2))
      const type = this.chunks.getBlock(source.x, source.y, source.z) as BlockType
      if (type !== BlockType.AIR && type !== BlockType.WATER && this.canPistonMove(type)) {
        this.moveBlock(source, head, type)
        this.changedBlocks.add(this.key(source))
        if (this.isPiston(type)) this.movedPistons.add(this.key(source))
      }
    }
    state.extended = false
  }

  private updateHoppers(deltaTime: number): void {
    for (const [key, state] of this.states) {
      if (state.type !== BlockType.HOPPER) continue
      state.hopperCooldown -= deltaTime
      if (state.hopperCooldown > 0) continue
      state.hopperCooldown = 0.4
      const position = this.parseKey(key)
      if (this.getDirectPower(position) > 0) continue // powered hoppers are locked
      const hopperSlots = this.containerSlots(position, 5, true)
      if (!hopperSlots) continue
      const above = this.add(position, { x: 0, y: 1, z: 0 })
      const sourceSlots = this.containerSlots(above, 27, true)
      if (sourceSlots) this.transferOne(sourceSlots, hopperSlots)
      const output = this.add(position, state.facing)
      const outputSlots = this.containerSlots(output, 27, true)
      if (outputSlots) this.transferOne(hopperSlots, outputSlots)
    }
  }

  private getPistonPower(position: Direction): number {
    let power = this.getDirectPower(position)
    // Quasi-connectivity: pistons also react to power one block above.
    power = Math.max(power, this.getDirectPower(this.add(position, { x: 0, y: 1, z: 0 })))
    return power
  }

  private getDirectPower(position: Direction): number {
    let power = 0
    for (const direction of DIRECTIONS) {
      const source = this.add(position, direction)
      power = Math.max(power, this.signalDeliveredFrom(source, position))
    }
    return power
  }

  private signalAt(position: Direction): number {
    const type = this.chunks.getBlock(position.x, position.y, position.z) as BlockType
    if (type === BlockType.REDSTONE_BLOCK) return 15
    if (type === BlockType.LEVER_ON) return 15
    if (type === BlockType.REDSTONE_DUST) return this.dustPower.get(this.key(position)) ?? 0
    return this.states.get(this.key(position))?.outputPower ?? 0
  }

  private signalDeliveredFrom(source: Direction, target: Direction): number {
    const type = this.chunks.getBlock(source.x, source.y, source.z) as BlockType
    if (type === BlockType.REDSTONE_BLOCK) return 15
    if (type === BlockType.LEVER_ON) return 15
    if (type === BlockType.REDSTONE_DUST) return this.dustPower.get(this.key(source)) ?? 0
    const state = this.states.get(this.key(source))
    if (!state || state.outputPower <= 0) return 0
    if (state.type === BlockType.REPEATER || state.type === BlockType.COMPARATOR) {
      return this.key(this.add(source, state.facing)) === this.key(target) ? state.outputPower : 0
    }
    if (state.type === BlockType.OBSERVER) {
      return this.key(this.add(source, this.negate(state.facing))) === this.key(target) ? state.outputPower : 0
    }
    return 0
  }

  private containerSignal(position: Direction): number {
    const slots = this.containerSlots(position, 27, false)
    if (!slots || slots.length === 0) return 0
    let fullness = 0
    for (const slot of slots) {
      if (!slot.item || slot.count <= 0) continue
      fullness += slot.count / (getItemDefinition(slot.item)?.stackSize ?? 64)
    }
    return fullness <= 0 ? 0 : Math.floor(1 + 14 * fullness / slots.length)
  }

  private containerSlots(position: Direction, defaultSize: number, create: boolean) {
    const type = this.chunks.getBlock(position.x, position.y, position.z) as BlockType
    if (type !== BlockType.CHEST && type !== BlockType.BARREL && type !== BlockType.HOPPER) return null
    const store = useContainerStore()
    const key = containerPositionKey(position.x, position.y, position.z)
    if (!store.containers[key] && create) {
      store.containers[key] = { slots: Array.from({ length: type === BlockType.HOPPER ? 5 : defaultSize }, () => ({ item: null, count: 0 })) }
    }
    return store.containers[key]?.slots ?? null
  }

  private transferOne(from: Array<{ item: string | null; count: number; blockType?: BlockType }>, to: Array<{ item: string | null; count: number; blockType?: BlockType }>): boolean {
    const source = from.find(slot => slot.item && slot.count > 0)
    if (!source?.item) return false
    const maxStack = getItemDefinition(source.item)?.stackSize ?? 64
    let target = to.find(slot => slot.item === source.item && slot.count < maxStack)
    if (!target) target = to.find(slot => !slot.item || slot.count <= 0)
    if (!target) return false
    if (!target.item) {
      target.item = source.item
      target.count = 0
      target.blockType = source.blockType
    }
    target.count++
    source.count--
    if (source.count <= 0) {
      source.item = null
      source.count = 0
      delete source.blockType
    }
    return true
  }

  private canPistonMove(type: BlockType): boolean {
    if (type === BlockType.BEDROCK || type === BlockType.OBSIDIAN || type === BlockType.PISTON_HEAD) return false
    return getBlockDefinition(type).breakable
  }

  private moveBlock(source: Direction, destination: Direction, type: BlockType): void {
    this.setBlock(destination, type)
    this.setBlock(source, BlockType.AIR)
    const sourceKey = this.key(source)
    const state = this.states.get(sourceKey)
    if (state) {
      this.states.delete(sourceKey)
      this.states.set(this.key(destination), state)
    }
    this.moveContainer(source, destination)
  }

  private moveContainer(source: Direction, destination: Direction): void {
    const store = useContainerStore()
    const sourceKey = containerPositionKey(source.x, source.y, source.z)
    const destinationKey = containerPositionKey(destination.x, destination.y, destination.z)
    if (!store.containers[sourceKey]) return
    store.containers[destinationKey] = store.containers[sourceKey]
    delete store.containers[sourceKey]
  }

  private setBlock(position: Direction, type: BlockType): void {
    this.chunks.setBlock(position.x, position.y, position.z, type)
    this.changedBlocks.add(this.key(position))
  }

  private isPiston(type: BlockType): boolean {
    return type === BlockType.PISTON || type === BlockType.STICKY_PISTON
  }

  private roundPosition(position: Direction): Direction {
    return { x: Math.floor(position.x), y: Math.floor(position.y), z: Math.floor(position.z) }
  }

  private normalizeDirection(direction: Direction, allowVertical = false): Direction {
    const values: Array<[keyof Direction, number]> = [['x', direction.x], ['z', direction.z]]
    if (allowVertical) values.push(['y', direction.y])
    values.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    const [axis, value] = values[0]
    return { x: axis === 'x' ? Math.sign(value) || 1 : 0, y: axis === 'y' ? Math.sign(value) || -1 : 0, z: axis === 'z' ? Math.sign(value) || 1 : 0 }
  }

  private add(a: Direction, b: Direction): Direction {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
  }

  private scale(direction: Direction, amount: number): Direction {
    return { x: direction.x * amount, y: direction.y * amount, z: direction.z * amount }
  }

  private negate(direction: Direction): Direction {
    return { x: -direction.x, y: -direction.y, z: -direction.z }
  }

  private key(position: Direction): string {
    return `${position.x},${position.y},${position.z}`
  }

  private parseKey(key: string): Direction {
    const [x, y, z] = key.split(',').map(Number)
    return { x, y, z }
  }
}
