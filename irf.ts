import type { Plugin } from '@opencode-ai/plugin'
import { tool } from '@opencode-ai/plugin'
import { basename } from 'node:path'
import { appendRules } from './src/append.ts'
import { sendResult } from './src/opencode/notify.ts'
import { type FileResult, processFile, type PromptFn } from './src/process.ts'
import { isFormatMode } from './src/prompt.ts'
import { resolveFiles } from './src/resolve.ts'
import { detectModel, promptWithRetry } from './src/session.ts'
import { buildTable, type TableRow } from './src/utils/compare.ts'
import { safeAsync } from './src/utils/safe.ts'

const ERROR_LABELS: Record<string, string> = {
  readError: 'Read failed',
  parseError: 'Parse failed',
  formatError: 'Format failed',
  writeError: 'Write failed',
}

const toTableRow = (result: FileResult): TableRow => {
  if (result.status === 'success') {
    return {
      file: basename(result.path),
      status: 'Success',
      rules: result.rulesCount,
      comparison: result.comparison,
    }
  }

  const label = ERROR_LABELS[result.status] || result.status
  return {
    file: basename(result.path),
    status: label,
  }
}

const plugin: Plugin = async ({ directory, client }) => {
  return {
    tool: {
      'irf-rewrite': tool({
        description: [
          'Discover instruction files from opencode.json, parse them into structured rules,',
          'format them into human-readable rules, and write the formatted rules back to the original files.',
          'Accepts an optional mode: verbose (full Rule/Reason pairs),',
          'balanced (LLM decides which rules need reasons), or concise (bullet list, no reasons).',
          'Defaults to balanced.',
          'Accepts an optional files parameter to process specific files instead of running discovery.',
        ].join(' '),
        args: {
          mode: tool.schema.string().optional().describe(
            'Output format: verbose, balanced, or concise (default: balanced)',
          ),
          files: tool.schema.string().optional().describe(
            'Comma-separated file paths to process instead of discovering from opencode.json',
          ),
        },
        async execute(args, context) {
          // validate mode argument
          const mode = isFormatMode(args.mode) ? args.mode : 'balanced'
          try {
            // resolve files: explicit paths or discovery
            const resolved = await resolveFiles(directory, args.files)
            if (resolved.error !== null) {
              return resolved.error
            }

            // detect model from current session
            const model = await detectModel(client, context.sessionID)
            if (!model) {
              return 'Could not detect current model. Send a message first, then call irf-rewrite.'
            }

            // create a session for internal LLM calls
            const sessionResult = await client.session.create({ body: { title: 'IRF Parse' } })
            if (!sessionResult.data) {
              return 'Failed to create internal session'
            }

            const sessionId = sessionResult.data.id

            // close over session details so processFile only needs a prompt callback
            const prompt: PromptFn = (text, schema) => (
              promptWithRetry({
                client,
                sessionId,
                initialPrompt: text,
                schema,
                model,
              })
            )

            // process files sequentially; parallel prompting through a shared
            // session may cause ordering issues depending on SDK behavior
            const fileResults: FileResult[] = []

            for (const file of resolved.data) {
              // bail if the tool call was cancelled
              if (context.abort.aborted) {
                break
              }

              fileResults.push(await processFile({ file, prompt, mode }))
            }

            // clean up the internal session
            await safeAsync(() => client.session.delete({ path: { id: sessionId } }))

            const table = buildTable(fileResults.map(toTableRow))
            if (table.length > 0) {
              await sendResult({
                client,
                sessionID: context.sessionID,
                text: table,
              })
            }

            return table
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            return 'irf-rewrite error: ' + msg
          }
        },
      }),

      'irf-add': tool({
        description: [
          'Parse unstructured input into structured rules, format them,',
          'and append to the end of an instruction file without rewriting existing content.',
          'Accepts an optional mode: verbose (full Rule/Reason pairs),',
          'balanced (LLM decides which rules need reasons), or concise (bullet list, no reasons).',
          'Defaults to balanced.',
          'Accepts an optional file parameter to specify the target file.',
          'If no file is specified, appends to the first discovered instruction file.',
        ].join(' '),
        args: {
          input: tool.schema.string().describe(
            'Unstructured text describing the rule(s) to add',
          ),
          file: tool.schema.string().optional().describe(
            'File path to append to. If omitted, uses the first discovered instruction file.',
          ),
          mode: tool.schema.string().optional().describe(
            'Output format: verbose, balanced, or concise (default: balanced)',
          ),
        },
        async execute(args, context) {
          const mode = isFormatMode(args.mode) ? args.mode : 'balanced'
          try {
            // resolve target file path
            let filePath = args.file
            if (!filePath) {
              const resolved = await resolveFiles(directory)
              if (resolved.error !== null) {
                return resolved.error
              }

              const first = resolved.data[0]
              if (!first) {
                return 'No instruction files found in opencode.json'
              }

              filePath = first.path
            }

            // detect model from current session
            const model = await detectModel(client, context.sessionID)
            if (!model) {
              return 'Could not detect current model. Send a message first, then call irf-add.'
            }

            // create a session for internal LLM calls
            const sessionResult = await client.session.create({ body: { title: 'IRF Add' } })
            if (!sessionResult.data) {
              return 'Failed to create internal session'
            }

            const sessionId = sessionResult.data.id

            const prompt: PromptFn = (text, schema) => (
              promptWithRetry({
                client,
                sessionId,
                initialPrompt: text,
                schema,
                model,
              })
            )

            const result = await appendRules({
              input: args.input,
              filePath,
              directory,
              prompt,
              mode,
            })

            // clean up the internal session
            await safeAsync(() => client.session.delete({ path: { id: sessionId } }))

            if (result.status !== 'success') {
              return result.status + ': ' + result.error
            }

            const msg = 'Added ' + result.rulesCount + ' rule(s) to ' + result.path
            await sendResult({
              client,
              sessionID: context.sessionID,
              text: msg,
            })

            return msg
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            return 'irf-add error: ' + msg
          }
        },
      }),
    },
  }
}

export default plugin
