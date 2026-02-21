import { assertEquals } from '@std/assert'
import { describe, it } from '@std/testing/bdd'
import {
  ActionSchema,
  ContextSchema,
  ParsedRuleSchema,
  ParsedSchema,
  ReasonSchema,
  RuleSchema,
  StrengthSchema,
  TargetSchema,
} from './schema.ts'

describe('StrengthSchema', () => {
  const valid = ['obligatory', 'permissible', 'forbidden', 'optional', 'supererogatory', 'indifferent', 'omissible']

  it('accepts all valid strengths', () => {
    for (const s of valid) {
      const result = StrengthSchema.safeParse(s)
      assertEquals(result.success, true)
    }
  })

  it('rejects invalid strings', () => {
    assertEquals(StrengthSchema.safeParse('required').success, false)
    assertEquals(StrengthSchema.safeParse('').success, false)
  })

  it('rejects non-string types', () => {
    assertEquals(StrengthSchema.safeParse(42).success, false)
    assertEquals(StrengthSchema.safeParse(null).success, false)
  })
})

describe('ActionSchema', () => {
  it('accepts any string', () => {
    assertEquals(ActionSchema.safeParse('use').success, true)
    assertEquals(ActionSchema.safeParse('avoid').success, true)
  })

  it('rejects non-string types', () => {
    assertEquals(ActionSchema.safeParse(123).success, false)
    assertEquals(ActionSchema.safeParse(null).success, false)
  })
})

describe('TargetSchema', () => {
  it('accepts any string', () => {
    assertEquals(TargetSchema.safeParse('commit messages').success, true)
  })

  it('rejects non-string types', () => {
    assertEquals(TargetSchema.safeParse(true).success, false)
  })
})

describe('ContextSchema', () => {
  it('accepts any string', () => {
    assertEquals(ContextSchema.safeParse('in async functions').success, true)
  })

  it('rejects non-string types', () => {
    assertEquals(ContextSchema.safeParse([]).success, false)
  })
})

describe('ReasonSchema', () => {
  it('accepts any string', () => {
    assertEquals(ReasonSchema.safeParse('prevents data loss').success, true)
  })

  it('rejects non-string types', () => {
    assertEquals(ReasonSchema.safeParse({}).success, false)
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
    assertEquals(result.success, true)
  })

  it('accepts a valid parsed rule without context', () => {
    const { context: _, ...withoutContext } = validRule
    const result = ParsedRuleSchema.safeParse(withoutContext)
    assertEquals(result.success, true)
  })

  it('rejects when strength is missing', () => {
    const { strength: _, ...partial } = validRule
    assertEquals(ParsedRuleSchema.safeParse(partial).success, false)
  })

  it('rejects when action is missing', () => {
    const { action: _, ...partial } = validRule
    assertEquals(ParsedRuleSchema.safeParse(partial).success, false)
  })

  it('rejects when target is missing', () => {
    const { target: _, ...partial } = validRule
    assertEquals(ParsedRuleSchema.safeParse(partial).success, false)
  })

  it('rejects when reason is missing', () => {
    const { reason: _, ...partial } = validRule
    assertEquals(ParsedRuleSchema.safeParse(partial).success, false)
  })

  it('rejects invalid strength value', () => {
    assertEquals(ParsedRuleSchema.safeParse({ ...validRule, strength: 'required' }).success, false)
  })

  it('rejects non-object input', () => {
    assertEquals(ParsedRuleSchema.safeParse('not an object').success, false)
    assertEquals(ParsedRuleSchema.safeParse(null).success, false)
  })
})

describe('ParsedSchema', () => {
  it('accepts an empty array', () => {
    assertEquals(ParsedSchema.safeParse([]).success, true)
  })

  it('accepts an array of valid parsed rules', () => {
    const rules = [
      { strength: 'obligatory', action: 'use', target: 'semicolons', reason: 'consistency' },
      { strength: 'forbidden', action: 'use', target: 'type assertions', context: 'anywhere', reason: 'type safety' },
    ]
    assertEquals(ParsedSchema.safeParse(rules).success, true)
  })

  it('rejects when any rule is invalid', () => {
    const rules = [
      { strength: 'obligatory', action: 'use', target: 'semicolons', reason: 'consistency' },
      { strength: 'invalid', action: 'use', target: 'x', reason: 'y' },
    ]
    assertEquals(ParsedSchema.safeParse(rules).success, false)
  })

  it('rejects non-array input', () => {
    assertEquals(ParsedSchema.safeParse('not an array').success, false)
    assertEquals(ParsedSchema.safeParse({}).success, false)
  })
})

describe('RuleSchema', () => {
  it('accepts any string', () => {
    assertEquals(RuleSchema.safeParse('Use return await when returning promises').success, true)
  })

  it('rejects non-string types', () => {
    assertEquals(RuleSchema.safeParse(42).success, false)
    assertEquals(RuleSchema.safeParse(null).success, false)
  })
})
