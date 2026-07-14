import { trimInput } from './normalize.js'

/** Wikidata P21 values accepted per gender filter. */
const GENDER_IDS = {
  female: new Set([
    'Q6581072', // female
    'Q1052281', // transgender female
  ]),
  male: new Set([
    'Q6581097', // male
    'Q2449503', // transgender male
  ]),
}

/**
 * Resolve a Wikipedia page title (following redirects) and optionally require
 * a matching Wikidata gender (`female` or `male`).
 */
export async function validateWikipediaName(query, options = {}) {
  const titleQuery = trimInput(query)
  if (!titleQuery) return { ok: false, reason: 'empty' }

  const gender = resolveGenderFilter(options)

  const params = new URLSearchParams({
    action: 'query',
    titles: titleQuery,
    redirects: '1',
    prop: 'info|pageprops',
    ppprop: 'wikibase_item|disambiguation',
    format: 'json',
    origin: '*',
  })

  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`)
  if (!res.ok) return { ok: false, reason: 'network' }

  const data = await res.json()
  const pages = data?.query?.pages
  if (!pages) return { ok: false, reason: 'not_found' }

  const page = Object.values(pages)[0]
  if (!page || page.missing != null || page.invalid != null) {
    return { ok: false, reason: 'not_found' }
  }

  if (page.pageprops?.disambiguation != null) {
    return { ok: false, reason: 'disambiguation' }
  }

  const canonical = page.title
  const wikibaseId = page.pageprops?.wikibase_item

  if (!gender) {
    return { ok: true, name: canonical }
  }

  if (!wikibaseId) {
    return { ok: false, reason: 'no_gender' }
  }

  const genderId = await fetchWikidataGender(wikibaseId)
  if (!genderId) return { ok: false, reason: 'no_gender' }
  if (!GENDER_IDS[gender].has(genderId)) {
    return { ok: false, reason: 'wrong_gender' }
  }

  return { ok: true, name: canonical }
}

function resolveGenderFilter(options) {
  if (options.gender === 'female' || options.gender === 'male') {
    return options.gender
  }
  // Back-compat with earlier config shape
  if (options.requireFemale) return 'female'
  return null
}

async function fetchWikidataGender(entityId) {
  const params = new URLSearchParams({
    action: 'wbgetentities',
    ids: entityId,
    props: 'claims',
    format: 'json',
    origin: '*',
  })

  const res = await fetch(`https://www.wikidata.org/w/api.php?${params}`)
  if (!res.ok) return null

  const data = await res.json()
  const claims = data?.entities?.[entityId]?.claims?.P21
  if (!claims?.length) return null

  return claims[0]?.mainsnak?.datavalue?.value?.id ?? null
}
