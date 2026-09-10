// Configuração de pagamento da empresa - v2
routerAdd('PATCH', '/backend/v1/admin/company/{id}/payment-settings', (e) => {
  const companyId = String(e.request.pathValue('id') || '').trim()
  const body = e.requestInfo().body || {}

  if (!e.auth) {
    return e.json(401, { error: 'Autenticação administrativa obrigatória.' })
  }
  if (!companyId) {
    return e.json(400, { error: 'ID da empresa é obrigatório.' })
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
    return e.json(403, { error: 'Usuário sem permissão para configurar esta empresa.' })
  }

  let company
  try {
    company = $app.findRecordById('companies', companyId)
  } catch (_) {
    return e.json(404, { error: 'Empresa não encontrada.' })
  }

  if (body.enabled === undefined || typeof body.enabled !== 'boolean') {
    return e.json(400, { error: 'A situação do controle de recebimento é obrigatória.' })
  }

  let baseAmountCents = 0
  if (
    body.baseAmountCents !== undefined &&
    body.baseAmountCents !== null &&
    body.baseAmountCents !== ''
  ) {
    baseAmountCents = Number(body.baseAmountCents)
    if (!Number.isInteger(baseAmountCents) || baseAmountCents <= 0 || baseAmountCents > 999999999) {
      return e.json(400, { error: 'O valor base deve ser um número positivo em centavos.' })
    }
  }

  company.set('payment_control_enabled', body.enabled)
  company.set('freelancer_shift_base_amount_cents', baseAmountCents)
  $app.save(company)

  return e.json(200, {
    success: true,
    paymentControlEnabled: company.getBool('payment_control_enabled'),
    baseAmountCents:
      company.getInt('freelancer_shift_base_amount_cents') > 0
        ? company.getInt('freelancer_shift_base_amount_cents')
        : null,
  })
})
