import { describe, expect, it } from 'bun:test'
import { formatPrompt } from './format-prompt.ts'
import type { ParsedPrompt, ParsedTask } from './prompt-schema.ts'

describe('formatPrompt', () => {
  it('formats a single leaf task', () => {
    const parsed: ParsedPrompt = {
      tasks: [{
        intent: 'Run the tests',
        targets: [],
        constraints: [],
        subtasks: [],
      }],
    }

    const result = formatPrompt(parsed)
    expect(result).toBe('1. Run the tests')
  })

  it('includes targets when present', () => {
    const parsed: ParsedPrompt = {
      tasks: [{
        intent: 'Add guards',
        targets: ['bsky-search.ts', 'wiki-search.ts'],
        constraints: [],
        subtasks: [],
      }],
    }

    const result = formatPrompt(parsed)
    expect(result).toContain('Targets: bsky-search.ts, wiki-search.ts')
  })

  it('includes constraints when present', () => {
    const parsed: ParsedPrompt = {
      tasks: [{
        intent: 'Refactor module',
        targets: [],
        constraints: ['no optional chaining', 'use early returns'],
        subtasks: [],
      }],
    }

    const result = formatPrompt(parsed)
    expect(result).toContain('Constraints: no optional chaining, use early returns')
  })

  it('includes context when present', () => {
    const parsed: ParsedPrompt = {
      tasks: [{
        intent: 'Fix the bug',
        targets: [],
        constraints: [],
        context: 'Users reported crashes on startup',
        subtasks: [],
      }],
    }

    const result = formatPrompt(parsed)
    expect(result).toContain('Context: Users reported crashes on startup')
  })

  it('formats multiple top-level tasks', () => {
    const parsed: ParsedPrompt = {
      tasks: [
        {
          intent: 'Add guards',
          targets: [],
          constraints: [],
          subtasks: [],
        },
        {
          intent: 'Run tests',
          targets: [],
          constraints: [],
          subtasks: [],
        },
      ],
    }

    const result = formatPrompt(parsed)
    expect(result).toContain('1. Add guards')
    expect(result).toContain('2. Run tests')
  })

  it('formats subtasks with dashes', () => {
    const parsed: ParsedPrompt = {
      tasks: [{
        intent: 'Refactor search',
        targets: [],
        constraints: [],
        subtasks: [{
          intent: 'Update bsky provider',
          targets: [],
          constraints: [],
          subtasks: [],
        }],
      }],
    }

    const result = formatPrompt(parsed)
    expect(result).toContain('1. Refactor search')
    expect(result).toContain('  - Update bsky provider')
  })

  it('formats nested subtasks with increasing indentation', () => {
    const leaf: ParsedTask = {
      intent: 'Validate response shape',
      targets: [],
      constraints: [],
      subtasks: [],
    }

    const mid: ParsedTask = {
      intent: 'Add guards to bsky',
      targets: [],
      constraints: [],
      subtasks: [leaf],
    }

    const parsed: ParsedPrompt = {
      tasks: [{
        intent: 'Refactor providers',
        targets: [],
        constraints: [],
        subtasks: [mid],
      }],
    }

    const result = formatPrompt(parsed)
    expect(result).toContain('1. Refactor providers')
    expect(result).toContain('  - Add guards to bsky')
    expect(result).toContain('    - Validate response shape')
  })

  it('returns empty string for empty tasks', () => {
    const parsed: ParsedPrompt = { tasks: [] }
    const result = formatPrompt(parsed)
    expect(result).toBe('')
  })

  it('formats a complex prompt with all fields and nesting', () => {
    const parsed: ParsedPrompt = {
      tasks: [
        {
          intent: 'Refactor the search module',
          targets: ['src/search.ts'],
          constraints: ['use safeAsync'],
          context: 'Current error handling is inconsistent',
          subtasks: [
            {
              intent: 'Add guards to providers',
              targets: ['src/providers/'],
              constraints: ['use isRecord helper'],
              subtasks: [
                {
                  intent: 'Validate bsky responses',
                  targets: ['bsky-search.ts'],
                  constraints: [],
                  subtasks: [],
                },
                {
                  intent: 'Validate wiki responses',
                  targets: ['wiki-search.ts'],
                  constraints: [],
                  subtasks: [],
                },
              ],
            },
          ],
        },
        {
          intent: 'Run the tests',
          targets: [],
          constraints: ['fix any failures'],
          subtasks: [],
        },
      ],
    }

    const result = formatPrompt(parsed)
    expect(result).toContain('1. Refactor the search module')
    expect(result).toContain('Targets: src/search.ts')
    expect(result).toContain('Constraints: use safeAsync')
    expect(result).toContain('Context: Current error handling is inconsistent')
    expect(result).toContain('  - Add guards to providers')
    expect(result).toContain('    - Validate bsky responses')
    expect(result).toContain('    - Validate wiki responses')
    expect(result).toContain('2. Run the tests')
  })
})
