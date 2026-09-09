// Endpoint para confirmação de recebimento/pagamento de turno de freelancer
routerAdd('POST', '/backend/v1/admin/attendance/{id}/confirm-payment', (e) => {
  const checkInId = String(e.request.pathValue('id') || '').trim()
  const body = e.requestInfo().body || {}

  if (!e.auth) {
    return e.json(401, { error: 'Autenticação administrativa obrigatória.' })
  }
  if (!checkInId) {
    return e.json(400, { error: 'Turno obrigatório.' })
  }

  const amountCents = Number(body.amountCents)
  if (!Number.isInteger(amountCents) || amountCents <= 0 || amountCents > 999999999) {
    return e.json(400, { error: 'Informe um valor recebido válido.' })
  }

  let initialCheckIn
  try {
    initialCheckIn = $app.findRecordById('attendance_records', checkInId)
  } catch (_) {
    return e.json(404, { error: 'Turno não encontrado.' })
  }
  if (initialCheckIn.getString('type') !== 'check_in') {
    return e.json(400, { error: 'O registro informado não é o início de um turno.' })
  }

  const companyId = initialCheckIn.getString('company_id')
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
    return e.json(403, { error: 'Usuário sem permissão para confirmar este recebimento.' })
  }

  try {
    $app.runInTransaction((txApp) => {
      const checkIn = txApp.findRecordById('attendance_records', checkInId)
      if (checkIn.getBool('payment_confirmed')) {
        throw new Error('PAYMENT_ALREADY_CONFIRMED')
      }
      if (!checkIn.getBool('payment_required')) {
        throw new Error('PAYMENT_NOT_REQUIRED')
      }

      const checkouts = txApp.findRecordsByFilter(
        'attendance_records',
        `shift_check_in_id = '${checkInId}' && type = 'check_out'`,
        'timestamp',
        1,
        0,
      )
      if (checkouts.length === 0) {
        throw new Error('SHIFT_NOT_COMPLETED')
      }

      checkIn.set('received_amount_cents', amountCents)
      checkIn.set('payment_confirmed', true)
      checkIn.set('payment_confirmed_at', new Date().toISOString())
      checkIn.set('payment_confirmed_by', e.auth.id)
      checkIn.set(
        'payment_confirmed_by_name',
        e.auth.getString('name') || e.auth.getString('email') || 'Gestor',
      )
      txApp.save(checkIn)
    })
  } catch (err) {
    const message = err && err.message ? err.message : String(err)
    if (message.includes('PAYMENT_ALREADY_CONFIRMED')) {
      return e.json(409, { error: 'O recebimento deste turno já foi confirmado.' })
    }
    if (message.includes('PAYMENT_NOT_REQUIRED')) {
      return e.json(400, { error: 'Este turno não exige confirmação de recebimento.' })
    }
    if (message.includes('SHIFT_NOT_COMPLETED')) {
      return e.json(400, { error: 'O turno ainda não possui check-out.' })
    }
    return e.json(500, { error: 'Falha ao confirmar o recebimento.' })
  }

  const saved = $app.findRecordById('attendance_records', checkInId)
  return e.json(200, {
    success: true,
    payment: {
      amountCents: saved.getInt('received_amount_cents'),
      confirmedAt: saved.getString('payment_confirmed_at'),
      confirmedBy: saved.getString('payment_confirmed_by'),
      confirmedByName: saved.getString('payment_confirmed_by_name'),
    },
  })
})
