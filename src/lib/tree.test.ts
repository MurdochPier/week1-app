import { describe, expect, it } from 'vitest'
import type { Page } from '../types'
import { buildTree, getDescendants } from './tree'

function page(id: string, parentId: string | null, createdAt = 0): Page {
  return { id, title: id, parentId, blocks: [], createdAt, updatedAt: createdAt }
}

function toPages(...list: Page[]): Record<string, Page> {
  return Object.fromEntries(list.map((p) => [p.id, p]))
}

describe('buildTree', () => {
  it('builds the nested tree correctly', () => {
    const pages = toPages(page('a', null), page('b', 'a'), page('c', 'b'), page('d', null, 1))
    const tree = buildTree(pages)

    expect(tree.map((n) => n.page.id)).toEqual(['a', 'd'])
    expect(tree[0].children.map((n) => n.page.id)).toEqual(['b'])
    expect(tree[0].children[0].children.map((n) => n.page.id)).toEqual(['c'])
    expect(tree[1].children).toEqual([])
  })

  it('orders siblings by createdAt', () => {
    const pages = toPages(page('late', null, 30), page('early', null, 10), page('mid', null, 20))
    expect(buildTree(pages).map((n) => n.page.id)).toEqual(['early', 'mid', 'late'])
  })

  it('treats a page with a missing parent as a root', () => {
    const pages = toPages(page('orphan', 'gone'))
    expect(buildTree(pages).map((n) => n.page.id)).toEqual(['orphan'])
  })

  it('returns an empty list when there are no pages', () => {
    expect(buildTree({})).toEqual([])
  })
})

describe('getDescendants', () => {
  it('returns every sub-page at any depth', () => {
    const pages = toPages(
      page('a', null),
      page('b', 'a'),
      page('c', 'b'),
      page('d', 'c'),
      page('e', 'a'),
      page('other', null),
    )
    expect(getDescendants(pages, 'a').sort()).toEqual(['b', 'c', 'd', 'e'])
  })

  it('returns an empty list for a page with no children', () => {
    const pages = toPages(page('a', null))
    expect(getDescendants(pages, 'a')).toEqual([])
  })
})
