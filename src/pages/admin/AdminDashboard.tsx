import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { getAdminCompanies, type CompanyAdminItem } from '@/services/admin'
import {
  Building2,
  Users,
  Clock,
  ChevronRight,
  MapPin,
  Loader2,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { manager, authState, role } = useApp()
  const [companies, setCompanies] = useState<CompanyAdminItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Protect admin route
  useEffect(() => {
    if (authState === 'unauthenticated' || role !== 'manager') {
      // Check if PB has auth
      const token = localStorage.getItem('pocketbase_auth')
      if (!token && authState !== 'loading') {
        navigate('/admin/login')
      }
    }
  }, [authState, role, navigate])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getAdminCompanies(manager?.id)
        setCompanies(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar empresas.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [manager?.id])

  const totalFreelancersAll = companies.reduce((acc, c) => acc + (c.freelancersCount || 0), 0)

  const formatLastCheckIn = (isoString?: string | null) => {
    if (!isoString) return 'Nenhum registro recente'
    const d = new Date(isoString)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600/30 text-red-300 border border-red-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Visão Geral do Gestor
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Olá, {manager?.name || 'Administrador'}!
          </h1>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
            Bem-vindo ao Biz Check Admin. Gerencie as empresas, freelancers vinculados e acompanhe
            registros de presença em tempo real.
          </p>
        </div>

        {/* Quick summary cards inside banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-700/60 relative z-10">
          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60">
            <p className="text-xs text-slate-400 font-medium">Empresas Gerenciadas</p>
            <p className="text-2xl font-black text-white mt-1 tabular-nums">{companies.length}</p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60">
            <p className="text-xs text-slate-400 font-medium">Total de Freelancers</p>
            <p className="text-2xl font-black text-white mt-1 tabular-nums">
              {totalFreelancersAll}
            </p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60 col-span-2 sm:col-span-1">
            <p className="text-xs text-slate-400 font-medium">Status do Sistema</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400">Online & Ativo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Companies List Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Empresas sob sua gestão
            </h2>
            <p className="text-xs text-slate-500">
              Selecione uma empresa para acessar os freelancers e o histórico completo de presenças.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-700">Carregando empresas...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-2xl p-6 border border-red-200 text-center text-red-700">
            <p className="font-bold text-sm">{error}</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Nenhuma empresa associada</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Sua conta ainda não possui licenças vinculadas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((comp) => (
              <div
                key={comp.id}
                onClick={() => navigate(`/admin/empresa/${comp.id}`)}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 hover:border-red-500/50 hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 via-red-700 to-slate-900 text-white font-black text-lg flex items-center justify-center shadow-md shadow-red-600/20 group-hover:scale-105 transition-transform">
                        {comp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-red-600 transition-colors">
                          {comp.name}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {comp.city} - {comp.state}
                          </span>
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {comp.license?.plan || 'PRO'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1 mb-4 font-normal">
                    {comp.address}
                  </p>
                </div>

                {/* Footer Metrics in Card */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                      <Users className="w-4 h-4 text-red-600" />
                      <span>{comp.freelancersCount} freelancers</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[150px]">
                        {formatLastCheckIn(comp.lastCheckIn)}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 group-hover:translate-x-1 transition-transform">
                    <span>Gerenciar</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
