routerAdd('GET', '/api/admin/company/{id}/history', (e) => {
  const companyId = String(
    e.request.pathValue('id') || e.requestInfo().pathParams?.['id'] || '',
  ).trim()
  const query = e.requestInfo().query || {}
  const freelancerId = String(query['freelancerId'] || '').trim()
  const startDate = String(query['startDate'] || '').trim()
  const endDate = String(query['endDate'] || '').trim()
  const rawType = String(query['type'] || '').trim()

  if (!companyId) {
    return e.json(400, { error: 'ID da empresa obrigatório.' })
  }

  let filter = `company_id = '${companyId}'`

  if (freelancerId) {
    filter += ` && freelancer_id = '${freelancerId}'`
  }

  if (rawType === 'check_in' || rawType === 'check-in') {
    filter += ` && type = 'check_in'`
  } else if (rawType === 'check_out' || rawType === 'check-out') {
    filter += ` && type = 'check_out'`
  }

  if (startDate) {
    const startIso = new Date(startDate).toISOString()
    filter += ` && timestamp >= '${startIso}'`
  }

  if (endDate) {
    const endObj = new Date(endDate)
    // If only date format YYYY-MM-DD, set to end of day
    if (endDate.length <= 10) {
      endObj.setHours(23, 59, 59, 999)
    }
    const endIso = endObj.toISOString()
    filter += ` && timestamp <= '${endIso}'`
  }

  const records = $app.findRecordsByFilter('attendance_records', filter, '-timestamp', 500, 0)

  // Cache freelancer details for quick joining
  const flMap = {}

  const history = []
  for (let i = 0; i < records.length; i++) {
    const rec = records[i]
    const flId = rec.getString('freelancer_id')
    if (!flMap[flId]) {
      try {
        const fl = $app.findRecordById('freelancers', flId)
        flMap[flId] = {
          name: fl.getString('name'),
          phone: fl.getString('phone'),
          roleTitle: fl.getString('role_title'),
        }
      } catch (_) {
        flMap[flId] = { name: 'Desconhecido', phone: '', roleTitle: '' }
      }
    }

    const flInfo = flMap[flId]
    const recLat = rec.getFloat('lat')
    const recLng = rec.getFloat('lng')
    history.push({
      id: rec.id,
      freelancerId: flId,
      freelancerName: flInfo.name,
      freelancerPhone: flInfo.phone,
      freelancerRoleTitle: flInfo.roleTitle,
      companyId: rec.getString('company_id'),
      type: rec.getString('type'),
      timestamp: rec.getString('timestamp'),
      manual: rec.getBool('manual'),
      lat: recLat !== 0 ? recLat : null,
      lng: recLng !== 0 ? recLng : null,
    })
  }

  return e.json(200, { history: history })
})
