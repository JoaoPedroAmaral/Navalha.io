import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
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
  X,
  Scissors as ScissorsIcon,
  Palette,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { getBilling, getAdminBranding } from '@/api/admin'
import { logout } from '@/api/auth'
import { applyTenantTheme } from '@/lib/applyTenantTheme'
import { differenceInDays, parseISO } from 'date-fns'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/appointments', label: 'Agenda', icon: Calendar },
  { to: '/admin/barbers', label: 'Barbeiros', icon: Users },
  { to: '/admin/services', label: 'Serviços', icon: Scissors },
  { to: '/admin/schedule', label: 'Configurações', icon: Settings },
  { to: '/admin/billing', label: 'Faturamento', icon: CreditCard },
  { to: '/admin/branding', label: 'Aparência', icon: Palette, ownerOnly: true },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const { logout: storeLogout, user } = useAuthStore()

  const { data: billing } = useQuery({
    queryKey: ['billing'],
    queryFn: getBilling,
    refetchInterval: 1000 * 60 * 5,
  })

  const { data: branding } = useQuery({
    queryKey: ['admin-branding'],
    queryFn: getAdminBranding,
    retry: false,
  })

  useEffect(() => {
    if (branding) applyTenantTheme(branding.primaryColor, branding.secondaryColor)
  }, [branding])

  const trialDaysLeft =
    billing && !billing.subscriptionActive && billing.trialEndsAt
      ? differenceInDays(parseISO(billing.trialEndsAt), new Date())
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
    <div className="flex flex-col h-full bg-tenant-primary text-white w-64">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        {branding?.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt="Logo"
            className="w-8 h-8 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-tenant-secondary flex items-center justify-center">
            <ScissorsIcon className="w-4 h-4 text-white" />
          </div>
        )}
        <span className="font-bold text-lg tracking-tight">BarberApp</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems
          .filter((item) => !('ownerOnly' in item && item.ownerOnly) || user?.role === 'OWNER')
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-tenant-secondary text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <div className="px-3 py-2">
          <p className="text-xs text-white/50 uppercase tracking-wide">Conta</p>
          <p className="text-sm text-white/80 truncate">{user?.sub}</p>
          <p className="text-xs text-white/40 capitalize">{user?.role?.toLowerCase()}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col shrink-0">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 flex flex-col h-full">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        {/* Trial banner */}
        {trialDaysLeft !== null && !isTrialExpired && trialDaysLeft >= 0 && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800 text-center">
            {trialDaysLeft === 0
              ? 'Seu trial termina hoje!'
              : `${trialDaysLeft} dias restantes no trial. `}
            <a href="/admin/billing" className="font-semibold underline ml-1">
              Assinar agora
            </a>
          </div>
        )}

        {/* Expired overlay */}
        {isTrialExpired && !billing?.subscriptionActive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Trial expirado</h2>
              <p className="text-gray-500 mb-6">
                Seu período de trial terminou. Assine agora para continuar usando o sistema.
              </p>
              <button
                onClick={() => navigate('/admin/billing')}
                className="w-full bg-tenant-secondary text-white py-3 rounded-lg font-semibold hover:opacity-80 transition-opacity"
              >
                Ver planos
              </button>
            </div>
          </div>
        )}

        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-tenant-primary text-white border-b border-white/10">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold">BarberApp</span>
          <button className="ml-auto" onClick={() => setSidebarOpen(false)}>
            {sidebarOpen && <X className="w-5 h-5" />}
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
