import { describe, expect, it } from 'bun:test'
import {
  ActionSchema,
  ContextSchema,
  ParsedRuleSchema,
  ParsedSchema,
  ReasonSchema,
  RuleSchema,
  StrengthSchema,
  TargetSchema,
} from './rule-schema.ts'

describe('StrengthSchema', () => {
  const valid = ['obligatory', 'permissible', 'forbidden', 'optional', 'supererogatory', 'indifferent', 'omissible']

  it('accepts all valid strengths', () => {
    for (const s of valid) {
      const result = StrengthSchema.safeParse(s)
      expect(result.success).toEqual(true)
    }
  })

  it('rejects invalid strings', () => {
    expect(StrengthSchema.safeParse('required').success).toEqual(false)
    expect(StrengthSchema.safeParse('').success).toEqual(false)
  })

  it('rejects non-string types', () => {
    expect(StrengthSchema.safeParse(42).success).toEqual(false)
    expect(StrengthSchema.safeParse(null).success).toEqual(false)
  })
})

describe('ActionSchema', () => {
  it('accepts any string', () => {
    expect(ActionSchema.safeParse('use').success).toEqual(true)
    expect(ActionSchema.safeParse('avoid').success).toEqual(true)
  })

  it('rejects non-string types', () => {
    expect(ActionSchema.safeParse(123).success).toEqual(false)
    expect(ActionSchema.safeParse(null).success).toEqual(false)
  })
})

describe('TargetSchema', () => {
  it('accepts any string', () => {
    expect(TargetSchema.safeParse('commit messages').success).toEqual(true)
  })

  it('rejects non-string types', () => {
    expect(TargetSchema.safeParse(true).success).toEqual(false)
  })
})

describe('ContextSchema', () => {
  it('accepts any string', () => {
    expect(ContextSchema.safeParse('in async functions').success).toEqual(true)
  })

  it('rejects non-string types', () => {
    expect(ContextSchema.safeParse([]).success).toEqual(false)
  })
})

describe('ReasonSchema', () => {
  it('accepts any string', () => {
    expect(ReasonSchema.safeParse('prevents data loss').success).toEqual(true)
  })

  it('rejects non-string types', () => {
    expect(ReasonSchema.safeParse({}).success).toEqual(false)
  })
})

describe('ParsedRuleSchema', () => {
  const validRule = {
    strength: 'obligatory',
    action: 'use',
    target: 'return await',
    context: 'when returning promises',
    reason: 'better stack traces',
  }

  it('accepts a valid parsed rule with all fields', () => {
    const result = ParsedRuleSchema.safeParse(validRule)
    expect(result.success).toEqual(true)
  })

  it('accepts a valid parsed rule without context', () => {
    const { context: _, ...withoutContext } = validRule
    const result = ParsedRuleSchema.safeParse(withoutContext)
    expect(result.success).toEqual(true)
  })

  it('rejects when strength is missing', () => {
    const { strength: _, ...partial } = validRule
    expect(ParsedRuleSchema.safeParse(partial).success).toEqual(false)
  })

  it('rejects when action is missing', () => {
    const { action: _, ...partial } = validRule
    expect(ParsedRuleSchema.safeParse(partial).success).toEqual(false)
  })

  it('rejects when target is missing', () => {
    const { target: _, ...partial } = validRule
    expect(ParsedRuleSchema.safeParse(partial).success).toEqual(false)
  })

  it('rejects when reason is missing', () => {
    const { reason: _, ...partial } = validRule
    expect(ParsedRuleSchema.safeParse(partial).success).toEqual(false)
  })

  it('rejects invalid strength value', () => {
    expect(ParsedRuleSchema.safeParse({ ...validRule, strength: 'required' }).success).toEqual(false)
  })

  it('rejects non-object input', () => {
    expect(ParsedRuleSchema.safeParse('not an object').success).toEqual(false)
    expect(ParsedRuleSchema.safeParse(null).success).toEqual(false)
  })
})

describe('ParsedSchema', () => {
  it('accepts an empty array', () => {
    expect(ParsedSchema.safeParse([]).success).toEqual(true)
  })

  it('accepts an array of valid parsed rules', () => {
    const rules = [
      { strength: 'obligatory', action: 'use', target: 'semicolons', reason: 'consistency' },
      { strength: 'forbidden', action: 'use', target: 'type assertions', context: 'anywhere', reason: 'type safety' },
    ]
    expect(ParsedSchema.safeParse(rules).success).toEqual(true)
  })

  it('rejects when any rule is invalid', () => {
    const rules = [
      { strength: 'obligatory', action: 'use', target: 'semicolons', reason: 'consistency' },
      { strength: 'invalid', action: 'use', target: 'x', reason: 'y' },
    ]
    expect(ParsedSchema.safeParse(rules).success).toEqual(false)
  })

  it('rejects non-array input', () => {
    expect(ParsedSchema.safeParse('not an array').success).toEqual(false)
    expect(ParsedSchema.safeParse({}).success).toEqual(false)
  })
})

describe('RuleSchema', () => {
  it('accepts any string', () => {
    expect(RuleSchema.safeParse('Use return await when returning promises').success).toEqual(true)
  })

  it('rejects non-string types', () => {
    expect(RuleSchema.safeParse(42).success).toEqual(false)
    expect(RuleSchema.safeParse(null).success).toEqual(false)
  })
})
