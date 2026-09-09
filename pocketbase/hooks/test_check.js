routerAdd('GET', '/backend/v1/test-check', (e) => {
  return e.json(200, { ok: true })
})
