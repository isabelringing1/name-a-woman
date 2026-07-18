import { NameList } from './NameList'
import { useShareButton } from '../hooks/useShareButton'

export function Results({ category, names, durationMinutes, onRedo, onBack }) {
  const { label: shareLabel, onShareClick } = useShareButton()
  const completedAll =
    category.validator !== 'wikipedia' &&
    category.answerCount > 0 &&
    names.length >= category.answerCount

  function shareResults() {
    onShareClick({
      text: `I named ${names.length} ${category.display_name} in ${durationMinutes} minutes. How many can you name?`,
      url: window.location.href,
    })
  }

  return (
    <div className="screen screen--results">
      <button type="button" className="back-link" onClick={onBack}>
        ← categories
      </button>

      <h1 className="headline headline--score">
        You named {names.length} {category.display_name}
      </h1>
      {completedAll && <p className="completion-message">Wow, that's all of them!</p>}
      <button type="button" className="btn btn--share" onClick={shareResults}>
        {shareLabel}
      </button>
      <button type="button" className="btn btn--redo" onClick={onRedo}>
        REDO
      </button>

      <NameList
        names={names}
        className="name-list--results"
        linkType={category.entryLink ?? (category.validator === 'wikipedia' ? 'wikipedia' : null)}
      />
    </div>
  )
}
