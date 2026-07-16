import { normalizeKey, trimInput } from './normalize.js'
import { publicUrl } from '../utils/publicUrl.js'

const listCache = new Map()

export async function loadStaticList(listUrl) {
  const url = publicUrl(listUrl)
  if (listCache.has(url)) return listCache.get(url)

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load list: ${url}`)
  const names = await res.json()
  const index = buildIndex(names)
  listCache.set(url, index)
  return index
}

function buildIndex(names) {
  const byKey = new Map()
  const byLastName = new Map()

  for (const name of names) {
    const key = normalizeKey(name)
    if (!byKey.has(key)) byKey.set(key, name)

    const parts = String(name).split(/\s+/)
    if (parts.length >= 2) {
      const last = normalizeKey(parts[parts.length - 1])
      if (!byLastName.has(last)) byLastName.set(last, [])
      byLastName.get(last).push(name)
    }
  }

  return { names, byKey, byLastName }
}

/**
 * Match user input against a static answer list.
 * Supports aliases, exact/normalized match, and unique last-name match.
 */
export async function validateStaticName(query, category) {
  const input = trimInput(query)
  if (!input) return { ok: false, reason: 'empty' }

  const index = await loadStaticList(category.listUrl)
  const key = normalizeKey(input)

  const aliasMap = category.aliases ?? {}
  for (const [alias, canonical] of Object.entries(aliasMap)) {
    if (canonical == null) continue
    if (normalizeKey(alias) === key) {
      return { ok: true, name: canonical }
    }
  }

  if (index.byKey.has(key)) {
    return { ok: true, name: index.byKey.get(key) }
  }

  // Unique last-name match (presidents, etc.)
  const lastHits = index.byLastName.get(key)
  if (lastHits?.length === 1) {
    return { ok: true, name: lastHits[0] }
  }

  // First + last without middle initials: "Franklin Roosevelt" → FDR
  const tokens = input.split(/\s+/).filter(Boolean)
  if (tokens.length >= 2) {
    const first = normalizeKey(tokens[0])
    const last = normalizeKey(tokens[tokens.length - 1])
    const candidates = index.names.filter((name) => {
      const parts = name.split(/\s+/)
      if (parts.length < 2) return false
      return (
        normalizeKey(parts[0]) === first &&
        normalizeKey(parts[parts.length - 1]) === last
      )
    })
    if (candidates.length === 1) {
      return { ok: true, name: candidates[0] }
    }
  }

  return { ok: false, reason: 'not_found' }
}
