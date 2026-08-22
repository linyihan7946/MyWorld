// 临时探测: 确认失败方块在 wiki 上的实际贴图命名
import { execFileSync } from 'child_process'

const WIKI = 'https://minecraft.wiki'
const UA = 'Mozilla/5.0 (MyWorld texture sync; educational fan project)'
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function probe(prefix, max = 8) {
  const api = `${WIKI}/api.php?action=query&list=allimages&format=json&aiprefix=${encodeURIComponent(prefix)}&ailimit=200`
  let raw = null
  for (let i = 0; i < 4 && !raw; i++) {
    try { raw = execFileSync('curl', ['-s', '--retry', '2', '--max-time', '30', '-A', UA, api], { encoding: 'utf8' }) } catch { raw = null }
    if (!raw) await sleep(1000 * (i + 1))
  }
  if (!raw) return console.log('---', prefix, '=> API FAIL')
  let j = null
  try { j = JSON.parse(raw) } catch { return console.log('---', prefix, '=> BAD JSON') }
  const names = (j.query?.allimages ?? []).map(f => f.name)
    .filter(n => !/Dungeons|MCD|LCE|MV|Golem|Sprite|svg$|Render|Screenshot/i.test(n))
    .filter(n => /\.png$/i.test(n))
  console.log('---', prefix, '---')
  console.log(names.slice(0, max).join('\n') || '(none)')
}

const prefixes = [
  'Bedrock',
  'Chest',
  'Lapis_Lazuli_Ore', 'Lapis_Ore',
  'Deepslate_(top', 'Deepslate_JE', 'Deepslate_(texture',
  'White_Concrete',
  'Anvil',
  'Loom',
  'Blast_Furnace',
  'Smoker',
  'Barrel',
  'Cactus',
  'Pumpkin_(side',
  'Melon_(side',
  'Hay_Bale', 'Hay_Block',
  'Bone_Block',
  'Bamboo_Block', 'Block_of_Bamboo',
  'Mushroom_Stem', 'Red_Mushroom_Block', 'Brown_Mushroom_Block',
  'Mycelium_(side',
  'Hopper',
  'Command_Block',
  'Barrier',
  'Light_Block',
  'Pink_Petals',
]
for (const p of prefixes) { await probe(p); await sleep(400) }
