migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('attendance_records')
    if (!col.fields.getByName('manual')) {
      col.fields.add(new BoolField({ name: 'manual' }))
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('attendance_records')
      const f = col.fields.getByName('manual')
      if (f) {
        col.fields.removeByName('manual')
        app.save(col)
      }
    } catch (_) {}
  },
)
