routerAdd('PATCH', '/backend/v1/admin/company/{id}/photo-settings', (e) => {
  const companyId = String(e.request.pathValue('id') || '').trim()
  const body = e.requestInfo().body || {}

  if (!e.auth) {
    return e.json(401, { error: 'Autenticação administrativa obrigatória.' })
  }
  if (!companyId) {
    return e.json(400, { error: 'ID da empresa é obrigatório.' })
  }

  const managerLinks = $app.findRecordsByFilter(
    'license_managers',
    `user_id = '${e.auth.id}'`,
    '',
    100,
    0,
  )
  let hasAccess = false
  for (let i = 0; i < managerLinks.length; i++) {
    try {
      const license = $app.findRecordById('licenses', managerLinks[i].getString('license_id'))
      const role = managerLinks[i].getString('role')
      if (
        license.getString('company_id') === companyId &&
        (role === 'owner' || role === 'admin' || role === 'viewer')
      ) {
        hasAccess = true
        break
      }
    } catch (_) {}
  }
  if (!hasAccess) {
    return e.json(403, { error: 'Usuário sem permissão para configurar esta empresa.' })
  }

  if (body.required === undefined || typeof body.required !== 'boolean') {
    return e.json(400, { error: 'Informe se a fotografia deve ser obrigatória.' })
  }

  let company
  try {
    company = $app.findRecordById('companies', companyId)
  } catch (_) {
    return e.json(404, { error: 'Empresa não encontrada.' })
  }

  company.set('attendance_photo_required', body.required)
  $app.save(company)

  return e.json(200, {
    success: true,
    attendancePhotoRequired: company.getBool('attendance_photo_required'),
  })
})
