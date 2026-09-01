import { useNavigate } from 'react-router-dom'
import { useApp, type Company } from '@/context/AppContext'
import { ChevronRight, CheckCircle2, Building2, AlertTriangle, ArrowLeft } from 'lucide-react'

export default function Empresas() {
  const navigate = useNavigate()
  const { companies, selectedCompany, setSelectedCompany, authMessage } = useApp()

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company)
    navigate('/inicio')
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 bg-slate-50/70">
      {/* Top Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigate('/inicio')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5 active:scale-95 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar</span>
          </button>
        </div>

        <h1 className="text-3xl sm:text-[32px] font-black tracking-tight text-slate-900 mb-2">
          Selecione a empresa
        </h1>
        <p className="text-base text-slate-500 font-normal leading-relaxed mb-6">
          Escolha a unidade onde você realizará o registro de ponto.
        </p>

        {/* Company Cards List */}
        {companies.length > 0 ? (
          <div className="flex flex-col gap-3.5">
            {companies.map((comp) => {
              const isCurrent = selectedCompany?.id === comp.id

              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => handleSelectCompany(comp)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between group active:scale-[0.98] ${
                    isCurrent
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-md shadow-indigo-600/10 ring-2 ring-indigo-600/20'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Company Avatar */}
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${comp.gradient} flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0 transition-transform group-hover:scale-105`}
                    >
                      {comp.initial}
                    </div>

                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-bold text-slate-900 text-base sm:text-lg truncate">
                        {comp.name}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-500 truncate font-normal">
                        {comp.address}, {comp.city} - {comp.state}
                      </span>
                    </div>
                  </div>

                  {/* Right Icon */}
                  <div className="shrink-0 pl-2">
                    {isCurrent ? (
                      <CheckCircle2 className="w-6 h-6 text-indigo-600 fill-indigo-100 animate-fade-in" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm my-6">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4 text-amber-600">
              <AlertTriangle className="w-8 h-8 stroke-[1.8]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhuma empresa vinculada</h3>
            <p className="text-sm text-slate-500 max-w-xs mb-6 font-normal">
              {authMessage ||
                'Nenhuma empresa ativa vinculada ao seu cadastro. Verifique com a empresa contratante.'}
            </p>
            <div className="flex flex-col w-full gap-2">
              <button
                type="button"
                onClick={() => navigate('/acesso')}
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                Voltar para acesso
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-6 pb-2 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs text-slate-400">
          <Building2 className="w-3.5 h-3.5" />
          <span>Freela Check • Vínculos sincronizados</span>
        </div>
      </div>
    </div>
  )
}
