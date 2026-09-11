migrate(
  (app) => {
    const attendance = app.findCollectionByNameOrId('attendance_records')

    attendance.viewRule = "@request.auth.id != ''"
    attendance.listRule = "@request.auth.id != ''"

    app.save(attendance)
  },
  (app) => {
    const attendance = app.findCollectionByNameOrId('attendance_records')

    attendance.viewRule = null
    attendance.listRule = null

    app.save(attendance)
  },
)
