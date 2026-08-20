routerAdd('POST', '/api/admin/freelancers', (e) => {
  const body = e.requestInfo().body || {}
  const companyId = String(body.companyId || '').trim()
  const name = String(body.name || '').trim()
  const phone = String(body.phone || '').trim()
  const email = String(body.email || '').trim()
  const document = String(body.document || '').trim()
  const roleTitle = String(body.roleTitle || body.role_title || '').trim()

  if (!companyId) {
    return e.json(400, { error: 'ID da empresa obrigatório.' })
  }
  if (!name) {
    return e.json(400, { error: 'Nome é obrigatório.' })
  }
  if (!phone) {
    return e.json(400, { error: 'Telefone é obrigatório.' })
  }

  // Verify company exists
  try {
    $app.findRecordById('companies', companyId)
  } catch (_) {
    return e.json(404, { error: 'Empresa não encontrada.' })
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

  // Link freelancer to company if not already linked
  const existingFcs = $app.findRecordsByFilter(
    'freelancer_companies',
    `freelancer_id = '${fl.id}' && company_id = '${companyId}'`,
    '',
    1,
    0,
  )

  let fc
  if (existingFcs.length > 0) {
    fc = existingFcs[0]
    if (!fc.getBool('active')) {
      fc.set('active', true)
      $app.save(fc)
    }
  } else {
    const fcCol = $app.findCollectionByNameOrId('freelancer_companies')
    fc = new Record(fcCol)
    fc.set('freelancer_id', fl.id)
    fc.set('company_id', companyId)
    fc.set('active', true)
    $app.save(fc)
  }

  return e.json(200, {
    success: true,
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
