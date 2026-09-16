/* 404 Page - Exibida quando um usuário tenta acessar uma rota inexistente */
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { AppLogo } from '@/components/AppLogo'
import { ArrowLeft, Shield, Smartphone } from 'lucide-react'

const NotFound = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { role, manager, authState } = useApp()

  useEffect(() => {
    console.error('404 Error: Usuário tentou acessar rota inexistente:', location.pathname)
  }, [location.pathname])

  // Identifica se a rota solicitada é do contexto administrativo ou se o usuário logado é gestor/gerente
  const isAdminContext =
    location.pathname.startsWith('/admin') || (authState === 'authenticated' && role === 'manager')
  const isGerente = manager?.profile === 'gerente' || manager?.role === 'viewer'
  const adminHomePath = '/admin'
  const freelancerHomePath = '/'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4 py-8 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-200/80 text-center space-y-6">
        <div className="flex justify-center mb-2">
          <AppLogo size="sm" showText />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 rounded-full border border-amber-200">
            Erro 404
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Página não encontrada
          </h1>
          <p className="text-sm text-slate-500">O endereço acessado não existe ou foi movido.</p>
        </div>

        <div className="pt-2 space-y-3">
          {isAdminContext ? (
            <>
              <Link
                to={adminHomePath}
                className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>
                  {isGerente ? 'Ir para o Painel da Empresa' : 'Ir para o Painel Administrativo'}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar à página anterior</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to={freelancerHomePath}
                className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Ir para a Página Inicial</span>
              </Link>
              <Link
                to="/admin/login"
                className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Acesso Painel Admin / Gestor</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotFound
