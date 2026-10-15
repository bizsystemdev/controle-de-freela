routerAdd('DELETE', '/api/admin/company/{id}/freelancers/{freelancerId}', (e) => {
  const companyId = String(e.request.pathValue('id') || '').trim()
  const freelancerId = String(e.request.pathValue('freelancerId') || '').trim()

  if (!e.auth) {
    return e.json(401, { error: 'Autenticação administrativa obrigatória.' })
  }
  if (!companyId || !freelancerId) {
    return e.json(400, { error: 'ID da empresa e ID do freelancer são obrigatórios.' })
  }

  const SUPERADMIN_EMAIL = 'admin@bizcheck.com'
  const isSuperadmin =
    String(e.auth.getString('role') || '')
      .trim()
      .toLowerCase() === 'superadmin' ||
    String(e.auth.getString('email') || '')
      .trim()
      .toLowerCase() === SUPERADMIN_EMAIL

  let canManage = isSuperadmin
  if (!canManage) {
    const managerLinks = $app.findRecordsByFilter(
      'license_managers',
      `user_id = '${e.auth.id}'`,
      '',
      100,
      0,
    )
    for (let i = 0; i < managerLinks.length; i++) {
      const linkRole = managerLinks[i].getString('role')
      if (linkRole !== 'owner' && linkRole !== 'admin') continue
      try {
        const license = $app.findRecordById('licenses', managerLinks[i].getString('license_id'))
        if (license.getString('company_id') === companyId) {
          canManage = true
          break
        }
      } catch (_) {}
    }
  }

  if (!canManage) {
    return e.json(403, { error: 'Usuário sem permissão para administrar freelancers.' })
  }

  const links = $app.findRecordsByFilter(
    'freelancer_companies',
    `freelancer_id = '${freelancerId}' && company_id = '${companyId}'`,
    '',
    100,
    0,
  )
  for (let i = 0; i < links.length; i++) {
    $app.delete(links[i])
  }

  return e.json(200, {
    success: true,
    removedCount: links.length,
  })
})
