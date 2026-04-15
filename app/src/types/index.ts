// ─── Supply domain ────────────────────────────────────────────────────────────

export type SupplyType = 'food' | 'water' | 'blankets' | 'diapers' | 'medicine' | 'generators'

/** Bucketed supply level based on count/capacity ratio */
export type SupplyLevel = 'full' | 'ok' | 'low' | 'critical'

export interface SupplyCounts {
  food_portions:       number
  food_capacity:       number
  water_liters:        number
  water_capacity:      number
  blankets_count:      number
  blankets_capacity:   number
  diapers_count:       number
  diapers_capacity:    number
  medicine_count:      number
  medicine_capacity:   number
  generators_count:    number
  generators_capacity: number
}

export interface SupplyRatio {
  type:     SupplyType
  label:    string
  count:    number
  capacity: number
  ratio:    number       // 0.0–1.0
  level:    SupplyLevel
}

// ─── Shelter domain ───────────────────────────────────────────────────────────

export type ShelterType = 'flood' | 'earthquake' | 'fire' | 'landslide' | 'tsunami'

export interface Shelter {
  id:               string    // Re:Earth CMS item ID
  name:             string
  nameKana:         string
  address:          string
  municipality:     string
  lat:              number
  lng:              number
  capacity:         number
  currentOccupancy: number
  shelterTypes:     ShelterType[]
  isOpen:           boolean
  phone:            string
  notes:            string
  kokudoId:         string
}

// ─── Supply snapshot ──────────────────────────────────────────────────────────

export interface SupplySnapshot extends SupplyCounts {
  id:           string
  shelterId:    string
  reportedAt:   string    // ISO 8601
  reporterName: string
}

// ─── UI navigation ────────────────────────────────────────────────────────────

export type AppView = 'map' | 'detail' | 'admin'
