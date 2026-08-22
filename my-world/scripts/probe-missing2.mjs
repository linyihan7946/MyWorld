import { execFileSync } from 'child_process'
const WIKI = 'https://minecraft.wiki'
const UA = 'Mozilla/5.0 (MyWorld texture sync; educational fan project)'
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function probe(prefix, max = 6) {
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
  'Bedrock_JE',
  'Chest_(texture',
  'Anvil_(top', 'Anvil_(base', 'Anvil_JE',
  'Loom_(top',
  'Barrel_(side', 'Barrel_(top', 'Barrel_(bottom',
  'Hopper_(outside',
  'Hay_Bale_(UD',
  'Mushroom_Stem_(texture', 'Red_Mushroom_Block_(texture', 'Brown_Mushroom_Block_(texture',
  'Cactus_(side', 'Cactus_(top',
  'Pumpkin_(top', 'Melon_(top',
  'Repeating_Command_Block_(texture', 'Repeating_Command_Block_JE',
  'Light_(held', 'Structure_Void',
]
for (const p of prefixes) { await probe(p); await sleep(400) }
