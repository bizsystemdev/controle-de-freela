routerAdd('GET', '/api/admin/device-releases', (e) => {
  const query = e.requestInfo().query || {}
  const companyId = String(query['companyId'] || query['company_id'] || '').trim()
  const freelancerId = String(query['freelancerId'] || query['freelancer_id'] || '').trim()
  const startDate = String(query['startDate'] || '').trim()
  const endDate = String(query['endDate'] || '').trim()

  let filter = 'id != ""'

  if (companyId) {
    filter += ` && company_id = '${companyId}'`
  }

  if (freelancerId) {
    filter += ` && freelancer_id = '${freelancerId}'`
  }

  if (startDate) {
    const startIso = new Date(startDate).toISOString()
    filter += ` && created >= '${startIso}'`
  }

  if (endDate) {
    const endObj = new Date(endDate)
    if (endDate.length <= 10) {
      endObj.setHours(23, 59, 59, 999)
    }
    const endIso = endObj.toISOString()
    filter += ` && created <= '${endIso}'`
  }

  let records = []
  try {
    records = $app.findRecordsByFilter('device_releases', filter, '-created', 500, 0)
  } catch (err) {
    return e.json(500, {
      error: 'Falha ao buscar registros: ' + (err && err.message ? err.message : String(err)),
    })
  }

  const flMap = {}
  const compMap = {}
  const userMap = {}

  const releases = []

  for (let i = 0; i < records.length; i++) {
    const rec = records[i]
    const flId = rec.getString('freelancer_id')
    const compId = rec.getString('company_id')
    const mgrId = rec.getString('manager_id')

    if (flId && !flMap[flId]) {
      try {
        const fl = $app.findRecordById('freelancers', flId)
        flMap[flId] = {
          name: fl.getString('name'),
          phone: fl.getString('phone'),
          email: fl.getString('email'),
          roleTitle: fl.getString('role_title'),
        }
      } catch (_) {
        flMap[flId] = { name: 'Freelancer removido', phone: '', email: '', roleTitle: '' }
      }
    }

    if (compId && !compMap[compId]) {
      try {
        const comp = $app.findRecordById('companies', compId)
        compMap[compId] = {
          name: comp.getString('name'),
          city: comp.getString('city'),
          state: comp.getString('state'),
        }
      } catch (_) {
        compMap[compId] = { name: 'Empresa', city: '', state: '' }
      }
    }

    let managerName = rec.getString('manager_name')
    let managerEmail = rec.getString('manager_email')

    if (mgrId && !managerName) {
      if (!userMap[mgrId]) {
        try {
          const u = $app.findRecordById('users', mgrId)
          userMap[mgrId] = {
            name: u.getString('name'),
            email: u.getString('email'),
          }
        } catch (_) {
          userMap[mgrId] = { name: 'Gestor', email: '' }
        }
      }
      managerName = userMap[mgrId].name
      if (!managerEmail) managerEmail = userMap[mgrId].email
    }

    const flInfo = flMap[flId] || { name: 'Freelancer', phone: '', email: '', roleTitle: '' }
    const compInfo = compMap[compId] || (compId ? { name: 'Empresa', city: '', state: '' } : null)

    releases.push({
      id: rec.id,
      freelancerId: flId,
      freelancerName: flInfo.name,
      freelancerPhone: flInfo.phone,
      freelancerRoleTitle: flInfo.roleTitle,
      companyId: compId || null,
      companyName: compInfo ? compInfo.name : null,
      managerId: mgrId || null,
      managerName: managerName || 'Gestor',
      managerEmail: managerEmail || '',
      previousDeviceId: rec.getString('previous_device_id') || null,
      reason: rec.getString('reason') || '',
      created: rec.getString('created'),
      updated: rec.getString('updated'),
    })
  }

  return e.json(200, { releases: releases })
})
