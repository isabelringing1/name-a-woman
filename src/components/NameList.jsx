import { wikipediaUrl } from '../utils/wikipediaUrl'

export function NameList({ names, linkWikipedia = false, newestFirst = false, className = '' }) {
  return (
    <ul className={`name-list ${className}`.trim()} aria-live="polite">
      {names.map((name, index) => {
        const isNew = newestFirst && index === 0
        const classNames = isNew
          ? 'name-list__item name-list__item--new'
          : 'name-list__item'

        return (
          <li key={`${name}-${index}`} className={classNames}>
            {linkWikipedia ? (
              <a
                href={wikipediaUrl(name)}
                target="_blank"
                rel="noopener noreferrer"
                className="name-list__link"
              >
                {name}
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
