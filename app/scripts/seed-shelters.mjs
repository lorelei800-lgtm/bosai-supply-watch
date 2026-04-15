/**
 * seed-shelters.mjs — 国土数値情報 P20（避難施設）データを Re:Earth CMS に投入
 *
 * Usage:
 *   node scripts/seed-shelters.mjs [--municipality <code>] [--limit <n>]
 *
 * Options:
 *   --municipality  市区町村コード (例: 13101 = 千代田区). 省略時は全件
 *   --limit         最大投入件数 (デフォルト: 20)
 *
 * Prerequisites:
 *   1. Re:Earth CMS に shelter モデルを作成済みであること
 *   2. app/.env に VITE_CMS_TOKEN, VITE_CMS_BASE_URL, VITE_CMS_PROJECT を設定済み
 *   3. data/kokudo-shelters-raw.geojson を国土数値情報サイトからダウンロード済み
 *      → https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P20-v2_1.html
 *
 * GeoJSON field mapping (P20 v2.1):
 *   P20_001 → kokudo_id
 *   P20_002 → name
 *   P20_003 → address
 *   P20_004 → shelter_types (コード配列)
 *   P20_005 → municipality (市区町村コード)
 *   P20_006 → capacity
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── Load .env ───────────────────────────────────────────────────────────────

const envPath = path.join(__dirname, '..', '.env')
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found. Copy .env.example → .env and fill in credentials.')
  process.exit(1)
}

const env = {}
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/)
  if (match) env[match[1]] = match[2].trim()
}

const BASE_URL      = env['VITE_CMS_BASE_URL']
const PROJECT       = env['VITE_CMS_PROJECT']      // "workspace/project"
const SHELTER_MODEL = env['VITE_CMS_SHELTER_MODEL'] || 'shelter'
const TOKEN         = env['VITE_CMS_TOKEN']

if (!BASE_URL || !PROJECT || !TOKEN) {
  console.error('❌ VITE_CMS_BASE_URL, VITE_CMS_PROJECT, VITE_CMS_TOKEN must all be set in .env')
  process.exit(1)
}

const [WS, PROJ] = PROJECT.split('/')
const ITEMS_URL  = `${BASE_URL}/api/${WS}/projects/${PROJ}/models/${SHELTER_MODEL}/items`

// ─── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const municipalityArg = args[args.indexOf('--municipality') + 1] ?? null
const limitArg        = parseInt(args[args.indexOf('--limit') + 1] ?? '20', 10)

// ─── Disaster type code mapping (P20_004) ────────────────────────────────────

const DISASTER_CODES = {
  '1': 'flood',
  '2': 'landslide',
  '3': 'tsunami',
  '4': 'earthquake',
  '5': 'fire',
  '6': 'flood',      // 高潮 (storm surge) → flood
  '7': 'landslide',  // 雪崩 → landslide
}

function mapDisasterCodes(codes) {
  if (!Array.isArray(codes)) return []
  const mapped = codes
    .map(c => DISASTER_CODES[String(c)])
    .filter(Boolean)
  return [...new Set(mapped)] // deduplicate
}

// ─── Load GeoJSON ────────────────────────────────────────────────────────────

const geojsonPath = path.join(__dirname, '..', '..', 'data', 'kokudo-shelters-raw.geojson')
if (!fs.existsSync(geojsonPath)) {
  console.error(`❌ GeoJSON not found: ${geojsonPath}`)
  console.error('   Download from: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P20-v2_1.html')
  process.exit(1)
}

const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'))
let features = geojson.features ?? []

// Filter by municipality if specified
if (municipalityArg) {
  features = features.filter(f => String(f.properties?.P20_005 ?? '').startsWith(municipalityArg))
  console.log(`🔍 Filtered to municipality ${municipalityArg}: ${features.length} shelters`)
}

features = features.slice(0, limitArg)
console.log(`📋 Will seed ${features.length} shelter(s)`)

// ─── Seed ────────────────────────────────────────────────────────────────────

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function createItem(fields) {
  const res = await fetch(ITEMS_URL, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${body}`)
  }
  return res.status === 204 ? 'ok' : (await res.json()).id ?? 'ok'
}

let success = 0
let failed  = 0

for (const feature of features) {
  const p    = feature.properties ?? {}
  const coords = feature.geometry?.coordinates ?? [0, 0]

  const shelterTypes = mapDisasterCodes(p['P20_004'])

  const fields = [
    { key: 'kokudo_id',    value: String(p['P20_001'] ?? '') },
    { key: 'name',         value: String(p['P20_002'] ?? '不明') },
    { key: 'address',      value: String(p['P20_003'] ?? '') },
    { key: 'municipality', value: String(p['P20_005'] ?? '') },
    { key: 'lat',          value: coords[1] },
    { key: 'lng',          value: coords[0] },
    { key: 'capacity',     value: typeof p['P20_006'] === 'number' ? p['P20_006'] : 0 },
    { key: 'shelter_types',value: shelterTypes },
    { key: 'is_open',      value: false },
    { key: 'current_occupancy', value: 0 },
    { key: 'phone',        value: '' },
    { key: 'notes',        value: '' },
    { key: 'name_kana',    value: '' },
  ]

  const name = String(p['P20_002'] ?? '?')
  try {
    await createItem(fields)
    console.log(`  ✅ ${name}`)
    success++
  } catch (err) {
    console.error(`  ❌ ${name}: ${err.message}`)
    failed++
  }

  // Rate limit: 300ms between requests
  await sleep(300)
}

console.log(`\n🏁 Done: ${success} succeeded, ${failed} failed`)
