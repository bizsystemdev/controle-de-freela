routerAdd('POST', '/api/admin/freelancers', (e) => {
  const body = e.requestInfo().body || {}
  const companyId = String(body.companyId || '').trim()
  const rawCompanyIds = Array.isArray(body.companyIds) ? body.companyIds : []
  const name = String(body.name || '').trim()
  const phone = String(body.phone || '').trim()
  const email = String(body.email || '').trim()
  const document = String(body.document || '').trim()
  const roleTitle = String(body.roleTitle || body.role_title || '').trim()

  // Build unique list of target companies
  const companyIds = []
  if (companyId) {
    companyIds.push(companyId)
  }
  for (let i = 0; i < rawCompanyIds.length; i++) {
    const cId = String(rawCompanyIds[i] || '').trim()
    if (cId && companyIds.indexOf(cId) === -1) {
      companyIds.push(cId)
    }
  }

  if (companyIds.length === 0) {
    return e.json(400, { error: 'Ao menos uma empresa deve ser selecionada.' })
  }
  if (!name) {
    return e.json(400, { error: 'Nome é obrigatório.' })
  }
  if (!phone) {
    return e.json(400, { error: 'Telefone é obrigatório.' })
  }

  // Verify companies exist
  const validCompanyIds = []
  for (let i = 0; i < companyIds.length; i++) {
    try {
      const c = $app.findRecordById('companies', companyIds[i])
      if (c) {
        validCompanyIds.push(companyIds[i])
      }
    } catch (_) {
      // ignore invalid id or continue
    }
  }

  if (validCompanyIds.length === 0) {
    return e.json(404, { error: 'Nenhuma empresa válida encontrada.' })
  }

  // Check if freelancer with this phone already exists
  const digits = phone.replace(/\D/g, '')
  const allFl = $app.findRecordsByFilter('freelancers', '', '-created', 500, 0)
  let fl = null
  for (let i = 0; i < allFl.length; i++) {
    const f = allFl[i]
    const fDigits = String(f.getString('phone') || '').replace(/\D/g, '')
    if (fDigits === digits) {
      fl = f
      break
    }
  }

  if (!fl) {
    const flCol = $app.findCollectionByNameOrId('freelancers')
    fl = new Record(flCol)
    fl.set('name', name)
    fl.set('phone', phone)
    if (email) fl.set('email', email)
    if (document) fl.set('document', document)
    if (roleTitle) fl.set('role_title', roleTitle)
    fl.set('active', true)
    $app.save(fl)
  } else {
    // Update data if provided
    if (name) fl.set('name', name)
    if (email) fl.set('email', email)
    if (document) fl.set('document', document)
    if (roleTitle) fl.set('role_title', roleTitle)
    fl.set('active', true)
    $app.save(fl)
  }

  // Link freelancer to all selected companies if not already linked
  const fcCol = $app.findCollectionByNameOrId('freelancer_companies')
  const linkedCompanyIds = []

  for (let i = 0; i < validCompanyIds.length; i++) {
    const targetCompId = validCompanyIds[i]
    const existingFcs = $app.findRecordsByFilter(
      'freelancer_companies',
      `freelancer_id = '${fl.id}' && company_id = '${targetCompId}'`,
      '',
      1,
      0,
    )

    if (existingFcs.length > 0) {
      const fc = existingFcs[0]
      if (!fc.getBool('active')) {
        fc.set('active', true)
        $app.save(fc)
      }
    } else {
      const fc = new Record(fcCol)
      fc.set('freelancer_id', fl.id)
      fc.set('company_id', targetCompId)
      fc.set('active', true)
      $app.save(fc)
    }
    linkedCompanyIds.push(targetCompId)
  }

  return e.json(200, {
    success: true,
    linkedCompaniesCount: linkedCompanyIds.length,
    linkedCompanyIds: linkedCompanyIds,
    freelancer: {
      id: fl.id,
      name: fl.getString('name'),
      phone: fl.getString('phone'),
      email: fl.getString('email'),
      document: fl.getString('document'),
      roleTitle: fl.getString('role_title'),
      active: fl.getBool('active'),
    },
  })
})
