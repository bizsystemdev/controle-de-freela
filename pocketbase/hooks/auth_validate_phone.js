routerAdd('POST', '/api/auth/validate-phone', (e) => {
  const body = e.requestInfo().body || {}
  const rawPhone = String(body.phone || '').trim()
  const digits = rawPhone.replace(/\D/g, '')

  if (digits.length < 10 || digits.length > 11) {
    return e.json(400, { error: 'Número de telefone inválido.' })
  }

  // Find all freelancers matching phone or raw digits
  const records = $app.findRecordsByFilter('freelancers', 'active = true', '-created', 100, 0)

  let foundFreelancer = null
  for (let i = 0; i < records.length; i++) {
    const f = records[i]
    const fDigits = String(f.getString('phone') || '').replace(/\D/g, '')
    if (fDigits === digits) {
      foundFreelancer = f
      break
    }
  }

  if (!foundFreelancer) {
    return e.json(200, { found: false })
  }

  // Get associated companies
  const freelancerId = foundFreelancer.id
  const fcRecords = $app.findRecordsByFilter(
    'freelancer_companies',
    `freelancer_id = '${freelancerId}' && active = true`,
    '-created',
    100,
    0,
  )

  const companies = []
  for (let i = 0; i < fcRecords.length; i++) {
    const companyId = fcRecords[i].getString('company_id')
    try {
      const comp = $app.findRecordById('companies', companyId)
      if (comp && comp.getBool('active') !== false) {
        companies.push({
          id: comp.id,
          name: comp.getString('name'),
          cidade: comp.getString('city'),
          estado: comp.getString('state'),
          endereco: comp.getString('address'),
          location: {
            lat: comp.getFloat('lat'),
            lng: comp.getFloat('lng'),
          },
        })
      }
    } catch (_) {}
  }

  return e.json(200, {
    found: true,
    user: {
      id: foundFreelancer.id,
      name: foundFreelancer.getString('name'),
      phone: foundFreelancer.getString('phone'),
      deviceId: foundFreelancer.getString('device_id') || null,
    },
    companies: companies,
  })
})
