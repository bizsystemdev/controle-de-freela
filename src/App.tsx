import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { AppProvider } from './context/AppContext'
import { Toaster } from './components/ui/toaster'
import { Loader2 } from 'lucide-react'

// Core Pages (Freelancer App)
import Index from './pages/Index'
import Acesso from './pages/Acesso'
import Autenticar from './pages/Autenticar'
import Empresas from './pages/Empresas'
import Inicio from './pages/Inicio'
import Perfil from './pages/Perfil'
import NotFound from './pages/NotFound'

// Lazy-Loaded Admin Pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminCompanyDetail = lazy(() => import('./pages/admin/AdminCompanyDetail'))
const AdminFreelancersList = lazy(() => import('./pages/admin/AdminFreelancersList'))
const AdminFreelancerNew = lazy(() => import('./pages/admin/AdminFreelancerNew'))
const AdminAttendanceHistory = lazy(() => import('./pages/admin/AdminAttendanceHistory'))

const AdminSuspenseFallback = () => (
  <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-6">
    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
    <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">
      Carregando Freela Check Admin...
    </p>
  </div>
)

export default function App() {
  return (
    <Router>
      <AppProvider>
        <Routes>
          {/* Main Layout containing both Freelancer Mobile View & Admin Full-width View */}
          <Route element={<Layout />}>
            {/* Freelancer flow */}
            <Route path="/" element={<Index />} />
            <Route path="/acesso" element={<Acesso />} />
            <Route path="/autenticar" element={<Autenticar />} />
            <Route path="/empresas" element={<Empresas />} />
            <Route path="/inicio" element={<Inicio />} />
            <Route path="/perfil" element={<Perfil />} />

            {/* Admin Login */}
            <Route
              path="/admin/login"
              element={
                <Suspense fallback={<AdminSuspenseFallback />}>
                  <AdminLogin />
                </Suspense>
              }
            />

            {/* Admin Integrated Nested Routes with Lazy Loading */}
            <Route
              path="/admin"
              element={
                <Suspense fallback={<AdminSuspenseFallback />}>
                  <AdminLayout />
                </Suspense>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="empresa/:id" element={<AdminCompanyDetail />} />
              <Route path="empresa/:id/freelancers" element={<AdminFreelancersList />} />
              <Route path="empresa/:id/freelancers/novo" element={<AdminFreelancerNew />} />
              <Route path="empresa/:id/historico" element={<AdminAttendanceHistory />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster />
      </AppProvider>
    </Router>
  )
}
