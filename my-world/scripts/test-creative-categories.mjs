import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })

try {
  const [{ ITEM_REGISTRY }, { BLOCK_REGISTRY, BlockType }] = await Promise.all([
    vite.ssrLoadModule('/src/types/items.ts'),
    vite.ssrLoadModule('/src/types/blocks.ts'),
  ])

  const redstoneItems = new Set(['redstone', 'redstone_block', 'redstone_dust', 'piston', 'sticky_piston', 'repeater', 'comparator', 'observer', 'hopper'])

  // 分类统计
  const counts = { blocks: 0, redstone: 0, tools: 0, combat: 0, armor: 0, items: 0 }

  // Block items
  for (const definition of Object.values(BLOCK_REGISTRY)) {
    if (definition.id === BlockType.AIR || definition.id === BlockType.PISTON_HEAD) continue
    const item = String(BlockType[definition.id]).toLowerCase()
    if (redstoneItems.has(item)) counts.redstone++
    else counts.blocks++
  }

  // Non-block items
  const knownBlocks = new Set(
    Object.values(BLOCK_REGISTRY)
      .filter(d => d.id !== BlockType.AIR && d.id !== BlockType.PISTON_HEAD)
      .map(d => String(BlockType[d.id]).toLowerCase())
  )

  const tools = [], weapons = [], armor = [], misc = []

  for (const definition of Object.values(ITEM_REGISTRY)) {
    if (knownBlocks.has(definition.id)) continue
    if (redstoneItems.has(definition.id)) { counts.redstone++; continue }
    if (definition.type === 'tool') { counts.tools++; tools.push(definition.id); continue }
    if (definition.type === 'weapon') { counts.combat++; weapons.push(definition.id); continue }
    if (definition.type === 'armor') { counts.armor++; armor.push(definition.id); continue }
    counts.items++
    misc.push(definition.id)
  }

  console.log('=== Creative Inventory Category Counts ===')
  console.log('方块 (blocks):', counts.blocks)
  console.log('红石 (redstone):', counts.redstone)
  console.log('工具 (tools):', counts.tools, tools.slice(0, 5).join(', '))
  console.log('战斗 (combat):', counts.combat, weapons.slice(0, 5).join(', '))
  console.log('盔甲 (armor):', counts.armor, armor.slice(0, 5).join(', '))
  console.log('物品 (items):', counts.items, misc.slice(0, 5).join(', '))
  console.log('总计:', Object.values(counts).reduce((a, b) => a + b, 0))

  if (counts.tools === 0) console.error('ERROR: No tools found!')
  if (counts.combat === 0) console.error('ERROR: No weapons found!')
  if (counts.armor === 0) console.error('ERROR: No armor found!')
} finally {
  await vite.close()
}
