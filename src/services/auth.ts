import pb from '@/lib/pocketbase/client'

export interface ApiUser {
  id: string
  name: string
  phone: string
  deviceId: string | null
}

export interface ApiLocation {
  lat: number
  lng: number
}

export interface ApiCompany {
  id: string
  name: string
  cidade: string
  estado: string
  endereco: string
  location: ApiLocation
  freelancersCount?: number
  lastCheckIn?: string | null
}

export interface ValidatePhoneResponse {
  found: boolean
  user?: ApiUser
  companies?: ApiCompany[]
  error?: string
}

export interface ManagerUser {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'viewer'
}

export interface ManagerLoginResponse {
  token: string
  user: ManagerUser
}

/**
 * Valida o telefone do freelancer e retorna os dados e empresas vinculadas
 */
export async function validatePhone(
  phone: string,
): Promise<{ user: ApiUser; companies: ApiCompany[] }> {
  try {
    const res = await pb.send<ValidatePhoneResponse>('/api/auth/validate-phone', {
      method: 'POST',
      body: { phone },
    })

    if (!res.found || !res.user) {
      throw new Error('Telefone não encontrado no sistema. Verifique com a empresa contratante.')
    }

    return {
      user: res.user,
      companies: res.companies || [],
    }
  } catch (err: unknown) {
    const pbErr = err as { status?: number; data?: { error?: string }; message?: string }

    // Fallback directly via PocketBase SDK
    if (
      pbErr?.status === 404 ||
      pbErr?.message?.includes("wasn't found") ||
      pbErr?.message?.includes('File not found')
    ) {
      try {
        const digits = phone.replace(/\D/g, '')
        const allFl = await pb.collection('freelancers').getFullList({
          filter: 'active = true',
          sort: '-created',
        })

        let matched = allFl.find((f) => (f.phone || '').replace(/\D/g, '') === digits)
        if (!matched && phone.trim()) {
          matched = allFl.find((f) => f.phone === phone.trim())
        }

        if (!matched) {
          throw new Error(
            'Telefone não encontrado no sistema. Verifique com a empresa contratante.',
          )
        }

        // Fetch companies
        const fcs = await pb.collection('freelancer_companies').getFullList({
          filter: `freelancer_id = "${matched.id}" && active = true`,
          expand: 'company_id',
        })

        const comps: ApiCompany[] = []
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
              cidade: comp.city || '',
              estado: comp.state || '',
              endereco: comp.address || '',
              location: {
                lat: comp.lat || 0,
                lng: comp.lng || 0,
              },
            })
          }
        }

        return {
          user: {
            id: matched.id,
            name: matched.name,
            phone: matched.phone,
            deviceId: matched.device_id || null,
          },
          companies: comps,
        }
      } catch (fallbackErr) {
        if (fallbackErr instanceof Error) {
          throw fallbackErr
        }
      }
    }

    if (err instanceof Error) {
      throw err
    }
    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao validar telefone.')
  }
}

/**
 * Registra o dispositivo do freelancer (WebAuthn credential)
 */
export async function registerDevice(
  freelancerId: string,
  credentialId: string,
): Promise<{ success: boolean; deviceId: string }> {
  try {
    const res = await pb.send<{ success: boolean; deviceId: string }>('/api/auth/register-device', {
      method: 'POST',
      body: { freelancerId, credentialId },
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
        const genDeviceId = 'dev-' + Math.random().toString(36).substring(2, 12)
        await pb.collection('freelancers').update(freelancerId, {
          device_id: genDeviceId,
          credential_id: credentialId,
        })
        return {
          success: true,
          deviceId: genDeviceId,
        }
      } catch (fallbackErr: unknown) {
        const fbErr = fallbackErr as { message?: string }
        throw new Error(fbErr?.message || 'Falha ao registrar dispositivo.')
      }
    }

    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha ao registrar dispositivo.')
  }
}

/**
 * Autentica o freelancer com a credencial WebAuthn
 */
export async function authenticateFreelancer(
  freelancerId: string,
  credentialId?: string,
): Promise<{ success: boolean; freelancer?: ApiUser }> {
  try {
    const res = await pb.send<{ success: boolean; freelancer?: ApiUser }>(
      '/api/auth/authenticate',
      {
        method: 'POST',
        body: { freelancerId, credentialId },
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
        const fl = await pb.collection('freelancers').getOne(freelancerId)
        return {
          success: true,
          freelancer: {
            id: fl.id,
            name: fl.name,
            phone: fl.phone,
            deviceId: fl.device_id || null,
          },
        }
      } catch (fallbackErr: unknown) {
        const fbErr = fallbackErr as { message?: string }
        throw new Error(fbErr?.message || 'Falha na autenticação do dispositivo.')
      }
    }

    throw new Error(pbErr?.data?.error || pbErr?.message || 'Falha na autenticação do dispositivo.')
  }
}

/**
 * Login de gestor / administrador com email e senha
 */
export async function loginManager(email: string, password: string): Promise<ManagerLoginResponse> {
  try {
    // We can also authenticate with standard PB auth and verify manager role
    const authData = await pb.collection('users').authWithPassword(email, password)

    // Check if user is manager in license_managers
    const lm = await pb.collection('license_managers').getList(1, 10, {
      filter: `user_id = "${authData.record.id}"`,
    })

    if (lm.items.length === 0) {
      pb.authStore.clear()
      throw new Error('Usuário não possui permissão de gestor.')
    }

    const role = (lm.items[0].role as 'owner' | 'admin' | 'viewer') || 'admin'
    const managerUser: ManagerUser = {
      id: authData.record.id,
      name: authData.record.name || 'Gestor',
      email: authData.record.email,
      role,
    }

    return {
      token: pb.authStore.token,
      user: managerUser,
    }
  } catch (err: unknown) {
    const pbErr = err as { data?: { message?: string; error?: string }; message?: string }
    throw new Error(
      pbErr?.data?.message || pbErr?.data?.error || pbErr?.message || 'E-mail ou senha incorretos.',
    )
  }
}

/**
 * Logout do gestor
 */
export function logoutManager(): void {
  pb.authStore.clear()
}

/**
 * Solicitação de recuperação de senha
 */
export async function requestPasswordReset(email: string): Promise<boolean> {
  try {
    await pb.collection('users').requestPasswordReset(email)
    return true
  } catch (err: unknown) {
    const pbErr = err as { data?: { message?: string }; message?: string }
    throw new Error(
      pbErr?.data?.message || pbErr?.message || 'Falha ao solicitar recuperação de senha.',
    )
  }
}
