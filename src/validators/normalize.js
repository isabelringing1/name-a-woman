/** Collapse punctuation/spaces for loose matching. */
export function normalizeKey(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[♀♂]/g, (ch) => (ch === '♀' ? 'f' : 'm'))
    .replace(/[^a-z0-9]+/g, '')
}

export function trimInput(value) {
  return String(value).trim().replace(/\s+/g, ' ')
}
