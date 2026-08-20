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
  const incomingDeviceId = String(body.deviceId || '').trim()
  const allowOverwrite = Boolean(body.allowOverwrite)

  // If already registered on server:
  if (currentDeviceId && !allowOverwrite) {
    // If incoming deviceId was provided, compare with saved deviceId
    if (incomingDeviceId && incomingDeviceId !== currentDeviceId) {
      return e.json(400, {
        success: false,
        error: 'device_mismatch',
        message:
          'Dispositivo não reconhecido. Entre em contato com a empresa contratante para liberar o acesso neste dispositivo.',
      })
    }

    // If deviceId matched (or re-authenticating same device registration), update credential if needed and succeed
    if (incomingDeviceId && incomingDeviceId === currentDeviceId) {
      freelancer.set('credential_id', credentialId)
      $app.save(freelancer)
      return e.json(200, {
        success: true,
        deviceId: currentDeviceId,
      })
    }

    // If currentDeviceId exists on server and no matching deviceId was provided, block registration
    return e.json(400, {
      success: false,
      error: 'device_mismatch',
      message:
        'Dispositivo não reconhecido. Entre em contato com a empresa contratante para liberar o acesso neste dispositivo.',
    })
  }

  const deviceId = incomingDeviceId || 'dev-' + $security.randomString(10)
  freelancer.set('device_id', deviceId)
  freelancer.set('credential_id', credentialId)
  $app.save(freelancer)

  return e.json(200, {
    success: true,
    deviceId: deviceId,
  })
})
