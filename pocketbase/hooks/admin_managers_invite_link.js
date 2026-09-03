routerAdd('POST', '/api/admin/managers/{id}/invite-link', (e) => {
  const managerId = String(
    e.request.pathValue('id') || e.requestInfo().pathParams?.['id'] || '',
  ).trim()

  if (!managerId) {
    return e.json(400, { error: 'ID do usuário obrigatório.' })
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
