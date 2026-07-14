import { validateStaticName } from './staticList.js'
import { validateWikipediaName } from './wikipedia.js'

export async function validateAnswer(query, category) {
  if (category.validator === 'wikipedia') {
    return validateWikipediaName(query, category.wikipedia ?? {})
  }
  if (category.validator === 'static') {
    return validateStaticName(query, category)
  }
  return { ok: false, reason: 'unknown_validator' }
}
