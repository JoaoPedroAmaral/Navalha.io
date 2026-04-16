import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Scissors, Save, Palette, Sparkles } from "lucide-react";
import { getAdminBranding, updateBranding } from "@/api/admin";
import { applyTenantTheme } from "@/lib/applyTenantTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { TimeRangeInput } from "@/components/ui/time-range-input";
import { toast } from "@/hooks/useToast";

const DEFAULT_PRIMARY = "#1a1f2e";
const DEFAULT_SECONDARY = "#b5882a";

export default function BrandingPage() {
  const queryClient = useQueryClient();

  const { data: current, isLoading } = useQuery({
    queryKey: ["admin-branding"],
    queryFn: ({ signal }) => getAdminBranding(signal),
    retry: false,
  });

  const [name, setName] = useState(() => current?.name ?? "");
  const [primaryColor, setPrimaryColor] = useState(
    () => current?.primaryColor ?? DEFAULT_PRIMARY,
  );
  const [secondaryColor, setSecondaryColor] = useState(
    () => current?.secondaryColor ?? DEFAULT_SECONDARY,
  );
  const [logoUrl, setLogoUrl] = useState(() => current?.logoUrl ?? "");
  const [contactPhone, setContactPhone] = useState(
    () => current?.contactPhone ?? "",
  );
  const [instagramUrl, setInstagramUrl] = useState(
    () => current?.instagramUrl ?? "",
  );
  const [mapsUrl, setMapsUrl] = useState(() => current?.mapsUrl ?? "");
  const [openingHours, setOpeningHours] = useState(
    () => current?.openingHours ?? "",
  );
  const [operationDays, setOperationDays] = useState(
    () => current?.operationDays ?? "",
  );
  const [hydrated, setHydrated] = useState(false);

  // Always keep a ref to the latest saved branding so the unmount cleanup
  // can restore the real theme even if `current` changed after mount.
  const savedRef = useRef(current)
  useEffect(() => { savedRef.current = current }, [current])

  // On unmount: revert any unsaved preview colour changes
  useEffect(() => {
    return () => {
      applyTenantTheme(
        savedRef.current?.primaryColor ?? DEFAULT_PRIMARY,
        savedRef.current?.secondaryColor ?? DEFAULT_SECONDARY,
      )
    }
  }, [])

  useEffect(() => {
    if (current && !hydrated) {
      setHydrated(true);
      setName(current.name ?? "");
      setPrimaryColor(current.primaryColor ?? DEFAULT_PRIMARY);
      setSecondaryColor(current.secondaryColor ?? DEFAULT_SECONDARY);
      setLogoUrl(current.logoUrl ?? "");
      setContactPhone(current.contactPhone ?? "");
      setInstagramUrl(current.instagramUrl ?? "");
      setMapsUrl(current.mapsUrl ?? "");
      setOpeningHours(current.openingHours ?? "");
      setOperationDays(current.operationDays ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  useEffect(() => {
    if (primaryColor || secondaryColor) {
      applyTenantTheme(
        primaryColor || DEFAULT_PRIMARY,
        secondaryColor || DEFAULT_SECONDARY,
      );
    }
  }, [primaryColor, secondaryColor]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: () =>
      updateBranding({
        name: name || undefined,
        primaryColor: primaryColor || DEFAULT_PRIMARY,
        secondaryColor: secondaryColor || DEFAULT_SECONDARY,
        logoUrl: logoUrl || undefined,
        contactPhone: contactPhone || undefined,
        instagramUrl: instagramUrl || undefined,
        mapsUrl: mapsUrl || undefined,
        openingHours: openingHours || undefined,
        operationDays: operationDays || undefined,
      }),
    onSuccess: () => {
      queryClient.setQueryData(["admin-branding"], {
        name: name || undefined,
        primaryColor: primaryColor || DEFAULT_PRIMARY,
        secondaryColor: secondaryColor || DEFAULT_SECONDARY,
        logoUrl: logoUrl || undefined,
        contactPhone: contactPhone || null,
        instagramUrl: instagramUrl || null,
        mapsUrl: mapsUrl || null,
        openingHours: openingHours || null,
        operationDays: operationDays || null,
      });
      toast({ title: "Branding salvo com sucesso!" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao salvar branding" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin w-5 h-5 border-2 border-tenant-secondary border-t-transparent rounded-full" />
      </div>
    );
  }

  const effectivePrimary = primaryColor || DEFAULT_PRIMARY;
  const effectiveSecondary = secondaryColor || DEFAULT_SECONDARY;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Aparência</h1>
        <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
          Personalize as cores e o logo da sua barbearia. As alterações aparecem
          ao vivo no painel e na página de agendamento dos clientes.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm">
            <Palette className="w-4 h-4 text-tenant-secondary" />
            Configurações
          </div>

          <div className="space-y-1.5">
            <Label className="text-gray-700">Nome da barbearia</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da sua barbearia"
            />
            <p className="text-xs text-gray-400">
              Exibido na barra lateral e na página de agendamento.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-gray-700">Cor principal</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={effectivePrimary}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 shrink-0"
              />
              <Input
                value={effectivePrimary}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#1a1f2e"
                className="font-mono text-sm"
              />
            </div>
            <p className="text-xs text-gray-400">Sidebar, cabeçalhos e elementos estruturais</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-gray-700">Cor de destaque</Label>
              <button
                type="button"
                onClick={() => applyTenantTheme(effectivePrimary, effectiveSecondary)}
                className="flex items-center gap-1 text-xs text-tenant-secondary hover:opacity-80 transition-opacity font-medium"
              >
                <Sparkles className="w-3 h-3" />
                Derivar da primária
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={effectiveSecondary}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 shrink-0"
              />
              <Input
                value={effectiveSecondary}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder="#b5882a"
                className="font-mono text-sm"
              />
            </div>
            <p className="text-xs text-gray-400">
              Botões, ícones ativos e elementos de destaque
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-gray-700">URL do logo</Label>
            <Input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://cdn.exemplo.com/logo.png"
            />
            <p className="text-xs text-gray-400">
              Imagem quadrada (mín. 64×64px). Deixe vazio para usar o ícone padrão.
            </p>
          </div>

          <div className="pt-1 border-t border-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Contato e localização</p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-gray-700">Telefone de contato</Label>
                <PhoneInput
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-700">Instagram</Label>
                <Input
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/suabarbearia"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-700">Link do Google Maps</Label>
                <Input
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-700">Horário de funcionamento</Label>
                <TimeRangeInput value={openingHours} onChange={(v) => setOpeningHours(v)} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-700">Dias de funcionamento</Label>
                <Input
                  value={operationDays}
                  onChange={(e) => setOperationDays(e.target.value)}
                  placeholder="Segunda a Sábado"
                />
              </div>
            </div>
          </div>

          <Button
            variant="gold"
            className="w-full font-semibold"
            loading={isPending}
            onClick={() => save()}
          >
            <Save className="w-4 h-4" />
            Salvar branding
          </Button>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-700">
            Preview — página do cliente
          </p>

          <div
            className="rounded-xl overflow-hidden border border-gray-100 shadow-md"
            style={
              {
                "--tenant-primary": effectivePrimary,
                "--tenant-secondary": effectiveSecondary,
              } as React.CSSProperties
            }
          >
            {/* Header */}
            <div className="bg-tenant-primary text-white px-4 py-4 flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-9 h-9 rounded-xl object-cover shrink-0 ring-2 ring-white/20"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-tenant-secondary flex items-center justify-center shrink-0">
                  <Scissors className="w-4 h-4 text-white" />
                </div>
              )}
              <div>
                <p className="font-bold text-sm leading-tight">{name || "Navalha.io"}</p>
                <p className="text-xs text-white/50 mt-0.5">Agendamento online</p>
              </div>
            </div>

            {/* Steps */}
            <div className="bg-white border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-1">
                {["Serviço", "Funcionario", "Data", "Confirmar"].map((label, idx) => (
                  <div key={label} className="flex items-center flex-1">
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0
                            ? "bg-tenant-secondary text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span
                        className={`text-xs hidden sm:block font-medium ${
                          idx === 0 ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {idx < 3 && <div className="flex-1 h-px mx-1 bg-gray-100" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Service cards */}
            <div className="bg-gray-50 px-4 py-4 space-y-2">
              {[
                { name: "Corte masculino", price: "R$ 45,00", time: "30 min" },
                { name: "Barba", price: "R$ 30,00", time: "20 min" },
              ].map((s) => (
                <div
                  key={s.name}
                  className="bg-white border-2 border-gray-100 hover:border-tenant-secondary rounded-xl p-3 cursor-pointer transition-all"
                >
                  <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md font-medium">{s.time}</span>
                    <span className="text-xs font-bold text-tenant-secondary">{s.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md border border-gray-200" style={{ backgroundColor: effectivePrimary }} />
              <span>Principal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md border border-gray-200" style={{ backgroundColor: effectiveSecondary }} />
              <span>Destaque</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
