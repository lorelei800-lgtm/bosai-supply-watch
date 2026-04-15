import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import type { Shelter, SupplySnapshot } from '../types'
import { snapshotToRatios, worstLevel, emptySnapshot } from '../utils/supplyLevels'
import { LEVEL_COLORS } from '../utils/supplyColors'
import { OpenBadge } from '../components/StatusBadge'

// Default center: Tokyo
const DEFAULT_CENTER: [number, number] = [139.745, 35.689]
const DEFAULT_ZOOM = 13

interface PublicMapViewProps {
  shelters:    Shelter[]
  suppliesMap: Map<string, SupplySnapshot>
  isLoading:   boolean
  onSelectShelter: (id: string) => void
  selectedId: string | null
}

/** Create a DOM element for a custom map pin */
function createPinElement(shelter: Shelter, snap: SupplySnapshot | undefined): HTMLDivElement {
  const s = snap ?? emptySnapshot(shelter.id)
  const ratios = snapshotToRatios(s)
  const level  = shelter.isOpen ? worstLevel(ratios) : 'full' // gray handled below
  const bg     = shelter.isOpen ? LEVEL_COLORS[level].bg : '#9ca3af'

  const el = document.createElement('div')
  el.style.cssText = `
    width: 36px; height: 36px;
    background: ${bg};
    border-radius: 8px;
    border: 2px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 16px;
    transition: transform 0.15s;
    position: relative;
  `
  el.innerHTML = shelter.isOpen ? '🏠' : '🏚️'

  // Tooltip on hover
  el.title = shelter.name

  return el
}

export function PublicMapView({
  shelters, suppliesMap, isLoading, onSelectShelter, selectedId,
}: PublicMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<maplibregl.Map | null>(null)
  const markersRef      = useRef<Map<string, maplibregl.Marker>>(new Map())
  const [openCount, setOpenCount] = useState(0)

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current) return
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    })
    map.addControl(new maplibregl.NavigationControl(), 'bottom-right')
    map.addControl(new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
    }), 'bottom-right')
    mapRef.current = map
    return () => map.remove()
  }, [])

  // Add / update markers when data changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    setOpenCount(shelters.filter(s => s.isOpen).length)

    // Remove old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current.clear()

    if (shelters.length === 0) return

    // Fit bounds to shelter positions
    if (shelters.length > 1) {
      const lngs = shelters.map(s => s.lng)
      const lats = shelters.map(s => s.lat)
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 60, maxZoom: 15, duration: 800 },
      )
    } else if (shelters.length === 1) {
      map.flyTo({ center: [shelters[0].lng, shelters[0].lat], zoom: 15 })
    }

    // Add markers
    for (const shelter of shelters) {
      const el     = createPinElement(shelter, suppliesMap.get(shelter.id))
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([shelter.lng, shelter.lat])
        .addTo(map)

      el.addEventListener('click', () => onSelectShelter(shelter.id))
      el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.2)' })
      el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })

      markersRef.current.set(shelter.id, marker)
    }
  }, [shelters, suppliesMap, onSelectShelter])

  // Highlight selected marker
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()
      el.style.transform = id === selectedId ? 'scale(1.3)' : 'scale(1)'
      el.style.zIndex    = id === selectedId ? '10' : '1'
    })
  }, [selectedId])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* Top overlay: stats bar */}
      <div className="absolute top-3 left-3 right-3 z-10 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg px-4 py-2 flex items-center gap-3 max-w-sm mx-auto lg:mx-0">
          <span className="text-2xl">🏠</span>
          <div className="flex-1">
            <p className="text-xs text-gray-500 leading-none">開設中の避難所</p>
            <p className="text-xl font-bold text-gray-900 leading-tight">
              {isLoading ? '—' : `${openCount}`}
              <span className="text-sm font-normal text-gray-500"> / {shelters.length} 箇所</span>
            </p>
          </div>
          {!isLoading && (
            <div className="flex flex-col items-end gap-0.5">
              <OpenBadge isOpen={openCount > 0} />
            </div>
          )}
        </div>
      </div>

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
          <div className="bg-white rounded-2xl shadow-lg px-6 py-4 text-center">
            <div className="w-8 h-8 border-4 border-red-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">データを読み込んでいます…</p>
          </div>
        </div>
      )}

      {/* Desktop: sidebar shelter list */}
      <div className="hidden lg:flex absolute top-20 left-3 bottom-3 w-72 z-10 flex-col gap-2 overflow-y-auto pointer-events-none">
        {!isLoading && shelters.map(shelter => {
          const snap   = suppliesMap.get(shelter.id)
          const ratios = snapshotToRatios(snap ?? emptySnapshot(shelter.id))
          const level  = shelter.isOpen ? worstLevel(ratios) : null

          return (
            <button
              key={shelter.id}
              onClick={() => onSelectShelter(shelter.id)}
              className="pointer-events-auto bg-white/95 backdrop-blur-sm rounded-xl shadow p-3 text-left hover:shadow-md transition-shadow border-2 w-full"
              style={{ borderColor: shelter.id === selectedId ? '#b91c1c' : 'transparent' }}
            >
              <div className="flex items-start gap-2">
                <span className="text-xl mt-0.5">{shelter.isOpen ? '🏠' : '🏚️'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{shelter.name}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{shelter.address}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <OpenBadge isOpen={shelter.isOpen} />
                    {level && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
                        style={{ backgroundColor: LEVEL_COLORS[level].bg }}
                      >
                        {LEVEL_COLORS[level].label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
