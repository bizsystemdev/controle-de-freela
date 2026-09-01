import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { AppLogo } from '@/components/AppLogo'
import { useApp } from '@/context/AppContext'
import {
  Building2,
  Users,
  History,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Shield,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export const AdminLayout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { manager, logout } = useApp()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Extract selected company ID if inside `/admin/empresa/:id/...`
  const companyIdMatch = location.pathname.match(/\/admin\/empresa\/([^/]+)/)
  const currentCompanyId = companyIdMatch ? companyIdMatch[1] : null

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  // Breadcrumbs generator
  const getBreadcrumbs = () => {
    const crumbs = [{ label: 'Dashboard', path: '/admin' }]
    if (currentCompanyId) {
      crumbs.push({ label: 'Empresa', path: `/admin/empresa/${currentCompanyId}` })
      if (location.pathname.includes('/freelancers/novo')) {
        crumbs.push({
          label: 'Freelancers',
          path: `/admin/empresa/${currentCompanyId}?tab=freelancers`,
        })
        crumbs.push({
          label: 'Novo Freelancer',
          path: `/admin/empresa/${currentCompanyId}/freelancers/novo`,
        })
      } else if (location.pathname.includes('/freelancers')) {
        crumbs.push({
          label: 'Freelancers',
          path: `/admin/empresa/${currentCompanyId}?tab=freelancers`,
        })
      } else if (location.pathname.includes('/historico')) {
        crumbs.push({
          label: 'Histórico de Presença',
          path: `/admin/empresa/${currentCompanyId}?tab=historico`,
        })
      }
    }
    return crumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/admin" className="flex items-center gap-2.5">
              <AppLogo size="sm" variant="indigo" />
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight leading-none text-white">
                  Freela <span className="text-indigo-400">Check</span>
                </span>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Painel Administrativo
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-800">
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  location.pathname === '/admin'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Visão Geral
              </Link>

              {currentCompanyId && (
                <>
                  <Link
                    to={`/admin/empresa/${currentCompanyId}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      location.pathname === `/admin/empresa/${currentCompanyId}`
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Painel da Empresa
                  </Link>
                  <Link
                    to={`/admin/empresa/${currentCompanyId}?tab=freelancers`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      location.pathname.includes('/freelancers') ||
                      location.search.includes('tab=freelancers')
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Freelancers
                  </Link>
                  <Link
                    to={`/admin/empresa/${currentCompanyId}?tab=gestores`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      location.search.includes('tab=gestores')
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Gestores
                  </Link>
                  <Link
                    to={`/admin/empresa/${currentCompanyId}?tab=historico`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      location.pathname.includes('/historico') ||
                      location.search.includes('tab=historico')
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Histórico
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* User Menu & Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/acesso"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-colors border border-slate-700"
              title="Abrir aplicativo do Freelancer em nova aba"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>App Freelancer</span>
            </Link>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800 transition-colors focus:outline-none">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                  {manager?.name?.charAt(0) || 'G'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-white truncate max-w-[140px]">
                    {manager?.name || 'Gestor'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">
                    {manager?.email || 'admin@bizcheck.com'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-white rounded-2xl p-1.5 shadow-xl border border-slate-200"
              >
                <DropdownMenuLabel className="px-2 py-1.5">
                  <p className="text-xs font-bold text-slate-900">{manager?.name || 'Gestor'}</p>
                  <p className="text-[11px] text-slate-500 font-normal truncate">
                    {manager?.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate('/admin')}
                  className="rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <Building2 className="w-4 h-4 mr-2 text-slate-500" />
                  <span>Minhas Empresas</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-xl text-xs font-semibold text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2 text-red-600" />
                  <span>Sair do Painel</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-t border-slate-800 p-4 space-y-2 animate-fade-in">
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-900"
            >
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Todas as Empresas</span>
            </Link>
            {currentCompanyId && (
              <>
                <Link
                  to={`/admin/empresa/${currentCompanyId}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-900"
                >
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>Painel da Empresa</span>
                </Link>
                <Link
                  to={`/admin/empresa/${currentCompanyId}?tab=freelancers`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-900"
                >
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>Freelancers</span>
                </Link>
                <Link
                  to={`/admin/empresa/${currentCompanyId}?tab=gestores`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-900"
                >
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span>Gestores</span>
                </Link>
                <Link
                  to={`/admin/empresa/${currentCompanyId}?tab=historico`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-900"
                >
                  <History className="w-4 h-4 text-slate-400" />
                  <span>Histórico de Presença</span>
                </Link>
              </>
            )}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/40"
              >
                <LogOut className="w-4 h-4" />
                <span>Encerrar sessão</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Breadcrumbs Banner */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-slate-500 font-medium overflow-x-auto whitespace-nowrap">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1
            return (
              <React.Fragment key={crumb.path + idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                {isLast ? (
                  <span className="font-bold text-slate-900">{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className="hover:text-indigo-600 transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Admin Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Freela Check • Sistema de Gestão e Controle de Presença</span>
          <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Ambiente Seguro & Sincronizado
          </span>
        </div>
      </footer>
    </div>
  )
}
export default AdminLayout
