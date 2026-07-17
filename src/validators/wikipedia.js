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
  const exactResult = await fetchWikipediaPage({
    titles: capitalizeName(titleQuery),
  })
  if (exactResult.networkError) {
    return { ok: false, reason: 'network' }
  }

  let page = exactResult.page
  if (isMissingPage(page)) {
    const searchResult = await fetchWikipediaPage({
      generator: 'search',
      gsrsearch: titleQuery,
      gsrnamespace: '0',
      gsrlimit: '1',
    })
    if (searchResult.networkError) {
      return { ok: false, reason: 'network' }
    }

    page = searchResult.page
    if (isMissingPage(page)) {
      return { ok: false, reason: 'not_found' }
    }
    if (!isSimilarName(titleQuery, page.title)) {
      return { ok: false, reason: 'not_close_enough' }
    }
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

async function fetchWikipediaPage(queryParams) {
  const params = new URLSearchParams({
    action: 'query',
    redirects: '1',
    prop: 'info|pageprops',
    ppprop: 'wikibase_item|disambiguation',
    format: 'json',
    origin: '*',
    ...queryParams,
  })

  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`)
  if (!res.ok) return { page: null, networkError: true }

  const data = await res.json()
  const pages = data?.query?.pages
  return {
    page: pages ? Object.values(pages)[0] : null,
    networkError: false,
  }
}

function isMissingPage(page) {
  return !page || page.missing != null || page.invalid != null
}

function capitalizeName(value) {
  return value
    .toLocaleLowerCase('en-US')
    .replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase('en-US'))
}

function isSimilarName(query, title) {
  const queryTokens = nameTokens(query)
  const titleTokens = nameTokens(title.replace(/\s*\([^)]*\)\s*$/, ''))
  if (queryTokens.length === 0 || titleTokens.length === 0) return false

  const unusedTitleTokens = [...titleTokens]
  return queryTokens.every((queryToken) => {
    const matchIndex = unusedTitleTokens.findIndex(
      (titleToken) =>
        levenshteinDistance(queryToken, titleToken) <= allowedTypos(queryToken),
    )
    if (matchIndex === -1) return false
    unusedTitleTokens.splice(matchIndex, 1)
    return true
  })
}

function nameTokens(value) {
  return (
    String(value)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('en-US')
      .match(/[\p{L}\p{N}]+/gu) ?? []
  )
}

function allowedTypos(token) {
  if (token.length <= 3) return 0
  if (token.length <= 7) return 1
  return 2
}

function levenshteinDistance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex]
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost,
      )
    }
    previous.splice(0, previous.length, ...current)
  }

  return previous[right.length]
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
