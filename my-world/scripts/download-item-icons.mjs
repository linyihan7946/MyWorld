/**
 * 从我的世界官方 Wiki (minecraft.wiki) 下载所有物品/方块图标
 * 来源: https://minecraft.wiki (Mojang 认可的官方百科)
 *
 * - 方块 → BlockSprite_<name>.png (彩色 16x16)
 * - 物品 → wiki API 查找最新版原始游戏贴图 (<Name>_JE*_BE*.png/gif, 彩色)
 * - 原版不存在的物品 (钢/铜装备等) → 跳过, 保留程序生成图标
 *
 * 用法: node scripts/download-item-icons.mjs
 */
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

const WIKI = 'https://minecraft.wiki'
const ITEMS_TS = path.resolve('src/types/items.ts')
const OUT_DIR = path.resolve('src/assets/item-icons')
const UA = 'Mozilla/5.0 (MyWorld icon sync; educational fan project)'

// ── 名称映射: 游戏 id → wiki 页面名 (方块用连字符 slug, 物品用标题大小写) ──
const NAME_MAP = {
  // 物品 (wiki 标题)
  brick_item: 'Brick',
  quartz: 'Nether Quartz',
  ender_eye: 'Eye of Ender',
  glistering_melon: 'Glistering Melon Slice',
  turtle_helmet: 'Turtle Shell',
  leather_helmet: 'Leather Cap', // JE 旧名: 皮革头盔
  leather_chestplate: 'Leather Tunic', // JE 旧名: 皮革胸甲
  leather_leggings: 'Leather Pants', // JE 旧名: 皮革护腿
  filled_map: null, // wiki 无已填充地图的基础物品贴图, 保留程序生成
  music_disc_13: 'Music Disc 13',
  music_disc_cat: 'Music Disc cat', // wiki 文件名为小写 cat (前缀区分大小写)
  rabbit_foot: "Rabbit's Foot",
  dragon_breath: "Dragon's Breath",
  water_bottle: 'Water Bottle',
  cooked_beef: 'Steak',
  pufferfish: 'Pufferfish (item)',
  trident: 'Trident (item)',
  nether_wart: 'Nether Wart (item)',
  map: 'Map (item)',
  // 金质工具 wiki 叫 Golden
  gold_pickaxe: 'Golden Pickaxe',
  gold_axe: 'Golden Axe',
  gold_shovel: 'Golden Shovel',
  gold_hoe: 'Golden Hoe',
  gold_sword: 'Golden Sword',
  // 药水 wiki 叫 "Potion of X"
  potion_healing: 'Potion of Healing', potion_healing_2: 'Potion of Healing',
  potion_strength: 'Potion of Strength', potion_strength_2: 'Potion of Strength',
  potion_swiftness: 'Potion of Swiftness', potion_swiftness_2: 'Potion of Swiftness',
  potion_fire_resistance: 'Potion of Fire Resistance', potion_fire_resistance_l: 'Potion of Fire Resistance',
  potion_regeneration: 'Potion of Regeneration', potion_regeneration_2: 'Potion of Regeneration',
  potion_night_vision: 'Potion of Night Vision', potion_night_vision_l: 'Potion of Night Vision',
  potion_invisibility: 'Potion of Invisibility', potion_invisibility_l: 'Potion of Invisibility',
  potion_water_breathing: 'Potion of Water Breathing', potion_water_breathing_l: 'Potion of Water Breathing',
  potion_leaping: 'Potion of Leaping', potion_leaping_2: 'Potion of Leaping',
  potion_slow_falling: 'Potion of Slow Falling', potion_slow_falling_l: 'Potion of Slow Falling',
  potion_poison: 'Potion of Poison', potion_poison_2: 'Potion of Poison',
  potion_weakness: 'Potion of Weakness', potion_weakness_l: 'Potion of Weakness',
  potion_slowness: 'Potion of Slowness', potion_slowness_l: 'Potion of Slowness',
  potion_harming: 'Potion of Harming', potion_harming_2: 'Potion of Harming',
  splash_healing: 'Splash Potion of Healing', splash_healing_2: 'Splash Potion of Healing',
  splash_harming: 'Splash Potion of Harming', splash_harming_2: 'Splash Potion of Harming',
  splash_poison: 'Splash Potion of Poison', splash_poison_2: 'Splash Potion of Poison',
  splash_slowness: 'Splash Potion of Slowness',
  splash_weakness: 'Splash Potion of Weakness',
  splash_regeneration: 'Splash Potion of Regeneration',
  splash_strength: 'Splash Potion of Strength',
  splash_swiftness: 'Splash Potion of Swiftness',
  splash_fire_resistance: 'Splash Potion of Fire Resistance',
  // 方块 (BlockSprite slug)
  repeater: 'redstone-repeater',
  comparator: 'redstone-comparator',
  repeat_command_block: 'repeating-command-block',
  light_block: 'light',
  jigsaw_block: null, // 拼图方块无物品渲染图, 保留程序生成
  iron_block: 'block-of-iron',
  gold_block: 'block-of-gold',
  diamond_block: 'block-of-diamond',
  emerald_block: 'block-of-emerald',
  lapis_block: 'block-of-lapis-lazuli',
  redstone_block: 'block-of-redstone',
  netherite_block: 'block-of-netherite',
  copper_block: 'block-of-copper',
  quartz_block: 'block-of-quartz',
  steel_block: null, // 自定义方块
  steel_ore: null,
  // 自定义物品 (原版不存在)
  steel_ingot: null, steel_pickaxe: null, steel_axe: null, steel_shovel: null,
  steel_hoe: null, steel_sword: null,
  steel_helmet: null, steel_chestplate: null, steel_leggings: null, steel_boots: null,
  copper_pickaxe: null, copper_axe: null, copper_shovel: null, copper_hoe: null, copper_sword: null,
  copper_helmet: null, copper_chestplate: null, copper_leggings: null, copper_boots: null,
}

// wiki 文件名保持页面标题大小写, 虚词小写 (如 Flint_and_Steel 而非 Flint_And_Steel)
const SMALL_WORDS = new Set(['of', 'and', 'on', 'a', 'the', 'in', 'at', 'to', 'for', 'with'])
function titleCase(id) {
  return id.split('_').map((w, i) => {
    const lw = w.toLowerCase()
    if (i > 0 && SMALL_WORDS.has(lw)) return lw
    return w[0].toUpperCase() + w.slice(1)
  }).join(' ')
}

function wikiTitleFor(id) {
  if (id in NAME_MAP) return NAME_MAP[id]
  return titleCase(id)
}

function blockSlugFor(id) {
  if (id in NAME_MAP) return NAME_MAP[id]
  return id.replace(/_/g, '-')
}

// ── 解析 ITEM_REGISTRY ──
function parseItems() {
  const src = fs.readFileSync(ITEMS_TS, 'utf8')
  const entries = []
  const re = /^  (\w+): \{ id: '\1', name: '[^']*', type: '(\w+)'/gm
  for (const m of src.matchAll(re)) entries.push({ id: m[1], type: m[2] })
  return entries
}

// ── curl 封装 (wiki 的 WAF 会拦截 Node fetch 的 TLS 指纹, curl 可用) ──
function curlToFile(url, dest) {
  try {
    execFileSync('curl', ['-sL', '--retry', '2', '--max-time', '30', '-A', UA, url, '-o', dest], { stdio: 'ignore' })
    const buf = fs.readFileSync(dest)
    // 校验 PNG/GIF 魔数, 防止保存到错误页
    const isPng = buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
    const isGif = buf.length > 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46
    if (isPng || isGif) return true
    fs.unlinkSync(dest) // 删除无效文件
    return false
  } catch { return false }
}

function curlToString(url) {
  try {
    return execFileSync('curl', ['-s', '--max-time', '30', '-A', UA, url], { encoding: 'utf8' })
  } catch { return null }
}

// ── wiki API: 查找最新版原始贴图 ──
// wiki 文件名规则: 下划线分隔, 可选 (item) 后缀, png 或 gif (动态物品)
const VERSION_RE = /_JE(\d+)(?:_BE(\d+))?\.(png|gif)$/
const EXCLUDE_RE = /_trimmed_|_MCE|_MCD|_LCE|_TU\d|_SDGP|No_Alpha|Artwork|_Exhibit|_Death|_City|Model|Markings|_opaque|Actually|_texture|_Pull_|_Standby|Minecon|Piglin/

function pickNewest(files) {
  if (!files.length) return null
  const parse = n => {
    const m = n.match(VERSION_RE)
    return m ? { je: Number(m[1]), be: m[2] ? Number(m[2]) : -1 } : { je: 0, be: -1 }
  }
  files.sort((a, b) => { const pa = parse(a), pb = parse(b); return pb.je - pa.je || pb.be - pa.be })
  return files[0]
}

async function findLatestTexture(title) {
  // API 偶发限流返回空, 重试 3 次
  let data = null
  for (let attempt = 0; attempt < 3 && !data; attempt++) {
    const api = `${WIKI}/api.php?action=query&list=allimages&format=json&aiprefix=${encodeURIComponent(title)}&ailimit=200`
    const raw = curlToString(api)
    if (raw) { try { data = JSON.parse(raw) } catch { data = null } }
    if (!data) await sleep(800 * (attempt + 1))
  }
  if (!data) return null
  const names = (data.query?.allimages ?? []).map(f => f.name).filter(n => !EXCLUDE_RE.test(n))
  const esc = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '_')
  // 依次尝试三种命名模式
  const chains = [
    new RegExp(`^${esc}_JE\\d+(_BE\\d+)?\\.(png|gif)$`),
    new RegExp(`^${esc}_(item)_JE\\d+(_BE\\d+)?\\.(png|gif)$`),
    new RegExp(`^${esc}\\.(png|gif)$`),
  ]
  for (const re of chains) {
    const hit = pickNewest(names.filter(n => re.test(n)))
    if (hit) return hit
  }
  return null
}

async function download(url, dest) {
  for (let attempt = 0; attempt < 2; attempt++) {
    if (curlToFile(url, dest)) return true
    await sleep(500)
  }
  return false
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── 主流程 ──
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const entries = parseItems()
  console.log(`解析到 ${entries.length} 个物品`)

  let ok = 0, failed = [], skipped = []
  for (const { id, type } of entries) {
    const dest = path.join(OUT_DIR, `${id}.png`)
    const destGif = path.join(OUT_DIR, `${id}.gif`)
    if (fs.existsSync(dest) || fs.existsSync(destGif)) { ok++; continue } // 已下载, 跳过
    const wikiName = wikiTitleFor(id)
    if (wikiName === null) { skipped.push(id); continue }

    let got = false
    if (type === 'block') {
      const slug = blockSlugFor(id)
      if (slug === null) { skipped.push(id); continue }
      got = await download(`${WIKI}/images/BlockSprite_${slug}.png`, dest)
    } else {
      const file = await findLatestTexture(wikiName)
      if (file) {
        // gif 先存 .gif, 稍后由 recolor 步骤转首帧为 png
        got = await download(`${WIKI}/images/${encodeURIComponent(file)}`, file.endsWith('.gif') ? destGif : dest)
      }
    }

    if (got) { ok++; console.log(`✓ ${id}`) }
    else { failed.push(id); console.log(`✗ ${id} (${wikiName})`) }
    await sleep(150) // 友好限速
  }

  console.log(`\n完成: ${ok} 成功, ${skipped.length} 自定义跳过, ${failed.length} 失败`)
  if (failed.length) console.log('失败清单:\n' + failed.join('\n'))
  if (skipped.length) console.log('自定义跳过清单:\n' + skipped.join('\n'))
}

main().catch(e => { console.error(e); process.exit(1) })
