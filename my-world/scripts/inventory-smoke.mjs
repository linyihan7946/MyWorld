import assert from 'node:assert/strict'
import { createServer } from 'vite'

const fakeContext = {
  fillStyle: '', strokeStyle: '', lineWidth: 1, font: '',
  clearRect() {}, fillRect() {}, strokeRect() {},
  beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fillText() {},
}
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
globalThis.document = {
  createElement(tag) {
    assert.equal(tag, 'canvas')
    return {
      width: 0, height: 0,
      getContext: () => fakeContext,
      toDataURL: () => 'data:image/png;base64,inventory-smoke',
    }
  },
}
try {
  const [{ ITEM_REGISTRY }, { getItemIconDataUrl }] = await Promise.all([
    vite.ssrLoadModule('/src/types/items.ts'),
    vite.ssrLoadModule('/src/ui/itemTextures.ts'),
  ])
  const tools = Object.values(ITEM_REGISTRY).filter(item => item.type === 'tool')
  const combat = Object.values(ITEM_REGISTRY).filter(item => item.type === 'weapon')
  assert.ok(tools.length > 0, 'Tools category must not be empty')
  assert.ok(combat.length > 0, 'Combat category must not be empty')
  for (const item of [...tools, ...combat]) {
    assert.doesNotThrow(() => getItemIconDataUrl(item.id), `Icon generation failed for ${item.id}`)
  }
  console.log(`Inventory smoke tests passed (${tools.length} tools, ${combat.length} combat items)`)
} finally {
  await vite.close()
}
