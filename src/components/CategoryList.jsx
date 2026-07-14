export function CategoryList({ categories, results, onSelect }) {
  return (
    <div className="screen screen--list">
      <h1 className="headline headline--top">
        How many can you name in 5 minutes?
      </h1>
      <div className="category-stack">
        {categories.map((category) => {
          const result = results[category.id]
          const done = Boolean(result)

          return (
            <button
              key={category.id}
              type="button"
              className={`category-btn ${done ? 'category-btn--done' : 'category-btn--todo'}`}
              onClick={() => onSelect(category.id)}
            >
              <span className="category-btn__label">
                {done
                  ? `${result.names.length} ${category.resultLabel}`
                  : category.name}
              </span>
              <span className={`category-btn__action ${done ? '' : 'category-btn__action--start'}`}>
                {done ? '>' : 'start >'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
