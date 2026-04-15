import type { SupplyType, SupplyLevel } from '../types'

/**
 * Color palette based on Wong (2011) color-blind safe 8-color set.
 * Safe for deuteranopia, protanopia, and tritanopia.
 *
 * Black    #000000
 * Orange   #E69F00
 * Sky Blue #56B4E9
 * Green    #009E73
 * Yellow   #F0E442
 * Blue     #0072B2
 * Vermilion #D55E00
 * Purple   #CC79A7
 */

export const SUPPLY_COLORS: Record<SupplyType, { main: string; top: string; label: string; emoji: string }> = {
  food:       { main: '#E69F00', top: '#F5CC5F', label: '食料',   emoji: '🍱' },
  water:      { main: '#0072B2', top: '#56B4E9', label: '飲料水', emoji: '💧' },
  blankets:   { main: '#CC79A7', top: '#E8B5CF', label: '毛布',   emoji: '🛏️' },
  diapers:    { main: '#56B4E9', top: '#A8D8F0', label: 'おむつ', emoji: '👶' },
  medicine:   { main: '#009E73', top: '#5EC9A8', label: '医薬品', emoji: '💊' },
  generators: { main: '#555555', top: '#AAAAAA', label: '発電機', emoji: '⚡' },
}

export const SUPPLY_TYPES: SupplyType[] = ['food', 'water', 'blankets', 'diapers', 'medicine', 'generators']

/**
 * Supply level colors + symbols — uses both color AND shape/symbol
 * so color is never the sole means of conveying information (WCAG 1.4.1).
 *
 * full     → Blue    #0072B2  ◆
 * ok       → Green   #009E73  ●
 * low      → Orange  #E69F00  ▲
 * critical → Vermilion #D55E00 ■
 */
export const LEVEL_COLORS: Record<SupplyLevel, { bg: string; text: string; label: string; symbol: string }> = {
  full:     { bg: '#0072B2', text: '#ffffff', label: '充足',  symbol: '◆' },
  ok:       { bg: '#009E73', text: '#ffffff', label: '普通',  symbol: '●' },
  low:      { bg: '#E69F00', text: '#ffffff', label: '不足',  symbol: '▲' },
  critical: { bg: '#D55E00', text: '#ffffff', label: '緊急',  symbol: '■' },
}

/** Ghost block color (empty slots) */
export const GHOST_FILL   = '#f3f4f6'
export const GHOST_STROKE = '#d1d5db'
