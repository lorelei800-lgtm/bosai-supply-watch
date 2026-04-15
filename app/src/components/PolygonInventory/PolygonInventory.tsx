/**
 * PolygonInventory — the signature visualization of bosai-supply-watch.
 *
 * Renders 6 supply columns as 3D isometric block stacks in a single SVG.
 * Scales responsively via width="100%" + fixed viewBox.
 */

import { SupplyStack } from './SupplyStack'
import { SupplyLegend } from './SupplyLegend'
import { SUPPLY_TYPES } from '../../utils/supplyColors'
import type { SupplyRatio } from '../../types'

interface PolygonInventoryProps {
  supplies: SupplyRatio[]
  /** Optional unique prefix for SVG clip IDs (needed when multiple inventories on page) */
  idPrefix?: string
}

// SVG layout constants
const SVG_W    = 360
const SVG_H    = 160
const STACK_H  = 110  // height of the block stack area
const COL_W    = SVG_W / 6  // 60px per column

export function PolygonInventory({ supplies, idPrefix = 'inv' }: PolygonInventoryProps) {
  return (
    <div>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        style={{ display: 'block', maxHeight: '200px' }}
        aria-label="備蓄量グラフ"
        role="img"
      >
        {SUPPLY_TYPES.map((type, i) => {
          const ratio = supplies.find(r => r.type === type)
          return (
            <SupplyStack
              key={type}
              type={type}
              count={ratio?.count ?? 0}
              capacity={ratio?.capacity ?? 1}
              ratio={ratio?.ratio ?? 0}
              x={i * COL_W}
              stackH={STACK_H}
              colW={COL_W}
              idPrefix={`${idPrefix}-${i}`}
            />
          )
        })}
      </svg>
      <SupplyLegend />
    </div>
  )
}
