import React, { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { AppLogo } from '@/components/AppLogo'
import { confirmPasswordReset, requestPasswordReset } from '@/services/auth'
import { useApp } from '@/context/AppContext'
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ArrowLeft,
  Mail,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'

import { loginManager } from '@/services/auth'
import { getCompany } from '@/services/companies'
import pb from '@/lib/pocketbase/client'

export default function AdminPasswordReset() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { restoreManagerSession } = useApp()

  const token = searchParams.get('token') || ''

  // Form states
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isTokenInvalid, setIsTokenInvalid] = useState(!token)

  // Resend request states
  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!token) {
      setFormError('Token de redefinição não encontrado no link.')
      setIsTokenInvalid(true)
      return
    }

    if (password.length < 6) {
      setFormError('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setFormError('As senhas digitadas não coincidem.')
      return
    }

    setSubmitting(true)
    try {
      await confirmPasswordReset(token, password, confirmPassword)
      setSuccess(true)

      // Se o usuário informou o e-mail no formulário, realiza login nativo PocketBase
      if (loginEmail.trim()) {
        try {
          const authRes = await loginManager(loginEmail.trim(), password)
          // Atualiza a sessão no AppContext
          restoreManagerSession(authRes.token, authRes.user)

          // Buscar empresa vinculada para direcionar assertivamente como no convite
          let destination = '/admin'
          try {
            const lm = await pb.collection('license_managers').getList(1, 1, {
              filter: `user_id = "${authRes.user.id}"`,
              expand: 'license_id',
            })
            if (lm.items.length > 0) {
              const lic = lm.items[0].expand?.license_id as { company_id?: string } | undefined
              const companyId = lic?.company_id
              if (companyId) {
                const comp = await getCompany(companyId)
                if (comp) {
                  const isGerenteUser =
                    authRes.user.profile === 'gerente' || authRes.user.role === 'viewer'
                  destination = isGerenteUser
                    ? `/admin/empresa/${comp.id}?tab=freelancers`
                    : `/admin/empresa/${comp.id}`
                }
              }
            }
          } catch {
            // Em caso de falha na busca da empresa, cai no /admin padrão
          }

          setTimeout(() => {
            navigate(destination, { replace: true })
          }, 1500)
          return
        } catch {
          // Se o login automático falhar (ex: e-mail digitado com erro de digitação),
          // a senha já foi redefinida com sucesso; redireciona para a tela de login
        }
      }

      // Caso não tenha informado e-mail ou falhe o auto-login, redireciona para login
      setTimeout(() => {
        navigate('/admin/login', { replace: true })
      }, 2000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao redefinir senha.'
      setFormError(msg)
      if (
        msg.includes('inválido') ||
        msg.includes('expirou') ||
        msg.includes('token') ||
        msg.includes('link')
      ) {
        setIsTokenInvalid(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResendError(null)
    if (!resendEmail.trim()) {
      setResendError('Informe seu e-mail cadastrado.')
      return
    }
    setResendLoading(true)
    try {
      await requestPasswordReset(resendEmail.trim())
      setResendSuccess(true)
    } catch (err) {
      setResendError(err instanceof Error ? err.message : 'Falha ao reenviar solicitação.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <AppLogo size="sm" showText />
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            Recuperação de Acesso
          </span>
        </div>

        {/* Cenário de sucesso */}
        {success ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Senha Alterada com Sucesso!</h2>
              <p className="text-sm text-slate-500 mt-1">
                Sua nova senha foi salva. Redirecionando para o painel...
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/admin/login"
                className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors"
              >
                <span>Ir para o Login</span>
              </Link>
            </div>
          </div>
        ) : isTokenInvalid ? (
          /* Cenário de token inválido ou ausente */
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Link Inválido ou Expirado
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Este link de redefinição de senha não é válido ou já expirou. Você pode solicitar um
                novo link informando seu e-mail abaixo.
              </p>
            </div>

            {resendSuccess ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="text-xs sm:text-sm font-bold text-emerald-900">
                  Novo link enviado com sucesso!
                </p>
                <p className="text-xs text-emerald-700">
                  Verifique sua caixa de entrada e spam para continuar.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResendSubmit} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Seu e-mail cadastrado
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="seu.email@empresa.com"
                      className="w-full h-12 pl-10 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 transition-all"
                    />
                  </div>
                </div>

                {resendError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{resendError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resendLoading}
                  className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando link...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Enviar novo link de redefinição</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center">
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors p-2 rounded-xl hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Login de Gestor</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Cenário com token presente: formulário para definir nova senha */
          <div>
            <div className="mb-6">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Redefinir Senha
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Crie uma nova senha de acesso para sua conta administrativa.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  E-mail da sua conta (opcional para login automático)
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="seu.email@empresa.com"
                    className="w-full h-12 pl-10 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Preencha para entrar automaticamente após definir a nova senha.
                </p>
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
                    <span>Salvando nova senha...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Redefinir Senha e Acessar</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center">
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors p-2 rounded-xl hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Login de Gestor</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
