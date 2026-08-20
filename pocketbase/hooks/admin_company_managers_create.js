routerAdd('POST', '/api/admin/company/:id/managers', (e) => {
  const companyId = String(e.requestInfo().pathParams['id'] || '').trim()
  const body = e.requestInfo().body || {}

  if (!companyId) {
    return e.json(400, { error: 'ID da empresa obrigatório.' })
  }

  const name = String(body.name || '').trim()
  const email = String(body.email || '')
    .trim()
    .toLowerCase()
  const password = String(body.password || '').trim()
  const role = String(body.role || 'owner').trim()

  if (!name) {
    return e.json(400, { error: 'Nome do gestor é obrigatório.' })
  }
  if (!email || !email.includes('@')) {
    return e.json(400, { error: 'E-mail do gestor é inválido.' })
  }
  if (!password || password.length < 6) {
    return e.json(400, { error: 'Senha deve ter no mínimo 6 caracteres.' })
  }

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

  // 2. Find or create user
  let user
  let isExisting = false
  try {
    user = $app.findAuthRecordByEmail('_pb_users_auth_', email)
    isExisting = true
    // Update name if needed
    if (name) {
      user.set('name', name)
      $app.save(user)
    }
  } catch (_) {
    const userCol = $app.findCollectionByNameOrId('_pb_users_auth_')
    user = new Record(userCol)
    user.setEmail(email)
    user.setPassword(password)
    user.setVerified(true)
    user.set('name', name)
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

  return e.json(200, {
    success: true,
    message: isExisting
      ? 'Gestor existente vinculado à empresa!'
      : 'Gestor cadastrado e vinculado com sucesso!',
    manager: {
      id: user.id,
      licenseManagerId: lmRecord.id,
      licenseId: license.id,
      name: user.getString('name'),
      email: user.getString('email'),
      role: lmRecord.getString('role'),
    },
  })
})
