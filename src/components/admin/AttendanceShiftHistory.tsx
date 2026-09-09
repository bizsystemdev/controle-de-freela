import { useState } from 'react'
import { AlertCircle, Banknote, CheckCircle2, Clock3, History, Loader2, MapPin } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { centsToBRLInput, formatBRLFromCents, parseBRLToCents } from '@/lib/money'
import { confirmShiftPayment, type AttendanceShiftItem } from '@/services/admin'

interface AttendanceShiftHistoryProps {
  shifts: AttendanceShiftItem[]
  loading: boolean
  companyBaseAmountCents: number | null
  onPaymentConfirmed: () => Promise<void> | void
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(shift: AttendanceShiftItem): string | null {
  if (!shift.checkIn || !shift.checkOut) return null
  const minutes = Math.max(
    0,
    Math.floor(
      (new Date(shift.checkOut.timestamp).getTime() - new Date(shift.checkIn.timestamp).getTime()) /
        60000,
    ),
  )
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return hours ? `${hours}h${String(remaining).padStart(2, '0')}` : `${minutes} min`
}

function EventLocation({ label, event }: { label: string; event: AttendanceShiftItem['checkIn'] }) {
  if (!event) return null
  const hasCoordinates =
    event.lat !== null &&
    event.lat !== undefined &&
    event.lng !== null &&
    event.lng !== undefined &&
    (event.lat !== 0 || event.lng !== 0)

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
      <span className="font-bold uppercase text-slate-400">{label}</span>
      {hasCoordinates ? (
        <span className="inline-flex items-center gap-1 font-mono">
          <MapPin className="h-3 w-3 text-indigo-500" />
          {Number(event.lat).toFixed(4)}, {Number(event.lng).toFixed(4)}
        </span>
      ) : (
        <span>{event.manual ? 'Manual (sem GPS)' : 'Dispositivo (sem GPS)'}</span>
      )}
      {event.manual && (
        <span className="rounded bg-amber-50 px-1.5 py-0.5 font-bold uppercase text-amber-700">
          Manual
        </span>
      )}
    </div>
  )
}

export function AttendanceShiftHistory({
  shifts,
  loading,
  companyBaseAmountCents,
  onPaymentConfirmed,
}: AttendanceShiftHistoryProps) {
  const [selectedShift, setSelectedShift] = useState<AttendanceShiftItem | null>(null)
  const [amount, setAmount] = useState('')
  const [amountError, setAmountError] = useState('')
  const [confirming, setConfirming] = useState(false)

  const openConfirmation = (shift: AttendanceShiftItem) => {
    setSelectedShift(shift)
    setAmount(centsToBRLInput(companyBaseAmountCents))
    setAmountError('')
  }

  const confirm = async () => {
    if (!selectedShift?.checkInId || confirming) return
    const amountCents = parseBRLToCents(amount)
    if (amountCents === null) {
      setAmountError('Informe um valor recebido válido e maior que zero.')
      return
    }

    setConfirming(true)
    setAmountError('')
    try {
      await confirmShiftPayment(selectedShift.checkInId, amountCents)
      setSelectedShift(null)
      toast({
        title: 'Recebimento confirmado',
        description: `${formatBRLFromCents(amountCents)} registrado para o turno de ${selectedShift.freelancerName}.`,
      })
      await onPaymentConfirmed()
    } catch (err: unknown) {
      toast({
        title: 'Não foi possível confirmar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
      await onPaymentConfirmed()
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-16 text-center shadow-sm">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-semibold text-slate-700">Carregando turnos...</p>
      </div>
    )
  }

  if (shifts.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
        <History className="mx-auto mb-3 h-12 w-12 text-slate-300" />
        <h3 className="text-base font-bold text-slate-900">Nenhum turno encontrado</h3>
        <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
          Não foram localizados turnos com os filtros atuais.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-xs">
            <thead className="border-b border-slate-200/80 bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Freelancer</th>
                <th className="px-4 py-3.5">Empresa / Data</th>
                <th className="px-4 py-3.5">Horários</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Registro</th>
                <th className="px-5 py-3.5">Recebimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shifts.map((shift) => {
                const referenceTimestamp =
                  shift.checkIn?.timestamp || shift.checkOut?.timestamp || new Date().toISOString()
                const duration = formatDuration(shift)
                const pendingPayment =
                  shift.status === 'completed' && shift.paymentRequired && !shift.paymentConfirmed

                return (
                  <tr key={shift.id} className="align-top transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                          {shift.freelancerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{shift.freelancerName}</p>
                          <p className="font-mono text-[11px] text-slate-400">
                            {shift.freelancerPhone || shift.freelancerRoleTitle || 'Sem contato'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-800">{shift.companyName}</p>
                      <p className="mt-1 font-mono text-[11px] text-slate-500">
                        {formatDate(referenceTimestamp)}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-mono">
                      <div className="space-y-1">
                        <p className="text-emerald-700">
                          <span className="mr-1 font-sans text-[10px] font-bold uppercase">
                            Entrada
                          </span>
                          {shift.checkIn ? formatTime(shift.checkIn.timestamp) : '—'}
                        </p>
                        <p className="text-red-700">
                          <span className="mr-1 font-sans text-[10px] font-bold uppercase">
                            Saída
                          </span>
                          {shift.checkOut ? formatTime(shift.checkOut.timestamp) : '—'}
                        </p>
                        {duration && (
                          <p className="text-[10px] text-slate-400">Duração {duration}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {shift.status === 'open' ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                          <Clock3 className="h-3.5 w-3.5" /> Em andamento
                        </span>
                      ) : shift.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Concluído
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">
                          <AlertCircle className="h-3.5 w-3.5" /> Evento órfão
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1.5">
                        <EventLocation label="Entrada" event={shift.checkIn} />
                        <EventLocation label="Saída" event={shift.checkOut} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {shift.paymentConfirmed && shift.receivedAmountCents !== null ? (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            <Banknote className="h-3.5 w-3.5" />
                            {formatBRLFromCents(shift.receivedAmountCents)} confirmado
                          </span>
                          {shift.paymentConfirmedAt && (
                            <p className="mt-1 text-[10px] text-slate-400">
                              {formatDate(shift.paymentConfirmedAt)} às{' '}
                              {formatTime(shift.paymentConfirmedAt)}
                              {shift.paymentConfirmedByName
                                ? ` por ${shift.paymentConfirmedByName}`
                                : ''}
                            </p>
                          )}
                        </div>
                      ) : pendingPayment ? (
                        <div className="space-y-2">
                          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                            Pendente
                          </span>
                          <button
                            type="button"
                            onClick={() => openConfirmation(shift)}
                            className="block rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700"
                          >
                            Confirmar valor
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] italic text-slate-400">Não solicitado</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={Boolean(selectedShift)}
        onOpenChange={(open) => !open && setSelectedShift(null)}
      >
        <DialogContent className="max-w-sm rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Banknote className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-xl font-black text-slate-900">
              Confirmar recebimento
            </DialogTitle>
            <DialogDescription className="pt-1 text-center text-xs leading-relaxed text-slate-600">
              Registre o valor efetivamente recebido por{' '}
              <strong className="text-slate-900">{selectedShift?.freelancerName}</strong> neste
              turno. A confirmação não poderá ser repetida.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Valor recebido
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                R$
              </span>
              <input
                autoFocus
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value)
                  setAmountError('')
                }}
                placeholder="0,00"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-3 text-base font-bold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
            {amountError && <p className="mt-1 text-xs font-medium text-red-600">{amountError}</p>}
            {companyBaseAmountCents && (
              <p className="mt-1 text-[10px] text-slate-400">
                Valor base atual: {formatBRLFromCents(companyBaseAmountCents)}. Você pode alterá-lo
                para este turno.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setSelectedShift(null)}
              disabled={confirming}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void confirm()}
              disabled={confirming}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {confirming && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar recebimento
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
