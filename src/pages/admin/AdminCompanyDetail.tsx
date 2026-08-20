import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getCompanyStats,
  getAdminCompanies,
  type CompanyStats,
  type CompanyAdminItem,
} from '@/services/admin'
import { getCompany, type CompanyData } from '@/services/companies'
import {
  Building2,
  Users,
  Clock,
  ArrowUpRight,
  MapPin,
  Loader2,
  CalendarCheck2,
  ArrowLeft,
  History,
  UserPlus,
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

export default function AdminCompanyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [company, setCompany] = useState<CompanyData | null>(null)
  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [allCompanies, setAllCompanies] = useState<CompanyAdminItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      try {
        const [compData, statsData, allComps] = await Promise.all([
          getCompany(id!),
          getCompanyStats(id!),
          getAdminCompanies(),
        ])
        setCompany(compData)
        setStats(statsData)
        setAllCompanies(allComps)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar dados da empresa.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">Carregando painel da empresa...</p>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="bg-red-50 rounded-3xl p-8 border border-red-200 text-center space-y-4">
        <p className="font-bold text-red-700 text-base">{error || 'Empresa não encontrada.'}</p>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Dashboard</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Company Header Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 via-red-700 to-slate-900 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-red-600/20 shrink-0">
            {company.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {company.name}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Ativa
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                {company.endereco}, {company.cidade} - {company.estado}
              </span>
            </p>
          </div>
        </div>

        {/* Change company dropdown */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>Trocar Empresa</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 bg-white rounded-2xl p-1.5 shadow-xl border border-slate-200"
            >
              <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Suas Empresas
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allCompanies.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => navigate(`/admin/empresa/${c.id}`)}
                  className={`rounded-xl text-xs font-semibold cursor-pointer ${
                    c.id === company.id ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-700'
                  }`}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  <span className="truncate">{c.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Voltar ao dashboard geral"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Freelancers */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total de Freelancers
            </p>
            <p className="text-3xl font-black text-slate-900 mt-2 tabular-nums">
              {stats?.totalFreelancers || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">Vinculados a esta unidade</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Check-ins Today */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Check-ins Hoje
            </p>
            <p className="text-3xl font-black text-slate-900 mt-2 tabular-nums">
              {stats?.checkInsToday || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">Registrados nas últimas 24h</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
        </div>

        {/* Currently Open Check-ins */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Check-ins Abertos
            </p>
            <p className="text-3xl font-black text-emerald-600 mt-2 tabular-nums">
              {stats?.openCheckIns || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">Freelancers presentes agora</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Shortcut Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Module 1: Freelancers Management */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Gestão de Freelancers</h3>
                <p className="text-xs text-slate-500">
                  Cadastre novos colaboradores, edite funções e duplique para outras unidades.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-4">
            <Link
              to={`/admin/empresa/${company.id}/freelancers`}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <Users className="w-4 h-4" />
              <span>Ver Lista Completa</span>
            </Link>
            <Link
              to={`/admin/empresa/${company.id}/freelancers/novo`}
              className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo</span>
            </Link>
          </div>
        </div>

        {/* Module 2: Attendance Records & Reports */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Histórico de Ponto</h3>
                <p className="text-xs text-slate-500">
                  Acompanhe registros de entrada/saída com filtros por período e profissional.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <Link
              to={`/admin/empresa/${company.id}/historico`}
              className="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <History className="w-4 h-4" />
              <span>Consultar Histórico Detalhado</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
