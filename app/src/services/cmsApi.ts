/**
 * Re:Earth CMS REST API client for bosai-supply-watch
 *
 * Public read:  GET /api/p/{project}/{model}
 * Auth write:   POST/PATCH /api/{workspace}/projects/{project}/models/{model}/items
 */

import { CMS, splitProject } from '../config'
import type { Shelter, ShelterType, SupplySnapshot } from '../types'

// ─── CMS response shapes ─────────────────────────────────────────────────────

interface CmsItem {
  id: string
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

interface CmsListResponse {
  results: CmsItem[]
  totalCount: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const s = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : fallback

const n = (v: unknown, fallback = 0): number =>
  typeof v === 'number' ? v : fallback

const b = (v: unknown, fallback = false): boolean =>
  typeof v === 'boolean' ? v : fallback

async function publicGet(model: string, params = ''): Promise<CmsItem[]> {
  if (!CMS.enabled) return []
  const url = `${CMS.baseUrl}/api/p/${CMS.project}/${model}${params ? '?' + params : ''}`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    const data: CmsListResponse = await res.json()
    return data.results ?? []
  } catch (err) {
    console.warn(`[CMS] GET ${model} failed`, err)
    return []
  }
}

// ─── Shelter ─────────────────────────────────────────────────────────────────

function itemToShelter(item: CmsItem): Shelter {
  const rawTypes = item['shelter_types']
  const shelterTypes: ShelterType[] = Array.isArray(rawTypes)
    ? (rawTypes as string[]).filter(Boolean) as ShelterType[]
    : []

  return {
    id:               item.id,
    name:             s(item['name']),
    nameKana:         s(item['name_kana']),
    address:          s(item['address']),
    municipality:     s(item['municipality']),
    lat:              n(item['lat']),
    lng:              n(item['lng']),
    capacity:         n(item['capacity']),
    currentOccupancy: n(item['current_occupancy']),
    shelterTypes,
    isOpen:           b(item['is_open']),
    phone:            s(item['phone']),
    notes:            s(item['notes']),
    kokudoId:         s(item['kokudo_id']),
  }
}

export async function fetchShelters(): Promise<Shelter[]> {
  const items = await publicGet(CMS.shelterModel, 'perPage=100')
  return items.map(itemToShelter)
}

// ─── Supply snapshots ────────────────────────────────────────────────────────

function itemToSnapshot(item: CmsItem): SupplySnapshot {
  return {
    id:           item.id,
    shelterId:    s(item['shelter_id']),
    reportedAt:   s(item['reported_at']) || item.createdAt,
    reporterName: s(item['reporter_name']),
    food_portions:       n(item['food_portions']),
    food_capacity:       n(item['food_capacity'], 500),
    water_liters:        n(item['water_liters']),
    water_capacity:      n(item['water_capacity'], 1000),
    blankets_count:      n(item['blankets_count']),
    blankets_capacity:   n(item['blankets_capacity'], 200),
    diapers_count:       n(item['diapers_count']),
    diapers_capacity:    n(item['diapers_capacity'], 100),
    medicine_count:      n(item['medicine_count']),
    medicine_capacity:   n(item['medicine_capacity'], 50),
    generators_count:    n(item['generators_count']),
    generators_capacity: n(item['generators_capacity'], 5),
  }
}

/**
 * Fetch the most recent supply snapshot per shelter in a single request.
 * Returns a Map<shelterId, SupplySnapshot>.
 */
export async function fetchAllLatestSupplies(): Promise<Map<string, SupplySnapshot>> {
  const items = await publicGet(CMS.supplyModel, 'perPage=100&sort=reportedAt&dir=desc')
  const map = new Map<string, SupplySnapshot>()
  for (const item of items) {
    const snap = itemToSnapshot(item)
    // Keep only the first (most recent) per shelter
    if (!map.has(snap.shelterId)) {
      map.set(snap.shelterId, snap)
    }
  }
  return map
}

// ─── Authenticated writes ────────────────────────────────────────────────────

type Field = { key: string; value: unknown }

async function writeItem(
  model: string,
  fields: Field[],
  itemId?: string,
): Promise<string | null> {
  if (!CMS.writable) return null
  const [ws, proj] = splitProject()
  const base = `${CMS.baseUrl}/api/${ws}/projects/${proj}/models/${model}/items`
  const url    = itemId ? `${base}/${itemId}` : base
  const method = itemId ? 'PATCH' : 'POST'

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization:  `Bearer ${CMS.token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ fields }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.warn(`[CMS] ${method} ${model} ${res.status}:`, body)
      return null
    }
    if (res.status === 204 || res.headers.get('content-length') === '0') return 'ok'
    const text = await res.text()
    if (!text) return 'ok'
    const data = JSON.parse(text) as { id?: string }
    return data.id ?? 'ok'
  } catch (err) {
    console.warn(`[CMS] ${method} ${model} failed`, err)
    return null
  }
}

export async function createSupplySnapshot(
  snap: Omit<SupplySnapshot, 'id'>,
): Promise<string | null> {
  const fields: Field[] = [
    { key: 'shelter_id',          value: snap.shelterId },
    { key: 'reported_at',         value: snap.reportedAt },
    { key: 'reporter_name',       value: snap.reporterName },
    { key: 'food_portions',       value: snap.food_portions },
    { key: 'food_capacity',       value: snap.food_capacity },
    { key: 'water_liters',        value: snap.water_liters },
    { key: 'water_capacity',      value: snap.water_capacity },
    { key: 'blankets_count',      value: snap.blankets_count },
    { key: 'blankets_capacity',   value: snap.blankets_capacity },
    { key: 'diapers_count',       value: snap.diapers_count },
    { key: 'diapers_capacity',    value: snap.diapers_capacity },
    { key: 'medicine_count',      value: snap.medicine_count },
    { key: 'medicine_capacity',   value: snap.medicine_capacity },
    { key: 'generators_count',    value: snap.generators_count },
    { key: 'generators_capacity', value: snap.generators_capacity },
  ]
  return writeItem(CMS.supplyModel, fields)
}

export async function updateShelterOccupancy(
  shelterId: string,
  occupancy: number,
): Promise<boolean> {
  const result = await writeItem(
    CMS.shelterModel,
    [{ key: 'current_occupancy', value: occupancy }],
    shelterId,
  )
  return result !== null
}
