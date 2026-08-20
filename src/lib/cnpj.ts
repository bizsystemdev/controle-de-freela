/**
 * Utilitários para CNPJ Alfanumérico e Tradicional
 * Padrão Receita Federal do Brasil (IN RFB nº 2.229/2024):
 * Formato: 14 caracteres alfanuméricos (letras maiúsculas A-Z e números 0-9 para as 12 primeiras posições,
 * e 2 dígitos numéricos ou alfanuméricos verificadores).
 * Máscara visual: XX.XXX.XXX/XXXX-XX
 */

/**
 * Remove caracteres de formatação mantendo apenas letras e números, convertendo para maiúsculo.
 */
export function unmaskCnpj(value: string): string {
  return (value || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 14)
}

/**
 * Aplica a máscara XX.XXX.XXX/XXXX-XX sobre uma string alfanumérica de até 14 caracteres.
 */
export function maskAlphanumericCnpj(value: string): string {
  const clean = unmaskCnpj(value)
  if (!clean) return ''

  let result = ''
  if (clean.length <= 2) {
    result = clean
  } else if (clean.length <= 5) {
    result = `${clean.slice(0, 2)}.${clean.slice(2)}`
  } else if (clean.length <= 8) {
    result = `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`
  } else if (clean.length <= 12) {
    result = `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`
  } else {
    result = `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`
  }

  return result
}

/**
 * Valida se um CNPJ é válido no formato alfanumérico ou numérico tradicional.
 * Se o campo for opcional e estiver vazio, pode ser ignorado antes de chamar esta função.
 *
 * Regra:
 * - Deve ter exatamente 14 caracteres alfanuméricos
 * - Para CNPJs 100% numéricos, aplica também validação de dígitos verificadores padrão e rejeição de repetidos (00.000.000/0000-00, etc.)
 * - Para CNPJs alfanuméricos (que contêm letras), valida formato e estrutura de 14 caracteres válidos (A-Z, 0-9).
 */
export function isValidAlphanumericCnpj(value: string): boolean {
  const clean = unmaskCnpj(value)
  if (!clean) return true // Opcional — se vazio, considerar válido na checagem simples (ou validar se fornecido)
  if (clean.length !== 14) return false

  // Se contém apenas dígitos, aplicar validação de dígitos verificadores tradicional
  const isAllNumeric = /^\d{14}$/.test(clean)
  if (isAllNumeric) {
    // Rejeitar sequências conhecidas de dígitos iguais
    if (/^(\d)\1{13}$/.test(clean)) {
      return false
    }

    // Cálculo do 1º dígito verificador
    let sum = 0
    let weight = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    for (let i = 0; i < 12; i++) {
      sum += parseInt(clean[i], 10) * weight[i]
    }
    let remainder = sum % 11
    let dv1 = remainder < 2 ? 0 : 11 - remainder
    if (parseInt(clean[12], 10) !== dv1) {
      return false
    }

    // Cálculo do 2º dígito verificador
    sum = 0
    weight = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    for (let i = 0; i < 13; i++) {
      sum += parseInt(clean[i], 10) * weight[i]
    }
    remainder = sum % 11
    let dv2 = remainder < 2 ? 0 : 11 - remainder
    if (parseInt(clean[13], 10) !== dv2) {
      return false
    }

    return true
  }

  // Se for alfanumérico (letras e números)
  // De acordo com a nova norma da RFB, os 14 caracteres são A-Z e 0-9
  return /^[A-Z0-9]{14}$/.test(clean)
}
