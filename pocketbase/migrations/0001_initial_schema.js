migrate(
  (app) => {
    // 1. companies
    const companies = new Collection({
      name: 'companies',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'city', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'address', type: 'text' },
        { name: 'lat', type: 'number' },
        { name: 'lng', type: 'number' },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_companies_active ON companies (active)'],
    })
    app.save(companies)

    const companiesCol = app.findCollectionByNameOrId('companies')

    // 2. licenses
    const licenses = new Collection({
      name: 'licenses',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'company_id',
          type: 'relation',
          required: true,
          collectionId: companiesCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['active', 'inactive', 'expired'],
          maxSelect: 1,
        },
        {
          name: 'plan',
          type: 'select',
          required: true,
          values: ['free', 'pro', 'enterprise'],
          maxSelect: 1,
        },
        { name: 'max_freelancers', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_licenses_company ON licenses (company_id)'],
    })
    app.save(licenses)

    const licensesCol = app.findCollectionByNameOrId('licenses')

    // 3. license_managers
    const licenseManagers = new Collection({
      name: 'license_managers',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'license_id',
          type: 'relation',
          required: true,
          collectionId: licensesCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'role',
          type: 'select',
          required: true,
          values: ['owner', 'admin', 'viewer'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_lic_mgr_user ON license_managers (user_id)',
        'CREATE INDEX idx_lic_mgr_license ON license_managers (license_id)',
      ],
    })
    app.save(licenseManagers)

    // 4. freelancers
    const freelancers = new Collection({
      name: 'freelancers',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'phone', type: 'text', required: true },
        { name: 'email', type: 'text' },
        { name: 'document', type: 'text' },
        { name: 'role_title', type: 'text' },
        { name: 'device_id', type: 'text' },
        { name: 'credential_id', type: 'text' },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_freelancers_phone ON freelancers (phone)',
        'CREATE INDEX idx_freelancers_active ON freelancers (active)',
      ],
    })
    app.save(freelancers)

    const freelancersCol = app.findCollectionByNameOrId('freelancers')

    // 5. freelancer_companies
    const freelancerCompanies = new Collection({
      name: 'freelancer_companies',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'freelancer_id',
          type: 'relation',
          required: true,
          collectionId: freelancersCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'company_id',
          type: 'relation',
          required: true,
          collectionId: companiesCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_fc_freelancer ON freelancer_companies (freelancer_id)',
        'CREATE INDEX idx_fc_company ON freelancer_companies (company_id)',
      ],
    })
    app.save(freelancerCompanies)

    // 6. attendance_records
    const attendanceRecords = new Collection({
      name: 'attendance_records',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'freelancer_id',
          type: 'relation',
          required: true,
          collectionId: freelancersCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'company_id',
          type: 'relation',
          required: true,
          collectionId: companiesCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['check_in', 'check_out'],
          maxSelect: 1,
        },
        { name: 'timestamp', type: 'date', required: true },
        { name: 'lat', type: 'number' },
        { name: 'lng', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_att_freelancer ON attendance_records (freelancer_id)',
        'CREATE INDEX idx_att_company ON attendance_records (company_id)',
        'CREATE INDEX idx_att_timestamp ON attendance_records (timestamp DESC)',
      ],
    })
    app.save(attendanceRecords)
  },
  (app) => {
    const toDelete = [
      'attendance_records',
      'freelancer_companies',
      'freelancers',
      'license_managers',
      'licenses',
      'companies',
    ]
    for (const name of toDelete) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
