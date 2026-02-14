import { buildLineDiffPreview } from '@/lib/diff'

describe('buildLineDiffPreview', () => {
  it('summarizes added, removed, and changed lines', () => {
    const before = ['# Title', 'Line A', 'Line B', ''].join('\n')
    const after = ['# Title', 'Line A updated', 'Line B', 'Line C'].join('\n')

    const diff = buildLineDiffPreview(before, after)

    expect(diff.changed).toBe(1)
    expect(diff.added).toBe(1)
    expect(diff.removed).toBe(0)
    expect(diff.entries.length).toBeGreaterThan(0)
  })
})
