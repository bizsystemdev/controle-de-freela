import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getCompanyAttendanceHistory,
  getCompanyFreelancers,
  type AttendanceHistoryItem,
  type AdminFreelancer,
} from '@/services/admin'
import { getCompany, type CompanyData } from '@/services/companies'
import {
  History,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  User,
  MapPin,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Search,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function AdminAttendanceHistory() {
  const { id } = useParams<{ id: string }>()

  const [company, setCompany] = useState<CompanyData | null>(null)
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([])
  const [freelancers, setFreelancers] = useState<AdminFreelancer[]>([])
  const [loading, setLoading] = useState(true)

  // Filter States
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<'all' | 'check_in' | 'check_out'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [compData, flList, hist] = await Promise.all([
        getCompany(id!),
        getCompanyFreelancers(id!),
        getCompanyAttendanceHistory(id!, {
          freelancerId: selectedFreelancerId === 'all' ? undefined : selectedFreelancerId,
          type: selectedType,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      ])
      setCompany(compData)
      setFreelancers(flList)
      setHistory(hist)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [id, selectedFreelancerId, selectedType, startDate, endDate])

  const handleResetFilters = () => {
    setSelectedFreelancerId('all')
    setSelectedType('all')
    setStartDate('')
    setEndDate('')
  }

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString)
    return {
      date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/admin/empresa/${id}`}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Painel de {company?.name || 'Empresa'}</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Histórico de Presença
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de ponto eletrônico auditável de todos os freelancers desta unidade.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Filter Controls Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-red-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Filtros de Consulta
            </span>
          </div>

          {(selectedFreelancerId !== 'all' || selectedType !== 'all' || startDate || endDate) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-red-600 hover:text-red-700"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Freelancer Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Profissional
            </label>
            <Select value={selectedFreelancerId} onValueChange={setSelectedFreelancerId}>
              <SelectTrigger className="w-full h-10 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold">
                <SelectValue placeholder="Todos os freelancers" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-2xl border border-slate-200">
                <SelectItem value="all" className="text-xs font-medium cursor-pointer">
                  Todos os freelancers
                </SelectItem>
                {freelancers.map((fl) => (
                  <SelectItem
                    key={fl.id}
                    value={fl.id}
                    className="text-xs font-medium cursor-pointer"
                  >
                    {fl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Tipo de Registro
            </label>
            <Select
              value={selectedType}
              onValueChange={(v) => setSelectedType(v as 'all' | 'check_in' | 'check_out')}
            >
              <SelectTrigger className="w-full h-10 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold">
                <SelectValue placeholder="Entradas e Saídas" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-2xl border border-slate-200">
                <SelectItem value="all" className="text-xs font-medium cursor-pointer">
                  Ambos (Entradas e Saídas)
                </SelectItem>
                <SelectItem value="check_in" className="text-xs font-medium cursor-pointer">
                  Apenas Check-in (Entrada)
                </SelectItem>
                <SelectItem value="check_out" className="text-xs font-medium cursor-pointer">
                  Apenas Check-out (Saída)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* History Table */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-700">
            Carregando registros de presença...
          </p>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Nenhum registro encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Não foram localizados pontos com os critérios selecionados.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Freelancer</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4">Data e Hora</th>
                  <th className="py-3.5 px-4 sm:px-6">Localização (GPS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((record) => {
                  const { date, time } = formatDateTime(record.timestamp)
                  const isCheckIn = record.type === 'check_in'

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Freelancer Name */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {record.freelancerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                              {record.freelancerName}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {record.freelancerPhone || record.freelancerRoleTitle || ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type Pill (Check-in = Green, Check-out = Red) */}
                      <td className="py-4 px-4">
                        {isCheckIn ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>Check-in (Entrada)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Check-out (Saída)</span>
                          </span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-4 font-mono text-slate-700">
                        <span className="font-bold text-slate-900">{date}</span>
                        <span className="text-slate-400 ml-2 font-medium">{time}</span>
                      </td>

                      {/* Coords */}
                      <td className="py-4 px-4 sm:px-6 text-slate-600">
                        {record.lat && record.lng ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 px-2 py-1 rounded-lg text-slate-700">
                            <MapPin className="w-3 h-3 text-red-600" />
                            {record.lat.toFixed(4)}, {record.lng.toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Dispositivo</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
