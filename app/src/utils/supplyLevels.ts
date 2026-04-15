import type { SupplyLevel, SupplyRatio, SupplySnapshot, SupplyType } from '../types'
import { SUPPLY_COLORS, SUPPLY_TYPES } from './supplyColors'

/** Convert a ratio (0–1) to a SupplyLevel bucket */
export function ratioToLevel(ratio: number): SupplyLevel {
  if (ratio >= 0.75) return 'full'
  if (ratio >= 0.50) return 'ok'
  if (ratio >= 0.25) return 'low'
  return 'critical'
}

/** Build SupplyRatio array from a SupplySnapshot */
export function snapshotToRatios(snap: SupplySnapshot): SupplyRatio[] {
  const pairs: Array<{ type: SupplyType; count: number; capacity: number }> = [
    { type: 'food',       count: snap.food_portions,   capacity: snap.food_capacity },
    { type: 'water',      count: snap.water_liters,    capacity: snap.water_capacity },
    { type: 'blankets',   count: snap.blankets_count,  capacity: snap.blankets_capacity },
    { type: 'diapers',    count: snap.diapers_count,   capacity: snap.diapers_capacity },
    { type: 'medicine',   count: snap.medicine_count,  capacity: snap.medicine_capacity },
    { type: 'generators', count: snap.generators_count,capacity: snap.generators_capacity },
  ]

  return pairs.map(({ type, count, capacity }) => {
    const ratio = capacity > 0 ? Math.min(count / capacity, 1) : 0
    return {
      type,
      label:    SUPPLY_COLORS[type].label,
      count,
      capacity,
      ratio,
      level:    ratioToLevel(ratio),
    }
  })
}

/** Return the worst SupplyLevel across all types (for map pin color) */
export function worstLevel(ratios: SupplyRatio[]): SupplyLevel {
  const order: SupplyLevel[] = ['critical', 'low', 'ok', 'full']
  for (const level of order) {
    if (ratios.some(r => r.level === level)) return level
  }
  return 'full'
}

/** Empty snapshot used as a placeholder when no data exists yet */
export function emptySnapshot(shelterId: string): SupplySnapshot {
  const zero = (type: SupplyType) => {
    const defaults: Record<SupplyType, number> = {
      food: 500, water: 1000, blankets: 200, diapers: 100, medicine: 50, generators: 5,
    }
    return defaults[type]
  }

  return {
    id: '',
    shelterId,
    reportedAt: '',
    reporterName: '',
    food_portions:       0,
    food_capacity:       zero('food'),
    water_liters:        0,
    water_capacity:      zero('water'),
    blankets_count:      0,
    blankets_capacity:   zero('blankets'),
    diapers_count:       0,
    diapers_capacity:    zero('diapers'),
    medicine_count:      0,
    medicine_capacity:   zero('medicine'),
    generators_count:    0,
    generators_capacity: zero('generators'),
  }
}

export { SUPPLY_TYPES }
