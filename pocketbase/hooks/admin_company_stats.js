routerAdd('GET', '/api/admin/company/{id}/stats', (e) => {
  const companyId = String(e.request.pathValue('id') || '').trim()

  if (!e.auth) {
    return e.json(401, { error: 'Autenticação administrativa obrigatória.' })
  }
  if (!companyId) {
    return e.json(400, { error: 'ID da empresa obrigatório.' })
  }

  const permissions = require(`${__hooks}/lib/admin_permissions.js`)
  if (!permissions.canAccessCompany($app, e.auth, companyId)) {
    return e.json(403, { error: 'Usuário sem permissão para consultar esta empresa.' })
  }

  let company
  try {
    company = $app.findRecordById('companies', companyId)
  } catch (_) {
    return e.json(404, { error: 'Empresa não encontrada.' })
  }

  // 1. Total active freelancers in this company
  const fcs = $app.findRecordsByFilter(
    'freelancer_companies',
    `company_id = '${companyId}' && active = true`,
    '',
    1000,
    0,
  )
  const totalFreelancers = fcs.length

  // 2. Check-ins today
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayIso = todayStart.toISOString()

  const todayRecords = $app.findRecordsByFilter(
    'attendance_records',
    `company_id = '${companyId}' && type = 'check_in' && timestamp >= '${todayIso}'`,
    '-timestamp',
    1000,
    0,
  )
  const checkInsToday = todayRecords.length

  // 3. Open check-ins currently (records with type = 'check_in' without a subsequent check_out)
  let openCheckIns = 0
  for (let i = 0; i < fcs.length; i++) {
    const freelancerId = fcs[i].getString('freelancer_id')
    const lastAtt = $app.findRecordsByFilter(
      'attendance_records',
      `freelancer_id = '${freelancerId}' && company_id = '${companyId}'`,
      '-timestamp',
      1,
      0,
    )
    if (
      lastAtt.length > 0 &&
      (lastAtt[0].getString('type') === 'check_in' || lastAtt[0].getString('type') === 'check-in')
    ) {
      openCheckIns++
    }
  }

  return e.json(200, {
    companyId: company.id,
    companyName: company.getString('name'),
    totalFreelancers: totalFreelancers,
    checkInsToday: checkInsToday,
    openCheckIns: openCheckIns,
  })
})
