import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import {
  clearStoredCredential,
  clearDeviceId,
  saveDeviceId,
  getLocalDeviceId,
  getStoredCredentialId,
} from '@/lib/webauthn'
import { getLogs, clearLogs, type LogEntry } from '@/lib/logger'
import {
  Bug,
  X,
  Trash2,
  RefreshCw,
  Clock,
  Building2,
  Fingerprint,
  Phone,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'

export const DebugPanel: React.FC = () => {
  const navigate = useNavigate()
  const {
    presenceStatus,
    selectedCompany,
    user,
    role,
    manager,
    authState,
    hasStoredCredential,
    logout,
  } = useApp()

  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [activeTab, setActiveTab] = useState<'info' | 'actions' | 'logs'>('info')
  const [localDevId, setLocalDevId] = useState<string | null>(null)
  const [localCredId, setLocalCredId] = useState<string | null>(null)

  // 5-tap detection inside top-left 60x60px
  const tapCountRef = useRef(0)
  const lastTapRef = useRef(0)

  const handleGlobalClick = useCallback((e: MouseEvent) => {
    if (e.clientX < 80 && e.clientY < 80) {
      const now = Date.now()
      if (now - lastTapRef.current < 600) {
        tapCountRef.current += 1
      } else {
        tapCountRef.current = 1
      }
      lastTapRef.current = now

      if (tapCountRef.current >= 5) {
        tapCountRef.current = 0
        setIsOpen((prev) => !prev)
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('click', handleGlobalClick)
    return () => window.removeEventListener('click', handleGlobalClick)
  }, [handleGlobalClick])

  useEffect(() => {
    if (isOpen) {
      setLogs(getLogs())
      setLocalDevId(getLocalDeviceId())
      setLocalCredId(getStoredCredentialId())
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClearAuthData = () => {
    clearStoredCredential()
    clearDeviceId()
    logout()
    setLogs(getLogs())
    setLocalDevId(null)
    setLocalCredId(null)
    navigate('/acesso')
  }

  const handleSimulateDeviceMismatch = () => {
    saveDeviceId('mismatch_device_' + Date.now().toString(36))
    setLocalDevId(getLocalDeviceId())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 px-5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">
                Biz Check • Painel Debug
              </h2>
              <p className="text-[10px] text-slate-400">
                Diagnóstico & Testes em tempo de execução
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-700/60 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
              activeTab === 'info'
                ? 'bg-slate-800 text-red-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Estado Atual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('actions')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
              activeTab === 'actions'
                ? 'bg-slate-800 text-red-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ações Rápidas
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('logs')
              setLogs(getLogs())
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
              activeTab === 'logs'
                ? 'bg-slate-800 text-red-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Logs ({logs.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {activeTab === 'info' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Autenticação & Papel
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Papel Ativo:</span>{' '}
                    <strong className="text-red-400">{role || 'Nenhum'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Estado Auth:</span>{' '}
                    <strong className="text-white">{authState}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Usuário:</span>{' '}
                    <strong className="text-white">{user?.name || manager?.name || '--'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Presença:</span>{' '}
                    <strong
                      className={
                        presenceStatus === 'checked-in' ? 'text-emerald-400' : 'text-amber-400'
                      }
                    >
                      {presenceStatus}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1 text-[11px]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Dispositivo WebAuthn
                </p>
                <p>
                  <span className="text-slate-400">Credential ID:</span>{' '}
                  <span className="font-mono text-[10px] text-slate-300">
                    {localCredId ? localCredId.slice(0, 20) + '...' : 'Nenhum'}
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Device ID:</span>{' '}
                  <span className="font-mono text-[10px] text-slate-300">
                    {localDevId || 'Nenhum'}
                  </span>
                </p>
              </div>

              {selectedCompany && (
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1 text-[11px]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Empresa Selecionada
                  </p>
                  <p className="font-bold text-white">{selectedCompany.name}</p>
                  <p className="text-slate-400">{selectedCompany.address}</p>
                  <p className="font-mono text-[10px] text-slate-300">
                    GPS: {selectedCompany.location.lat}, {selectedCompany.location.lng}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  navigate('/admin/login')
                }}
                className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-left flex items-center justify-between text-xs font-semibold"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-red-500" />
                  <span>Ir para Login do Gestor (/admin/login)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  navigate('/acesso')
                }}
                className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-left flex items-center justify-between text-xs font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-400" />
                  <span>Ir para Acesso do Freelancer (/acesso)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={handleSimulateDeviceMismatch}
                className="w-full p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 hover:bg-amber-950/60 text-left flex items-center justify-between text-xs font-semibold text-amber-300"
              >
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-amber-400" />
                  <span>Simular Dispositivo Inválido (Mismatch)</span>
                </div>
                <RefreshCw className="w-4 h-4 text-amber-400" />
              </button>

              <button
                type="button"
                onClick={handleClearAuthData}
                className="w-full p-3 rounded-xl bg-red-950/40 border border-red-800/40 hover:bg-red-950/60 text-left flex items-center justify-between text-xs font-semibold text-red-300"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-red-400" />
                  <span>Limpar Biometria & Resetar Sessão</span>
                </div>
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    clearLogs()
                    setLogs([])
                  }}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar Logs</span>
                </button>
              </div>

              {logs.length === 0 ? (
                <p className="text-slate-500 text-center py-6">Nenhum log registrado ainda.</p>
              ) : (
                <div className="space-y-1.5 font-mono text-[10px]">
                  {logs.slice(0, 30).map((l, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg ${
                        l.level === 'error'
                          ? 'bg-red-950/60 text-red-300 border border-red-800/40'
                          : l.level === 'warn'
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                            : 'bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                        <span className="font-bold uppercase text-red-400">{l.tag}</span>
                        <span>{new Date(l.timestamp).toLocaleTimeString('pt-BR')}</span>
                      </div>
                      <p>{l.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
          <span>Dica: 5 toques no canto superior esquerdo abrem/fecham este painel.</span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white font-bold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
