import { optionId } from '../lib/slashCommands'
import type { SlashCommand } from '../lib/slashCommands'
import type { BlockType } from '../types'
import './SlashMenu.css'

export interface SlashMenuProps {
  id: string
  commands: SlashCommand[]
  activeIndex: number
  onSelect: (type: BlockType) => void
  onHover: (index: number) => void
}

function SlashMenu({ id, commands, activeIndex, onSelect, onHover }: SlashMenuProps) {
  return (
    <div className="slash-menu">
      {commands.length === 0 ? (
        <p className="slash-menu-empty">No results</p>
      ) : (
        <ul id={id} role="listbox" aria-label="Block types" className="slash-menu-list">
          {commands.map((command, index) => (
            <li
              key={command.type}
              id={optionId(id, index)}
              role="option"
              aria-selected={index === activeIndex}
              className="slash-menu-item"
              // mousedown would move focus out of the block; keep the cursor where it is.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(command.type)}
              onMouseEnter={() => onHover(index)}
            >
              {command.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default SlashMenu
