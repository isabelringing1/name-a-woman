export function CategoryPrep({ category, onStart, onBack }) {
  return (
    <div className="screen screen--centered">
      <button type="button" className="back-link" onClick={onBack}>
        ← categories
      </button>
      <div className="screen__main">
        <h1 className="headline">{category.prepHeadline}</h1>
        {category.disclaimer && (
          <p className="disclaimer">{category.disclaimer}</p>
        )}
        <button type="button" className="btn btn--start" onClick={onStart}>
          START
        </button>
      </div>
    </div>
  )
}
