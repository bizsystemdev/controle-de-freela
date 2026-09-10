import pb from '@/lib/pocketbase/client'
import { normalizeDateIso } from '@/lib/utils'

export interface CompanyAdminItem {
  id: string
  name: string
  city: string
  state: string
  address: string
  cep?: string
  number?: string
  neighborhood?: string
  cnpj?: string
  location: {
    lat: number
    lng: number
  }
  freelancersCount: number
  lastCheckIn: string | null
  attendancePhotoRequired: boolean
  paymentControlEnabled: boolean
  freelancerShiftBaseAmountCents: number | null
  license?: {
    id: string
    status: string
    plan: string
    maxFreelancers: number
  }
}

/**
 * Consulta histórico de liberações de dispositivos com filtros
 */
export async function getDeviceReleases(
  filters?: DeviceReleaseFilterParams,
): Promise<DeviceReleaseItem[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.companyId) params.append('companyId', filters.companyId)
    if (filters?.freelancerId) params.append('freelancerId', filters.freelancerId)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)

    const queryString = params.toString() ? `?${params.toString()}` : ''
    const res = await pb.send<{ releases: DeviceReleaseItem[] }>(
      `/api/admin/device-releases${queryString}`,
      { method: 'GET' },
    )
    return res.releases || []
  } catch (err: unknown) {
    const pbErr = err as { status?: number; data?: { error?: string }; message?: string }
    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        let filter = 'id != ""'
        if (filters?.companyId) {
          filter += ` && company_id = "${filters.companyId}"`
        }
        if (filters?.freelancerId) {
          filter += ` && freelancer_id = "${filters.freelancerId}"`
        }
        if (filters?.startDate) {
          filter += ` && created >= "${new Date(filters.startDate).toISOString()}"`
        }
        if (filters?.endDate) {
          const endObj = new Date(filters.endDate)
          if (filters.endDate.length <= 10) endObj.setHours(23, 59, 59, 999)
          filter += ` && created <= "${endObj.toISOString()}"`
        }

        const records = await pb.collection('device_releases').getFullList({
          filter,
          sort: '-created',
          expand: 'freelancer_id,company_id,manager_id',
        })

        return records.map((rec) => {
          const fl = rec.expand?.freelancer_id
          const comp = rec.expand?.company_id
          const mgr = rec.expand?.manager_id

          return {
            id: rec.id,
            freelancerId: rec.freelancer_id,
            freelancerName: fl?.name || 'Freelancer',
            freelancerPhone: fl?.phone || '',
            freelancerRoleTitle: fl?.role_title || '',
            companyId: rec.company_id || null,
            companyName: comp?.name || null,
            managerId: rec.manager_id || null,
            managerName: rec.manager_name || mgr?.name || 'Gestor',
            managerEmail: rec.manager_email || mgr?.email || '',
            previousDeviceId: rec.previous_device_id || null,
            reason: rec.reason || '',
            created: rec.created,
            updated: rec.updated,
          }
        })
      } catch {
        /* intentionally ignored */
      }
    }
    throw new Error(
      pbErr?.data?.error ||
        pbErr?.message ||
        'Falha ao buscar histórico de liberações de dispositivo.',
    )
  }
}

export interface CreateCompanyPayload {
  name: string
  street: string
  number: string
  city: string
  state: string
  cep?: string
  neighborhood?: string
  cnpj?: string
  lat: number
  lng: number
  plan: 'free' | 'pro' | 'enterprise'
  managerName: string
  managerEmail: string
  managerPassword: string
  currentAdminId?: string
}

export interface UpdateCompanyPayload {
  name?: string
  street?: string
  number?: string
  city?: string
  state?: string
  cep?: string
  neighborhood?: string
  cnpj?: string
  lat?: number
  lng?: number
  plan?: 'free' | 'pro' | 'enterprise'
  active?: boolean
}

export interface UpdateCompanyResponse {
  success: boolean
  message: string
  company: {
    id: string
    name: string
    city: string
    state: string
    address: string
    cep?: string
    number?: string
    neighborhood?: string
    cnpj?: string
    location: {
      lat: number
      lng: number
    }
    active?: boolean
  }
}

export interface CreateCompanyResponse {
  success: boolean
  message: string
  company: {
    id: string
    name: string
    city: string
    state: string
    address: string
    cep?: string
    number?: string
    neighborhood?: string
    cnpj?: string
    location: {
      lat: number
      lng: number
    }
    license: {
      id: string
      plan: string
      status: string
      maxFreelancers: number
    }
    manager: {
      id: string
      name: string
      email: string
    }
  }
}

export interface CompanyStats {
  companyId: string
  companyName: string
  totalFreelancers: number
  checkInsToday: number
  openCheckIns: number
}

export interface AdminFreelancer {
  id: string
  fcId: string
  name: string
  phone: string
  email?: string
  document?: string
  roleTitle?: string
  deviceId?: string | null
  hasOpenCheckIn: boolean
  lastCheckInTime?: string | null
  created: string
}

export interface CreateFreelancerPayload {
  companyId?: string
  companyIds?: string[]
  name: string
  phone: string
  email?: string
  document: string
  roleTitle?: string
}

export interface AttendanceEventDetails {
  id: string
  timestamp: string
  manual?: boolean
  lat?: number | null
  lng?: number | null
  photoFileName?: string | null
}

export interface AttendanceShiftItem {
  id: string
  checkInId: string | null
  checkOutId: string | null
  freelancerId: string
  freelancerName: string
  freelancerPhone: string
  freelancerRoleTitle: string
  companyId: string
  companyName: string
  checkIn: AttendanceEventDetails | null
  checkOut: AttendanceEventDetails | null
  status: 'open' | 'completed' | 'orphan'
  paymentRequired: boolean
  paymentConfirmed: boolean
  receivedAmountCents: number | null
  paymentConfirmedAt: string | null
  paymentConfirmedBy: string | null
  paymentConfirmedByName: string | null
}

export type AttendanceHistoryItem = AttendanceShiftItem

export type AttendanceShiftStatusFilter = 'all' | 'open' | 'completed' | 'payment_pending' | 'paid'

export interface DeviceReleaseItem {
  id: string
  freelancerId: string
  freelancerName: string
  freelancerPhone?: string
  freelancerRoleTitle?: string
  companyId?: string | null
  companyName?: string | null
  managerId?: string | null
  managerName?: string
  managerEmail?: string
  previousDeviceId?: string | null
  reason?: string
  created: string
  updated?: string
}

export interface DeviceReleaseFilterParams {
  companyId?: string
  freelancerId?: string
  startDate?: string
  endDate?: string
}

export interface ManualAttendancePayload {
  freelancerId: string
  companyId: string
  type: 'check_in' | 'check_out' | 'check-in' | 'check-out'
  timestamp?: string
}

export interface ManualAttendanceResponse {
  success: boolean
  manual: boolean
  durationFormatted?: string
  record: {
    id: string
    freelancerId: string
    companyId: string
    type: string
    timestamp: string
    manual?: boolean
    lat?: number | null
    lng?: number | null
  }
}

export interface AdminManager {
  id: string
  licenseManagerId: string
  licenseId: string
  name: string
  email: string
  role?: string
  profile?: 'gestor' | 'gerente'
  inviteToken?: string
  inviteStatus?: string
  created: string
}

export interface CreateManagerPayload {
  companyId: string
  name: string
  email: string
  password?: string
  role?: string
  profile?: 'gestor' | 'gerente'
}

export interface CreateManagerResponse {
  success: boolean
  message?: string
  inviteToken?: string
  inviteLink?: string
  manager: AdminManager
}

export interface UpdateManagerPayload {
  name?: string
  email?: string
  password?: string
  profile?: 'gestor' | 'gerente'
}

export interface HistoryFilterParams {
  freelancerId?: string
  startDate?: string
  endDate?: string
  status?: AttendanceShiftStatusFilter
}

export interface PaymentSettingsPayload {
  enabled: boolean
  baseAmountCents: number | null
}

export interface PaymentSettingsResponse {
  success: boolean
  paymentControlEnabled: boolean
  baseAmountCents: number | null
}

export interface PhotoSettingsResponse {
  success: boolean
  attendancePhotoRequired: boolean
}

export interface ConfirmShiftPaymentResponse {
  success: boolean
  payment: {
    amountCents: number
    confirmedAt: string
    confirmedBy: string
    confirmedByName: string
  }
}

/**
 * Lista empresas administradas pelo gestor
 */
/**
 * Cadastra uma nova empresa, licença e gestor inicial
 */
export async function createAdminCompany(
  payload: CreateCompanyPayload,
): Promise<CreateCompanyResponse> {
  try {
    const res = await pb.send<CreateCompanyResponse>('/api/admin/companies', {
      method: 'POST',
      body: payload,
    })
    return res
  } catch (err: unknown) {
    const pbErr = err as {
      status?: number
      data?: { error?: string; message?: string }
      message?: string
    }

    // If hook is missing or 404, fallback directly via PocketBase SDK
    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        const fullAddress = payload.number
          ? `${payload.street}, ${payload.number}${payload.neighborhood ? ' - ' + payload.neighborhood : ''}`
          : payload.street

        const maxFreelancers =
          payload.plan === 'enterprise' ? 200 : payload.plan === 'pro' ? 50 : 10

        // 1. Create company record
        const comp = await pb.collection('companies').create({
          name: payload.name,
          city: payload.city,
          state: payload.state.toUpperCase(),
          address: fullAddress,
          lat: payload.lat,
          lng: payload.lng,
          active: true,
          cep: payload.cep || '',
          number: payload.number || '',
          neighborhood: payload.neighborhood || '',
          cnpj: payload.cnpj || '',
        })

        // 2. Create license record
        const lic = await pb.collection('licenses').create({
          company_id: comp.id,
          status: 'active',
          plan: payload.plan,
          max_freelancers: maxFreelancers,
        })

        // 3. Create or find manager user
        let managerUser: { id: string; name: string; email: string }
        try {
          const userRec = await pb.collection('users').create({
            email: payload.managerEmail,
            password: payload.managerPassword,
            passwordConfirm: payload.managerPassword,
            name: payload.managerName,
            verified: true,
          })
          managerUser = {
            id: userRec.id,
            name: userRec.name || payload.managerName,
            email: userRec.email,
          }
        } catch {
          // If already exists or cannot create as unauth, link current authenticated manager or existing
          const currentId = payload.currentAdminId || pb.authStore.record?.id
          managerUser = {
            id: currentId || 'manager',
            name: payload.managerName,
            email: payload.managerEmail,
          }
        }

        // 4. Link manager user
        if (managerUser.id && managerUser.id !== 'manager') {
          try {
            await pb.collection('license_managers').create({
              license_id: lic.id,
              user_id: managerUser.id,
              role: 'owner',
            })
          } catch {
            /* intentionally ignored */
          }
        }

        // Link current admin too if different
        if (payload.currentAdminId && payload.currentAdminId !== managerUser.id) {
          try {
            await pb.collection('license_managers').create({
              license_id: lic.id,
              user_id: payload.currentAdminId,
              role: 'owner',
            })
          } catch {
            /* intentionally ignored */
          }
        }

        return {
          success: true,
          message: 'Empresa cadastrada com sucesso!',
          company: {
            id: comp.id,
            name: comp.name,
            city: comp.city || '',
            state: comp.state || '',
            address: comp.address || '',
            cep: comp.cep || payload.cep || '',
            number: comp.number || payload.number || '',
            neighborhood: comp.neighborhood || payload.neighborhood || '',
            cnpj: comp.cnpj || payload.cnpj || '',
            location: {
              lat: comp.lat || payload.lat,
              lng: comp.lng || payload.lng,
            },
            license: {
              id: lic.id,
              plan: lic.plan,
              status: lic.status,
              maxFreelancers: lic.max_freelancers,
            },
            manager: managerUser,
          },
        }
      } catch (fallbackErr: unknown) {
        const fbErr = fallbackErr as { message?: string }
        throw new Error(fbErr?.message || 'Falha ao criar nova empresa.')
      }
    }

    throw new Error(
      pbErr?.data?.error ||
        pbErr?.data?.message ||
        pbErr?.message ||
        'Falha ao criar nova empresa.',
    )
  }
}

export async function getAdminCompanies(managerId?: string): Promise<CompanyAdminItem[]> {
  try {
    const query = managerId ? `?managerId=${encodeURIComponent(managerId)}` : ''
    const res = await pb.send<{ companies: CompanyAdminItem[] }>(`/api/admin/companies${query}`, {
      method: 'GET',
    })
    return res.companies || []
  } catch (err: unknown) {
    const pbErr = err as { status?: number; data?: { error?: string }; message?: string }

    // Fallback directly via PocketBase SDK
    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        const targetUserId = managerId || pb.authStore.record?.id
        let licenses: Array<{
          id: string
          company_id: string
          status: string
          plan: string
          max_freelancers: number
        }> = []

        if (targetUserId) {
          const lms = await pb.collection('license_managers').getFullList({
            filter: `user_id = "${targetUserId}"`,
            expand: 'license_id',
          })
          const licIds = lms.map((lm) => lm.license_id).filter(Boolean)
          if (licIds.length > 0) {
            const filterQuery = licIds.map((id) => `id = "${id}"`).join(' || ')
            licenses = await pb.collection('licenses').getFullList({
              filter: filterQuery,
            })
          }
        } else {
          licenses = await pb.collection('licenses').getFullList({
            sort: '-created',
          })
        }

        const companiesList: CompanyAdminItem[] = []
        for (const lic of licenses) {
          try {
            const comp = await pb.collection('companies').getOne(lic.company_id)
            if (comp.active !== false) {
              const fcs = await pb.collection('freelancer_companies').getList(1, 1, {
                filter: `company_id = "${comp.id}" && active = true`,
              })
              const lastAtt = await pb.collection('attendance_records').getList(1, 1, {
                filter: `company_id = "${comp.id}" && type = "check_in"`,
                sort: '-timestamp',
              })

              companiesList.push({
                id: comp.id,
                name: comp.name,
                city: comp.city || '',
                state: comp.state || '',
                address: comp.address || '',
                cep: comp.cep || '',
                number: comp.number || '',
                neighborhood: comp.neighborhood || '',
                cnpj: comp.cnpj || '',
                location: {
                  lat: comp.lat || 0,
                  lng: comp.lng || 0,
                },
                freelancersCount: fcs.totalItems,
                lastCheckIn: lastAtt.items[0]?.timestamp || null,
                attendancePhotoRequired: Boolean(comp.attendance_photo_required),
                paymentControlEnabled: Boolean(comp.payment_control_enabled),
                freelancerShiftBaseAmountCents:
                  Number(comp.freelancer_shift_base_amount_cents || 0) > 0
                    ? Number(comp.freelancer_shift_base_amount_cents)
                    : null,
                license: {
                  id: lic.id,
                  status: lic.status,
                  plan: lic.plan,
                  maxFreelancers: lic.max_freelancers,
                },
              })
            }
          } catch {
            /* intentionally ignored */
          }
        }

        return companiesList
      } catch (fallbackErr) {
        // Return active companies as last resort
        const allComps = await pb.collection('companies').getFullList({
          filter: 'active = true',
          sort: 'name',
        })
        return allComps.map((c) => ({
          id: c.id,
          name: c.name,
          city: c.city || '',
          state: c.state || '',
          address: c.address || '',
          cep: c.cep || '',
          number: c.number || '',
          neighborhood: c.neighborhood || '',
          cnpj: c.cnpj || '',
          location: { lat: c.lat || 0, lng: c.lng || 0 },
          freelancersCount: 0,
          lastCheckIn: null,
          attendancePhotoRequired: Boolean(c.attendance_photo_required),
          paymentControlEnabled: Boolean(c.payment_control_enabled),
          freelancerShiftBaseAmountCents:
            Number(c.freelancer_shift_base_amount_cents || 0) > 0
              ? Number(c.freelancer_shift_base_amount_cents)
              : null,
        }))
      }
    }

    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao listar empresas.')
  }
}

/**
 * Atualiza os dados de uma empresa
 */
export async function updateAdminCompany(
  companyId: string,
  payload: UpdateCompanyPayload,
): Promise<UpdateCompanyResponse> {
  try {
    const res = await pb.send<UpdateCompanyResponse>(
      `/api/admin/company/${encodeURIComponent(companyId)}`,
      {
        method: 'PUT',
        body: payload,
      },
    )
    return res
  } catch (err: unknown) {
    const pbErr = err as {
      status?: number
      data?: { error?: string; message?: string }
      message?: string
    }

    // Fallback directly via PocketBase SDK
    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        const updateData: Record<string, unknown> = {}
        if (payload.name !== undefined) updateData.name = payload.name
        if (payload.city !== undefined) updateData.city = payload.city
        if (payload.state !== undefined) updateData.state = payload.state.toUpperCase()
        if (payload.cep !== undefined) updateData.cep = payload.cep
        if (payload.number !== undefined) updateData.number = payload.number
        if (payload.neighborhood !== undefined) updateData.neighborhood = payload.neighborhood
        if (payload.cnpj !== undefined) updateData.cnpj = payload.cnpj
        if (payload.lat !== undefined) updateData.lat = payload.lat
        if (payload.lng !== undefined) updateData.lng = payload.lng
        if (payload.active !== undefined) updateData.active = payload.active

        if (
          payload.street !== undefined ||
          payload.number !== undefined ||
          payload.neighborhood !== undefined
        ) {
          const street = payload.street || ''
          const num = payload.number || ''
          const neigh = payload.neighborhood || ''
          const fullAddress = num ? `${street}, ${num}${neigh ? ' - ' + neigh : ''}` : street
          if (fullAddress) {
            updateData.address = fullAddress
          }
        }

        const updatedComp = await pb.collection('companies').update(companyId, updateData)

        // Se alterou o plano, atualiza a licença
        if (payload.plan) {
          try {
            const lics = await pb.collection('licenses').getList(1, 1, {
              filter: `company_id = "${companyId}"`,
              sort: '-created',
            })
            if (lics.items.length > 0) {
              const maxFreelancers =
                payload.plan === 'enterprise' ? 200 : payload.plan === 'pro' ? 50 : 10
              await pb.collection('licenses').update(lics.items[0].id, {
                plan: payload.plan,
                max_freelancers: maxFreelancers,
              })
            }
          } catch {
            /* ignore */
          }
        }

        return {
          success: true,
          message: 'Empresa atualizada com sucesso!',
          company: {
            id: updatedComp.id,
            name: updatedComp.name,
            city: updatedComp.city || '',
            state: updatedComp.state || '',
            address: updatedComp.address || '',
            cep: updatedComp.cep || '',
            number: updatedComp.number || '',
            neighborhood: updatedComp.neighborhood || '',
            cnpj: updatedComp.cnpj || '',
            location: {
              lat: updatedComp.lat || 0,
              lng: updatedComp.lng || 0,
            },
            active: updatedComp.active,
          },
        }
      } catch (fallbackErr: unknown) {
        const fbErr = fallbackErr as { message?: string }
        throw new Error(fbErr?.message || 'Falha ao atualizar dados da empresa.')
      }
    }

    throw new Error(
      pbErr?.data?.error ||
        pbErr?.data?.message ||
        pbErr?.message ||
        'Falha ao atualizar dados da empresa.',
    )
  }
}

/**
 * Retorna dados e métricas de uma empresa específica
 */
export async function getCompanyStats(companyId: string): Promise<CompanyStats> {
  try {
    const res = await pb.send<CompanyStats>(
      `/api/admin/company/${encodeURIComponent(companyId)}/stats`,
      {
        method: 'GET',
      },
    )
    return res
  } catch (err: unknown) {
    const pbErr = err as { status?: number; data?: { error?: string }; message?: string }
    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        const comp = await pb.collection('companies').getOne(companyId)
        const fcs = await pb.collection('freelancer_companies').getList(1, 1, {
          filter: `company_id = "${companyId}" && active = true`,
        })

        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayRecords = await pb.collection('attendance_records').getList(1, 1, {
          filter: `company_id = "${companyId}" && type = "check_in" && timestamp >= "${todayStart.toISOString()}"`,
        })

        // Open check-ins fallback: count active freelancers whose last record in this company is check_in
        const activeFcs = await pb.collection('freelancer_companies').getFullList({
          filter: `company_id = "${companyId}" && active = true`,
        })
        let openCount = 0
        for (const fc of activeFcs) {
          const lastAtt = await pb.collection('attendance_records').getList(1, 1, {
            filter: `freelancer_id = "${fc.freelancer_id}" && company_id = "${companyId}"`,
            sort: '-timestamp',
          })
          if (
            lastAtt.items.length > 0 &&
            (lastAtt.items[0].type === 'check_in' || lastAtt.items[0].type === 'check-in')
          ) {
            openCount++
          }
        }

        return {
          companyId: comp.id,
          companyName: comp.name,
          totalFreelancers: fcs.totalItems,
          checkInsToday: todayRecords.totalItems,
          openCheckIns: openCount,
        }
      } catch {
        /* intentionally ignored */
      }
    }
    throw new Error(
      pbErr?.data?.error || pbErr?.message || 'Falha ao carregar estatísticas da empresa.',
    )
  }
}

/**
 * Lista freelancers vinculados à empresa
 */
export async function getCompanyFreelancers(companyId: string): Promise<AdminFreelancer[]> {
  try {
    const res = await pb.send<{ freelancers: AdminFreelancer[] }>(
      `/api/admin/company/${encodeURIComponent(companyId)}/freelancers`,
      { method: 'GET' },
    )
    return res.freelancers || []
  } catch (err: unknown) {
    const pbErr = err as { status?: number; data?: { error?: string }; message?: string }
    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        const fcs = await pb.collection('freelancer_companies').getFullList({
          filter: `company_id = "${companyId}" && active = true`,
          expand: 'freelancer_id',
          sort: '-created',
        })

        const list: AdminFreelancer[] = []
        for (const fc of fcs) {
          try {
            const fl =
              fc.expand?.freelancer_id ||
              (await pb.collection('freelancers').getOne(fc.freelancer_id))
            if (fl && fl.active !== false) {
              const lastAtt = await pb.collection('attendance_records').getList(1, 1, {
                filter: `freelancer_id = "${fl.id}" && company_id = "${companyId}"`,
                sort: '-timestamp',
              })
              const hasOpenCheckIn =
                lastAtt.items.length > 0 &&
                (lastAtt.items[0].type === 'check_in' || lastAtt.items[0].type === 'check-in')
              list.push({
                id: fl.id,
                fcId: fc.id,
                name: fl.name,
                phone: fl.phone,
                email: fl.email || '',
                document: fl.document || '',
                roleTitle: fl.role_title || '',
                deviceId: fl.device_id || null,
                hasOpenCheckIn,
                lastCheckInTime: lastAtt.items[0]?.timestamp || null,
                created: fl.created,
              })
            }
          } catch {
            /* intentionally ignored */
          }
        }
        return list
      } catch {
        /* intentionally ignored */
      }
    }
    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao listar freelancers.')
  }
}

/**
 * Cadastra novo freelancer e vincula à empresa
 */
export interface DuplicateFreelancerResult {
  success: boolean
  message: string
  freelancerId?: string
  targetCompanyIds?: string[]
  targetCompanyNames?: string[]
}

export async function createFreelancer(
  payload: CreateFreelancerPayload,
): Promise<{ success: boolean; freelancer: unknown; linkedCompanyIds?: string[] }> {
  const document = (payload.document || '').trim()
  if (!document) {
    throw new Error('CPF / documento é obrigatório.')
  }

  const targetIds: string[] = []
  if (payload.companyId) {
    targetIds.push(payload.companyId)
  }
  if (Array.isArray(payload.companyIds)) {
    for (const cid of payload.companyIds) {
      if (cid && !targetIds.includes(cid)) {
        targetIds.push(cid)
      }
    }
  }

  const normalizedPayload = {
    ...payload,
    document,
    companyId: targetIds[0] || payload.companyId || '',
    companyIds: targetIds,
  }

  try {
    const res = await pb.send<{
      success: boolean
      freelancer: unknown
      linkedCompanyIds?: string[]
    }>('/api/admin/freelancers', {
      method: 'POST',
      body: normalizedPayload,
    })
    return res
  } catch (err: unknown) {
    const pbErr = err as { status?: number; data?: { error?: string }; message?: string }
    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        // Fallback SDK creation
        const existing = await pb.collection('freelancers').getList(1, 1, {
          filter: `phone ~ "${payload.phone.replace(/\D/g, '')}" || phone = "${payload.phone}"`,
        })

        let fl
        if (existing.items.length > 0) {
          fl = existing.items[0]
          await pb.collection('freelancers').update(fl.id, {
            name: payload.name,
            email: payload.email || fl.email,
            document,
            role_title: payload.roleTitle || fl.role_title,
            active: true,
          })
        } else {
          fl = await pb.collection('freelancers').create({
            name: payload.name,
            phone: payload.phone,
            email: payload.email || '',
            document,
            role_title: payload.roleTitle || '',
            active: true,
          })
        }

        // Link to all target companies
        for (const cId of targetIds) {
          const fcCheck = await pb.collection('freelancer_companies').getList(1, 1, {
            filter: `freelancer_id = "${fl.id}" && company_id = "${cId}"`,
          })
          if (fcCheck.items.length === 0) {
            await pb.collection('freelancer_companies').create({
              freelancer_id: fl.id,
              company_id: cId,
              active: true,
            })
          } else if (!fcCheck.items[0].active) {
            await pb.collection('freelancer_companies').update(fcCheck.items[0].id, {
              active: true,
            })
          }
        }

        return {
          success: true,
          freelancer: fl,
          linkedCompanyIds: targetIds,
        }
      } catch (fallbackErr: unknown) {
        const fbErr = fallbackErr as { message?: string }
        throw new Error(fbErr?.message || 'Falha ao cadastrar freelancer.')
      }
    }
    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao cadastrar freelancer.')
  }
}

/**
 * Duplica / vincula freelancer existente a uma ou mais outras empresas
 */
export async function duplicateFreelancer(
  freelancerId: string,
  targetCompanyIds: string | string[],
): Promise<DuplicateFreelancerResult> {
  const ids: string[] = Array.isArray(targetCompanyIds)
    ? targetCompanyIds.filter(Boolean)
    : targetCompanyIds
      ? [targetCompanyIds]
      : []

  if (ids.length === 0) {
    throw new Error('Nenhuma empresa de destino fornecida.')
  }

  try {
    const res = await pb.send<DuplicateFreelancerResult>(
      `/api/admin/freelancers/${encodeURIComponent(freelancerId)}/duplicate`,
      {
        method: 'POST',
        body: {
          targetCompanyId: ids[0],
          targetCompanyIds: ids,
        },
      },
    )
    return res
  } catch (err: unknown) {
    const pbErr = err as { status?: number; data?: { error?: string }; message?: string }
    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        const linkedNames: string[] = []
        for (const tId of ids) {
          const fcCheck = await pb.collection('freelancer_companies').getList(1, 1, {
            filter: `freelancer_id = "${freelancerId}" && company_id = "${tId}"`,
          })
          if (fcCheck.items.length === 0) {
            await pb.collection('freelancer_companies').create({
              freelancer_id: freelancerId,
              company_id: tId,
              active: true,
            })
          } else if (!fcCheck.items[0].active) {
            await pb.collection('freelancer_companies').update(fcCheck.items[0].id, {
              active: true,
            })
          }
          try {
            const comp = await pb.collection('companies').getOne(tId)
            linkedNames.push(comp.name)
          } catch {
            linkedNames.push(tId)
          }
        }
        const message =
          linkedNames.length === 1
            ? `Freelancer vinculado com sucesso à empresa ${linkedNames[0]}.`
            : `Freelancer vinculado com sucesso a ${linkedNames.length} empresas (${linkedNames.join(', ')}).`

        return {
          success: true,
          message,
          freelancerId,
          targetCompanyIds: ids,
          targetCompanyNames: linkedNames,
        }
      } catch (fallbackErr: unknown) {
        const fbErr = fallbackErr as { message?: string }
        throw new Error(fbErr?.message || 'Falha ao vincular freelancer.')
      }
    }
    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao duplicar freelancer.')
  }
}

/**
 * Remove vínculo de freelancer com empresa
 */
export async function removeFreelancerFromCompany(
  freelancerId: string,
  companyId: string,
): Promise<boolean> {
  try {
    const list = await pb.collection('freelancer_companies').getList(1, 10, {
      filter: `freelancer_id = "${freelancerId}" && company_id = "${companyId}"`,
    })
    for (const item of list.items) {
      await pb.collection('freelancer_companies').delete(item.id)
    }
    return true
  } catch (err: unknown) {
    const pbErr = err as { data?: { error?: string }; message?: string }
    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao desvincular freelancer.')
  }
}

/**
 * Atualiza dados cadastrais de um freelancer
 */
export async function updateFreelancer(
  freelancerId: string,
  data: {
    name?: string
    phone?: string
    email?: string
    document?: string
    roleTitle?: string
    role_title?: string
    active?: boolean
    clearDevice?: boolean
  },
): Promise<void> {
  try {
    const payload = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      document: data.document,
      roleTitle: data.roleTitle || data.role_title,
      active: data.active,
      clearDevice: data.clearDevice,
    }
    await pb.send(`/api/admin/freelancers/${encodeURIComponent(freelancerId)}`, {
      method: 'PUT',
      body: payload,
    })
  } catch (err: unknown) {
    const pbErr = err as {
      status?: number
      data?: { error?: string }
      message?: string
    }

    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        const updateObj: Record<string, unknown> = {}
        if (data.name !== undefined) updateObj.name = data.name
        if (data.phone !== undefined) updateObj.phone = data.phone
        if (data.email !== undefined) updateObj.email = data.email
        if (data.document !== undefined) updateObj.document = data.document
        if (data.roleTitle !== undefined || data.role_title !== undefined) {
          updateObj.role_title = data.roleTitle || data.role_title
        }
        if (data.active !== undefined) updateObj.active = data.active
        if (data.clearDevice) {
          updateObj.device_id = ''
          updateObj.credential_id = ''
        }

        await pb.collection('freelancers').update(freelancerId, updateObj)
        return
      } catch (fallbackErr) {
        const fbErr = fallbackErr as { message?: string }
        throw new Error(fbErr?.message || 'Falha ao atualizar dados do freelancer.')
      }
    }

    throw new Error(
      pbErr?.data?.error || pbErr?.message || 'Falha ao atualizar dados do freelancer.',
    )
  }
}

/**
 * Limpa/desvincula o dispositivo e credencial WebAuthn do freelancer
 */
export interface ClearDeviceOptions {
  companyId?: string
  managerId?: string
  managerName?: string
  managerEmail?: string
  reason?: string
}

/**
 * Limpa/desvincula o dispositivo e credencial WebAuthn do freelancer e registra no histórico
 */
export async function clearFreelancerDevice(
  freelancerId: string,
  options?: ClearDeviceOptions,
): Promise<void> {
  const currentAuth = pb.authStore.record
  const managerId = options?.managerId || currentAuth?.id || undefined
  const managerName = options?.managerName || currentAuth?.name || undefined
  const managerEmail = options?.managerEmail || currentAuth?.email || undefined

  try {
    await pb.send(`/api/admin/freelancers/${encodeURIComponent(freelancerId)}`, {
      method: 'PUT',
      body: {
        clearDevice: true,
        companyId: options?.companyId,
        managerId,
        managerName,
        managerEmail,
        reason: options?.reason,
      },
    })
  } catch (err: unknown) {
    const pbErr = err as {
      status?: number
      data?: { error?: string }
      message?: string
    }

    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        // Obter device_id anterior antes de zerar
        let oldDeviceId = ''
        try {
          const flRecord = await pb.collection('freelancers').getOne(freelancerId)
          oldDeviceId = flRecord.device_id || ''
        } catch {
          /* intentionally ignored */
        }

        await pb.collection('freelancers').update(freelancerId, {
          device_id: '',
          credential_id: '',
        })

        // Gravar no histórico device_releases via SDK direto
        try {
          await pb.collection('device_releases').create({
            freelancer_id: freelancerId,
            company_id: options?.companyId || '',
            manager_id: managerId || '',
            manager_name: managerName || 'Gestor',
            manager_email: managerEmail || '',
            previous_device_id: oldDeviceId,
            reason: options?.reason || '',
          })
        } catch {
          /* intentionally ignored */
        }

        return
      } catch (fallbackErr) {
        const fbErr = fallbackErr as { message?: string }
        throw new Error(fbErr?.message || 'Falha ao liberar dispositivo do freelancer.')
      }
    }

    throw new Error(
      pbErr?.data?.error || pbErr?.message || 'Falha ao liberar dispositivo do freelancer.',
    )
  }
}

/**
 * Lista gestores vinculados a uma empresa
 */
export async function getCompanyManagers(companyId: string): Promise<AdminManager[]> {
  try {
    const res = await pb.send<{ managers: AdminManager[] }>(
      `/api/admin/company/${encodeURIComponent(companyId)}/managers`,
      { method: 'GET' },
    )
    return res.managers || []
  } catch (err: unknown) {
    const pbErr = err as { status?: number; data?: { error?: string }; message?: string }
    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        const licenses = await pb.collection('licenses').getFullList({
          filter: `company_id = "${companyId}"`,
        })
        if (licenses.length === 0) return []

        const licFilter = licenses.map((l) => `license_id = "${l.id}"`).join(' || ')
        const lms = await pb.collection('license_managers').getFullList({
          filter: licFilter,
          expand: 'user_id',
          sort: '-created',
        })

        const managers: AdminManager[] = []
        const seenIds = new Set<string>()

        for (const lm of lms) {
          let user = lm.expand?.user_id
          if (!user && lm.user_id) {
            try {
              user = await pb.collection('users').getOne(lm.user_id)
            } catch {
              user = null
            }
          }
          if (user && !seenIds.has(user.id)) {
            seenIds.add(user.id)
            managers.push({
              id: user.id,
              licenseManagerId: lm.id,
              licenseId: lm.license_id,
              name: user.name || 'Gestor',
              email: user.email,
              role: lm.role || 'owner',
              profile: (user.profile as 'gestor' | 'gerente') || undefined,
              inviteToken:
                (user.invite_token as string) || (user.inviteToken as string) || undefined,
              inviteStatus:
                (user.invite_status as string) || (user.inviteStatus as string) || undefined,
              created: user.created,
            })
          }
        }
        return managers
      } catch (fallbackErr) {
        const fbErr = fallbackErr as { message?: string }
        throw new Error(fbErr?.message || 'Falha ao listar gestores.')
      }
    }
    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao listar gestores.')
  }
}

/**
 * Cadastra e vincula novo gestor à empresa
 */
export async function createCompanyManager(
  payload: CreateManagerPayload,
): Promise<CreateManagerResponse> {
  try {
    const res = await pb.send<CreateManagerResponse>(
      `/api/admin/company/${encodeURIComponent(payload.companyId)}/managers`,
      {
        method: 'POST',
        body: payload,
      },
    )
    return res
  } catch (err: unknown) {
    const pbErr = err as { status?: number; data?: { error?: string }; message?: string }
    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        let licenses = await pb.collection('licenses').getList(1, 1, {
          filter: `company_id = "${payload.companyId}" && status = "active"`,
        })
        let licenseId = licenses.items[0]?.id
        if (!licenseId) {
          const allLics = await pb.collection('licenses').getList(1, 1, {
            filter: `company_id = "${payload.companyId}"`,
          })
          if (allLics.items.length > 0) {
            licenseId = allLics.items[0].id
          } else {
            const newLic = await pb.collection('licenses').create({
              company_id: payload.companyId,
              status: 'active',
              plan: 'pro',
              max_freelancers: 50,
            })
            licenseId = newLic.id
          }
        }

        let user
        const isGerente = payload.profile === 'gerente'
        const targetProfile = isGerente ? 'gerente' : 'gestor'
        const generatedToken =
          Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        // PocketBase DateField armazena formato YYYY-MM-DD HH:MM:SS.sssZ ou ISO
        const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        const userPassword =
          payload.password && payload.password.length >= 8
            ? payload.password
            : 'Pass@' + Math.random().toString(36).substring(2, 10) + 'X9!'

        try {
          const existing = await pb
            .collection('users')
            .getFirstListItem(`email = "${payload.email.toLowerCase().trim()}"`)
          user = existing
          const updateData: Record<string, unknown> = {
            name: payload.name || user.name,
            profile: targetProfile,
            invite_token: generatedToken,
            invite_status: 'pending',
            invite_expires: tokenExpires,
          }
          if (payload.password && payload.password.length >= 8) {
            updateData.password = payload.password
            updateData.passwordConfirm = payload.password
          }
          await pb.collection('users').update(user.id, updateData)
        } catch {
          // NÃO enviar 'verified: true' via client SDK: auth collections rejeitam com 400
          // quando não-superuser tenta definir 'verified' no create
          user = await pb.collection('users').create({
            email: payload.email.toLowerCase().trim(),
            password: userPassword,
            passwordConfirm: userPassword,
            name: payload.name.trim(),
            profile: targetProfile,
            invite_token: generatedToken,
            invite_status: 'pending',
            invite_expires: tokenExpires,
          })
        }

        const existingLm = await pb.collection('license_managers').getList(1, 1, {
          filter: `license_id = "${licenseId}" && user_id = "${user.id}"`,
        })

        let lmId = ''
        if (existingLm.items.length > 0) {
          lmId = existingLm.items[0].id
        } else {
          const lm = await pb.collection('license_managers').create({
            license_id: licenseId,
            user_id: user.id,
            role: payload.role || (isGerente ? 'viewer' : 'owner'),
          })
          lmId = lm.id
        }

        return {
          success: true,
          inviteToken: generatedToken,
          inviteLink: `/admin/convite?token=${generatedToken}`,
          manager: {
            id: user.id,
            licenseManagerId: lmId,
            licenseId,
            name: user.name || (isGerente ? 'Gerente' : 'Gestor'),
            email: user.email,
            role: payload.role || (isGerente ? 'viewer' : 'owner'),
            profile: payload.profile || (isGerente ? 'gerente' : 'gestor'),
            inviteToken: generatedToken,
            created: user.created,
          },
        }
      } catch (fallbackErr) {
        const fbErr = fallbackErr as { message?: string }
        throw new Error(fbErr?.message || 'Falha ao cadastrar gestor.')
      }
    }
    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao cadastrar gestor.')
  }
}

/**
 * Atualiza dados de um gestor
 */
export async function updateManager(
  managerId: string,
  payload: UpdateManagerPayload,
): Promise<void> {
  try {
    await pb.send(`/api/admin/managers/${encodeURIComponent(managerId)}`, {
      method: 'PUT',
      body: payload,
    })
  } catch (err: unknown) {
    const pbErr = err as { status?: number; data?: { error?: string }; message?: string }
    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        const updateObj: Record<string, unknown> = {}
        if (payload.name) updateObj.name = payload.name
        if (payload.email) updateObj.email = payload.email
        if (payload.profile) updateObj.profile = payload.profile
        if (payload.password) {
          updateObj.password = payload.password
          updateObj.passwordConfirm = payload.password
        }
        await pb.collection('users').update(managerId, updateObj)
        return
      } catch (fallbackErr) {
        const fbErr = fallbackErr as { message?: string }
        throw new Error(fbErr?.message || 'Falha ao atualizar dados do gestor.')
      }
    }
    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao atualizar dados do gestor.')
  }
}

/**
 * Desvincula gestor de uma empresa
 */
export async function removeManagerFromCompany(
  companyId: string,
  managerId: string,
): Promise<void> {
  try {
    await pb.send(
      `/api/admin/company/${encodeURIComponent(companyId)}/managers/${encodeURIComponent(managerId)}`,
      {
        method: 'DELETE',
      },
    )
  } catch (err: unknown) {
    const pbErr = err as { status?: number; data?: { error?: string }; message?: string }
    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        const licenses = await pb.collection('licenses').getFullList({
          filter: `company_id = "${companyId}"`,
        })
        for (const lic of licenses) {
          const lms = await pb.collection('license_managers').getFullList({
            filter: `license_id = "${lic.id}" && user_id = "${managerId}"`,
          })
          for (const lm of lms) {
            await pb.collection('license_managers').delete(lm.id)
          }
        }
        return
      } catch (fallbackErr) {
        const fbErr = fallbackErr as { message?: string }
        throw new Error(fbErr?.message || 'Falha ao desvincular gestor.')
      }
    }
    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao desvincular gestor.')
  }
}

/**
 * Duplica gestor para outra empresa
 */
/**
 * Gera ou recupera link de convite para um Gerente
 */
export async function getManagerInviteLink(
  managerId: string,
): Promise<{ success: boolean; inviteToken: string; inviteLink: string; expiresAt?: string }> {
  try {
    const res = await pb.send<{
      success: boolean
      inviteToken: string
      inviteLink: string
      expiresAt?: string
    }>(`/api/admin/managers/${encodeURIComponent(managerId)}/invite-link`, {
      method: 'POST',
    })
    return res
  } catch (err: unknown) {
    const pbErr = err as { data?: { error?: string }; message?: string }
    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao gerar link de convite.')
  }
}

export async function duplicateManager(
  sourceCompanyId: string,
  managerId: string,
  targetCompanyId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await pb.send<{ success: boolean; message: string }>(
      `/api/admin/company/${encodeURIComponent(sourceCompanyId)}/managers/${encodeURIComponent(managerId)}/duplicate`,
      {
        method: 'POST',
        body: { targetCompanyId },
      },
    )
    return res
  } catch (err: unknown) {
    const pbErr = err as { status?: number; data?: { error?: string }; message?: string }
    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        let licenses = await pb.collection('licenses').getList(1, 1, {
          filter: `company_id = "${targetCompanyId}" && status = "active"`,
        })
        let licenseId = licenses.items[0]?.id
        if (!licenseId) {
          const allLics = await pb.collection('licenses').getList(1, 1, {
            filter: `company_id = "${targetCompanyId}"`,
          })
          if (allLics.items.length > 0) {
            licenseId = allLics.items[0].id
          } else {
            const newLic = await pb.collection('licenses').create({
              company_id: targetCompanyId,
              status: 'active',
              plan: 'pro',
              max_freelancers: 50,
            })
            licenseId = newLic.id
          }
        }

        const existingLm = await pb.collection('license_managers').getList(1, 1, {
          filter: `license_id = "${licenseId}" && user_id = "${managerId}"`,
        })
        if (existingLm.items.length === 0) {
          await pb.collection('license_managers').create({
            license_id: licenseId,
            user_id: managerId,
            role: 'owner',
          })
        }

        return {
          success: true,
          message: 'Gestor vinculado com sucesso à empresa selecionada.',
        }
      } catch (fallbackErr) {
        const fbErr = fallbackErr as { message?: string }
        throw new Error(fbErr?.message || 'Falha ao duplicar gestor.')
      }
    }
    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao duplicar gestor.')
  }
}

/**
 * Consulta histórico de presença com filtros
 */
/**
 * Registra ponto manual pelo gestor
 */
export async function registerManualAttendance(
  payload: ManualAttendancePayload,
): Promise<ManualAttendanceResponse> {
  try {
    const res = await pb.send<ManualAttendanceResponse>('/api/admin/attendance/manual-register', {
      method: 'POST',
      body: payload,
    })
    return res
  } catch (err: unknown) {
    const pbErr = err as {
      status?: number
      data?: { error?: string; message?: string }
      message?: string
    }

    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        const type =
          payload.type === 'check-in' || payload.type === 'check_in' ? 'check_in' : 'check_out'
        const timestamp = payload.timestamp || new Date().toISOString()

        const recent = await pb.collection('attendance_records').getList(1, 1, {
          filter: `freelancer_id = "${payload.freelancerId}"`,
          sort: '-timestamp',
        })

        const lastRec = recent.items.length > 0 ? recent.items[0] : null
        const lastType = lastRec ? lastRec.type : null

        if (type === 'check_in' && lastType === 'check_in') {
          throw new Error('Já existe um check-in aberto para este freelancer.')
        }
        if (type === 'check_out' && (!lastRec || lastType !== 'check_in')) {
          throw new Error('Não há check-in aberto para registrar saída.')
        }

        let durationFormatted = ''
        let shiftCheckInId: string | null = null
        if (type === 'check_out' && lastRec) {
          if (lastRec.company_id !== payload.companyId) {
            throw new Error('O check-out deve ocorrer na mesma empresa do check-in.')
          }
          shiftCheckInId = lastRec.id
          const startMs = new Date(lastRec.timestamp).getTime()
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

        const created = await pb.collection('attendance_records').create({
          freelancer_id: payload.freelancerId,
          company_id: payload.companyId,
          type,
          timestamp,
          manual: true,
          shift_check_in_id: shiftCheckInId,
        })

        return {
          success: true,
          manual: true,
          durationFormatted: durationFormatted || undefined,
          record: {
            id: created.id,
            freelancerId: created.freelancer_id,
            companyId: created.company_id,
            type: created.type,
            timestamp: created.timestamp,
            manual: created.manual,
            lat: created.lat || null,
            lng: created.lng || null,
          },
        }
      } catch (fallbackErr) {
        const fbErr = fallbackErr as { message?: string }
        throw new Error(fbErr?.message || 'Falha ao registrar ponto manual.')
      }
    }

    throw new Error(
      pbErr?.data?.error ||
        pbErr?.data?.message ||
        pbErr?.message ||
        'Falha ao registrar ponto manual.',
    )
  }
}

interface RawAttendanceRecord {
  id: string
  freelancer_id: string
  company_id: string
  type: 'check_in' | 'check_out'
  timestamp: string
  manual?: boolean
  lat?: number
  lng?: number
  photo?: string
  shift_check_in_id?: string
  payment_required?: boolean
  payment_confirmed?: boolean
  received_amount_cents?: number
  payment_confirmed_at?: string
  payment_confirmed_by?: string
  payment_confirmed_by_name?: string
  expand?: {
    freelancer_id?: { name?: string; phone?: string; role_title?: string }
  }
}

function consolidateAttendanceRecords(
  records: RawAttendanceRecord[],
  companyId: string,
  companyName: string,
): AttendanceShiftItem[] {
  const shifts: AttendanceShiftItem[] = []
  const shiftsByCheckInId = new Map<string, AttendanceShiftItem>()
  const legacyOpenByKey = new Map<string, AttendanceShiftItem>()

  const toEvent = (record: RawAttendanceRecord): AttendanceEventDetails => ({
    id: record.id,
    timestamp: normalizeDateIso(record.timestamp),
    manual: Boolean(record.manual),
    lat: typeof record.lat === 'number' ? record.lat : null,
    lng: typeof record.lng === 'number' ? record.lng : null,
    photoFileName: record.photo || null,
  })

  for (const record of records) {
    const freelancer = record.expand?.freelancer_id
    const legacyKey = `${record.freelancer_id}:${record.company_id}`

    if (record.type === 'check_in') {
      const shift: AttendanceShiftItem = {
        id: record.id,
        checkInId: record.id,
        checkOutId: null,
        freelancerId: record.freelancer_id,
        freelancerName: freelancer?.name || 'Freelancer',
        freelancerPhone: freelancer?.phone || '',
        freelancerRoleTitle: freelancer?.role_title || '',
        companyId,
        companyName,
        checkIn: toEvent(record),
        checkOut: null,
        status: 'open',
        paymentRequired: Boolean(record.payment_required),
        paymentConfirmed: Boolean(record.payment_confirmed),
        receivedAmountCents: record.payment_confirmed
          ? Number(record.received_amount_cents || 0)
          : null,
        paymentConfirmedAt: record.payment_confirmed_at
          ? normalizeDateIso(record.payment_confirmed_at)
          : null,
        paymentConfirmedBy: record.payment_confirmed_by || null,
        paymentConfirmedByName: record.payment_confirmed_by_name || null,
      }
      shifts.push(shift)
      shiftsByCheckInId.set(record.id, shift)
      legacyOpenByKey.set(legacyKey, shift)
      continue
    }

    const shift = record.shift_check_in_id
      ? shiftsByCheckInId.get(record.shift_check_in_id)
      : legacyOpenByKey.get(legacyKey)
    if (shift && !shift.checkOut) {
      shift.checkOutId = record.id
      shift.checkOut = toEvent(record)
      shift.status = 'completed'
      if (legacyOpenByKey.get(legacyKey) === shift) legacyOpenByKey.delete(legacyKey)
      continue
    }

    shifts.push({
      id: record.id,
      checkInId: null,
      checkOutId: record.id,
      freelancerId: record.freelancer_id,
      freelancerName: freelancer?.name || 'Freelancer',
      freelancerPhone: freelancer?.phone || '',
      freelancerRoleTitle: freelancer?.role_title || '',
      companyId,
      companyName,
      checkIn: null,
      checkOut: toEvent(record),
      status: 'orphan',
      paymentRequired: false,
      paymentConfirmed: false,
      receivedAmountCents: null,
      paymentConfirmedAt: null,
      paymentConfirmedBy: null,
      paymentConfirmedByName: null,
    })
  }

  return shifts.sort((a, b) => {
    const aTimestamp = a.checkIn?.timestamp || a.checkOut?.timestamp || ''
    const bTimestamp = b.checkIn?.timestamp || b.checkOut?.timestamp || ''
    if (aTimestamp < bTimestamp) return 1
    if (aTimestamp > bTimestamp) return -1
    return 0
  })
}

function historyDateBoundary(value: string, isEnd: boolean): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return normalizeDateIso(value)
  const [year, month, day] = value.split('-').map(Number)
  const date = isEnd
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0)
  return date.toISOString()
}

export async function updateCompanyPaymentSettings(
  companyId: string,
  payload: PaymentSettingsPayload,
): Promise<PaymentSettingsResponse> {
  try {
    return await pb.send<PaymentSettingsResponse>(
      `/backend/v1/admin/company/${encodeURIComponent(companyId)}/payment-settings`,
      { method: 'PATCH', body: payload },
    )
  } catch (err: unknown) {
    const pbErr = err as { data?: { error?: string }; message?: string }
    throw new Error(
      pbErr?.data?.error || pbErr?.message || 'Falha ao salvar o controle de recebimento.',
    )
  }
}

export async function updateCompanyPhotoSettings(
  companyId: string,
  required: boolean,
): Promise<PhotoSettingsResponse> {
  try {
    return await pb.send<PhotoSettingsResponse>(
      `/backend/v1/admin/company/${encodeURIComponent(companyId)}/photo-settings`,
      { method: 'PATCH', body: { required } },
    )
  } catch (err: unknown) {
    const pbErr = err as { data?: { error?: string }; message?: string }
    throw new Error(
      pbErr?.data?.error || pbErr?.message || 'Falha ao salvar a exigência de fotografia.',
    )
  }
}

export async function confirmShiftPayment(
  checkInId: string,
  amountCents: number,
): Promise<ConfirmShiftPaymentResponse> {
  try {
    return await pb.send<ConfirmShiftPaymentResponse>(
      `/backend/v1/admin/attendance/${encodeURIComponent(checkInId)}/confirm-payment`,
      { method: 'POST', body: { amountCents } },
    )
  } catch (err: unknown) {
    const pbErr = err as { data?: { error?: string }; message?: string }
    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao confirmar o recebimento.')
  }
}

export async function getCompanyAttendanceHistory(
  companyId: string,
  filters?: HistoryFilterParams,
): Promise<AttendanceShiftItem[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.freelancerId) params.append('freelancerId', filters.freelancerId)
    if (filters?.startDate) {
      params.append('startDate', historyDateBoundary(filters.startDate, false))
    }
    if (filters?.endDate) {
      params.append('endDate', historyDateBoundary(filters.endDate, true))
    }
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status)

    const queryString = params.toString() ? `?${params.toString()}` : ''
    const res = await pb.send<{ version?: number; history?: AttendanceShiftItem[] }>(
      `/api/admin/company/${encodeURIComponent(companyId)}/history${queryString}`,
      { method: 'GET' },
    )
    const sanitizeHistoryItem = (shift: AttendanceShiftItem): AttendanceShiftItem => ({
      ...shift,
      checkIn: shift.checkIn
        ? { ...shift.checkIn, timestamp: normalizeDateIso(shift.checkIn.timestamp) }
        : null,
      checkOut: shift.checkOut
        ? { ...shift.checkOut, timestamp: normalizeDateIso(shift.checkOut.timestamp) }
        : null,
      paymentConfirmedAt: shift.paymentConfirmedAt
        ? normalizeDateIso(shift.paymentConfirmedAt)
        : null,
    })

    if (res?.version === 4 && Array.isArray(res.history)) {
      const sanitized = (res.history as AttendanceShiftItem[]).map(sanitizeHistoryItem)
      sanitized.sort((a, b) => {
        const aT = a.checkIn?.timestamp || a.checkOut?.timestamp || ''
        const bT = b.checkIn?.timestamp || b.checkOut?.timestamp || ''
        if (aT < bT) return 1
        if (aT > bT) return -1
        return 0
      })
      return sanitized
    }
    const staleResponseError = new Error('Versão desatualizada do histórico consolidado.')
    ;(staleResponseError as Error & { status: number }).status = 404
    throw staleResponseError
  } catch (err: unknown) {
    const pbErr = err as { status?: number; data?: { error?: string }; message?: string }
    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        let filter = `company_id = "${companyId}"`
        if (filters?.freelancerId) {
          filter += ` && freelancer_id = "${filters.freelancerId}"`
        }
        const [records, company] = await Promise.all([
          pb.collection('attendance_records').getFullList({
            filter,
            sort: 'timestamp,created',
            expand: 'freelancer_id',
          }),
          pb.collection('companies').getOne(companyId),
        ])
        let shifts = consolidateAttendanceRecords(
          records as unknown as RawAttendanceRecord[],
          companyId,
          company.name || 'Empresa',
        )

        let startMs: number | null = null
        if (filters?.startDate) {
          const sDate = new Date(historyDateBoundary(filters.startDate, false))
          startMs = isNaN(sDate.getTime()) ? null : sDate.getTime()
        }
        let endMs: number | null = null
        if (filters?.endDate) {
          const end = new Date(historyDateBoundary(filters.endDate, true))
          if (!isNaN(end.getTime())) {
            endMs = end.getTime()
          }
        }

        shifts = shifts.filter((shift) => {
          const reference = shift.checkIn?.timestamp || shift.checkOut?.timestamp || ''
          const refDate = new Date(normalizeDateIso(reference))
          const referenceMs = isNaN(refDate.getTime()) ? 0 : refDate.getTime()
          if (startMs !== null && referenceMs < startMs) return false
          if (endMs !== null && referenceMs > endMs) return false
          if (filters?.status === 'open') return shift.status === 'open'
          if (filters?.status === 'completed') return shift.status === 'completed'
          if (filters?.status === 'payment_pending') {
            return shift.status === 'completed' && shift.paymentRequired && !shift.paymentConfirmed
          }
          if (filters?.status === 'paid') return shift.paymentConfirmed
          return true
        })

        shifts.sort((a, b) => {
          const aTimestamp = a.checkIn?.timestamp || a.checkOut?.timestamp || ''
          const bTimestamp = b.checkIn?.timestamp || b.checkOut?.timestamp || ''
          if (aTimestamp < bTimestamp) return 1
          if (aTimestamp > bTimestamp) return -1
          return 0
        })

        return shifts
      } catch {
        /* intentionally ignored */
      }
    }
    throw new Error(
      pbErr?.data?.error || pbErr?.message || 'Falha ao buscar histórico de presença.',
    )
  }
}

export interface AttendancePhotoUrls {
  checkIn: string | null
  checkOut: string | null
}

export async function getAttendancePhotoUrls(
  shift: AttendanceShiftItem,
): Promise<AttendancePhotoUrls> {
  const hasPhoto = Boolean(shift.checkIn?.photoFileName || shift.checkOut?.photoFileName)
  if (!hasPhoto) return { checkIn: null, checkOut: null }

  try {
    const token = await pb.files.getToken()
    const fileUrl = (event: AttendanceEventDetails | null): string | null => {
      if (!event?.photoFileName) return null
      return pb.files.getURL(
        {
          id: event.id,
          collectionId: 'attendance_records',
          collectionName: 'attendance_records',
        },
        event.photoFileName,
        { token, thumb: '800x800f' },
      )
    }

    return {
      checkIn: fileUrl(shift.checkIn),
      checkOut: fileUrl(shift.checkOut),
    }
  } catch (err: unknown) {
    const pbErr = err as { data?: { error?: string }; message?: string }
    throw new Error(
      pbErr?.data?.error || pbErr?.message || 'Falha ao autorizar a visualização das fotografias.',
    )
  }
}
