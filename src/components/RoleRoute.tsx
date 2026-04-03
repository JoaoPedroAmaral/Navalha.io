import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { Role } from '@/types'

interface RoleRouteProps {
  children: React.ReactNode
  role: Role
}

export function RoleRoute({ children, role }: RoleRouteProps) {
  const user = useAuthStore((s) => s.user)

  if (!user || user.role !== role) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <>{children}</>
}
