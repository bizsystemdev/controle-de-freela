migrate(
  (app) => {
    // 1. Atualizar campos da coleção users para suportar profile e convite
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('profile')) {
      users.fields.add(
        new SelectField({
          name: 'profile',
          values: ['gestor', 'gerente'],
          maxSelect: 1,
        }),
      )
    }

    if (!users.fields.getByName('invite_token')) {
      users.fields.add(
        new TextField({
          name: 'invite_token',
        }),
      )
    }

    if (!users.fields.getByName('invite_expires')) {
      users.fields.add(
        new DateField({
          name: 'invite_expires',
        }),
      )
    }

    if (!users.fields.getByName('invite_status')) {
      users.fields.add(
        new SelectField({
          name: 'invite_status',
          values: ['pending', 'accepted'],
          maxSelect: 1,
        }),
      )
    }

    app.save(users)

    // 2. Definir usuários existentes como 'gestor'
    app
      .db()
      .newQuery("UPDATE users SET profile = 'gestor' WHERE profile IS NULL OR profile = ''")
      .execute()

    // 3. Adicionar índice único para invite_token
    users.addIndex('idx_users_invite_token', false, 'invite_token', '')
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.removeIndex('idx_users_invite_token')
    const fieldsToRemove = ['profile', 'invite_token', 'invite_expires', 'invite_status']
    for (const f of fieldsToRemove) {
      const field = users.fields.getByName(f)
      if (field) {
        users.fields.removeByName(f)
      }
    }
    app.save(users)
  },
)
