import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLogo } from '@/components/AppLogo'
import { useApp } from '@/context/AppContext'
import { maskBrazilianPhone, isValidBrazilianPhone } from '@/lib/phoneMask'
import { Check, Phone, Loader2, Sparkles, AlertCircle } from 'lucide-react'

export default function Acesso() {
  const navigate = useNavigate()
  const { submitPhone, isAuthBusy, authError, resetAuthError, authState } = useApp()
  const [phone, setPhone] = useState('(11) 98765-4321')
  const [localError, setLocalError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isSubmitting = isAuthBusy
  const isValid = isValidBrazilianPhone(phone)
  const isEmpty = phone.trim().length === 0
  const hasError = !!localError

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Redirect to biometric screen once phone is validated.
  useEffect(() => {
    if (authState === 'needs-biometric') {
      navigate('/autenticar')
    }
  }, [authState, navigate])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value
    const masked = maskBrazilianPhone(rawVal)
    setPhone(masked)
    if (localError) {
      setLocalError('')
    }
    if (authError) {
      resetAuthError()
    }
  }

  const handleFillDemo = (demoPhone = '(11) 98765-4321') => {
    setPhone(demoPhone)
    setLocalError('')
    resetAuthError()
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (isSubmitting) return

    if (isEmpty) {
      setLocalError('Informe seu número de telefone.')
      return
    }
    if (!isValid) {
      setLocalError('Informe um número de telefone válido.')
      return
    }

    setLocalError('')
    await submitPhone(phone)
  }

  const errorMessage = localError || authError

  return (
    <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 bg-white">
      {/* Top Header Section */}
      <div className="flex flex-col items-center sm:items-start pt-2">
        <div className="mb-6 flex items-center justify-between w-full">
          <AppLogo size="sm" />
          <button
            type="button"
            onClick={() => handleFillDemo('(11) 98765-4321')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors active:scale-95"
            title="Preencher com dados de teste"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Modo demonstração</span>
          </button>
        </div>

        <h1 className="text-3xl sm:text-[32px] font-extrabold tracking-tight text-slate-900 mb-2">
          Bem-vindo
        </h1>
        <p className="text-base text-slate-500 font-normal leading-relaxed">
          Informe seu telefone para acessar
        </p>
      </div>

      {/* Main Input Section */}
      <form onSubmit={handleSubmit} className="w-full flex-1 flex flex-col justify-center my-8">
        <div className="w-full space-y-2">
          <label htmlFor="phone-input" className="block text-sm font-semibold text-slate-700">
            Número de telefone
          </label>

          <div
            className={`relative flex items-center rounded-2xl border-2 bg-slate-50/50 transition-all duration-200 ${
              hasError || authError
                ? 'border-rose-500 bg-rose-50/30 animate-shake ring-4 ring-rose-500/10'
                : isValid
                  ? 'border-indigo-600 bg-white ring-4 ring-indigo-600/10'
                  : 'border-slate-200 focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-600/10'
            }`}
          >
            <div className="pl-4 pr-2 text-slate-400 flex items-center justify-center pointer-events-none">
              <Phone
                className={`w-5 h-5 transition-colors ${
                  hasError || authError
                    ? 'text-rose-500'
                    : isValid
                      ? 'text-indigo-600'
                      : 'text-slate-400'
                }`}
              />
            </div>

            <input
              ref={inputRef}
              id="phone-input"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999"
              className="w-full h-14 bg-transparent text-lg sm:text-xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none pr-12 tracking-wide tabular-nums"
            />

            {isValid && !hasError && !authError && (
              <div
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center animate-fade-in shadow-sm shadow-emerald-500/30 pointer-events-none"
                style={{ transform: 'translateY(-50%)' }}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </div>

          {/* Validation Feedback */}
          {errorMessage ? (
            <p className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-rose-600 pt-1 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </p>
          ) : (
            <p className="text-xs text-slate-400 pt-0.5">Digite com DDD (ex: 11 98765-4321)</p>
          )}
        </div>
      </form>

      {/* Bottom Action Section */}
      <div className="w-full flex flex-col gap-3 pb-2">
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isEmpty || isSubmitting}
          className={`w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 text-white shadow-lg transition-all duration-200 active:scale-[0.98] ${
            isEmpty
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none opacity-50'
              : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-indigo-600/30 hover:shadow-indigo-600/40 cursor-pointer'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verificando...</span>
            </>
          ) : (
            <span>Continuar</span>
          )}
        </button>

        <p className="text-center text-[12px] text-slate-400">
          Acesso seguro sem senha. Controle de presença instantâneo.
        </p>
      </div>
    </div>
  )
}
