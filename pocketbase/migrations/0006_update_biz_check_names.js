migrate(
  (app) => {
    // 1. Update any existing Admin user name from 'Administrador Biz Check' to 'Administrador Freela Check'
    try {
      const records = app.findRecordsByFilter('_pb_users_auth_', "name ~ 'Biz Check'", '', 10, 0)
      for (const rec of records) {
        rec.set('name', rec.getString('name').replace(/Biz Check/g, 'Freela Check'))
        app.save(rec)
      }
    } catch (_) {}

    // 2. Update any companies named 'Biz Check...' to 'Freela Check...'
    try {
      const compRecords = app.findRecordsByFilter('companies', "name ~ 'Biz Check'", '', 10, 0)
      for (const comp of compRecords) {
        comp.set('name', comp.getString('name').replace(/Biz Check/g, 'Freela Check'))
        app.save(comp)
      }
    } catch (_) {}
  },
  (app) => {},
)
