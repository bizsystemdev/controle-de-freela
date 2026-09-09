routerAdd('GET', '/api/admin/company/{id}/history', (e) => {
  const companyId = String(e.request.pathValue('id') || '').trim()
  const query = e.requestInfo().query || {}
  const freelancerId = String(query['freelancerId'] || '').trim()
  const startDate = String(query['startDate'] || '').trim()
  const endDate = String(query['endDate'] || '').trim()
  const status = String(query['status'] || query['type'] || '').trim()

  if (!e.auth) {
    return e.json(401, { error: 'Autenticação administrativa obrigatória.' })
  }
  if (!companyId) {
    return e.json(400, { error: 'ID da empresa obrigatório.' })
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
    return e.json(403, { error: 'Usuário sem permissão para consultar esta empresa.' })
  }

  let filter = `company_id = '${companyId}'`
  if (freelancerId) {
    filter += ` && freelancer_id = '${freelancerId}'`
  }

  const records = $app.findRecordsByFilter(
    'attendance_records',
    filter,
    '-timestamp,-created',
    5000,
    0,
  )
  records.reverse()
  const company = $app.findRecordById('companies', companyId)
  const freelancerMap = {}
  const shiftsByCheckInId = {}
  const orderedShifts = []

  const getFreelancer = (id) => {
    if (!freelancerMap[id]) {
      try {
        const freelancer = $app.findRecordById('freelancers', id)
        freelancerMap[id] = {
          name: freelancer.getString('name'),
          phone: freelancer.getString('phone'),
          roleTitle: freelancer.getString('role_title'),
        }
      } catch (_) {
        freelancerMap[id] = { name: 'Freelancer removido', phone: '', roleTitle: '' }
      }
    }
    return freelancerMap[id]
  }

  const normalizeIso = (val) => {
    if (!val) return ''
    const s = String(val).trim()
    if (!s) return ''
    // Ex: "2026-09-09 15:46:10.498Z" -> "2026-09-09T15:46:10.498Z"
    // Also handle dates without trailing Z: "2026-09-09 15:46:10" -> "2026-09-09T15:46:10Z"
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
      const withT = s.replace(' ', 'T')
      return withT.endsWith('Z') ? withT : withT + 'Z'
    }
    return s
  }

  const eventFromRecord = (record) => ({
    id: record.id,
    timestamp: normalizeIso(record.getString('timestamp')),
    manual: record.getBool('manual'),
    lat: record.getFloat('lat') !== 0 ? record.getFloat('lat') : null,
    lng: record.getFloat('lng') !== 0 ? record.getFloat('lng') : null,
  })

  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    if (record.getString('type') !== 'check_in') continue

    const flId = record.getString('freelancer_id')
    const freelancer = getFreelancer(flId)
    const rawPaymentConfirmedAt = record.getString('payment_confirmed_at')
    const shift = {
      id: record.id,
      checkInId: record.id,
      checkOutId: null,
      freelancerId: flId,
      freelancerName: freelancer.name,
      freelancerPhone: freelancer.phone,
      freelancerRoleTitle: freelancer.roleTitle,
      companyId: companyId,
      companyName: company.getString('name'),
      checkIn: eventFromRecord(record),
      checkOut: null,
      status: 'open',
      paymentRequired: record.getBool('payment_required'),
      paymentConfirmed: record.getBool('payment_confirmed'),
      receivedAmountCents: record.getBool('payment_confirmed')
        ? record.getInt('received_amount_cents')
        : null,
      paymentConfirmedAt: rawPaymentConfirmedAt ? normalizeIso(rawPaymentConfirmedAt) : null,
      paymentConfirmedBy: record.getString('payment_confirmed_by') || null,
      paymentConfirmedByName: record.getString('payment_confirmed_by_name') || null,
    }
    shiftsByCheckInId[record.id] = shift
    orderedShifts.push(shift)
  }

  // Keep track of the latest open shift per freelancer for fallback pairing
  const latestOpenShiftByFreelancer = {}
  for (let i = 0; i < orderedShifts.length; i++) {
    const s = orderedShifts[i]
    if (s.freelancerId) {
      latestOpenShiftByFreelancer[s.freelancerId] = s
    }
  }

  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    if (record.getString('type') !== 'check_out') continue

    const flId = record.getString('freelancer_id')
    const relationId = record.getString('shift_check_in_id')
    let shift = relationId ? shiftsByCheckInId[relationId] : null

    // Fallback: if relationId is missing or didn't match, pair with the open shift for this freelancer
    if (
      !shift &&
      flId &&
      latestOpenShiftByFreelancer[flId] &&
      !latestOpenShiftByFreelancer[flId].checkOut
    ) {
      shift = latestOpenShiftByFreelancer[flId]
    }

    if (shift && !shift.checkOut) {
      shift.checkOutId = record.id
      shift.checkOut = eventFromRecord(record)
      shift.status = 'completed'
      continue
    }

    const freelancer = getFreelancer(flId)
    orderedShifts.push({
      id: record.id,
      checkInId: null,
      checkOutId: record.id,
      freelancerId: flId,
      freelancerName: freelancer.name,
      freelancerPhone: freelancer.phone,
      freelancerRoleTitle: freelancer.roleTitle,
      companyId: companyId,
      companyName: company.getString('name'),
      checkIn: null,
      checkOut: eventFromRecord(record),
      status: 'orphan',
      paymentRequired: false,
      paymentConfirmed: false,
      receivedAmountCents: null,
      paymentConfirmedAt: null,
      paymentConfirmedBy: null,
      paymentConfirmedByName: null,
    })
  }

  const parseFilterDateMs = (dateStr, isEnd) => {
    if (!dateStr) return null
    const trimmed = String(dateStr).trim()
    if (!trimmed) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parts = trimmed.split('-')
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      if (isEnd) {
        return new Date(year, month, day, 23, 59, 59, 999).getTime()
      }
      return new Date(year, month, day, 0, 0, 0, 0).getTime()
    }
    const normalized = normalizeIso(trimmed)
    const parsed = new Date(normalized)
    if (isNaN(parsed.getTime())) return null
    if (isEnd && trimmed.length <= 10) {
      parsed.setHours(23, 59, 59, 999)
    }
    return parsed.getTime()
  }

  const startMs = parseFilterDateMs(startDate, false)
  const endMs = parseFilterDateMs(endDate, true)

  const filtered = []
  for (let i = 0; i < orderedShifts.length; i++) {
    const shift = orderedShifts[i]
    const referenceTimestamp = shift.checkIn
      ? shift.checkIn.timestamp
      : shift.checkOut
        ? shift.checkOut.timestamp
        : ''
    let referenceMs = 0
    if (referenceTimestamp) {
      const d = new Date(referenceTimestamp)
      referenceMs = isNaN(d.getTime()) ? 0 : d.getTime()
    }
    if (startMs !== null && (!referenceMs || referenceMs < startMs)) continue
    if (endMs !== null && (!referenceMs || referenceMs > endMs)) continue
    if (status === 'open' && shift.status !== 'open') continue
    if (status === 'completed' && shift.status !== 'completed') continue
    if (
      status === 'payment_pending' &&
      !(shift.status === 'completed' && shift.paymentRequired && !shift.paymentConfirmed)
    ) {
      continue
    }
    if (status === 'paid' && !shift.paymentConfirmed) continue
    filtered.push(shift)
  }

  // Sort descending: newest shift on top.
  // Timestamps are strictly normalized ISO (e.g. "2026-09-09T16:38:00.155Z"), so string comparison
  // is naturally lexicographical and completely immune to Goja's new Date() parsing quirks or NaN results.
  filtered.sort((a, b) => {
    const aTimestamp =
      (a.checkIn ? a.checkIn.timestamp : a.checkOut ? a.checkOut.timestamp : '') || ''
    const bTimestamp =
      (b.checkIn ? b.checkIn.timestamp : b.checkOut ? b.checkOut.timestamp : '') || ''
    if (aTimestamp < bTimestamp) return 1
    if (aTimestamp > bTimestamp) return -1
    return 0
  })

  console.log(
    `[admin_company_history] returning version 2 with ${filtered.length} shifts for company ${companyId}`,
  )
  return e.json(200, { version: 2, history: filtered })
})
