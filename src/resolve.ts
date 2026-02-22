import { discover, readFilePaths } from './discover.ts'
import type { InstructionFile } from './discover.ts'
import type { Result } from './utils/safe.ts'

// resolve instruction files from explicit paths or opencode.json discovery
export const resolveFiles = async (directory: string, filesArg?: string): Promise<Result<InstructionFile[]>> => {
  if (filesArg) {
    const paths = filesArg.split(',').map((p) => p.trim()).filter((p) => p.length > 0)
    if (paths.length === 0) {
      return {
        data: null,
        error: 'No valid file paths provided',
      }
    }

    return {
      data: await readFilePaths(directory, paths),
      error: null,
    }
  }

  return await discover(directory)
}
