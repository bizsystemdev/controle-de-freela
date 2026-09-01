import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { AppLogo } from '@/components/AppLogo'
import {
  Fingerprint,
  Loader2,
  ShieldAlert,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type DialogMode = 'unsupported' | 'mismatch' | 'missing-credential' | null

export default function Autenticar() {
  const navigate = useNavigate()
  const {
    user,
    authState,
    authError,
    authMessage,
    isAuthBusy,
    hasStoredCredential,
    webauthnSupported,
    pendingPhone,
    startBiometricFlow,
    resetAuthError,
    companies,
    selectedCompany,
  } = useApp()

  const [dialogMode, setDialogMode] = useState<DialogMode>(null)

  // If authenticated, route to main flow
  useEffect(() => {
    if (authState === 'authenticated') {
      if (companies.length > 1 && !selectedCompany) {
        navigate('/empresas')
      } else {
        navigate('/inicio')
      }
    } else if (authState === 'needs-phone' || authState === 'unauthenticated') {
      navigate('/acesso')
    }
  }, [authState, companies, selectedCompany, navigate])

  // Surface WebAuthn unsupported / device mismatch / missing credential as a blocking modal.
  useEffect(() => {
    if (!webauthnSupported) {
      setDialogMode('unsupported')
    } else if (authError.includes('Dispositivo não reconhecido')) {
      setDialogMode('mismatch')
    } else if (authError.includes('Credencial não encontrada')) {
      setDialogMode('missing-credential')
    } else {
      setDialogMode(null)
    }
  }, [webauthnSupported, authError])

  const isRegisterFlow = !hasStoredCredential

  const handleAuthenticate = async () => {
    setDialogMode(null)
    resetAuthError()
    await startBiometricFlow()
  }

  const handleBack = () => {
    resetAuthError()
    navigate('/acesso')
  }

  const companyCount = companies.length
  const needsCompanySelection = companyCount > 1 && !selectedCompany

  return (
    <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 bg-gradient-to-b from-white via-white to-indigo-50/30">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full pt-2">
        <AppLogo size="sm" showText />
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar</span>
        </button>
      </div>

      {/* Center: Biometric card */}
      <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
        {/* Animated biometric icon */}
        <div className="relative mb-7 flex items-center justify-center">
          <div className="absolute -inset-3 rounded-full bg-indigo-600/15 blur-xl animate-pulse" />
          <div className="absolute -inset-1 rounded-full border-2 border-indigo-600/20 animate-pulse-ring pointer-events-none" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-600/30">
            {isAuthBusy ? (
              <Loader2 className="w-11 h-11 text-white animate-spin" />
            ) : (
              <Fingerprint className="w-11 h-11 text-white" />
            )}
          </div>
        </div>

        <h1 className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-900 mb-2">
          {isRegisterFlow ? 'Cadastro de autenticação' : 'Autentique-se'}
        </h1>
        <p className="text-base text-slate-500 max-w-[280px] leading-relaxed font-normal mb-1">
          {isRegisterFlow
            ? 'Cadastre a autenticação biométrica do aparelho para acessar o Freela Check sem senha.'
            : 'Autentique-se com biometria ou chave de segurança para continuar'}
        </p>
        {user?.name && <p className="text-sm font-bold text-indigo-600 mb-1">{user.name}</p>}
        {pendingPhone && (
          <p className="text-xs text-slate-400 tabular-nums font-mono">{pendingPhone}</p>
        )}

        {/* Inline non-blocking error */}
        {authError && dialogMode === null && !authError.includes('Dispositivo não reconhecido') && (
          <div className="mt-6 w-full max-w-xs flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 animate-fade-in text-left">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Atenção</p>
              <p className="text-xs text-amber-700 mt-0.5">{authError}</p>
            </div>
          </div>
        )}

        {/* Empty companies notice */}
        {authMessage && (
          <div className="mt-6 w-full max-w-xs flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 animate-fade-in text-left">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Sem vínculos</p>
              <p className="text-xs text-amber-700 mt-0.5">{authMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className="w-full flex flex-col gap-3 pb-2">
        <button
          type="button"
          onClick={handleAuthenticate}
          disabled={isAuthBusy || !webauthnSupported}
          className={`w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 text-white shadow-lg transition-all duration-200 active:scale-[0.98] ${
            isAuthBusy || !webauthnSupported
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none opacity-60'
              : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-600/30 hover:shadow-indigo-600/40 cursor-pointer'
          }`}
        >
          {isAuthBusy ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{isRegisterFlow ? 'Cadastrando...' : 'Autenticando...'}</span>
            </>
          ) : (
            <>
              <Fingerprint className="w-5 h-5" />
              <span>
                {isRegisterFlow ? 'Cadastrar autenticação' : 'Autenticar com dispositivo'}
              </span>
            </>
          )}
        </button>

        <p className="text-center text-[12px] text-slate-400">
          {needsCompanySelection
            ? 'Após autenticar, selecione a empresa de trabalho.'
            : 'Seus dados de autenticação ficam protegidos com segurança.'}
        </p>
      </div>

      {/* Unsupported device modal */}
      <Dialog open={dialogMode === 'unsupported'} onOpenChange={(o) => !o && setDialogMode(null)}>
        <DialogContent className="max-w-xs rounded-3xl p-6 bg-white border border-slate-100">
          <DialogHeader className="text-center sm:text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-slate-900 text-center">
              Dispositivo incompatível
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500 text-center pt-1">
              Seu dispositivo não suporta autenticação biométrica. Tente usar outro dispositivo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
            <button
              type="button"
              onClick={handleBack}
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-sm transition-all"
            >
              Voltar para acesso
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Device mismatch modal */}
      <Dialog open={dialogMode === 'mismatch'} onOpenChange={(o) => !o && setDialogMode(null)}>
        <DialogContent className="max-w-xs rounded-3xl p-6 bg-white border border-slate-100">
          <DialogHeader className="text-center sm:text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-slate-900 text-center">
              Dispositivo não reconhecido
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500 text-center pt-1">
              Dispositivo não reconhecido. Entre em contato com a empresa contratante para liberar o
              acesso neste dispositivo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
            <button
              type="button"
              onClick={handleBack}
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Missing Credential modal */}
      <Dialog
        open={dialogMode === 'missing-credential'}
        onOpenChange={(o) => !o && setDialogMode(null)}
      >
        <DialogContent className="max-w-xs rounded-3xl p-6 bg-white border border-slate-100">
          <DialogHeader className="text-center sm:text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-slate-900 text-center">
              Credencial não encontrada
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500 text-center pt-1">
              Credencial não encontrada neste dispositivo. Se você trocou de aparelho, entre em
              contato com a empresa contratante.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
            <button
              type="button"
              onClick={handleBack}
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
