import type { Page } from '../types'

export interface TreeNode {
  page: Page
  children: TreeNode[]
}

function byCreatedAt(a: Page, b: Page): number {
  return a.createdAt - b.createdAt
}

/** Builds the nested page tree. Pages whose parent no longer exists are treated as roots. */
export function buildTree(pages: Record<string, Page>): TreeNode[] {
  const childrenOf = new Map<string | null, Page[]>()
  for (const page of Object.values(pages)) {
    const parentKey = page.parentId !== null && pages[page.parentId] ? page.parentId : null
    const siblings = childrenOf.get(parentKey) ?? []
    siblings.push(page)
    childrenOf.set(parentKey, siblings)
  }

  const build = (parentKey: string | null): TreeNode[] =>
    (childrenOf.get(parentKey) ?? [])
      .sort(byCreatedAt)
      .map((page) => ({ page, children: build(page.id) }))

  return build(null)
}

/** Returns the ids of every sub-page of `id`, at any depth (not including `id` itself). */
export function getDescendants(pages: Record<string, Page>, id: string): string[] {
  const result: string[] = []
  const queue = [id]
  while (queue.length > 0) {
    const current = queue.shift()!
    for (const page of Object.values(pages)) {
      if (page.parentId === current && page.id !== id && !result.includes(page.id)) {
        result.push(page.id)
        queue.push(page.id)
      }
    }
  }
  return result
}
