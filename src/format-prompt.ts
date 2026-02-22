import type { ParsedPrompt, ParsedTask } from './prompt-schema'

type FormatTaskOptions = {
  task: ParsedTask
  index: number
  depth: number
}

const formatTask = (options: FormatTaskOptions): string => {
  const { task, index, depth } = options
  const indent = '  '.repeat(depth)
  const number = depth === 0 ? String(index + 1) + '.' : '-'
  const lines: Array<string> = []

  lines.push(indent + number + ' ' + task.intent)

  if (task.targets.length > 0) {
    lines.push(indent + '   Targets: ' + task.targets.join(', '))
  }

  if (task.constraints.length > 0) {
    lines.push(indent + '   Constraints: ' + task.constraints.join(', '))
  }

  if (task.context) {
    lines.push(indent + '   Context: ' + task.context)
  }

  for (let i = 0; i < task.subtasks.length; i++) {
    const subtask = task.subtasks[i]
    if (!subtask) {
      continue
    }

    lines.push(formatTask({
      task: subtask,
      index: i,
      depth: depth + 1,
    }))
  }

  return lines.join('\n')
}

export const formatPrompt = (parsed: ParsedPrompt): string => {
  const lines: Array<string> = []

  for (let i = 0; i < parsed.tasks.length; i++) {
    const task = parsed.tasks[i]
    if (!task) {
      continue
    }

    lines.push(formatTask({
      task,
      index: i,
      depth: 0,
    }))
  }

  return lines.join('\n\n')
}
