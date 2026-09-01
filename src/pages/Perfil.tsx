import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { toast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  LogOut,
  Building2,
  Check,
  ChevronRight,
  Shield,
  Phone,
  Fingerprint,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function Perfil() {
  const navigate = useNavigate()
  const { user, companies, selectedCompany, setSelectedCompany, logout, authState } = useApp()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  // Guard: bounce to access if not authenticated.
  if (authState !== 'authenticated') {
    navigate('/acesso')
  }

  const handleLogoutConfirm = () => {
    logout()
    setShowLogoutDialog(false)
    toast({
      title: 'Sessão encerrada.',
      description: 'Você saiu da sua conta com segurança.',
      duration: 3000,
    })
    navigate('/acesso')
  }

  const handleSelectCompanyDirect = (comp: typeof selectedCompany) => {
    if (comp) {
      setSelectedCompany(comp)
      toast({
        title: 'Empresa alterada',
        description: `Ambiente ativo: ${comp.name}`,
        duration: 2000,
      })
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 bg-slate-50/70">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate('/inicio')}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors active:scale-95 shadow-sm"
            aria-label="Voltar para tela inicial"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
              Freela Check
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Perfil
            </h1>
          </div>
        </div>

        {/* User Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            {user?.initials || 'U'}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">{user?.name || 'Usuário'}</h2>
            <p className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span className="tabular-nums font-mono">{user?.maskedPhone || ''}</span>
            </p>
            <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              <Shield className="w-3 h-3" />
              Freelancer Verificado
            </span>
          </div>
        </div>

        {/* Section: Linked Companies */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Empresas vinculadas
            </h3>
            <button
              type="button"
              onClick={() => navigate('/empresas')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              Trocar empresa
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {companies.map((comp) => {
              const isSelected = selectedCompany?.id === comp.id

              return (
                <div
                  key={comp.id}
                  onClick={() => handleSelectCompanyDirect(comp)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/15 shadow-sm'
                      : 'bg-white/70 hover:bg-white border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${comp.gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                    >
                      {comp.initial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{comp.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {comp.city} - {comp.state}
                      </p>
                    </div>
                  </div>

                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                      Selecionada
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Section: Menu / Actions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Swap Company Option */}
          <button
            type="button"
            onClick={() => navigate('/empresas')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors border-b border-slate-100 active:bg-slate-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Trocar de empresa</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Device security info */}
          <div className="w-full p-4 flex items-center justify-between text-left border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Fingerprint className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Autenticação do aparelho</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              Ativa & Protegida
            </span>
          </div>

          {/* Logout Option */}
          <button
            type="button"
            onClick={() => setShowLogoutDialog(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-red-50/50 transition-colors active:bg-red-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-red-600">Sair da conta</span>
            </div>
            <ChevronRight className="w-4 h-4 text-red-300" />
          </button>
        </div>
      </div>

      {/* Footer Version Info */}
      <div className="text-center pt-6 pb-2">
        <p className="text-xs text-slate-400 font-medium">Freela Check • Versão 2.0.0</p>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="max-w-xs rounded-3xl p-6 bg-white border border-slate-100">
          <DialogHeader className="text-center sm:text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-slate-900 text-center">
              Sair do Freela Check?
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500 text-center pt-1">
              Sua sessão será encerrada e você precisará confirmar seu telefone novamente no próximo
              acesso.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
            <button
              type="button"
              onClick={handleLogoutConfirm}
              className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-red-600/20 transition-all flex items-center justify-center"
            >
              Sim, sair agora
            </button>
            <button
              type="button"
              onClick={() => setShowLogoutDialog(false)}
              className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
            >
              Cancelar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
