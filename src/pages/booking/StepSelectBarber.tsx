import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { getPublicBarbers } from '@/api/public'
import { Button } from '@/components/ui/button'
import type { Service, Barber } from '@/types'

interface Props {
  slug: string
  selectedService: Service
  onSelect: (barber: Barber) => void
  onBack: () => void
}

export default function StepSelectBarber({ slug, selectedService, onSelect, onBack }: Props) {
  const { data: barbers = [], isLoading } = useQuery({
    queryKey: ['public-barbers', slug],
    queryFn: () => getPublicBarbers(slug),
  })

  // Filter barbers who offer the selected service
  const eligibleBarbers = barbers.filter(
    (b) => b.active && b.services.some((s) => s.id === selectedService.id)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Escolha o barbeiro</h2>
          <p className="text-sm text-gray-500">
            Serviço: <strong>{selectedService.name}</strong>
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : eligibleBarbers.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border">
          Nenhum barbeiro disponível para este serviço
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {eligibleBarbers.map((barber) => (
            <button
              key={barber.id}
              onClick={() => onSelect(barber)}
              className="bg-white border-2 border-transparent hover:border-tenant-secondary rounded-xl p-5 text-left transition-all group shadow-sm hover:shadow-md flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-tenant-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
                {barber.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-tenant-secondary transition-colors">
                  {barber.name}
                </p>
                <p className="text-sm text-gray-400 mt-0.5">
                  {barber.services.length} serviço{barber.services.length !== 1 ? 's' : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
