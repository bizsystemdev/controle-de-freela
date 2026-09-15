routerAdd('DELETE', '/api/admin/company/{id}', (e) => {
  if (!e.auth) {
    return e.json(401, { error: 'Autenticação obrigatória.' })
  }

  // Apenas o SUPERADMIN pode remover empresas e todos os dados
  const userRole = e.auth.getString('role')
  const userEmail = e.auth.getString('email').toLowerCase().trim()
  const isSuperadmin = userRole === 'superadmin' || userEmail === 'admin@bizcheck.com'

  if (!isSuperadmin) {
    return e.json(403, {
      error: 'Apenas o superadmin tem permissão para remover empresas.',
    })
  }

  const companyId = String(e.request.pathValue('id') || '').trim()
  if (!companyId) {
    return e.json(400, { error: 'ID da empresa é obrigatório.' })
  }

  let companyRecord = null
  try {
    companyRecord = $app.findRecordById('companies', companyId)
  } catch (_) {
    return e.json(404, { error: 'Empresa não encontrada.' })
  }

  const companyName = companyRecord.getString('name')

  try {
    // 1. Remover registros de ponto (attendance_records) vinculados à empresa
    $app
      .db()
      .newQuery('DELETE FROM attendance_records WHERE company_id = {:companyId}')
      .bind({ companyId: companyId })
      .execute()

    // 2. Remover auditoria de liberações de dispositivo (device_releases)
    $app
      .db()
      .newQuery('DELETE FROM device_releases WHERE company_id = {:companyId}')
      .bind({ companyId: companyId })
      .execute()

    // 3. Remover vínculos com freelancers (freelancer_companies)
    $app
      .db()
      .newQuery('DELETE FROM freelancer_companies WHERE company_id = {:companyId}')
      .bind({ companyId: companyId })
      .execute()

    // 4. Buscar e remover vínculos de licença (license_managers) e licenças (licenses)
    const licenses = $app.findRecordsByFilter('licenses', `company_id = '${companyId}'`, '', 100, 0)
    for (let i = 0; i < licenses.length; i++) {
      const lic = licenses[i]
      $app
        .db()
        .newQuery('DELETE FROM license_managers WHERE license_id = {:licId}')
        .bind({ licId: lic.id })
        .execute()

      $app.delete(lic)
    }

    // 5. Deletar a empresa
    $app.delete(companyRecord)

    return e.json(200, {
      success: true,
      message: `Empresa "${companyName}" e todos os dados relacionados foram removidos com sucesso.`,
      companyId: companyId,
    })
  } catch (err) {
    return e.json(500, {
      error: 'Falha ao remover empresa: ' + (err && err.message ? err.message : String(err)),
    })
  }
})
