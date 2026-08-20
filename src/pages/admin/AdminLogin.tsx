import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppLogo } from '@/components/AppLogo'
import { useApp } from '@/context/AppContext'
import { requestPasswordReset } from '@/services/auth'
import {
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { loginAsManager, isAuthBusy, authError, resetAuthError } = useApp()

  const [email, setEmail] = useState('admin@bizcheck.com')
  const [password, setPassword] = useState('admin123')
  const [localError, setLocalError] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    resetAuthError()

    if (!email.trim() || !password) {
      setLocalError('Preencha seu e-mail e senha de gestor.')
      return
    }

    try {
      await loginAsManager(email.trim(), password)
      navigate('/admin')
    } catch {
      // Error handled by context / authError
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    if (!forgotEmail.trim()) {
      setForgotError('Informe seu e-mail cadastrado.')
      return
    }
    setForgotLoading(true)
    try {
      await requestPasswordReset(forgotEmail.trim())
      setForgotSuccess(true)
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Falha ao solicitar recuperação.')
    } finally {
      setForgotLoading(false)
    }
  }

  const fillAdminDemo = () => {
    setEmail('admin@bizcheck.com')
    setPassword('admin123')
    setLocalError('')
    resetAuthError()
  }

  const errorMessage = localError || authError

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-red-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <AppLogo size="sm" showText />
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            Painel Gestor
          </span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Acesso Administrativo
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Entre com suas credenciais de gestor ou administrador de licença.
          </p>
        </div>

        {/* Demo Fast Fill Pill */}
        <div className="mb-6 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="text-xs">
            <p className="font-bold text-slate-800">Credencial de teste:</p>
            <p className="text-slate-500 font-mono">admin@bizcheck.com / admin123</p>
          </div>
          <button
            type="button"
            onClick={fillAdminDemo}
            className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors active:scale-95"
          >
            Preencher
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              E-mail do gestor
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                className="w-full h-12 pl-10 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-600 focus:bg-white focus:ring-4 focus:ring-red-600/10 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Senha
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email)
                  setForgotSuccess(false)
                  setForgotError('')
                  setForgotOpen(true)
                }}
                className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
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
                className="w-full h-12 pl-10 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-600 focus:bg-white focus:ring-4 focus:ring-red-600/10 transition-all"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-xs font-medium animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isAuthBusy}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isAuthBusy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Entrar no Painel</span>
            )}
          </button>
        </form>

        {/* Return to Freelancer access */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center">
          <Link
            to="/acesso"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors p-2 rounded-xl hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sou freelancer / Acesso por telefone</span>
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-white border border-slate-100">
          <DialogHeader className="text-center sm:text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900 text-center">
              Recuperar senha
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500 text-center pt-1">
              Informe seu e-mail cadastrado para enviarmos as instruções de redefinição.
            </DialogDescription>
          </DialogHeader>

          {forgotSuccess ? (
            <div className="py-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                Instruções enviadas com sucesso!
              </p>
              <p className="text-xs text-slate-500">
                Verifique sua caixa de entrada e spam para redefinir sua senha.
              </p>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="w-full h-11 rounded-xl bg-slate-900 text-white font-bold text-xs mt-3"
              >
                Concluir
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-4 mt-2">
              <div>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="seu.email@empresa.com"
                  className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                />
              </div>

              {forgotError && (
                <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{forgotError}</span>
                </p>
              )}

              <DialogFooter className="flex flex-col gap-2 sm:flex-col">
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2"
                >
                  {forgotLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Enviar instruções'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancelar
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
