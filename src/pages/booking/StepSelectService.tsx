import { useQuery } from '@tanstack/react-query'
import { Clock, Scissors } from 'lucide-react'
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
    queryFn: ({ signal }) => getPublicServices(slug, signal),
    staleTime: 1000 * 60 * 5,
  })

  const activeServices = services.filter((s) => s.active)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Escolha o serviço</h2>
        <p className="text-sm text-gray-400 mt-1">Selecione o serviço desejado para continuar</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : activeServices.length === 0 ? (
        <div className="text-center py-14 text-gray-400 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-medium text-gray-500">Nenhum serviço disponível</p>
          <p className="text-sm text-gray-300 mt-1">Tente novamente mais tarde</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeServices.map((service) => (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className="
                bg-white border-2 border-gray-100 hover:border-tenant-secondary
                rounded-xl p-5 text-left transition-all duration-200 group
                shadow-sm hover:shadow-tenant-glow active:scale-[0.98]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-secondary focus-visible:ring-offset-2
              "
            >
              <p className="font-semibold text-gray-900 group-hover:text-tenant-secondary transition-colors duration-150 leading-tight">
                {service.name}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg font-medium">
                  <Clock className="w-3 h-3" />
                  {service.durationMinutes} min
                </span>
                <span className="text-sm font-bold text-tenant-secondary">
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
