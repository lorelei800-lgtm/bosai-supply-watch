import type { Shelter, SupplySnapshot } from '../types'
import { snapshotToRatios, worstLevel, emptySnapshot } from '../utils/supplyLevels'
import { PolygonInventory } from './PolygonInventory/PolygonInventory'
import { StatusBadge, OpenBadge } from './StatusBadge'
import { AdminGuard } from './AdminGuard'

const SHELTER_TYPE_LABELS: Record<string, string> = {
  flood:      '浸水',
  earthquake: '地震',
  fire:       '火災',
  landslide:  '土砂',
  tsunami:    '津波',
}

interface ShelterCardProps {
  shelter:  Shelter
  snapshot: SupplySnapshot | undefined
  onClose:  () => void
  onAdminClick: () => void
}

export function ShelterCard({ shelter, snapshot, onClose, onAdminClick }: ShelterCardProps) {
  const snap    = snapshot ?? emptySnapshot(shelter.id)
  const ratios  = snapshotToRatios(snap)
  const worst   = worstLevel(ratios)

  const occupancyPct = shelter.capacity > 0
    ? Math.min((shelter.currentOccupancy / shelter.capacity) * 100, 100)
    : 0

  return (
    <div className="bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-y-auto">
      {/* Mobile drag handle */}
      <div className="flex justify-center pt-2.5 pb-0 lg:hidden">
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <OpenBadge isOpen={shelter.isOpen} />
            {shelter.isOpen && <StatusBadge level={worst} size="sm" />}
          </div>
          <h2 className="text-lg font-bold text-gray-900 mt-1 leading-tight">{shelter.name}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{shelter.address}</p>
          {shelter.shelterTypes.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {shelter.shelterTypes.map(t => (
                <span key={t} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                  {SHELTER_TYPE_LABELS[t] ?? t}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-2 p-2 rounded-full hover:bg-gray-100 text-gray-400 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="閉じる"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Occupancy */}
      {shelter.isOpen && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600 font-medium">避難人数</span>
            <span className="text-sm font-bold text-gray-900">
              {shelter.currentOccupancy.toLocaleString()} 人
              <span className="text-xs font-normal text-gray-400"> / {shelter.capacity.toLocaleString()} 人</span>
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${occupancyPct}%`,
                backgroundColor: occupancyPct > 80 ? '#ef4444' : occupancyPct > 50 ? '#f59e0b' : '#10b981',
              }}
            />
          </div>
        </div>
      )}

      {/* PolygonInventory */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">備蓄状況</span>
          {snap.reportedAt && (
            <span className="text-xs text-gray-400">
              更新: {new Date(snap.reportedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {snap.reporterName ? ` (${snap.reporterName})` : ''}
            </span>
          )}
        </div>
        <PolygonInventory supplies={ratios} idPrefix={`card-${shelter.id}`} />
      </div>

      {/* Phone */}
      {shelter.phone && (
        <div className="px-4 pb-2">
          <a
            href={`tel:${shelter.phone}`}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 min-h-[44px]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V13a1 1 0 01-1 1h-2C7.82 14 2 8.18 2 3z"/>
            </svg>
            {shelter.phone}
          </a>
        </div>
      )}

      {/* Notes */}
      {shelter.notes && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">{shelter.notes}</p>
        </div>
      )}

      {/* Admin button */}
      <AdminGuard>
        <div className="px-4 pb-4 pt-1">
          <button
            onClick={onAdminClick}
            className="w-full text-white font-bold py-3 rounded-xl text-sm transition-colors min-h-[44px]"
            style={{ backgroundColor: '#0072B2' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#005a8e')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0072B2')}
          >
            ✏️ 備蓄を更新する
          </button>
        </div>
      </AdminGuard>
    </div>
  )
}
