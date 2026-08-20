import React from 'react'
import { MapPin, MapPinOff, RefreshCw } from 'lucide-react'

interface LocationMismatchModalProps {
  isOpen: boolean
  message: string
  onRetry: () => void
  onCancel?: () => void
}

export const LocationMismatchModal: React.FC<LocationMismatchModalProps> = ({
  isOpen,
  message,
  onRetry,
  onCancel,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center animate-fade-in-up border border-slate-100">
        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
            <MapPinOff className="w-10 h-10 text-amber-500" />
          </div>
          <span className="absolute -inset-1 rounded-full border-2 border-amber-500/30 animate-pulse-ring pointer-events-none" />
        </div>

        <h2 className="text-xl font-black text-slate-900 mb-1">Fora do local</h2>
        <p className="text-sm text-slate-500 font-medium mb-6">{message}</p>

        <button
          type="button"
          onClick={onRetry}
          className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-1.5 mb-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Tentar novamente</span>
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
          >
            Cancelar
          </button>
        )}

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <MapPin className="w-3 h-3" />
          <span>Biz Check validação por raio de tolerância</span>
        </div>
      </div>
    </div>
  )
}
