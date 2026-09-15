routerAdd('POST', '/api/admin/companies', (e) => {
  if (!e.auth) {
    return e.json(401, { error: 'Autenticação obrigatória.' })
  }

  // Apenas o SUPERADMIN pode criar empresas e cadastrar o primeiro gestor
  const userRole = e.auth.getString('role')
  const userEmail = e.auth.getString('email').toLowerCase().trim()
  const isSuperadmin = userRole === 'superadmin' || userEmail === 'admin@bizcheck.com'

  if (!isSuperadmin) {
    return e.json(403, {
      error: 'Apenas o superadmin tem permissão para cadastrar novas empresas.',
    })
  }

  const body = e.requestInfo().body || {}

  // 1. Validate required company fields
  const name = String(body.name || '').trim()
  const street = String(body.street || body.address || '').trim()
  const number = String(body.number || '').trim()
  const city = String(body.city || body.cidade || '').trim()
  const state = String(body.state || body.estado || '').trim()
  const cep = String(body.cep || '').trim()
  const neighborhood = String(body.neighborhood || body.bairro || '').trim()
  const cnpj = String(body.cnpj || '').trim()

  const plan = String(body.plan || 'pro')
    .trim()
    .toLowerCase()

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
  // Validate plan
  const validPlans = ['free', 'pro', 'enterprise']
  const normalizedPlan = validPlans.includes(plan) ? plan : 'pro'

  // Opcional: dados do primeiro gestor da empresa
  const managerName = String(body.managerName || '').trim()
  const managerEmail = String(body.managerEmail || '')
    .trim()
    .toLowerCase()
  const managerPassword = String(body.managerPassword || '').trim()

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
    createdCompany.set('active', true)
    createdCompany.set('payment_control_enabled', true)
    if (cep) createdCompany.set('cep', cep)
    if (number) createdCompany.set('number', number)
    if (neighborhood) createdCompany.set('neighborhood', neighborhood)
    if (cnpj) createdCompany.set('cnpj', cnpj)
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

    // 3. Link or create the initial manager for this company
    const lmCol = $app.findCollectionByNameOrId('license_managers')
    let linkedManager = null

    if (managerEmail && managerEmail.includes('@')) {
      let firstManagerUser = null
      const inviteToken = $security.randomString(32)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const initialPass =
        managerPassword && managerPassword.length >= 8
          ? managerPassword
          : 'M-' + $security.randomString(16) + 'A1!'

      try {
        firstManagerUser = $app.findAuthRecordByEmail('_pb_users_auth_', managerEmail)
        if (managerName) firstManagerUser.set('name', managerName)
        firstManagerUser.set('profile', 'gestor')
        firstManagerUser.set('invite_token', inviteToken)
        firstManagerUser.set('invite_status', 'pending')
        firstManagerUser.set('invite_expires', expiresAt)
        if (managerPassword && managerPassword.length >= 8) {
          firstManagerUser.setPassword(managerPassword)
        }
        $app.save(firstManagerUser)
      } catch (_) {
        const userCol = $app.findCollectionByNameOrId('_pb_users_auth_')
        firstManagerUser = new Record(userCol)
        firstManagerUser.setEmail(managerEmail)
        firstManagerUser.setPassword(initialPass)
        firstManagerUser.setVerified(true)
        firstManagerUser.set('name', managerName || 'Gestor')
        firstManagerUser.set('profile', 'gestor')
        firstManagerUser.set('role', 'gestor')
        firstManagerUser.set('invite_token', inviteToken)
        firstManagerUser.set('invite_status', 'pending')
        firstManagerUser.set('invite_expires', expiresAt)
        $app.save(firstManagerUser)
      }

      const lm = new Record(lmCol)
      lm.set('license_id', createdLicense.id)
      lm.set('user_id', firstManagerUser.id)
      lm.set('role', 'owner')
      $app.save(lm)

      linkedManager = {
        id: firstManagerUser.id,
        name: firstManagerUser.getString('name'),
        email: firstManagerUser.getString('email'),
        inviteToken: inviteToken,
        inviteLink: '/admin/convite?token=' + inviteToken,
      }
    } else {
      // Se não informou gestor específico, vincula o criador inicial
      const lm = new Record(lmCol)
      lm.set('license_id', createdLicense.id)
      lm.set('user_id', e.auth.id)
      lm.set('role', 'owner')
      $app.save(lm)

      linkedManager = {
        id: e.auth.id,
        name: e.auth.getString('name'),
        email: e.auth.getString('email'),
      }
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
        cep: createdCompany.getString('cep'),
        number: createdCompany.getString('number'),
        neighborhood: createdCompany.getString('neighborhood'),
        cnpj: createdCompany.getString('cnpj'),
        location: {
          lat: null,
          lng: null,
        },
        license: {
          id: createdLicense.id,
          plan: createdLicense.getString('plan'),
          status: createdLicense.getString('status'),
          maxFreelancers: createdLicense.getInt('max_freelancers'),
        },
        manager: linkedManager,
      },
    })
  } catch (err) {
    return e.json(500, {
      error: 'Falha ao cadastrar empresa: ' + (err && err.message ? err.message : String(err)),
    })
  }
})
