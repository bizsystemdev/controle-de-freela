import pb from '@/lib/pocketbase/client'

export interface CompanyData {
  id: string
  name: string
  cidade: string
  estado: string
  endereco: string
  cep?: string
  number?: string
  neighborhood?: string
  cnpj?: string
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
      cidade: record.city || record.cidade || '',
      estado: record.state || record.estado || '',
      endereco: record.address || record.endereco || '',
      cep: record.cep || '',
      number: record.number || '',
      neighborhood: record.neighborhood || record.bairro || '',
      cnpj: record.cnpj || '',
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
      cidade: record.city || record.cidade || '',
      estado: record.state || record.estado || '',
      endereco: record.address || record.endereco || '',
      cep: record.cep || '',
      number: record.number || '',
      neighborhood: record.neighborhood || record.bairro || '',
      cnpj: record.cnpj || '',
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

/**
 * Busca as empresas ativas vinculadas a um freelancer pelo seu ID
 */
export async function getFreelancerCompanies(freelancerId: string): Promise<CompanyData[]> {
  if (!freelancerId) return []

  try {
    const fcs = await pb.collection('freelancer_companies').getFullList({
      filter: `freelancer_id = "${freelancerId}" && active = true`,
      expand: 'company_id',
    })

    const comps: CompanyData[] = []
    for (const fc of fcs) {
      const comp =
        fc.expand?.company_id ||
        (await pb
          .collection('companies')
          .getOne(fc.company_id)
          .catch(() => null))

      if (comp && comp.active !== false) {
        comps.push({
          id: comp.id,
          name: comp.name,
          cidade: comp.city || comp.cidade || '',
          estado: comp.state || comp.estado || '',
          endereco: comp.address || comp.endereco || '',
          cep: comp.cep || '',
          number: comp.number || '',
          neighborhood: comp.neighborhood || comp.bairro || '',
          cnpj: comp.cnpj || '',
          location: {
            lat: comp.lat || 0,
            lng: comp.lng || 0,
          },
          active: true,
        })
      }
    }
    return comps
  } catch (err: unknown) {
    const pbErr = err as { data?: { error?: string }; message?: string }
    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao buscar empresas vinculadas.')
  }
}
