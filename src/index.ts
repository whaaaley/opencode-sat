import type { Plugin } from '@opencode-ai/plugin'
import { tool } from '@opencode-ai/plugin'
import { discover } from './discover.ts'
import { buildTable, type ComparisonResult } from './compare.ts'
import { detectModel, promptWithRetry } from './session.ts'
import { safeAsync } from './utils/safe.ts'
import { processFile } from './process.ts'

export const IRFPlugin: Plugin = async ({ directory, client }) => {
  return {
    tool: {
      'irf-rewrite': tool({
        description: 'Discover instruction files from opencode.json, parse them into structured rules, format them into human-readable rules, and write the formatted rules back to the original files.',
        args: {},
        async execute(_args, context) {
          try {
            // discover instruction files
            const discovered = await discover(directory)
            if (discovered.error !== null || !discovered.data) {
              return discovered.error || 'No instruction files found'
            }

            // detect model from current session
            const model = await detectModel(client, context.sessionID)
            if (!model) {
              return 'Could not detect current model. Send a message first, then call irf-rewrite.'
            }

            const files = discovered.data

            // create a session for internal LLM calls
            const sessionResult = await client.session.create({
              body: {
                title: 'IRF Parse',
              },
            })
            if (!sessionResult.data) {
              return 'Failed to create internal session'
            }
            const sessionId = sessionResult.data.id

            // close over session details so processFile only needs a prompt callback
            const prompt: Parameters<typeof processFile>[1] = (text, schema) => promptWithRetry(client, sessionId, text, schema, model)

            // process files sequentially — parallel prompting through a shared
            // session may cause ordering issues depending on SDK behavior
            const results: string[] = []
            const comparisons: ComparisonResult[] = []

            for (const file of files) {
              // bail if the tool call was cancelled
              if (context.abort.aborted) {
                results.push('Cancelled')
                break
              }

              const fileResult = await processFile(file, prompt)
              results.push(fileResult.message)
              if (fileResult.comparison) {
                comparisons.push(fileResult.comparison)
              }
            }

            // clean up the internal session
            await safeAsync(() =>
              client.session.delete({
                path: { id: sessionId },
              })
            )

            // build comparison table
            if (comparisons.length > 0) {
              results.push('')
              results.push('```')
              results.push(buildTable(comparisons))
              results.push('```')
            }

            return results.join('\n')
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            return 'irf-rewrite error: ' + msg
          }
        },
      }),
    },
  }
}
