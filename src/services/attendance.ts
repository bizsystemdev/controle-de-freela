import pb from '@/lib/pocketbase/client'

export interface AttendanceStatusResponse {
  active: boolean
  hasOpenCheckIn?: boolean
  empresaId?: string | null
  checkInTime?: string | null
  record?: {
    id: string
    freelancerId: string
    companyId: string
    type: string
    timestamp: string
    lat: number
    lng: number
  }
}

export interface RegisterAttendancePayload {
  freelancerId: string
  companyId: string
  type: 'check_in' | 'check_out' | 'check-in' | 'check-out'
  timestamp?: string
  lat?: number | null
  lng?: number | null
  location?: { lat: number; lng: number }
}

export interface RegisterAttendanceResult {
  success: boolean
  durationFormatted?: string
  record: {
    id: string
    freelancerId: string
    companyId: string
    type: string
    timestamp: string
    lat?: number
    lng?: number
  }
}

/**
 * Consulta o status atual de ponto do freelancer
 */
export async function getAttendanceStatus(freelancerId: string): Promise<AttendanceStatusResponse> {
  try {
    const res = await pb.send<AttendanceStatusResponse>(
      `/api/attendance/status?freelancerId=${encodeURIComponent(freelancerId)}`,
      {
        method: 'GET',
      },
    )
    return res
  } catch (err: unknown) {
    const pbErr = err as { data?: { error?: string }; message?: string }
    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao obter status de presença.')
  }
}

/**
 * Registra um ponto de entrada (check-in) ou saída (check-out)
 */
export async function registerAttendance(
  payload: RegisterAttendancePayload,
): Promise<RegisterAttendanceResult> {
  try {
    const res = await pb.send<RegisterAttendanceResult>('/api/attendance/register', {
      method: 'POST',
      body: payload,
    })
    return res
  } catch (err: unknown) {
    const pbErr = err as { data?: { error?: string }; message?: string }
    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao registrar ponto.')
  }
}
