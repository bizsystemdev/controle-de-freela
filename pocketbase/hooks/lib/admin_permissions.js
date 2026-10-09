const SUPERADMIN_EMAIL = 'admin@bizcheck.com'
const COMPANY_ACCESS_ROLES = ['owner', 'admin', 'viewer']
const COMPANY_MANAGEMENT_ROLES = ['owner', 'admin']

function getRecordString(record, field) {
  if (!record || typeof record.getString !== 'function') return ''
  return String(record.getString(field) || '').trim()
}

function isSuperadmin(record) {
  if (!record) return false

  const role = getRecordString(record, 'role').toLowerCase()
  const email = getRecordString(record, 'email').toLowerCase()
  return role === 'superadmin' || email === SUPERADMIN_EMAIL
}

function getCompanyRole(app, authRecord, companyId) {
  if (!authRecord || !companyId) return null
  if (isSuperadmin(authRecord)) return 'superadmin'

  const managerLinks = app.findRecordsByFilter(
    'license_managers',
    `user_id = '${authRecord.id}'`,
    '',
    100,
    0,
  )

  for (let i = 0; i < managerLinks.length; i++) {
    try {
      const license = app.findRecordById('licenses', managerLinks[i].getString('license_id'))
      if (license.getString('company_id') === companyId) {
        return managerLinks[i].getString('role') || null
      }
    } catch (_) {}
  }

  return null
}

function canAccessCompany(app, authRecord, companyId, allowedRoles) {
  const role = getCompanyRole(app, authRecord, companyId)
  if (role === 'superadmin') return true

  const roles = Array.isArray(allowedRoles) ? allowedRoles : COMPANY_ACCESS_ROLES
  return role !== null && roles.indexOf(role) !== -1
}

function getAccessibleCompanyIds(app, authRecord, allowedRoles) {
  if (!authRecord) return []

  if (isSuperadmin(authRecord)) {
    const companies = app.findRecordsByFilter('companies', 'id != ""', '', 1000, 0)
    return companies.map((company) => company.id)
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : COMPANY_ACCESS_ROLES
  const managerLinks = app.findRecordsByFilter(
    'license_managers',
    `user_id = '${authRecord.id}'`,
    '',
    500,
    0,
  )
  const companyIds = []

  for (let i = 0; i < managerLinks.length; i++) {
    const role = managerLinks[i].getString('role')
    if (roles.indexOf(role) === -1) continue

    try {
      const license = app.findRecordById('licenses', managerLinks[i].getString('license_id'))
      const companyId = license.getString('company_id')
      if (companyId && companyIds.indexOf(companyId) === -1) {
        companyIds.push(companyId)
      }
    } catch (_) {}
  }

  return companyIds
}

function canAccessFreelancer(app, authRecord, freelancerId, allowedRoles) {
  if (!authRecord || !freelancerId) return false
  if (isSuperadmin(authRecord)) return true

  const links = app.findRecordsByFilter(
    'freelancer_companies',
    `freelancer_id = '${freelancerId}'`,
    '',
    500,
    0,
  )
  for (let i = 0; i < links.length; i++) {
    if (canAccessCompany(app, authRecord, links[i].getString('company_id'), allowedRoles)) {
      return true
    }
  }

  return false
}

function canAccessManager(app, authRecord, managerId, allowedRoles) {
  if (!authRecord || !managerId) return false
  if (isSuperadmin(authRecord)) return true

  const managerLinks = app.findRecordsByFilter(
    'license_managers',
    `user_id = '${managerId}'`,
    '',
    500,
    0,
  )
  for (let i = 0; i < managerLinks.length; i++) {
    try {
      const license = app.findRecordById('licenses', managerLinks[i].getString('license_id'))
      if (canAccessCompany(app, authRecord, license.getString('company_id'), allowedRoles)) {
        return true
      }
    } catch (_) {}
  }

  return false
}

module.exports = {
  SUPERADMIN_EMAIL,
  COMPANY_ACCESS_ROLES,
  COMPANY_MANAGEMENT_ROLES,
  isSuperadmin,
  getCompanyRole,
  canAccessCompany,
  getAccessibleCompanyIds,
  canAccessFreelancer,
  canAccessManager,
}
