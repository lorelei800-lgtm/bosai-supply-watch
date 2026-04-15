/**
 * PolygonBlock — one 3D isometric crate block rendered in SVG.
 *
 * Visual structure (isometric view):
 *   Top face  (lighter): diamond shape on top
 *   Front face (darker): rectangle below
 *
 * fillRatio (0–1) clips the block from the bottom up using a clipPath.
 * fullRatio=1 → full block, no clip needed.
 */

interface PolygonBlockProps {
  /** x offset (left edge of the bounding box) */
  x: number
  /** y offset (top edge of the bounding box) */
  y: number
  /** total height of the block bounding box */
  blockH: number
  /** total width of the block bounding box */
  blockW: number
  /** main face color */
  mainColor: string
  /** top face color (lighter) */
  topColor: string
  /** 0–1 how full this block is (1 = filled, 0 = ghost) */
  fillRatio: number
  /** unique id for the clipPath — must be globally unique within the SVG */
  clipId: string
  /** if true, render as ghost outline only */
  ghost?: boolean
}

export function PolygonBlock({
  x, y, blockH, blockW,
  mainColor, topColor,
  fillRatio, clipId, ghost = false,
}: PolygonBlockProps) {
  const hw = blockW / 2   // half width
  const th = blockH * 0.3 // top face height (30% of block)
  const fh = blockH - th  // front face height

  // Isometric top face (diamond)
  const topPoints = [
    `${x + hw},${y}`,
    `${x + blockW},${y + th}`,
    `${x + hw},${y + th * 2}`,
    `${x},${y + th}`,
  ].join(' ')

  // Front face (parallelogram)
  const frontPoints = [
    `${x},${y + th}`,
    `${x + hw},${y + th * 2}`,
    `${x + hw},${y + th * 2 + fh}`,
    `${x},${y + th + fh}`,
  ].join(' ')

  // Right face (parallelogram)
  const rightPoints = [
    `${x + hw},${y + th * 2}`,
    `${x + blockW},${y + th}`,
    `${x + blockW},${y + th + fh}`,
    `${x + hw},${y + th * 2 + fh}`,
  ].join(' ')

  if (ghost) {
    return (
      <g>
        <polygon points={topPoints}   fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.5" />
        <polygon points={frontPoints} fill="#e5e7eb" stroke="#d1d5db" strokeWidth="0.5" />
        <polygon points={rightPoints} fill="#e5e7eb" stroke="#d1d5db" strokeWidth="0.5" />
      </g>
    )
  }

  // Clip fills from the bottom up
  const clipH   = blockH * fillRatio
  const clipY   = y + blockH - clipH

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x - 1} y={clipY} width={blockW + 2} height={clipH + 1} />
        </clipPath>
      </defs>
      {/* Ghost base */}
      <polygon points={topPoints}   fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.5" />
      <polygon points={frontPoints} fill="#e5e7eb" stroke="#d1d5db" strokeWidth="0.5" />
      <polygon points={rightPoints} fill="#e5e7eb" stroke="#d1d5db" strokeWidth="0.5" />
      {/* Colored fill clipped from bottom */}
      <g clipPath={`url(#${clipId})`}>
        <polygon points={topPoints}   fill={topColor}  stroke={topColor}  strokeWidth="0.5" />
        <polygon points={frontPoints} fill={mainColor} stroke={mainColor} strokeWidth="0.5" />
        <polygon points={rightPoints} fill={mainColor} stroke={mainColor} strokeWidth="0.5" opacity="0.85" />
      </g>
    </g>
  )
}
