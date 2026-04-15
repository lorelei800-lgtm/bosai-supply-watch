import { LEVEL_COLORS } from '../utils/supplyColors'
import type { SupplyLevel } from '../types'

interface StatusBadgeProps {
  level: SupplyLevel
  size?: 'sm' | 'md'
}

export function StatusBadge({ level, size = 'md' }: StatusBadgeProps) {
  const { bg, label } = LEVEL_COLORS[level]
  const cls = size === 'sm'
    ? 'text-xs px-1.5 py-0.5 rounded-full font-medium'
    : 'text-sm px-2 py-1 rounded-full font-semibold'

  return (
    <span className={cls} style={{ backgroundColor: bg, color: '#fff' }}>
      {label}
    </span>
  )
}

interface OpenBadgeProps {
  isOpen: boolean
}

export function OpenBadge({ isOpen }: OpenBadgeProps) {
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{
        backgroundColor: isOpen ? '#10b981' : '#6b7280',
        color: '#fff',
      }}
    >
      {isOpen ? '開設中' : '閉鎖中'}
    </span>
  )
}
