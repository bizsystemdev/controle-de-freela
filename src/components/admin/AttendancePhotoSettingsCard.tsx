import { useEffect, useState } from 'react'
import { Camera, Loader2, Save } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { updateCompanyPhotoSettings } from '@/services/admin'

interface AttendancePhotoSettingsCardProps {
  companyId: string
  required: boolean
  onSaved: (required: boolean) => void
}

export function AttendancePhotoSettingsCard({
  companyId,
  required,
  onSaved,
}: AttendancePhotoSettingsCardProps) {
  const [photoRequired, setPhotoRequired] = useState(required)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setPhotoRequired(required)
  }, [companyId, required])

  const save = async () => {
    setSaving(true)
    try {
      const result = await updateCompanyPhotoSettings(companyId, photoRequired)
      onSaved(result.attendancePhotoRequired)
      toast({
        title: 'Exigência de fotografia atualizada',
        description: result.attendancePhotoRequired
          ? 'Novos check-ins e checkouts feitos pelo freelancer exigirão uma foto tirada no momento.'
          : 'O fluxo de ponto continuará sem exigir fotografia.',
      })
    } catch (error: unknown) {
      toast({
        title: 'Erro ao salvar configuração',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-start gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Exigir foto no check-in e check-out
                </h3>
                <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-500">
                  Após validar a localização, o freelancer deverá tirar e confirmar uma nova foto
                  pela câmera em cada registro.
                </p>
              </div>
              <Switch
                checked={photoRequired}
                onCheckedChange={setPhotoRequired}
                aria-label="Exigir foto no check-in e check-out"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || photoRequired === required}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar configuração
        </button>
      </div>
    </div>
  )
}
