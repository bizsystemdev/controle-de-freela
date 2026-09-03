routerAdd('GET', '/api/admin/company/{id}/freelancers', (e) => {
  const companyId = String(
    e.request.pathValue('id') || e.requestInfo().pathParams?.['id'] || '',
  ).trim()

  if (!companyId) {
    return e.json(400, { error: 'ID da empresa obrigatório.' })
  }

  const fcs = $app.findRecordsByFilter(
    'freelancer_companies',
    `company_id = '${companyId}' && active = true`,
    '-created',
    1000,
    0,
  )

  const freelancers = []
  for (let i = 0; i < fcs.length; i++) {
    const fc = fcs[i]
    const freelancerId = fc.getString('freelancer_id')
    try {
      const fl = $app.findRecordById('freelancers', freelancerId)
      if (fl.getBool('active') !== false) {
        // Check if has open check-in in this company
        const lastAtt = $app.findRecordsByFilter(
          'attendance_records',
          `freelancer_id = '${freelancerId}' && company_id = '${companyId}'`,
          '-timestamp',
          1,
          0,
        )

        let hasOpenCheckIn = false
        let lastCheckInTime = null
        if (
          lastAtt.length > 0 &&
          (lastAtt[0].getString('type') === 'check_in' ||
            lastAtt[0].getString('type') === 'check-in')
        ) {
          hasOpenCheckIn = true
          lastCheckInTime = lastAtt[0].getString('timestamp')
        }

        freelancers.push({
          id: fl.id,
          fcId: fc.id,
          name: fl.getString('name'),
          phone: fl.getString('phone'),
          email: fl.getString('email'),
          document: fl.getString('document'),
          roleTitle: fl.getString('role_title'),
          deviceId: fl.getString('device_id') || null,
          hasOpenCheckIn: hasOpenCheckIn,
          lastCheckInTime: lastCheckInTime,
          created: fl.getString('created'),
        })
      }
    } catch (_) {}
  }

  return e.json(200, { freelancers: freelancers })
})
