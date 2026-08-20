import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  getCompanyStats,
  getAdminCompanies,
  getCompanyFreelancers,
  getCompanyManagers,
  getCompanyAttendanceHistory,
  duplicateFreelancer,
  removeFreelancerFromCompany,
  updateFreelancer,
  createCompanyManager,
  updateManager,
  removeManagerFromCompany,
  duplicateManager,
  type CompanyStats,
  type CompanyAdminItem,
  type AdminFreelancer,
  type AdminManager,
  type AttendanceHistoryItem,
} from '@/services/admin'
import { getCompany, type CompanyData } from '@/services/companies'
import { toast } from '@/hooks/use-toast'
import {
  Building2,
  Users,
  Clock,
  MapPin,
  Loader2,
  CalendarCheck2,
  ArrowLeft,
  History,
  UserPlus,
  ChevronDown,
  Shield,
  Pencil,
  Copy,
  Trash2,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Mail,
  Phone,
  Lock,
  User,
  Briefcase,
  FileText,
  RefreshCw,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

export default function AdminCompanyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = searchParams.get('tab') || 'overview'

  const setActiveTab = (tab: 'overview' | 'freelancers' | 'gestores' | 'historico') => {
    if (tab === 'overview') {
      searchParams.delete('tab')
      setSearchParams(searchParams, { replace: true })
    } else {
      setSearchParams({ tab }, { replace: true })
    }
  }

  // Base company state
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [allCompanies, setAllCompanies] = useState<CompanyAdminItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Freelancers tab state
  const [freelancers, setFreelancers] = useState<AdminFreelancer[]>([])
  const [loadingFreelancers, setLoadingFreelancers] = useState(false)
  const [freelancerSearch, setFreelancerSearch] = useState('')

  // Freelancer Edit Modal
  const [editFlModalOpen, setEditFlModalOpen] = useState(false)
  const [editingFl, setEditingFl] = useState<AdminFreelancer | null>(null)
  const [editFlName, setEditFlName] = useState('')
  const [editFlPhone, setEditFlPhone] = useState('')
  const [editFlEmail, setEditFlEmail] = useState('')
  const [editFlDocument, setEditFlDocument] = useState('')
  const [editFlRoleTitle, setEditFlRoleTitle] = useState('')
  const [savingFlEdit, setSavingFlEdit] = useState(false)
  const [flEditErrors, setFlEditErrors] = useState<Record<string, string>>({})

  // Freelancer Duplicate Modal
  const [dupFlModalOpen, setDupFlModalOpen] = useState(false)
  const [selectedDupFl, setSelectedDupFl] = useState<AdminFreelancer | null>(null)
  const [targetDupFlCompId, setTargetDupFlCompId] = useState('')
  const [duplicatingFl, setDuplicatingFl] = useState(false)

  // Freelancer Remove Modal
  const [removeFlModalOpen, setRemoveFlModalOpen] = useState(false)
  const [flToRemove, setFlToRemove] = useState<AdminFreelancer | null>(null)
  const [removingFl, setRemovingFl] = useState(false)

  // Managers tab state
  const [managers, setManagers] = useState<AdminManager[]>([])
  const [loadingManagers, setLoadingManagers] = useState(false)
  const [managerSearch, setManagerSearch] = useState('')

  // Manager Create Modal
  const [createMgrModalOpen, setCreateMgrModalOpen] = useState(false)
  const [newMgrName, setNewMgrName] = useState('')
  const [newMgrEmail, setNewMgrEmail] = useState('')
  const [newMgrPassword, setNewMgrPassword] = useState('')
  const [creatingMgr, setCreatingMgr] = useState(false)
  const [mgrCreateErrors, setMgrCreateErrors] = useState<Record<string, string>>({})

  // Manager Edit Modal
  const [editMgrModalOpen, setEditMgrModalOpen] = useState(false)
  const [editingMgr, setEditingMgr] = useState<AdminManager | null>(null)
  const [editMgrName, setEditMgrName] = useState('')
  const [editMgrEmail, setEditMgrEmail] = useState('')
  const [editMgrPassword, setEditMgrPassword] = useState('')
  const [savingMgrEdit, setSavingMgrEdit] = useState(false)
  const [mgrEditErrors, setMgrEditErrors] = useState<Record<string, string>>({})

  // Manager Duplicate Modal
  const [dupMgrModalOpen, setDupMgrModalOpen] = useState(false)
  const [selectedDupMgr, setSelectedDupMgr] = useState<AdminManager | null>(null)
  const [targetDupMgrCompId, setTargetDupMgrCompId] = useState('')
  const [duplicatingMgr, setDuplicatingMgr] = useState(false)

  // Manager Remove Modal
  const [removeMgrModalOpen, setRemoveMgrModalOpen] = useState(false)
  const [mgrToRemove, setMgrToRemove] = useState<AdminManager | null>(null)
  const [removingMgr, setRemovingMgr] = useState(false)

  // History tab state
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedHistFreelancerId, setSelectedHistFreelancerId] = useState('all')
  const [selectedHistType, setSelectedHistType] = useState<'all' | 'check_in' | 'check_out'>('all')
  const [histStartDate, setHistStartDate] = useState('')
  const [histEndDate, setHistEndDate] = useState('')

  // Load basic company data and stats
  const loadCompanyData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [compData, statsData, allComps] = await Promise.all([
        getCompany(id),
        getCompanyStats(id),
        getAdminCompanies(),
      ])
      setCompany(compData)
      setStats(statsData)
      setAllCompanies(allComps)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar dados da empresa.')
    } finally {
      setLoading(false)
    }
  }

  // Load tab-specific data
  const loadFreelancers = async () => {
    if (!id) return
    setLoadingFreelancers(true)
    try {
      const flList = await getCompanyFreelancers(id)
      setFreelancers(flList)
    } catch (err) {
      toast({
        title: 'Erro ao carregar freelancers',
        description: err instanceof Error ? err.message : 'Falha na listagem.',
        variant: 'destructive',
      })
    } finally {
      setLoadingFreelancers(false)
    }
  }

  const loadManagers = async () => {
    if (!id) return
    setLoadingManagers(true)
    try {
      const mgrList = await getCompanyManagers(id)
      setManagers(mgrList)
    } catch (err) {
      toast({
        title: 'Erro ao carregar gestores',
        description: err instanceof Error ? err.message : 'Falha na listagem.',
        variant: 'destructive',
      })
    } finally {
      setLoadingManagers(false)
    }
  }

  const loadHistory = async () => {
    if (!id) return
    setLoadingHistory(true)
    try {
      const histData = await getCompanyAttendanceHistory(id, {
        freelancerId: selectedHistFreelancerId === 'all' ? undefined : selectedHistFreelancerId,
        type: selectedHistType,
        startDate: histStartDate || undefined,
        endDate: histEndDate || undefined,
      })
      setHistory(histData)
    } catch (err) {
      toast({
        title: 'Erro ao carregar histórico',
        description: err instanceof Error ? err.message : 'Falha na consulta.',
        variant: 'destructive',
      })
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    void loadCompanyData()
  }, [id])

  useEffect(() => {
    if (activeTab === 'freelancers' || activeTab === 'overview') {
      void loadFreelancers()
    }
    if (activeTab === 'gestores') {
      void loadManagers()
    }
    if (activeTab === 'historico') {
      void loadHistory()
      if (freelancers.length === 0) {
        void loadFreelancers()
      }
    }
  }, [id, activeTab, selectedHistFreelancerId, selectedHistType, histStartDate, histEndDate])

  // --- Handlers: Freelancers ---
  const handleOpenEditFl = (fl: AdminFreelancer) => {
    setEditingFl(fl)
    setEditFlName(fl.name || '')
    setEditFlPhone(fl.phone || '')
    setEditFlEmail(fl.email || '')
    setEditFlDocument(fl.document || '')
    setEditFlRoleTitle(fl.roleTitle || '')
    setFlEditErrors({})
    setEditFlModalOpen(true)
  }

  const handleSaveEditFl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFl) return

    const errs: Record<string, string> = {}
    if (!editFlName.trim()) errs.name = 'Nome é obrigatório.'
    if (!editFlPhone.trim()) errs.phone = 'Telefone é obrigatório.'

    if (Object.keys(errs).length > 0) {
      setFlEditErrors(errs)
      return
    }

    setSavingFlEdit(true)
    setFlEditErrors({})
    try {
      await updateFreelancer(editingFl.id, {
        name: editFlName.trim(),
        phone: editFlPhone.trim(),
        email: editFlEmail.trim(),
        document: editFlDocument.trim(),
        roleTitle: editFlRoleTitle.trim(),
      })

      toast({
        title: 'Freelancer atualizado!',
        description: `Os dados de ${editFlName} foram atualizados com sucesso.`,
      })

      setFreelancers((prev) =>
        prev.map((f) =>
          f.id === editingFl.id
            ? {
                ...f,
                name: editFlName.trim(),
                phone: editFlPhone.trim(),
                email: editFlEmail.trim(),
                document: editFlDocument.trim(),
                roleTitle: editFlRoleTitle.trim(),
              }
            : f,
        ),
      )
      setEditFlModalOpen(false)
    } catch (err) {
      toast({
        title: 'Erro ao atualizar',
        description: err instanceof Error ? err.message : 'Falha ao salvar dados.',
        variant: 'destructive',
      })
    } finally {
      setSavingFlEdit(false)
    }
  }

  const handleOpenDupFl = (fl: AdminFreelancer) => {
    setSelectedDupFl(fl)
    const other = allCompanies.find((c) => c.id !== id)
    setTargetDupFlCompId(other ? other.id : '')
    setDupFlModalOpen(true)
  }

  const handleConfirmDupFl = async () => {
    if (!selectedDupFl || !targetDupFlCompId) return
    setDuplicatingFl(true)
    try {
      const res = await duplicateFreelancer(selectedDupFl.id, targetDupFlCompId)
      toast({
        title: 'Freelancer vinculado!',
        description: res.message,
      })
      setDupFlModalOpen(false)
    } catch (err) {
      toast({
        title: 'Erro ao duplicar',
        description: err instanceof Error ? err.message : 'Falha ao vincular.',
        variant: 'destructive',
      })
    } finally {
      setDuplicatingFl(false)
    }
  }

  const handleOpenRemoveFl = (fl: AdminFreelancer) => {
    setFlToRemove(fl)
    setRemoveFlModalOpen(true)
  }

  const handleConfirmRemoveFl = async () => {
    if (!flToRemove || !id) return
    setRemovingFl(true)
    try {
      await removeFreelancerFromCompany(flToRemove.id, id)
      toast({
        title: 'Freelancer desvinculado',
        description: `${flToRemove.name} foi removido desta unidade.`,
      })
      setFreelancers((prev) => prev.filter((f) => f.id !== flToRemove.id))
      setRemoveFlModalOpen(false)
      void loadCompanyData()
    } catch (err) {
      toast({
        title: 'Erro ao desvincular',
        description: err instanceof Error ? err.message : 'Falha ao remover.',
        variant: 'destructive',
      })
    } finally {
      setRemovingFl(false)
    }
  }

  // --- Handlers: Managers ---
  const handleOpenCreateMgr = () => {
    setNewMgrName('')
    setNewMgrEmail('')
    setNewMgrPassword('')
    setMgrCreateErrors({})
    setCreateMgrModalOpen(true)
  }

  const handleCreateMgrSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    const errs: Record<string, string> = {}
    if (!newMgrName.trim()) errs.name = 'Nome do gestor é obrigatório.'
    if (!newMgrEmail.trim() || !newMgrEmail.includes('@')) errs.email = 'E-mail inválido.'
    if (!newMgrPassword || newMgrPassword.length < 6) {
      errs.password = 'Senha deve ter no mínimo 6 dígitos.'
    }

    if (Object.keys(errs).length > 0) {
      setMgrCreateErrors(errs)
      return
    }

    setCreatingMgr(true)
    setMgrCreateErrors({})
    try {
      const res = await createCompanyManager({
        companyId: id,
        name: newMgrName.trim(),
        email: newMgrEmail.trim().toLowerCase(),
        password: newMgrPassword,
        role: 'owner',
      })

      toast({
        title: 'Gestor vinculado!',
        description: `O gestor ${res.manager.name} foi adicionado à empresa.`,
      })

      setCreateMgrModalOpen(false)
      await loadManagers()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao cadastrar gestor.'
      toast({
        title: 'Erro ao cadastrar',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setCreatingMgr(false)
    }
  }

  const handleOpenEditMgr = (mgr: AdminManager) => {
    setEditingMgr(mgr)
    setEditMgrName(mgr.name || '')
    setEditMgrEmail(mgr.email || '')
    setEditMgrPassword('')
    setMgrEditErrors({})
    setEditMgrModalOpen(true)
  }

  const handleSaveEditMgr = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMgr) return

    const errs: Record<string, string> = {}
    if (!editMgrName.trim()) errs.name = 'Nome é obrigatório.'
    if (!editMgrEmail.trim() || !editMgrEmail.includes('@')) errs.email = 'E-mail inválido.'
    if (editMgrPassword && editMgrPassword.length < 6) {
      errs.password = 'Senha deve ter no mínimo 6 dígitos.'
    }

    if (Object.keys(errs).length > 0) {
      setMgrEditErrors(errs)
      return
    }

    setSavingMgrEdit(true)
    setMgrEditErrors({})
    try {
      await updateManager(editingMgr.id, {
        name: editMgrName.trim(),
        email: editMgrEmail.trim().toLowerCase(),
        password: editMgrPassword || undefined,
      })

      toast({
        title: 'Gestor atualizado!',
        description: `Dados de ${editMgrName} atualizados com sucesso.`,
      })

      setManagers((prev) =>
        prev.map((m) =>
          m.id === editingMgr.id
            ? {
                ...m,
                name: editMgrName.trim(),
                email: editMgrEmail.trim().toLowerCase(),
              }
            : m,
        ),
      )
      setEditMgrModalOpen(false)
    } catch (err) {
      toast({
        title: 'Erro ao atualizar gestor',
        description: err instanceof Error ? err.message : 'Falha na atualização.',
        variant: 'destructive',
      })
    } finally {
      setSavingMgrEdit(false)
    }
  }

  const handleOpenDupMgr = (mgr: AdminManager) => {
    setSelectedDupMgr(mgr)
    const other = allCompanies.find((c) => c.id !== id)
    setTargetDupMgrCompId(other ? other.id : '')
    setDupMgrModalOpen(true)
  }

  const handleConfirmDupMgr = async () => {
    if (!selectedDupMgr || !id || !targetDupMgrCompId) return
    setDuplicatingMgr(true)
    try {
      const res = await duplicateManager(id, selectedDupMgr.id, targetDupMgrCompId)
      toast({
        title: 'Gestor duplicado!',
        description: res.message,
      })
      setDupMgrModalOpen(false)
    } catch (err) {
      toast({
        title: 'Erro ao duplicar gestor',
        description: err instanceof Error ? err.message : 'Falha na operação.',
        variant: 'destructive',
      })
    } finally {
      setDuplicatingMgr(false)
    }
  }

  const handleOpenRemoveMgr = (mgr: AdminManager) => {
    setMgrToRemove(mgr)
    setRemoveMgrModalOpen(true)
  }

  const handleConfirmRemoveMgr = async () => {
    if (!mgrToRemove || !id) return
    setRemovingMgr(true)
    try {
      await removeManagerFromCompany(id, mgrToRemove.id)
      toast({
        title: 'Gestor desvinculado',
        description: `${mgrToRemove.name} não tem mais acesso a esta empresa.`,
      })
      setManagers((prev) => prev.filter((m) => m.id !== mgrToRemove.id))
      setRemoveMgrModalOpen(false)
    } catch (err) {
      toast({
        title: 'Erro ao desvincular gestor',
        description: err instanceof Error ? err.message : 'Falha ao desvincular.',
        variant: 'destructive',
      })
    } finally {
      setRemovingMgr(false)
    }
  }

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString)
    return {
      date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  const availableOtherCompanies = allCompanies.filter((c) => c.id !== id)

  const filteredFreelancers = freelancers.filter((f) => {
    const q = freelancerSearch.toLowerCase().trim()
    if (!q) return true
    return (
      f.name.toLowerCase().includes(q) ||
      f.phone.toLowerCase().includes(q) ||
      (f.roleTitle && f.roleTitle.toLowerCase().includes(q)) ||
      (f.document && f.document.toLowerCase().includes(q))
    )
  })

  const filteredManagers = managers.filter((m) => {
    const q = managerSearch.toLowerCase().trim()
    if (!q) return true
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
  })

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">Carregando painel da empresa...</p>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="bg-red-50 rounded-3xl p-8 border border-red-200 text-center space-y-4">
        <p className="font-bold text-red-700 text-base">{error || 'Empresa não encontrada.'}</p>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Dashboard</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Company Header Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 via-red-700 to-slate-900 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-red-600/20 shrink-0">
            {company.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {company.name}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Ativa
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                {company.endereco}, {company.cidade} - {company.estado}
              </span>
            </p>
          </div>
        </div>

        {/* Change company dropdown */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>Trocar Empresa</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 bg-white rounded-2xl p-1.5 shadow-xl border border-slate-200"
            >
              <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Suas Empresas
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allCompanies.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => navigate(`/admin/empresa/${c.id}`)}
                  className={`rounded-xl text-xs font-semibold cursor-pointer ${
                    c.id === company.id ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-700'
                  }`}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  <span className="truncate">{c.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Voltar ao dashboard geral"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Visão Geral
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('freelancers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === 'freelancers'
              ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Freelancers</span>
          {freelancers.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'freelancers'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {freelancers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gestores')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === 'gestores'
              ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Gestores</span>
          {managers.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'gestores' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {managers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('historico')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === 'historico'
              ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Histórico</span>
        </button>
      </div>

      {/* TAB 1: VISÃO GERAL */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Freelancers */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total de Freelancers
                </p>
                <p className="text-3xl font-black text-slate-900 mt-2 tabular-nums">
                  {stats?.totalFreelancers || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">Vinculados a esta unidade</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Check-ins Today */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Check-ins Hoje
                </p>
                <p className="text-3xl font-black text-slate-900 mt-2 tabular-nums">
                  {stats?.checkInsToday || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">Registrados nas últimas 24h</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CalendarCheck2 className="w-6 h-6" />
              </div>
            </div>

            {/* Currently Open Check-ins */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Check-ins Abertos
                </p>
                <p className="text-3xl font-black text-emerald-600 mt-2 tabular-nums">
                  {stats?.openCheckIns || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">Freelancers presentes agora</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Action Shortcut Modules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Module 1: Freelancers Management */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Freelancers</h3>
                    <p className="text-xs text-slate-500">
                      Cadastre, edite dados e gerencie vínculos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('freelancers')}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Ver Todos</span>
                </button>
                <Link
                  to={`/admin/empresa/${company.id}/freelancers/novo`}
                  className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Novo</span>
                </Link>
              </div>
            </div>

            {/* Module 2: Gestores Management */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Gestores da Unidade</h3>
                    <p className="text-xs text-slate-500">
                      Adicione administradores, edite e duplique acessos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('gestores')}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Gestores</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreateMgr}
                  className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Novo</span>
                </button>
              </div>
            </div>

            {/* Module 3: Attendance Records */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Histórico de Ponto</h3>
                    <p className="text-xs text-slate-500">
                      Entradas, saídas e auditoria por GPS em tempo real.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('historico')}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <History className="w-4 h-4" />
                  <span>Consultar Histórico</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FREELANCERS */}
      {activeTab === 'freelancers' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">Freelancers Vinculados</h2>
              <p className="text-xs text-slate-500">
                Gerencie os profissionais autorizados a bater ponto nesta empresa.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadFreelancers()}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Atualizar lista"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <Link
                to={`/admin/empresa/${id}/freelancers/novo`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Novo Freelancer</span>
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={freelancerSearch}
                onChange={(e) => setFreelancerSearch(e.target.value)}
                placeholder="Buscar por nome, telefone ou cargo..."
                className="w-full h-10 pl-10 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-600 focus:bg-white"
              />
            </div>
            <span className="text-xs font-bold text-slate-500">
              {filteredFreelancers.length} cadastrado(s)
            </span>
          </div>

          {/* Table */}
          {loadingFreelancers ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-700">Carregando freelancers...</p>
            </div>
          ) : filteredFreelancers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Nenhum freelancer encontrado</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                {freelancerSearch
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
                      <th className="py-3.5 px-4">Status de Ponto</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFreelancers.map((fl) => (
                      <tr key={fl.id} className="hover:bg-slate-50/60 transition-colors">
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

                        <td className="py-4 px-4 font-mono text-slate-700 tabular-nums">
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {fl.phone}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-slate-600 font-medium">
                          {fl.roleTitle || <span className="text-slate-400 italic">Geral</span>}
                        </td>

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

                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditFl(fl)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                              title="Editar freelancer"
                            >
                              <Pencil className="w-3.5 h-3.5 text-slate-500" />
                              <span className="hidden sm:inline">Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenDupFl(fl)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                              title="Duplicar para outra empresa"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span className="hidden sm:inline">Duplicar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenRemoveFl(fl)}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
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
        </div>
      )}

      {/* TAB 3: GESTORES */}
      {activeTab === 'gestores' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">Gestores da Empresa</h2>
              <p className="text-xs text-slate-500">
                Administradores que têm permissão de acesso e gestão nesta unidade.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadManagers()}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Atualizar lista"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleOpenCreateMgr}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Gestor</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={managerSearch}
                onChange={(e) => setManagerSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full h-10 pl-10 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-600 focus:bg-white"
              />
            </div>
            <span className="text-xs font-bold text-slate-500">
              {filteredManagers.length} gestor(es)
            </span>
          </div>

          {/* Table */}
          {loadingManagers ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-700">Carregando gestores...</p>
            </div>
          ) : filteredManagers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm">
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Nenhum gestor encontrado</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Adicione gestores para compartilhar a administração desta empresa.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateMgr}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Gestor</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Gestor</th>
                      <th className="py-3.5 px-4">E-mail de Acesso</th>
                      <th className="py-3.5 px-4">Perfil</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredManagers.map((mgr) => (
                      <tr key={mgr.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                              {mgr.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{mgr.name}</p>
                              <p className="text-[11px] text-slate-400">ID: {mgr.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-slate-700">
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {mgr.email}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full uppercase">
                            <Shield className="w-3 h-3 text-red-600" />
                            <span>{mgr.role || 'Administrador'}</span>
                          </span>
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditMgr(mgr)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                              title="Editar gestor"
                            >
                              <Pencil className="w-3.5 h-3.5 text-slate-500" />
                              <span className="hidden sm:inline">Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenDupMgr(mgr)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                              title="Duplicar para outra empresa"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span className="hidden sm:inline">Duplicar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenRemoveMgr(mgr)}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Desvincular gestor da empresa"
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
        </div>
      )}

      {/* TAB 4: HISTÓRICO */}
      {activeTab === 'historico' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">Histórico de Presença</h2>
              <p className="text-xs text-slate-500">
                Auditoria de check-in e check-out de todos os colaboradores.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadHistory()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar</span>
            </button>
          </div>

          {/* Filter Controls */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-red-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Filtros
                </span>
              </div>

              {(selectedHistFreelancerId !== 'all' ||
                selectedHistType !== 'all' ||
                histStartDate ||
                histEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHistFreelancerId('all')
                    setSelectedHistType('all')
                    setHistStartDate('')
                    setHistEndDate('')
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer"
                >
                  Limpar Filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Freelancer Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Profissional
                </label>
                <Select
                  value={selectedHistFreelancerId}
                  onValueChange={setSelectedHistFreelancerId}
                >
                  <SelectTrigger className="w-full h-10 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold">
                    <SelectValue placeholder="Todos os freelancers" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-2xl border border-slate-200">
                    <SelectItem value="all" className="text-xs font-medium cursor-pointer">
                      Todos os freelancers
                    </SelectItem>
                    {freelancers.map((fl) => (
                      <SelectItem
                        key={fl.id}
                        value={fl.id}
                        className="text-xs font-medium cursor-pointer"
                      >
                        {fl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Tipo
                </label>
                <Select
                  value={selectedHistType}
                  onValueChange={(v) => setSelectedHistType(v as 'all' | 'check_in' | 'check_out')}
                >
                  <SelectTrigger className="w-full h-10 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold">
                    <SelectValue placeholder="Entradas e Saídas" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-2xl border border-slate-200">
                    <SelectItem value="all" className="text-xs font-medium cursor-pointer">
                      Ambos (Check-in e Saída)
                    </SelectItem>
                    <SelectItem value="check_in" className="text-xs font-medium cursor-pointer">
                      Apenas Check-in
                    </SelectItem>
                    <SelectItem value="check_out" className="text-xs font-medium cursor-pointer">
                      Apenas Check-out
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={histStartDate}
                  onChange={(e) => setHistStartDate(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={histEndDate}
                  onChange={(e) => setHistEndDate(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* History Table */}
          {loadingHistory ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-700">Carregando histórico...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Nenhum registro encontrado</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Não foram localizados registros de ponto com os filtros atuais.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Freelancer</th>
                      <th className="py-3.5 px-4">Tipo</th>
                      <th className="py-3.5 px-4">Data e Hora</th>
                      <th className="py-3.5 px-4 sm:px-6">Localização (GPS)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((record) => {
                      const { date, time } = formatDateTime(record.timestamp)
                      const isCheckIn = record.type === 'check_in'

                      return (
                        <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                                {record.freelancerName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">
                                  {record.freelancerName}
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono">
                                  {record.freelancerPhone || record.freelancerRoleTitle || ''}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            {isCheckIn ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                                <span>Check-in (Entrada)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                <span>Check-out (Saída)</span>
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 font-mono text-slate-700">
                            <span className="font-bold text-slate-900">{date}</span>
                            <span className="text-slate-400 ml-2 font-medium">{time}</span>
                          </td>

                          <td className="py-4 px-4 sm:px-6 text-slate-600">
                            {record.lat && record.lng ? (
                              <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 px-2 py-1 rounded-lg text-slate-700">
                                <MapPin className="w-3 h-3 text-red-600" />
                                {record.lat.toFixed(4)}, {record.lng.toFixed(4)}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Dispositivo</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODAIS DE FREELANCER --- */}
      {/* Edit Freelancer Modal */}
      <Dialog open={editFlModalOpen} onOpenChange={setEditFlModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white border border-slate-100 shadow-2xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <Pencil className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900">
              Editar Freelancer
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Altere as informações cadastrais de <strong>{editingFl?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEditFl} className="space-y-4 pt-2">
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
                  value={editFlName}
                  onChange={(e) => setEditFlName(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                />
              </div>
              {flEditErrors.name && (
                <p className="text-xs text-red-600 mt-1">{flEditErrors.name}</p>
              )}
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
                    value={editFlPhone}
                    onChange={(e) => setEditFlPhone(e.target.value)}
                    className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>
                {flEditErrors.phone && (
                  <p className="text-xs text-red-600 mt-1">{flEditErrors.phone}</p>
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
                    value={editFlDocument}
                    onChange={(e) => setEditFlDocument(e.target.value)}
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
                    value={editFlEmail}
                    onChange={(e) => setEditFlEmail(e.target.value)}
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
                    value={editFlRoleTitle}
                    onChange={(e) => setEditFlRoleTitle(e.target.value)}
                    placeholder="Ex: Garçom, Barista"
                    className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditFlModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingFlEdit}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-2 order-1 sm:order-2 disabled:opacity-50 cursor-pointer"
              >
                {savingFlEdit ? (
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
      <Dialog open={dupFlModalOpen} onOpenChange={setDupFlModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-white border border-slate-100">
          <DialogHeader className="text-center sm:text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Copy className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900 text-center">
              Duplicar Freelancer
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 text-center pt-1">
              Vincule <strong>{selectedDupFl?.name}</strong> a outra unidade sob sua gestão.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Empresa de destino
              </label>

              {availableOtherCompanies.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl">
                  Você gerencia apenas esta empresa no momento.
                </p>
              ) : (
                <Select value={targetDupFlCompId} onValueChange={setTargetDupFlCompId}>
                  <SelectTrigger className="w-full h-11 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold">
                    <SelectValue placeholder="Selecione a empresa destino" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-2xl border border-slate-200">
                    {availableOtherCompanies.map((c) => (
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
              disabled={duplicatingFl || !targetDupFlCompId || availableOtherCompanies.length === 0}
              onClick={handleConfirmDupFl}
              className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {duplicatingFl ? (
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
              onClick={() => setDupFlModalOpen(false)}
              className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
            >
              Cancelar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Freelancer Modal */}
      <Dialog open={removeFlModalOpen} onOpenChange={setRemoveFlModalOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-6 bg-white border border-slate-100">
          <DialogHeader className="text-center sm:text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900 text-center">
              Desvincular Freelancer?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 text-center pt-1">
              Tem certeza que deseja remover o vínculo de <strong>{flToRemove?.name}</strong> com
              esta empresa? O cadastro global continuará salvo.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
            <button
              type="button"
              disabled={removingFl}
              onClick={handleConfirmRemoveFl}
              className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {removingFl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, desvincular'}
            </button>
            <button
              type="button"
              onClick={() => setRemoveFlModalOpen(false)}
              className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
            >
              Cancelar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAIS DE GESTOR --- */}
      {/* Create Manager Modal */}
      <Dialog open={createMgrModalOpen} onOpenChange={setCreateMgrModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white border border-slate-100 shadow-2xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <Shield className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900">
              Cadastrar Novo Gestor
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Crie ou vincule um gestor para administrar a empresa <strong>{company.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateMgrSubmit} className="space-y-4 pt-2">
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
                  value={newMgrName}
                  onChange={(e) => {
                    setNewMgrName(e.target.value)
                    if (mgrCreateErrors.name) setMgrCreateErrors((prev) => ({ ...prev, name: '' }))
                  }}
                  placeholder="Ex: Ana Gerente"
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                />
              </div>
              {mgrCreateErrors.name && (
                <p className="text-xs text-red-600 mt-1">{mgrCreateErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                E-mail de Acesso <span className="text-red-600">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={newMgrEmail}
                  onChange={(e) => {
                    setNewMgrEmail(e.target.value)
                    if (mgrCreateErrors.email)
                      setMgrCreateErrors((prev) => ({ ...prev, email: '' }))
                  }}
                  placeholder="gestor@exemplo.com"
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                />
              </div>
              {mgrCreateErrors.email && (
                <p className="text-xs text-red-600 mt-1">{mgrCreateErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Senha Inicial <span className="text-red-600">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={newMgrPassword}
                  onChange={(e) => {
                    setNewMgrPassword(e.target.value)
                    if (mgrCreateErrors.password)
                      setMgrCreateErrors((prev) => ({ ...prev, password: '' }))
                  }}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                />
              </div>
              {mgrCreateErrors.password && (
                <p className="text-xs text-red-600 mt-1">{mgrCreateErrors.password}</p>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateMgrModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs order-2 sm:order-1 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creatingMgr}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-2 order-1 sm:order-2 disabled:opacity-50 cursor-pointer"
              >
                {creatingMgr ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <span>Criar e Vincular Gestor</span>
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Manager Modal */}
      <Dialog open={editMgrModalOpen} onOpenChange={setEditMgrModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white border border-slate-100 shadow-2xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <Pencil className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900">Editar Gestor</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Atualize as informações cadastrais de <strong>{editingMgr?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEditMgr} className="space-y-4 pt-2">
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
                  value={editMgrName}
                  onChange={(e) => setEditMgrName(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                />
              </div>
              {mgrEditErrors.name && (
                <p className="text-xs text-red-600 mt-1">{mgrEditErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                E-mail de Acesso <span className="text-red-600">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={editMgrEmail}
                  onChange={(e) => setEditMgrEmail(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                />
              </div>
              {mgrEditErrors.email && (
                <p className="text-xs text-red-600 mt-1">{mgrEditErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nova Senha{' '}
                <span className="text-slate-400 font-normal">
                  (deixe em branco para não alterar)
                </span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={editMgrPassword}
                  onChange={(e) => setEditMgrPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                />
              </div>
              {mgrEditErrors.password && (
                <p className="text-xs text-red-600 mt-1">{mgrEditErrors.password}</p>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditMgrModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs order-2 sm:order-1 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingMgrEdit}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-2 order-1 sm:order-2 disabled:opacity-50 cursor-pointer"
              >
                {savingMgrEdit ? (
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

      {/* Duplicate Manager Modal */}
      <Dialog open={dupMgrModalOpen} onOpenChange={setDupMgrModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-white border border-slate-100">
          <DialogHeader className="text-center sm:text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Copy className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900 text-center">
              Duplicar Gestor
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 text-center pt-1">
              Conceda acesso de <strong>{selectedDupMgr?.name}</strong> a outra empresa sob sua
              gestão.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Empresa de destino
              </label>

              {availableOtherCompanies.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl">
                  Você gerencia apenas esta empresa no momento.
                </p>
              ) : (
                <Select value={targetDupMgrCompId} onValueChange={setTargetDupMgrCompId}>
                  <SelectTrigger className="w-full h-11 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold">
                    <SelectValue placeholder="Selecione a empresa destino" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-2xl border border-slate-200">
                    {availableOtherCompanies.map((c) => (
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
              disabled={
                duplicatingMgr || !targetDupMgrCompId || availableOtherCompanies.length === 0
              }
              onClick={handleConfirmDupMgr}
              className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {duplicatingMgr ? (
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
              onClick={() => setDupMgrModalOpen(false)}
              className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
            >
              Cancelar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Manager Modal */}
      <Dialog open={removeMgrModalOpen} onOpenChange={setRemoveMgrModalOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-6 bg-white border border-slate-100">
          <DialogHeader className="text-center sm:text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900 text-center">
              Desvincular Gestor?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 text-center pt-1">
              Tem certeza que deseja remover o acesso de <strong>{mgrToRemove?.name}</strong> a esta
              empresa? O usuário não será excluído.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
            <button
              type="button"
              disabled={removingMgr}
              onClick={handleConfirmRemoveMgr}
              className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {removingMgr ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, desvincular'}
            </button>
            <button
              type="button"
              onClick={() => setRemoveMgrModalOpen(false)}
              className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
            >
              Cancelar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
