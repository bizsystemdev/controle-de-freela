routerAdd('PUT', '/api/admin/managers/{id}', (e) => {
  const managerId = String(e.request.pathValue('id') || '').trim()
  const body = e.requestInfo().body || {}

  if (!e.auth) {
    return e.json(401, { error: 'Autenticação administrativa obrigatória.' })
  }
  if (!managerId) {
    return e.json(400, { error: 'ID do gestor obrigatório.' })
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
    return e.json(404, { error: 'Gestor não encontrado.' })
  }

  const name = String(body.name || '').trim()
  const email = String(body.email || '')
    .trim()
    .toLowerCase()
  const profile = body.profile !== undefined ? String(body.profile).trim().toLowerCase() : ''
  const password = String(body.password || '').trim()

  if (name) {
    user.set('name', name)
  }

  if (profile === 'gerente' || profile === 'gestor') {
    user.set('profile', profile)
  }

  if (email && email !== user.getString('email')) {
    // Check duplicate
    try {
      const existing = $app.findAuthRecordByEmail('_pb_users_auth_', email)
      if (existing && existing.id !== managerId) {
        return e.json(400, { error: 'Já existe outro gestor com este email.' })
      }
    } catch (_) {}
    user.setEmail(email)
  }

  if (password) {
    if (password.length < 6) {
      return e.json(400, { error: 'Senha deve ter no mínimo 6 caracteres.' })
    }
    user.setPassword(password)
  }

  try {
    $app.save(user)

    // Se o perfil mudou, sincroniza na role de license_managers
    if (profile === 'gerente' || profile === 'gestor') {
      const targetRole = profile === 'gerente' ? 'viewer' : 'owner'
      const lms = $app.findRecordsByFilter(
        'license_managers',
        `user_id = '${managerId}'`,
        '',
        50,
        0,
      )
      for (let i = 0; i < lms.length; i++) {
        lms[i].set('role', targetRole)
        try {
          $app.save(lms[i])
        } catch (_) {}
      }
    }

    return e.json(200, {
      success: true,
      message: 'Gestor atualizado com sucesso.',
      manager: {
        id: user.id,
        name: user.getString('name'),
        email: user.getString('email'),
        profile: user.getString('profile') || 'gestor',
      },
    })
  } catch (err) {
    return e.json(400, {
      error:
        'Falha ao atualizar dados do gestor: ' + (err && err.message ? err.message : String(err)),
    })
  }
})
