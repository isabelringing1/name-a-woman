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
const HUMAN_ID = 'Q5'

/**
 * Search for a Wikipedia page title (following redirects) and optionally
 * require that its Wikidata item is a real human with a matching gender.
 */
export async function validateWikipediaName(query, options = {}) {
  const titleQuery = trimInput(query)
  if (!titleQuery) return { ok: false, reason: 'empty' }

  const gender = resolveGenderFilter(options)

  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: titleQuery,
    gsrnamespace: '0',
    gsrlimit: '1',
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

  const person = await fetchWikidataPerson(wikibaseId)
  if (!person) return { ok: false, reason: 'no_gender' }
  if (!person.instanceIds.has(HUMAN_ID)) {
    return { ok: false, reason: 'not_real_person' }
  }
  if (person.genderIds.size === 0) {
    return { ok: false, reason: 'no_gender' }
  }
  if (![...person.genderIds].some((id) => GENDER_IDS[gender].has(id))) {
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

async function fetchWikidataPerson(entityId) {
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
  const claims = data?.entities?.[entityId]?.claims
  if (!claims) return null

  return {
    genderIds: claimEntityIds(claims.P21),
    instanceIds: claimEntityIds(claims.P31),
  }
}

function claimEntityIds(statements) {
  return new Set(
    (statements ?? [])
      .filter((statement) => statement.rank !== 'deprecated')
      .map((statement) => statement.mainsnak?.datavalue?.value?.id)
      .filter(Boolean),
  )
}
