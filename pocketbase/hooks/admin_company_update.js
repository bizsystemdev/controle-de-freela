routerAdd('PUT', '/api/admin/company/{id}', (e) => {
  const companyId = String(e.request.pathValue('id') || '').trim()
  const body = e.requestInfo().body || {}

  if (!companyId) {
    return e.json(400, { error: 'ID da empresa é obrigatório.' })
  }

  let comp = null
  try {
    comp = $app.findRecordById('companies', companyId)
  } catch (_) {
    return e.json(404, { error: 'Empresa não encontrada.' })
  }

  const name = String(body.name || '').trim()
  const street = String(body.street || body.address || '').trim()
  const number = String(body.number || '').trim()
  const city = String(body.city || body.cidade || '').trim()
  const state = String(body.state || body.estado || '').trim()
  const cep = String(body.cep || '').trim()
  const neighborhood = String(body.neighborhood || body.bairro || '').trim()
  const cnpj = String(body.cnpj || '').trim()
  const plan = String(body.plan || '')
    .trim()
    .toLowerCase()

  if (body.name !== undefined) {
    if (!name) {
      return e.json(400, { error: 'Nome da empresa é obrigatório.' })
    }
    comp.set('name', name)
  }

  if (body.city !== undefined || body.cidade !== undefined) {
    if (!city) {
      return e.json(400, { error: 'Cidade é obrigatória.' })
    }
    comp.set('city', city)
  }

  if (body.state !== undefined || body.estado !== undefined) {
    if (!state) {
      return e.json(400, { error: 'Estado é obrigatório.' })
    }
    comp.set('state', state.toUpperCase())
  }

  if (
    body.street !== undefined ||
    body.address !== undefined ||
    body.number !== undefined ||
    body.neighborhood !== undefined
  ) {
    const fullAddress = number
      ? `${street}, ${number}${neighborhood ? ' - ' + neighborhood : ''}`
      : street
    if (fullAddress) {
      comp.set('address', fullAddress)
    }
  }

  if (body.number !== undefined) comp.set('number', number)
  if (body.neighborhood !== undefined || body.bairro !== undefined)
    comp.set('neighborhood', neighborhood)
  if (body.cep !== undefined) comp.set('cep', cep)
  if (body.cnpj !== undefined) comp.set('cnpj', cnpj)

  if (body.lat !== undefined) {
    const lat = typeof body.lat === 'number' ? body.lat : parseFloat(String(body.lat || ''))
    if (!isNaN(lat) && lat >= -90 && lat <= 90) {
      comp.set('lat', lat)
    }
  }

  if (body.lng !== undefined) {
    const lng = typeof body.lng === 'number' ? body.lng : parseFloat(String(body.lng || ''))
    if (!isNaN(lng) && lng >= -180 && lng <= 180) {
      comp.set('lng', lng)
    }
  }

  if (body.active !== undefined) {
    comp.set('active', Boolean(body.active))
  }

  try {
    $app.save(comp)

    // Se o plano foi fornecido, atualiza também a licença da empresa
    if (plan && ['free', 'pro', 'enterprise'].includes(plan)) {
      try {
        const lics = $app.findRecordsByFilter(
          'licenses',
          `company_id = '${comp.id}'`,
          '-created',
          1,
          0,
        )
        if (lics.length > 0) {
          const lic = lics[0]
          const maxFreelancers = plan === 'enterprise' ? 200 : plan === 'pro' ? 50 : 10
          lic.set('plan', plan)
          lic.set('max_freelancers', maxFreelancers)
          $app.save(lic)
        }
      } catch (_) {}
    }

    return e.json(200, {
      success: true,
      message: 'Empresa atualizada com sucesso!',
      company: {
        id: comp.id,
        name: comp.getString('name'),
        city: comp.getString('city'),
        state: comp.getString('state'),
        address: comp.getString('address'),
        cep: comp.getString('cep'),
        number: comp.getString('number'),
        neighborhood: comp.getString('neighborhood'),
        cnpj: comp.getString('cnpj'),
        location: {
          lat: comp.getFloat('lat'),
          lng: comp.getFloat('lng'),
        },
        active: comp.getBool('active'),
      },
    })
  } catch (err) {
    return e.json(500, {
      error: 'Falha ao atualizar empresa: ' + (err && err.message ? err.message : String(err)),
    })
  }
})
