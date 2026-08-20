routerAdd('POST', '/api/admin/freelancers/:id/duplicate', (e) => {
  const freelancerId = String(e.requestInfo().pathParams['id'] || '').trim()
  const body = e.requestInfo().body || {}
  const targetCompanyId = String(body.targetCompanyId || body.companyId || '').trim()

  if (!freelancerId) {
    return e.json(400, { error: 'ID do freelancer obrigatório.' })
  }
  if (!targetCompanyId) {
    return e.json(400, { error: 'ID da empresa de destino obrigatório.' })
  }

  // 1. Verify freelancer exists
  let freelancer
  try {
    freelancer = $app.findRecordById('freelancers', freelancerId)
  } catch (_) {
    return e.json(404, { error: 'Freelancer não encontrado.' })
  }

  // 2. Verify target company exists
  let targetCompany
  try {
    targetCompany = $app.findRecordById('companies', targetCompanyId)
  } catch (_) {
    return e.json(404, { error: 'Empresa de destino não encontrada.' })
  }

  // 3. Link freelancer to target company
  const existingFcs = $app.findRecordsByFilter(
    'freelancer_companies',
    `freelancer_id = '${freelancer.id}' && company_id = '${targetCompany.id}'`,
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
    fc.set('freelancer_id', freelancer.id)
    fc.set('company_id', targetCompany.id)
    fc.set('active', true)
    $app.save(fc)
  }

  return e.json(200, {
    success: true,
    message: 'Freelancer vinculado com sucesso à empresa ' + targetCompany.getString('name'),
    freelancerId: freelancer.id,
    targetCompanyId: targetCompany.id,
    targetCompanyName: targetCompany.getString('name'),
  })
})
