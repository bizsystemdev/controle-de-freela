// Centralized localStorage helpers for the Biz Check app.
// Splits keys into client-side session data (credential/device/user)
// and mock-server-side state (deviceId, open check-in).

export const STORAGE_KEYS = {
  credential: 'presenca:credential',
  deviceId: 'presenca:deviceId',
  userPhone: 'presenca:userPhone',
  userId: 'presenca:userId',
  userName: 'presenca:userName',
  mockDeviceId: 'presenca:mock:deviceId',
  mockOpenCheckIn: 'presenca:mock:openCheckIn',
} as const

export const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* ignore quota / privacy errors */
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  },
  getJSON<T>(key: string): T | null {
    const raw = storage.get(key)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  },
  setJSON(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* ignore */
    }
  },
}
