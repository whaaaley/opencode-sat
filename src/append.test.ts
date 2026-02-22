import { describe, expect, it } from 'bun:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { appendRules } from './append'
import type { PromptFn } from './process'

const sampleParsed = {
  rules: [{
    strength: 'obligatory' as const,
    action: 'use',
    target: 'arrow functions',
    reason: 'consistency',
  }],
}

const sampleFormatted = {
  rules: ['Rule: Use arrow functions\nReason: consistency'],
}

type MakePromptFnOptions = {
  parseData?: typeof sampleParsed
  parseError?: string
  formatData?: typeof sampleFormatted
  formatError?: string
}

const makePromptFn = (options: MakePromptFnOptions): PromptFn => {
  let call = 0
  return (() => {
    call++
    if (call === 1) {
      if (options.parseError) {
        return Promise.resolve({ data: null, error: options.parseError })
      }
      return Promise.resolve({ data: options.parseData ?? sampleParsed, error: null })
    }
    if (options.formatError) {
      return Promise.resolve({ data: null, error: options.formatError })
    }
    return Promise.resolve({ data: options.formatData ?? sampleFormatted, error: null })
  }) as PromptFn
}

describe('appendRules', () => {
  it('returns readError when file does not exist', async () => {
    const result = await appendRules({
      input: 'use arrow functions',
      filePath: 'nonexistent.md',
      directory: '/tmp',
      prompt: makePromptFn({}),
    })
    expect(result.status).toBe('readError')
  })

  it('returns parseError when parse fails', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'irf-'))
    const filePath = 'instructions.md'
    await writeFile(join(dir, filePath), 'existing content\n', 'utf-8')

    const result = await appendRules({
      input: 'use arrow functions',
      filePath,
      directory: dir,
      prompt: makePromptFn({ parseError: 'bad parse' }),
    })
    expect(result.status).toBe('parseError')
    if (result.status === 'parseError') {
      expect(result.error).toBe('bad parse')
    }

    await rm(dir, { recursive: true })
  })

  it('returns formatError when format fails', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'irf-'))
    const filePath = 'instructions.md'
    await writeFile(join(dir, filePath), 'existing content\n', 'utf-8')

    const result = await appendRules({
      input: 'use arrow functions',
      filePath,
      directory: dir,
      prompt: makePromptFn({ formatError: 'bad format' }),
    })
    expect(result.status).toBe('formatError')
    if (result.status === 'formatError') {
      expect(result.error).toBe('bad format')
    }

    await rm(dir, { recursive: true })
  })

  it('appends formatted rules to end of file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'irf-'))
    const filePath = 'instructions.md'
    await writeFile(join(dir, filePath), 'existing content\n', 'utf-8')

    const result = await appendRules({
      input: 'use arrow functions',
      filePath,
      directory: dir,
      prompt: makePromptFn({}),
    })
    expect(result.status).toBe('success')
    if (result.status === 'success') {
      expect(result.rulesCount).toBe(1)
    }

    const content = await readFile(join(dir, filePath), 'utf-8')
    expect(content).toBe('existing content\n\nRule: Use arrow functions\nReason: consistency\n')

    await rm(dir, { recursive: true })
  })

  it('preserves existing content without modification', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'irf-'))
    const filePath = 'instructions.md'
    const existing = 'Rule: Existing rule\nReason: already here\n'
    await writeFile(join(dir, filePath), existing, 'utf-8')

    await appendRules({
      input: 'use arrow functions',
      filePath,
      directory: dir,
      prompt: makePromptFn({}),
    })

    const content = await readFile(join(dir, filePath), 'utf-8')
    expect(content.startsWith(existing)).toBe(true)

    await rm(dir, { recursive: true })
  })

  it('joins multiple rules with double newline in balanced mode', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'irf-'))
    const filePath = 'instructions.md'
    await writeFile(join(dir, filePath), 'header\n', 'utf-8')

    const multiFormatted = {
      rules: [
        'Rule: Use arrow functions\nReason: consistency',
        'Rule: Prefer const\nReason: immutability',
      ],
    }

    const result = await appendRules({
      input: 'two rules',
      filePath,
      directory: dir,
      prompt: makePromptFn({ formatData: multiFormatted }),
    })
    expect(result.status).toBe('success')
    if (result.status === 'success') {
      expect(result.rulesCount).toBe(2)
    }

    const content = await readFile(join(dir, filePath), 'utf-8')
    expect(content).toContain('consistency\n\nRule: Prefer const')

    await rm(dir, { recursive: true })
  })

  it('joins rules with single newline in concise mode', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'irf-'))
    const filePath = 'instructions.md'
    await writeFile(join(dir, filePath), 'header\n', 'utf-8')

    const conciseFormatted = {
      rules: ['- Use arrow functions', '- Prefer const'],
    }

    const result = await appendRules({
      input: 'two rules',
      filePath,
      directory: dir,
      prompt: makePromptFn({ formatData: conciseFormatted }),
      mode: 'concise',
    })
    expect(result.status).toBe('success')

    const content = await readFile(join(dir, filePath), 'utf-8')
    expect(content).toBe('header\n\n- Use arrow functions\n- Prefer const\n')

    await rm(dir, { recursive: true })
  })

  it('handles file without trailing newline', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'irf-'))
    const filePath = 'instructions.md'
    await writeFile(join(dir, filePath), 'no trailing newline', 'utf-8')

    await appendRules({
      input: 'use arrow functions',
      filePath,
      directory: dir,
      prompt: makePromptFn({}),
    })

    const content = await readFile(join(dir, filePath), 'utf-8')
    expect(content).toBe('no trailing newline\n\nRule: Use arrow functions\nReason: consistency\n')

    await rm(dir, { recursive: true })
  })

  it('propagates file path in result', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'irf-'))
    const filePath = 'custom/path.md'
    // readError since nested dir doesn't exist, but path should propagate
    const result = await appendRules({
      input: 'test',
      filePath,
      directory: dir,
      prompt: makePromptFn({}),
    })
    expect(result.path).toBe('custom/path.md')

    await rm(dir, { recursive: true })
  })
})
