import TurndownService from 'turndown'
import Showdown from 'showdown'

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
})

const showdown = new Showdown.Converter({
  tables: true,
  strikethrough: true,
  tasklists: true,
})

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html)
}

export function markdownToHtml(markdown: string): string {
  return showdown.makeHtml(markdown)
}
