import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { saveState } from '../storage/storage'
import type { AppState, Page } from '../types'

function page(id: string, title: string, text: string, updatedAt: number): Page {
  return {
    id,
    title,
    parentId: null,
    blocks: [{ id: `${id}-b`, type: 'text', text }],
    createdAt: updatedAt,
    updatedAt,
  }
}

const seeded: AppState = {
  pages: {
    recipes: page('recipes', 'Recipes', 'Pancakes need flour', 1),
    trip: page('trip', 'Trip', 'Pack sunscreen and a hat', 2),
    work: page('work', 'Work', 'Buy a new hat for the office party', 3),
  },
  selectedPageId: null,
}

function setup() {
  saveState(seeded)
  const user = userEvent.setup()
  render(<App />)
  return { user, input: screen.getByRole('searchbox', { name: 'Search pages' }) }
}

const results = () => screen.getByRole('list', { name: 'Search results' })
const resultButtons = () => within(results()).getAllByRole('button')
const pagesNav = () => screen.queryByRole('navigation', { name: 'Pages' })
const titleInput = () => screen.getByRole('textbox', { name: 'Page title' })

describe('SearchBox', () => {
  it('typing shows matching results and hides the page tree', async () => {
    const { user, input } = setup()
    expect(pagesNav()).toBeInTheDocument()

    await user.type(input, 'hat')

    expect(resultButtons().map((b) => b.querySelector('.search-result-title')?.textContent)).toEqual([
      'Work',
      'Trip',
    ])
    expect(pagesNav()).toBeNull()
  })

  it('shows a snippet with the match highlighted', async () => {
    const { user, input } = setup()
    await user.type(input, 'sunscreen')

    const [result] = resultButtons()
    expect(result).toHaveTextContent('Pack sunscreen and a hat')
    expect(result.querySelector('mark')).toHaveTextContent('sunscreen')
  })

  it('clicking a result opens that page and clears the search', async () => {
    const { user, input } = setup()
    await user.type(input, 'flour')

    await user.click(resultButtons()[0])

    expect(titleInput()).toHaveValue('Recipes')
    expect(input).toHaveValue('')
    expect(pagesNav()).toBeInTheDocument()
  })

  it('Enter opens the first result', async () => {
    const { user, input } = setup()
    await user.type(input, 'hat{Enter}')

    expect(titleInput()).toHaveValue('Work')
    expect(input).toHaveValue('')
  })

  it('Escape clears the search and brings the page tree back', async () => {
    const { user, input } = setup()
    await user.type(input, 'trip')
    expect(pagesNav()).toBeNull()

    await user.keyboard('{Escape}')

    expect(input).toHaveValue('')
    expect(pagesNav()).toBeInTheDocument()
  })

  it('shows "No pages found" when nothing matches', async () => {
    const { user, input } = setup()
    await user.type(input, 'zebra')

    expect(screen.getByText('No pages found')).toBeInTheDocument()
    await user.keyboard('{Enter}') // nothing to open; no crash
    expect(screen.queryByRole('textbox', { name: 'Page title' })).toBeNull()
  })
})
