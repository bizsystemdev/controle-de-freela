migrate(
  (app) => {
    const companies = app.findCollectionByNameOrId('companies')
    const authenticated = "@request.auth.id != ''"
    const superadmin =
      "(@request.auth.role = 'superadmin' || @request.auth.email = 'admin@bizcheck.com')"

    companies.createRule = `${authenticated} && ${superadmin}`
    companies.updateRule = `${authenticated} && (${superadmin} || licenses_via_company_id.license_managers_via_license_id.user_id ?= @request.auth.id)`
    companies.deleteRule = `${authenticated} && ${superadmin}`
    app.save(companies)
  },
  (app) => {
    const companies = app.findCollectionByNameOrId('companies')
    companies.createRule = "@request.auth.id != ''"
    companies.updateRule =
      "@request.auth.id != '' && licenses_via_company_id.license_managers_via_license_id.user_id ?= @request.auth.id"
    companies.deleteRule = "@request.auth.id != ''"
    app.save(companies)
  },
)
