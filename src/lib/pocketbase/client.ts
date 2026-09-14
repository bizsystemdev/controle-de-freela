import PocketBase from 'pocketbase'

const pocketBaseUrl = import.meta.env.VITE_POCKETBASE_URL?.trim()

if (!pocketBaseUrl) {
  throw new Error('VITE_POCKETBASE_URL não está configurada.')
}

let parsedPocketBaseUrl: URL

try {
  parsedPocketBaseUrl = new URL(pocketBaseUrl)
} catch {
  throw new Error('VITE_POCKETBASE_URL deve ser uma URL HTTP ou HTTPS válida.')
}

if (!['http:', 'https:'].includes(parsedPocketBaseUrl.protocol)) {
  throw new Error('VITE_POCKETBASE_URL deve usar o protocolo HTTP ou HTTPS.')
}

if (import.meta.env.DEV) {
  const localHostnames = new Set(['127.0.0.1', 'localhost', '[::1]', '::1'])

  if (!localHostnames.has(parsedPocketBaseUrl.hostname.toLowerCase())) {
    throw new Error(
      'Inicialização interrompida: o frontend em desenvolvimento só pode usar um PocketBase local.',
    )
  }
}

const pb = new PocketBase(parsedPocketBaseUrl.toString())
pb.autoCancellation(false)

export default pb
