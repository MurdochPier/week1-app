/** Number of characters between the start of `el` and the cursor. Returns the text length if the cursor isn't inside `el`. */
export function getCaretOffset(el: HTMLElement): number {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return el.textContent?.length ?? 0

  const range = selection.getRangeAt(0)
  if (!el.contains(range.startContainer)) return el.textContent?.length ?? 0

  const before = document.createRange()
  before.selectNodeContents(el)
  before.setEnd(range.startContainer, range.startOffset)
  return before.toString().length
}

/** Focuses `el` and puts the cursor at its start or end. */
export function placeCaret(el: HTMLElement, where: 'start' | 'end'): void {
  el.focus()
  const selection = window.getSelection()
  if (!selection) return
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(where === 'start')
  selection.removeAllRanges()
  selection.addRange(range)
}
