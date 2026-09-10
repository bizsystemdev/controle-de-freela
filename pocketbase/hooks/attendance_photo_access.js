onFileDownloadRequest((e) => {
  if (!e.fileField || e.fileField.getName() !== 'photo') {
    return e.next()
  }

  if (e.hasSuperuserAuth()) {
    return e.next()
  }

  if (!e.auth) {
    throw new ForbiddenError('Autenticação administrativa obrigatória.')
  }

  const companyId = e.record.getString('company_id')
  const managerLinks = $app.findRecordsByFilter(
    'license_managers',
    `user_id = '${e.auth.id}'`,
    '',
    100,
    0,
  )

  for (let i = 0; i < managerLinks.length; i++) {
    try {
      const license = $app.findRecordById('licenses', managerLinks[i].getString('license_id'))
      const role = managerLinks[i].getString('role')
      if (
        license.getString('company_id') === companyId &&
        (role === 'owner' || role === 'admin' || role === 'viewer')
      ) {
        return e.next()
      }
    } catch (_) {}
  }

  throw new ForbiddenError('Usuário sem permissão para visualizar esta fotografia.')
}, 'attendance_records')
