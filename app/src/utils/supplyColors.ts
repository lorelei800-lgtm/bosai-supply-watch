import type { SupplyType, SupplyLevel } from '../types'

/** Per-supply-type color palette (Stardew Valley / friendly tones) */
export const SUPPLY_COLORS: Record<SupplyType, { main: string; top: string; label: string; emoji: string }> = {
  food:       { main: '#f59e0b', top: '#fcd34d', label: '食料',   emoji: '🍱' },
  water:      { main: '#3b82f6', top: '#93c5fd', label: '飲料水', emoji: '💧' },
  blankets:   { main: '#8b5cf6', top: '#c4b5fd', label: '毛布',   emoji: '🛏️' },
  diapers:    { main: '#ec4899', top: '#f9a8d4', label: 'おむつ', emoji: '👶' },
  medicine:   { main: '#10b981', top: '#6ee7b7', label: '医薬品', emoji: '💊' },
  generators: { main: '#6b7280', top: '#d1d5db', label: '発電機', emoji: '⚡' },
}

export const SUPPLY_TYPES: SupplyType[] = ['food', 'water', 'blankets', 'diapers', 'medicine', 'generators']

/** Level → color for status badges and map pins */
export const LEVEL_COLORS: Record<SupplyLevel, { bg: string; text: string; label: string }> = {
  full:     { bg: '#10b981', text: '#ffffff', label: '充足' },
  ok:       { bg: '#f59e0b', text: '#ffffff', label: '普通' },
  low:      { bg: '#f97316', text: '#ffffff', label: '不足' },
  critical: { bg: '#ef4444', text: '#ffffff', label: '緊急' },
}

/** Ghost block color (empty slots) */
export const GHOST_FILL   = '#f3f4f6'
export const GHOST_STROKE = '#d1d5db'
