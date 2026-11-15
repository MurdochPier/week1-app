import { render, renderHook, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../App'
import { useApp } from '../state/useApp'
import { saveState } from '../storage/storage'
import type { AppState, Page } from '../types'

function page(id: string, title: string, parentId: string | null, createdAt: number): Page {
  return { id, title, parentId, blocks: [], createdAt, updatedAt: createdAt }
}

// Work
//   Meetings
//     Standup
// Home
const seeded: AppState = {
  pages: {
    work: page('work', 'Work', null, 1),
    meetings: page('meetings', 'Meetings', 'work', 2),
    standup: page('standup', 'Standup', 'meetings', 3),
    home: page('home', 'Home', null, 4),
  },
  selectedPageId: null,
}

function setup(state: AppState = seeded) {
  saveState(state)
  const user = userEvent.setup()
  const utils = render(<App />)
  return { user, ...utils }
}

const pagesNav = () => screen.getByRole('navigation', { name: 'Pages' })
const pageButton = (name: string) => within(pagesNav()).getByRole('button', { name })
const queryPageButton = (name: string) => within(pagesNav()).queryByRole('button', { name })
/** The <li> for a page, so we can check what is nested inside it. */
const pageItem = (name: string) => pageButton(name).closest('li')!

describe('Sidebar', () => {
  it('shows the saved pages, nested correctly', () => {
    setup()

    const topLevel = within(pagesNav()).getAllByRole('listitem').filter(
      (li) => li.parentElement?.parentElement === pagesNav(),
    )
    expect(topLevel.map((li) => li.querySelector('.tree-page-button')?.textContent)).toEqual([
      'Work',
      'Home',
    ])
    expect(within(pageItem('Work')).getByRole('button', { name: 'Meetings' })).toBeInTheDocument()
    expect(within(pageItem('Meetings')).getByRole('button', { name: 'Standup' })).toBeInTheDocument()
    expect(within(pageItem('Home')).queryByRole('button', { name: 'Meetings' })).toBeNull()
  })

  it('clicking "New page" adds an Untitled page and opens it', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: '+ New page' }))

    expect(pageButton('Untitled')).toHaveAttribute('aria-current', 'page')
    expect(within(screen.getByRole('main')).getByRole('heading', { name: 'Untitled' })).toBeInTheDocument()
  })

  it('"+" adds a child that appears nested under its parent', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: 'Add sub-page to Home' }))

    const child = within(pageItem('Home')).getByRole('button', { name: 'Untitled' })
    expect(child).toHaveAttribute('aria-current', 'page')
  })

  it('"+" on a collapsed page expands it so the new child is visible', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: 'Collapse Work' }))
    await user.click(screen.getByRole('button', { name: 'Add sub-page to Work' }))

    expect(within(pageItem('Work')).getByRole('button', { name: 'Untitled' })).toBeInTheDocument()
    expect(within(pageItem('Work')).getByRole('button', { name: 'Meetings' })).toBeInTheDocument()
  })

  it('delete removes a page without sub-pages, with no confirm', async () => {
    const confirm = vi.spyOn(window, 'confirm')
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete Home' }))

    expect(queryPageButton('Home')).toBeNull()
    expect(confirm).not.toHaveBeenCalled()
  })

  it('deleting a page with sub-pages asks first, then removes them all', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete Work' }))

    expect(confirm).toHaveBeenCalledOnce()
    expect(queryPageButton('Work')).toBeNull()
    expect(queryPageButton('Meetings')).toBeNull()
    expect(queryPageButton('Standup')).toBeNull()
    expect(pageButton('Home')).toBeInTheDocument()
  })

  it('cancelling the confirm keeps the page', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete Work' }))

    expect(pageButton('Work')).toBeInTheDocument()
    expect(pageButton('Standup')).toBeInTheDocument()
  })

  it('clicking a page selects it and shows its title', async () => {
    const { user } = setup()

    await user.click(pageButton('Meetings'))

    expect(pageButton('Meetings')).toHaveAttribute('aria-current', 'page')
    expect(pageButton('Work')).not.toHaveAttribute('aria-current')
    expect(within(screen.getByRole('main')).getByRole('heading', { name: 'Meetings' })).toBeInTheDocument()
  })

  it('collapse hides the children and expand shows them again', async () => {
    const { user } = setup()

    const toggle = screen.getByRole('button', { name: 'Collapse Work' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    await user.click(toggle)
    expect(queryPageButton('Meetings')).toBeNull()
    expect(queryPageButton('Standup')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Expand Work' }))
    expect(pageButton('Meetings')).toBeInTheDocument()
    expect(pageButton('Standup')).toBeInTheDocument()
  })

  it('pages without children have no collapse toggle', () => {
    setup()
    expect(screen.queryByRole('button', { name: /(Collapse|Expand) Home/ })).toBeNull()
  })

  it('changes are saved and still there after a reload', async () => {
    const { user, unmount } = setup()

    await user.click(screen.getByRole('button', { name: 'Add sub-page to Home' }))
    unmount()
    render(<App />)

    expect(within(pageItem('Home')).getByRole('button', { name: 'Untitled' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})

describe('useApp', () => {
  it('throws a clear error outside <AppProvider>', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useApp())).toThrow('useApp() must be used inside <AppProvider>')
  })
})
