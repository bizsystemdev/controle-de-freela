import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { createFreelancer } from '@/services/admin'
import { getCompany, type CompanyData } from '@/services/companies'
import { maskBrazilianPhone, isValidBrazilianPhone } from '@/lib/phoneMask'
import { toast } from '@/hooks/use-toast'
import {
  UserPlus,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Phone,
  User,
  Mail,
  FileText,
  Briefcase,
} from 'lucide-react'

export default function AdminFreelancerNew() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [company, setCompany] = useState<CompanyData | null>(null)
  const [loadingCompany, setLoadingCompany] = useState(true)

  // Form fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [document, setDocument] = useState('')
  const [roleTitle, setRoleTitle] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        const comp = await getCompany(id!)
        setCompany(comp)
      } catch {
        toast({
          title: 'Empresa não encontrada',
          variant: 'destructive',
        })
      } finally {
        setLoadingCompany(false)
      }
    }
    void load()
  }, [id])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskBrazilianPhone(e.target.value)
    setPhone(masked)
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    const newErrors: Record<string, string> = {}
    if (!name.trim()) {
      newErrors.name = 'Nome completo é obrigatório.'
    }
    if (!phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório.'
    } else if (!isValidBrazilianPhone(phone)) {
      newErrors.phone = 'Informe um telefone celular válido com DDD.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await createFreelancer({
        companyId: id,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        document: document.trim() || undefined,
        roleTitle: roleTitle.trim() || undefined,
      })

      toast({
        title: 'Freelancer cadastrado com sucesso!',
        description: `${name} foi vinculado à empresa ${company?.name}.`,
      })
      navigate(`/admin/empresa/${id}?tab=freelancers`)
    } catch (err) {
      toast({
        title: 'Erro ao cadastrar freelancer',
        description: err instanceof Error ? err.message : 'Falha na operação.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          to={`/admin/empresa/${id}?tab=freelancers`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para lista de freelancers</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Novo Freelancer
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Cadastre um profissional para atuar na unidade <strong>{company?.name || '...'}</strong>.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome (Obrigatório) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Nome completo <span className="text-red-600">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
                }}
                placeholder="Ex: João Silva de Souza"
                className={`w-full h-12 pl-10 pr-4 bg-slate-50 rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
                  errors.name
                    ? 'border-red-500 focus:border-indigo-600 ring-2 ring-red-500/10'
                    : 'border-slate-200 focus:border-indigo-600'
                }`}
              />
            </div>
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Telefone (Obrigatório, máscara brasileira) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Telefone Celular <span className="text-red-600">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                inputMode="numeric"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                className={`w-full h-12 pl-10 pr-4 bg-slate-50 rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all font-mono tabular-nums ${
                  errors.phone
                    ? 'border-red-500 focus:border-indigo-600 ring-2 ring-red-500/10'
                    : 'border-slate-200 focus:border-indigo-600'
                }`}
              />
            </div>
            {errors.phone ? (
              <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                O freelancer utilizará este número para acessar o aplicativo.
              </p>
            )}
          </div>

          {/* Cargo / Função (Opcional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Cargo / Função{' '}
              <span className="text-slate-400 font-normal text-[11px]">(opcional)</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                <Briefcase className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="Ex: Garçom, Barista, Auxiliar de Cozinha"
                className="w-full h-12 pl-10 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Documento / CPF (Opcional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                CPF / Documento{' '}
                <span className="text-slate-400 font-normal text-[11px]">(opcional)</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                  <FileText className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full h-12 pl-10 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            {/* E-mail (Opcional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                E-mail <span className="text-slate-400 font-normal text-[11px]">(opcional)</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="freelancer@exemplo.com"
                  className="w-full h-12 pl-10 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5 sm:justify-end">
            <button
              type="button"
              onClick={() => navigate(`/admin/empresa/${id}?tab=freelancers`)}
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors order-2 sm:order-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cadastrando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cadastrar Freelancer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
