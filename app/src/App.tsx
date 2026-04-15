import { useState, useCallback } from 'react'
import { useShelters } from './hooks/useShelters'
import { useSupplies } from './hooks/useSupplies'
import { PublicMapView } from './views/PublicMapView'
import { ShelterDetailView } from './views/ShelterDetailView'
import { AdminUpdateView } from './views/AdminUpdateView'
import type { AppView } from './types'

export default function App() {
  const { shelters, isLoading, refresh: refreshShelters } = useShelters()
  const { suppliesMap, refresh: refreshSupplies }          = useSupplies()

  const [view, setView]               = useState<AppView>('map')
  const [selectedId, setSelectedId]   = useState<string | null>(null)

  const selectedShelter = shelters.find(s => s.id === selectedId) ?? null
  const selectedSnap    = selectedId ? suppliesMap.get(selectedId) : undefined

  const handleSelectShelter = useCallback((id: string) => {
    setSelectedId(id)
    setView('detail')
  }, [])

  const handleClose = useCallback(() => {
    setView('map')
    setSelectedId(null)
  }, [])

  const handleNavigate = useCallback((nextView: AppView, shelterId?: string) => {
    if (shelterId) setSelectedId(shelterId)
    setView(nextView)
  }, [])

  const handleAdminSaved = useCallback(() => {
    setView('detail')
    setTimeout(() => {
      void refreshShelters()
      void refreshSupplies()
    }, 1500)
  }, [refreshShelters, refreshSupplies])

  const doRefresh = useCallback(() => {
    void refreshShelters()
    void refreshSupplies()
  }, [refreshShelters, refreshSupplies])

  return (
    <div className="w-full h-full flex flex-col" style={{ height: '100dvh' }}>
      {/* Header — deep blue (color-blind safe) */}
      <header className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0 shadow-md z-30"
        style={{ backgroundColor: '#0072B2' }}>
        <span className="text-2xl" role="img" aria-label="家">🏠</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-white leading-tight">防災備蓄ウォッチ</h1>
          <p className="text-xs leading-none hidden sm:block" style={{ color: '#A8D8F0' }}>
            避難所の開設状況・備蓄量をリアルタイムで確認
          </p>
        </div>
        <button
          onClick={doRefresh}
          className="p-2 rounded-xl transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
          style={{ color: '#A8D8F0' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          aria-label="データを更新"
          title="データを更新"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
          </svg>
        </button>
      </header>

      {/* Main area */}
      <main className="flex-1 relative overflow-hidden">
        <PublicMapView
          shelters={shelters}
          suppliesMap={suppliesMap}
          isLoading={isLoading}
          onSelectShelter={handleSelectShelter}
          selectedId={selectedId}
        />

        {view === 'detail' && selectedShelter && (
          <ShelterDetailView
            shelter={selectedShelter}
            snapshot={selectedSnap}
            onClose={handleClose}
            onNavigate={handleNavigate}
          />
        )}

        {view === 'admin' && selectedShelter && (
          <AdminUpdateView
            shelter={selectedShelter}
            snapshot={selectedSnap}
            onClose={() => setView('detail')}
            onSaved={handleAdminSaved}
          />
        )}
      </main>
    </div>
  )
}
