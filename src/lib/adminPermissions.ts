export const GERENTE_ALLOWED_COMPANY_TABS = ['freelancers', 'historico', 'liberacoes'] as const

export const SUPERADMIN_EMAIL = 'admin@bizcheck.com'

export interface AdminIdentity {
  role?: string
  userRole?: string
  profile?: string
  email?: string
}

export function isGerente(manager: AdminIdentity | null): boolean {
  return manager?.profile === 'gerente' || manager?.role === 'viewer'
}

export function isSuperadmin(manager: AdminIdentity | null): boolean {
  if (!manager) return false
  if (manager.role === 'superadmin' || manager.userRole === 'superadmin') return true
  if (manager.email && manager.email.toLowerCase().trim() === SUPERADMIN_EMAIL) return true
  return false
}

export function isGerenteCompanyTabAllowed(tab: string | null): boolean {
  return GERENTE_ALLOWED_COMPANY_TABS.some((allowedTab) => allowedTab === tab)
}
