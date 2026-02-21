import { assertEquals } from '@std/assert'
import { describe, it } from '@std/testing/bdd'
import { z } from 'zod'
import { formatValidationError, validateJson } from './validate.ts'

const TestSchema = z.object({
  name: z.string(),
  age: z.number(),
})

describe('validateJson', () => {
  it('returns data for valid JSON matching schema', () => {
    const result = validateJson('{"name": "Alice", "age": 30}', TestSchema)

    assertEquals(result.error, null)
    assertEquals(result.data, { name: 'Alice', age: 30 })
  })

  it('returns parse error for invalid JSON', () => {
    const result = validateJson('not json', TestSchema)

    assertEquals(result.error, 'parse')
    assertEquals(result.data, null)
  })

  it('returns parse error for empty string', () => {
    const result = validateJson('', TestSchema)

    assertEquals(result.error, 'parse')
    assertEquals(result.data, null)
  })

  it('returns schema error when JSON does not match schema', () => {
    const result = validateJson('{"name": 42}', TestSchema)

    assertEquals(result.error, 'schema')
    assertEquals(result.data, null)
    assertEquals('issues' in result, true)
  })

  it('returns schema error with issues for missing fields', () => {
    const result = validateJson('{}', TestSchema)

    assertEquals(result.error, 'schema')
    assertEquals(result.data, null)
    if (result.error === 'schema') {
      assertEquals(result.issues.length > 0, true)
    }
  })

  it('accepts valid nested JSON', () => {
    const nested = z.object({ items: z.array(z.string()) })
    const result = validateJson('{"items": ["a", "b"]}', nested)

    assertEquals(result.error, null)
    assertEquals(result.data, { items: ['a', 'b'] })
  })
})

describe('formatValidationError', () => {
  it('returns generic message for parse errors', () => {
    const result = formatValidationError({ data: null, error: 'parse' })

    assertEquals(result.includes('Invalid JSON'), true)
  })

  it('returns formatted issues for schema errors', () => {
    const validation = validateJson('{"name": 42}', TestSchema)
    if (validation.error === 'schema') {
      const result = formatValidationError(validation)

      assertEquals(result.includes('Schema validation failed'), true)
      assertEquals(result.includes('Fix the issues'), true)
    }
  })

  it('includes field paths in schema error output', () => {
    const validation = validateJson('{}', TestSchema)
    if (validation.error === 'schema') {
      const result = formatValidationError(validation)

      assertEquals(result.includes('  - '), true)
    }
  })
})
