import { wikipediaUrl } from '../utils/wikipediaUrl'

function entryUrl(name, linkType) {
  if (linkType === 'wikipedia') return wikipediaUrl(name)
  if (linkType === 'bulbapedia') {
    const pageTitle = `${name.replaceAll(' ', '_')}_(Pokémon)`
    return `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(pageTitle)}`
  }
  return null
}

export function NameList({ names, linkType, newestFirst = false, className = '' }) {
  return (
    <ul className={`name-list ${className}`.trim()} aria-live="polite">
      {names.map((name, index) => {
        const isNew = newestFirst && index === 0
        const classNames = isNew
          ? 'name-list__item name-list__item--new'
          : 'name-list__item'
        const href = entryUrl(name, linkType)

        return (
          <li key={`${name}-${index}`} className={classNames}>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="name-list__link"
              >
                {name}<img src="./external-link.png" alt="External Link" className="external-link-icon" />
              </a>
            ) : (
              name
            )}
          </li>
        )
      })}
    </ul>
  )
}
