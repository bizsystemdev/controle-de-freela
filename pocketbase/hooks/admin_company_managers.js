routerAdd('GET', '/api/admin/company/:id/managers', (e) => {
  const companyId = String(e.requestInfo().pathParams['id'] || '').trim()

  if (!companyId) {
    return e.json(400, { error: 'ID da empresa obrigatório.' })
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
        inviteToken: user.getString('invite_token'),
        inviteStatus: user.getString('invite_status'),
        created: user.getString('created'),
      })
    } catch (_) {}
  }

  return e.json(200, { managers: managers })
})
