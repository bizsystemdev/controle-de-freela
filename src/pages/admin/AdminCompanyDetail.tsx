import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  getCompanyStats,
  getAdminCompanies,
  getCompanyFreelancers,
  getCompanyManagers,
  getCompanyAttendanceHistory,
  getDeviceReleases,
  duplicateFreelancer,
  removeFreelancerFromCompany,
  updateFreelancer,
  clearFreelancerDevice,
  registerManualAttendance,
  createCompanyManager,
  updateManager,
  removeManagerFromCompany,
  duplicateManager,
  getManagerInviteLink,
  updateAdminCompany,
  type CompanyStats,
  type CompanyAdminItem,
  type AdminFreelancer,
  type AdminManager,
  type AttendanceHistoryItem,
  type DeviceReleaseItem,
  type UpdateCompanyPayload,
} from '@/services/admin'
import { getCompany, type CompanyData } from '@/services/companies'
import { useApp } from '@/context/AppContext'
import { isGerente } from '@/lib/adminPermissions'
import { toast } from '@/hooks/use-toast'
import { maskAlphanumericCnpj, isValidAlphanumericCnpj, unmaskCnpj } from '@/lib/cnpj'
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
  CheckCircle2,
  AlertCircle,
  Smartphone,
  SmartphoneNfc,
  RotateCcw,
  CheckSquare,
  Square,
  UserCheck,
  Link as LinkIcon,
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
  const { manager } = useApp()
  const gerente = isGerente(manager)
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = searchParams.get('tab') || 'overview'

  const setActiveTab = (
    tab: 'overview' | 'freelancers' | 'gestores' | 'historico' | 'liberacoes',
  ) => {
    if (tab === 'overview') {
      searchParams.delete('tab')
      setSearchParams(searchParams, { replace: true })
    } else {
      searchParams.set('tab', tab)
      setSearchParams(searchParams, { replace: true })
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
  const [targetDupFlCompIds, setTargetDupFlCompIds] = useState<string[]>([])
  const [duplicatingFl, setDuplicatingFl] = useState(false)

  // Freelancer Remove Modal
  const [removeFlModalOpen, setRemoveFlModalOpen] = useState(false)
  const [flToRemove, setFlToRemove] = useState<AdminFreelancer | null>(null)
  const [removingFl, setRemovingFl] = useState(false)

  // Freelancer Clear Device Modal
  const [clearDeviceModalOpen, setClearDeviceModalOpen] = useState(false)
  const [flToClearDevice, setFlToClearDevice] = useState<AdminFreelancer | null>(null)
  const [clearingDevice, setClearingDevice] = useState(false)

  // Manual Attendance state
  const [manualAttendanceModalOpen, setManualAttendanceModalOpen] = useState(false)
  const [flForManualAtt, setFlForManualAtt] = useState<AdminFreelancer | null>(null)
  const [manualAttType, setManualAttType] = useState<'check_in' | 'check_out'>('check_in')
  const [registeringManual, setRegisteringManual] = useState(false)
  const [nowTick, setNowTick] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 10000)
    return () => clearInterval(timer)
  }, [])

  // Company Edit Modal state
  const [editCompanyModalOpen, setEditCompanyModalOpen] = useState(false)
  const [savingCompanyEdit, setSavingCompanyEdit] = useState(false)
  const [compEditErrors, setCompEditErrors] = useState<Record<string, string>>({})
  const [isLookingUpCep, setIsLookingUpCep] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [editHasCoordinates, setEditHasCoordinates] = useState(true)

  // Company Edit Form Fields
  const [editCompName, setEditCompName] = useState('')
  const [editCompStreet, setEditCompStreet] = useState('')
  const [editCompNumber, setEditCompNumber] = useState('')
  const [editCompNeighborhood, setEditCompNeighborhood] = useState('')
  const [editCompCity, setEditCompCity] = useState('')
  const [editCompState, setEditCompState] = useState('SC')
  const [editCompCep, setEditCompCep] = useState('')
  const [editCompCnpj, setEditCompCnpj] = useState('')
  const [editCompLat, setEditCompLat] = useState('')
  const [editCompLng, setEditCompLng] = useState('')
  const [editCompPlan, setEditCompPlan] = useState<'free' | 'pro' | 'enterprise'>('pro')

  // Managers tab state
  const [managers, setManagers] = useState<AdminManager[]>([])
  const [loadingManagers, setLoadingManagers] = useState(false)
  const [managerSearch, setManagerSearch] = useState('')

  // Manager Create Modal
  const [createMgrModalOpen, setCreateMgrModalOpen] = useState(false)
  const [newMgrName, setNewMgrName] = useState('')
  const [newMgrEmail, setNewMgrEmail] = useState('')
  const [newMgrProfile, setNewMgrProfile] = useState<'gestor' | 'gerente'>('gestor')
  const [newMgrPassword, setNewMgrPassword] = useState('')
  const [creatingMgr, setCreatingMgr] = useState(false)
  const [mgrCreateErrors, setMgrCreateErrors] = useState<Record<string, string>>({})

  // Modal para exibir Link de Convite gerado (Gerente)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [generatedInviteLink, setGeneratedInviteLink] = useState('')
  const [createdManagerInfo, setCreatedManagerInfo] = useState<{
    name: string
    email: string
  } | null>(null)
  const [copiedInvite, setCopiedInvite] = useState(false)

  // Manager Edit Modal
  const [editMgrModalOpen, setEditMgrModalOpen] = useState(false)
  const [editingMgr, setEditingMgr] = useState<AdminManager | null>(null)
  const [editMgrName, setEditMgrName] = useState('')
  const [editMgrEmail, setEditMgrEmail] = useState('')
  const [editMgrProfile, setEditMgrProfile] = useState<'gestor' | 'gerente'>('gestor')
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

  // Device Releases tab state
  const [deviceReleases, setDeviceReleases] = useState<DeviceReleaseItem[]>([])
  const [loadingReleases, setLoadingReleases] = useState(false)
  const [selectedRelFreelancerId, setSelectedRelFreelancerId] = useState('all')
  const [relStartDate, setRelStartDate] = useState('')
  const [relEndDate, setRelEndDate] = useState('')

  // Load basic company data and stats
  const loadCompanyData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [compData, statsData, allComps] = await Promise.all([
        getCompany(id),
        gerente ? Promise.resolve(null) : getCompanyStats(id),
        getAdminCompanies(manager?.id),
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

  const loadReleases = async () => {
    if (!id) return
    setLoadingReleases(true)
    try {
      const relData = await getDeviceReleases({
        companyId: id,
        freelancerId: selectedRelFreelancerId === 'all' ? undefined : selectedRelFreelancerId,
        startDate: relStartDate || undefined,
        endDate: relEndDate || undefined,
      })
      setDeviceReleases(relData)
    } catch (err) {
      toast({
        title: 'Erro ao carregar liberações',
        description:
          err instanceof Error ? err.message : 'Falha ao buscar histórico de liberações.',
        variant: 'destructive',
      })
    } finally {
      setLoadingReleases(false)
    }
  }

  useEffect(() => {
    void loadCompanyData()
  }, [id])

  // Helpers to parse structured address from string if number/neighborhood missing
  const parseExistingAddress = (comp: CompanyData) => {
    let street = ''
    let number = comp.number || ''
    let neighborhood = comp.neighborhood || ''

    if (comp.endereco) {
      // Try extracting "Rua, Número - Bairro"
      const parts = comp.endereco.split('-').map((p) => p.trim())
      if (parts.length > 1 && !neighborhood) {
        neighborhood = parts.slice(1).join(' - ')
      }
      const streetAndNum = parts[0]
      const commaIdx = streetAndNum.lastIndexOf(',')
      if (commaIdx !== -1 && !number) {
        street = streetAndNum.slice(0, commaIdx).trim()
        number = streetAndNum.slice(commaIdx + 1).trim()
      } else {
        street = streetAndNum
      }
    }

    return { street, number, neighborhood }
  }

  const handleOpenEditCompany = () => {
    if (gerente) return
    if (!company) return
    const parsed = parseExistingAddress(company)

    // Find active plan from license or allCompanies
    const currentAdminComp = allCompanies.find((c) => c.id === company.id)
    const currentPlan = (currentAdminComp?.license?.plan as 'free' | 'pro' | 'enterprise') || 'pro'

    setEditCompName(company.name || '')
    setEditCompStreet(parsed.street || '')
    setEditCompNumber(parsed.number || '')
    setEditCompNeighborhood(parsed.neighborhood || '')
    setEditCompCity(company.cidade || '')
    setEditCompState(company.estado || 'SC')
    setEditCompCep(company.cep || '')
    setEditCompCnpj(company.cnpj ? maskAlphanumericCnpj(company.cnpj) : '')
    setEditCompLat(company.location?.lat ? String(company.location.lat) : '')
    setEditCompLng(company.location?.lng ? String(company.location.lng) : '')
    setEditCompPlan(currentPlan)
    setEditHasCoordinates(Boolean(company.location?.lat && company.location?.lng))
    setCompEditErrors({})
    setEditCompanyModalOpen(true)
  }

  // ViaCEP lookup during company edit
  const handleEditCepLookup = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '')
    if (cleanCep.length !== 8) return

    setIsLookingUpCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
        signal: AbortSignal.timeout(6000),
      })
      const data = await res.json()
      if (data.erro) {
        toast({
          title: 'CEP não encontrado',
          description: 'CEP não encontrado. Preencha o endereço manualmente.',
          variant: 'destructive',
        })
      } else {
        if (data.logradouro) setEditCompStreet(data.logradouro)
        if (data.bairro) setEditCompNeighborhood(data.bairro)
        if (data.localidade) setEditCompCity(data.localidade)
        if (data.uf) setEditCompState(data.uf.toUpperCase())
        if (compEditErrors.street || compEditErrors.city || compEditErrors.state) {
          setCompEditErrors((prev) => ({ ...prev, street: '', city: '', state: '' }))
        }
      }
    } catch {
      toast({
        title: 'Falha na consulta do CEP',
        description: 'CEP não encontrado. Preencha o endereço manualmente.',
        variant: 'destructive',
      })
    } finally {
      setIsLookingUpCep(false)
    }
  }

  // Geocoding during company edit
  const performEditGeocoding = async (
    streetVal: string,
    numberVal: string,
    neighborhoodVal: string,
    cityVal: string,
    stateVal: string,
  ) => {
    if (!streetVal.trim() || !numberVal.trim() || !cityVal.trim() || !stateVal.trim()) {
      return
    }

    setIsGeocoding(true)
    try {
      const queryParts = [
        streetVal.trim(),
        numberVal.trim(),
        neighborhoodVal.trim(),
        cityVal.trim(),
        stateVal.trim(),
        'Brasil',
      ]
        .filter(Boolean)
        .join(', ')

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryParts)}&limit=1`
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'pt-BR',
        },
        signal: AbortSignal.timeout(6000),
      })
      const results = await res.json()

      if (results && results.length > 0 && results[0].lat && results[0].lon) {
        const foundLat = parseFloat(results[0].lat).toFixed(6)
        const foundLng = parseFloat(results[0].lon).toFixed(6)
        setEditCompLat(foundLat)
        setEditCompLng(foundLng)
        setEditHasCoordinates(true)
        setCompEditErrors((prev) => ({ ...prev, coordinates: '' }))
      } else {
        const fallbackQuery = `${streetVal.trim()}, ${cityVal.trim()}, ${stateVal.trim()}, Brasil`
        const fbRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1`,
          { headers: { 'Accept-Language': 'pt-BR' }, signal: AbortSignal.timeout(6000) },
        )
        const fbResults = await fbRes.json()
        if (fbResults && fbResults.length > 0 && fbResults[0].lat && fbResults[0].lon) {
          setEditCompLat(parseFloat(fbResults[0].lat).toFixed(6))
          setEditCompLng(parseFloat(fbResults[0].lon).toFixed(6))
          setEditHasCoordinates(true)
          setCompEditErrors((prev) => ({ ...prev, coordinates: '' }))
        } else {
          setCompEditErrors((prev) => ({
            ...prev,
            coordinates:
              'Não foi possível obter as coordenadas deste endereço. Verifique os dados e tente novamente.',
          }))
        }
      }
    } catch {
      setCompEditErrors((prev) => ({
        ...prev,
        coordinates:
          'Não foi possível obter as coordenadas deste endereço. Verifique os dados e tente novamente.',
      }))
    } finally {
      setIsGeocoding(false)
    }
  }

  // Trigger geocoding on edit when modal is open and address fields change
  useEffect(() => {
    if (
      editCompanyModalOpen &&
      editCompStreet.trim() &&
      editCompNumber.trim() &&
      editCompCity.trim() &&
      editCompState.trim()
    ) {
      const timer = setTimeout(() => {
        void performEditGeocoding(
          editCompStreet,
          editCompNumber,
          editCompNeighborhood,
          editCompCity,
          editCompState,
        )
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [
    editCompanyModalOpen,
    editCompStreet,
    editCompNumber,
    editCompNeighborhood,
    editCompCity,
    editCompState,
  ])

  const handleSaveCompanyEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (gerente) return
    if (!id || !company) return

    const errors: Record<string, string> = {}
    if (!editCompName.trim()) errors.name = 'Nome da empresa é obrigatório.'
    if (!editCompStreet.trim()) errors.street = 'Rua/logradouro é obrigatório.'
    if (!editCompNumber.trim()) errors.number = 'Número é obrigatório.'
    if (!editCompCity.trim()) errors.city = 'Cidade é obrigatória.'
    if (!editCompState.trim()) errors.state = 'Estado é obrigatório.'

    if (editCompCnpj.trim() && !isValidAlphanumericCnpj(editCompCnpj)) {
      errors.cnpj = 'CNPJ inválido. Digite os 14 caracteres alfanuméricos.'
    }

    const parsedLat = parseFloat(editCompLat)
    const parsedLng = parseFloat(editCompLng)
    if (!editCompLat || !editCompLng || isNaN(parsedLat) || isNaN(parsedLng)) {
      errors.coordinates =
        'Não foi possível obter as coordenadas deste endereço. Verifique os dados e tente novamente.'
    }

    if (Object.keys(errors).length > 0) {
      setCompEditErrors(errors)
      return
    }

    setSavingCompanyEdit(true)
    setCompEditErrors({})

    try {
      const payload: UpdateCompanyPayload = {
        name: editCompName.trim(),
        street: editCompStreet.trim(),
        number: editCompNumber.trim(),
        neighborhood: editCompNeighborhood.trim() || undefined,
        city: editCompCity.trim(),
        state: editCompState.trim().toUpperCase(),
        cep: editCompCep.trim() || undefined,
        cnpj: editCompCnpj.trim() ? unmaskCnpj(editCompCnpj) : '',
        lat: parsedLat,
        lng: parsedLng,
        plan: editCompPlan,
      }

      await updateAdminCompany(id, payload)

      toast({
        title: 'Empresa atualizada com sucesso!',
        description: `Os dados da empresa ${editCompName} foram salvos.`,
      })

      setEditCompanyModalOpen(false)
      await loadCompanyData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar dados da empresa.'
      toast({
        title: 'Erro ao atualizar empresa',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setSavingCompanyEdit(false)
    }
  }

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
    if (activeTab === 'liberacoes') {
      void loadReleases()
      if (freelancers.length === 0) {
        void loadFreelancers()
      }
    }
  }, [
    id,
    activeTab,
    selectedHistFreelancerId,
    selectedHistType,
    histStartDate,
    histEndDate,
    selectedRelFreelancerId,
    relStartDate,
    relEndDate,
  ])

  // --- Handlers: Freelancers ---
  const handleOpenEditFl = (fl: AdminFreelancer) => {
    if (gerente) return
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
    if (gerente) return
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
    if (gerente) return
    setSelectedDupFl(fl)
    const others = allCompanies.filter((c) => c.id !== id)
    setTargetDupFlCompIds(others.length > 0 ? [others[0].id] : [])
    setDupFlModalOpen(true)
  }

  const handleConfirmDupFl = async () => {
    if (gerente) return
    if (!selectedDupFl || targetDupFlCompIds.length === 0) return
    setDuplicatingFl(true)
    try {
      const res = await duplicateFreelancer(selectedDupFl.id, targetDupFlCompIds)
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
    if (gerente) return
    setFlToRemove(fl)
    setRemoveFlModalOpen(true)
  }

  const handleConfirmRemoveFl = async () => {
    if (gerente) return
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

  const handleOpenClearDevice = (fl: AdminFreelancer) => {
    setFlToClearDevice(fl)
    setClearDeviceModalOpen(true)
  }

  const handleConfirmClearDevice = async () => {
    if (!flToClearDevice) return
    setClearingDevice(true)
    try {
      await clearFreelancerDevice(flToClearDevice.id, {
        companyId: id,
      })
      toast({
        title: 'Dispositivo liberado',
        description:
          'Dispositivo liberado com sucesso e registrado no histórico de auditoria. O freelancer já pode acessar de um novo aparelho.',
      })
      setFreelancers((prev) =>
        prev.map((f) => (f.id === flToClearDevice.id ? { ...f, deviceId: null } : f)),
      )
      // Se a aba de liberações já foi carregada, recarrega
      void loadReleases()
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

  const formatElapsedTime = (startIso?: string | null) => {
    if (!startIso) return ''
    const diffMs = nowTick - new Date(startIso).getTime()
    if (diffMs < 0) return '0 min'
    const totalMins = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(totalMins / 60)
    const mins = totalMins % 60
    if (hours > 0) {
      return `${hours}h ${mins < 10 ? '0' : ''}${mins}m`
    }
    return `${Math.max(1, mins)} min`
  }

  const handleOpenManualAttendance = (fl: AdminFreelancer) => {
    if (gerente) return
    setFlForManualAtt(fl)
    setManualAttType(fl.hasOpenCheckIn ? 'check_out' : 'check_in')
    setManualAttendanceModalOpen(true)
  }

  const handleConfirmManualAttendance = async () => {
    if (gerente) return
    if (!flForManualAtt || !id) return
    setRegisteringManual(true)
    try {
      const isCheckIn = manualAttType === 'check_in'
      const res = await registerManualAttendance({
        freelancerId: flForManualAtt.id,
        companyId: id,
        type: manualAttType,
      })

      const nowIso = new Date().toISOString()
      toast({
        title: isCheckIn ? 'Check-in manual registrado!' : 'Check-out manual registrado!',
        description: isCheckIn
          ? `${flForManualAtt.name} agora está em atividade nesta unidade.`
          : `${flForManualAtt.name} teve sua saída registrada com sucesso.${res.durationFormatted ? ` Duração: ${res.durationFormatted}` : ''}`,
      })

      setFreelancers((prev) =>
        prev.map((f) =>
          f.id === flForManualAtt.id
            ? {
                ...f,
                hasOpenCheckIn: isCheckIn,
                lastCheckInTime: isCheckIn ? nowIso : null,
              }
            : f,
        ),
      )
      void loadCompanyData()
      setManualAttendanceModalOpen(false)
    } catch (err) {
      toast({
        title: 'Erro ao registrar ponto manual',
        description: err instanceof Error ? err.message : 'Falha na operação.',
        variant: 'destructive',
      })
    } finally {
      setRegisteringManual(false)
    }
  }

  // --- Handlers: Managers ---
  const handleOpenCreateMgr = () => {
    if (gerente) return
    setNewMgrName('')
    setNewMgrEmail('')
    setNewMgrProfile('gestor')
    setNewMgrPassword('')
    setMgrCreateErrors({})
    setCreateMgrModalOpen(true)
  }

  const handleCreateMgrSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (gerente) return
    if (!id) return

    const errs: Record<string, string> = {}
    if (!newMgrName.trim()) errs.name = 'Nome é obrigatório.'
    if (!newMgrEmail.trim() || !newMgrEmail.includes('@')) errs.email = 'E-mail inválido.'
    if (newMgrPassword && newMgrPassword.length < 8) {
      errs.password = 'A senha deve ter no mínimo 8 caracteres caso informada.'
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
        password: newMgrPassword.trim() || undefined,
        profile: newMgrProfile,
        role: newMgrProfile === 'gerente' ? 'viewer' : 'owner',
      })

      const isGerente = newMgrProfile === 'gerente'

      toast({
        title: isGerente ? 'Gerente cadastrado!' : 'Gestor cadastrado!',
        description: `${res.manager.name} foi vinculado à empresa com sucesso.`,
      })

      setCreateMgrModalOpen(false)
      await loadManagers()

      // Exibe modal com link de convite para QUALQUER perfil (Gestor ou Gerente)
      if (res.inviteLink || res.inviteToken) {
        const fullLink = res.inviteLink
          ? `${window.location.origin}${res.inviteLink}`
          : `${window.location.origin}/admin/convite?token=${res.inviteToken}`
        setGeneratedInviteLink(fullLink)
        setCreatedManagerInfo({
          name: res.manager.name,
          email: res.manager.email,
        })
        setCopiedInvite(false)
        setInviteModalOpen(true)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao cadastrar.'
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
    if (gerente) return
    setEditingMgr(mgr)
    setEditMgrName(mgr.name || '')
    setEditMgrEmail(mgr.email || '')
    setEditMgrProfile(mgr.profile === 'gerente' || mgr.role === 'viewer' ? 'gerente' : 'gestor')
    setEditMgrPassword('')
    setMgrEditErrors({})
    setEditMgrModalOpen(true)
  }

  const handleSaveEditMgr = async (e: React.FormEvent) => {
    e.preventDefault()
    if (gerente) return
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
        profile: editMgrProfile,
        password: editMgrPassword || undefined,
      })

      toast({
        title: 'Usuário atualizado!',
        description: `Dados de ${editMgrName} atualizados com sucesso.`,
      })

      setManagers((prev) =>
        prev.map((m) =>
          m.id === editingMgr.id
            ? {
                ...m,
                name: editMgrName.trim(),
                email: editMgrEmail.trim().toLowerCase(),
                profile: editMgrProfile,
                role: editMgrProfile === 'gerente' ? 'viewer' : 'owner',
              }
            : m,
        ),
      )
      setEditMgrModalOpen(false)
    } catch (err) {
      toast({
        title: 'Erro ao atualizar',
        description: err instanceof Error ? err.message : 'Falha na atualização.',
        variant: 'destructive',
      })
    } finally {
      setSavingMgrEdit(false)
    }
  }

  const handleOpenDupMgr = (mgr: AdminManager) => {
    if (gerente) return
    setSelectedDupMgr(mgr)
    const other = allCompanies.find((c) => c.id !== id)
    setTargetDupMgrCompId(other ? other.id : '')
    setDupMgrModalOpen(true)
  }

  const handleConfirmDupMgr = async () => {
    if (gerente) return
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
    if (gerente) return
    setMgrToRemove(mgr)
    setRemoveMgrModalOpen(true)
  }

  const handleConfirmRemoveMgr = async () => {
    if (gerente) return
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
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">Carregando painel da empresa...</p>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-200 text-center space-y-4">
        <p className="font-bold text-indigo-700 text-base">{error || 'Empresa não encontrada.'}</p>
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-slate-900 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0">
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
              {company.cnpj && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  CNPJ: {maskAlphanumericCnpj(company.cnpj)}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                {company.endereco}, {company.cidade} - {company.estado}
                {company.cep && ` (CEP: ${company.cep})`}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons: Edit Company & Switch */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {!gerente && (
            <button
              type="button"
              onClick={handleOpenEditCompany}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar empresa</span>
            </button>
          )}
          {(!gerente || allCompanies.length > 1) && (
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
                    onClick={() =>
                      navigate(
                        gerente
                          ? `/admin/empresa/${c.id}?tab=freelancers`
                          : `/admin/empresa/${c.id}`,
                      )
                    }
                    className={`rounded-xl text-xs font-semibold cursor-pointer ${
                      c.id === company.id
                        ? 'bg-indigo-50 text-indigo-600 font-bold'
                        : 'text-slate-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    <span className="truncate">{c.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {!gerente && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Voltar ao dashboard geral"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
        {!gerente && (
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
        )}

        <button
          type="button"
          onClick={() => setActiveTab('freelancers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === 'freelancers'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
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

        {!gerente && (
          <button
            type="button"
            onClick={() => setActiveTab('gestores')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'gestores'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Gestores</span>
            {managers.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'gestores'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {managers.length}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('historico')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === 'historico'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Histórico</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('liberacoes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === 'liberacoes'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Liberações de Dispositivo</span>
          {deviceReleases.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'liberacoes'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {deviceReleases.length}
            </span>
          )}
        </button>
      </div>
      {/* TAB 1: VISÃO GERAL */}
      {activeTab === 'overview' && !gerente && (
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
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Module 1: Freelancers Management */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
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
                  className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
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
                  className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <History className="w-4 h-4" />
                  <span>Consultar Histórico</span>
                </button>
              </div>
            </div>

            {/* Module 4: Device Releases Records */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Liberações de Aparelho</h3>
                    <p className="text-xs text-slate-500">
                      Auditoria de desvinculações de dispositivos por gestores.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('liberacoes')}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Ver Liberações</span>
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
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
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
                className="w-full h-10 pl-10 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
            <span className="text-xs font-bold text-slate-500">
              {filteredFreelancers.length} cadastrado(s)
            </span>
          </div>

          {/* Table */}
          {loadingFreelancers ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl"
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

                        <td className="py-4 px-4">
                          {fl.hasOpenCheckIn ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full w-fit">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Em atividade</span>
                              </span>
                              {fl.lastCheckInTime && (
                                <span className="text-[10px] text-emerald-600/90 font-medium pl-1">
                                  há {formatElapsedTime(fl.lastCheckInTime)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>Aguardando</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick Manual Check-in / Check-out Button */}
                            {!gerente &&
                              (fl.hasOpenCheckIn ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenManualAttendance(fl)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200/80 transition-colors active:scale-95 cursor-pointer"
                                  title="Fazer Check-out manual para este freelancer"
                                >
                                  <Clock className="w-3.5 h-3.5 text-red-600" />
                                  <span>Fazer Check-out</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenManualAttendance(fl)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-colors active:scale-95 cursor-pointer"
                                  title="Fazer Check-in manual para este freelancer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Fazer Check-in</span>
                                </button>
                              ))}
                            {Boolean(fl.deviceId) && (
                              <button
                                type="button"
                                onClick={() => handleOpenClearDevice(fl)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-colors cursor-pointer"
                                title="Limpar dispositivo registrado do freelancer"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                                <span className="hidden sm:inline">Limpar dispositivo</span>
                              </button>
                            )}

                            {!gerente && (
                              <>
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
                                  className="p-1.5 rounded-lg text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                                  title="Remover vínculo com esta empresa"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
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
      {activeTab === 'gestores' && !gerente && (
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
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
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
                className="w-full h-10 pl-10 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
            <span className="text-xs font-bold text-slate-500">
              {filteredManagers.length} gestor(es)
            </span>
          </div>

          {/* Table */}
          {loadingManagers ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl"
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
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
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
                          {mgr.profile === 'gerente' || mgr.role === 'viewer' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase">
                              <UserCheck className="w-3 h-3 text-amber-600" />
                              <span>Gerente</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full uppercase">
                              <Shield className="w-3 h-3 text-indigo-600" />
                              <span>Gestor</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await getManagerInviteLink(mgr.id)
                                  const fullLink = `${window.location.origin}${res.inviteLink}`
                                  setGeneratedInviteLink(fullLink)
                                  setCreatedManagerInfo({ name: mgr.name, email: mgr.email })
                                  setCopiedInvite(false)
                                  setInviteModalOpen(true)
                                } catch (err) {
                                  toast({
                                    title: 'Erro ao gerar link',
                                    description:
                                      err instanceof Error ? err.message : 'Falha ao obter link.',
                                    variant: 'destructive',
                                  })
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                              title="Obter link de convite"
                            >
                              <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="hidden sm:inline">Link de Convite</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditMgr(mgr)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                              title="Editar perfil ou dados"
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
                              className="p-1.5 rounded-lg text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
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
                <Filter className="w-4 h-4 text-indigo-600" />
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
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
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
                  className="w-full h-10 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
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
                  className="w-full h-10 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* History Table */}
          {loadingHistory ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
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
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                              {record.lat !== null &&
                              record.lat !== undefined &&
                              record.lng !== null &&
                              record.lng !== undefined &&
                              (record.lat !== 0 || record.lng !== 0) ? (
                                <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 px-2 py-1 rounded-lg text-slate-700">
                                  <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
                                  <span>
                                    {Number(record.lat).toFixed(4)}, {Number(record.lng).toFixed(4)}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">
                                  {record.manual ? 'Manual (Sem GPS)' : 'Dispositivo'}
                                </span>
                              )}
                              {record.manual && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200/60 w-fit">
                                  Manual
                                </span>
                              )}
                            </div>
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

      {/* TAB 5: HISTÓRICO DE LIBERAÇÃO DE DISPOSITIVOS */}
      {activeTab === 'liberacoes' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">
                  Histórico de Liberações de Dispositivo
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  <Shield className="w-3 h-3 text-amber-600" />
                  Auditoria
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Registro de quando e qual gestor autorizou a troca ou limpeza do aparelho do
                colaborador.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadReleases()}
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
                <Filter className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Filtros de Liberações
                </span>
              </div>

              {(selectedRelFreelancerId !== 'all' || relStartDate || relEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRelFreelancerId('all')
                    setRelStartDate('')
                    setRelEndDate('')
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  Limpar Filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Freelancer Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Profissional
                </label>
                <Select value={selectedRelFreelancerId} onValueChange={setSelectedRelFreelancerId}>
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

              {/* Start Date */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={relStartDate}
                  onChange={(e) => setRelStartDate(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={relEndDate}
                  onChange={(e) => setRelEndDate(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Releases Table */}
          {loadingReleases ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-700">
                Carregando histórico de liberações...
              </p>
            </div>
          ) : deviceReleases.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm">
              <RotateCcw className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Nenhuma liberação registrada</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Quando um gestor clicar em "Limpar dispositivo" na lista de freelancers, o evento
                será auditado e listado aqui com todos os detalhes.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Freelancer Liberado</th>
                      <th className="py-3.5 px-4">Gestor Responsável</th>
                      <th className="py-3.5 px-4">Data e Hora</th>
                      <th className="py-3.5 px-4 sm:px-6">Dispositivo Anterior</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deviceReleases.map((rel) => {
                      const { date, time } = formatDateTime(rel.created)

                      return (
                        <tr key={rel.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                                {rel.freelancerName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">
                                  {rel.freelancerName}
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono">
                                  {rel.freelancerPhone || rel.freelancerRoleTitle || ''}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                                {rel.managerName?.charAt(0) || 'G'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">
                                  {rel.managerName || 'Gestor'}
                                </p>
                                {rel.managerEmail && (
                                  <p className="text-[11px] text-slate-400 font-normal">
                                    {rel.managerEmail}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 font-mono text-slate-700">
                            <span className="font-bold text-slate-900">{date}</span>
                            <span className="text-slate-400 ml-2 font-medium">{time}</span>
                          </td>

                          <td className="py-4 px-4 sm:px-6">
                            {rel.previousDeviceId ? (
                              <div className="flex items-center gap-1.5">
                                <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span
                                  className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 truncate max-w-[200px]"
                                  title={rel.previousDeviceId}
                                >
                                  {rel.previousDeviceId}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                Dispositivo não identificado / prévio
                              </span>
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
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
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
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
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
                    className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
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
                    className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
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
                    className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
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
                    className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
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
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 order-1 sm:order-2 disabled:opacity-50 cursor-pointer"
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
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white border border-slate-100 shadow-2xl">
          <DialogHeader className="text-center sm:text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Copy className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900 text-center">
              Duplicar Freelancer
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 text-center pt-1">
              Selecione as outras unidades sob sua gestão onde deseja vincular{' '}
              <strong>{selectedDupFl?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Empresas de destino
              </label>
              {availableOtherCompanies.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (targetDupFlCompIds.length === availableOtherCompanies.length) {
                      setTargetDupFlCompIds([])
                    } else {
                      setTargetDupFlCompIds(availableOtherCompanies.map((c) => c.id))
                    }
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  {targetDupFlCompIds.length === availableOtherCompanies.length
                    ? 'Desmarcar todas'
                    : 'Selecionar todas'}
                </button>
              )}
            </div>

            {availableOtherCompanies.length === 0 ? (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3.5 rounded-2xl">
                Você gerencia apenas esta empresa no momento. Cadastre novas empresas no painel para
                duplicar colaboradores.
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                {availableOtherCompanies.map((c) => {
                  const isChecked = targetDupFlCompIds.includes(c.id)
                  return (
                    <label
                      key={c.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-white border-indigo-300 shadow-sm ring-1 ring-indigo-500/10'
                          : 'bg-white/60 border-slate-200/70 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTargetDupFlCompIds((prev) => [...prev, c.id])
                            } else {
                              setTargetDupFlCompIds((prev) => prev.filter((item) => item !== c.id))
                            }
                          }}
                          className="sr-only"
                        />
                        <div className="shrink-0 text-indigo-600">
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{c.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {c.city
                              ? `${c.city}${c.state ? ` - ${c.state}` : ''}`
                              : 'Unidade gerenciada'}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isChecked && (
                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                            Selecionada
                          </span>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              {targetDupFlCompIds.length}{' '}
              {targetDupFlCompIds.length === 1 ? 'unidade selecionada' : 'unidades selecionadas'}. O
              freelancer será vinculado a todas de uma só vez.
            </p>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-2">
            <button
              type="button"
              disabled={
                duplicatingFl ||
                targetDupFlCompIds.length === 0 ||
                availableOtherCompanies.length === 0
              }
              onClick={handleConfirmDupFl}
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/20"
            >
              {duplicatingFl ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Vinculando empresas...</span>
                </>
              ) : (
                <span>
                  Vincular a {targetDupFlCompIds.length}{' '}
                  {targetDupFlCompIds.length === 1 ? 'empresa' : 'empresas'}
                </span>
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
      {/* --- MODAL DE EDIÇÃO DA EMPRESA --- */}
      <Dialog open={editCompanyModalOpen} onOpenChange={setEditCompanyModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-2xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
              <Building2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
              Editar Empresa
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500">
              Atualize as informações cadastrais, endereço com busca de CEP, CNPJ e coordenadas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCompanyEdit} className="space-y-6 pt-2">
            <div className="space-y-4">
              {/* Nome e CNPJ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nome da empresa <span className="text-red-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={editCompName}
                      onChange={(e) => {
                        setEditCompName(e.target.value)
                        if (compEditErrors.name)
                          setCompEditErrors((prev) => ({ ...prev, name: '' }))
                      }}
                      placeholder="Ex: Freela Check Matriz"
                      className={`w-full h-11 pl-10 pr-4 bg-slate-50 rounded-xl border text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
                        compEditErrors.name
                          ? 'border-red-500 focus:border-indigo-600 ring-2 ring-red-500/10'
                          : 'border-slate-200 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                  {compEditErrors.name && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{compEditErrors.name}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    CNPJ{' '}
                    <span className="text-slate-400 font-normal">(opcional / alfanumérico)</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <FileText className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={editCompCnpj}
                      onChange={(e) => {
                        const val = maskAlphanumericCnpj(e.target.value)
                        setEditCompCnpj(val)
                        if (compEditErrors.cnpj)
                          setCompEditErrors((prev) => ({ ...prev, cnpj: '' }))
                      }}
                      placeholder="00.000.000/0001-00 ou alfanumérico"
                      className={`w-full h-11 pl-10 pr-4 bg-slate-50 rounded-xl border text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all font-mono ${
                        compEditErrors.cnpj
                          ? 'border-red-500 focus:border-indigo-600 ring-2 ring-red-500/10'
                          : 'border-slate-200 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                  {compEditErrors.cnpj && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{compEditErrors.cnpj}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* CEP (Com busca ViaCEP) e Bairro */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    CEP
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={editCompCep}
                      onChange={(e) => {
                        const val = e.target.value
                        setEditCompCep(val)
                        const clean = val.replace(/\D/g, '')
                        if (clean.length === 8) {
                          void handleEditCepLookup(clean)
                        }
                      }}
                      onBlur={() => {
                        if (editCompCep.trim()) {
                          void handleEditCepLookup(editCompCep)
                        }
                      }}
                      placeholder="00000-000"
                      className="w-full h-11 pl-3 pr-10 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white font-mono"
                    />
                    {isLookingUpCep && (
                      <div className="absolute right-3 text-indigo-600 pointer-events-none">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Preenchimento automático via ViaCEP
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={editCompNeighborhood}
                    onChange={(e) => setEditCompNeighborhood(e.target.value)}
                    placeholder="Ex: Bela Vista"
                    className="w-full h-11 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Endereço: Rua e Número */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Rua / Endereço <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editCompStreet}
                    onChange={(e) => {
                      setEditCompStreet(e.target.value)
                      if (compEditErrors.street)
                        setCompEditErrors((prev) => ({ ...prev, street: '' }))
                    }}
                    placeholder="Ex: Av. Paulista"
                    className={`w-full h-11 px-3 bg-slate-50 rounded-xl border text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white ${
                      compEditErrors.street
                        ? 'border-red-500'
                        : 'border-slate-200 focus:border-indigo-600'
                    }`}
                  />
                  {compEditErrors.street && (
                    <p className="text-xs text-red-600 mt-1">{compEditErrors.street}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Número <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editCompNumber}
                    onChange={(e) => {
                      setEditCompNumber(e.target.value)
                      if (compEditErrors.number)
                        setCompEditErrors((prev) => ({ ...prev, number: '' }))
                    }}
                    placeholder="Ex: 1000"
                    className={`w-full h-11 px-3 bg-slate-50 rounded-xl border text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white ${
                      compEditErrors.number
                        ? 'border-red-500'
                        : 'border-slate-200 focus:border-indigo-600'
                    }`}
                  />
                  {compEditErrors.number && (
                    <p className="text-xs text-red-600 mt-1">{compEditErrors.number}</p>
                  )}
                </div>
              </div>

              {/* Cidade, Estado e Plano */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Cidade <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editCompCity}
                    onChange={(e) => {
                      setEditCompCity(e.target.value)
                      if (compEditErrors.city) setCompEditErrors((prev) => ({ ...prev, city: '' }))
                    }}
                    placeholder="Ex: São Paulo"
                    className={`w-full h-11 px-3 bg-slate-50 rounded-xl border text-xs font-medium text-slate-900 focus:outline-none focus:bg-white ${
                      compEditErrors.city
                        ? 'border-red-500'
                        : 'border-slate-200 focus:border-indigo-600'
                    }`}
                  />
                  {compEditErrors.city && (
                    <p className="text-xs text-red-600 mt-1">{compEditErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Estado <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={editCompState}
                    onChange={(e) => {
                      setEditCompState(e.target.value.toUpperCase())
                      if (compEditErrors.state)
                        setCompEditErrors((prev) => ({ ...prev, state: '' }))
                    }}
                    placeholder="SP"
                    className="w-full h-11 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 uppercase focus:outline-none focus:border-indigo-600 focus:bg-white text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Plano <span className="text-red-600">*</span>
                  </label>
                  <Select
                    value={editCompPlan}
                    onValueChange={(v) => setEditCompPlan(v as 'free' | 'pro' | 'enterprise')}
                  >
                    <SelectTrigger className="w-full h-11 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold">
                      <SelectValue placeholder="Selecione o plano" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl border border-slate-200">
                      <SelectItem value="free" className="text-xs font-medium cursor-pointer">
                        Básico (10 freelas)
                      </SelectItem>
                      <SelectItem value="pro" className="text-xs font-medium cursor-pointer">
                        Pro (50 freelas)
                      </SelectItem>
                      <SelectItem value="enterprise" className="text-xs font-medium cursor-pointer">
                        Enterprise (200)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Indicador e Ajuste de Coordenadas Geográficas (Nominatim) */}
              <div className="p-3.5 rounded-xl border transition-all duration-200 bg-slate-50 border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isGeocoding ? (
                      <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                    ) : editHasCoordinates ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <MapPin className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-xs font-medium">
                      {isGeocoding ? (
                        <span className="text-slate-600">Buscando coordenadas do endereço...</span>
                      ) : editHasCoordinates ? (
                        <span className="text-emerald-700 font-bold">Coordenadas obtidas ✓</span>
                      ) : (
                        <span className="text-slate-500">
                          Preencha o endereço completo para calcular as coordenadas automaticamente.
                        </span>
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (editCompStreet && editCompNumber && editCompCity && editCompState) {
                        void performEditGeocoding(
                          editCompStreet,
                          editCompNumber,
                          editCompNeighborhood,
                          editCompCity,
                          editCompState,
                        )
                      }
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline"
                  >
                    Recalcular GPS
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Latitude
                    </label>
                    <input
                      type="text"
                      value={editCompLat}
                      onChange={(e) => {
                        setEditCompLat(e.target.value)
                        setEditHasCoordinates(Boolean(e.target.value && editCompLng))
                      }}
                      placeholder="-23.5505"
                      className="w-full h-9 px-3 bg-white rounded-lg border border-slate-200 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Longitude
                    </label>
                    <input
                      type="text"
                      value={editCompLng}
                      onChange={(e) => {
                        setEditCompLng(e.target.value)
                        setEditHasCoordinates(Boolean(editCompLat && e.target.value))
                      }}
                      placeholder="-46.6333"
                      className="w-full h-9 px-3 bg-white rounded-lg border border-slate-200 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                {compEditErrors.coordinates && (
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{compEditErrors.coordinates}</span>
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditCompanyModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors order-2 sm:order-1 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingCompanyEdit}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 order-1 sm:order-2 cursor-pointer disabled:opacity-50"
              >
                {savingCompanyEdit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando alterações...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Salvar Empresa</span>
                  </>
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Manual Attendance Registration Modal */}
      <Dialog open={manualAttendanceModalOpen} onOpenChange={setManualAttendanceModalOpen}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-3xl p-6 bg-white border border-slate-100 shadow-2xl">
          <DialogHeader className="text-center sm:text-center">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
                manualAttType === 'check_in'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              {manualAttType === 'check_in' ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <Clock className="w-6 h-6" />
              )}
            </div>
            <DialogTitle className="text-xl font-black text-slate-900 text-center">
              {manualAttType === 'check_in' ? 'Check-in Manual' : 'Check-out Manual'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 text-center pt-1 leading-relaxed">
              Confirmar registro manual de {manualAttType === 'check_in' ? 'entrada' : 'saída'} para{' '}
              <strong className="text-slate-900">{flForManualAtt?.name}</strong> na empresa{' '}
              <strong className="text-slate-900">{company.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 my-2 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-500">Tipo de ação:</span>
              <span
                className={`font-bold ${
                  manualAttType === 'check_in' ? 'text-emerald-700' : 'text-indigo-700'
                }`}
              >
                {manualAttType === 'check_in' ? 'Entrada (Check-in)' : 'Saída (Check-out)'}
              </span>
            </div>
            {manualAttType === 'check_out' && flForManualAtt?.lastCheckInTime && (
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-500">Tempo em atividade:</span>
                <span className="font-bold text-slate-900">
                  {formatElapsedTime(flForManualAtt.lastCheckInTime)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-200/50">
              <span>Modo:</span>
              <span className="font-medium text-slate-500">Manual pelo Gestor</span>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-2">
            <button
              type="button"
              disabled={registeringManual}
              onClick={handleConfirmManualAttendance}
              className={`w-full h-11 rounded-xl active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 ${
                manualAttType === 'check_in'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
              }`}
            >
              {registeringManual ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : manualAttType === 'check_in' ? (
                'Confirmar Check-in'
              ) : (
                'Confirmar Check-out'
              )}
            </button>
            <button
              type="button"
              onClick={() => setManualAttendanceModalOpen(false)}
              className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
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

      {/* Remove Freelancer Modal */}
      <Dialog open={removeFlModalOpen} onOpenChange={setRemoveFlModalOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-6 bg-white border border-slate-100">
          <DialogHeader className="text-center sm:text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
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
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
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
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
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
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
              {mgrCreateErrors.name && (
                <p className="text-xs text-red-600 mt-1">{mgrCreateErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Perfil de Acesso <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewMgrProfile('gestor')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    newMgrProfile === 'gestor'
                      ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Gestor</span>
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    Acesso completo (empresas, gestores, freelancers e histórico).
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewMgrProfile('gerente')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    newMgrProfile === 'gerente'
                      ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <UserCheck className="w-4 h-4 text-amber-600" />
                    <span>Gerente</span>
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    Apenas freelancers (criação e atribuição) e relatório de check-in/out.
                  </span>
                </button>
              </div>
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
                  placeholder="acesso@exemplo.com"
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
              {mgrCreateErrors.email && (
                <p className="text-xs text-red-600 mt-1">{mgrCreateErrors.email}</p>
              )}
            </div>

            <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-indigo-600" />
                Link de ativação/convite automático
              </p>
              <p className="text-[11px] text-indigo-700">
                Um link de convite será gerado automaticamente para o usuário (
                {newMgrProfile === 'gerente' ? 'Gerente' : 'Gestor'}) ativar e definir sua própria
                senha.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Senha inicial <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={newMgrPassword}
                  onChange={(e) => {
                    setNewMgrPassword(e.target.value)
                    if (mgrCreateErrors.password)
                      setMgrCreateErrors((prev) => ({ ...prev, password: '' }))
                  }}
                  placeholder="Deixe em branco para gerar senha temporária automática"
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
              {mgrCreateErrors.password ? (
                <p className="text-xs text-red-600 mt-1">{mgrCreateErrors.password}</p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1">
                  Se não informada, o sistema gera uma senha provisória e fornece o link de convite
                  para ativação.
                </p>
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
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 order-1 sm:order-2 disabled:opacity-50 cursor-pointer"
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
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
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
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
              {mgrEditErrors.name && (
                <p className="text-xs text-red-600 mt-1">{mgrEditErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Perfil de Acesso <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditMgrProfile('gestor')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    editMgrProfile === 'gestor'
                      ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Gestor</span>
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    Acesso completo a todas as áreas administrativas.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditMgrProfile('gerente')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    editMgrProfile === 'gerente'
                      ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <UserCheck className="w-4 h-4 text-amber-600" />
                    <span>Gerente</span>
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    Apenas freelancers e relatório de presença.
                  </span>
                </button>
              </div>
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
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
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
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
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
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 order-1 sm:order-2 disabled:opacity-50 cursor-pointer"
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
      {/* Modal de Exibição do Link de Convite Gerado para Gestor ou Gerente */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white border border-slate-100 shadow-2xl">
          <DialogHeader className="text-center sm:text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <LinkIcon className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900 text-center">
              Link de Convite e Ativação
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 text-center pt-1 leading-relaxed">
              O acesso para <strong className="text-slate-800">{createdManagerInfo?.name}</strong>{' '}
              foi cadastrado com sucesso. Copie o link abaixo e envie ao usuário para ele definir ou
              alterar sua senha de acesso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Link de ativação exclusivo:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedInviteLink}
                  className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-700 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedInviteLink)
                    setCopiedInvite(true)
                    toast({
                      title: 'Link copiado!',
                      description: 'Link de convite copiado para a área de transferência.',
                    })
                    setTimeout(() => setCopiedInvite(false), 3000)
                  }}
                  className={`px-3.5 h-10 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                    copiedInvite
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {copiedInvite ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Nenhum e-mail foi disparado. Compartilhe esse link pelo WhatsApp ou canal interno da
              sua empresa.
            </p>
          </div>

          <DialogFooter className="mt-2">
            <button
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
            >
              Concluir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Manager Modal */}
      <Dialog open={dupMgrModalOpen} onOpenChange={setDupMgrModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-white border border-slate-100">
          <DialogHeader className="text-center sm:text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
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
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
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
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
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
