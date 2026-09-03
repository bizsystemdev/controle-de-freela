routerAdd('POST', '/api/auth/invite/accept', (e) => {
  const body = e.requestInfo().body || {}
  const token = String(body.token || '').trim()
  const password = String(body.password || '').trim()

  if (!token) {
    return e.json(400, { error: 'Token de convite obrigatório.' })
  }

  if (!password || password.length < 6) {
    return e.json(400, { error: 'A senha deve ter no mínimo 6 caracteres.' })
  }

  let user
  try {
    user = $app.findFirstRecordByData('users', 'invite_token', token)
  } catch (_) {
    return e.json(404, { error: 'Convite inválido ou não encontrado.' })
  }

  const expires = user.getString('invite_expires')
  if (expires) {
    const expTime = new Date(expires).getTime()
    if (!isNaN(expTime) && Date.now() > expTime) {
      return e.json(400, { error: 'Este convite expirou. Solicite um novo link ao gestor.' })
    }
  }

  user.setPassword(password)
  user.setVerified(true)
  user.set('invite_status', 'accepted')
  // Mantemos o token ou podemos limpar; marcar como aceito é seguro
  $app.save(user)

  // Autenticar e gerar JWT para login automático
  const jwt = $security.createJWT(
    { id: user.id, email: user.getString('email') },
    $os.getenv('TOKEN_SECRET') || 'bizcheck-secret-token-key-2026',
    60 * 60 * 24 * 7,
  )

  const userProfile = user.getString('profile') || 'gestor'
  const targetRole = userProfile === 'gerente' ? 'viewer' : 'owner'

  return e.json(200, {
    success: true,
    message: 'Senha cadastrada com sucesso! Bem-vindo ao Freela Check.',
    token: jwt,
    user: {
      id: user.id,
      name: user.getString('name'),
      email: user.getString('email'),
      role: targetRole,
      profile: userProfile,
    },
  })
})
