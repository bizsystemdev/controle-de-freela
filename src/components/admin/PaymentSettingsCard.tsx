import { useEffect, useState } from 'react'
import { Banknote, Loader2, Save, Trash2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { centsToBRLInput, formatBRLFromCents, parseBRLToCents } from '@/lib/money'
import { updateCompanyPaymentSettings } from '@/services/admin'

interface PaymentSettingsCardProps {
  companyId: string
  enabled: boolean
  baseAmountCents: number | null
  onSaved: (enabled: boolean, baseAmountCents: number | null) => void
}

export function PaymentSettingsCard({
  companyId,
  enabled,
  baseAmountCents,
  onSaved,
}: PaymentSettingsCardProps) {
  const [paymentEnabled, setPaymentEnabled] = useState(enabled)
  const [baseAmount, setBaseAmount] = useState(centsToBRLInput(baseAmountCents))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setPaymentEnabled(enabled)
    setBaseAmount(centsToBRLInput(baseAmountCents))
    setError('')
  }, [companyId, enabled, baseAmountCents])

  const save = async () => {
    const parsedAmount = baseAmount.trim() ? parseBRLToCents(baseAmount) : null
    if (baseAmount.trim() && parsedAmount === null) {
      setError('Informe um valor maior que zero, com no máximo duas casas decimais.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const result = await updateCompanyPaymentSettings(companyId, {
        enabled: paymentEnabled,
        baseAmountCents: parsedAmount,
      })
      onSaved(result.paymentControlEnabled, result.baseAmountCents)
      setBaseAmount(centsToBRLInput(result.baseAmountCents))
      toast({
        title: 'Controle de recebimento atualizado',
        description: result.paymentControlEnabled
          ? `Novos turnos concluídos exigirão confirmação${
              result.baseAmountCents
                ? ` com sugestão de ${formatBRLFromCents(result.baseAmountCents)}`
                : ''
            }.`
          : 'Novos turnos concluídos não exigirão confirmação de recebimento.',
      })
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar configuração',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const changed = paymentEnabled !== enabled || baseAmount !== centsToBRLInput(baseAmountCents)

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Banknote className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Confirmar recebimento de freelancers com valor base
                  </h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                    Solicite a confirmação do valor recebido após cada checkout.
                  </p>
                </div>
                <Switch
                  checked={paymentEnabled}
                  onCheckedChange={setPaymentEnabled}
                  aria-label="Confirmar recebimento de freelancers com valor base"
                />
              </div>
            </div>
          </div>

          <div className="max-w-sm">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Valor base por turno <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={baseAmount}
                  onChange={(event) => {
                    setBaseAmount(event.target.value)
                    setError('')
                  }}
                  placeholder="0,00"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
              {baseAmount && (
                <button
                  type="button"
                  onClick={() => {
                    setBaseAmount('')
                    setError('')
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-red-600"
                  title="Remover valor base"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !changed}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Salvar configuração</span>
        </button>
      </div>
    </div>
  )
}
