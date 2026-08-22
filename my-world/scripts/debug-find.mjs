import { execFileSync } from 'child_process'

const UA = 'Mozilla/5.0 (MyWorld texture sync; educational fan project)'
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function findLatestTexture(title) {
  let data = null
  const api = `https://minecraft.wiki/api.php?action=query&list=allimages&format=json&aiprefix=${encodeURIComponent(title)}&ailimit=200`
  for (let attempt = 0; attempt < 3 && !data; attempt++) {
    let raw = null
    try { raw = execFileSync('curl', ['-s', '--retry', '2', '--max-time', '30', '-A', UA, api], { encoding: 'utf8' }) } catch (e) { raw = null }
    console.log('attempt', attempt, 'raw len:', raw ? raw.length : 'null')
    if (raw) { try { data = JSON.parse(raw) } catch (e) { console.log('parse fail:', raw.slice(0, 120)) } }
    if (!data) await sleep(800 * (attempt + 1))
  }
  const names = (data?.query?.allimages ?? []).map(f => f.name)
  console.log('names count:', names.length)
  const esc = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '_').replace(/'/g, "'")
  console.log('esc:', esc)
  const re = new RegExp(`^${esc}_JE(\\d+)(_BE\\d+)?\\.png$`)
  const hits = names.filter(n => re.test(n))
  console.log('hits:', hits.slice(0, 5))
}

for (const t of ['Stone', 'Dirt', 'Grass Block (top texture)', 'Oak Log (EW)']) {
  console.log('===', t)
  await findLatestTexture(t)
  await sleep(300)
}
