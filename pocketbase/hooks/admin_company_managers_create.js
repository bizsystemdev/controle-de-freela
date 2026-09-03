routerAdd('POST', '/api/admin/company/{id}/managers', (e) => {
  const companyId = String(e.request.pathValue('id') || '').trim()
  const body = e.requestInfo().body || {}

  if (!companyId) {
    return e.json(400, { error: 'ID da empresa obrigatório.' })
  }

  const name = String(body.name || '').trim()
  const email = String(body.email || '')
    .trim()
    .toLowerCase()
  const profile =
    String(body.profile || '')
      .trim()
      .toLowerCase() === 'gerente'
      ? 'gerente'
      : 'gestor'
  let password = String(body.password || '').trim()
  const isGerente = profile === 'gerente'

  if (!name) {
    return e.json(400, { error: 'Nome é obrigatório.' })
  }
  if (!email || !email.includes('@')) {
    return e.json(400, { error: 'E-mail é inválido.' })
  }

  // Para qualquer perfil (gestor ou gerente), se a senha não foi fornecida, geramos uma temporária segura
  // com pelo menos 10 caracteres, letras maiúsculas/minúsculas e números
  if (!password || password.length < 8) {
    password = (isGerente ? 'G-' : 'M-') + $security.randomString(16) + 'A1!'
  }

  const role = isGerente ? 'viewer' : String(body.role || 'owner').trim()

  // 1. Find active license for company
  const licenses = $app.findRecordsByFilter(
    'licenses',
    `company_id = '${companyId}' && status = 'active'`,
    '-created',
    1,
    0,
  )

  let license = licenses.length > 0 ? licenses[0] : null
  if (!license) {
    // try any license
    const anyLic = $app.findRecordsByFilter(
      'licenses',
      `company_id = '${companyId}'`,
      '-created',
      1,
      0,
    )
    if (anyLic.length > 0) {
      license = anyLic[0]
    } else {
      // create license for this company
      const licCol = $app.findCollectionByNameOrId('licenses')
      license = new Record(licCol)
      license.set('company_id', companyId)
      license.set('status', 'active')
      license.set('plan', 'pro')
      license.set('max_freelancers', 50)
      $app.save(license)
    }
  }

  // 2. Find or create user and generate invite token for ANY profile (gestor or gerente)
  let user
  let isExisting = false
  const inviteToken = $security.randomString(32)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  try {
    user = $app.findAuthRecordByEmail('_pb_users_auth_', email)
    isExisting = true
    if (name) {
      user.set('name', name)
    }
    user.set('profile', profile)
    user.set('invite_token', inviteToken)
    user.set('invite_status', 'pending')
    user.set('invite_expires', expiresAt)
    // Se foi fornecida senha explicitamente para usuário existente, atualiza
    if (body.password && String(body.password).trim().length >= 8) {
      user.setPassword(String(body.password).trim())
    }
    $app.save(user)
  } catch (_) {
    const userCol = $app.findCollectionByNameOrId('_pb_users_auth_')
    user = new Record(userCol)
    user.setEmail(email)
    user.setPassword(password)
    user.setVerified(true)
    user.set('name', name)
    user.set('profile', profile)
    user.set('invite_token', inviteToken)
    user.set('invite_status', 'pending')
    user.set('invite_expires', expiresAt)
    $app.save(user)
  }

  // 3. Link user to company license in license_managers if not linked
  const existingLm = $app.findRecordsByFilter(
    'license_managers',
    `license_id = '${license.id}' && user_id = '${user.id}'`,
    '',
    1,
    0,
  )

  let lmRecord
  if (existingLm.length > 0) {
    lmRecord = existingLm[0]
  } else {
    const lmCol = $app.findCollectionByNameOrId('license_managers')
    lmRecord = new Record(lmCol)
    lmRecord.set('license_id', license.id)
    lmRecord.set('user_id', user.id)
    lmRecord.set('role', role || 'owner')
    $app.save(lmRecord)
  }

  // Link de convite gerado para QUALQUER perfil (gestor ou gerente) para definição de senha
  const inviteLink = '/admin/convite?token=' + inviteToken
  const successLabel = isGerente ? 'Gerente' : 'Gestor'

  return e.json(200, {
    success: true,
    message: isExisting
      ? successLabel + ' existente vinculado à empresa!'
      : successLabel + ' cadastrado e vinculado com sucesso!',
    inviteToken: inviteToken,
    inviteLink: inviteLink,
    manager: {
      id: user.id,
      licenseManagerId: lmRecord.id,
      licenseId: license.id,
      name: user.getString('name'),
      email: user.getString('email'),
      role: lmRecord.getString('role'),
      profile: user.getString('profile') || profile,
      inviteToken: user.getString('invite_token'),
      inviteStatus: user.getString('invite_status'),
    },
  })
})
