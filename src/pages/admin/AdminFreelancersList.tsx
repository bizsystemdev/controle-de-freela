import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getCompanyFreelancers,
  getAdminCompanies,
  duplicateFreelancer,
  removeFreelancerFromCompany,
  updateFreelancer,
  clearFreelancerDevice,
  type AdminFreelancer,
  type CompanyAdminItem,
} from '@/services/admin'
import { getCompany, type CompanyData } from '@/services/companies'
import { toast } from '@/hooks/use-toast'
import {
  Users,
  UserPlus,
  Copy,
  Trash2,
  Clock,
  Phone,
  Mail,
  Search,
  Loader2,
  Building2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Pencil,
  FileText,
  Briefcase,
  User,
  Smartphone,
  SmartphoneNfc,
  RotateCcw,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function AdminFreelancersList() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [company, setCompany] = useState<CompanyData | null>(null)
  const [freelancers, setFreelancers] = useState<AdminFreelancer[]>([])
  const [allCompanies, setAllCompanies] = useState<CompanyAdminItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Duplicate modal state
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false)
  const [selectedFreelancer, setSelectedFreelancer] = useState<AdminFreelancer | null>(null)
  const [targetCompanyId, setTargetCompanyId] = useState('')
  const [duplicating, setDuplicating] = useState(false)

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingFreelancer, setEditingFreelancer] = useState<AdminFreelancer | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editDocument, setEditDocument] = useState('')
  const [editRoleTitle, setEditRoleTitle] = useState('')
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [savingEdit, setSavingEdit] = useState(false)

  // Remove confirmation modal state
  const [removeModalOpen, setRemoveModalOpen] = useState(false)
  const [freelancerToRemove, setFreelancerToRemove] = useState<AdminFreelancer | null>(null)
  const [removing, setRemoving] = useState(false)

  // Clear device modal state
  const [clearDeviceModalOpen, setClearDeviceModalOpen] = useState(false)
  const [flToClearDevice, setFlToClearDevice] = useState<AdminFreelancer | null>(null)
  const [clearingDevice, setClearingDevice] = useState(false)

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [compData, flList, comps] = await Promise.all([
        getCompany(id!),
        getCompanyFreelancers(id!),
        getAdminCompanies(),
      ])
      setCompany(compData)
      setFreelancers(flList)
      setAllCompanies(comps)
    } catch (err) {
      toast({
        title: 'Erro ao carregar dados',
        description: err instanceof Error ? err.message : 'Falha ao buscar freelancers.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [id])

  const handleOpenEdit = (fl: AdminFreelancer) => {
    setEditingFreelancer(fl)
    setEditName(fl.name || '')
    setEditPhone(fl.phone || '')
    setEditEmail(fl.email || '')
    setEditDocument(fl.document || '')
    setEditRoleTitle(fl.roleTitle || '')
    setEditErrors({})
    setEditModalOpen(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFreelancer) return

    const errs: Record<string, string> = {}
    if (!editName.trim()) errs.name = 'Nome é obrigatório.'
    if (!editPhone.trim()) errs.phone = 'Telefone é obrigatório.'

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs)
      return
    }

    setSavingEdit(true)
    setEditErrors({})
    try {
      await updateFreelancer(editingFreelancer.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        document: editDocument.trim(),
        roleTitle: editRoleTitle.trim(),
      })

      toast({
        title: 'Freelancer atualizado!',
        description: `Os dados de ${editName} foram atualizados com sucesso.`,
      })

      setFreelancers((prev) =>
        prev.map((f) =>
          f.id === editingFreelancer.id
            ? {
                ...f,
                name: editName.trim(),
                phone: editPhone.trim(),
                email: editEmail.trim(),
                document: editDocument.trim(),
                roleTitle: editRoleTitle.trim(),
              }
            : f,
        ),
      )
      setEditModalOpen(false)
    } catch (err) {
      toast({
        title: 'Erro ao atualizar',
        description: err instanceof Error ? err.message : 'Falha ao salvar dados.',
        variant: 'destructive',
      })
    } finally {
      setSavingEdit(false)
    }
  }

  const handleOpenDuplicate = (fl: AdminFreelancer) => {
    setSelectedFreelancer(fl)
    // Pre-select first available other company
    const other = allCompanies.find((c) => c.id !== id)
    setTargetCompanyId(other ? other.id : '')
    setDuplicateModalOpen(true)
  }

  const handleConfirmDuplicate = async () => {
    if (!selectedFreelancer || !targetCompanyId) return
    setDuplicating(true)
    try {
      const res = await duplicateFreelancer(selectedFreelancer.id, targetCompanyId)
      toast({
        title: 'Freelancer vinculado com sucesso!',
        description: res.message,
      })
      setDuplicateModalOpen(false)
    } catch (err) {
      toast({
        title: 'Erro ao duplicar freelancer',
        description: err instanceof Error ? err.message : 'Falha na operação.',
        variant: 'destructive',
      })
    } finally {
      setDuplicating(false)
    }
  }

  const handleOpenRemove = (fl: AdminFreelancer) => {
    setFreelancerToRemove(fl)
    setRemoveModalOpen(true)
  }

  const handleConfirmRemove = async () => {
    if (!freelancerToRemove || !id) return
    setRemoving(true)
    try {
      await removeFreelancerFromCompany(freelancerToRemove.id, id)
      toast({
        title: 'Vínculo removido',
        description: `${freelancerToRemove.name} foi desvinculado de ${company?.name}.`,
      })
      setRemoveModalOpen(false)
      setFreelancers((prev) => prev.filter((f) => f.id !== freelancerToRemove.id))
    } catch (err) {
      toast({
        title: 'Erro ao remover',
        description: err instanceof Error ? err.message : 'Falha ao remover freelancer.',
        variant: 'destructive',
      })
    } finally {
      setRemoving(false)
    }
  }

  const handleOpenClearDevice = (fl: AdminFreelancer) => {
    setFlToClearDevice(fl)
    setClearDeviceModalOpen(true)
  }

  const handleConfirmClearDevice = async () => {
    if (!flToClearDevice) return
    setClearingDevice(true)
    try {
      await clearFreelancerDevice(flToClearDevice.id)
      toast({
        title: 'Dispositivo liberado',
        description:
          'Dispositivo liberado com sucesso. O freelancer já pode acessar de um novo aparelho.',
      })
      setFreelancers((prev) =>
        prev.map((f) => (f.id === flToClearDevice.id ? { ...f, deviceId: null } : f)),
      )
      setClearDeviceModalOpen(false)
    } catch (err) {
      toast({
        title: 'Erro ao liberar dispositivo',
        description: err instanceof Error ? err.message : 'Falha ao limpar dispositivo.',
        variant: 'destructive',
      })
    } finally {
      setClearingDevice(false)
    }
  }

  const filtered = freelancers.filter((f) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      f.name.toLowerCase().includes(q) ||
      f.phone.toLowerCase().includes(q) ||
      (f.roleTitle && f.roleTitle.toLowerCase().includes(q)) ||
      (f.document && f.document.toLowerCase().includes(q))
    )
  })

  // Filter available target companies (exclude current)
  const availableTargetCompanies = allCompanies.filter((c) => c.id !== id)

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/admin/empresa/${id}`}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Painel de {company?.name || 'Empresa'}</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Freelancers Vinculados
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie o quadro de colaboradores cadastrados na unidade.
          </p>
        </div>

        <Link
          to={`/admin/empresa/${id}/freelancers/novo`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Freelancer</span>
        </Link>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone ou cargo..."
            className="w-full h-11 pl-10 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-600 focus:bg-white"
          />
        </div>

        <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
          <span>{filtered.length} profissional(is) listado(s)</span>
        </div>
      </div>

      {/* Freelancers List / Table */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-700">Carregando lista de freelancers...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Nenhum freelancer encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {search
              ? 'Nenhum resultado para a busca.'
              : 'Cadastre o primeiro freelancer para esta empresa.'}
          </p>
          <Link
            to={`/admin/empresa/${id}/freelancers/novo`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar agora</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Freelancer</th>
                  <th className="py-3.5 px-4">Telefone</th>
                  <th className="py-3.5 px-4">Cargo / Função</th>
                  <th className="py-3.5 px-4">Dispositivo</th>
                  <th className="py-3.5 px-4">Status de Ponto</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((fl) => (
                  <tr key={fl.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Name & Avatar */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {fl.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{fl.name}</p>
                          {fl.email && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-300" />
                              <span>{fl.email}</span>
                            </p>
                          )}
                          {fl.document && (
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              CPF: {fl.document}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-4 px-4 font-mono text-slate-700 tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {fl.phone}
                      </span>
                    </td>

                    {/* Role title */}
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {fl.roleTitle || <span className="text-slate-400 italic">Geral</span>}
                    </td>

                    {/* Dispositivo */}
                    <td className="py-4 px-4">
                      {fl.deviceId ? (
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full"
                          title={`Dispositivo ID: ${fl.deviceId}`}
                        >
                          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-bold">Vinculado</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full"
                          title="Nenhum dispositivo registrado ainda"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          <span>Sem dispositivo</span>
                        </span>
                      )}
                    </td>

                    {/* Status Check-in */}
                    <td className="py-4 px-4">
                      {fl.hasOpenCheckIn ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Em atividade</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Check-out</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {Boolean(fl.deviceId) && (
                          <button
                            type="button"
                            onClick={() => handleOpenClearDevice(fl)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-colors active:scale-95 cursor-pointer"
                            title="Limpar dispositivo registrado do freelancer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                            <span className="hidden sm:inline">Limpar dispositivo</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(fl)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors active:scale-95 cursor-pointer"
                          title="Editar dados do freelancer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden sm:inline">Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDuplicate(fl)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors active:scale-95 cursor-pointer"
                          title="Duplicar para outra empresa"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden sm:inline">Duplicar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenRemove(fl)}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors active:scale-95 cursor-pointer"
                          title="Remover vínculo com esta empresa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Freelancer Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white border border-slate-100 shadow-2xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <Pencil className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900">
              Editar Freelancer
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Altere as informações cadastrais de <strong>{editingFreelancer?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nome completo <span className="text-red-600">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                />
              </div>
              {editErrors.name && <p className="text-xs text-red-600 mt-1">{editErrors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Telefone / WhatsApp <span className="text-red-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400 pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>
                {editErrors.phone && (
                  <p className="text-xs text-red-600 mt-1">{editErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  CPF <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400 pointer-events-none">
                    <FileText className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={editDocument}
                    onChange={(e) => setEditDocument(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  E-mail <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="freelancer@exemplo.com"
                    className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Cargo / Função
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400 pointer-events-none">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={editRoleTitle}
                    onChange={(e) => setEditRoleTitle(e.target.value)}
                    placeholder="Ex: Garçom, Barista"
                    className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-2 order-1 sm:order-2 disabled:opacity-50 cursor-pointer"
              >
                {savingEdit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar Alterações</span>
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Duplicate Freelancer Modal */}
      <Dialog open={duplicateModalOpen} onOpenChange={setDuplicateModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-white border border-slate-100">
          <DialogHeader className="text-center sm:text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Copy className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900 text-center">
              Duplicar Freelancer
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500 text-center pt-1">
              Vincule <strong>{selectedFreelancer?.name}</strong> a outra unidade que você gerencia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Empresa de destino
              </label>

              {availableTargetCompanies.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl">
                  Você gerencia apenas esta empresa no momento.
                </p>
              ) : (
                <Select value={targetCompanyId} onValueChange={setTargetCompanyId}>
                  <SelectTrigger className="w-full h-11 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold">
                    <SelectValue placeholder="Selecione a empresa destino" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-2xl border border-slate-200">
                    {availableTargetCompanies.map((c) => (
                      <SelectItem
                        key={c.id}
                        value={c.id}
                        className="text-xs font-medium cursor-pointer"
                      >
                        {c.name} ({c.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-2">
            <button
              type="button"
              disabled={duplicating || !targetCompanyId || availableTargetCompanies.length === 0}
              onClick={handleConfirmDuplicate}
              className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {duplicating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Vinculando...</span>
                </>
              ) : (
                <span>Confirmar Vínculo</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setDuplicateModalOpen(false)}
              className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
            >
              Cancelar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Device Modal */}
      <Dialog open={clearDeviceModalOpen} onOpenChange={setClearDeviceModalOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-6 bg-white border border-slate-100 shadow-2xl">
          <DialogHeader className="text-center sm:text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <SmartphoneNfc className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900 text-center">
              Limpar dispositivo
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 text-center pt-1 leading-relaxed">
              Tem certeza? O freelancer poderá registrar um novo dispositivo no próximo acesso.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
            <button
              type="button"
              disabled={clearingDevice}
              onClick={handleConfirmClearDevice}
              className="w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-600/20"
            >
              {clearingDevice ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Limpando...</span>
                </>
              ) : (
                'Sim, limpar dispositivo'
              )}
            </button>
            <button
              type="button"
              onClick={() => setClearDeviceModalOpen(false)}
              className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
            >
              Cancelar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Modal */}
      <Dialog open={removeModalOpen} onOpenChange={setRemoveModalOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-6 bg-white border border-slate-100">
          <DialogHeader className="text-center sm:text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900 text-center">
              Desvincular Freelancer?
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500 text-center pt-1">
              Tem certeza que deseja remover o vínculo de{' '}
              <strong>{freelancerToRemove?.name}</strong> com esta empresa? O cadastro global
              continuará salvo.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
            <button
              type="button"
              disabled={removing}
              onClick={handleConfirmRemove}
              className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, desvincular'}
            </button>
            <button
              type="button"
              onClick={() => setRemoveModalOpen(false)}
              className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
            >
              Cancelar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
