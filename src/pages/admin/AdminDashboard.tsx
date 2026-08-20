import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import {
  getAdminCompanies,
  createAdminCompany,
  type CompanyAdminItem,
  type CreateCompanyPayload,
} from '@/services/admin'
import { toast } from '@/hooks/use-toast'
import {
  Building2,
  Users,
  Clock,
  ChevronRight,
  MapPin,
  Loader2,
  Sparkles,
  Plus,
  Compass,
  CheckCircle2,
  AlertCircle,
  Lock,
  Mail,
  User,
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

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { manager, authState, role } = useApp()
  const [companies, setCompanies] = useState<CompanyAdminItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // New Company Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // Form Fields
  const [companyName, setCompanyName] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('SC')
  const [cep, setCep] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [plan, setPlan] = useState<'free' | 'pro' | 'enterprise'>('pro')
  const [managerName, setManagerName] = useState('')
  const [managerEmail, setManagerEmail] = useState('')
  const [managerPassword, setManagerPassword] = useState('')

  // Protect admin route
  useEffect(() => {
    if (authState === 'unauthenticated' || role !== 'manager') {
      // Check if PB has auth
      const token = localStorage.getItem('pocketbase_auth')
      if (!token && authState !== 'loading') {
        navigate('/admin/login')
      }
    }
  }, [authState, role, navigate])

  const loadCompanies = async () => {
    setLoading(true)
    try {
      const data = await getAdminCompanies(manager?.id)
      setCompanies(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar empresas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCompanies()
  }, [manager?.id])

  const handleOpenCreateModal = () => {
    setCompanyName('')
    setStreet('')
    setNumber('')
    setNeighborhood('')
    setCity('')
    setState('SC')
    setCep('')
    setLat('-27.6830')
    setLng('-48.5045')
    setPlan('pro')
    setManagerName('')
    setManagerEmail('')
    setManagerPassword('')
    setFormErrors({})
    setCreateModalOpen(true)
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocalização não suportada',
        description: 'Seu navegador não suporta captura automática de coordenadas.',
        variant: 'destructive',
      })
      return
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6))
        setLng(pos.coords.longitude.toFixed(6))
        setIsGettingLocation(false)
        if (formErrors.lat || formErrors.lng) {
          setFormErrors((prev) => ({ ...prev, lat: '', lng: '' }))
        }
        toast({
          title: 'Coordenadas obtidas!',
          description: `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`,
        })
      },
      (err) => {
        setIsGettingLocation(false)
        toast({
          title: 'Não foi possível obter localização',
          description: err.message || 'Verifique as permissões de GPS.',
          variant: 'destructive',
        })
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const handleCreateCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}

    if (!companyName.trim()) errors.name = 'Nome da empresa é obrigatório.'
    if (!street.trim()) errors.street = 'Rua/logradouro é obrigatório.'
    if (!number.trim()) errors.number = 'Número é obrigatório.'
    if (!city.trim()) errors.city = 'Cidade é obrigatória.'
    if (!state.trim()) errors.state = 'Estado é obrigatório.'

    const parsedLat = parseFloat(lat)
    const parsedLng = parseFloat(lng)
    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      errors.lat = 'Latitude inválida (ex: -27.6830).'
    }
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      errors.lng = 'Longitude inválida (ex: -48.5045).'
    }

    if (!managerName.trim()) errors.managerName = 'Nome do gestor é obrigatório.'
    if (!managerEmail.trim() || !managerEmail.includes('@')) {
      errors.managerEmail = 'E-mail do gestor é inválido.'
    }
    if (!managerPassword || managerPassword.length < 6) {
      errors.managerPassword = 'Senha deve ter no mínimo 6 caracteres.'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)
    setFormErrors({})

    try {
      const payload: CreateCompanyPayload = {
        name: companyName.trim(),
        street: street.trim(),
        number: number.trim(),
        neighborhood: neighborhood.trim() || undefined,
        city: city.trim(),
        state: state.trim().toUpperCase(),
        cep: cep.trim() || undefined,
        lat: parsedLat,
        lng: parsedLng,
        plan,
        managerName: managerName.trim(),
        managerEmail: managerEmail.trim().toLowerCase(),
        managerPassword,
        currentAdminId: manager?.id,
      }

      const res = await createAdminCompany(payload)
      toast({
        title: 'Empresa cadastrada com sucesso!',
        description: `A empresa ${res.company.name} e a licença foram criadas com sucesso.`,
      })
      setCreateModalOpen(false)
      await loadCompanies()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao cadastrar empresa.'
      if (
        msg.toLowerCase().includes('gestor com este email') ||
        msg.toLowerCase().includes('email')
      ) {
        setFormErrors((prev) => ({
          ...prev,
          managerEmail: 'Já existe um gestor com este email.',
        }))
      } else {
        toast({
          title: 'Erro ao cadastrar empresa',
          description: msg,
          variant: 'destructive',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalFreelancersAll = companies.reduce((acc, c) => acc + (c.freelancersCount || 0), 0)

  const formatLastCheckIn = (isoString?: string | null) => {
    if (!isoString) return 'Nenhum registro recente'
    const d = new Date(isoString)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600/30 text-red-300 border border-red-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Visão Geral do Gestor
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Olá, {manager?.name || 'Administrador'}!
          </h1>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
            Bem-vindo ao Biz Check Admin. Gerencie as empresas, freelancers vinculados e acompanhe
            registros de presença em tempo real.
          </p>
        </div>

        {/* Quick summary cards inside banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-700/60 relative z-10">
          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60">
            <p className="text-xs text-slate-400 font-medium">Empresas Gerenciadas</p>
            <p className="text-2xl font-black text-white mt-1 tabular-nums">{companies.length}</p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60">
            <p className="text-xs text-slate-400 font-medium">Total de Freelancers</p>
            <p className="text-2xl font-black text-white mt-1 tabular-nums">
              {totalFreelancersAll}
            </p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60 col-span-2 sm:col-span-1">
            <p className="text-xs text-slate-400 font-medium">Status do Sistema</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400">Online & Ativo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Companies List Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Empresas sob sua gestão
            </h2>
            <p className="text-xs text-slate-500">
              Selecione uma empresa para acessar os freelancers e o histórico completo de presenças.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nova empresa</span>
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-700">Carregando empresas...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-2xl p-6 border border-red-200 text-center text-red-700">
            <p className="font-bold text-sm">{error}</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Nenhuma empresa associada</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Sua conta ainda não possui empresas cadastradas. Cadastre a primeira empresa para
              iniciar.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nova empresa</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((comp) => (
              <div
                key={comp.id}
                onClick={() => navigate(`/admin/empresa/${comp.id}`)}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 hover:border-red-500/50 hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 via-red-700 to-slate-900 text-white font-black text-lg flex items-center justify-center shadow-md shadow-red-600/20 group-hover:scale-105 transition-transform">
                        {comp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-red-600 transition-colors">
                          {comp.name}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {comp.city} - {comp.state}
                          </span>
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {comp.license?.plan || 'PRO'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1 mb-4 font-normal">
                    {comp.address}
                  </p>
                </div>

                {/* Footer Metrics in Card */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                      <Users className="w-4 h-4 text-red-600" />
                      <span>{comp.freelancersCount} freelancers</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[150px]">
                        {formatLastCheckIn(comp.lastCheckIn)}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 group-hover:translate-x-1 transition-transform">
                    <span>Gerenciar</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Cadastro de Nova Empresa */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-2xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <Building2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
              Cadastrar Nova Empresa
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500">
              Preencha os dados da empresa, coordenadas para validação de check-in e credenciais do
              gestor inicial.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCompanySubmit} className="space-y-6 pt-2">
            {/* Bloco 1: Dados da Empresa */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                1. Informações da Empresa
              </h3>

              {/* Nome */}
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
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value)
                      if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }))
                    }}
                    placeholder="Ex: Biz Check Matriz"
                    className={`w-full h-11 pl-10 pr-4 bg-slate-50 rounded-xl border text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
                      formErrors.name
                        ? 'border-red-500 focus:border-red-600 ring-2 ring-red-500/10'
                        : 'border-slate-200 focus:border-red-600'
                    }`}
                  />
                </div>
                {formErrors.name && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{formErrors.name}</span>
                  </p>
                )}
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
                    value={street}
                    onChange={(e) => {
                      setStreet(e.target.value)
                      if (formErrors.street) setFormErrors((prev) => ({ ...prev, street: '' }))
                    }}
                    placeholder="Ex: Av. Paulista"
                    className={`w-full h-11 px-3 bg-slate-50 rounded-xl border text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white ${
                      formErrors.street ? 'border-red-500' : 'border-slate-200 focus:border-red-600'
                    }`}
                  />
                  {formErrors.street && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.street}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Número <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={number}
                    onChange={(e) => {
                      setNumber(e.target.value)
                      if (formErrors.number) setFormErrors((prev) => ({ ...prev, number: '' }))
                    }}
                    placeholder="Ex: 1000"
                    className={`w-full h-11 px-3 bg-slate-50 rounded-xl border text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white ${
                      formErrors.number ? 'border-red-500' : 'border-slate-200 focus:border-red-600'
                    }`}
                  />
                  {formErrors.number && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.number}</p>
                  )}
                </div>
              </div>

              {/* Bairro, Cidade, Estado, CEP */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Ex: Bela Vista"
                    className="w-full h-11 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Cidade <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value)
                      if (formErrors.city) setFormErrors((prev) => ({ ...prev, city: '' }))
                    }}
                    placeholder="Ex: São Paulo"
                    className={`w-full h-11 px-3 bg-slate-50 rounded-xl border text-xs font-medium text-slate-900 focus:outline-none focus:bg-white ${
                      formErrors.city ? 'border-red-500' : 'border-slate-200 focus:border-red-600'
                    }`}
                  />
                  {formErrors.city && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.city}</p>
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
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value.toUpperCase())
                      if (formErrors.state) setFormErrors((prev) => ({ ...prev, state: '' }))
                    }}
                    placeholder="SP"
                    className="w-full h-11 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 uppercase focus:outline-none focus:border-red-600 focus:bg-white text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    CEP <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="01310-100"
                    className="w-full h-11 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Coordenadas & Plano */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Latitude <span className="text-red-600">*</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    value={lat}
                    onChange={(e) => {
                      setLat(e.target.value)
                      if (formErrors.lat) setFormErrors((prev) => ({ ...prev, lat: '' }))
                    }}
                    placeholder="-27.6830"
                    className={`w-full h-11 px-3 bg-slate-50 rounded-xl border text-xs font-mono text-slate-900 focus:outline-none focus:bg-white ${
                      formErrors.lat ? 'border-red-500' : 'border-slate-200 focus:border-red-600'
                    }`}
                  />
                  {formErrors.lat && <p className="text-xs text-red-600 mt-1">{formErrors.lat}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Longitude <span className="text-red-600">*</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    value={lng}
                    onChange={(e) => {
                      setLng(e.target.value)
                      if (formErrors.lng) setFormErrors((prev) => ({ ...prev, lng: '' }))
                    }}
                    placeholder="-48.5045"
                    className={`w-full h-11 px-3 bg-slate-50 rounded-xl border text-xs font-mono text-slate-900 focus:outline-none focus:bg-white ${
                      formErrors.lng ? 'border-red-500' : 'border-slate-200 focus:border-red-600'
                    }`}
                  />
                  {formErrors.lng && <p className="text-xs text-red-600 mt-1">{formErrors.lng}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Plano da Licença <span className="text-red-600">*</span>
                  </label>
                  <Select
                    value={plan}
                    onValueChange={(v) => setPlan(v as 'free' | 'pro' | 'enterprise')}
                  >
                    <SelectTrigger className="w-full h-11 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold">
                      <SelectValue placeholder="Selecione o plano" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl border border-slate-200">
                      <SelectItem value="free" className="text-xs font-medium cursor-pointer">
                        Básico / Free (Até 10 freelas)
                      </SelectItem>
                      <SelectItem value="pro" className="text-xs font-medium cursor-pointer">
                        Premium / Pro (Até 50 freelas)
                      </SelectItem>
                      <SelectItem value="enterprise" className="text-xs font-medium cursor-pointer">
                        Enterprise (Até 200 freelas)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Botão para capturar GPS atual */}
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500">
                  Usado para validar raio no check-in do app.
                </span>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingLocation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {isGettingLocation ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Compass className="w-3.5 h-3.5 text-red-600" />
                  )}
                  <span>Usar GPS atual</span>
                </button>
              </div>
            </div>

            {/* Bloco 2: Gestor Inicial */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                2. Primeiro Gestor da Empresa
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nome do gestor <span className="text-red-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-slate-400 pointer-events-none">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={managerName}
                      onChange={(e) => {
                        setManagerName(e.target.value)
                        if (formErrors.managerName)
                          setFormErrors((prev) => ({ ...prev, managerName: '' }))
                      }}
                      placeholder="Ex: Carlos Gestor"
                      className={`w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border text-xs font-medium text-slate-900 focus:outline-none focus:bg-white ${
                        formErrors.managerName
                          ? 'border-red-500'
                          : 'border-slate-200 focus:border-red-600'
                      }`}
                    />
                  </div>
                  {formErrors.managerName && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.managerName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    E-mail do gestor <span className="text-red-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-slate-400 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={managerEmail}
                      onChange={(e) => {
                        setManagerEmail(e.target.value)
                        if (formErrors.managerEmail)
                          setFormErrors((prev) => ({ ...prev, managerEmail: '' }))
                      }}
                      placeholder="gestor@empresa.com"
                      className={`w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border text-xs font-medium text-slate-900 focus:outline-none focus:bg-white ${
                        formErrors.managerEmail
                          ? 'border-red-500'
                          : 'border-slate-200 focus:border-red-600'
                      }`}
                    />
                  </div>
                  {formErrors.managerEmail && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.managerEmail}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Senha inicial <span className="text-red-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-slate-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={managerPassword}
                      onChange={(e) => {
                        setManagerPassword(e.target.value)
                        if (formErrors.managerPassword)
                          setFormErrors((prev) => ({ ...prev, managerPassword: '' }))
                      }}
                      placeholder="Mínimo 6 dígitos"
                      className={`w-full h-11 pl-9 pr-3 bg-slate-50 rounded-xl border text-xs font-medium text-slate-900 focus:outline-none focus:bg-white ${
                        formErrors.managerPassword
                          ? 'border-red-500'
                          : 'border-slate-200 focus:border-red-600'
                      }`}
                    />
                  </div>
                  {formErrors.managerPassword && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.managerPassword}</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2 order-1 sm:order-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Criar Empresa & Licença</span>
                  </>
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
