routerAdd('POST', '/api/admin/freelancers/{id}/duplicate', (e) => {
  const freelancerId = String(e.request.pathValue('id') || '').trim()
  const body = e.requestInfo().body || {}
  const singleTargetId = String(body.targetCompanyId || body.companyId || '').trim()
  const rawTargetIds = Array.isArray(body.targetCompanyIds) ? body.targetCompanyIds : []

  const targetCompanyIds = []
  if (singleTargetId) {
    targetCompanyIds.push(singleTargetId)
  }
  for (let i = 0; i < rawTargetIds.length; i++) {
    const cId = String(rawTargetIds[i] || '').trim()
    if (cId && targetCompanyIds.indexOf(cId) === -1) {
      targetCompanyIds.push(cId)
    }
  }

  if (!freelancerId) {
    return e.json(400, { error: 'ID do freelancer obrigatório.' })
  }
  if (targetCompanyIds.length === 0) {
    return e.json(400, { error: 'Ao menos uma empresa de destino deve ser selecionada.' })
  }

  // 1. Verify freelancer exists
  let freelancer
  try {
    freelancer = $app.findRecordById('freelancers', freelancerId)
  } catch (_) {
    return e.json(404, { error: 'Freelancer não encontrado.' })
  }

  // 2. Verify target companies exist & link freelancer
  const fcCol = $app.findCollectionByNameOrId('freelancer_companies')
  const linkedCompanyNames = []
  const linkedCompanyIds = []

  for (let i = 0; i < targetCompanyIds.length; i++) {
    const tId = targetCompanyIds[i]
    let targetCompany = null
    try {
      targetCompany = $app.findRecordById('companies', tId)
    } catch (_) {
      continue
    }

    if (!targetCompany) continue

    const existingFcs = $app.findRecordsByFilter(
      'freelancer_companies',
      `freelancer_id = '${freelancer.id}' && company_id = '${targetCompany.id}'`,
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
      fc.set('freelancer_id', freelancer.id)
      fc.set('company_id', targetCompany.id)
      fc.set('active', true)
      $app.save(fc)
    }

    linkedCompanyIds.push(targetCompany.id)
    linkedCompanyNames.push(targetCompany.getString('name'))
  }

  if (linkedCompanyIds.length === 0) {
    return e.json(404, { error: 'Nenhuma empresa de destino válida encontrada.' })
  }

  const message =
    linkedCompanyNames.length === 1
      ? 'Freelancer vinculado com sucesso à empresa ' + linkedCompanyNames[0]
      : 'Freelancer vinculado com sucesso a ' +
        linkedCompanyNames.length +
        ' empresas (' +
        linkedCompanyNames.join(', ') +
        ')'

  return e.json(200, {
    success: true,
    message: message,
    freelancerId: freelancer.id,
    targetCompanyIds: linkedCompanyIds,
    targetCompanyNames: linkedCompanyNames,
    // backwards compatibility for single target response
    targetCompanyId: linkedCompanyIds[0],
    targetCompanyName: linkedCompanyNames[0],
  })
})
