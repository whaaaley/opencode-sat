import { assertEquals } from '@std/assert'
import { describe, it } from '@std/testing/bdd'
import { isValidParsedRulesResult, isValidRulesResult } from './validate.ts'

describe('isValidParsedRulesResult', () => {
  it('returns true for valid result', () => {
    assertEquals(isValidParsedRulesResult({ rules: [] }), true)
    assertEquals(isValidParsedRulesResult({ rules: [{ strength: 'obligatory', action: 'use', target: 'x', reason: 'y' }] }), true)
  })

  it('returns false for null', () => {
    assertEquals(isValidParsedRulesResult(null), false)
  })

  it('returns false for non-object', () => {
    assertEquals(isValidParsedRulesResult('hello'), false)
    assertEquals(isValidParsedRulesResult(42), false)
  })

  it('returns false when rules is missing', () => {
    assertEquals(isValidParsedRulesResult({ other: [] }), false)
  })

  it('returns false when rules is not an array', () => {
    assertEquals(isValidParsedRulesResult({ rules: 'not-array' }), false)
  })
})

describe('isValidRulesResult', () => {
  it('returns true for valid result', () => {
    assertEquals(isValidRulesResult({ rules: [] }), true)
    assertEquals(isValidRulesResult({ rules: ['Do something'] }), true)
  })

  it('returns false for null', () => {
    assertEquals(isValidRulesResult(null), false)
  })

  it('returns false when rules is missing', () => {
    assertEquals(isValidRulesResult({}), false)
  })

  it('returns false when rules is not an array', () => {
    assertEquals(isValidRulesResult({ rules: 123 }), false)
  })
})
