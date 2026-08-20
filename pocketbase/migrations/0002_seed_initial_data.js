migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const companies = app.findCollectionByNameOrId('companies')
    const licenses = app.findCollectionByNameOrId('licenses')
    const licenseManagers = app.findCollectionByNameOrId('license_managers')
    const freelancers = app.findCollectionByNameOrId('freelancers')
    const freelancerCompanies = app.findCollectionByNameOrId('freelancer_companies')

    // 1. Seed Admin User (email: admin@bizcheck.com / pass: admin123)
    let adminUser
    try {
      adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'admin@bizcheck.com')
    } catch (_) {
      adminUser = new Record(users)
      adminUser.setEmail('admin@bizcheck.com')
      adminUser.setPassword('admin123')
      adminUser.setVerified(true)
      adminUser.set('name', 'Administrador Biz Check')
      app.save(adminUser)
    }

    // Also seed user's email if needed
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'fbcapelini@gmail.com')
    } catch (_) {
      const user = new Record(users)
      user.setEmail('fbcapelini@gmail.com')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Fabricio Capelini')
      app.save(user)
    }

    // 2. Seed Companies: Empresa ABC and Empresa XYZ
    let compABC
    try {
      compABC = app.findFirstRecordByData('companies', 'name', 'Empresa ABC')
    } catch (_) {
      compABC = new Record(companies)
      compABC.set('name', 'Empresa ABC')
      compABC.set('city', 'Florianópolis')
      compABC.set('state', 'SC')
      compABC.set('address', 'Rua Laura Duarte Prazeres 787, Campeche - Florianópolis')
      compABC.set('lat', -27.683)
      compABC.set('lng', -48.5045)
      compABC.set('active', true)
      app.save(compABC)
    }

    let compXYZ
    try {
      compXYZ = app.findFirstRecordByData('companies', 'name', 'Empresa XYZ')
    } catch (_) {
      compXYZ = new Record(companies)
      compXYZ.set('name', 'Empresa XYZ')
      compXYZ.set('city', 'São José')
      compXYZ.set('state', 'SC')
      compXYZ.set('address', 'Av. Presidente Kennedy, 1000 - Campinas')
      compXYZ.set('lat', -27.6137)
      compXYZ.set('lng', -48.6356)
      compXYZ.set('active', true)
      app.save(compXYZ)
    }

    // 3. Seed Licenses for both companies
    let licABC
    try {
      licABC = app.findFirstRecordByData('licenses', 'company_id', compABC.id)
    } catch (_) {
      licABC = new Record(licenses)
      licABC.set('company_id', compABC.id)
      licABC.set('status', 'active')
      licABC.set('plan', 'pro')
      licABC.set('max_freelancers', 50)
      app.save(licABC)
    }

    let licXYZ
    try {
      licXYZ = app.findFirstRecordByData('licenses', 'company_id', compXYZ.id)
    } catch (_) {
      licXYZ = new Record(licenses)
      licXYZ.set('company_id', compXYZ.id)
      licXYZ.set('status', 'active')
      licXYZ.set('plan', 'pro')
      licXYZ.set('max_freelancers', 50)
      app.save(licXYZ)
    }

    // 4. Link admin user to both licenses in license_managers
    try {
      const existing = app.findRecordsByFilter(
        'license_managers',
        `user_id = '${adminUser.id}' && license_id = '${licABC.id}'`,
        '',
        1,
        0,
      )
      if (existing.length === 0) {
        const lm = new Record(licenseManagers)
        lm.set('license_id', licABC.id)
        lm.set('user_id', adminUser.id)
        lm.set('role', 'owner')
        app.save(lm)
      }
    } catch (_) {}

    try {
      const existing = app.findRecordsByFilter(
        'license_managers',
        `user_id = '${adminUser.id}' && license_id = '${licXYZ.id}'`,
        '',
        1,
        0,
      )
      if (existing.length === 0) {
        const lm = new Record(licenseManagers)
        lm.set('license_id', licXYZ.id)
        lm.set('user_id', adminUser.id)
        lm.set('role', 'owner')
        app.save(lm)
      }
    } catch (_) {}

    // 5. Seed initial demo freelancer: Fabricio Capelini ((11) 98765-4321 / 11987654321)
    let freelancerDemo
    try {
      freelancerDemo = app.findFirstRecordByData('freelancers', 'phone', '(11) 98765-4321')
    } catch (_) {
      freelancerDemo = new Record(freelancers)
      freelancerDemo.set('name', 'Fabricio Capelini')
      freelancerDemo.set('phone', '(11) 98765-4321')
      freelancerDemo.set('email', 'fabricio@bizcheck.com')
      freelancerDemo.set('document', '123.456.789-00')
      freelancerDemo.set('role_title', 'Desenvolvedor / Especialista')
      freelancerDemo.set('active', true)
      app.save(freelancerDemo)
    }

    // Link demo freelancer to both companies
    try {
      const existing = app.findRecordsByFilter(
        'freelancer_companies',
        `freelancer_id = '${freelancerDemo.id}' && company_id = '${compABC.id}'`,
        '',
        1,
        0,
      )
      if (existing.length === 0) {
        const fc = new Record(freelancerCompanies)
        fc.set('freelancer_id', freelancerDemo.id)
        fc.set('company_id', compABC.id)
        fc.set('active', true)
        app.save(fc)
      }
    } catch (_) {}

    try {
      const existing = app.findRecordsByFilter(
        'freelancer_companies',
        `freelancer_id = '${freelancerDemo.id}' && company_id = '${compXYZ.id}'`,
        '',
        1,
        0,
      )
      if (existing.length === 0) {
        const fc = new Record(freelancerCompanies)
        fc.set('freelancer_id', freelancerDemo.id)
        fc.set('company_id', compXYZ.id)
        fc.set('active', true)
        app.save(fc)
      }
    } catch (_) {}

    // Also seed a couple more sample freelancers for realistic testing
    let fl2
    try {
      fl2 = app.findFirstRecordByData('freelancers', 'phone', '(11) 99887-6655')
    } catch (_) {
      fl2 = new Record(freelancers)
      fl2.set('name', 'Mariana Silva')
      fl2.set('phone', '(11) 99887-6655')
      fl2.set('email', 'mariana.silva@exemplo.com')
      fl2.set('document', '987.654.321-11')
      fl2.set('role_title', 'Garçonete / Atendente')
      fl2.set('active', true)
      app.save(fl2)

      const fc = new Record(freelancerCompanies)
      fc.set('freelancer_id', fl2.id)
      fc.set('company_id', compABC.id)
      fc.set('active', true)
      app.save(fc)
    }

    let fl3
    try {
      fl3 = app.findFirstRecordByData('freelancers', 'phone', '(48) 98877-1122')
    } catch (_) {
      fl3 = new Record(freelancers)
      fl3.set('name', 'Carlos Eduardo Rocha')
      fl3.set('phone', '(48) 98877-1122')
      fl3.set('email', 'carlos.rocha@exemplo.com')
      fl3.set('document', '333.444.555-66')
      fl3.set('role_title', 'Bartender / Barista')
      fl3.set('active', true)
      app.save(fl3)

      const fc = new Record(freelancerCompanies)
      fc.set('freelancer_id', fl3.id)
      fc.set('company_id', compXYZ.id)
      fc.set('active', true)
      app.save(fc)
    }
  },
  (app) => {
    // down logic is optional or can clean records
  },
)
