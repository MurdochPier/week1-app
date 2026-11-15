export type BlockType = 'text' | 'h1' | 'h2' | 'h3' | 'bullet' | 'numbered' | 'todo'

export interface Block {
  id: string
  type: BlockType
  text: string
  checked?: boolean
}

export interface Page {
  id: string
  title: string
  parentId: string | null
  blocks: Block[]
  createdAt: number
  updatedAt: number
}

export interface AppState {
  pages: Record<string, Page>
  selectedPageId: string | null
}
