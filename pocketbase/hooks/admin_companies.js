routerAdd('GET', '/api/admin/companies', (e) => {
  const managerId = String(e.requestInfo().query['managerId'] || '').trim()

  let targetUserId = managerId
  // If not provided in query, check auth header/record if present
  if (!targetUserId && e.auth) {
    targetUserId = e.auth.id
  }

  let lmRecords = []
  if (targetUserId) {
    lmRecords = $app.findRecordsByFilter(
      'license_managers',
      `user_id = '${targetUserId}'`,
      '-created',
      100,
      0,
    )
  } else {
    // Return all companies if admin
    lmRecords = $app.findRecordsByFilter('license_managers', '', '-created', 100, 0)
  }

  const companiesMap = {}
  for (let i = 0; i < lmRecords.length; i++) {
    const licenseId = lmRecords[i].getString('license_id')
    try {
      const lic = $app.findRecordById('licenses', licenseId)
      const companyId = lic.getString('company_id')
      if (!companiesMap[companyId]) {
        const comp = $app.findRecordById('companies', companyId)
        if (comp && comp.getBool('active') !== false) {
          // Count freelancers for this company
          const fcs = $app.findRecordsByFilter(
            'freelancer_companies',
            `company_id = '${comp.id}' && active = true`,
            '',
            500,
            0,
          )

          // Find last check-in record
          const lastAtt = $app.findRecordsByFilter(
            'attendance_records',
            `company_id = '${comp.id}' && type = 'check_in'`,
            '-timestamp',
            1,
            0,
          )

          const lastCheckInTime = lastAtt.length > 0 ? lastAtt[0].getString('timestamp') : null

          companiesMap[companyId] = {
            id: comp.id,
            name: comp.getString('name'),
            city: comp.getString('city'),
            state: comp.getString('state'),
            address: comp.getString('address'),
            location: {
              lat: comp.getFloat('lat'),
              lng: comp.getFloat('lng'),
            },
            freelancersCount: fcs.length,
            lastCheckIn: lastCheckInTime,
            license: {
              id: lic.id,
              status: lic.getString('status'),
              plan: lic.getString('plan'),
              maxFreelancers: lic.getInt('max_freelancers'),
            },
          }
        }
      }
    } catch (_) {}
  }

  const result = []
  for (const k in companiesMap) {
    result.push(companiesMap[k])
  }

  return e.json(200, { companies: result })
})
