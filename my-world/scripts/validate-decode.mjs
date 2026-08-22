// 临时验证脚本: 用修复后的解码器解码缓存中所有 PNG
import fs from 'fs'
import path from 'path'
const CACHE_DIR = path.resolve('scripts/texture-cache')

// 从 build-texture-atlas.mjs 复制 decodePNG (导入不方便, 直接内联)
const bm = fs.readFileSync(path.resolve('scripts/build-texture-atlas.mjs'), 'utf8')
const fnSrc = bm.match(/function decodePNG\(buf\) \{[\s\S]*?\n\}/)[0]
// crc32/chunk 等依赖不用于 decode; 只需 decodePNG 本体 + zlib
const zlib = await import('zlib').then(m => m.default ?? m)
const decodePNG = new Function('zlib', `return (${fnSrc})`)(zlib)

const files = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.png'))
let ok = 0, fail = []
for (const f of files) {
  try {
    const { width, height } = decodePNG(fs.readFileSync(path.join(CACHE_DIR, f)))
    ok++
  } catch (e) {
    fail.push(`${f} (${e.message})`)
  }
}
console.log(`解码成功 ${ok}/${files.length}`)
if (fail.length) console.log('失败:\n' + fail.join('\n'))
