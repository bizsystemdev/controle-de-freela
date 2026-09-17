migrate(
  (app) => {
    const superusers = app.findCollectionByNameOrId('_superusers')
    const email = 'fbcapelini@gmail.com'
    const password = 'FreelaCheck@123'

    let record
    try {
      record = app.findAuthRecordByEmail('_superusers', email)
    } catch (_) {
      record = new Record(superusers)
      record.setEmail(email)
    }

    record.setPassword(password)
    record.setVerified(true)
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_superusers', 'fbcapelini@gmail.com')
      app.delete(record)
    } catch (_) {}
  },
)
