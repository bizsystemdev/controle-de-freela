routerAdd('GET', '/api/attendance/status', (e) => {
  const freelancerId = String(e.requestInfo().query['freelancerId'] || '').trim()

  if (!freelancerId) {
    return e.json(400, { error: 'freelancerId é obrigatório.' })
  }

  const records = $app.findRecordsByFilter(
    'attendance_records',
    `freelancer_id = '${freelancerId}'`,
    '-timestamp',
    1,
    0,
  )

  if (records.length === 0) {
    return e.json(200, {
      active: false,
      hasOpenCheckIn: false,
      empresaId: null,
      checkInTime: null,
    })
  }

  const lastRecord = records[0]
  const type = lastRecord.getString('type')

  if (type === 'check_in') {
    return e.json(200, {
      active: true,
      hasOpenCheckIn: true,
      empresaId: lastRecord.getString('company_id'),
      checkInTime: lastRecord.getString('timestamp'),
      record: {
        id: lastRecord.id,
        freelancerId: lastRecord.getString('freelancer_id'),
        companyId: lastRecord.getString('company_id'),
        type: type,
        timestamp: lastRecord.getString('timestamp'),
        lat: lastRecord.getFloat('lat'),
        lng: lastRecord.getFloat('lng'),
      },
    })
  }

  return e.json(200, {
    active: false,
    hasOpenCheckIn: false,
    empresaId: null,
    checkInTime: null,
  })
})
