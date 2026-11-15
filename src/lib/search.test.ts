import { describe, expect, it } from 'vitest'
import type { Block, Page } from '../types'
import { searchPages, splitMatch } from './search'

function page(id: string, title: string, texts: string[] = [], updatedAt = 0): Page {
  const blocks: Block[] = texts.map((text, i) => ({ id: `${id}-${i}`, type: 'text', text }))
  return { id, title, parentId: null, blocks, createdAt: 0, updatedAt }
}

function toPages(...list: Page[]): Record<string, Page> {
  return Object.fromEntries(list.map((p) => [p.id, p]))
}

const ids = (pages: Record<string, Page>, query: string) =>
  searchPages(pages, query).map((r) => r.pageId)

describe('searchPages', () => {
  const pages = toPages(
    page('recipes', 'Recipes', ['Pancakes need flour and eggs']),
    page('work', 'Work notes', ['Meeting with the design team']),
    page('trip', 'Trip', ['Pack sunscreen']),
  )

  it('matches titles', () => {
    expect(ids(pages, 'recipes')).toEqual(['recipes'])
  })

  it('matches text inside blocks', () => {
    expect(ids(pages, 'sunscreen')).toEqual(['trip'])
  })

  it('ignores upper/lower case', () => {
    expect(ids(pages, 'PANCAKES')).toEqual(['recipes'])
    expect(ids(pages, 'wOrK')).toEqual(['work'])
  })

  it('an empty or spaces-only query returns nothing', () => {
    expect(searchPages(pages, '')).toEqual([])
    expect(searchPages(pages, '   ')).toEqual([])
  })

  it('no match returns nothing', () => {
    expect(searchPages(pages, 'zebra')).toEqual([])
  })

  it('each page appears only once', () => {
    const many = toPages(page('p', 'Notes on notes', ['notes one', 'more notes', 'notes again']))
    expect(ids(many, 'notes')).toEqual(['p'])
  })

  it('the snippet shows the matching block text', () => {
    const [result] = searchPages(pages, 'design')
    expect(result).toEqual({ pageId: 'work', title: 'Work notes', snippet: 'Meeting with the design team' })
  })

  it('long text is cut with "…" and keeps the match visible', () => {
    const long = 'a'.repeat(100) + ' needle ' + 'b'.repeat(100)
    const [result] = searchPages(toPages(page('p', 'Long', [long])), 'needle')

    expect(result.snippet.startsWith('…')).toBe(true)
    expect(result.snippet.endsWith('…')).toBe(true)
    expect(result.snippet).toContain('needle')
    expect(result.snippet.length).toBeLessThan(80)
  })

  it('line breaks in the snippet become spaces', () => {
    const [result] = searchPages(toPages(page('p', 'P', ['first line\nsecond line'])), 'second')
    expect(result.snippet).toBe('first line second line')
  })

  it('a title-only match uses the first non-empty block as the snippet', () => {
    const [result] = searchPages(toPages(page('p', 'Groceries', ['', 'Milk and bread'])), 'groc')
    expect(result.snippet).toBe('Milk and bread')
  })

  it('a title-only match on an empty page has an empty snippet', () => {
    const [result] = searchPages(toPages(page('p', 'Empty page')), 'empty')
    expect(result.snippet).toBe('')
  })

  it('title matches come first, then newest first', () => {
    const mixed = toPages(
      page('body-new', 'A', ['plan the garden'], 30),
      page('title-old', 'Garden plan', [], 10),
      page('title-new', 'Garden ideas', [], 20),
      page('body-old', 'B', ['garden tools'], 5),
    )
    expect(ids(mixed, 'garden')).toEqual(['title-new', 'title-old', 'body-new', 'body-old'])
  })
})

describe('splitMatch', () => {
  it('splits the text around the first match, keeping the original case', () => {
    expect(splitMatch('Hello World, world', 'WORLD')).toEqual({
      before: 'Hello ',
      match: 'World',
      after: ', world',
    })
  })

  it('returns null when there is no match or the query is empty', () => {
    expect(splitMatch('Hello', 'xyz')).toBeNull()
    expect(splitMatch('Hello', ' ')).toBeNull()
  })
})
