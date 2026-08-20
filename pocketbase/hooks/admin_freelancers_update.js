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

  try {
    $app.save(freelancer)
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
