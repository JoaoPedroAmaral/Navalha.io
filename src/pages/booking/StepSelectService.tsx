import { useQuery } from '@tanstack/react-query'
import { Clock, DollarSign } from 'lucide-react'
import { getPublicServices } from '@/api/public'
import { formatCurrency } from '@/lib/utils'
import type { Service } from '@/types'

interface Props {
  slug: string
  onSelect: (service: Service) => void
}

export default function StepSelectService({ slug, onSelect }: Props) {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['public-services', slug],
    queryFn: () => getPublicServices(slug),
  })

  const activeServices = services.filter((s) => s.active)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Escolha o serviço</h2>
        <p className="text-sm text-gray-500">Selecione o serviço desejado</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : activeServices.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border">
          Nenhum serviço disponível no momento
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeServices.map((service) => (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className="bg-white border-2 border-transparent hover:border-tenant-secondary rounded-xl p-5 text-left transition-all group shadow-sm hover:shadow-md"
            >
              <p className="font-semibold text-gray-900 group-hover:text-tenant-secondary transition-colors">
                {service.name}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  {service.durationMinutes} min
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold text-tenant-secondary">
                  <DollarSign className="w-3.5 h-3.5" />
                  {formatCurrency(service.price)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
