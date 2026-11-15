import type { BlockType } from '../types'

export interface SlashCommand {
  type: BlockType
  label: string
  /** Other words that find this command when typed after "/". */
  aliases: string[]
}

export const SLASH_COMMANDS: readonly SlashCommand[] = [
  { type: 'text', label: 'Text', aliases: ['p', 'paragraph', 'plain'] },
  { type: 'h1', label: 'Heading 1', aliases: ['h1', 'title'] },
  { type: 'h2', label: 'Heading 2', aliases: ['h2', 'subtitle'] },
  { type: 'h3', label: 'Heading 3', aliases: ['h3'] },
  { type: 'bullet', label: 'Bulleted list', aliases: ['ul', 'bullet', 'unordered'] },
  { type: 'numbered', label: 'Numbered list', aliases: ['ol', 'ordered', 'number'] },
  { type: 'todo', label: 'To-do', aliases: ['todo', 'checkbox', 'task'] },
]

/** The id of one menu option, so the block can point at it with aria-activedescendant. */
export const optionId = (menuId: string, index: number) => `${menuId}-option-${index}`

/** Commands whose label or an alias contains `query` (ignoring case). An empty query returns all. */
export function filterCommands(query: string): SlashCommand[] {
  const q = query.trim().toLowerCase()
  if (q === '') return [...SLASH_COMMANDS]
  return SLASH_COMMANDS.filter(
    (c) => c.label.toLowerCase().includes(q) || c.aliases.some((a) => a.includes(q)),
  )
}
