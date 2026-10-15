routerAdd('POST', '/api/admin/managers/{id}/invite-link', (e) => {
  const managerId = String(e.request.pathValue('id') || '').trim()

  if (!e.auth) {
    return e.json(401, { error: 'Autenticação administrativa obrigatória.' })
  }
  if (!managerId) {
    return e.json(400, { error: 'ID do usuário obrigatório.' })
  }

  const SUPERADMIN_EMAIL = 'admin@bizcheck.com'
  const isSuperadmin =
    String(e.auth.getString('role') || '')
      .trim()
      .toLowerCase() === 'superadmin' ||
    String(e.auth.getString('email') || '')
      .trim()
      .toLowerCase() === SUPERADMIN_EMAIL

  const checkCanAccessCompany = (cId) => {
    if (isSuperadmin) return true
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
        if (license.getString('company_id') === cId) {
          return true
        }
      } catch (_) {}
    }
    return false
  }

  const checkCanAccessManager = (targetMgrId) => {
    if (isSuperadmin) return true
    const targetLinks = $app.findRecordsByFilter(
      'license_managers',
      `user_id = '${targetMgrId}'`,
      '',
      500,
      0,
    )
    for (let i = 0; i < targetLinks.length; i++) {
      try {
        const license = $app.findRecordById('licenses', targetLinks[i].getString('license_id'))
        if (checkCanAccessCompany(license.getString('company_id'))) {
          return true
        }
      } catch (_) {}
    }
    return false
  }

  if (!checkCanAccessManager(managerId)) {
    return e.json(403, { error: 'Usuário sem permissão para administrar este gestor.' })
  }

  let user
  try {
    user = $app.findRecordById('_pb_users_auth_', managerId)
  } catch (_) {
    return e.json(404, { error: 'Usuário não encontrado.' })
  }

  let token = user.getString('invite_token')
  if (!token) {
    token = $security.randomString(32)
    user.set('invite_token', token)
    user.set('invite_status', 'pending')
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  user.set('invite_expires', expiresAt)
  $app.save(user)

  return e.json(200, {
    success: true,
    inviteToken: token,
    inviteLink: '/admin/convite?token=' + token,
    expiresAt: expiresAt,
  })
})
