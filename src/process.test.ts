import { assertEquals, assertStringIncludes } from '@std/assert'
import { describe, it } from '@std/testing/bdd'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { processFile, type PromptFn } from './process.ts'
import type { InstructionFile } from './discover.ts'

// helper: build a prompt fn that returns parse then format results in order
const makePromptFn = (
  parseData: { rules: { strength: string; action: string; target: string; reason: string }[] } | null,
  parseError: string | null,
  formatData: { rules: string[] } | null,
  formatError: string | null,
): PromptFn => {
  let call = 0
  return (async () => {
    call++
    if (call === 1) {
      return parseError !== null ? { data: null, error: parseError } : { data: parseData, error: null }
    }
    return formatError !== null ? { data: null, error: formatError } : { data: formatData, error: null }
  }) as PromptFn
}

const sampleParsed = {
  rules: [{
    strength: 'obligatory',
    action: 'use',
    target: 'arrow functions',
    reason: 'consistency',
  }],
}

const sampleFormatted = {
  rules: ['Rule: Use arrow functions\nReason: consistency'],
}

describe('processFile', () => {
  it('returns read error for files that failed to read', async () => {
    const file: InstructionFile = { path: '/tmp/bad.md', content: '', error: 'ENOENT' }
    const prompt = makePromptFn(null, null, null, null)

    const result = await processFile(file, prompt)

    assertStringIncludes(result.message, 'Read failed')
    assertStringIncludes(result.message, 'ENOENT')
    assertEquals(result.comparison, undefined)
  })

  it('returns parse error when first prompt fails', async () => {
    const file: InstructionFile = { path: '/tmp/test.md', content: 'some instructions' }
    const prompt = makePromptFn(null, 'LLM timeout', null, null)

    const result = await processFile(file, prompt)

    assertStringIncludes(result.message, 'Parse failed')
    assertStringIncludes(result.message, 'LLM timeout')
  })

  it('returns format error when second prompt fails', async () => {
    const file: InstructionFile = { path: '/tmp/test.md', content: 'some instructions' }
    const prompt = makePromptFn(sampleParsed, null, null, 'schema mismatch')

    const result = await processFile(file, prompt)

    assertStringIncludes(result.message, 'Format failed')
    assertStringIncludes(result.message, 'schema mismatch')
  })

  it('returns write error for invalid path', async () => {
    const file: InstructionFile = { path: '/nonexistent/dir/impossible.md', content: 'some instructions' }
    const prompt = makePromptFn(sampleParsed, null, sampleFormatted, null)

    const result = await processFile(file, prompt)

    assertStringIncludes(result.message, 'Write failed')
  })

  it('writes formatted rules and returns comparison on success', async () => {
    const dir = await Deno.makeTempDir()
    const filePath = join(dir, 'rules.md')
    const originalContent = 'Use arrow functions for consistency.\nPrefer const over let.\n'
    await Deno.writeTextFile(filePath, originalContent)

    const file: InstructionFile = { path: filePath, content: originalContent }
    const prompt = makePromptFn(sampleParsed, null, sampleFormatted, null)

    const result = await processFile(file, prompt)

    assertStringIncludes(result.message, '1 rules written')
    assertEquals(result.comparison !== undefined, true)
    assertEquals(result.comparison!.file, 'rules.md')

    // verify file was actually written with correct content
    const written = await readFile(filePath, 'utf-8')
    assertEquals(written, 'Rule: Use arrow functions\nReason: consistency\n')

    await Deno.remove(dir, { recursive: true })
  })

  it('joins multiple rules with double newline', async () => {
    const dir = await Deno.makeTempDir()
    const filePath = join(dir, 'multi.md')
    await Deno.writeTextFile(filePath, 'original')

    const multiFormatted = {
      rules: [
        'Rule: Use arrow functions\nReason: consistency',
        'Rule: Prefer const\nReason: immutability',
      ],
    }

    const file: InstructionFile = { path: filePath, content: 'original' }
    const prompt = makePromptFn(sampleParsed, null, multiFormatted, null)

    const result = await processFile(file, prompt)

    assertStringIncludes(result.message, '2 rules written')

    const written = await readFile(filePath, 'utf-8')
    assertEquals(written, 'Rule: Use arrow functions\nReason: consistency\n\nRule: Prefer const\nReason: immutability\n')

    await Deno.remove(dir, { recursive: true })
  })

  it('includes file path in all messages', async () => {
    const file: InstructionFile = { path: '/some/project/.cursor/rules.md', content: '', error: 'nope' }
    const prompt = makePromptFn(null, null, null, null)

    const result = await processFile(file, prompt)

    assertStringIncludes(result.message, '/some/project/.cursor/rules.md')
  })

  it('comparison reflects byte difference between original and generated', async () => {
    const dir = await Deno.makeTempDir()
    const filePath = join(dir, 'test.md')
    const originalContent = 'a'.repeat(100)
    await Deno.writeTextFile(filePath, originalContent)

    const file: InstructionFile = { path: filePath, content: originalContent }
    const shortFormatted = { rules: ['Rule: Short\nReason: Brief'] }
    const prompt = makePromptFn(sampleParsed, null, shortFormatted, null)

    const result = await processFile(file, prompt)

    assertEquals(result.comparison !== undefined, true)
    assertEquals(result.comparison!.originalBytes, 100)
    // "Rule: Short\nReason: Brief\n" = 26 bytes
    assertEquals(result.comparison!.generatedBytes, 26)
    assertEquals(result.comparison!.difference, 74)

    await Deno.remove(dir, { recursive: true })
  })
})
