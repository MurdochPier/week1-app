import type { Page } from '../types'

export interface SearchResult {
  pageId: string
  title: string
  snippet: string
}

export interface MatchParts {
  before: string
  match: string
  after: string
}

/** Characters of context kept on each side of a match in a snippet. */
const CONTEXT = 30

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()

/** Splits `text` around the first case-insensitive match of `query`, or returns null if there is none. */
export function splitMatch(text: string, query: string): MatchParts | null {
  const q = query.trim().toLowerCase()
  if (q === '') return null
  const index = text.toLowerCase().indexOf(q)
  if (index === -1) return null
  return {
    before: text.slice(0, index),
    match: text.slice(index, index + q.length),
    after: text.slice(index + q.length),
  }
}

/** A short piece of `text` around the match, with "…" where it was cut. */
function snippetAround(text: string, query: string): string {
  const parts = splitMatch(text, query)
  if (!parts) return text.length > CONTEXT * 2 ? text.slice(0, CONTEXT * 2) + '…' : text
  const before = parts.before.length > CONTEXT ? '…' + parts.before.slice(-CONTEXT) : parts.before
  const after = parts.after.length > CONTEXT ? parts.after.slice(0, CONTEXT) + '…' : parts.after
  return before + parts.match + after
}

/** Pages whose title or block text contains `query` (ignoring case). Title matches come first. */
export function searchPages(pages: Record<string, Page>, query: string): SearchResult[] {
  const q = query.trim().toLowerCase()
  if (q === '') return []

  const titleMatches: { page: Page; snippet: string }[] = []
  const blockMatches: { page: Page; snippet: string }[] = []

  for (const page of Object.values(pages)) {
    const blockTexts = page.blocks.map((b) => normalize(b.text))
    const matchingText = blockTexts.find((t) => t.toLowerCase().includes(q))

    if (page.title.toLowerCase().includes(q)) {
      const snippet = matchingText ?? blockTexts.find((t) => t !== '') ?? ''
      titleMatches.push({ page, snippet: snippetAround(snippet, q) })
    } else if (matchingText !== undefined) {
      blockMatches.push({ page, snippet: snippetAround(matchingText, q) })
    }
  }

  const newestFirst = (a: { page: Page }, b: { page: Page }) => b.page.updatedAt - a.page.updatedAt
  return [...titleMatches.sort(newestFirst), ...blockMatches.sort(newestFirst)].map(
    ({ page, snippet }) => ({ pageId: page.id, title: page.title, snippet }),
  )
}
