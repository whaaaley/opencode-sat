import type { z } from 'zod'
import type { Result } from './utils/safe'
import type { ParsedPrompt } from './prompt-schema'
import { ParsedPromptSchema } from './prompt-schema'
import { buildPromptParsePrompt } from './prompt-prompt'
import { formatPrompt } from './format-prompt'

type PromptFn = <T>(prompt: string, schema: z.ZodType<T>) => Promise<Result<T>>

type ProcessPromptOptions = {
  input: string
  prompt: PromptFn
}

type PromptResult =
  | { status: 'success'; formatted: string; parsed: ParsedPrompt }
  | { status: 'parseError'; error: string }

export const processPrompt = async (options: ProcessPromptOptions): Promise<PromptResult> => {
  const { input, prompt } = options

  const parsePrompt = buildPromptParsePrompt(input)
  const parseResult = await prompt(parsePrompt, ParsedPromptSchema)

  if (parseResult.error) {
    return { status: 'parseError', error: parseResult.error }
  }

  if (!parseResult.data) {
    return { status: 'parseError', error: 'Parse returned no data' }
  }

  const formatted = formatPrompt(parseResult.data)

  return { status: 'success', formatted, parsed: parseResult.data }
}
