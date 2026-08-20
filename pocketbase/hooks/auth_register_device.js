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

  const currentDeviceId = freelancer.getString('device_id')
  const allowOverwrite = Boolean(body.allowOverwrite)

  // Only allow registering if device_id is empty or authorized update
  if (currentDeviceId && !allowOverwrite) {
    return e.json(400, {
      success: false,
      error: 'device_already_registered',
      message:
        'Este freelancer já possui um dispositivo registrado. Solicite ao gestor a liberação do aparelho.',
    })
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
