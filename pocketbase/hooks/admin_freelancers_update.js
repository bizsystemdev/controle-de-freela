routerAdd('PUT', '/api/admin/freelancers/:id', (e) => {
  const freelancerId = String(e.requestInfo().pathParams['id'] || '').trim()
  const body = e.requestInfo().body || {}

  if (!freelancerId) {
    return e.json(400, { error: 'ID do freelancer obrigatório.' })
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
  const isClearDevice = body.clearDevice === true || body.clear_device === true
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
