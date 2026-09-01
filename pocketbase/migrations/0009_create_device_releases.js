migrate(
  (app) => {
    const freelancersCol = app.findCollectionByNameOrId('freelancers')
    const companiesCol = app.findCollectionByNameOrId('companies')

    const deviceReleases = new Collection({
      name: 'device_releases',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: "@request.auth.id != ''",
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
          required: false,
          collectionId: companiesCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'manager_id',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'manager_name', type: 'text' },
        { name: 'manager_email', type: 'text' },
        { name: 'previous_device_id', type: 'text' },
        { name: 'reason', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_dev_rel_freelancer ON device_releases (freelancer_id)',
        'CREATE INDEX idx_dev_rel_company ON device_releases (company_id)',
        'CREATE INDEX idx_dev_rel_manager ON device_releases (manager_id)',
        'CREATE INDEX idx_dev_rel_created ON device_releases (created DESC)',
      ],
    })
    app.save(deviceReleases)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('device_releases')
      app.delete(col)
    } catch (_) {}
  },
)
