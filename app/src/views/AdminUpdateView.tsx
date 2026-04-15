import { useState } from 'react'
import type { Shelter, SupplySnapshot } from '../types'
import { SUPPLY_TYPES, SUPPLY_COLORS } from '../utils/supplyColors'
import { emptySnapshot } from '../utils/supplyLevels'
import { createSupplySnapshot, updateShelterOccupancy } from '../services/cmsApi'

const SUPPLY_UNITS: Record<string, string> = {
  food: '食分', water: 'リットル', blankets: '枚',
  diapers: 'パック', medicine: 'セット', generators: '台',
}

// How much each ＋/－ button increments
const STEP: Record<string, number> = {
  food: 10, water: 50, blankets: 5, diapers: 1, medicine: 1, generators: 1,
}

interface AdminUpdateViewProps {
  shelter:  Shelter
  snapshot: SupplySnapshot | undefined
  onClose:  () => void
  onSaved:  () => void
}

/** ＋／－ stepper input optimized for mobile one-thumb operation */
function Stepper({
  label, emoji, unit, value, step, max,
  onChange,
}: {
  label: string; emoji: string; unit: string
  value: number; step: number; max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
      <span className="text-2xl flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{unit}</p>
      </div>
      {/* Stepper controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - step))}
          className="w-11 h-11 rounded-xl text-xl font-bold flex items-center justify-center transition-colors select-none"
          style={{ backgroundColor: '#e5e7eb', color: '#374151' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#d1d5db')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
          aria-label={`${label}を${step}減らす`}
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          value={value}
          onChange={e => onChange(Math.max(0, Math.min(max, parseInt(e.target.value) || 0)))}
          className="w-16 text-center text-lg font-bold border-2 border-gray-200 rounded-xl py-2 focus:outline-none focus:border-blue-500 bg-white"
          aria-label={`${label}の数量`}
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-11 h-11 rounded-xl text-xl font-bold flex items-center justify-center transition-colors select-none text-white"
          style={{ backgroundColor: '#0072B2' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#005a8e')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0072B2')}
          aria-label={`${label}を${step}増やす`}
        >
          ＋
        </button>
      </div>
    </div>
  )
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
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white w-full max-w-lg rounded-t-3xl lg:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-3xl">
          <div>
            <h2 className="text-base font-bold text-gray-900">備蓄を更新する</h2>
            <p className="text-xs text-gray-400 truncate max-w-[220px]">{shelter.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-gray-100 text-gray-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="閉じる"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* Reporter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              担当者名 <span className="text-xs font-normal text-gray-400">（任意）</span>
            </label>
            <input
              type="text"
              value={reporterName}
              onChange={e => setReporterName(e.target.value)}
              placeholder="例: 田中 花子"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Occupancy — stepper */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">現在の避難人数</label>
            <Stepper
              label="避難人数" emoji="👥" unit="人"
              value={occupancy} step={10} max={shelter.capacity * 2}
              onChange={setOccupancy}
            />
          </div>

          {/* Supply steppers */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">備蓄数量（現在の数量）</p>
            <div className="flex flex-col gap-2">
              {SUPPLY_TYPES.map(type => (
                <Stepper
                  key={type}
                  label={SUPPLY_COLORS[type].label}
                  emoji={SUPPLY_COLORS[type].emoji}
                  unit={SUPPLY_UNITS[type]}
                  value={counts[type] ?? 0}
                  step={STEP[type]}
                  max={(caps[type] ?? 1) * 3}
                  onChange={v => setCounts(prev => ({ ...prev, [type]: v }))}
                />
              ))}
            </div>
          </div>

          {/* Target capacity (collapsible hint) */}
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-400 hover:text-gray-600 select-none py-1">
              ▸ 目標数量を変更する
            </summary>
            <div className="mt-2 flex flex-col gap-2 pl-2">
              {SUPPLY_TYPES.map(type => (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-base">{SUPPLY_COLORS[type].emoji}</span>
                  <span className="text-sm text-gray-600 w-14 flex-shrink-0">{SUPPLY_COLORS[type].label}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={caps[type] ?? 1}
                    onChange={e => setCaps(prev => ({
                      ...prev,
                      [type]: Math.max(1, parseInt(e.target.value) || 1),
                    }))}
                    className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-base focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-gray-400 w-12 flex-shrink-0">{SUPPLY_UNITS[type]}</span>
                </div>
              ))}
            </div>
          </details>

          {/* Error / Success */}
          {error && (
            <p className="text-sm font-medium bg-orange-50 text-orange-800 border border-orange-200 p-3 rounded-xl">
              ⚠️ {error}
            </p>
          )}
          {success && (
            <p className="text-sm font-bold bg-blue-50 text-blue-800 border border-blue-200 p-3 rounded-xl text-center">
              ✓ 更新しました
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || success}
            className="w-full text-white font-bold py-4 rounded-2xl text-base transition-colors min-h-[52px] mb-2 disabled:opacity-40"
            style={{ backgroundColor: saving || success ? undefined : '#0072B2' }}
          >
            {saving ? '保存中…' : success ? '✓ 保存しました' : '保存する'}
          </button>
        </form>
      </div>
    </div>
  )
}
