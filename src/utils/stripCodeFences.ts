// strip markdown code fences from LLM response text
// handles fences at line start or preceded by text on the same line
export const stripCodeFences = (text: string): string => {
  return text
    .replace(/^.*```(?:json)?\s*\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim()
}
