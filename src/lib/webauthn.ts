import { storage, STORAGE_KEYS } from './storage'

export interface StoredCredential {
  rawId: string
  id: string
}

export type WebAuthnErrorKind = 'unsupported' | 'cancelled' | 'timeout' | 'unknown'

export class WebAuthnError extends Error {
  kind: WebAuthnErrorKind
  userMessage: string
  constructor(kind: WebAuthnErrorKind, userMessage: string) {
    super(userMessage)
    this.name = 'WebAuthnError'
    this.kind = kind
    this.userMessage = userMessage
  }
}

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials !== 'undefined' &&
    typeof navigator.credentials.create === 'function'
  )
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false
  if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
    return true
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

function bufToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlToBuf(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function randomBuffer(length: number): ArrayBuffer {
  const arr = new Uint8Array(length)
  crypto.getRandomValues(arr)
  return arr.buffer
}

function wrapError(err: unknown): WebAuthnError {
  const e = err as { name?: string; message?: string }
  if (e?.name === 'NotAllowedError' || e?.name === 'AbortError') {
    return new WebAuthnError('cancelled', 'Autenticação cancelada pelo usuário.')
  }
  if (e?.name === 'TimeoutError') {
    return new WebAuthnError('timeout', 'Tempo esgotado. Toque para tentar novamente.')
  }
  if (e?.name === 'NotSupportedError' || e?.name === 'SecurityError') {
    return new WebAuthnError(
      'unsupported',
      'Seu dispositivo não suporta autenticação biométrica. Tente usar outro dispositivo.',
    )
  }
  return new WebAuthnError('unknown', 'Não foi possível concluir a autenticação. Tente novamente.')
}

/**
 * First-access flow: create a platform-bound credential (Face ID / fingerprint / PIN).
 * MUST be invoked from a user gesture (button tap).
 */
export async function registerCredential(): Promise<StoredCredential> {
  if (!isWebAuthnSupported()) {
    throw new WebAuthnError(
      'unsupported',
      'Seu dispositivo não suporta autenticação biométrica. Tente usar outro dispositivo.',
    )
  }

  const publicKey: PublicKeyCredentialCreationOptions = {
    challenge: randomBuffer(32),
    rp: { name: 'Freela Check' },
    user: {
      id: crypto.getRandomValues(new Uint8Array(16)),
      name: 'usuario@freelacheck.local',
      displayName: 'Usuário Freela Check',
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },
      { type: 'public-key', alg: -257 },
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred',
    },
    timeout: 60000,
    attestation: 'none',
  }

  let credential: PublicKeyCredential | null
  try {
    credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null
  } catch (err) {
    throw wrapError(err)
  }

  if (!credential) {
    throw new WebAuthnError('cancelled', 'Cadastro cancelado pelo usuário.')
  }

  return {
    rawId: bufToBase64url(credential.rawId),
    id: credential.id,
  }
}

/**
 * Returning-user flow: prove possession of the stored credential.
 * MUST be invoked from a user gesture (button tap).
 */
export async function authenticateCredential(credentialId: string): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    throw new WebAuthnError(
      'unsupported',
      'Seu dispositivo não suporta autenticação biométrica. Tente usar outro dispositivo.',
    )
  }

  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge: randomBuffer(32),
    allowCredentials: [
      {
        id: base64urlToBuf(credentialId),
        type: 'public-key',
        transports: ['internal'],
      },
    ],
    userVerification: 'required',
    timeout: 60000,
  }

  let assertion: PublicKeyCredential | null
  try {
    assertion = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null
  } catch (err) {
    throw wrapError(err)
  }

  if (!assertion) {
    throw new WebAuthnError('cancelled', 'Autenticação cancelada pelo usuário.')
  }

  return true
}

export function saveCredential(cred: StoredCredential): void {
  storage.setJSON(STORAGE_KEYS.credential, cred)
}

export function getStoredCredentialId(): string | null {
  const cred = storage.getJSON<StoredCredential>(STORAGE_KEYS.credential)
  return cred?.id ?? null
}

export function saveDeviceId(deviceId: string): void {
  storage.set(STORAGE_KEYS.deviceId, deviceId)
}

export function getLocalDeviceId(): string | null {
  return storage.get(STORAGE_KEYS.deviceId)
}

export function clearDeviceCredential(): void {
  storage.remove(STORAGE_KEYS.credential)
  storage.remove(STORAGE_KEYS.deviceId)
}

export function clearStoredCredential(): void {
  storage.remove(STORAGE_KEYS.credential)
}

export function clearDeviceId(): void {
  storage.remove(STORAGE_KEYS.deviceId)
}
