routerAdd('DELETE', '/api/admin/company/{id}/managers/{managerId}', (e) => {
  const companyId = String(e.request.pathValue('id') || '').trim()
  const managerId = String(e.request.pathValue('managerId') || '').trim()

  if (!e.auth) {
    return e.json(401, { error: 'Autenticação administrativa obrigatória.' })
  }
  if (!companyId || !managerId) {
    return e.json(400, { error: 'ID da empresa e ID do gestor são obrigatórios.' })
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
    return e.json(403, { error: 'Usuário sem permissão para administrar gestores.' })
  }

  // 1. Find licenses for this company
  const licenses = $app.findRecordsByFilter('licenses', `company_id = '${companyId}'`, '', 50, 0)

  if (licenses.length === 0) {
    return e.json(404, { error: 'Licença da empresa não encontrada.' })
  }

  let removedCount = 0
  for (let i = 0; i < licenses.length; i++) {
    const licId = licenses[i].id
    const lms = $app.findRecordsByFilter(
      'license_managers',
      `license_id = '${licId}' && user_id = '${managerId}'`,
      '',
      50,
      0,
    )
    for (let j = 0; j < lms.length; j++) {
      $app.delete(lms[j])
      removedCount++
    }
  }

  return e.json(200, {
    success: true,
    message: 'Vínculo do gestor removido com sucesso.',
    removedCount: removedCount,
  })
})
