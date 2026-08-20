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
    const pbErr = err as { data?: { error?: string }; message?: string }
    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao criar nova empresa.')
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
    const pbErr = err as { data?: { error?: string }; message?: string }
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
    const pbErr = err as { data?: { error?: string }; message?: string }
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
    const pbErr = err as { data?: { error?: string }; message?: string }
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
    const pbErr = err as { data?: { error?: string }; message?: string }
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
    const pbErr = err as { data?: { error?: string }; message?: string }
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
    const pbErr = err as { data?: { error?: string }; message?: string }
    throw new Error(
      pbErr?.data?.error || pbErr?.message || 'Falha ao buscar histórico de presença.',
    )
  }
}
