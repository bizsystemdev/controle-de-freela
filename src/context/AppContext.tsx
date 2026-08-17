import React, { createContext, useContext, useState } from 'react'

export interface Company {
  id: string
  name: string
  city: string
  state: string
  address: string
  initial: string
  gradient: string
  colorTheme: 'indigo' | 'emerald'
}

export interface UserProfile {
  name: string
  phone: string
  maskedPhone: string
  initials: string
}

export type PresenceStatus = 'awaiting' | 'checked-in'

export interface AttendanceRecord {
  checkInTime?: Date
  checkOutTime?: Date
  formattedCheckIn?: string
  formattedCheckOut?: string
  durationFormatted?: string
}

interface AppContextType {
  user: UserProfile
  companies: Company[]
  selectedCompany: Company | null
  presenceStatus: PresenceStatus
  currentRecord: AttendanceRecord | null
  history: AttendanceRecord[]
  showEmptyCompaniesDemo: boolean
  setSelectedCompany: (company: Company | null) => void
  performCheckIn: () => { time: string }
  performCheckOut: () => { checkOutTime: string; duration: string }
  logout: () => void
  resetToDefault: () => void
  setShowEmptyCompaniesDemo: (val: boolean) => void
  phoneNumber: string
  setPhoneNumber: (val: string) => void
}

const DEFAULT_COMPANIES: Company[] = [
  {
    id: 'empresa-abc',
    name: 'Empresa ABC',
    city: 'Florianópolis',
    state: 'SC',
    address: 'Rod. SC-401, 4100 - Saco Grande, Florianópolis - SC',
    initial: 'A',
    gradient: 'from-indigo-600 to-indigo-500',
    colorTheme: 'indigo',
  },
  {
    id: 'empresa-xyz',
    name: 'Empresa XYZ',
    city: 'São José',
    state: 'SC',
    address: 'Av. Pres. Kennedy, 1333 - Campinas, São José - SC',
    initial: 'X',
    gradient: 'from-emerald-600 to-emerald-500',
    colorTheme: 'emerald',
  },
]

const DEFAULT_USER: UserProfile = {
  name: 'Fabricio Capelini',
  phone: '(11) 98765-4321',
  maskedPhone: '(11) *****-4321',
  initials: 'FC',
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<UserProfile>(DEFAULT_USER)
  const [phoneNumber, setPhoneNumber] = useState<string>('(11) 98765-4321')
  const [companies] = useState<Company[]>(DEFAULT_COMPANIES)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(DEFAULT_COMPANIES[0])
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus>('awaiting')
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(null)
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [showEmptyCompaniesDemo, setShowEmptyCompaniesDemo] = useState(false)

  const formatTimeString = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

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

  const performCheckIn = () => {
    const now = new Date()
    const formatted = formatTimeString(now)
    const record: AttendanceRecord = {
      checkInTime: now,
      formattedCheckIn: formatted,
    }
    setCurrentRecord(record)
    setPresenceStatus('checked-in')
    return { time: formatted }
  }

  const performCheckOut = () => {
    const now = new Date()
    const formattedOut = formatTimeString(now)
    const checkIn =
      currentRecord?.checkInTime || new Date(now.getTime() - 8 * 3600 * 1000 - 53 * 60 * 1000)
    const duration = formatDurationString(checkIn, now)

    const updatedRecord: AttendanceRecord = {
      ...currentRecord,
      checkOutTime: now,
      formattedCheckOut: formattedOut,
      durationFormatted: duration,
    }

    setHistory((prev) => [updatedRecord, ...prev])
    setCurrentRecord(null)
    setPresenceStatus('awaiting')

    return {
      checkOutTime: formattedOut,
      duration: duration || '8h53',
    }
  }

  const logout = () => {
    setPresenceStatus('awaiting')
    setCurrentRecord(null)
    setSelectedCompany(DEFAULT_COMPANIES[0])
    setPhoneNumber('')
  }

  const resetToDefault = () => {
    setPresenceStatus('awaiting')
    setCurrentRecord(null)
    setSelectedCompany(DEFAULT_COMPANIES[0])
    setPhoneNumber('(11) 98765-4321')
    setShowEmptyCompaniesDemo(false)
  }

  return (
    <AppContext.Provider
      value={{
        user,
        companies: showEmptyCompaniesDemo ? [] : companies,
        selectedCompany,
        presenceStatus,
        currentRecord,
        history,
        showEmptyCompaniesDemo,
        setSelectedCompany,
        performCheckIn,
        performCheckOut,
        logout,
        resetToDefault,
        setShowEmptyCompaniesDemo,
        phoneNumber,
        setPhoneNumber,
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
