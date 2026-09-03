import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLogo } from '@/components/AppLogo'
import { useApp } from '@/context/AppContext'

export default function Index() {
  const navigate = useNavigate()
  const { authState, role } = useApp()
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsFading(true), 1400)

    const route = () => {
      if (authState === 'authenticated') {
        if (role === 'manager') {
          navigate('/admin')
        } else {
          navigate('/inicio')
        }
      } else if (authState === 'needs-biometric') {
        alert('entrou aqui')
        navigate('/autenticar')
      } else if (authState !== 'loading') {
        navigate('/acesso')
      }
    }

    const navTimer = setTimeout(route, 1700)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(navTimer)
    }
  }, [authState, role, navigate])

  return (
    <div
      className={`flex-1 flex flex-col items-center justify-between p-8 bg-gradient-to-b from-white via-slate-50 to-indigo-50/30 transition-opacity duration-300 ${
        isFading ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
      }`}
    >
      <div className="w-full flex justify-end">
        <span className="text-xs text-slate-400 font-semibold tracking-wider select-none">
          v2.0
        </span>
      </div>

      <div className="flex flex-col items-center text-center -mt-8">
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-indigo-600/15 rounded-3xl blur-xl animate-pulse" />
          <AppLogo size="xl" className="relative shadow-2xl shadow-indigo-600/30" />
        </div>

        <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
          Freela <span className="text-indigo-600">Check</span>
        </h1>
        <p className="text-base text-slate-500 max-w-[260px] leading-relaxed font-normal">
          Controle de presença inteligente, simples e seguro
        </p>
      </div>

      <div className="w-full flex flex-col items-center gap-3 pb-6">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce" />
        </div>
        <span className="text-xs font-medium text-slate-400">Iniciando Freela Check...</span>
      </div>
    </div>
  )
}
