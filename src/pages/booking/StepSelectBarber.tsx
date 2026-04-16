import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Users } from "lucide-react";
import { getPublicBarbers } from "@/api/public";
import { Button } from "@/components/ui/button";
import type { Service, Barber } from "@/types";

interface Props {
  slug: string;
  selectedService: Service;
  onSelect: (barber: Barber) => void;
  onBack: () => void;
}

export default function StepSelectBarber({ slug, selectedService, onSelect, onBack }: Props) {
  const { data: barbers = [], isLoading } = useQuery({
    queryKey: ["public-barbers", slug],
    queryFn: ({ signal }) => getPublicBarbers(slug, signal),
    staleTime: 1000 * 60 * 5,
  });

  const eligibleBarbers = barbers.filter(
    (b) => b.active && b.services.some((s) => s.id === selectedService.id),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0 -ml-2 text-gray-500 hover:text-gray-900">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Escolha o funcionario
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Serviço: <span className="font-semibold text-gray-600">{selectedService.name}</span>
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : eligibleBarbers.length === 0 ? (
        <div className="text-center py-14 text-gray-400 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-medium text-gray-500">Nenhum funcionario disponível</p>
          <p className="text-sm text-gray-300 mt-1">Para este serviço no momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {eligibleBarbers.map((barber) => (
            <button
              key={barber.id}
              onClick={() => onSelect(barber)}
              className="
                bg-white border-2 border-gray-100 hover:border-tenant-secondary
                rounded-xl p-5 text-left transition-all duration-200 group
                shadow-sm hover:shadow-tenant-glow active:scale-[0.98]
                flex items-center gap-4
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-secondary focus-visible:ring-offset-2
              "
            >
              <div className="w-12 h-12 rounded-xl bg-tenant-primary flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md shadow-tenant-shadow">
                {barber.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 group-hover:text-tenant-secondary transition-colors duration-150 leading-tight truncate">
                  {barber.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">
                  {barber.services.length} serviço{barber.services.length !== 1 ? "s" : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
