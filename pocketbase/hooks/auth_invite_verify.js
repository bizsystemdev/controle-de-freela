routerAdd('GET', '/api/auth/invite/verify', (e) => {
  const token = String(e.requestInfo().query['token'] || '').trim()

  if (!token) {
    return e.json(400, { error: 'Token de convite não informado.' })
  }

  let user
  try {
    user = $app.findFirstRecordByData('users', 'invite_token', token)
  } catch (_) {
    return e.json(404, { error: 'Convite inválido ou não encontrado.' })
  }

  // Verifica expiração se houver
  const expires = user.getString('invite_expires')
  if (expires) {
    const expTime = new Date(expires).getTime()
    if (!isNaN(expTime) && Date.now() > expTime) {
      return e.json(400, { error: 'Este convite expirou. Solicite um novo link ao gestor.' })
    }
  }

  // Localizar empresas atribuídas a este usuário
  const lms = $app.findRecordsByFilter(
    'license_managers',
    `user_id = '${user.id}'`,
    '-created',
    50,
    0,
  )
  const companiesList = []

  for (let i = 0; i < lms.length; i++) {
    const licId = lms[i].getString('license_id')
    try {
      const lic = $app.findRecordById('licenses', licId)
      const compId = lic.getString('company_id')
      const comp = $app.findRecordById('companies', compId)
      if (comp) {
        companiesList.push({
          id: comp.id,
          name: comp.getString('name'),
          city: comp.getString('city'),
          state: comp.getString('state'),
        })
      }
    } catch (_) {}
  }

  return e.json(200, {
    valid: true,
    user: {
      id: user.id,
      name: user.getString('name'),
      email: user.getString('email'),
      profile: user.getString('profile') || 'gestor',
      inviteStatus: user.getString('invite_status'),
    },
    companies: companiesList,
  })
})
