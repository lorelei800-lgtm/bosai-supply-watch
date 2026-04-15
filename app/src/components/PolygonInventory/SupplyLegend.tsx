import { LEVEL_COLORS } from '../../utils/supplyColors'
import type { SupplyLevel } from '../../types'

const LEVELS: SupplyLevel[] = ['full', 'ok', 'low', 'critical']

export function SupplyLegend() {
  return (
    <div className="flex items-center justify-center gap-3 mt-1 flex-wrap">
      {LEVELS.map(level => (
        <div key={level} className="flex items-center gap-1">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: LEVEL_COLORS[level].bg }}
          />
          <span className="text-xs text-gray-500">{LEVEL_COLORS[level].label}</span>
        </div>
      ))}
    </div>
  )
}
