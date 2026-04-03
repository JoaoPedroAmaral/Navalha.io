import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { RoleRoute } from '@/components/RoleRoute'
import AdminLayout from '@/pages/admin/AdminLayout'
import LoginPage from '@/pages/admin/LoginPage'
import DashboardPage from '@/pages/admin/DashboardPage'
import AppointmentsPage from '@/pages/admin/AppointmentsPage'
import BarbersPage from '@/pages/admin/BarbersPage'
import ServicesPage from '@/pages/admin/ServicesPage'
import SchedulePage from '@/pages/admin/SchedulePage'
import BillingPage from '@/pages/admin/BillingPage'
import BrandingPage from '@/pages/admin/BrandingPage'
import BookingPage from '@/pages/booking/BookingPage'
import SuperTenantsPage from '@/pages/super/SuperTenantsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public booking */}
        <Route path="/booking/:slug" element={<BookingPage />} />

        {/* Admin auth */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Admin protected */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="barbers" element={<BarbersPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="branding" element={<BrandingPage />} />
        </Route>

        {/* Super admin */}
        <Route
          path="/super/tenants"
          element={
            <ProtectedRoute>
              <RoleRoute role="SUPER_ADMIN">
                <SuperTenantsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}
