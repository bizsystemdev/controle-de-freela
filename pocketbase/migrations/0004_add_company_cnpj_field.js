migrate(
  (app) => {
    const compCol = app.findCollectionByNameOrId('companies')
    if (!compCol.fields.getByName('cnpj')) {
      compCol.fields.add(
        new TextField({
          name: 'cnpj',
        }),
      )
      app.save(compCol)
    }
  },
  (app) => {
    const compCol = app.findCollectionByNameOrId('companies')
    compCol.fields.removeByName('cnpj')
    app.save(compCol)
  },
)
