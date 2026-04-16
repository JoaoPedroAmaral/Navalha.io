import { useState, useLayoutEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  Scissors as ScissorsIcon,
  Palette,
  MapPin,
  Phone,
  Clock,
  CalendarDays,
  ExternalLink,
  Package,
} from 'lucide-react'
import { formatPhoneDisplay } from '@/components/ui/phone-input'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { getBilling, getAdminBranding } from '@/api/admin'
import { logout } from '@/api/auth'
import { applyTenantTheme } from '@/lib/applyTenantTheme'
import { differenceInDays } from 'date-fns'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/appointments', label: 'Agenda', icon: Calendar },
  { to: '/admin/barbers', label: 'Funcionarios', icon: Users },
  { to: '/admin/services', label: 'Serviços', icon: Scissors },
  { to: '/admin/products', label: 'Produtos', icon: Package },
  { to: '/admin/schedule', label: 'Configurações', icon: Settings },
  { to: '/admin/billing', label: 'Faturamento', icon: CreditCard },
  { to: '/admin/branding', label: 'Aparência', icon: Palette, ownerOnly: true },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { logout: storeLogout, user } = useAuthStore()

  const { data: billing, isLoading: billingLoading } = useQuery({
    queryKey: ['billing'],
    queryFn: ({ signal }) => getBilling(signal),
    refetchInterval: 1000 * 60 * 5,
  })

  const { data: branding, isLoading: brandingLoading } = useQuery({
    queryKey: ['admin-branding'],
    queryFn: ({ signal }) => getAdminBranding(signal),
    staleTime: 1000 * 60 * 10,
    retry: false,
  })

  useLayoutEffect(() => {
    if (!brandingLoading && branding) {
      applyTenantTheme(branding.primaryColor, branding.secondaryColor)
    }
  }, [branding, brandingLoading])

  if (brandingLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <ScissorsIcon className="w-7 h-7 text-white/30 animate-pulse" />
          </div>
          <p className="text-sm text-white/30 tracking-widest uppercase">Carregando</p>
        </div>
      </div>
    )
  }

  const trialDaysLeft =
    billing && !billing.subscriptionActive && billing.trialEndsAt
      ? differenceInDays(new Date(billing.trialEndsAt), new Date())
      : null

  const isTrialExpired = trialDaysLeft !== null && trialDaysLeft < 0

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // ignore errors on logout
    } finally {
      storeLogout()
      navigate('/admin/login')
    }
  }

  const sidebar = (
    <div className="flex flex-col h-full w-64 sidebar-gradient text-[var(--tenant-text-on-primary)]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[rgb(var(--tenant-text-on-primary-rgb)/0.08)]">
        {branding?.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt="Logo"
            className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-md"
          />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-tenant-secondary flex items-center justify-center shrink-0 shadow-md shadow-tenant-glow">
            <ScissorsIcon className="w-4 h-4 text-[var(--tenant-text-on-primary)]" />
          </div>
        )}
        <div className="min-w-0">
          <span className="font-bold text-base tracking-tight leading-none block truncate">
            {branding?.name || 'Navalha.io'}
          </span>
          <span className="text-[10px] text-[rgb(var(--tenant-text-on-primary-rgb)/0.40)] font-medium tracking-wider uppercase mt-0.5 block">
            Painel admin
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        {navItems
          .filter((item) => !('ownerOnly' in item && item.ownerOnly) || user?.role === 'OWNER')
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'nav-item-active'
                    : 'text-[rgb(var(--tenant-text-on-primary-rgb)/0.65)] hover:bg-[rgb(var(--tenant-text-on-primary-rgb)/0.08)] hover:text-[var(--tenant-text-on-primary)]'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0 opacity-90" />
              {label}
            </NavLink>
          ))}
      </nav>

      {/* Shop Info */}
      {(branding?.contactPhone || branding?.instagramUrl || branding?.mapsUrl || branding?.openingHours || branding?.operationDays) && (
        <div className="px-2.5 py-3 border-t border-[rgb(var(--tenant-text-on-primary-rgb)/0.08)] space-y-1">
          {branding?.contactPhone && (
            <a href={`tel:${branding.contactPhone}`} className="flex items-center gap-2 px-3 py-1.5 text-xs text-[rgb(var(--tenant-text-on-primary-rgb)/0.55)] hover:text-[rgb(var(--tenant-text-on-primary-rgb)/0.90)] transition-colors rounded-md hover:bg-[rgb(var(--tenant-text-on-primary-rgb)/0.05)]">
              <Phone className="w-3 h-3 shrink-0" />
              {formatPhoneDisplay(branding.contactPhone)}
            </a>
          )}
          {branding?.instagramUrl && (
            <a href={branding.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 text-xs text-[rgb(var(--tenant-text-on-primary-rgb)/0.55)] hover:text-[rgb(var(--tenant-text-on-primary-rgb)/0.90)] transition-colors rounded-md hover:bg-[rgb(var(--tenant-text-on-primary-rgb)/0.05)]">
              <ExternalLink className="w-3 h-3 shrink-0" />
              @{branding.instagramUrl.replace(/.*instagram\.com\//, '').replace(/\/$/, '')}
            </a>
          )}
          {branding?.mapsUrl && (
            <a href={branding.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 text-xs text-[rgb(var(--tenant-text-on-primary-rgb)/0.55)] hover:text-[rgb(var(--tenant-text-on-primary-rgb)/0.90)] transition-colors rounded-md hover:bg-[rgb(var(--tenant-text-on-primary-rgb)/0.05)]">
              <MapPin className="w-3 h-3 shrink-0" />
              Ver no mapa
            </a>
          )}
          {branding?.openingHours && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-[rgb(var(--tenant-text-on-primary-rgb)/0.55)]">
              <Clock className="w-3 h-3 shrink-0" />
              <span>{branding.openingHours}</span>
            </div>
          )}
          {branding?.operationDays && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-[rgb(var(--tenant-text-on-primary-rgb)/0.55)]">
              <CalendarDays className="w-3 h-3 shrink-0" />
              <span>{branding.operationDays}</span>
            </div>
          )}
        </div>
      )}

      {/* User + Logout */}
      <div className="px-2.5 py-3 border-t border-[rgb(var(--tenant-text-on-primary-rgb)/0.08)]">
        <div className="px-3 py-2 mb-0.5">
          <p className="text-[10px] text-[rgb(var(--tenant-text-on-primary-rgb)/0.35)] uppercase tracking-widest font-semibold">Conta</p>
          <p className="text-sm text-[rgb(var(--tenant-text-on-primary-rgb)/0.75)] truncate mt-0.5 font-medium">{user?.sub}</p>
          <p className="text-xs text-[rgb(var(--tenant-text-on-primary-rgb)/0.35)] capitalize mt-0.5">{user?.role?.toLowerCase()}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[rgb(var(--tenant-text-on-primary-rgb)/0.55)] hover:bg-[rgb(var(--tenant-text-on-primary-rgb)/0.08)] hover:text-[var(--tenant-text-on-primary)] transition-all duration-150 w-full"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </div>
  )

  const sidebarPlaceholder = (
    <div className="flex flex-col h-full w-64 bg-gray-100 items-center justify-center">
      <ScissorsIcon className="w-6 h-6 text-gray-300 animate-pulse" />
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-tenant-surface">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col shrink-0 shadow-tenant-sm">
        {brandingLoading ? sidebarPlaceholder : sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <aside className="relative flex flex-col h-full shadow-2xl">
            {sidebar}
          </aside>
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        {/* Trial banner */}
        {trialDaysLeft !== null && !isTrialExpired && trialDaysLeft >= 0 && (
          <div className="bg-amber-50 border-b border-amber-200/60 px-4 py-2 text-sm text-amber-800 text-center">
            {trialDaysLeft === 0
              ? 'Seu trial termina hoje!'
              : `${trialDaysLeft} dias restantes no trial.`}
            <a href="/admin/billing" className="font-semibold underline ml-1 hover:text-amber-900">
              Assinar agora
            </a>
          </div>
        )}

        {/* Expired overlay */}
        {!billingLoading && isTrialExpired && !billing?.subscriptionActive && location.pathname !== '/admin/billing' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
                <CreditCard className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Trial expirado</h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Seu período de trial terminou. Assine agora para continuar usando o sistema.
              </p>
              <button
                onClick={() => window.location.href = '/admin/billing'}
                className="w-full bg-tenant-secondary text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm"
              >
                Ver planos
              </button>
            </div>
          </div>
        )}

        {/* Mobile topbar */}
        <div className={cn(
          'md:hidden flex items-center gap-3 px-4 py-3 border-b',
          brandingLoading
            ? 'bg-gray-100 text-gray-300 border-gray-200'
            : 'bg-tenant-primary border-[rgb(var(--tenant-text-on-primary-rgb)/0.10)]'
        )}
          style={brandingLoading ? undefined : { color: 'var(--tenant-text-on-primary)' }}
        >
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Abrir menu"
            disabled={brandingLoading}
            className="p-1 rounded-md hover:bg-[rgb(var(--tenant-text-on-primary-rgb)/0.10)] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          {brandingLoading
            ? <ScissorsIcon className="w-4 h-4 animate-pulse" />
            : <span className="font-semibold text-sm tracking-tight">{branding?.name || 'Navalha.io'}</span>
          }
        </div>

        {/* Page content */}
        <main className="flex-1 p-3 md:p-5 lg:p-6 overflow-x-hidden overflow-y-auto" style={{ background: 'var(--tenant-content-bg)' }}>
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
