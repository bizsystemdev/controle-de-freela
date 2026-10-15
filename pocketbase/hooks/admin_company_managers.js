routerAdd('GET', '/api/admin/company/{id}/managers', (e) => {
  const companyId = String(e.request.pathValue('id') || '').trim()

  if (!e.auth) {
    return e.json(401, { error: 'Autenticação administrativa obrigatória.' })
  }
  if (!companyId) {
    return e.json(400, { error: 'ID da empresa obrigatório.' })
  }

  const SUPERADMIN_EMAIL = 'admin@bizcheck.com'
  const isSuperadmin =
    String(e.auth.getString('role') || '')
      .trim()
      .toLowerCase() === 'superadmin' ||
    String(e.auth.getString('email') || '')
      .trim()
      .toLowerCase() === SUPERADMIN_EMAIL

  let canManage = isSuperadmin
  if (!canManage) {
    const managerLinks = $app.findRecordsByFilter(
      'license_managers',
      `user_id = '${e.auth.id}'`,
      '',
      100,
      0,
    )
    for (let i = 0; i < managerLinks.length; i++) {
      const linkRole = managerLinks[i].getString('role')
      if (linkRole !== 'owner' && linkRole !== 'admin') continue
      try {
        const license = $app.findRecordById('licenses', managerLinks[i].getString('license_id'))
        if (license.getString('company_id') === companyId) {
          canManage = true
          break
        }
      } catch (_) {}
    }
  }

  if (!canManage) {
    return e.json(403, { error: 'Usuário sem permissão para consultar gestores.' })
  }

  // 1. Find licenses for this company
  const licenses = $app.findRecordsByFilter(
    'licenses',
    `company_id = '${companyId}'`,
    '-created',
    50,
    0,
  )

  if (licenses.length === 0) {
    return e.json(200, { managers: [] })
  }

  const licIds = []
  for (let i = 0; i < licenses.length; i++) {
    licIds.push(licenses[i].id)
  }

  const licFilter = licIds.map((id) => `license_id = '${id}'`).join(' || ')
  const lms = $app.findRecordsByFilter('license_managers', licFilter, '-created', 200, 0)

  const managers = []
  const seenUserIds = {}

  for (let i = 0; i < lms.length; i++) {
    const lm = lms[i]
    const userId = lm.getString('user_id')
    if (seenUserIds[userId]) continue
    seenUserIds[userId] = true

    try {
      const user = $app.findRecordById('_pb_users_auth_', userId)
      // REQUISITO: "Quem for superadmin NÃO deve aparecer na listagem de gestores, mesmo tendo acesso a todas empresas."
      const uRole = String(user.getString('role') || '')
        .trim()
        .toLowerCase()
      const uEmail = String(user.getString('email') || '')
        .trim()
        .toLowerCase()
      if (uRole === 'superadmin' || uEmail === SUPERADMIN_EMAIL) {
        continue
      }

      const userRole = user.getString('role') || ''

      const profile =
        user.getString('profile') || (lm.getString('role') === 'viewer' ? 'gerente' : 'gestor')
      managers.push({
        id: user.id,
        licenseManagerId: lm.id,
        licenseId: lm.getString('license_id'),
        name: user.getString('name') || (profile === 'gerente' ? 'Gerente' : 'Gestor'),
        email: user.getString('email'),
        role: lm.getString('role') || 'owner',
        profile: profile,
        userRole: userRole,
        inviteToken: user.getString('invite_token'),
        inviteStatus: user.getString('invite_status'),
        created: user.getString('created'),
      })
    } catch (_) {}
  }

  return e.json(200, { managers: managers })
})
