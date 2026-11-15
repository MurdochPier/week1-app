import { describe, expect, it } from 'vitest'
import { filterCommands, SLASH_COMMANDS } from './slashCommands'

const types = (query: string) => filterCommands(query).map((c) => c.type)

describe('filterCommands', () => {
  it('matches commands by name', () => {
    expect(types('head')).toEqual(['h1', 'h2', 'h3'])
    expect(types('list')).toEqual(['bullet', 'numbered'])
  })

  it('matches commands by alias', () => {
    expect(types('ul')).toEqual(['bullet'])
    expect(types('checkbox')).toEqual(['todo'])
    expect(types('title')).toEqual(['h1', 'h2']) // "title" and "subtitle"
  })

  it('ignores upper/lower case', () => {
    expect(types('HEADING 2')).toEqual(['h2'])
    expect(types('To-Do')).toEqual(['todo'])
  })

  it('an empty query returns everything', () => {
    expect(filterCommands('')).toEqual(SLASH_COMMANDS)
    expect(filterCommands('  ')).toEqual(SLASH_COMMANDS)
  })

  it('no match returns an empty list', () => {
    expect(filterCommands('zzz')).toEqual([])
  })
})
