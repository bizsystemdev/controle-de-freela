routerAdd('POST', '/api/admin/managers/{id}/invite-link', (e) => {
  const managerId = String(e.request.pathValue('id') || '').trim()

  if (!e.auth) {
    return e.json(401, { error: 'Autenticação administrativa obrigatória.' })
  }
  if (!managerId) {
    return e.json(400, { error: 'ID do usuário obrigatório.' })
  }

  const permissions = require(`${__hooks}/lib/admin_permissions.js`)
  if (
    !permissions.canAccessManager($app, e.auth, managerId, permissions.COMPANY_MANAGEMENT_ROLES)
  ) {
    return e.json(403, { error: 'Usuário sem permissão para administrar este gestor.' })
  }

  let user
  try {
    user = $app.findRecordById('_pb_users_auth_', managerId)
  } catch (_) {
    return e.json(404, { error: 'Usuário não encontrado.' })
  }

  let token = user.getString('invite_token')
  if (!token) {
    token = $security.randomString(32)
    user.set('invite_token', token)
    user.set('invite_status', 'pending')
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  user.set('invite_expires', expiresAt)
  $app.save(user)

  return e.json(200, {
    success: true,
    inviteToken: token,
    inviteLink: '/admin/convite?token=' + token,
    expiresAt: expiresAt,
  })
})
