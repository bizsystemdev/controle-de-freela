migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Adicionar campo 'role' na coleção users com valores: 'superadmin', 'gestor', 'gerente'
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['superadmin', 'gestor', 'gerente'],
          maxSelect: 1,
        }),
      )
      app.save(users)
    }

    // 2. Atualizar admin@bizcheck.com como superadmin
    app
      .db()
      .newQuery(
        "UPDATE users SET role = 'superadmin' WHERE LOWER(TRIM(email)) = 'admin@bizcheck.com'",
      )
      .execute()

    // 3. Atualizar demais usuários sem role de acordo com o profile existente ou gestor como padrão
    app
      .db()
      .newQuery(
        "UPDATE users SET role = CASE WHEN profile = 'gerente' THEN 'gerente' ELSE 'gestor' END WHERE role IS NULL OR role = ''",
      )
      .execute()
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = users.fields.getByName('role')
    if (roleField) {
      users.fields.removeByName('role')
      app.save(users)
    }
  },
)
