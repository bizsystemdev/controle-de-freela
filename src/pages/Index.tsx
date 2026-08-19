import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLogo } from '@/components/AppLogo'
import { useApp } from '@/context/AppContext'

export default function Index() {
  const navigate = useNavigate()
  const { authState } = useApp()
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsFading(true), 1500)

    const route = () => {
      if (authState === 'authenticated') {
        navigate('/inicio')
      } else if (authState === 'needs-biometric') {
        navigate('/autenticar')
      } else {
        navigate('/acesso')
      }
    }

    const navTimer = setTimeout(route, 1800)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(navTimer)
    }
  }, [authState, navigate])

  return (
    <div
      className={`flex-1 flex flex-col items-center justify-between p-8 bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 transition-opacity duration-300 ${
        isFading ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
      }`}
    >
      <div className="w-full flex justify-end">
        <span className="text-xs text-transparent select-none">v1.0</span>
      </div>

      <div className="flex flex-col items-center text-center -mt-8">
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-indigo-500/15 rounded-3xl blur-xl animate-pulse" />
          <AppLogo size="xl" className="relative shadow-2xl shadow-indigo-600/30" />
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Presença</h1>
        <p className="text-base text-slate-500 max-w-[260px] leading-relaxed font-normal">
          Controle de presença simples e rápido
        </p>
      </div>

      <div className="w-full flex flex-col items-center gap-3 pb-6">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce" />
        </div>
        <span className="text-xs font-medium text-slate-400">Iniciando aplicativo...</span>
      </div>
    </div>
  )
}
