// 临时探测脚本: 验证 wiki 多面方块平面贴图命名规律
import { execFileSync } from 'child_process'

const WIKI = 'https://minecraft.wiki'
const UA = 'Mozilla/5.0 (MyWorld texture sync; educational fan project)'

async function probe(prefix, max = 14) {
  const api = `${WIKI}/api.php?action=query&list=allimages&format=json&aiprefix=${encodeURIComponent(prefix)}&ailimit=200`
  let raw = null
  for (let i = 0; i < 4 && !raw; i++) {
    try { raw = execFileSync('curl', ['-s', '--retry', '2', '--max-time', '30', '-A', UA, api], { encoding: 'utf8' }) } catch { raw = null }
    if (!raw) await new Promise(r => setTimeout(r, 1000 * (i + 1)))
  }
  if (!raw) return console.log('---', prefix, '=> API FAIL')
  let j = null
  try { j = JSON.parse(raw) } catch { return console.log('---', prefix, '=> BAD JSON') }
  const names = (j.query?.allimages ?? []).map(f => f.name)
    .filter(n => !/Dungeons|MCD|LCE|MV|Golem|Sprite|svg$/i.test(n))
  console.log('---', prefix, '---')
  console.log(names.slice(0, max).join('\n') || '(none)')
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
const prefixes = [
  'Grass_Block_(top', 'Grass_Block_(side',
  'Furnace_Front', 'Furnace_Top', 'Furnace_(side',
  'Crafting_Table_(side', 'Crafting_Table_(top',
  'TNT_(side', 'TNT_(top', 'TNT_(bottom',
  'Pumpkin_(side', 'Pumpkin_(top', 'Melon_(side',
  'Sandstone_Top', 'Sandstone_Bottom',
  'Hay_Block_(side', 'Hay_Block_(top',
  'Snow_(texture', 'Snow_(layer', 'Snow_Block',
  'Crimson_Nylium_(side', 'Mycelium_(top', 'Mycelium_(side',
  'Dirt_Path_(top', 'Dirt_Path_(side',
  'Piston_(side', 'Piston_(top', 'Piston_(bottom',
  'Ancient_Debris_(side', 'Ancient_Debris_(top',
  "Jack_o'Lantern_(side", "Jack_o'Lantern_(top",
  'Cactus_(side', 'Cactus_(top',
  'Purpur_Pillar_(side', 'Purpur_Pillar_(top', 'Quartz_Pillar_(side',
  'Basalt_(side', 'Basalt_(top',
  'Beehive_(side', 'Bookshelf_(top',
  'Observer_(side', 'Hopper_Outside',
]
for (const p of prefixes) { await probe(p); await sleep(350) }
