/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza strings de data/timestamp retornadas pelo PocketBase ou APIs legadas.
 * PocketBase frequentemente devolve timestamps com espaço ("2026-09-09 15:46:10.498Z").
 * No Safari (iOS/macOS) ou Goja, isso causa `Invalid Date` ou interpretação errada de timezone.
 * Esta função garante que qualquer formato contendo espaço seja convertido para ISO estrito com "T" e "Z".
 */
export function normalizeDateIso(val: string | null | undefined): string {
  if (!val) return ''
  const s = String(val).trim()
  if (!s) return ''
  // Se for formato "YYYY-MM-DD HH:mm:ss[.SSS][Z]"
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
    const withT = s.replace(' ', 'T')
    return withT.endsWith('Z') ? withT : withT + 'Z'
  }
  return s
}

/**
 * Cria com segurança um objeto Date a partir de qualquer string de data,
 * aplicando previamente a normalização ISO caso necessário.
 */
export function safeDate(val: string | number | Date | null | undefined): Date {
  if (!val) return new Date(NaN)
  if (val instanceof Date) return val
  if (typeof val === 'number') return new Date(val)
  return new Date(normalizeDateIso(val))
}
