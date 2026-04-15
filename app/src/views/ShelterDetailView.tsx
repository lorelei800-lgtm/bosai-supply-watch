import type { Shelter, SupplySnapshot, AppView } from '../types'
import { ShelterCard } from '../components/ShelterCard'

interface ShelterDetailViewProps {
  shelter:    Shelter
  snapshot:   SupplySnapshot | undefined
  onClose:    () => void
  onNavigate: (view: AppView, shelterId?: string) => void
}

export function ShelterDetailView({ shelter, snapshot, onClose, onNavigate }: ShelterDetailViewProps) {
  return (
    <>
      {/* Mobile: bottom sheet overlay */}
      <div
        className="lg:hidden fixed inset-x-0 bottom-0 z-40"
        style={{ maxHeight: '85vh' }}
      >
        <ShelterCard
          shelter={shelter}
          snapshot={snapshot}
          onClose={onClose}
          onAdminClick={() => onNavigate('admin', shelter.id)}
        />
      </div>

      {/* Desktop: right panel */}
      <div className="hidden lg:block absolute top-4 right-4 bottom-4 w-96 z-40 overflow-hidden">
        <ShelterCard
          shelter={shelter}
          snapshot={snapshot}
          onClose={onClose}
          onAdminClick={() => onNavigate('admin', shelter.id)}
        />
      </div>
    </>
  )
}
