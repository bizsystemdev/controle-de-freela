routerAdd('POST', '/api/auth/manager-login', (e) => {
  const body = e.requestInfo().body || {}
  const email = String(body.email || '')
    .trim()
    .toLowerCase()
  const password = String(body.password || '')

  if (!email || !password) {
    return e.json(400, { error: 'Email e senha são obrigatórios.' })
  }

  let user
  try {
    user = $app.findAuthRecordByEmail('_pb_users_auth_', email)
  } catch (_) {
    return e.json(401, { error: 'Credenciais inválidas.' })
  }

  if (!user.validatePassword(password)) {
    return e.json(401, { error: 'Credenciais inválidas.' })
  }

  // Check if user has manager role in license_managers
  const mgrRecords = $app.findRecordsByFilter(
    'license_managers',
    `user_id = '${user.id}'`,
    '',
    10,
    0,
  )

  if (mgrRecords.length === 0) {
    return e.json(403, { error: 'Usuário não possui privilégios de gestor.' })
  }

  // Generate auth record token
  const token = $security.createJWT(
    { id: user.id, email: user.getString('email') },
    $os.getenv('TOKEN_SECRET') || 'bizcheck-secret-token-key-2026',
    60 * 60 * 24 * 7,
  )

  return e.json(200, {
    token: token,
    user: {
      id: user.id,
      name: user.getString('name'),
      email: user.getString('email'),
      role: mgrRecords[0].getString('role') || 'admin',
    },
  })
})
