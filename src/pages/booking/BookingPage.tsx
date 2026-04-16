import { useState, useEffect, useLayoutEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPublicBarbershop, getPublicProducts } from "@/api/public";
import { applyTenantTheme, resetTenantTheme } from "@/lib/applyTenantTheme";
import {
  Scissors,
  MapPin,
  Package,
  Phone,
  ExternalLink,
  Clock,
  CalendarDays,
} from "lucide-react";
import { formatPhoneDisplay } from "@/components/ui/phone-input";
import StepSelectService from "./StepSelectService";
import StepSelectBarber from "./StepSelectBarber";
import StepSelectDateTime from "./StepSelectDateTime";
import StepClientInfo from "./StepClientInfo";
import StepSuccess from "./StepSuccess";
import { formatCurrency } from "@/lib/utils";
import type { Service, Barber, Appointment } from "@/types";

export type BookingState = {
  service: Service | null;
  barber: Barber | null;
  scheduledAt: string | null;
  appointment: Appointment | null;
};

const STEPS = ["Serviço", "Funcionario", "Data & Hora", "Confirmação", "Sucesso"];

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [booking, setBooking] = useState<BookingState>({
    service: null,
    barber: null,
    scheduledAt: null,
    appointment: null,
  });

  const [themeReady, setThemeReady] = useState(false);

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ["public-shop", slug],
    queryFn: ({ signal }) => getPublicBarbershop(slug!, signal),
    enabled: !!slug,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["public-products", slug],
    queryFn: ({ signal }) => getPublicProducts(slug!, signal),
    enabled: !!slug,
  });

  useLayoutEffect(() => {
    if (!shopLoading) {
      if (shop) applyTenantTheme(shop.primaryColor, shop.secondaryColor);
      setThemeReady(true);
    }
  }, [shop, shopLoading]);

  useEffect(() => {
    return () => resetTenantTheme();
  }, []);

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Link inválido
      </div>
    );
  }

  if (shopLoading || !themeReady) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
            <Scissors className="w-7 h-7 text-white/30 animate-pulse" />
          </div>
          <p className="text-sm text-white/30 tracking-widest uppercase">Carregando</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tenant-surface">
      {/* Header */}
      <div className="bg-tenant-primary text-white shadow-tenant-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3.5">
          {shop?.logoUrl ? (
            <img
              src={shop.logoUrl}
              alt={shop.name}
              className="w-10 h-10 rounded-xl object-cover shrink-0 ring-2 ring-white/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-tenant-secondary flex items-center justify-center shrink-0 shadow-md shadow-tenant-glow">
              <Scissors className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-base leading-tight tracking-tight">
              {shop?.name ?? "Barbearia"}
            </h1>
            <p className="text-xs text-white/50 mt-0.5">Agendamento online</p>
          </div>
        </div>
      </div>

      {/* Progress stepper */}
      {step < 4 && (
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-3.5">
            <div className="flex items-center justify-center gap-0">
              {STEPS.slice(0, 4).map((label, idx) => (
                <div key={label} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div
                      className={`
                        w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200
                        ${idx < step
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : idx === step
                            ? 'progress-step-active text-white'
                            : 'bg-gray-100 text-gray-400'
                        }
                      `}
                    >
                      {idx < step ? "✓" : idx + 1}
                    </div>
                    <span
                      className={`text-xs font-medium leading-tight text-center max-w-[60px] truncate ${
                        idx === step ? "text-gray-800 font-semibold" : "text-gray-400"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 sm:mx-2 mt-[-14px] rounded-full transition-colors duration-300 ${
                        idx < step ? "bg-emerald-400" : "bg-gray-150"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Barbershop info bar */}
      {shop &&
        (shop.mapsUrl || shop.contactPhone || shop.instagramUrl || shop.openingHours || shop.operationDays) && (
          <div className="bg-white border-b border-gray-100 overflow-x-auto">
            <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-x-5 gap-y-1 flex-wrap min-w-0">
              {shop.mapsUrl && (
                <a
                  href={shop.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-tenant-secondary transition-colors whitespace-nowrap font-medium"
                >
                  <MapPin className="w-3 h-3 shrink-0" />
                  Ver no mapa
                </a>
              )}
              {shop.contactPhone && (
                <a
                  href={`tel:${shop.contactPhone}`}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-tenant-secondary transition-colors whitespace-nowrap font-medium"
                >
                  <Phone className="w-3 h-3 shrink-0" />
                  {formatPhoneDisplay(shop.contactPhone)}
                </a>
              )}
              {shop.instagramUrl && (
                <a
                  href={shop.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-tenant-secondary transition-colors whitespace-nowrap font-medium"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />@
                  {shop.instagramUrl.replace(/.*instagram\.com\//, "").replace(/\/$/, "")}
                </a>
              )}
              {shop.openingHours && (
                <span className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap font-medium">
                  <Clock className="w-3 h-3 shrink-0" />
                  {shop.openingHours}
                </span>
              )}
              {shop.operationDays && (
                <span className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap font-medium">
                  <CalendarDays className="w-3 h-3 shrink-0" />
                  {shop.operationDays}
                </span>
              )}
            </div>
          </div>
        )}

      {/* Products catalog */}
      {products.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-tenant-secondary" />
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Produtos</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm hover:shadow-md transition-shadow">
                <p className="font-semibold text-gray-900 text-sm leading-snug">{product.name}</p>
                {product.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
                )}
                <p className="mt-2.5 text-sm font-bold text-tenant-secondary">{formatCurrency(product.price)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {step === 0 && (
          <StepSelectService
            slug={slug}
            onSelect={(service) => {
              setBooking((prev) => ({ ...prev, service, barber: null, scheduledAt: null }));
              setStep(1);
            }}
          />
        )}
        {step === 1 && booking.service && (
          <StepSelectBarber
            slug={slug}
            selectedService={booking.service}
            onSelect={(barber) => {
              setBooking((prev) => ({ ...prev, barber, scheduledAt: null }));
              setStep(2);
            }}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && booking.service && booking.barber && (
          <StepSelectDateTime
            slug={slug}
            service={booking.service}
            barber={booking.barber}
            onSelect={(scheduledAt) => {
              setBooking((prev) => ({ ...prev, scheduledAt }));
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && booking.service && booking.barber && booking.scheduledAt && (
          <StepClientInfo
            slug={slug}
            booking={{
              service: booking.service,
              barber: booking.barber,
              scheduledAt: booking.scheduledAt,
              appointment: booking.appointment,
            }}
            onSuccess={(appointment) => {
              setBooking((prev) => ({ ...prev, appointment }));
              setStep(4);
            }}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && booking.appointment && booking.service && booking.barber && booking.scheduledAt && (
          <StepSuccess
            appointment={booking.appointment}
            service={booking.service}
            barber={booking.barber}
            scheduledAt={booking.scheduledAt}
            shopName={shop?.name ?? "Barbearia"}
            onNewBooking={() => {
              queryClient.invalidateQueries({ queryKey: ['public-slots'] });
              setStep(0);
              setBooking({ service: null, barber: null, scheduledAt: null, appointment: null });
            }}
          />
        )}
      </div>
    </div>
  );
}
