import { useState } from 'react'
import type { Shelter, SupplySnapshot } from '../types'
import { SUPPLY_TYPES, SUPPLY_COLORS } from '../utils/supplyColors'
import { emptySnapshot } from '../utils/supplyLevels'
import { createSupplySnapshot, updateShelterOccupancy } from '../services/cmsApi'

// Map SupplyType to the field keys in SupplySnapshot
const SUPPLY_FIELDS: Record<string, { countKey: keyof SupplySnapshot; capKey: keyof SupplySnapshot; unit: string }> = {
  food:       { countKey: 'food_portions',   capKey: 'food_capacity',       unit: '食分' },
  water:      { countKey: 'water_liters',    capKey: 'water_capacity',      unit: 'リットル' },
  blankets:   { countKey: 'blankets_count',  capKey: 'blankets_capacity',   unit: '枚' },
  diapers:    { countKey: 'diapers_count',   capKey: 'diapers_capacity',    unit: 'パック' },
  medicine:   { countKey: 'medicine_count',  capKey: 'medicine_capacity',   unit: 'セット' },
  generators: { countKey: 'generators_count',capKey: 'generators_capacity', unit: '台' },
}

interface AdminUpdateViewProps {
  shelter:  Shelter
  snapshot: SupplySnapshot | undefined
  onClose:  () => void
  onSaved:  () => void
}

export function AdminUpdateView({ shelter, snapshot, onClose, onSaved }: AdminUpdateViewProps) {
  const base = snapshot ?? emptySnapshot(shelter.id)

  const [reporterName, setReporterName] = useState('')
  const [occupancy, setOccupancy]       = useState(shelter.currentOccupancy)
  const [counts, setCounts]             = useState<Record<string, number>>({
    food:       base.food_portions,
    water:      base.water_liters,
    blankets:   base.blankets_count,
    diapers:    base.diapers_count,
    medicine:   base.medicine_count,
    generators: base.generators_count,
  })
  const [caps, setCaps] = useState<Record<string, number>>({
    food:       base.food_capacity,
    water:      base.water_capacity,
    blankets:   base.blankets_capacity,
    diapers:    base.diapers_capacity,
    medicine:   base.medicine_capacity,
    generators: base.generators_capacity,
  })

  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const snap: Omit<SupplySnapshot, 'id'> = {
      shelterId:    shelter.id,
      reportedAt:   new Date().toISOString(),
      reporterName,
      food_portions:       counts['food'] ?? 0,
      food_capacity:       caps['food'] ?? 500,
      water_liters:        counts['water'] ?? 0,
      water_capacity:      caps['water'] ?? 1000,
      blankets_count:      counts['blankets'] ?? 0,
      blankets_capacity:   caps['blankets'] ?? 200,
      diapers_count:       counts['diapers'] ?? 0,
      diapers_capacity:    caps['diapers'] ?? 100,
      medicine_count:      counts['medicine'] ?? 0,
      medicine_capacity:   caps['medicine'] ?? 50,
      generators_count:    counts['generators'] ?? 0,
      generators_capacity: caps['generators'] ?? 5,
    }

    const [snapResult, occResult] = await Promise.all([
      createSupplySnapshot(snap),
      occupancy !== shelter.currentOccupancy
        ? updateShelterOccupancy(shelter.id, occupancy)
        : Promise.resolve(true),
    ])

    setSaving(false)

    if (snapResult !== null && occResult !== false) {
      setSuccess(true)
      setTimeout(() => onSaved(), 1200)
    } else {
      setError('保存に失敗しました。ネットワークを確認してください。')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-2xl lg:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-gray-900">備蓄を更新する</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="閉じる"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          {/* Shelter name */}
          <p className="text-sm text-gray-500 -mt-1">{shelter.name}</p>

          {/* Reporter name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              担当者名
              <span className="text-xs font-normal text-gray-400 ml-1">（任意）</span>
            </label>
            <input
              type="text"
              value={reporterName}
              onChange={e => setReporterName(e.target.value)}
              placeholder="例: 田中 花子"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Occupancy */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              現在の避難人数
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={shelter.capacity * 2}
                value={occupancy}
                onChange={e => setOccupancy(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <span className="text-sm text-gray-500">人</span>
            </div>
          </div>

          {/* Supply inputs */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">備蓄数量</p>
            <div className="flex flex-col gap-3">
              {SUPPLY_TYPES.map(type => {
                const { unit } = SUPPLY_FIELDS[type]
                const colors = SUPPLY_COLORS[type]
                return (
                  <div key={type} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{colors.emoji}</span>
                      <span className="text-sm font-semibold text-gray-700">{colors.label}</span>
                      <span className="text-xs text-gray-400">({unit})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">現在の数量</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={(caps[type] ?? 0) * 2}
                          value={counts[type] ?? 0}
                          onChange={e => setCounts(prev => ({
                            ...prev,
                            [type]: Math.max(0, parseInt(e.target.value) || 0),
                          }))}
                          className="w-full border border-gray-300 rounded-lg px-2 py-2 text-base focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                          style={{ borderColor: (counts[type] ?? 0) === 0 ? '#fca5a5' : undefined }}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">目標数量</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={caps[type] ?? 1}
                          onChange={e => setCaps(prev => ({
                            ...prev,
                            [type]: Math.max(1, parseInt(e.target.value) || 1),
                          }))}
                          className="w-full border border-gray-300 rounded-lg px-2 py-2 text-base focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>
          )}

          {/* Success */}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 p-3 rounded-xl font-semibold text-center">
              更新しました ✓
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || success}
            className="w-full bg-red-700 hover:bg-red-800 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl text-base transition-colors min-h-[44px] mt-1"
          >
            {saving ? '保存中...' : success ? '保存しました' : '保存する'}
          </button>
        </form>
      </div>
    </div>
  )
}
