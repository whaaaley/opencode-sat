import { basename } from 'node:path'
import { writeFile } from 'node:fs/promises'
import type { z } from 'zod'
import type { InstructionFile } from './discover.ts'
import { compareBytes, type ComparisonResult } from './compare.ts'
import { FormatResponseSchema, ParseResponseSchema } from './schema.ts'
import { buildFormatPrompt, buildParsePrompt } from './prompt.ts'
import type { Result } from './utils/safe.ts'
import { safeAsync } from './utils/safe.ts'

export type FileResult = {
  message: string
  comparison?: ComparisonResult
}

// callback that sends a prompt to the LLM and returns validated data
export type PromptFn = <T>(prompt: string, schema: z.ZodType<T>) => Promise<Result<T>>

// process a single instruction file through the parse -> format -> write pipeline
export const processFile = async (
  file: InstructionFile,
  prompt: PromptFn,
): Promise<FileResult> => {
  // skip files that failed to read
  if (file.error) {
    return { message: '**' + file.path + '**: Read failed — ' + file.error }
  }

  // step 1: parse instruction text -> structured rules
  const parseResult = await prompt(buildParsePrompt(file.content), ParseResponseSchema)

  if (parseResult.error !== null || !parseResult.data) {
    return { message: '**' + file.path + '**: Parse failed — ' + (parseResult.error || 'no data') }
  }

  // step 2: format structured rules -> human-readable rules
  const formatResult = await prompt(buildFormatPrompt(JSON.stringify(parseResult.data)), FormatResponseSchema)

  if (formatResult.error !== null || !formatResult.data) {
    return { message: '**' + file.path + '**: Format failed — ' + (formatResult.error || 'no data') }
  }

  // step 3: write formatted rules back to original file
  const formattedRules = formatResult.data.rules
  const content = formattedRules.join('\n\n') + '\n'
  const { error: writeError } = await safeAsync(() => writeFile(file.path, content, 'utf-8'))
  if (writeError) {
    return { message: '**' + file.path + '**: Write failed — ' + writeError.message }
  }

  const comparison = compareBytes(basename(file.path), file.content, content)
  return {
    message: '**' + file.path + '**: ' + formattedRules.length + ' rules written',
    comparison,
  }
}
