import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import {
  validatePhone,
  registerDevice,
  authenticateFreelancer,
  loginManager,
  logoutManager,
  type ApiUser,
  type ApiCompany,
  type ManagerUser,
} from '@/services/auth'
import {
  getAttendanceStatus,
  registerAttendance,
  type AttendanceStatusResponse,
} from '@/services/attendance'
import { getCompany } from '@/services/companies'
import { storage, STORAGE_KEYS } from '@/lib/storage'
import {
  registerCredential,
  authenticateCredential,
  saveCredential,
  getStoredCredentialId,
  saveDeviceId,
  getLocalDeviceId,
  isPlatformAuthenticatorAvailable,
  isWebAuthnSupported,
  WebAuthnError,
} from '@/lib/webauthn'
import { getCurrentPosition, isWithinRadius, isGeolocationAvailable } from '@/lib/geolocation'
import { logInfo, logWarn, logError } from '@/lib/logger'
import pb from '@/lib/pocketbase/client'

export interface CompanyLocation {
  lat: number
  lng: number
}

export interface Company {
  id: string
  name: string
  city: string
  state: string
  address: string
  location: CompanyLocation
  initial: string
  gradient: string
  colorTheme: 'red' | 'dark' | 'indigo'
}

export interface UserProfile {
  id: string
  name: string
  phone: string
  maskedPhone: string
  initials: string
}

export type PresenceStatus = 'awaiting' | 'checked-in'

export interface AttendanceRecord {
  id?: string
  checkInTime?: Date
  checkOutTime?: Date
  formattedCheckIn?: string
  formattedCheckOut?: string
  durationFormatted?: string
  empresaId?: string
}

export type UserRole = 'freelancer' | 'manager' | null

export type AuthState =
  | 'loading'
  | 'unauthenticated'
  | 'needs-phone'
  | 'needs-biometric'
  | 'authenticated'

export type CheckInResult =
  | { ok: true; time: string }
  | { ok: false; reason: 'location' | 'geo-unavailable' | 'network'; message: string }

export type CheckOutResult =
  | { ok: true; checkOutTime: string; duration: string }
  | { ok: false; reason: 'location' | 'geo-unavailable' | 'network'; message: string }

interface AppContextType {
  // Common & Roles
  role: UserRole
  manager: ManagerUser | null
  user: UserProfile | null
  companies: Company[]
  selectedCompany: Company | null
  presenceStatus: PresenceStatus
  currentRecord: AttendanceRecord | null
  history: AttendanceRecord[]
  authState: AuthState
  authMessage: string
  authError: string
  isAuthBusy: boolean
  hasStoredCredential: boolean
  webauthnSupported: boolean
  pendingPhone: string
  savedPhone: string

  // Actions
  setSelectedCompany: (company: Company | null) => void
  resetAuthError: () => void
  submitPhone: (phone: string) => Promise<void>
  startBiometricFlow: () => Promise<void>
  restoreSession: () => Promise<void>
  performCheckIn: (company: Company) => Promise<CheckInResult>
  performCheckOut: () => Promise<CheckOutResult>
  loginAsManager: (email: string, pass: string) => Promise<void>
  restoreManagerSession: (token: string, user: ManagerUser) => void
  logout: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COMPANY_GRADIENTS = [
  'from-indigo-600 via-indigo-700 to-slate-900',
  'from-slate-900 via-slate-800 to-indigo-800',
  'from-indigo-700 to-violet-600',
  'from-zinc-900 to-indigo-600',
]

function getCompanyGradient(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % COMPANY_GRADIENTS.length
  return COMPANY_GRADIENTS[index]
}

function companyInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || 'B'
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 11) {
    return `(${digits.slice(0, 2)}) *****-${digits.slice(-4)}`
  }
  if (digits.length >= 10) {
    return `(${digits.slice(0, 2)}) ****-${digits.slice(-4)}`
  }
  return phone
}

function toUserProfile(apiUser: ApiUser): UserProfile {
  const parts = apiUser.name.trim().split(/\s+/)
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0]?.[0]?.toUpperCase() || 'U'
  return {
    id: apiUser.id,
    name: apiUser.name,
    phone: apiUser.phone,
    maskedPhone: maskPhone(apiUser.phone),
    initials,
  }
}

function mapCompany(api: ApiCompany): Company {
  return {
    id: api.id,
    name: api.name,
    city: api.cidade,
    state: api.estado,
    address: api.endereco,
    location: { lat: api.location?.lat || 0, lng: api.location?.lng || 0 },
    initial: companyInitial(api.name),
    gradient: getCompanyGradient(api.id),
    colorTheme: 'indigo',
  }
}

const formatTimeString = (date: Date) =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const formatDurationString = (startDate: Date, endDate: Date) => {
  const diffMs = endDate.getTime() - startDate.getTime()
  const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)))
  const hours = Math.floor(diffMins / 60)
  const mins = diffMins % 60
  if (hours > 0) {
    return `${hours}h${mins < 10 ? '0' : ''}${mins}`
  }
  return `${mins} min`
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(null)
  const [manager, setManager] = useState<ManagerUser | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [apiUser, setApiUser] = useState<ApiUser | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus>('awaiting')
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(null)
  const [history, setHistory] = useState<AttendanceRecord[]>([])

  const [authState, setAuthState] = useState<AuthState>('loading')
  const [authMessage, setAuthMessage] = useState('')
  const [authError, setAuthError] = useState('')
  const [isAuthBusy, setIsAuthBusy] = useState(false)
  const [hasStoredCredential, setHasStoredCredential] = useState(false)
  const [pendingPhone, setPendingPhone] = useState('')
  const [savedPhone, setSavedPhone] = useState(
    () => storage.get(STORAGE_KEYS.savedPhone) || storage.get(STORAGE_KEYS.userPhone) || '',
  )

  const webauthnSupported = isWebAuthnSupported()
  const initializedRef = useRef(false)

  const refreshStoredCredential = useCallback(() => {
    setHasStoredCredential(!!getStoredCredentialId())
  }, [])

  // ----- Apply attendance status (after auth or on restore) ---------------
  const applyAttendanceStatus = useCallback(async (status: AttendanceStatusResponse) => {
    if (status.active && status.empresaId && status.checkInTime) {
      try {
        const compApi = await getCompany(status.empresaId)
        const comp: Company = {
          id: compApi.id,
          name: compApi.name,
          city: compApi.cidade,
          state: compApi.estado,
          address: compApi.endereco,
          location: compApi.location,
          initial: companyInitial(compApi.name),
          gradient: getCompanyGradient(compApi.id),
          colorTheme: 'indigo',
        }
        setSelectedCompany(comp)
        const checkInDate = new Date(status.checkInTime)
        setCurrentRecord({
          id: status.record?.id,
          checkInTime: checkInDate,
          formattedCheckIn: formatTimeString(checkInDate),
          empresaId: status.empresaId,
        })
        setPresenceStatus('checked-in')
      } catch {
        const checkInDate = new Date(status.checkInTime)
        setCurrentRecord({
          id: status.record?.id,
          checkInTime: checkInDate,
          formattedCheckIn: formatTimeString(checkInDate),
          empresaId: status.empresaId,
        })
        setPresenceStatus('checked-in')
      }
    } else {
      setPresenceStatus('awaiting')
      setCurrentRecord(null)
    }
  }, [])

  // ----- Session bootstrap --------------------------------------------------
  const restoreSession = useCallback(async () => {
    setIsAuthBusy(true)
    setAuthError('')
    try {
      // Check PocketBase manager auth store first
      if (pb.authStore.isValid && pb.authStore.record) {
        const rec = pb.authStore.record
        const storedMgr: ManagerUser = {
          id: rec.id,
          name: rec.name || (rec.profile === 'gerente' ? 'Gerente' : 'Gestor'),
          email: rec.email,
          role: 'admin',
          profile: (rec.profile as 'gestor' | 'gerente') || 'gestor',
        }
        setManager(storedMgr)
        setRole('manager')
        setAuthState('authenticated')
        return
      }

      // Check Freelancer session
      const storedCredId = getStoredCredentialId()
      const storedUserId = storage.get(STORAGE_KEYS.userId)
      const storedUserName = storage.get(STORAGE_KEYS.userName)

      if (!storedCredId || !storedUserId || !storedUserName) {
        refreshStoredCredential()
        setRole('freelancer')
        setAuthState(storedCredId ? 'needs-biometric' : 'needs-phone')
        return
      }

      setUser({
        id: storedUserId,
        name: storedUserName,
        phone: storage.get(STORAGE_KEYS.userPhone) || '',
        maskedPhone: maskPhone(storage.get(STORAGE_KEYS.userPhone) || ''),
        initials:
          storedUserName
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((p) => p[0])
            .join('')
            .toUpperCase() || 'U',
      })
      setHasStoredCredential(true)
      setRole('freelancer')
      setAuthState('needs-biometric')
    } finally {
      setIsAuthBusy(false)
    }
  }, [refreshStoredCredential])

  // First-mount bootstrap
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      void restoreSession()
    }
  }, [restoreSession])

  // ----- Phone validation (Freelancer) --------------------------------------
  const submitPhone = useCallback(async (phone: string) => {
    setIsAuthBusy(true)
    setAuthError('')
    setAuthMessage('')
    try {
      const res = await validatePhone(phone)
      setApiUser(res.user)
      setUser(toUserProfile(res.user))
      setCompanies(res.companies.map(mapCompany))
      setRole('freelancer')

      if (res.companies.length === 0) {
        setAuthMessage(
          'Nenhuma empresa vinculada ao seu telefone. Verifique com a empresa contratante.',
        )
      }

      storage.set(STORAGE_KEYS.userId, res.user.id)
      storage.set(STORAGE_KEYS.userName, res.user.name)
      storage.set(STORAGE_KEYS.userPhone, res.user.phone)
      storage.set(STORAGE_KEYS.savedPhone, res.user.phone)
      setSavedPhone(res.user.phone)

      if (!isWebAuthnSupported()) {
        setAuthError(
          'Seu dispositivo não suporta autenticação biométrica/chave de segurança. Tente usar outro aparelho.',
        )
        setAuthState('needs-biometric')
        return
      }
      setPendingPhone(phone)
      setAuthState('needs-biometric')
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Falha ao validar telefone. Tente novamente.',
      )
    } finally {
      setIsAuthBusy(false)
    }
  }, [])

  // ----- Biometric register / login (Freelancer) ----------------------------
  const startBiometricFlow = useCallback(async () => {
    setAuthError('')
    setAuthMessage('')
    setIsAuthBusy(true)
    try {
      const platformAvailable = await isPlatformAuthenticatorAvailable()
      if (!platformAvailable) {
        setAuthError(
          'Seu dispositivo não suporta autenticação biométrica. Tente usar outro dispositivo.',
        )
        return
      }

      const localCredId = getStoredCredentialId()
      const localDeviceId = getLocalDeviceId()
      const userId = apiUser?.id || storage.get(STORAGE_KEYS.userId) || ''
      let serverDeviceId = apiUser?.deviceId
      if (!apiUser && userId) {
        try {
          const fl = await pb.collection('freelancers').getOne(userId)
          serverDeviceId = fl.device_id || null
        } catch {
          // silencioso — se falhar, mantém undefined
        }
      }

      if (!serverDeviceId) {
        // 1. First access (no deviceId on server): Register WebAuthn & save new deviceId
        const cred = await registerCredential()
        saveCredential(cred)
        refreshStoredCredential()
        const reg = await registerDevice(userId, cred.rawId)
        saveDeviceId(reg.deviceId)
        setApiUser((prev) => (prev ? { ...prev, deviceId: reg.deviceId } : prev))
      } else if (localCredId) {
        // 2. Server HAS deviceId and local cache HAS credential: Authenticate WebAuthn and verify with backend
        await authenticateCredential(localCredId)
        await authenticateFreelancer(userId, localCredId, localDeviceId || undefined)
      } else {
        // 3. Server HAS deviceId, but local cache was cleared / missing:
        // Allow creating a new WebAuthn credential on this physical device and send localDeviceId if available to backend for comparison
        const cred = await registerCredential()
        saveCredential(cred)
        refreshStoredCredential()
        const reg = await registerDevice(userId, cred.rawId, localDeviceId || undefined)
        saveDeviceId(reg.deviceId)
        setApiUser((prev) => (prev ? { ...prev, deviceId: reg.deviceId } : prev))
      }

      try {
        const status = await getAttendanceStatus(userId)
        await applyAttendanceStatus(status)
      } catch (statusErr) {
        logWarn('auth', 'Falha ao buscar status de presença, prosseguindo com estado padrão', {
          error: statusErr instanceof Error ? statusErr.message : String(statusErr),
        })
      }

      setRole('freelancer')
      setAuthState('authenticated')
    } catch (err) {
      if (err instanceof WebAuthnError) {
        setAuthError(err.userMessage)
      } else {
        setAuthError(err instanceof Error ? err.message : 'Falha na autenticação. Tente novamente.')
      }
    } finally {
      setIsAuthBusy(false)
    }
  }, [apiUser, applyAttendanceStatus, refreshStoredCredential])

  // ----- Manager login -----------------------------------------------------
  const loginAsManager = useCallback(async (email: string, pass: string) => {
    setIsAuthBusy(true)
    setAuthError('')
    try {
      const res = await loginManager(email, pass)
      setManager(res.user)
      setRole('manager')
      setAuthState('authenticated')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao autenticar gestor.'
      setAuthError(msg)
      throw new Error(msg)
    } finally {
      setIsAuthBusy(false)
    }
  }, [])

  const restoreManagerSession = useCallback((token: string, user: ManagerUser) => {
    setManager(user)
    setRole('manager')
    setAuthState('authenticated')
  }, [])

  const resetAuthError = useCallback(() => {
    setAuthError('')
    setAuthMessage('')
  }, [])

  // ----- Check-in (with geolocation) --------------------------------------
  const performCheckIn = useCallback(
    async (company: Company): Promise<CheckInResult> => {
      logInfo('checkin', 'Iniciando check-in Freela Check', {
        company: {
          id: company.id,
          name: company.name,
          address: company.address,
          location: company.location,
        },
      })

      if (!isGeolocationAvailable()) {
        logWarn('checkin', 'Geolocalização indisponível no dispositivo', {
          reason: 'geo-unavailable',
        })
        return {
          ok: false,
          reason: 'geo-unavailable',
          message: 'Permita o acesso à localização para registrar o ponto.',
        }
      }

      let coords
      try {
        coords = await getCurrentPosition()
      } catch (err) {
        logError('checkin', 'Falha ao obter localização do dispositivo', {
          error: err instanceof Error ? err.message : String(err),
          reason: 'geo-unavailable',
        })
        return {
          ok: false,
          reason: 'geo-unavailable',
          message: 'Permita o acesso à localização para registrar o ponto.',
        }
      }

      const companyLat = company.location?.lat
      const companyLng = company.location?.lng
      if (
        companyLat === undefined ||
        companyLng === undefined ||
        Number.isNaN(companyLat) ||
        Number.isNaN(companyLng)
      ) {
        return {
          ok: false,
          reason: 'location',
          message: 'Não foi possível validar sua localização. Tente novamente em instantes.',
        }
      }

      const within = isWithinRadius(coords.latitude, coords.longitude, companyLat, companyLng)
      if (!within) {
        logWarn('checkin', 'Check-in bloqueado: dispositivo fora do raio', {
          device: { lat: coords.latitude, lng: coords.longitude },
          company: { lat: companyLat, lng: companyLng },
          reason: 'location',
        })
        return {
          ok: false,
          reason: 'location',
          message:
            'Você não está no local da empresa. Aproxime-se do endereço para registrar o ponto.',
        }
      }

      const userId = user?.id || storage.get(STORAGE_KEYS.userId) || ''
      const now = new Date()
      const formatted = formatTimeString(now)

      try {
        await registerAttendance({
          freelancerId: userId,
          companyId: company.id,
          type: 'check_in',
          timestamp: now.toISOString(),
          lat: coords.latitude,
          lng: coords.longitude,
        })
      } catch (err) {
        logError('checkin', 'Falha ao registrar ponto no backend', {
          error: err instanceof Error ? err.message : String(err),
          userId,
          empresaId: company.id,
        })
        return {
          ok: false,
          reason: 'network',
          message:
            err instanceof Error ? err.message : 'Falha ao registrar ponto. Tente novamente.',
        }
      }

      const record: AttendanceRecord = {
        checkInTime: now,
        formattedCheckIn: formatted,
        empresaId: company.id,
      }
      setCurrentRecord(record)
      setPresenceStatus('checked-in')
      return { ok: true, time: formatted }
    },
    [user],
  )

  // ----- Check-out ---------------------------------------------------------
  const performCheckOut = useCallback(async (): Promise<CheckOutResult> => {
    logInfo('checkout', 'Iniciando check-out Freela Check', {
      company: selectedCompany
        ? {
            id: selectedCompany.id,
            name: selectedCompany.name,
            address: selectedCompany.address,
            location: selectedCompany.location,
          }
        : null,
    })

    if (!isGeolocationAvailable()) {
      logWarn('checkout', 'Geolocalização indisponível no dispositivo', {
        reason: 'geo-unavailable',
      })
      return {
        ok: false,
        reason: 'geo-unavailable',
        message: 'Permita o acesso à localização para registrar o ponto.',
      }
    }

    let coords
    try {
      coords = await getCurrentPosition()
    } catch (err) {
      logError('checkout', 'Falha ao obter localização do dispositivo', {
        error: err instanceof Error ? err.message : String(err),
        reason: 'geo-unavailable',
      })
      return {
        ok: false,
        reason: 'geo-unavailable',
        message: 'Permita o acesso à localização para registrar o ponto.',
      }
    }

    const companyLat = selectedCompany?.location?.lat
    const companyLng = selectedCompany?.location?.lng
    if (
      companyLat !== undefined &&
      companyLng !== undefined &&
      !Number.isNaN(companyLat) &&
      !Number.isNaN(companyLng) &&
      companyLat !== 0 &&
      companyLng !== 0
    ) {
      const within = isWithinRadius(coords.latitude, coords.longitude, companyLat, companyLng)
      if (!within) {
        logWarn('checkout', 'Check-out bloqueado: dispositivo fora do raio', {
          device: { lat: coords.latitude, lng: coords.longitude },
          company: { lat: companyLat, lng: companyLng },
          reason: 'location',
        })
        return {
          ok: false,
          reason: 'location',
          message:
            'Você não está no local da empresa. Aproxime-se do endereço para registrar o ponto.',
        }
      }
    }

    const now = new Date()
    const formattedOut = formatTimeString(now)
    const checkIn = currentRecord?.checkInTime || new Date(now.getTime() - 8 * 3600 * 1000)
    const duration = formatDurationString(checkIn, now)
    const userId = user?.id || storage.get(STORAGE_KEYS.userId) || ''
    const empresaId = currentRecord?.empresaId || selectedCompany?.id || ''

    try {
      const res = await registerAttendance({
        freelancerId: userId,
        companyId: empresaId,
        type: 'check_out',
        timestamp: now.toISOString(),
        lat: coords.latitude,
        lng: coords.longitude,
      })
      const finalDuration = res.durationFormatted || duration

      const updatedRecord: AttendanceRecord = {
        ...currentRecord,
        checkOutTime: now,
        formattedCheckOut: formattedOut,
        durationFormatted: finalDuration,
      }
      setHistory((prev) => [updatedRecord, ...prev])
      setCurrentRecord(null)
      setPresenceStatus('awaiting')
      return { ok: true, checkOutTime: formattedOut, duration: finalDuration }
    } catch (err) {
      return {
        ok: false,
        reason: 'network',
        message: err instanceof Error ? err.message : 'Falha ao registrar saída. Tente novamente.',
      }
    }
  }, [currentRecord, selectedCompany, user])

  // ----- Logout ------------------------------------------------------------
  const logout = useCallback(() => {
    logoutManager()
    setRole(null)
    setManager(null)
    setUser(null)
    setApiUser(null)
    setCompanies([])
    setSelectedCompany(null)
    setPresenceStatus('awaiting')
    setCurrentRecord(null)
    setHistory([])
    setAuthError('')
    setAuthMessage('')
    setPendingPhone('')
    setHasStoredCredential(false)
    storage.remove(STORAGE_KEYS.userId)
    storage.remove(STORAGE_KEYS.userName)
    storage.remove(STORAGE_KEYS.userPhone)
    storage.remove(STORAGE_KEYS.mockOpenCheckIn)
    setAuthState('needs-phone')
  }, [])

  return (
    <AppContext.Provider
      value={{
        role,
        manager,
        user,
        companies,
        selectedCompany,
        presenceStatus,
        currentRecord,
        history,
        authState,
        authMessage,
        authError,
        isAuthBusy,
        hasStoredCredential,
        webauthnSupported,
        pendingPhone,
        savedPhone,
        setSelectedCompany,
        resetAuthError,
        submitPhone,
        startBiometricFlow,
        restoreSession,
        performCheckIn,
        performCheckOut,
        loginAsManager,
        restoreManagerSession,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
