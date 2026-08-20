routerAdd('POST', '/api/auth/register-device', (e) => {
  const body = e.requestInfo().body || {}
  const freelancerId = String(body.freelancerId || '').trim()
  const credentialId = String(body.credentialId || '').trim()

  if (!freelancerId || !credentialId) {
    return e.json(400, { error: 'freelancerId e credentialId são obrigatórios.' })
  }

  let freelancer
  try {
    freelancer = $app.findRecordById('freelancers', freelancerId)
  } catch (_) {
    return e.json(404, { error: 'Freelancer não encontrado.' })
  }

  const deviceId = 'dev-' + $security.randomString(10)
  freelancer.set('device_id', deviceId)
  freelancer.set('credential_id', credentialId)
  $app.save(freelancer)

  return e.json(200, {
    success: true,
    deviceId: deviceId,
  })
})
