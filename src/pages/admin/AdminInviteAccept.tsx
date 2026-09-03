import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { AppLogo } from '@/components/AppLogo'
import { verifyInviteToken, acceptInviteToken, VerifyInviteResponse } from '@/services/auth'
import { useApp } from '@/context/AppContext'
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'

export default function AdminInviteAccept() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { restoreManagerSession } = useApp()

  const token = searchParams.get('token') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteData, setInviteData] = useState<VerifyInviteResponse | null>(null)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Token de convite não encontrado no link. Verifique se o endereço está completo.')
      setLoading(false)
      return
    }

    let isMounted = true
    verifyInviteToken(token)
      .then((data) => {
        if (isMounted) {
          setInviteData(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Falha ao verificar convite.')
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (password.length < 6) {
      setFormError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setFormError('As senhas não coincidem.')
      return
    }

    setSubmitting(true)
    try {
      const res = await acceptInviteToken(token, password)
      setSuccess(true)

      // Atualiza o contexto com o token e dados do usuário
      if (res.token && res.user) {
        restoreManagerSession(res.token, res.user)
      }

      setTimeout(() => {
        navigate('/admin/freelancers')
      }, 2000)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao definir senha.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <AppLogo size="sm" showText />
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            <UserCheck className="w-3.5 h-3.5" />
            Ativação de Gerente
          </span>
        </div>

        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-700">Validando convite...</p>
          </div>
        )}

        {!loading && error && (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Convite Inválido</h2>
              <p className="text-sm text-slate-500 mt-1">{error}</p>
            </div>
            <div className="pt-4">
              <Link
                to="/admin/login"
                className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors"
              >
                <span>Ir para o Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && success && (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Acesso Criado com Sucesso!</h2>
              <p className="text-sm text-slate-500 mt-1">
                Sua senha foi cadastrada. Redirecionando para o painel de Gerente...
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/admin/freelancers"
                className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors"
              >
                <span>Acessar Painel Agora</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && !success && inviteData && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Criar sua Senha
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Olá, <span className="font-bold text-slate-800">{inviteData.user.name}</span>! Você
                foi cadastrado(a) como <span className="font-bold text-indigo-600">Gerente</span>.
                Defina sua senha de acesso abaixo.
              </p>
            </div>

            {/* Empresas vinculadas */}
            {inviteData.companies && inviteData.companies.length > 0 && (
              <div className="mb-6 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  Empresa(s) que você administrará:
                </p>
                <div className="space-y-1.5">
                  {inviteData.companies.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 border border-slate-200/60 flex items-center justify-between"
                    >
                      <span>{c.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {c.city} - {c.state}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  E-mail
                </label>
                <input
                  type="email"
                  disabled
                  value={inviteData.user.email}
                  className="w-full h-12 px-4 bg-slate-100 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nova Senha (mínimo 6 dígitos)
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 pl-10 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Confirmar Nova Senha
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 pl-10 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 transition-all"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando senha...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Ativar Minha Conta</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
