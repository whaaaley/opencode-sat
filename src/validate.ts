import type { ParsedRule } from './schema.ts'

export type ParsedRulesResult = { rules: ParsedRule[] }
export type RulesResult = { rules: string[] }

const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object'
}

const hasRulesArray = (value: Record<string, unknown>): boolean => {
  return 'rules' in value && Array.isArray(value.rules)
}

export const isValidParsedRulesResult = (result: unknown): result is ParsedRulesResult => {
  return isObject(result) && hasRulesArray(result)
}

export const isValidRulesResult = (result: unknown): result is RulesResult => {
  return isObject(result) && hasRulesArray(result)
}
