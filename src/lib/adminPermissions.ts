import type { ManagerUser } from '@/services/auth'

export const GERENTE_ALLOWED_COMPANY_TABS = ['freelancers', 'historico', 'liberacoes'] as const

export function isGerente(manager: ManagerUser | null): boolean {
  return manager?.profile === 'gerente' || manager?.role === 'viewer'
}

export function isSuperadmin(manager: ManagerUser | null): boolean {
  if (!manager) return false
  if (manager.role === 'superadmin' || manager.userRole === 'superadmin') return true
  if (manager.email && manager.email.toLowerCase().trim() === 'admin@bizcheck.com') return true
  return false
}

export function isGerenteCompanyTabAllowed(tab: string | null): boolean {
  return GERENTE_ALLOWED_COMPANY_TABS.some((allowedTab) => allowedTab === tab)
}
