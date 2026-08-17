import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { CheckInModal } from '@/components/CheckInModal'
import { CheckOutModal } from '@/components/CheckOutModal'
import {
  ArrowRightLeft,
  CheckCircle,
  ArrowUpCircle,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'

export default function Inicio() {
  const navigate = useNavigate()
  const { user, selectedCompany, presenceStatus, currentRecord, performCheckIn, performCheckOut } =
    useApp()

  // Live time and date state
  const [currentDateString, setCurrentDateString] = useState('')
  const [currentTimeString, setCurrentTimeString] = useState('')
  const [elapsedString, setElapsedString] = useState('')

  // Modals state
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [showCheckOutModal, setShowCheckOutModal] = useState(false)
  const [modalCheckInTime, setModalCheckInTime] = useState('')
  const [modalCheckOutData, setModalCheckOutData] = useState({ time: '', duration: '' })
  const [isButtonPressing, setIsButtonPressing] = useState(false)

  // Redirect if no company selected
  useEffect(() => {
    if (!selectedCompany) {
      navigate('/empresas')
    }
  }, [selectedCompany, navigate])

  // Clock updater
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()

      // Format date in PT-BR (e.g. Quarta-feira, 12 de março)
      const rawWeekday = now.toLocaleDateString('pt-BR', { weekday: 'long' })
      const capitalizedWeekday = rawWeekday.charAt(0).toUpperCase() + rawWeekday.slice(1)
      const day = now.getDate()
      const rawMonth = now.toLocaleDateString('pt-BR', { month: 'long' })

      setCurrentDateString(`${capitalizedWeekday}, ${day} de ${rawMonth}`)
      setCurrentTimeString(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      )

      // Elapsed time calculation if checked-in
      if (presenceStatus === 'checked-in' && currentRecord?.checkInTime) {
        const diffMs = now.getTime() - new Date(currentRecord.checkInTime).getTime()
        const totalSecs = Math.max(0, Math.floor(diffMs / 1000))
        const hours = Math.floor(totalSecs / 3600)
        const mins = Math.floor((totalSecs % 3600) / 60)
        const secs = totalSecs % 60

        if (hours > 0) {
          setElapsedString(`${hours}h ${mins < 10 ? '0' : ''}${mins}m`)
        } else if (mins > 0) {
          setElapsedString(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`)
        } else {
          setElapsedString(`${secs}s`)
        }
      }
    }

    updateDateTime()
    const interval = setInterval(updateDateTime, 1000)
    return () => clearInterval(interval)
  }, [presenceStatus, currentRecord])

  const handleAction = () => {
    setIsButtonPressing(true)
    setTimeout(() => setIsButtonPressing(false), 250)

    if (presenceStatus === 'awaiting') {
      const { time } = performCheckIn()
      setModalCheckInTime(time)
      setShowCheckInModal(true)
    } else {
      const { checkOutTime, duration } = performCheckOut()
      setModalCheckOutData({ time: checkOutTime, duration })
      setShowCheckOutModal(true)
    }
  }

  const isCheckedIn = presenceStatus === 'checked-in'

  return (
    <div className="flex-1 flex flex-col justify-between p-5 sm:p-6 bg-slate-50/60 animate-fade-in">
      {/* Top Bar: Greeting + Avatar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Controle de Presença
            </span>
            <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-slate-900">
              Olá, {user.name.split(' ')[0]}!
            </h1>
          </div>

          <button
            type="button"
            onClick={() => navigate('/perfil')}
            className="w-11 h-11 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center ring-2 ring-slate-100 hover:ring-indigo-300 transition-all active:scale-95 shadow-sm"
            title="Abrir perfil"
            aria-label="Perfil do usuário"
          >
            {user.initials}
          </button>
        </div>

        {/* Selected Company Chip */}
        {selectedCompany && (
          <div className="flex items-center justify-between p-2.5 px-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div
                className={`w-7 h-7 rounded-full bg-gradient-to-tr ${selectedCompany.gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}
              >
                {selectedCompany.initial}
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {selectedCompany.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {selectedCompany.city} - {selectedCompany.state}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/empresas')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 px-2.5 py-1.5 rounded-xl transition-colors shrink-0 active:scale-95"
              title="Trocar de empresa"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Trocar</span>
            </button>
          </div>
        )}
      </div>

      {/* Center Zone: Live Date/Clock + Status Pill + Big Action Button */}
      <div className="flex flex-col items-center justify-center text-center my-4 py-2">
        {/* Live Date & Time Display */}
        <div className="mb-4">
          <p className="text-xs sm:text-sm font-medium text-slate-500 mb-0.5">
            {currentDateString}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight tabular-nums">
            {currentTimeString.slice(0, 5)}
            <span className="text-slate-400 text-lg sm:text-xl font-medium">
              :{currentTimeString.slice(6, 8)}
            </span>
          </p>
        </div>

        {/* Status Pill */}
        <div className="mb-6">
          {!isCheckedIn ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm font-semibold transition-all duration-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>Aguardando check-in</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold transition-all duration-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Em atividade</span>
            </div>
          )}
        </div>

        {/* Big Circular Action Button */}
        <div className="relative my-2 flex items-center justify-center">
          <button
            type="button"
            onClick={handleAction}
            className={`w-48 h-48 sm:w-52 sm:h-52 rounded-full flex flex-col items-center justify-center text-white transition-all duration-300 cursor-pointer active:scale-95 ${
              isButtonPressing ? 'scale-95' : ''
            } ${
              !isCheckedIn
                ? 'bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 animate-breathing-indigo shadow-2xl'
                : 'bg-gradient-to-tr from-emerald-700 via-emerald-600 to-emerald-500 animate-breathing-emerald shadow-2xl'
            }`}
            aria-label={!isCheckedIn ? 'Fazer Check-in' : 'Fazer Check-out'}
          >
            {/* Primary Icon inside circle */}
            <div className="mb-2 transition-transform">
              {!isCheckedIn ? (
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                  <CheckCircle className="w-8 h-8 stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                  <ArrowUpCircle className="w-8 h-8 stroke-[2.5]" />
                </div>
              )}
            </div>

            <span className="text-lg sm:text-xl font-black tracking-wider uppercase">
              {!isCheckedIn ? 'FAZER CHECK-IN' : 'FAZER CHECK-OUT'}
            </span>

            <span className="text-[11px] text-white/80 font-medium mt-1">
              {!isCheckedIn ? 'Registrar entrada' : 'Registrar saída'}
            </span>
          </button>
        </div>

        {/* Status explanation line */}
        <div className="mt-5 max-w-[280px]">
          <p className="text-sm font-semibold text-slate-800">
            {!isCheckedIn ? 'Você ainda não realizou o check-in.' : 'Você está presente.'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {!isCheckedIn
              ? 'Toque no botão para registrar sua entrada.'
              : 'Toque no botão quando for encerrar sua jornada.'}
          </p>
        </div>
      </div>

      {/* Bottom Info / Card section */}
      <div className="w-full pb-2">
        {isCheckedIn ? (
          <div className="w-full bg-white rounded-2xl border border-emerald-100 p-3.5 shadow-sm flex items-center justify-between text-left animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Entrada registrada às {currentRecord?.formattedCheckIn || '08:42'}
                </p>
                <p className="text-[11px] text-slate-500 tabular-nums">
                  Tempo decorrido:{' '}
                  <strong className="text-emerald-700 font-bold">{elapsedString || '0h01'}</strong>
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              Presente
            </span>
          </div>
        ) : (
          <div className="w-full bg-white/80 rounded-2xl border border-slate-200/60 p-3 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Sistema pronto para registro rápido</span>
          </div>
        )}
      </div>

      {/* Modals */}
      <CheckInModal
        isOpen={showCheckInModal}
        time={modalCheckInTime}
        companyName={selectedCompany?.name || 'Empresa ABC'}
        onClose={() => setShowCheckInModal(false)}
      />

      <CheckOutModal
        isOpen={showCheckOutModal}
        time={modalCheckOutData.time}
        duration={modalCheckOutData.duration}
        companyName={selectedCompany?.name || 'Empresa ABC'}
        onClose={() => setShowCheckOutModal(false)}
      />
    </div>
  )
}
