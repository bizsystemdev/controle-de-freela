migrate(
  (app) => {
    const compCol = app.findCollectionByNameOrId('companies')
    if (!compCol.fields.getByName('cep')) {
      compCol.fields.add(
        new TextField({
          name: 'cep',
        }),
      )
    }
    if (!compCol.fields.getByName('number')) {
      compCol.fields.add(
        new TextField({
          name: 'number',
        }),
      )
    }
    if (!compCol.fields.getByName('neighborhood')) {
      compCol.fields.add(
        new TextField({
          name: 'neighborhood',
        }),
      )
    }
    app.save(compCol)
  },
  (app) => {
    const compCol = app.findCollectionByNameOrId('companies')
    compCol.fields.removeByName('cep')
    compCol.fields.removeByName('number')
    compCol.fields.removeByName('neighborhood')
    app.save(compCol)
  },
)
