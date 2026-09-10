migrate(
  (app) => {
    const companies = app.findCollectionByNameOrId('companies')
    if (!companies.fields.getByName('attendance_photo_required')) {
      companies.fields.add(new BoolField({ name: 'attendance_photo_required' }))
    }
    app.save(companies)

    const attendance = app.findCollectionByNameOrId('attendance_records')
    if (!attendance.fields.getByName('photo')) {
      attendance.fields.add(
        new FileField({
          name: 'photo',
          maxSelect: 1,
          maxSize: 1572864,
          mimeTypes: ['image/jpeg'],
          protected: true,
          thumbs: ['400x400f', '800x800f'],
        }),
      )
    }
    app.save(attendance)
  },
  (app) => {
    const attendance = app.findCollectionByNameOrId('attendance_records')
    if (attendance.fields.getByName('photo')) {
      attendance.fields.removeByName('photo')
    }
    app.save(attendance)

    const companies = app.findCollectionByNameOrId('companies')
    if (companies.fields.getByName('attendance_photo_required')) {
      companies.fields.removeByName('attendance_photo_required')
    }
    app.save(companies)
  },
)
