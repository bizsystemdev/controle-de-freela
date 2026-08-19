import { storage, STORAGE_KEYS } from './storage'

// ---------------------------------------------------------------------------
// Types — match the JSON shapes defined in the task spec.
// ---------------------------------------------------------------------------

export interface MockUser {
  id: string
  name: string
  phone: string
  deviceId: string | null
}

export interface MockLocation {
  lat: number
  lng: number
}

export interface MockCompany {
  id: string
  name: string
  cidade: string
  estado: string
  endereco: string
  location: MockLocation
}

export interface MockValidatePhoneResponse {
  user: MockUser
  companies: MockCompany[]
}

export interface MockAttendanceStatus {
  hasOpenCheckIn: boolean
  empresaId: string | null
  checkInTime: string | null
}

export type AttendanceStatus = 'check-in' | 'check-out'

export interface MockAttendanceRecord {
  id: string
  userId: string
  empresaId: string
  status: AttendanceStatus
  timestamp: string
  location?: MockLocation
}

export interface RegisterAttendancePayload {
  userId: string
  empresaId: string
  status: AttendanceStatus
  timestamp: string
  location?: MockLocation
}

// ---------------------------------------------------------------------------
// Mock data + simulated network.
// ---------------------------------------------------------------------------

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const randomDelay = (min: number, max: number) => delay(min + Math.random() * (max - min))

const DEMO_USER: Omit<MockUser, 'deviceId'> = {
  id: 'user-001',
  name: 'Fabricio Capelini',
  phone: '(11) 98765-4321',
}

const MOCK_COMPANIES: MockCompany[] = [
  {
    id: 'comp-001',
    name: 'Empresa ABC',
    cidade: 'Florianópolis',
    estado: 'SC',
    endereco: 'Rua Felipe Schmidt, 500 - Centro',
    location: { lat: -27.5954, lng: -48.548 },
  },
  {
    id: 'comp-002',
    name: 'Empresa XYZ',
    cidade: 'São José',
    estado: 'SC',
    endereco: 'Av. Presidente Kennedy, 1000 - Campinas',
    location: { lat: -27.6137, lng: -48.635 },
  },
]

// A special phone number that simulates a user with no linked companies.
const NO_COMPANIES_PHONE_DIGITS = '11900000000'

function getMockDeviceId(): string | null {
  return storage.get(STORAGE_KEYS.mockDeviceId)
}

function setMockDeviceId(deviceId: string): void {
  storage.set(STORAGE_KEYS.mockDeviceId, deviceId)
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/** POST /api/auth/validate-phone — sends phone, returns user + companies + deviceId. */
export async function validatePhone(phone: string): Promise<MockValidatePhoneResponse> {
  await randomDelay(500, 800)
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 11) {
    throw new Error('Telefone inválido. Verifique o número informado.')
  }
  const user: MockUser = { ...DEMO_USER, phone, deviceId: getMockDeviceId() }
  const companies = digits === NO_COMPANIES_PHONE_DIGITS ? [] : MOCK_COMPANIES
  return { user, companies }
}

/** POST /api/auth/register-device — registers a WebAuthn credential server-side. */
export async function registerDevice(
  _userId: string,
  _rawId: string,
): Promise<{ success: boolean; deviceId: string }> {
  await randomDelay(500, 800)
  const deviceId = `dev-${Math.random().toString(36).slice(2, 10)}`
  setMockDeviceId(deviceId)
  return { success: true, deviceId }
}

/** POST /api/auth/authenticate — validates a WebAuthn assertion for login. */
export async function authenticateUser(
  _userId: string,
  _credentialId: string,
): Promise<{ success: boolean }> {
  await randomDelay(500, 800)
  return { success: true }
}

/** GET /api/attendance/status — reports whether there is an open check-in. */
export async function getAttendanceStatus(userId: string): Promise<MockAttendanceStatus> {
  await randomDelay(400, 700)
  const open = storage.getJSON<MockAttendanceRecord>(STORAGE_KEYS.mockOpenCheckIn)
  if (open && open.userId === userId && open.status === 'check-in') {
    return { hasOpenCheckIn: true, empresaId: open.empresaId, checkInTime: open.timestamp }
  }
  return { hasOpenCheckIn: false, empresaId: null, checkInTime: null }
}

/** POST /api/attendance/register — registers a check-in or check-out. */
export async function registerAttendance(
  payload: RegisterAttendancePayload,
): Promise<{ success: boolean; record: MockAttendanceRecord }> {
  await randomDelay(500, 800)
  const record: MockAttendanceRecord = { id: `att-${Date.now()}`, ...payload }
  if (payload.status === 'check-in') {
    storage.setJSON(STORAGE_KEYS.mockOpenCheckIn, record)
  } else {
    storage.remove(STORAGE_KEYS.mockOpenCheckIn)
  }
  return { success: true, record }
}

/** GET /api/companies/:id — company details including location. */
export async function getCompany(id: string): Promise<MockCompany> {
  await randomDelay(300, 500)
  const company = MOCK_COMPANIES.find((c) => c.id === id)
  if (!company) {
    throw new Error('Empresa não encontrada.')
  }
  return company
}
