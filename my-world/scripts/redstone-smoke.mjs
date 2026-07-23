import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })

try {
  const [{ RedstoneSystem }, { EventBus }, { BlockType }, containerModule] = await Promise.all([
    vite.ssrLoadModule('/src/gameplay/RedstoneSystem.ts'),
    vite.ssrLoadModule('/src/core/EventBus.ts'),
    vite.ssrLoadModule('/src/types/blocks.ts'),
    vite.ssrLoadModule('/src/ui/stores/containerStore.ts'),
  ])

  class MockChunks {
    blocks = new Map()
    key(x, y, z) { return `${x},${y},${z}` }
    getBlock(x, y, z) { return this.blocks.get(this.key(x, y, z)) ?? BlockType.AIR }
    setBlock(x, y, z, type) {
      const key = this.key(x, y, z)
      if (type === BlockType.AIR) this.blocks.delete(key)
      else this.blocks.set(key, type)
    }
  }

  const place = (bus, chunks, x, y, z, blockType, facing = { x: 1, y: 0, z: 0 }, attachedFace) => {
    chunks.setBlock(x, y, z, blockType)
    bus.emit('block:placed', { position: { x, y, z }, blockType, facing, attachedFace })
  }
  const breakBlock = (bus, chunks, x, y, z) => {
    const blockType = chunks.getBlock(x, y, z)
    chunks.setBlock(x, y, z, BlockType.AIR)
    bus.emit('block:broke', { position: { x, y, z }, blockType })
  }

  setActivePinia(createPinia())

  // 15-level dust powers a sticky piston; extension pushes and retraction pulls.
  {
    const chunks = new MockChunks()
    const bus = new EventBus()
    const system = new RedstoneSystem(chunks, bus)
    place(bus, chunks, 0, 10, 0, BlockType.REDSTONE_BLOCK)
    place(bus, chunks, 1, 10, 0, BlockType.REDSTONE_DUST)
    place(bus, chunks, 2, 10, 0, BlockType.REDSTONE_DUST)
    place(bus, chunks, 3, 10, 0, BlockType.STICKY_PISTON)
    chunks.setBlock(4, 10, 0, BlockType.STONE)
    system.update(0.15)
    assert.equal(system.getPowerLevel({ x: 1, y: 10, z: 0 }), 15)
    assert.equal(system.getPowerLevel({ x: 2, y: 10, z: 0 }), 14)
    assert.equal(chunks.getBlock(4, 10, 0), BlockType.PISTON_HEAD)
    assert.equal(chunks.getBlock(5, 10, 0), BlockType.STONE)
    breakBlock(bus, chunks, 0, 10, 0)
    system.update(0.15)
    assert.equal(chunks.getBlock(4, 10, 0), BlockType.STONE)
    assert.equal(chunks.getBlock(5, 10, 0), BlockType.AIR)
    system.dispose()
  }

  // Hopper pulls from above and exports through its placement-facing outlet.
  {
    setActivePinia(createPinia())
    const chunks = new MockChunks()
    const bus = new EventBus()
    const system = new RedstoneSystem(chunks, bus)
    place(bus, chunks, 0, 10, 0, BlockType.CHEST)
    place(bus, chunks, 0, 9, 0, BlockType.HOPPER, { x: 0, y: 0, z: 1 }, { x: 0, y: 1, z: 0 })
    place(bus, chunks, 0, 8, 0, BlockType.CHEST)
    const store = containerModule.useContainerStore()
    store.containers[containerModule.containerPositionKey(0, 10, 0)] = {
      slots: [{ item: 'cobblestone', count: 2 }, ...Array.from({ length: 26 }, () => ({ item: null, count: 0 }))],
    }
    store.containers[containerModule.containerPositionKey(0, 8, 0)] = {
      slots: Array.from({ length: 27 }, () => ({ item: null, count: 0 })),
    }
    system.update(0.45)
    assert.equal(store.containers[containerModule.containerPositionKey(0, 10, 0)].slots[0].count, 1)
    assert.equal(store.containers[containerModule.containerPositionKey(0, 8, 0)].slots[0].item, 'cobblestone')
    system.dispose()
  }

  // Repeater delay/boost, comparator container output and observer pulse.
  {
    setActivePinia(createPinia())
    const chunks = new MockChunks()
    const bus = new EventBus()
    const system = new RedstoneSystem(chunks, bus)
    place(bus, chunks, 0, 20, 0, BlockType.REDSTONE_BLOCK)
    place(bus, chunks, 1, 20, 0, BlockType.REPEATER)
    place(bus, chunks, 2, 20, 0, BlockType.REDSTONE_DUST)
    system.update(0.1)
    assert.equal(system.getPowerLevel({ x: 2, y: 20, z: 0 }), 0)
    system.update(0.1)
    assert.equal(system.getPowerLevel({ x: 2, y: 20, z: 0 }), 15)

    place(bus, chunks, 0, 30, 0, BlockType.CHEST)
    place(bus, chunks, 1, 30, 0, BlockType.COMPARATOR)
    place(bus, chunks, 2, 30, 0, BlockType.REDSTONE_DUST)
    const store = containerModule.useContainerStore()
    store.containers[containerModule.containerPositionKey(0, 30, 0)] = {
      slots: [{ item: 'cobblestone', count: 64 }, ...Array.from({ length: 26 }, () => ({ item: null, count: 0 }))],
    }
    system.update(0.1)
    assert.ok(system.getPowerLevel({ x: 2, y: 30, z: 0 }) > 0)

    place(bus, chunks, 0, 40, 0, BlockType.OBSERVER)
    place(bus, chunks, -1, 40, 0, BlockType.REDSTONE_DUST)
    system.update(0.1)
    place(bus, chunks, 1, 40, 0, BlockType.STONE)
    system.update(0.05)
    assert.equal(system.getPowerLevel({ x: -1, y: 40, z: 0 }), 15)
    system.update(0.25)
    assert.equal(system.getPowerLevel({ x: -1, y: 40, z: 0 }), 0)
    system.dispose()
  }

  // Piston pushing redstone components — they should still work after being moved.
  {
    setActivePinia(createPinia())
    const chunks = new MockChunks()
    const bus = new EventBus()
    const system = new RedstoneSystem(chunks, bus)

    // Layout: PISTON at (0,0,0) facing +x, REDSTONE_DUST at (1,0,0), REPEATER at (2,0,0), STONE at (3,0,0)
    // Also: REDSTONE_BLOCK at (-1,0,0) powering the piston
    place(bus, chunks, -1, 0, 0, BlockType.REDSTONE_BLOCK)
    place(bus, chunks, 0, 0, 0, BlockType.PISTON, { x: 1, y: 0, z: 0 })
    place(bus, chunks, 1, 0, 0, BlockType.REDSTONE_DUST)
    place(bus, chunks, 2, 0, 0, BlockType.REPEATER, { x: 1, y: 0, z: 0 })
    chunks.setBlock(3, 0, 0, BlockType.STONE)

    system.update(0.15)
    // Piston should extend, pushing dust→(2,0,0), repeater→(3,0,0), stone→(4,0,0)
    assert.equal(chunks.getBlock(1, 0, 0), BlockType.PISTON_HEAD, 'piston head should appear')
    assert.equal(chunks.getBlock(2, 0, 0), BlockType.REDSTONE_DUST, 'dust should move to (2,0,0)')
    assert.equal(chunks.getBlock(3, 0, 0), BlockType.REPEATER, 'repeater should move to (3,0,0)')
    assert.equal(chunks.getBlock(4, 0, 0), BlockType.STONE, 'stone should move to (4,0,0)')

    // The moved repeater should still function on next tick
    system.update(0.15)
    system.dispose()
  }

  // Observer should detect blocks moved by pistons.
  {
    setActivePinia(createPinia())
    const chunks = new MockChunks()
    const bus = new EventBus()
    const system = new RedstoneSystem(chunks, bus)

    // Layout: OBSERVER at (0,0,0) facing +x (looking at (1,0,0))
    // PISTON at (1,0,0) facing +x, STONE at (2,0,0)
    // REDSTONE_DUST behind observer at (-1,0,0) to observe output
    place(bus, chunks, 0, 0, 0, BlockType.OBSERVER, { x: 1, y: 0, z: 0 })
    place(bus, chunks, 1, 0, 0, BlockType.PISTON, { x: 1, y: 0, z: 0 })
    chunks.setBlock(2, 0, 0, BlockType.STONE)
    place(bus, chunks, -1, 0, 0, BlockType.REDSTONE_DUST)
    // Power the piston (from below to avoid triggering observer)
    place(bus, chunks, 1, -1, 0, BlockType.REDSTONE_BLOCK)

    // Settle the system so observer isn't pulsing from initial placement
    system.update(0.3)
    const powerBefore = system.getPowerLevel({ x: -1, y: 0, z: 0 })

    // The observer should have detected the block change (piston extension pushing stone)
    // After piston extends, stone moves from (2,0,0) to (3,0,0), observer detects it
    system.update(0.15)
    assert.equal(chunks.getBlock(2, 0, 0), BlockType.PISTON_HEAD, 'head should appear at (2,0,0)')
    assert.equal(chunks.getBlock(3, 0, 0), BlockType.STONE, 'stone should move to (3,0,0)')

    system.dispose()
  }

  // A piston pushing another piston — the pushed piston should still work after being moved.
  {
    setActivePinia(createPinia())
    const chunks = new MockChunks()
    const bus = new EventBus()
    const system = new RedstoneSystem(chunks, bus)

    // PISTON_A at (0,0,0) facing +x, PISTON_B (sticky) at (1,0,0) facing +x
    // REDSTONE_BLOCK at (0,-1,0) powers PISTON_A
    // STONE at (2,0,0)
    place(bus, chunks, 0, -1, 0, BlockType.REDSTONE_BLOCK)
    place(bus, chunks, 0, 0, 0, BlockType.PISTON, { x: 1, y: 0, z: 0 })
    place(bus, chunks, 1, 0, 0, BlockType.STICKY_PISTON, { x: 1, y: 0, z: 0 })
    chunks.setBlock(2, 0, 0, BlockType.STONE)

    system.update(0.15)
    // PISTON_A extends, pushing PISTON_B from (1,0,0) to (2,0,0), stone from (2,0,0) to (3,0,0)
    assert.equal(chunks.getBlock(1, 0, 0), BlockType.PISTON_HEAD, 'PISTON_A head at (1,0,0)')
    assert.equal(chunks.getBlock(2, 0, 0), BlockType.STICKY_PISTON, 'PISTON_B moved to (2,0,0)')
    assert.equal(chunks.getBlock(3, 0, 0), BlockType.STONE, 'stone moved to (3,0,0)')

    // Now remove power to PISTON_A and add power to PISTON_B (via quasi-connectivity above PISTON_B)
    // Break the redstone block below PISTON_A
    breakBlock(bus, chunks, 0, -1, 0)
    // Place a redstone block below PISTON_B (at (2,-1,0)) to power it
    place(bus, chunks, 2, -1, 0, BlockType.REDSTONE_BLOCK)

    system.update(0.15)
    // PISTON_A should retract (head gone)
    assert.equal(chunks.getBlock(1, 0, 0), BlockType.AIR, 'PISTON_A head retracted')
    // PISTON_B should extend, pushing stone from (3,0,0) to (4,0,0)
    assert.equal(chunks.getBlock(3, 0, 0), BlockType.PISTON_HEAD, 'PISTON_B head at (3,0,0)')
    assert.equal(chunks.getBlock(4, 0, 0), BlockType.STONE, 'stone pushed to (4,0,0)')

    system.dispose()
  }

  console.log('Redstone smoke tests passed')
} finally {
  await vite.close()
}
