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
  if (!freelancerId) {
    return {
      active: false,
      hasOpenCheckIn: false,
      empresaId: null,
      checkInTime: null,
    }
  }

  try {
    const res = await pb.send<AttendanceStatusResponse>(
      `/api/attendance/status?freelancerId=${encodeURIComponent(freelancerId)}`,
      {
        method: 'GET',
      },
    )
    return res
  } catch (err: unknown) {
    const pbErr = err as { status?: number; data?: { error?: string }; message?: string }

    // Fallback directly via PocketBase SDK
    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        const records = await pb.collection('attendance_records').getList(1, 1, {
          filter: `freelancer_id = "${freelancerId}"`,
          sort: '-timestamp',
        })

        if (records.items.length === 0) {
          return {
            active: false,
            hasOpenCheckIn: false,
            empresaId: null,
            checkInTime: null,
          }
        }

        const last = records.items[0]
        if (last.type === 'check_in') {
          return {
            active: true,
            hasOpenCheckIn: true,
            empresaId: last.company_id,
            checkInTime: last.timestamp,
            record: {
              id: last.id,
              freelancerId: last.freelancer_id,
              companyId: last.company_id,
              type: last.type,
              timestamp: last.timestamp,
              lat: last.lat,
              lng: last.lng,
            },
          }
        }

        return {
          active: false,
          hasOpenCheckIn: false,
          empresaId: null,
          checkInTime: null,
        }
      } catch {
        /* intentionally ignored */
      }
    }

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
    const pbErr = err as { status?: number; data?: { error?: string }; message?: string }

    // Fallback directly via PocketBase SDK
    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        const type =
          payload.type === 'check-in' || payload.type === 'check_in' ? 'check_in' : 'check_out'
        const timestamp = payload.timestamp || new Date().toISOString()
        const lat = typeof payload.lat === 'number' ? payload.lat : payload.location?.lat || null
        const lng = typeof payload.lng === 'number' ? payload.lng : payload.location?.lng || null

        // Get last record to compute duration if check-out
        let durationFormatted = ''
        if (type === 'check_out') {
          const lastAtt = await pb.collection('attendance_records').getList(1, 1, {
            filter: `freelancer_id = "${payload.freelancerId}"`,
            sort: '-timestamp',
          })
          if (lastAtt.items.length > 0 && lastAtt.items[0].type === 'check_in') {
            const startMs = new Date(lastAtt.items[0].timestamp).getTime()
            const endMs = new Date(timestamp).getTime()
            const diffMins = Math.max(1, Math.floor((endMs - startMs) / (1000 * 60)))
            const hours = Math.floor(diffMins / 60)
            const mins = diffMins % 60
            if (hours > 0) {
              durationFormatted = `${hours}h${mins < 10 ? '0' : ''}${mins}`
            } else {
              durationFormatted = `${mins} min`
            }
          }
        }

        const created = await pb.collection('attendance_records').create({
          freelancer_id: payload.freelancerId,
          company_id: payload.companyId,
          type,
          timestamp,
          lat,
          lng,
        })

        return {
          success: true,
          durationFormatted: durationFormatted || undefined,
          record: {
            id: created.id,
            freelancerId: created.freelancer_id,
            companyId: created.company_id,
            type: created.type,
            timestamp: created.timestamp,
            lat: created.lat,
            lng: created.lng,
          },
        }
      } catch (fallbackErr: unknown) {
        const fbErr = fallbackErr as { message?: string }
        throw new Error(fbErr?.message || 'Falha ao registrar ponto.')
      }
    }

    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao registrar ponto.')
  }
}
