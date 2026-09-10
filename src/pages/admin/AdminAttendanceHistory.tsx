import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Filter, RefreshCw } from 'lucide-react'
import { AttendanceShiftHistory } from '@/components/admin/AttendanceShiftHistory'
import { PaymentSettingsCard } from '@/components/admin/PaymentSettingsCard'
import { AttendancePhotoSettingsCard } from '@/components/admin/AttendancePhotoSettingsCard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCompany, type CompanyData } from '@/services/companies'
import {
  getCompanyAttendanceHistory,
  getCompanyFreelancers,
  type AdminFreelancer,
  type AttendanceShiftItem,
  type AttendanceShiftStatusFilter,
} from '@/services/admin'

export default function AdminAttendanceHistory() {
  const { id } = useParams<{ id: string }>()
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [history, setHistory] = useState<AttendanceShiftItem[]>([])
  const [freelancers, setFreelancers] = useState<AdminFreelancer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFreelancerId, setSelectedFreelancerId] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState<AttendanceShiftStatusFilter>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [companyData, freelancerList, shifts] = await Promise.all([
        getCompany(id),
        getCompanyFreelancers(id),
        getCompanyAttendanceHistory(id, {
          freelancerId: selectedFreelancerId === 'all' ? undefined : selectedFreelancerId,
          status: selectedStatus,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      ])
      setCompany(companyData)
      setFreelancers(freelancerList)
      setHistory(shifts)
    } finally {
      setLoading(false)
    }
  }, [id, selectedFreelancerId, selectedStatus, startDate, endDate])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const resetFilters = () => {
    setSelectedFreelancerId('all')
    setSelectedStatus('all')
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            to={`/admin/empresa/${id}`}
            className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Painel de {company?.name || 'Empresa'}</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Histórico de Presença
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Turnos consolidados, auditoria de ponto e recebimentos de freelancers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          className="inline-flex items-center gap-1.5 self-start rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </button>
      </div>

      {company && (
        <div className="space-y-4">
          <PaymentSettingsCard
            companyId={company.id}
            enabled={company.paymentControlEnabled}
            baseAmountCents={company.freelancerShiftBaseAmountCents}
            onSaved={(enabled, baseAmountCents) =>
              setCompany((current) =>
                current
                  ? {
                      ...current,
                      paymentControlEnabled: enabled,
                      freelancerShiftBaseAmountCents: baseAmountCents,
                    }
                  : current,
              )
            }
          />
          <AttendancePhotoSettingsCard
            companyId={company.id}
            required={company.attendancePhotoRequired}
            onSaved={(required) =>
              setCompany((current) =>
                current ? { ...current, attendancePhotoRequired: required } : current,
              )
            }
          />
        </div>
      )}

      <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Filtros
            </span>
          </div>
          {(selectedFreelancerId !== 'all' || selectedStatus !== 'all' || startDate || endDate) && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Profissional
            </label>
            <Select value={selectedFreelancerId} onValueChange={setSelectedFreelancerId}>
              <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold">
                <SelectValue placeholder="Todos os freelancers" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-slate-200 bg-white">
                <SelectItem value="all" className="text-xs font-medium">
                  Todos os freelancers
                </SelectItem>
                {freelancers.map((freelancer) => (
                  <SelectItem
                    key={freelancer.id}
                    value={freelancer.id}
                    className="text-xs font-medium"
                  >
                    {freelancer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Situação do turno
            </label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as AttendanceShiftStatusFilter)}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold">
                <SelectValue placeholder="Todos os turnos" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-slate-200 bg-white">
                <SelectItem value="all" className="text-xs">
                  Todos os turnos
                </SelectItem>
                <SelectItem value="open" className="text-xs">
                  Em andamento
                </SelectItem>
                <SelectItem value="completed" className="text-xs">
                  Concluídos
                </SelectItem>
                <SelectItem value="payment_pending" className="text-xs">
                  Recebimento pendente
                </SelectItem>
                <SelectItem value="paid" className="text-xs">
                  Recebimento confirmado
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Data início
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Data fim
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>
        </div>
      </div>

      <AttendanceShiftHistory
        shifts={history}
        loading={loading}
        companyBaseAmountCents={company?.freelancerShiftBaseAmountCents || null}
        onPaymentConfirmed={loadData}
      />
    </div>
  )
}
