import { promptSchemaExample } from './prompt-schema'

export const buildPromptParsePrompt = (input: string): string => {
  const instructions = [
    'You are a prompt structuring system.',
    'Your job is to take raw, unstructured user input and decompose it into a structured task hierarchy.',
    'The input may be messy, from voice transcription, contain filler words, or have multiple requests mixed together.',
    '',
    'Decompose the input into tasks. Each task has:',
    '- intent: a clear, concise directive (what to do)',
    '- targets: files, systems, or things involved (array, can be empty)',
    '- constraints: conditions, preferences, or requirements (array, can be empty)',
    '- context: optional background info or rationale',
    '- subtasks: recursive array of child tasks (empty if the task is a leaf)',
    '',
    'Guidelines:',
    '- Extract the actual intent behind the words, not the words themselves.',
    '- Separate compound requests into multiple top-level tasks.',
    '- When a task has clear sub-steps, decompose into subtasks.',
    '- Preserve specific file names, variable names, and technical terms exactly as stated.',
    '- Drop filler words, false starts, and verbal noise.',
    '- If the user mentions constraints or preferences, attach them to the relevant task.',
    '- If context or rationale is provided, capture it in the context field.',
    '- Keep intents as imperative directives (start with a verb).',
    '',
    'Return JSON matching this schema:',
    promptSchemaExample,
    '',
    'Return ONLY valid JSON.',
    'Do not wrap the response in markdown code fences.',
  ]

  return [
    instructions.join('\n'),
    '---',
    'User input:',
    input,
  ].join('\n')
}

export const buildPromptRetryPrompt = (errorMessage: string): string => {
  return [
    'The previous response failed validation:',
    errorMessage,
    '',
    'Return ONLY valid JSON matching the schema.',
    'Do not wrap the response in markdown code fences.',
  ].join('\n')
}
