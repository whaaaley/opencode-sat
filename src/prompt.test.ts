import { assertEquals } from '@std/assert'
import { describe, it } from '@std/testing/bdd'
import { buildFormatPrompt, buildParsePrompt, buildRetryPrompt } from './prompt.ts'

describe('buildParsePrompt', () => {
  it('includes the input text', () => {
    const result = buildParsePrompt('Use conventional commits.')
    assertEquals(result.includes('Use conventional commits.'), true)
  })

  it('includes schema example', () => {
    const result = buildParsePrompt('anything')
    assertEquals(result.includes('"strength"'), true)
    assertEquals(result.includes('"action"'), true)
    assertEquals(result.includes('"target"'), true)
    assertEquals(result.includes('"reason"'), true)
  })

  it('asks for valid JSON only', () => {
    const result = buildParsePrompt('anything')
    assertEquals(result.includes('Return ONLY valid JSON'), true)
  })

  it('mentions all deontic strengths', () => {
    const result = buildParsePrompt('anything')
    assertEquals(result.includes('obligatory'), true)
    assertEquals(result.includes('forbidden'), true)
    assertEquals(result.includes('permissible'), true)
    assertEquals(result.includes('optional'), true)
    assertEquals(result.includes('supererogatory'), true)
    assertEquals(result.includes('indifferent'), true)
    assertEquals(result.includes('omissible'), true)
  })
})

describe('buildFormatPrompt', () => {
  it('includes the parsed rules JSON in all modes', () => {
    const json = '{"rules": [{"strength": "obligatory"}]}'
    assertEquals(buildFormatPrompt(json, 'verbose').includes(json), true)
    assertEquals(buildFormatPrompt(json, 'balanced').includes(json), true)
    assertEquals(buildFormatPrompt(json, 'concise').includes(json), true)
  })

  it('asks for valid JSON in all modes', () => {
    assertEquals(buildFormatPrompt('{}', 'verbose').includes('Return ONLY valid JSON'), true)
    assertEquals(buildFormatPrompt('{}', 'balanced').includes('Return ONLY valid JSON'), true)
    assertEquals(buildFormatPrompt('{}', 'concise').includes('Return ONLY valid JSON'), true)
  })

  it('defaults to balanced when mode is omitted', () => {
    const result = buildFormatPrompt('{}')
    assertEquals(result.includes('Use your judgment'), true)
  })

  it('verbose mode requires both Rule and Reason for every rule', () => {
    const result = buildFormatPrompt('{}', 'verbose')
    assertEquals(result.includes('Every rule must include both a Rule line and a Reason line'), true)
    assertEquals(result.includes('Rule:'), true)
    assertEquals(result.includes('Reason:'), true)
  })

  it('balanced mode lets the LLM decide which rules need reasons', () => {
    const result = buildFormatPrompt('{}', 'balanced')
    assertEquals(result.includes('Use your judgment'), true)
    assertEquals(result.includes('non-obvious or counterintuitive'), true)
    assertEquals(result.includes('self-explanatory'), true)
  })

  it('concise mode excludes reasons and uses bullet format', () => {
    const result = buildFormatPrompt('{}', 'concise')
    assertEquals(result.includes('Do not include reasons or justifications'), true)
    assertEquals(result.includes('"- ..."'), true)
  })

  it('produces different prompts for each mode', () => {
    const verbose = buildFormatPrompt('{}', 'verbose')
    const balanced = buildFormatPrompt('{}', 'balanced')
    const concise = buildFormatPrompt('{}', 'concise')

    assertEquals(verbose !== balanced, true)
    assertEquals(balanced !== concise, true)
    assertEquals(verbose !== concise, true)
  })
})

describe('buildRetryPrompt', () => {
  it('includes the error message', () => {
    const result = buildRetryPrompt('Schema validation failed')
    assertEquals(result.includes('Schema validation failed'), true)
  })

  it('asks for valid JSON', () => {
    const result = buildRetryPrompt('anything')
    assertEquals(result.includes('Return ONLY valid JSON'), true)
  })

  it('mentions previous response was invalid', () => {
    const result = buildRetryPrompt('anything')
    assertEquals(result.includes('previous response was invalid'), true)
  })
})
