migrate(
  (app) => {
    const attendance = app.findCollectionByNameOrId('attendance_records')
    if (!attendance.fields.getByName('rating')) {
      attendance.fields.add(new NumberField({ name: 'rating', onlyInt: true, min: 0, max: 5 }))
    }
    // PocketBase numbers default to zero. Keep a separate presence flag so
    // existing shifts remain unrated, including previously confirmed payments.
    if (!attendance.fields.getByName('rating_recorded')) {
      attendance.fields.add(new BoolField({ name: 'rating_recorded' }))
    }
    app.save(attendance)
  },
  (app) => {
    const attendance = app.findCollectionByNameOrId('attendance_records')
    for (const name of ['rating', 'rating_recorded']) {
      if (attendance.fields.getByName(name)) attendance.fields.removeByName(name)
    }
    app.save(attendance)
  },
)
