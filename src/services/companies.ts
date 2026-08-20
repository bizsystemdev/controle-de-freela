import pb from '@/lib/pocketbase/client'

export interface CompanyData {
  id: string
  name: string
  cidade: string
  estado: string
  endereco: string
  location: {
    lat: number
    lng: number
  }
  active: boolean
}

/**
 * Busca detalhes de uma empresa pelo ID
 */
export async function getCompany(id: string): Promise<CompanyData> {
  try {
    const record = await pb.collection('companies').getOne(id)
    return {
      id: record.id,
      name: record.name,
      cidade: record.city || '',
      estado: record.state || '',
      endereco: record.address || '',
      location: {
        lat: record.lat || 0,
        lng: record.lng || 0,
      },
      active: record.active !== false,
    }
  } catch (err: unknown) {
    const pbErr = err as { data?: { error?: string }; message?: string }
    throw new Error(pbErr?.data?.error || pbErr?.message || 'Empresa não encontrada.')
  }
}

/**
 * Lista todas as empresas ativas
 */
export async function listActiveCompanies(): Promise<CompanyData[]> {
  try {
    const records = await pb.collection('companies').getFullList({
      filter: 'active = true',
      sort: 'name',
    })
    return records.map((record) => ({
      id: record.id,
      name: record.name,
      cidade: record.city || '',
      estado: record.state || '',
      endereco: record.address || '',
      location: {
        lat: record.lat || 0,
        lng: record.lng || 0,
      },
      active: record.active !== false,
    }))
  } catch (err: unknown) {
    const pbErr = err as { data?: { error?: string }; message?: string }
    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao listar empresas.')
  }
}
