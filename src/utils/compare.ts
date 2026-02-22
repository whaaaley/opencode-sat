import Table from 'cli-table3'

export type ComparisonResult = {
  file: string
  originalBytes: number
  generatedBytes: number
  difference: number
  percentChange: number
}

// compare byte sizes of two strings and return diff stats
export const compareBytes = (file: string, original: string, generated: string): ComparisonResult => {
  const originalBytes = new TextEncoder().encode(original).length
  const generatedBytes = new TextEncoder().encode(generated).length
  const difference = originalBytes - generatedBytes
  const percentChange = originalBytes === 0 ? 0 : (difference / originalBytes) * 100

  return {
    file,
    originalBytes,
    generatedBytes,
    difference,
    percentChange,
  }
}

// format a percent change string with direction indicator
const formatChange = (difference: number, percentChange: number): string => {
  const prefix = difference > 0 ? '\u2212' : '+'
  return prefix + Math.abs(percentChange).toFixed(1) + '%'
}

export type ComparisonSummary = {
  totalOriginal: number
  totalGenerated: number
  totalDifference: number
  totalPercentChange: number
}

// summarize an array of comparison results into totals
export const summarize = (results: ComparisonResult[]): ComparisonSummary => {
  const totalOriginal = results.reduce((sum, r) => sum + r.originalBytes, 0)
  const totalGenerated = results.reduce((sum, r) => sum + r.generatedBytes, 0)
  const totalDifference = totalOriginal - totalGenerated
  const totalPercentChange = totalOriginal === 0 ? 0 : (totalDifference / totalOriginal) * 100

  return {
    totalOriginal,
    totalGenerated,
    totalDifference,
    totalPercentChange,
  }
}

// no-border chars config for cli-table3
const NO_BORDERS: Record<string, string> = {
  'top': '',
  'top-mid': '',
  'top-left': '',
  'top-right': '',
  'bottom': '',
  'bottom-mid': '',
  'bottom-left': '',
  'bottom-right': '',
  'left': '',
  'left-mid': '',
  'mid': '',
  'mid-mid': '',
  'right': '',
  'right-mid': '',
  'middle': '  ',
}

export type TableRow = {
  file: string
  status: string
  rules?: number
  comparison?: ComparisonResult
}

// build a results table as a string
export const buildTable = (rows: TableRow[]): string => {
  if (rows.length === 0) {
    return ''
  }

  const table = new Table({
    head: ['File', 'Status', 'Rules', 'Original', 'Generated', 'Diff', 'Change'],
    chars: NO_BORDERS,
    style: {
      head: [],
      border: [],
      'padding-left': 0,
      'padding-right': 0,
    },
    colAligns: ['left', 'left', 'right', 'right', 'right', 'right', 'right'],
  })

  const sorted = [...rows].sort((a, b) => {
    const aDiff = a.comparison ? Math.abs(a.comparison.difference) : 0
    const bDiff = b.comparison ? Math.abs(b.comparison.difference) : 0
    return bDiff - aDiff
  })

  for (const row of sorted) {
    const c = row.comparison
    table.push([
      row.file,
      row.status,
      row.rules !== undefined ? row.rules : '',
      c ? c.originalBytes : '',
      c ? c.generatedBytes : '',
      c ? c.difference : '',
      c ? formatChange(c.difference, c.percentChange) : '',
    ])
  }

  const comparisons: ComparisonResult[] = []
  for (const row of rows) {
    if (row.comparison !== undefined) {
      comparisons.push(row.comparison)
    }
  }

  const totals = summarize(comparisons)
  const totalRules = rows.reduce((sum, r) => sum + (r.rules !== undefined ? r.rules : 0), 0)

  table.push([
    'TOTAL',
    '',
    totalRules > 0 ? totalRules : '',
    totals.totalOriginal > 0 ? totals.totalOriginal : '',
    totals.totalGenerated > 0 ? totals.totalGenerated : '',
    totals.totalDifference !== 0 ? totals.totalDifference : '',
    totals.totalOriginal > 0 ? formatChange(totals.totalDifference, totals.totalPercentChange) : '',
  ])

  // insert separator lines after header and before TOTAL
  const lines = table.toString().split('\n')
  const width = lines.reduce((max, line) => Math.max(max, line.length), 0)
  const separator = '\u2500'.repeat(width)
  lines.splice(1, 0, separator)
  lines.splice(lines.length - 1, 0, separator)

  if (totals.totalOriginal === 0) {
    return lines.join('\n')
  }

  const summary = (totals.totalDifference > 0 ? 'SAVED ' : 'INCREASED ')
    + Math.abs(totals.totalDifference) + ' bytes ('
    + Math.abs(totals.totalPercentChange).toFixed(1) + '%)'

  return lines.join('\n') + '\n\n' + summary
}
