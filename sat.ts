import type { Plugin } from '@opencode-ai/plugin'
import { createAppendTool, createRefineTool, createRewriteTool } from './src/tools.ts'

const plugin: Plugin = async ({ directory, client }) => {
  const deps = { directory, client }

  return {
    tool: {
      'rewrite-instructions': createRewriteTool({
        deps,
        description: [
          '- Discover instruction files from opencode.json configuration.',
          '- Parse discovered instruction files into structured rules.',
          '- Format structured rules into human-readable rules.',
          '- Write formatted rules back to the original instruction files.',
          '- Optionally accept a mode parameter (verbose, balanced, or concise) to control formatting.',
          '- Default to balanced mode when no mode is specified.',
          '- Optionally accept a files parameter to process specific files instead of running discovery.',
        ].join('\n'),
      }),

      'add-instruction': createAppendTool({
        deps,
        toolName: 'add-instruction',
        sessionTitle: 'SAT Add',
        defaultMode: 'balanced',
        hasMode: true,
        successPrefix: 'Added',
        description: [
          '- Parse unstructured input into structured rules.',
          '- Format parsed rules after parsing unstructured input into structured rules.',
          '- Append formatted rules to the instruction file without rewriting existing content.',
          '- Optionally accept a mode parameter (verbose, balanced, or concise).',
          '- Default mode to balanced when no mode parameter is specified.',
          '- Optionally accept a file parameter to specify the target instruction file.',
          '- Append to the first discovered instruction file when no file parameter is specified.',
        ].join('\n'),
      }),

      'automatic-rule': createAppendTool({
        deps,
        toolName: 'automatic-rule',
        sessionTitle: 'SAT Candidate',
        defaultMode: 'balanced',
        hasMode: false,
        successPrefix: 'Learned',
        description: [
          '- Detect user corrections when the user says something was done wrong, expresses a preference about how code should be written, or gives feedback that implies a repeatable guideline.',
          '- Extract the implicit rule from the correction after detecting a user correction or preference.',
          '- Persist the extracted rule as a new instruction rule.',
          '- Append the new rule to the instruction file.',
        ].join('\n'),
      }),

      'refine-prompt': createRefineTool({
        deps,
        description: [
          '- Restructure messy, ambiguous, or voice-transcribed user input before starting work when the message is vague, run-on, contains multiple interleaved requests, or reads like unpunctuated speech.',
          '- Invoke this tool BEFORE starting work on vague, run-on, multi-request, or speech-like user messages.',
          '- Decompose the input into a hierarchical task breakdown when restructuring user input.',
          '- Return formatted markdown after decomposing the input.',
        ].join('\n'),
      }),
    },
  }
}

export default plugin
