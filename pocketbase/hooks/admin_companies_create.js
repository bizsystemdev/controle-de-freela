routerAdd('POST', '/api/admin/companies', (e) => {
  const body = e.requestInfo().body || {}

  // 1. Validate required company fields
  const name = String(body.name || '').trim()
  const street = String(body.street || body.address || '').trim()
  const number = String(body.number || '').trim()
  const city = String(body.city || body.cidade || '').trim()
  const state = String(body.state || body.estado || '').trim()
  const cep = String(body.cep || '').trim()
  const neighborhood = String(body.neighborhood || body.bairro || '').trim()

  const lat = typeof body.lat === 'number' ? body.lat : parseFloat(String(body.lat || ''))
  const lng = typeof body.lng === 'number' ? body.lng : parseFloat(String(body.lng || ''))

  const plan = String(body.plan || 'pro')
    .trim()
    .toLowerCase()
  const managerName = String(body.managerName || body.manager_name || '').trim()
  const managerEmail = String(body.managerEmail || body.manager_email || '')
    .trim()
    .toLowerCase()
  const managerPassword = String(body.managerPassword || body.manager_password || '').trim()
  const currentAdminId = String(body.currentAdminId || '').trim()

  if (!name) {
    return e.json(400, { error: 'Nome da empresa é obrigatório.' })
  }
  if (!street) {
    return e.json(400, { error: 'Endereço (rua) é obrigatório.' })
  }
  if (!city) {
    return e.json(400, { error: 'Cidade é obrigatória.' })
  }
  if (!state) {
    return e.json(400, { error: 'Estado é obrigatório.' })
  }
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return e.json(400, { error: 'Coordenadas (latitude e longitude) inválidas.' })
  }

  // Validate plan
  const validPlans = ['free', 'pro', 'enterprise']
  const normalizedPlan = validPlans.includes(plan) ? plan : 'pro'

  // Validate manager fields
  if (!managerName) {
    return e.json(400, { error: 'Nome do gestor é obrigatório.' })
  }
  if (!managerEmail || !managerEmail.includes('@')) {
    return e.json(400, { error: 'E-mail do gestor é inválido.' })
  }
  if (!managerPassword || managerPassword.length < 6) {
    return e.json(400, { error: 'Senha do gestor deve ter pelo menos 6 caracteres.' })
  }

  // Check if a manager with this email already exists
  let targetUser = null
  let isNewUser = false
  try {
    targetUser = $app.findAuthRecordByEmail('_pb_users_auth_', managerEmail)
    // If it exists, return friendly error as required: "Já existe um gestor com este email"
    return e.json(400, { error: 'Já existe um gestor com este email.' })
  } catch (_) {
    // User does not exist, we will create it
    isNewUser = true
  }

  let createdCompany = null
  let createdLicense = null

  try {
    // Format full address
    const fullAddress = number
      ? `${street}, ${number}${neighborhood ? ' - ' + neighborhood : ''}`
      : street

    // 1. Create company record
    const compCol = $app.findCollectionByNameOrId('companies')
    createdCompany = new Record(compCol)
    createdCompany.set('name', name)
    createdCompany.set('city', city)
    createdCompany.set('state', state.toUpperCase())
    createdCompany.set('address', fullAddress)
    createdCompany.set('lat', lat)
    createdCompany.set('lng', lng)
    createdCompany.set('active', true)
    if (cep) createdCompany.set('cep', cep)
    if (number) createdCompany.set('number', number)
    if (neighborhood) createdCompany.set('neighborhood', neighborhood)
    $app.save(createdCompany)

    // 2. Create license record
    const maxFreelancers =
      normalizedPlan === 'enterprise' ? 200 : normalizedPlan === 'pro' ? 50 : 10
    const licCol = $app.findCollectionByNameOrId('licenses')
    createdLicense = new Record(licCol)
    createdLicense.set('company_id', createdCompany.id)
    createdLicense.set('status', 'active')
    createdLicense.set('plan', normalizedPlan)
    createdLicense.set('max_freelancers', maxFreelancers)
    $app.save(createdLicense)

    // 3. Create manager user
    const usersCol = $app.findCollectionByNameOrId('_pb_users_auth_')
    targetUser = new Record(usersCol)
    targetUser.setEmail(managerEmail)
    targetUser.setPassword(managerPassword)
    targetUser.setVerified(true)
    targetUser.set('name', managerName)
    $app.save(targetUser)

    // 4. Link manager user to license in license_managers
    const lmCol = $app.findCollectionByNameOrId('license_managers')
    const lm = new Record(lmCol)
    lm.set('license_id', createdLicense.id)
    lm.set('user_id', targetUser.id)
    lm.set('role', 'owner')
    $app.save(lm)

    // 5. If current logged-in manager is different, link logged-in manager too so it appears in their dashboard
    let activeAdminId = currentAdminId
    if (!activeAdminId && e.auth) {
      activeAdminId = e.auth.id
    }
    if (activeAdminId && activeAdminId !== targetUser.id) {
      try {
        const existingAdminLink = $app.findRecordsByFilter(
          'license_managers',
          `user_id = '${activeAdminId}' && license_id = '${createdLicense.id}'`,
          '',
          1,
          0,
        )
        if (existingAdminLink.length === 0) {
          const adminLm = new Record(lmCol)
          adminLm.set('license_id', createdLicense.id)
          adminLm.set('user_id', activeAdminId)
          adminLm.set('role', 'owner')
          $app.save(adminLm)
        }
      } catch (_) {}
    }

    return e.json(200, {
      success: true,
      message: 'Empresa cadastrada com sucesso!',
      company: {
        id: createdCompany.id,
        name: createdCompany.getString('name'),
        city: createdCompany.getString('city'),
        state: createdCompany.getString('state'),
        address: createdCompany.getString('address'),
        location: {
          lat: createdCompany.getFloat('lat'),
          lng: createdCompany.getFloat('lng'),
        },
        license: {
          id: createdLicense.id,
          plan: createdLicense.getString('plan'),
          status: createdLicense.getString('status'),
          maxFreelancers: createdLicense.getInt('max_freelancers'),
        },
        manager: {
          id: targetUser.id,
          name: targetUser.getString('name'),
          email: targetUser.getString('email'),
        },
      },
    })
  } catch (err) {
    return e.json(500, {
      error: 'Falha ao cadastrar empresa: ' + (err && err.message ? err.message : String(err)),
    })
  }
})
