/** Prefix a public asset path with Vite's configured base URL. */
export function publicUrl(path = '') {
  const base = import.meta.env.BASE_URL || '/'
  const normalized = String(path).replace(/^\//, '')
  return `${base}${normalized}`
}
