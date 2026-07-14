import { NameList } from './NameList'

export function Results({ category, names, onRedo, onBack }) {
  return (
    <div className="screen screen--results">
      <button type="button" className="back-link" onClick={onBack}>
        ← categories
      </button>

      <h1 className="headline headline--score">
        You named {names.length} {category.display_name}
      </h1>
      <button type="button" className="btn btn--redo" onClick={onRedo}>
        REDO
      </button>

      <NameList
        names={names}
        className="name-list--results"
        linkWikipedia={category.validator === 'wikipedia'}
      />
    </div>
  )
}
