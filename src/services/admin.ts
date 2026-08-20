import pb from '@/lib/pocketbase/client'

export interface CompanyAdminItem {
  id: string
  name: string
  city: string
  state: string
  address: string
  location: {
    lat: number
    lng: number
  }
  freelancersCount: number
  lastCheckIn: string | null
  license?: {
    id: string
    status: string
    plan: string
    maxFreelancers: number
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
  lat: number
  lng: number
  plan: 'free' | 'pro' | 'enterprise'
  managerName: string
  managerEmail: string
  managerPassword: string
  currentAdminId?: string
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
  companyId: string
  name: string
  phone: string
  email?: string
  document?: string
  roleTitle?: string
}

export interface AttendanceHistoryItem {
  id: string
  freelancerId: string
  freelancerName: string
  freelancerPhone: string
  freelancerRoleTitle: string
  companyId: string
  type: 'check_in' | 'check_out'
  timestamp: string
  lat?: number
  lng?: number
}

export interface HistoryFilterParams {
  freelancerId?: string
  startDate?: string
  endDate?: string
  type?: 'all' | 'check_in' | 'check_out'
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
                location: {
                  lat: comp.lat || 0,
                  lng: comp.lng || 0,
                },
                freelancersCount: fcs.totalItems,
                lastCheckIn: lastAtt.items[0]?.timestamp || null,
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
          location: { lat: c.lat || 0, lng: c.lng || 0 },
          freelancersCount: 0,
          lastCheckIn: null,
        }))
      }
    }

    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao listar empresas.')
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

        return {
          companyId: comp.id,
          companyName: comp.name,
          totalFreelancers: fcs.totalItems,
          checkInsToday: todayRecords.totalItems,
          openCheckIns: todayRecords.totalItems,
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
                filter: `freelancer_id = "${fl.id}"`,
                sort: '-timestamp',
              })
              const hasOpenCheckIn =
                lastAtt.items.length > 0 && lastAtt.items[0].type === 'check_in'
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
export async function createFreelancer(
  payload: CreateFreelancerPayload,
): Promise<{ success: boolean; freelancer: unknown }> {
  try {
    const res = await pb.send<{ success: boolean; freelancer: unknown }>('/api/admin/freelancers', {
      method: 'POST',
      body: payload,
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
            document: payload.document || fl.document,
            role_title: payload.roleTitle || fl.role_title,
            active: true,
          })
        } else {
          fl = await pb.collection('freelancers').create({
            name: payload.name,
            phone: payload.phone,
            email: payload.email || '',
            document: payload.document || '',
            role_title: payload.roleTitle || '',
            active: true,
          })
        }

        // Link to company
        const fcCheck = await pb.collection('freelancer_companies').getList(1, 1, {
          filter: `freelancer_id = "${fl.id}" && company_id = "${payload.companyId}"`,
        })
        if (fcCheck.items.length === 0) {
          await pb.collection('freelancer_companies').create({
            freelancer_id: fl.id,
            company_id: payload.companyId,
            active: true,
          })
        } else if (!fcCheck.items[0].active) {
          await pb.collection('freelancer_companies').update(fcCheck.items[0].id, {
            active: true,
          })
        }

        return {
          success: true,
          freelancer: fl,
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
 * Duplica / vincula freelancer existente a outra empresa
 */
export async function duplicateFreelancer(
  freelancerId: string,
  targetCompanyId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await pb.send<{ success: boolean; message: string }>(
      `/api/admin/freelancers/${encodeURIComponent(freelancerId)}/duplicate`,
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
        const fcCheck = await pb.collection('freelancer_companies').getList(1, 1, {
          filter: `freelancer_id = "${freelancerId}" && company_id = "${targetCompanyId}"`,
        })
        if (fcCheck.items.length === 0) {
          await pb.collection('freelancer_companies').create({
            freelancer_id: freelancerId,
            company_id: targetCompanyId,
            active: true,
          })
        } else if (!fcCheck.items[0].active) {
          await pb.collection('freelancer_companies').update(fcCheck.items[0].id, {
            active: true,
          })
        }
        return {
          success: true,
          message: 'Freelancer vinculado com sucesso à empresa selecionada.',
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
  data: Partial<{
    name: string
    phone: string
    email: string
    document: string
    role_title: string
  }>,
): Promise<void> {
  try {
    await pb.collection('freelancers').update(freelancerId, data)
  } catch (err: unknown) {
    const pbErr = err as { data?: { error?: string }; message?: string }
    throw new Error(
      pbErr?.data?.error || pbErr?.message || 'Falha ao atualizar dados do freelancer.',
    )
  }
}

/**
 * Consulta histórico de presença com filtros
 */
export async function getCompanyAttendanceHistory(
  companyId: string,
  filters?: HistoryFilterParams,
): Promise<AttendanceHistoryItem[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.freelancerId) params.append('freelancerId', filters.freelancerId)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.type && filters.type !== 'all') params.append('type', filters.type)

    const queryString = params.toString() ? `?${params.toString()}` : ''
    const res = await pb.send<{ history: AttendanceHistoryItem[] }>(
      `/api/admin/company/${encodeURIComponent(companyId)}/history${queryString}`,
      { method: 'GET' },
    )
    return res.history || []
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
        if (filters?.type && filters.type !== 'all') {
          filter += ` && type = "${filters.type}"`
        }
        if (filters?.startDate) {
          filter += ` && timestamp >= "${new Date(filters.startDate).toISOString()}"`
        }
        if (filters?.endDate) {
          const endObj = new Date(filters.endDate)
          if (filters.endDate.length <= 10) endObj.setHours(23, 59, 59, 999)
          filter += ` && timestamp <= "${endObj.toISOString()}"`
        }

        const records = await pb.collection('attendance_records').getFullList({
          filter,
          sort: '-timestamp',
          expand: 'freelancer_id',
        })

        return records.map((rec) => {
          const fl = rec.expand?.freelancer_id
          return {
            id: rec.id,
            freelancerId: rec.freelancer_id,
            freelancerName: fl?.name || 'Freelancer',
            freelancerPhone: fl?.phone || '',
            freelancerRoleTitle: fl?.role_title || '',
            companyId: rec.company_id,
            type: rec.type as 'check_in' | 'check_out',
            timestamp: rec.timestamp,
            lat: rec.lat,
            lng: rec.lng,
          }
        })
      } catch {
        /* intentionally ignored */
      }
    }
    throw new Error(
      pbErr?.data?.error || pbErr?.message || 'Falha ao buscar histórico de presença.',
    )
  }
}
