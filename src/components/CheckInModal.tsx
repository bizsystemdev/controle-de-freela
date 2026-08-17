import React, { useEffect } from 'react'
import { Check } from 'lucide-react'

interface CheckInModalProps {
  isOpen: boolean
  time: string
  companyName: string
  onClose: () => void
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  time,
  companyName,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      onClose()
    }, 2200)
    return () => clearTimeout(timer)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center animate-fade-in-up border border-slate-100">
        {/* Animated Success Checkmark Ring */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-emerald-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                className="opacity-20"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <path d="m8 12 3 3 5-6" className="animate-draw-check" />
            </svg>
          </div>
          <span className="absolute -inset-1 rounded-full border-2 border-emerald-500/30 animate-pulse-ring pointer-events-none" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Check-in realizado!</h2>
        <p className="text-base font-semibold text-emerald-600 mb-1">
          Entrada registrada às {time}
        </p>
        <p className="text-xs text-slate-500 font-medium mb-6">{companyName}</p>

        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>OK</span>
        </button>
      </div>
    </div>
  )
}
