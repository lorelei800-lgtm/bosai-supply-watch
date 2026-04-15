/**
 * SupplyStack — vertical column of stacked PolygonBlocks for one supply type.
 *
 * 8 blocks total. Colored from bottom up based on ratio.
 * Partial top block uses fillRatio for smooth intermediate fill.
 */

import { PolygonBlock } from './PolygonBlock'
import { SUPPLY_COLORS } from '../../utils/supplyColors'
import type { SupplyType } from '../../types'

const TOTAL_BLOCKS = 8

interface SupplyStackProps {
  type:        SupplyType
  count:       number
  capacity:    number
  ratio:       number   // 0–1
  /** SVG x offset for this column */
  x: number
  /** Available SVG height for the stack */
  stackH: number
  /** Available SVG width per column */
  colW: number
  /** unique prefix for clipPath IDs */
  idPrefix: string
}

export function SupplyStack({
  type, count, capacity, ratio,
  x, stackH, colW, idPrefix,
}: SupplyStackProps) {
  const colors   = SUPPLY_COLORS[type]
  const blockW   = colW * 0.92
  const blockH   = stackH / TOTAL_BLOCKS
  const xOffset  = x + (colW - blockW) / 2

  // How many complete blocks + fractional part
  const filled       = ratio * TOTAL_BLOCKS
  const fullBlocks   = Math.floor(filled)
  const partialFill  = filled - fullBlocks  // 0–1 for the partial block

  return (
    <g>
      {Array.from({ length: TOTAL_BLOCKS }).map((_, i) => {
        // Render from top (i=0) to bottom (i=TOTAL_BLOCKS-1)
        // But we fill from bottom up: block index from bottom = (TOTAL_BLOCKS - 1 - i)
        const fromBottom = TOTAL_BLOCKS - 1 - i
        const blockY     = i * blockH

        let fillRatio = 0
        let ghost     = true

        if (fromBottom < fullBlocks) {
          // Fully filled
          fillRatio = 1
          ghost     = false
        } else if (fromBottom === fullBlocks && partialFill > 0) {
          // Partially filled
          fillRatio = partialFill
          ghost     = false
        }

        return (
          <PolygonBlock
            key={i}
            x={xOffset}
            y={blockY}
            blockH={blockH * 0.95}
            blockW={blockW}
            mainColor={colors.main}
            topColor={colors.top}
            fillRatio={fillRatio}
            clipId={`${idPrefix}-${type}-${i}`}
            ghost={ghost}
          />
        )
      })}

      {/* Supply count label */}
      <text
        x={x + colW / 2}
        y={stackH + 14}
        textAnchor="middle"
        fontSize="9"
        fill="#374151"
        fontWeight="600"
      >
        {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
        <tspan fontSize="7" fill="#9ca3af">/{capacity >= 1000 ? `${(capacity / 1000).toFixed(0)}k` : capacity}</tspan>
      </text>

      {/* Emoji icon */}
      <text
        x={x + colW / 2}
        y={stackH + 26}
        textAnchor="middle"
        fontSize="12"
      >
        {colors.emoji}
      </text>

      {/* Japanese label */}
      <text
        x={x + colW / 2}
        y={stackH + 38}
        textAnchor="middle"
        fontSize="8"
        fill="#6b7280"
      >
        {colors.label}
      </text>
    </g>
  )
}
