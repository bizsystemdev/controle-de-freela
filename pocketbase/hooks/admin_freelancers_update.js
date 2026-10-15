routerAdd('PUT', '/api/admin/freelancers/{id}', (e) => {
  const freelancerId = String(e.request.pathValue('id') || '').trim()
  const body = e.requestInfo().body || {}

  if (!e.auth) {
    return e.json(401, { error: 'Autenticação administrativa obrigatória.' })
  }
  if (!freelancerId) {
    return e.json(400, { error: 'ID do freelancer obrigatório.' })
  }

  const SUPERADMIN_EMAIL = 'admin@bizcheck.com'
  const isSuperadmin =
    String(e.auth.getString('role') || '')
      .trim()
      .toLowerCase() === 'superadmin' ||
    String(e.auth.getString('email') || '')
      .trim()
      .toLowerCase() === SUPERADMIN_EMAIL

  const isClearDevice = body.clearDevice === true || body.clear_device === true
  const allowedRoles = isClearDevice ? ['owner', 'admin', 'viewer'] : ['owner', 'admin']
  const companyId = String(body.companyId || body.company_id || '').trim()

  const checkCanAccessCompany = (cId, roles) => {
    if (isSuperadmin) return true
    const managerLinks = $app.findRecordsByFilter(
      'license_managers',
      `user_id = '${e.auth.id}'`,
      '',
      100,
      0,
    )
    for (let i = 0; i < managerLinks.length; i++) {
      const linkRole = managerLinks[i].getString('role')
      if (roles.indexOf(linkRole) === -1) continue
      try {
        const license = $app.findRecordById('licenses', managerLinks[i].getString('license_id'))
        if (license.getString('company_id') === cId) {
          return true
        }
      } catch (_) {}
    }
    return false
  }

  const checkCanAccessFreelancer = (fId, roles) => {
    if (isSuperadmin) return true
    const links = $app.findRecordsByFilter(
      'freelancer_companies',
      `freelancer_id = '${fId}'`,
      '',
      500,
      0,
    )
    for (let i = 0; i < links.length; i++) {
      if (checkCanAccessCompany(links[i].getString('company_id'), roles)) {
        return true
      }
    }
    return false
  }

  const hasAccess = companyId
    ? checkCanAccessCompany(companyId, allowedRoles)
    : checkCanAccessFreelancer(freelancerId, allowedRoles)
  if (!hasAccess) {
    return e.json(403, { error: 'Usuário sem permissão para administrar este freelancer.' })
  }

  let freelancer
  try {
    freelancer = $app.findRecordById('freelancers', freelancerId)
  } catch (_) {
    return e.json(404, { error: 'Freelancer não encontrado.' })
  }

  const name = String(body.name || '').trim()
  const phone = String(body.phone || '').trim()
  const email = String(body.email || '').trim()
  const document = String(body.document || '').trim()
  const roleTitle = String(body.roleTitle || body.role_title || '').trim()

  if (name) {
    freelancer.set('name', name)
  }
  if (phone) {
    freelancer.set('phone', phone)
  }
  if (email !== undefined) {
    freelancer.set('email', email)
  }
  if (document !== undefined) {
    freelancer.set('document', document)
  }
  if (roleTitle !== undefined) {
    freelancer.set('role_title', roleTitle)
  }

  if (body.active !== undefined) {
    freelancer.set('active', Boolean(body.active))
  }

  // Handle clearDevice
  let oldDeviceId = freelancer.getString('device_id') || ''

  if (isClearDevice) {
    freelancer.set('device_id', '')
    freelancer.set('credential_id', '')
  }

  try {
    $app.save(freelancer)

    // Se a liberação de dispositivo ocorreu, gravar o histórico em device_releases
    if (isClearDevice) {
      try {
        const devRelCol = $app.findCollectionByNameOrId('device_releases')
        const relRecord = new Record(devRelCol)

        relRecord.set('freelancer_id', freelancerId)

        const companyId = String(body.companyId || body.company_id || '').trim()
        if (companyId) {
          relRecord.set('company_id', companyId)
        }

        const authUser = e.auth
        let managerId = String(
          body.managerId || body.manager_id || (authUser ? authUser.id : '') || '',
        ).trim()
        let managerName = String(
          body.managerName ||
            body.manager_name ||
            (authUser ? authUser.getString('name') : '') ||
            '',
        ).trim()
        let managerEmail = String(
          body.managerEmail ||
            body.manager_email ||
            (authUser ? authUser.getString('email') : '') ||
            '',
        ).trim()

        if (!managerName && managerId) {
          try {
            const u = $app.findRecordById('users', managerId)
            managerName = u.getString('name') || ''
            if (!managerEmail) managerEmail = u.getString('email') || ''
          } catch (_) {}
        }

        if (managerId) relRecord.set('manager_id', managerId)
        if (managerName) relRecord.set('manager_name', managerName)
        if (managerEmail) relRecord.set('manager_email', managerEmail)
        if (oldDeviceId) relRecord.set('previous_device_id', oldDeviceId)
        if (body.reason) relRecord.set('reason', String(body.reason).trim())

        $app.save(relRecord)
      } catch (logErr) {
        // Log release failure without failing the clear operation
        console.log(
          'Failed to log device release: ' +
            (logErr && logErr.message ? logErr.message : String(logErr)),
        )
      }
    }

    return e.json(200, {
      success: true,
      message: 'Freelancer atualizado com sucesso.',
      freelancer: {
        id: freelancer.id,
        name: freelancer.getString('name'),
        phone: freelancer.getString('phone'),
        email: freelancer.getString('email'),
        document: freelancer.getString('document'),
        roleTitle: freelancer.getString('role_title'),
        deviceId: freelancer.getString('device_id') || null,
        active: freelancer.getBool('active'),
      },
    })
  } catch (err) {
    return e.json(400, {
      error:
        'Falha ao salvar dados do freelancer: ' + (err && err.message ? err.message : String(err)),
    })
  }
})
