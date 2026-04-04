import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Scissors, Save, Palette } from 'lucide-react'
import { getAdminBranding, updateBranding } from '@/api/admin'
import { applyTenantTheme } from '@/lib/applyTenantTheme'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import { TimeRangeInput } from '@/components/ui/time-range-input'
import { toast } from '@/hooks/useToast'

const DEFAULT_PRIMARY = '#1a1f2e'
const DEFAULT_SECONDARY = '#b5882a'

export default function BrandingPage() {
  const queryClient = useQueryClient()

  const { data: current, isLoading } = useQuery({
    queryKey: ['admin-branding'],
    queryFn: getAdminBranding,
    retry: false,
  })

  const [name, setName] = useState(() => current?.name ?? '')
  const [primaryColor, setPrimaryColor] = useState(
    () => current?.primaryColor ?? DEFAULT_PRIMARY
  )
  const [secondaryColor, setSecondaryColor] = useState(
    () => current?.secondaryColor ?? DEFAULT_SECONDARY
  )
  const [logoUrl, setLogoUrl] = useState(() => current?.logoUrl ?? '')
  const [contactPhone, setContactPhone] = useState(() => current?.contactPhone ?? '')
  const [instagramUrl, setInstagramUrl] = useState(() => current?.instagramUrl ?? '')
  const [mapsUrl, setMapsUrl] = useState(() => current?.mapsUrl ?? '')
  const [openingHours, setOpeningHours] = useState(() => current?.openingHours ?? '')
  const [operationDays, setOperationDays] = useState(() => current?.operationDays ?? '')
  const [hydrated, setHydrated] = useState(false)

  // Hydrate form once server data arrives (runs only on first load)
  useEffect(() => {
    if (current && !hydrated) {
      setHydrated(true)
      setName(current.name ?? '')
      setPrimaryColor(current.primaryColor ?? DEFAULT_PRIMARY)
      setSecondaryColor(current.secondaryColor ?? DEFAULT_SECONDARY)
      setLogoUrl(current.logoUrl ?? '')
      setContactPhone(current.contactPhone ?? '')
      setInstagramUrl(current.instagramUrl ?? '')
      setMapsUrl(current.mapsUrl ?? '')
      setOpeningHours(current.openingHours ?? '')
      setOperationDays(current.operationDays ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  // Apply colors to the actual admin panel in real-time
  useEffect(() => {
    if (primaryColor || secondaryColor) {
      applyTenantTheme(
        primaryColor || DEFAULT_PRIMARY,
        secondaryColor || DEFAULT_SECONDARY,
      )
    }
  }, [primaryColor, secondaryColor])

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
      queryClient.setQueryData(['admin-branding'], {
        name: name || undefined,
        primaryColor: primaryColor || DEFAULT_PRIMARY,
        secondaryColor: secondaryColor || DEFAULT_SECONDARY,
        logoUrl: logoUrl || undefined,
        contactPhone: contactPhone || null,
        instagramUrl: instagramUrl || null,
        mapsUrl: mapsUrl || null,
        openingHours: openingHours || null,
        operationDays: operationDays || null,
      })
      toast({ title: 'Branding salvo com sucesso!' })
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao salvar branding' })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin w-6 h-6 border-2 border-tenant-secondary border-t-transparent rounded-full" />
      </div>
    )
  }

  const effectivePrimary = primaryColor || DEFAULT_PRIMARY
  const effectiveSecondary = secondaryColor || DEFAULT_SECONDARY

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aparência</h1>
        <p className="text-sm text-gray-500 mt-1">
          Personalize as cores e o logo da sua barbearia. As alterações aparecem ao vivo no painel
          e na página de agendamento dos seus clientes.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-xl border p-6 space-y-5">
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <Palette className="w-4 h-4" />
            Configurações
          </div>

          <div className="space-y-1.5">
            <Label>Nome da barbearia</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da sua barbearia"
            />
            <p className="text-xs text-gray-400">Nome exibido na barra lateral e no agendamento.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Cor principal</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={effectivePrimary}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
              />
              <Input
                value={effectivePrimary}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#1a1f2e"
                className="font-mono"
              />
            </div>
            <p className="text-xs text-gray-400">Sidebar e cabeçalhos</p>
          </div>

          <div className="space-y-1.5">
            <Label>Cor de destaque</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={effectiveSecondary}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
              />
              <Input
                value={effectiveSecondary}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder="#b5882a"
                className="font-mono"
              />
            </div>
            <p className="text-xs text-gray-400">Botões, ícones e itens ativos</p>
          </div>

          <div className="space-y-1.5">
            <Label>URL do logo</Label>
            <Input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://cdn.exemplo.com/logo.png"
            />
            <p className="text-xs text-gray-400">
              Imagem quadrada (mín. 64×64px). Deixe vazio para usar o ícone padrão.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Telefone de contato</Label>
            <PhoneInput
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
            <p className="text-xs text-gray-400">Exibido na página de agendamento dos clientes.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Instagram</Label>
            <Input
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/suabarbearia"
            />
            <p className="text-xs text-gray-400">URL completa ou @handle da conta.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Link do Google Maps</Label>
            <Input
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
            />
            <p className="text-xs text-gray-400">Link de localização exibido como "Ver no mapa".</p>
          </div>

          <div className="space-y-1.5">
            <Label>Horário de funcionamento</Label>
            <TimeRangeInput
              value={openingHours}
              onChange={(v) => setOpeningHours(v)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Dias de funcionamento</Label>
            <Input
              value={operationDays}
              onChange={(e) => setOperationDays(e.target.value)}
              placeholder="Segunda a Sábado"
            />
          </div>

          <Button variant="gold" className="w-full" loading={isPending} onClick={() => save()}>
            <Save className="w-4 h-4" />
            Salvar branding
          </Button>
        </div>

        {/* Booking page preview */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Preview — página do cliente</p>

          <div
            className="rounded-xl overflow-hidden border shadow-sm"
            style={
              {
                '--tenant-primary': effectivePrimary,
                '--tenant-secondary': effectiveSecondary,
              } as React.CSSProperties
            }
          >
            {/* Header */}
            <div className="bg-tenant-primary text-white px-4 py-4 flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-9 h-9 rounded-lg object-cover shrink-0"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-tenant-secondary flex items-center justify-center shrink-0">
                  <Scissors className="w-4 h-4 text-white" />
                </div>
              )}
              <div>
                <p className="font-bold text-sm leading-tight">{name || 'Navalha.io'}</p>
                <p className="text-xs opacity-60">Agendamento online</p>
              </div>
            </div>

            {/* Steps */}
            <div className="bg-white border-b px-4 py-3">
              <div className="flex items-center gap-1">
                {['Serviço', 'Barbeiro', 'Data', 'Confirmar'].map((label, idx) => (
                  <div key={label} className="flex items-center flex-1">
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-tenant-secondary text-white' : 'bg-gray-200 text-gray-400'
                        }`}
                        style={
                          idx === 0
                            ? ({ '--tenant-secondary': effectiveSecondary } as React.CSSProperties)
                            : undefined
                        }
                      >
                        {idx + 1}
                      </div>
                      <span className={`text-xs hidden sm:block font-medium ${idx === 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                        {label}
                      </span>
                    </div>
                    {idx < 3 && <div className="flex-1 h-px mx-1 bg-gray-200" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Service cards */}
            <div className="bg-gray-50 px-4 py-4 space-y-2">
              {[
                { name: 'Corte masculino', price: 'R$ 45,00', time: '30 min' },
                { name: 'Barba', price: 'R$ 30,00', time: '20 min' },
              ].map((s) => (
                <div
                  key={s.name}
                  className="bg-white border-2 border-transparent hover:border-tenant-secondary rounded-lg p-3 cursor-pointer transition-all"
                >
                  <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">{s.time}</span>
                    <span className="text-xs font-semibold text-tenant-secondary">{s.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border" style={{ backgroundColor: effectivePrimary }} />
              Principal
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border" style={{ backgroundColor: effectiveSecondary }} />
              Destaque
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
