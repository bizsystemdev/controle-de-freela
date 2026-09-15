routerAdd('POST', '/api/admin/companies', (e) => {
  if (!e.auth) {
    return e.json(401, { error: 'Autenticação de gestor obrigatória.' })
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

    // 3. Link the authenticated manager to the new license
    const lmCol = $app.findCollectionByNameOrId('license_managers')
    const lm = new Record(lmCol)
    lm.set('license_id', createdLicense.id)
    lm.set('user_id', e.auth.id)
    lm.set('role', 'owner')
    $app.save(lm)

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
        manager: {
          id: e.auth.id,
          name: e.auth.getString('name'),
          email: e.auth.getString('email'),
        },
      },
    })
  } catch (err) {
    return e.json(500, {
      error: 'Falha ao cadastrar empresa: ' + (err && err.message ? err.message : String(err)),
    })
  }
})
