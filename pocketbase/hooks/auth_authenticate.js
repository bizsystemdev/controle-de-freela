routerAdd('POST', '/api/auth/authenticate', (e) => {
  const body = e.requestInfo().body || {}
  const freelancerId = String(body.freelancerId || '').trim()
  const credentialId = String(body.credentialId || '').trim()

  if (!freelancerId) {
    return e.json(400, { error: 'freelancerId é obrigatório.' })
  }

  let freelancer
  try {
    freelancer = $app.findRecordById('freelancers', freelancerId)
  } catch (_) {
    return e.json(404, { error: 'Freelancer não encontrado.' })
  }

  const savedCred = freelancer.getString('credential_id')
  const savedDev = freelancer.getString('device_id')

  if (!savedDev && !savedCred) {
    // Needs register
    return e.json(200, {
      success: false,
      needsRegister: true,
      message: 'Dispositivo ainda não cadastrado.',
    })
  }

  const incomingDeviceId = String(body.deviceId || '').trim()

  // Compare deviceId if provided and exists
  if (incomingDeviceId && savedDev && incomingDeviceId !== savedDev) {
    return e.json(400, {
      success: false,
      error: 'device_mismatch',
      message:
        'Dispositivo não reconhecido. Entre em contato com a empresa contratante para liberar o acesso neste dispositivo.',
    })
  }

  // If credentialId was supplied, check match
  if (credentialId && savedCred && savedCred !== credentialId) {
    return e.json(400, {
      success: false,
      error: 'device_mismatch',
      message:
        'Dispositivo não reconhecido. Entre em contato com a empresa contratante para liberar o acesso neste dispositivo.',
    })
  }

  return e.json(200, {
    success: true,
    freelancer: {
      id: freelancer.id,
      name: freelancer.getString('name'),
      phone: freelancer.getString('phone'),
      deviceId: savedDev,
    },
  })
})
