routerAdd('DELETE', '/api/admin/company/{id}/freelancers/{freelancerId}', (e) => {
  const companyId = String(e.request.pathValue('id') || '').trim()
  const freelancerId = String(e.request.pathValue('freelancerId') || '').trim()

  if (!e.auth) {
    return e.json(401, { error: 'Autenticação administrativa obrigatória.' })
  }
  if (!companyId || !freelancerId) {
    return e.json(400, { error: 'ID da empresa e ID do freelancer são obrigatórios.' })
  }

  const permissions = require(`${__hooks}/lib/admin_permissions.js`)
  if (
    !permissions.canAccessCompany($app, e.auth, companyId, permissions.COMPANY_MANAGEMENT_ROLES)
  ) {
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
