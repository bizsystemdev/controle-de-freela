routerAdd('POST', '/api/admin/attendance/manual-register', (e) => {
  const body = e.requestInfo().body || {}
  const freelancerId = String(body.freelancerId || body.userId || '').trim()
  const companyId = String(body.companyId || body.empresaId || '').trim()
  const rawType = String(body.type || body.status || '')
    .trim()
    .toLowerCase()
  const type =
    rawType === 'check-in' || rawType === 'check_in'
      ? 'check_in'
      : rawType === 'check-out' || rawType === 'check_out'
        ? 'check_out'
        : ''
  const timestamp = body.timestamp
    ? new Date(body.timestamp).toISOString()
    : new Date().toISOString()

  if (!freelancerId || !companyId) {
    return e.json(400, { error: 'freelancerId e companyId são obrigatórios.' })
  }

  if (type !== 'check_in' && type !== 'check_out') {
    return e.json(400, { error: 'Tipo inválido. Deve ser check_in ou check_out.' })
  }

  // 1. Check manager authentication and permission
  let managerId = ''
  if (e.auth) {
    managerId = e.auth.id
  } else if (body.managerId) {
    managerId = String(body.managerId).trim()
  }

  // If we have a managerId, check if manager has access to this company
  if (managerId) {
    try {
      const lms = $app.findRecordsByFilter(
        'license_managers',
        `user_id = '${managerId}'`,
        '',
        100,
        0,
      )
      let hasAccess = false
      for (let i = 0; i < lms.length; i++) {
        try {
          const lic = $app.findRecordById('licenses', lms[i].getString('license_id'))
          if (lic.getString('company_id') === companyId) {
            hasAccess = true
            break
          }
        } catch (_) {}
      }
      if (!hasAccess && lms.length > 0) {
        return e.json(403, { error: 'Gestor não tem permissão para gerenciar esta empresa.' })
      }
    } catch (_) {}
  }

  // 2. Verify freelancer exists and is active
  let freelancer
  try {
    freelancer = $app.findRecordById('freelancers', freelancerId)
    if (!freelancer.getBool('active')) {
      return e.json(400, { error: 'Freelancer inativo.' })
    }
  } catch (_) {
    return e.json(404, { error: 'Freelancer não encontrado.' })
  }

  // 3. Verify company exists and is active
  let company
  try {
    company = $app.findRecordById('companies', companyId)
    if (!company.getBool('active')) {
      return e.json(400, { error: 'Empresa inativa.' })
    }
  } catch (_) {
    return e.json(404, { error: 'Empresa não encontrada.' })
  }

  // 4. Verify freelancer is linked to this company
  const fcRecords = $app.findRecordsByFilter(
    'freelancer_companies',
    `freelancer_id = '${freelancerId}' && company_id = '${companyId}' && active = true`,
    '',
    1,
    0,
  )
  if (fcRecords.length === 0) {
    return e.json(400, { error: 'Freelancer não está vinculado a esta empresa.' })
  }

  // 5. Business rules:
  // - Check-in: error if already has open check-in
  // - Check-out: error if no open check-in
  const recentRecords = $app.findRecordsByFilter(
    'attendance_records',
    `freelancer_id = '${freelancerId}'`,
    '-timestamp',
    1,
    0,
  )

  const lastRecord = recentRecords.length > 0 ? recentRecords[0] : null
  const lastType = lastRecord ? lastRecord.getString('type') : null

  if (type === 'check_in') {
    if (lastType === 'check_in') {
      return e.json(400, { error: 'Já existe um check-in aberto para este freelancer.' })
    }
  } else if (type === 'check_out') {
    if (!lastRecord || lastType !== 'check_in') {
      return e.json(400, { error: 'Não há check-in aberto para registrar saída.' })
    }
  }

  // 6. Create attendance record with manual: true
  const col = $app.findCollectionByNameOrId('attendance_records')
  const record = new Record(col)
  record.set('freelancer_id', freelancerId)
  record.set('company_id', companyId)
  record.set('type', type)
  record.set('timestamp', timestamp)
  record.set('manual', true)
  // No lat/lng needed for manual registers, or optional if passed
  if (typeof body.lat === 'number') record.set('lat', body.lat)
  if (typeof body.lng === 'number') record.set('lng', body.lng)
  $app.save(record)

  // Calculate duration if check-out
  let durationFormatted = ''
  if (type === 'check_out' && lastRecord) {
    const startMs = new Date(lastRecord.getString('timestamp')).getTime()
    const endMs = new Date(timestamp).getTime()
    const diffMins = Math.max(1, Math.floor((endMs - startMs) / (1000 * 60)))
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    if (hours > 0) {
      durationFormatted = hours + 'h' + (mins < 10 ? '0' : '') + mins
    } else {
      durationFormatted = mins + ' min'
    }
  }

  return e.json(200, {
    success: true,
    manual: true,
    durationFormatted: durationFormatted,
    record: {
      id: record.id,
      freelancerId: record.getString('freelancer_id'),
      companyId: record.getString('company_id'),
      type: record.getString('type'),
      timestamp: record.getString('timestamp'),
      manual: record.getBool('manual'),
      lat: record.getFloat('lat') || null,
      lng: record.getFloat('lng') || null,
    },
  })
})
