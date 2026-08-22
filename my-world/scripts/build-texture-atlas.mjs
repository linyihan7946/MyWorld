/**
 * 官方方块贴图烘焙脚本
 * 从我的世界官方 Wiki (minecraft.wiki) 下载所有方块的平面贴图 (原版游戏实际使用的纹理),
 * 烘焙成 512x512 图集 (16x16 格, 每格 32x32), 供运行时叠加到程序纹理之上。
 *
 * 贴图命名规律 (实测 wiki API):
 *   - 简单方块:  <Title>_JE<v>_BE<v>.png
 *   - 多面方块:  <Title>_(side|top|bottom_texture)_JE<v>.png
 *   - 原木/柱:   <Title>_(EW|NS)_JE<v>.png (侧面), <Title>_(UD)_JE<v>.png (顶/底)
 *   - 特殊:      Snow_(texture)_JE<v>.png
 *
 * 用法: node scripts/build-texture-atlas.mjs
 */
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { execFileSync } from 'child_process'

const WIKI = 'https://minecraft.wiki'
const BLOCKS_TS = path.resolve('src/types/blocks.ts')
const OUT_PNG = path.resolve('src/assets/textures/block-atlas.png')
const CACHE_DIR = path.resolve('scripts/texture-cache')
const UA = 'Mozilla/5.0 (MyWorld texture sync; educational fan project)'
const ATLAS_SIZE = 16
const TILE = 32

// ──────────────────────────────────────────────────────────────
// PNG 编解码 (零依赖, 使用 Node 内置 zlib)
// ──────────────────────────────────────────────────────────────

function crc32(buf) {
  let table = crc32.table
  if (!table) {
    table = crc32.table = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      table[n] = c
    }
  }
  let c = -1
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not png')
  let pos = 8, width = 0, height = 0, bitDepth = 0, colorType = 0
  let plte = Buffer.alloc(0)
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4)
      bitDepth = data[8]; colorType = data[9]
    } else if (type === 'IDAT') idat.push(data)
    else if (type === 'PLTE') plte = data
    else if (type === 'IEND') break
    pos += 12 + len
  }
  if (![1, 2, 4, 8, 16].includes(bitDepth)) throw new Error(`bit depth ${bitDepth}`)
  const chPerPx = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType]
  if (!chPerPx) throw new Error(`color type ${colorType}`)
  // 位深 < 8 时多个像素打包进 1 字节, 16 位每通道 2 字节; 滤波器按原始字节处理 (PNG 规范)
  const bitsPerPx = chPerPx * bitDepth
  const stride = Math.ceil(width * bitsPerPx / 8)
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const packed = Buffer.alloc(height * stride)
  let p = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[p++]
    const row = raw.subarray(p, p + stride); p += stride
    const prev = y > 0 ? packed.subarray((y - 1) * stride, y * stride) : null
    const dst = packed.subarray(y * stride, (y + 1) * stride)
    const bppBytes = chPerPx * (bitDepth === 16 ? 2 : 1)
    for (let x = 0; x < stride; x++) {
      const a = x >= bppBytes ? dst[x - bppBytes] : 0
      const b = prev ? prev[x] : 0
      const c = prev && x >= bppBytes ? prev[x - bppBytes] : 0
      let v = row[x]
      switch (filter) {
        case 0: break
        case 1: v = (v + a) & 0xff; break
        case 2: v = (v + b) & 0xff; break
        case 3: v = (v + ((a + b) >> 1)) & 0xff; break
        case 4: {
          const q = a + b - c
          const pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c)
          v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff
          break
        }
        default: throw new Error(`filter ${filter}`)
      }
      dst[x] = v
    }
  }
  // 解包为每像素字节序列: 8 位直接取, 16 位取大端高字节, 4/2/1 位从打包字节展开 (高位在前)
  const bytesPerPx = bitDepth === 16 ? chPerPx : bitDepth === 8 ? chPerPx : 1
  const vals = Buffer.alloc(width * height * bytesPerPx)
  if (bitDepth === 16) {
    for (let i = 0; i < width * height * chPerPx; i++) vals[i] = packed[i * 2]
  } else if (bitDepth === 8) {
    packed.copy(vals)
  } else {
    const perByte = 8 / bitDepth
    const mask = (1 << bitDepth) - 1
    for (let i = 0; i < width * height; i++) {
      const shift = 8 - bitDepth * ((i % perByte) + 1)
      vals[i] = (packed[Math.floor(i / perByte)] >> shift) & mask
    }
  }
  // 转 RGBA
  const rgba = Buffer.alloc(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    const v = vals[i]
    if (colorType === 0) {
      const g = bitDepth >= 8 ? v : (v * 255 / ((1 << bitDepth) - 1)) | 0
      rgba[i * 4] = g; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = g; rgba[i * 4 + 3] = 255
    } else if (colorType === 2) {
      rgba[i * 4] = vals[i * 3]; rgba[i * 4 + 1] = vals[i * 3 + 1]; rgba[i * 4 + 2] = vals[i * 3 + 2]; rgba[i * 4 + 3] = 255
    } else if (colorType === 4) {
      rgba[i * 4] = vals[i * 2]; rgba[i * 4 + 1] = vals[i * 2]; rgba[i * 4 + 2] = vals[i * 2]; rgba[i * 4 + 3] = vals[i * 2 + 1]
    } else if (colorType === 6) {
      vals.copy(rgba, i * 4, i * 4, i * 4 + 4)
    } else if (colorType === 3) {
      if (v * 3 + 2 >= plte.length) throw new Error('palette out of range')
      rgba[i * 4] = plte[v * 3]; rgba[i * 4 + 1] = plte[v * 3 + 1]; rgba[i * 4 + 2] = plte[v * 3 + 2]
      rgba[i * 4 + 3] = 255
    }
  }
  return { width, height, data: rgba }
}

function encodePNG(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ──────────────────────────────────────────────────────────────
// 解析 blocks.ts 注册表: BlockType 名 → 面贴图索引
// ──────────────────────────────────────────────────────────────

function parseBlockRegistry() {
  const src = fs.readFileSync(BLOCKS_TS, 'utf8')
  const entries = []
  const entryRe = /\[BlockType\.(\w+)\]: \{([\s\S]*?)(?=\n  \[BlockType\.|\n\})/g
  for (const m of src.matchAll(entryRe)) {
    const name = m[1]
    const body = m[2]
    const tex = body.match(/textures: \{([^}]*)\}/)
    if (!tex) { entries.push({ name, faces: null }); continue }
    const faces = {}
    for (const fm of tex[1].matchAll(/(\w+): (\d+)/g)) faces[fm[1]] = Number(fm[2])
    if (!faces.all && !faces.side) { entries.push({ name, faces: null }); continue }
    entries.push({ name, faces })
  }
  return entries
}

// ──────────────────────────────────────────────────────────────
// 名称映射: BlockType 名 → wiki 贴图标题
//   null            → 保留程序纹理
//   'Title'         → 所有面同纹理
//   { side, top, bottom } → 分面 (可为 null 表示沿用程序纹理)
// 未列出的方块自动推导: titleCase(id), 分面后缀由 resolveTexture 尝试
// ──────────────────────────────────────────────────────────────

const METAL_TITLES = {
  iron_block: 'Block of Iron', gold_block: 'Block of Gold', diamond_block: 'Block of Diamond',
  emerald_block: 'Block of Emerald', lapis_block: 'Block of Lapis Lazuli', redstone_block: 'Block of Redstone',
  netherite_block: 'Block of Netherite', copper_block: 'Block of Copper', quartz_block: 'Block of Quartz',
  coal_block: 'Block of Coal', amethyst_block: 'Block of Amethyst',
}

const NAME_MAP = {
  // 保留程序纹理 (十字型/复杂模型/动画)
  WATER: null, LAVA: null, TORCH: null, SOUL_TORCH: null, LANTERN: null, SOUL_LANTERN: null, CHAIN: null,
  REPEATER: null, COMPARATOR: null, LEVER: null, LEVER_ON: null,
  REDSTONE_TORCH: null, REDSTONE_TORCH_ON: null, REDSTONE_DUST: null,
  OAK_SAPLING: null, SPRUCE_SAPLING: null, BIRCH_SAPLING: null, JUNGLE_SAPLING: null, ACACIA_SAPLING: null, DARK_OAK_SAPLING: null,
  DANDELION: null, POPPY: null, BLUE_ORCHID: null, ALLIUM: null, AZURE_BLUET: null, RED_TULIP: null, ORANGE_TULIP: null,
  WHITE_TULIP: null, PINK_TULIP: null, OXEYE_DAISY: null, CORNFLOWER: null, LILY_OF_THE_VALLEY: null, WITHER_ROSE: null,
  SUNFLOWER: null, LILAC: null, ROSE_BUSH: null, PEONY: null, TALL_GRASS: null, LARGE_FERN: null, FERN: null, GRASS: null,
  DEAD_BUSH: null, SUGAR_CANE: null, BAMBOO: null, BAMBOO_SAPLING: null, VINE: null, LILY_PAD: null,
  WHEAT: null, CARROTS: null, POTATOES: null, BEETROOTS: null, SWEET_BERRY_BUSH: null, COCOA: null, MELON_STEM: null, PUMPKIN_STEM: null,
  BROWN_MUSHROOM: null, RED_MUSHROOM: null, CRIMSON_FUNGUS: null, WARPED_FUNGUS: null, CRIMSON_ROOTS: null, WARPED_ROOTS: null,
  NETHER_SPROUTS: null, SEA_PICKLE: null, FIRE: null, END_ROD: null, LIGHTNING_ROD: null, POINTED_DRIPSTONE: null,
  BELL: null, SPAWNER: null, CONDUIT: null, SCAFFOLDING: null, GLOW_LICHEN: null, CAVE_VINES: null, HANGING_ROOTS: null,
  WHITE_BED: null, ORANGE_BED: null, MAGENTA_BED: null, LIGHT_BLUE_BED: null, YELLOW_BED: null, LIME_BED: null, PINK_BED: null,
  GRAY_BED: null, LIGHT_GRAY_BED: null, CYAN_BED: null, PURPLE_BED: null, BLUE_BED: null, BROWN_BED: null, GREEN_BED: null,
  RED_BED: null, BLACK_BED: null,
  // 前缀污染: 裸标题命中太多无关文件, 需用更精确的前缀查找 (lookup 只影响 API 前缀, 不影响正则/缓存)
  BEDROCK: { all: 'Bedrock', lookup: 'Bedrock_JE' },
  LAPIS_ORE: { all: 'Lapis Lazuli Ore', lookup: 'Lapis_Lazuli_Ore_JE' },
  CHEST: 'Chest (texture)',
  COMMAND_BLOCK: 'Command Block (texture)',
  MUSHROOM_STEM: 'Mushroom Stem (texture)',
  RED_MUSHROOM_BLOCK: 'Red Mushroom Block (texture)',
  BROWN_MUSHROOM_BLOCK: 'Brown Mushroom Block (texture)',
  BARRIER: 'Barrier (held)',
  LIGHT_BLOCK: 'Light (held)',
  // 铁砧/漏斗 wiki 只有部分面的平面贴图, 单索引方块用最接近的面
  ANVIL: 'Anvil (top texture)',
  CHIPPED_ANVIL: 'Anvil (top texture)',
  DAMAGED_ANVIL: 'Anvil (top texture)',
  LOOM: 'Loom (side texture)',
  BARREL: 'Barrel (side texture)',
  HOPPER: 'Hopper (top texture)',
  // 十字模型/自定义方块保留程序纹理
  RAIL: null, POWERED_RAIL: null, DETECTOR_RAIL: null, ACTIVATOR_RAIL: null,
  STEEL_ORE: null, STEEL_BLOCK: null, NETHER_PORTAL: null, STRUCTURE_VOID: null,
  // 分面贴图 (原版 biome 染色方块 → 下载后按平原色调染色)
  GRASS_BLOCK: { side: 'Grass Block (side texture)', top: 'Grass Block (top texture)', bottom: 'Dirt', tint: '#91BD59' },
  MYCELIUM: { side: 'Mycelium (side texture)', top: 'Mycelium (top texture)', bottom: 'Dirt' },
  PODZOL: { side: 'Podzol (side texture)', top: 'Podzol (top texture)', bottom: 'Dirt' },
  CRIMSON_NYLIUM: { side: 'Crimson Nylium (side texture)', top: 'Crimson Nylium (top texture)', bottom: 'Netherrack' },
  WARPED_NYLIUM: { side: 'Warped Nylium (side texture)', top: 'Warped Nylium (top texture)', bottom: 'Netherrack' },
  DIRT_PATH: { side: 'Dirt Path (side texture)', top: 'Dirt Path (top texture)', bottom: 'Dirt' },
  GRASS_PATH: { side: 'Dirt Path (side texture)', top: 'Dirt Path (top texture)', bottom: 'Dirt' },
  FARMLAND: { side: 'Dirt', top: 'Farmland (top texture)', bottom: 'Dirt' },
  TNT: { side: 'TNT (side texture)', top: 'TNT (top texture)', bottom: 'TNT (bottom texture)' },
  PUMPKIN: { side: 'Pumpkin (side texture)', top: 'Pumpkin (top texture)', bottom: 'Pumpkin (top texture)' },
  CARVED_PUMPKIN: { side: 'Carved Pumpkin (side texture)', top: 'Pumpkin (top texture)', bottom: 'Pumpkin (top texture)' },
  MELON: { side: 'Melon (side texture)', top: 'Melon (top texture)', bottom: 'Melon (top texture)' },
  CACTUS: { side: 'Cactus (side texture)', top: 'Cactus (top texture)', bottom: 'Cactus (side texture)' },
  FURNACE: { side: 'Furnace (side texture)', top: 'Furnace (top texture)', bottom: 'Stone' },
  BLAST_FURNACE: { side: 'Blast Furnace (side texture)', top: 'Blast Furnace (top texture)', bottom: 'Blast Furnace (side texture)' },
  SMOKER: { side: 'Smoker (side texture)', top: 'Smoker (top texture)', bottom: 'Smoker (side texture)' },
  CRAFTING_TABLE: { side: 'Crafting Table (side texture)', top: 'Crafting Table (top texture)', bottom: 'Oak Planks' },
  PISTON: { side: 'Piston (side texture)', top: 'Piston (top texture)' },
  STICKY_PISTON: { side: 'Piston (side texture)', top: 'Piston (top texture)' },
  OBSERVER: 'Observer (side texture)',
  HOPPER: 'Hopper (outside texture)',
  SNOW: 'Snow (texture)',
  SNOW_BLOCK: 'Snow Block',
  PURPUR_PILLAR: { side: 'Purpur Pillar (side texture)', top: 'Purpur Pillar (top texture)', bottom: 'Purpur Pillar (top texture)' },
  QUARTZ_PILLAR: { side: 'Quartz Pillar (side texture)', top: 'Quartz Pillar (top texture)', bottom: 'Quartz Pillar (top texture)' },
  ANCIENT_DEBRIS: { side: 'Ancient Debris (side texture)', top: 'Ancient Debris (top texture)', bottom: 'Ancient Debris (top texture)' },
  BASALT: { side: 'Basalt (side texture)', top: 'Basalt (top texture)', bottom: 'Basalt (top texture)' },
  POLISHED_BASALT: { side: 'Polished Basalt (side texture)', top: 'Polished Basalt (top texture)', bottom: 'Polished Basalt (top texture)' },
  DEEPSLATE: { side: 'Deepslate', top: 'Deepslate (top texture)', bottom: 'Deepslate (top texture)' },
  COBBLED_DEEPSLATE: 'Cobbled Deepslate',
  HAY_BALE: { side: 'Hay Bale (EW)', top: 'Hay Bale (UD)', bottom: 'Hay Bale (UD)' },
  BONE_BLOCK: { side: 'Bone Block (EW)', top: 'Bone Block (UD)', bottom: 'Bone Block (UD)' },
  BAMBOO_BLOCK: { side: 'Block of Bamboo (EW)', top: 'Block of Bamboo (UD)', bottom: 'Block of Bamboo (UD)' },
  JACK_O_LANTERN: { side: "Jack o'Lantern (side texture)", top: "Jack o'Lantern (top texture)", bottom: "Jack o'Lantern (top texture)" },
  OAK_LOG: { side: 'Oak Log (EW)', top: 'Oak Log (UD)' },
  SPRUCE_LOG: { side: 'Spruce Log (EW)', top: 'Spruce Log (UD)' },
  BIRCH_LOG: { side: 'Birch Log (EW)', top: 'Birch Log (UD)' },
  JUNGLE_LOG: { side: 'Jungle Log (EW)', top: 'Jungle Log (UD)' },
  ACACIA_LOG: { side: 'Acacia Log (EW)', top: 'Acacia Log (UD)' },
  DARK_OAK_LOG: { side: 'Dark Oak Log (EW)', top: 'Dark Oak Log (UD)' },
  STRIPPED_OAK_LOG: { side: 'Stripped Oak Log (EW)', top: 'Stripped Oak Log (UD)' },
  STRIPPED_SPRUCE_LOG: { side: 'Stripped Spruce Log (EW)', top: 'Stripped Spruce Log (UD)' },
  STRIPPED_BIRCH_LOG: { side: 'Stripped Birch Log (EW)', top: 'Stripped Birch Log (UD)' },
  STRIPPED_JUNGLE_LOG: { side: 'Stripped Jungle Log (EW)', top: 'Stripped Jungle Log (UD)' },
  STRIPPED_ACACIA_LOG: { side: 'Stripped Acacia Log (EW)', top: 'Stripped Acacia Log (UD)' },
  STRIPPED_DARK_OAK_LOG: { side: 'Stripped Dark Oak Log (EW)', top: 'Stripped Dark Oak Log (UD)' },
  OAK_WOOD: { side: 'Oak Log (EW)', top: 'Oak Log (UD)' },
  SPRUCE_WOOD: { side: 'Spruce Log (EW)', top: 'Spruce Log (UD)' },
  BIRCH_WOOD: { side: 'Birch Log (EW)', top: 'Birch Log (UD)' },
  JUNGLE_WOOD: { side: 'Jungle Log (EW)', top: 'Jungle Log (UD)' },
  ACACIA_WOOD: { side: 'Acacia Log (EW)', top: 'Acacia Log (UD)' },
  DARK_OAK_WOOD: { side: 'Dark Oak Log (EW)', top: 'Dark Oak Log (UD)' },
  MUDDY_MANGROVE_ROOTS: { side: 'Muddy Mangrove Roots (side texture)', top: 'Muddy Mangrove Roots (top texture)', bottom: 'Muddy Mangrove Roots (top texture)' },
}

// 树叶/草按平原色调染色 (wiki 原图为灰色底图, 原版渲染时才着色)
const LEAF_TINTS = {
  OAK_LEAVES: '#77AB2F', DARK_OAK_LEAVES: '#77AB2F', ACACIA_LEAVES: '#77AB2F', AZALEA_LEAVES: '#77AB2F',
  FLOWERING_AZALEA_LEAVES: '#77AB2F', MANGROVE_LEAVES: '#77AB2F', CHERRY_LEAVES: '#77AB2F',
  SPRUCE_LEAVES: '#619961', BIRCH_LEAVES: '#80A755', JUNGLE_LEAVES: '#30BB0B',
}

const SMALL_WORDS = new Set(['of', 'and', 'on', 'a', 'the', 'in', 'at', 'to', 'for', 'with'])
function titleCase(id) {
  return id.split('_').map((w, i) => {
    const lw = w.toLowerCase()
    if (i > 0 && SMALL_WORDS.has(lw)) return lw
    return w[0].toUpperCase() + w.slice(1)
  }).join(' ')
}

function autoTitleFor(name) {
  const id = name.toLowerCase()
  if (METAL_TITLES[id]) return METAL_TITLES[id]
  if (id.endsWith('_concrete')) return titleCase(id) + ' (texture)'
  return titleCase(id)
}

// ──────────────────────────────────────────────────────────────
// wiki API 查找 + 下载
// ──────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function curlToString(url) {
  try {
    return execFileSync('curl', ['-s', '--retry', '2', '--max-time', '30', '-A', UA, url], { encoding: 'utf8' })
  } catch { return null }
}

async function curlToFile(url, dest) {
  try {
    execFileSync('curl', ['-sL', '--retry', '2', '--max-time', '30', '-A', UA, url, '-o', dest], { stdio: 'ignore' })
    const buf = fs.readFileSync(dest)
    if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50) return true
    fs.unlinkSync(dest)
    return false
  } catch { return false }
}

// 按标题查找最新贴图文件 (空格→下划线匹配); prefix 可覆盖 API 查找前缀 (处理 Bedrock 这类前缀污染)
async function findLatestTexture(title, prefix = title) {
  let data = null
  for (let attempt = 0; attempt < 4 && !data; attempt++) {
    const api = `${WIKI}/api.php?action=query&list=allimages&format=json&aiprefix=${encodeURIComponent(prefix)}&ailimit=200`
    const raw = await curlToString(api)
    if (raw) { try { data = JSON.parse(raw) } catch { data = null } }
    if (!data) await sleep(1000 * (attempt + 1))
  }
  if (!data) return null
  const names = (data.query?.allimages ?? []).map(f => f.name)
  const esc = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '_').replace(/'/g, "'")
  const re = new RegExp(`^${esc}_JE(\\d+)(_BE\\d+)?\\.png$`)
  let best = null, bestJe = -1
  for (const n of names) {
    const m = n.match(re)
    if (m && Number(m[1]) > bestJe) { bestJe = Number(m[1]); best = n }
  }
  return best
}

const fileCache = new Map()
async function getTexture(title, lookupPrefix = title) {
  if (fileCache.has(title)) return fileCache.get(title)
  const cached = path.join(CACHE_DIR, `${title.replace(/[^\w()-]/g, '_')}.png`)
  if (fs.existsSync(cached)) {
    fileCache.set(title, cached)
    return cached
  }
  const wikiFile = await findLatestTexture(title, lookupPrefix)
  if (!wikiFile) { fileCache.set(title, null); return null }
  const url = `${WIKI}/images/${encodeURIComponent(wikiFile)}`
  let ok = false
  for (let attempt = 0; attempt < 4 && !ok; attempt++) {
    ok = await curlToFile(url, cached)
    if (!ok) await sleep(600 * (attempt + 1))
  }
  const result = ok ? cached : null
  fileCache.set(title, result)
  await sleep(200) // 友好限速, 避免触发 wiki WAF
  return result
}

// ──────────────────────────────────────────────────────────────
// 烘焙
// ──────────────────────────────────────────────────────────────

function upscaleNearest(src, sw, sh, dstSize) {
  const dst = Buffer.alloc(dstSize * dstSize * 4)
  for (let y = 0; y < dstSize; y++) {
    for (let x = 0; x < dstSize; x++) {
      const sx = Math.min(sw - 1, Math.floor(x * sw / dstSize))
      const sy = Math.min(sh - 1, Math.floor(y * sh / dstSize))
      src.copy(dst, (y * dstSize + x) * 4, (sy * sw + sx) * 4, (sy * sw + sx) * 4 + 4)
    }
  }
  return dst
}

function tintRGBA(data, hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = (data[i] * r / 255) | 0
    data[i + 1] = (data[i + 1] * g / 255) | 0
    data[i + 2] = (data[i + 2] * b / 255) | 0
  }
}

function avgSaturation(data) {
  let sum = 0
  for (let i = 0; i < data.length; i += 4) {
    const mx = Math.max(data[i], data[i + 1], data[i + 2])
    const mn = Math.min(data[i], data[i + 1], data[i + 2])
    sum += (mx - mn) / 255
  }
  return sum / (data.length / 4)
}

async function main() {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.mkdirSync(path.dirname(OUT_PNG), { recursive: true })
  const entries = parseBlockRegistry()
  console.log(`解析到 ${entries.length} 个方块`)

  const atlas = Buffer.alloc(ATLAS_SIZE * ATLAS_SIZE * TILE * TILE * 4) // 透明底
  const coveredIndices = new Map() // atlas index → block name
  let okBlocks = 0, failBlocks = []
  const failList = []

  for (const { name, faces } of entries) {
    if (!faces) continue
    const mapped = NAME_MAP[name]
    if (mapped === null) continue
    const id = name.toLowerCase()

    // 决定每个面的贴图标题
    const titles = {}
    let tint = mapped && mapped.tint
    if (typeof mapped === 'string') {
      titles.all = mapped
      if (LEAF_TINTS[name]) tint = LEAF_TINTS[name]
    } else if (mapped) {
      if (mapped.all) titles.all = mapped.all
      if (mapped.side) titles.side = mapped.side
      if (mapped.top) titles.top = mapped.top
      if (mapped.bottom) titles.bottom = mapped.bottom
      if (LEAF_TINTS[name]) tint = LEAF_TINTS[name]
    } else {
      const base = autoTitleFor(name)
      if (faces.all !== undefined) titles.all = base
      else {
        titles.side = base
        titles.top = base
        titles.bottom = base
      }
      if (LEAF_TINTS[name]) tint = LEAF_TINTS[name]
    }
    // blocks.ts 单索引方块 (all) 遇到对象映射时, 用侧面贴图作为整体贴图
    if (faces.all !== undefined && !titles.all) titles.all = titles.side ?? titles.top ?? titles.bottom

    // 为每个图集索引抓贴图 (同名面共享)
    const indexFaces = {}
    if (faces.all !== undefined) indexFaces[faces.all] = ['all']
    else {
      if (faces.top !== undefined) indexFaces[faces.top] = [...(indexFaces[faces.top] || []), 'top']
      if (faces.bottom !== undefined) indexFaces[faces.bottom] = [...(indexFaces[faces.bottom] || []), 'bottom']
      if (faces.side !== undefined) indexFaces[faces.side] = [...(indexFaces[faces.side] || []), 'side']
    }

    let blockOk = true
    for (const [idxStr, faceList] of Object.entries(indexFaces)) {
      const idx = Number(idxStr)
      if (coveredIndices.has(idx)) continue // 与之前的方块共享同一图集索引 (blocks.ts 中同索引即同贴图), 已覆盖
      const face = faceList[0]
      const title = titles[face] ?? titles.all
      if (!title) { blockOk = false; continue }
      const lookupPrefix = (typeof mapped === 'object' && mapped !== null && mapped.lookup) ? mapped.lookup : title
      const file = await getTexture(title, lookupPrefix)
      if (!file) { blockOk = false; continue }
      try {
        const { width, height, data } = decodePNG(fs.readFileSync(file))
        let rgba = (width === TILE && height === TILE) ? data : upscaleNearest(data, width, height, TILE)
        if (tint && avgSaturation(rgba) < 0.15) tintRGBA(rgba, tint)
        const col = idx % ATLAS_SIZE, row = Math.floor(idx / ATLAS_SIZE)
        for (let y = 0; y < TILE; y++) {
          rgba.copy(atlas, ((row * TILE + y) * ATLAS_SIZE + col) * TILE * 4, y * TILE * 4, (y + 1) * TILE * 4)
        }
        coveredIndices.set(idx, name)
      } catch (e) { blockOk = false }
    }
    if (blockOk) okBlocks++
    else { failBlocks.push(name); failList.push(name) }
  }

  fs.writeFileSync(OUT_PNG, encodePNG(ATLAS_SIZE * TILE, ATLAS_SIZE * TILE, atlas))
  const textured = [...coveredIndices.keys()].length
  console.log(`\n烘焙完成: ${textured} 个图集索引使用官方贴图, ${okBlocks} 个方块完全覆盖`)
  if (failList.length) {
    console.log(`未完全覆盖 (${failList.length} 个, 保留程序纹理):`)
    console.log(failList.join(', '))
  }
  console.log(`输出: ${OUT_PNG} (${(fs.statSync(OUT_PNG).size / 1024).toFixed(1)} KB)`)
}

main().catch(e => { console.error(e); process.exit(1) })
