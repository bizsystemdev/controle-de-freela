routerAdd('POST', '/api/attendance/register', (e) => {
  const body = e.requestInfo().body || {}
  const freelancerId = String(body.freelancerId || body.userId || '').trim()
  const companyId = String(body.companyId || body.empresaId || '').trim()
  const rawType = String(body.type || body.status || '')
    .trim()
    .toLowerCase()
  const type = rawType === 'check-in' || rawType === 'check_in' ? 'check_in' : 'check_out'
  const timestamp = body.timestamp
    ? new Date(body.timestamp).toISOString()
    : new Date().toISOString()
  const lat =
    typeof body.lat === 'number'
      ? body.lat
      : body.location && typeof body.location.lat === 'number'
        ? body.location.lat
        : null
  const lng =
    typeof body.lng === 'number'
      ? body.lng
      : body.location && typeof body.location.lng === 'number'
        ? body.location.lng
        : null

  if (!freelancerId || !companyId) {
    return e.json(400, { error: 'freelancerId e companyId são obrigatórios.' })
  }

  // 1. Verify freelancer exists and is active
  let freelancer
  try {
    freelancer = $app.findRecordById('freelancers', freelancerId)
    if (!freelancer.getBool('active')) {
      return e.json(400, { error: 'Freelancer inativo.' })
    }
  } catch (_) {
    return e.json(404, { error: 'Freelancer não encontrado.' })
  }

  // 2. Verify company exists
  let company
  try {
    company = $app.findRecordById('companies', companyId)
    if (!company.getBool('active')) {
      return e.json(400, { error: 'Empresa inativa.' })
    }
  } catch (_) {
    return e.json(404, { error: 'Empresa não encontrada.' })
  }

  // 3. Check geolocation distance if coordinates were sent and company has coordinates
  const compLat = company.getFloat('lat')
  const compLng = company.getFloat('lng')
  if (lat !== null && lng !== null && compLat !== 0 && compLng !== 0) {
    // Haversine formula inline
    const R = 6371000 // meters
    const toRad = Math.PI / 180
    const dLat = (compLat - lat) * toRad
    const dLng = (compLng - lng) * toRad
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat * toRad) * Math.cos(compLat * toRad) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distanceMeters = R * c

    // Backend tolerance: 500m
    if (distanceMeters > 500) {
      return e.json(400, {
        error: 'Localização fora do raio permitido da empresa (limite de 500m).',
        distanceMeters: Math.round(distanceMeters),
      })
    }
  }

  // 4. Check business rules:
  // - Check-in: only allowed if there is NO open check-in
  // - Check-out: only allowed if there IS an open check-in
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

  // 5. Create attendance record
  const col = $app.findCollectionByNameOrId('attendance_records')
  const record = new Record(col)
  record.set('freelancer_id', freelancerId)
  record.set('company_id', companyId)
  record.set('type', type)
  record.set('timestamp', timestamp)
  if (lat !== null) record.set('lat', lat)
  if (lng !== null) record.set('lng', lng)
  $app.save(record)

  // If check-out, calculate duration
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
    durationFormatted: durationFormatted,
    record: {
      id: record.id,
      freelancerId: record.getString('freelancer_id'),
      companyId: record.getString('company_id'),
      type: record.getString('type'),
      timestamp: record.getString('timestamp'),
      lat: record.getFloat('lat'),
      lng: record.getFloat('lng'),
    },
  })
})
