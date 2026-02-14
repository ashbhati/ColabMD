export type LineDiffEntry = {
  line: number
  before: string
  after: string
  kind: 'added' | 'removed' | 'changed'
}

export type LineDiffPreview = {
  added: number
  removed: number
  changed: number
  entries: LineDiffEntry[]
}

export function buildLineDiffPreview(before: string, after: string, maxEntries = 30): LineDiffPreview {
  const beforeLines = before.split('\n')
  const afterLines = after.split('\n')
  const maxLineCount = Math.max(beforeLines.length, afterLines.length)

  const entries: LineDiffEntry[] = []
  let added = 0
  let removed = 0
  let changed = 0

  for (let i = 0; i < maxLineCount; i += 1) {
    const beforeLine = beforeLines[i] ?? ''
    const afterLine = afterLines[i] ?? ''

    if (beforeLine === afterLine) {
      continue
    }

    let kind: LineDiffEntry['kind'] = 'changed'
    if (!beforeLine && afterLine) {
      kind = 'added'
      added += 1
    } else if (beforeLine && !afterLine) {
      kind = 'removed'
      removed += 1
    } else {
      changed += 1
    }

    if (entries.length < maxEntries) {
      entries.push({
        line: i + 1,
        before: beforeLine,
        after: afterLine,
        kind,
      })
    }
  }

  return {
    added,
    removed,
    changed,
    entries,
  }
}
