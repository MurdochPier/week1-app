import type { Block, BlockType } from '../types'

/** Block types that continue onto the next line when you press Enter. */
export const LIST_TYPES: ReadonlySet<BlockType> = new Set(['bullet', 'numbered', 'todo'])

/** The number shown for each block: counts up within a run of numbered blocks, 0 for others. */
export function listNumbers(blocks: Block[]): number[] {
  let count = 0
  return blocks.map((b) => (b.type === 'numbered' ? ++count : (count = 0)))
}
