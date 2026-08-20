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
    if (err instanceof Error) {
      throw err
    }
    const pbErr = err as { data?: { error?: string }; message?: string }
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
    const pbErr = err as { data?: { error?: string }; message?: string }
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
    const pbErr = err as { data?: { error?: string }; message?: string }
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
