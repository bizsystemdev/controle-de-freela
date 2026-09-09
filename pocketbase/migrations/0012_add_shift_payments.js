migrate(
  (app) => {
    const companies = app.findCollectionByNameOrId('companies')
    const attendance = app.findCollectionByNameOrId('attendance_records')

    if (!companies.fields.getByName('payment_control_enabled')) {
      companies.fields.add(new BoolField({ name: 'payment_control_enabled' }))
    }
    if (!companies.fields.getByName('freelancer_shift_base_amount_cents')) {
      companies.fields.add(
        new NumberField({
          name: 'freelancer_shift_base_amount_cents',
          onlyInt: true,
          min: 0,
          max: 999999999,
        }),
      )
    }
    companies.updateRule =
      "@request.auth.id != '' && licenses_via_company_id.license_managers_via_license_id.user_id ?= @request.auth.id"
    app.save(companies)

    if (!attendance.fields.getByName('shift_check_in_id')) {
      attendance.fields.add(
        new RelationField({
          name: 'shift_check_in_id',
          collectionId: attendance.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    if (!attendance.fields.getByName('payment_required')) {
      attendance.fields.add(new BoolField({ name: 'payment_required' }))
    }
    if (!attendance.fields.getByName('payment_confirmed')) {
      attendance.fields.add(new BoolField({ name: 'payment_confirmed' }))
    }
    if (!attendance.fields.getByName('received_amount_cents')) {
      attendance.fields.add(
        new NumberField({
          name: 'received_amount_cents',
          onlyInt: true,
          min: 0,
          max: 999999999,
        }),
      )
    }
    if (!attendance.fields.getByName('payment_confirmed_at')) {
      attendance.fields.add(new DateField({ name: 'payment_confirmed_at' }))
    }
    if (!attendance.fields.getByName('payment_confirmed_by')) {
      attendance.fields.add(
        new RelationField({
          name: 'payment_confirmed_by',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    if (!attendance.fields.getByName('payment_confirmed_by_name')) {
      attendance.fields.add(new TextField({ name: 'payment_confirmed_by_name' }))
    }
    attendance.updateRule = null

    attendance.addIndex(
      'idx_att_shift_checkout',
      true,
      'shift_check_in_id',
      "shift_check_in_id != ''",
    )
    attendance.addIndex('idx_att_payment_pending', false, 'payment_required, payment_confirmed', '')
    app.save(attendance)

    // Legacy records had no structural shift link. Pair only the next checkout from
    // the same freelancer and company; inconsistent/orphan events remain unlinked.
    const records = app.findRecordsByFilter(
      'attendance_records',
      'id != ""',
      'timestamp,created',
      100000,
      0,
    )
    const openByFreelancerAndCompany = {}

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const key = record.getString('freelancer_id') + ':' + record.getString('company_id')
      if (record.getString('type') === 'check_in') {
        openByFreelancerAndCompany[key] = record
        continue
      }

      const openCheckIn = openByFreelancerAndCompany[key]
      if (record.getString('type') === 'check_out' && openCheckIn) {
        record.set('shift_check_in_id', openCheckIn.id)
        app.save(record)
        delete openByFreelancerAndCompany[key]
      }
    }
  },
  (app) => {
    const attendance = app.findCollectionByNameOrId('attendance_records')
    attendance.updateRule = ''
    attendance.removeIndex('idx_att_shift_checkout')
    attendance.removeIndex('idx_att_payment_pending')

    const attendanceFields = [
      'shift_check_in_id',
      'payment_required',
      'payment_confirmed',
      'received_amount_cents',
      'payment_confirmed_at',
      'payment_confirmed_by',
      'payment_confirmed_by_name',
    ]
    for (let i = 0; i < attendanceFields.length; i++) {
      if (attendance.fields.getByName(attendanceFields[i])) {
        attendance.fields.removeByName(attendanceFields[i])
      }
    }
    app.save(attendance)

    const companies = app.findCollectionByNameOrId('companies')
    companies.updateRule = "@request.auth.id != ''"
    const companyFields = ['payment_control_enabled', 'freelancer_shift_base_amount_cents']
    for (let i = 0; i < companyFields.length; i++) {
      if (companies.fields.getByName(companyFields[i])) {
        companies.fields.removeByName(companyFields[i])
      }
    }
    app.save(companies)
  },
)
