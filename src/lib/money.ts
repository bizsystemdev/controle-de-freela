const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatBRLFromCents(cents: number): string {
  return brlFormatter.format(cents / 100)
}

export function centsToBRLInput(cents: number | null): string {
  if (!cents || cents <= 0) return ''
  return (cents / 100).toFixed(2).replace('.', ',')
}

export function parseBRLToCents(value: string): number | null {
  const raw = value
    .trim()
    .replace(/^R\$\s*/i, '')
    .replace(/\s/g, '')
  if (!raw || raw.startsWith('-') || !/^[\d.,]+$/.test(raw)) return null

  const lastComma = raw.lastIndexOf(',')
  const lastDot = raw.lastIndexOf('.')
  const candidateSeparator = Math.max(lastComma, lastDot)
  const digitsAfterSeparator =
    candidateSeparator >= 0 ? raw.length - candidateSeparator - 1 : Number.POSITIVE_INFINITY
  const hasDecimalSeparator = candidateSeparator >= 0 && digitsAfterSeparator <= 2
  const integerPart = hasDecimalSeparator ? raw.slice(0, candidateSeparator) : raw
  const decimalPart = hasDecimalSeparator ? raw.slice(candidateSeparator + 1) : ''
  const decimalSeparator = hasDecimalSeparator ? raw[candidateSeparator] : ''
  if (decimalSeparator && integerPart.includes(decimalSeparator)) return null
  const integerDigits = integerPart.replace(/\D/g, '')
  const decimalDigits = decimalPart.replace(/\D/g, '')

  if (!integerDigits || (hasDecimalSeparator && decimalDigits.length !== decimalPart.length)) {
    return null
  }

  const cents = Number(integerDigits) * 100 + Number((decimalDigits + '00').slice(0, 2))
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 999999999) return null
  return cents
}
