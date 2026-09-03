routerAdd('POST', '/api/admin/company/{id}/managers/{managerId}/duplicate', (e) => {
  const sourceCompanyId = String(
    e.request.pathValue('id') || e.requestInfo().pathParams?.['id'] || '',
  ).trim()
  const managerId = String(
    e.request.pathValue('managerId') || e.requestInfo().pathParams?.['managerId'] || '',
  ).trim()
  const body = e.requestInfo().body || {}
  const targetCompanyId = String(body.targetCompanyId || '').trim()

  if (!sourceCompanyId || !managerId || !targetCompanyId) {
    return e.json(400, {
      error: 'ID da empresa de origem, ID do gestor e ID da empresa de destino são obrigatórios.',
    })
  }

  // 1. Verify manager exists
  let user
  try {
    user = $app.findRecordById('_pb_users_auth_', managerId)
  } catch (_) {
    return e.json(404, { error: 'Gestor não encontrado.' })
  }

  // 2. Find target company and license
  let targetComp
  try {
    targetComp = $app.findRecordById('companies', targetCompanyId)
  } catch (_) {
    return e.json(404, { error: 'Empresa de destino não encontrada.' })
  }

  let licenses = $app.findRecordsByFilter(
    'licenses',
    `company_id = '${targetCompanyId}'`,
    '-created',
    1,
    0,
  )
  let license
  if (licenses.length > 0) {
    license = licenses[0]
  } else {
    const licCol = $app.findCollectionByNameOrId('licenses')
    license = new Record(licCol)
    license.set('company_id', targetCompanyId)
    license.set('status', 'active')
    license.set('plan', 'pro')
    license.set('max_freelancers', 50)
    $app.save(license)
  }

  // 3. Link manager to target license
  const existingLm = $app.findRecordsByFilter(
    'license_managers',
    `license_id = '${license.id}' && user_id = '${managerId}'`,
    '',
    1,
    0,
  )

  if (existingLm.length === 0) {
    const lmCol = $app.findCollectionByNameOrId('license_managers')
    const lm = new Record(lmCol)
    lm.set('license_id', license.id)
    lm.set('user_id', managerId)
    lm.set('role', 'owner')
    $app.save(lm)
  }

  return e.json(200, {
    success: true,
    message: `Gestor ${user.getString('name')} vinculado com sucesso à empresa ${targetComp.getString('name')}.`,
  })
})
