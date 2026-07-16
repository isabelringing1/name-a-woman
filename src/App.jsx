import { useEffect, useState } from 'react'
import { CategoryList } from './components/CategoryList'
import { CategoryPrep } from './components/CategoryPrep'
import { GameScreen } from './components/GameScreen'
import { Onboarding } from './components/Onboarding'
import { Results } from './components/Results'
import { usePersistedGame } from './hooks/usePersistedGame'
import { publicUrl } from './utils/publicUrl'
import { loadStaticList } from './validators/staticList'
import './App.css'

export default function App() {
  const [config, setConfig] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [view, setView] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [sessionNames, setSessionNames] = useState(null)
  const {
    onboardingComplete,
    results,
    completeOnboarding,
    saveResult,
    clearResult,
  } = usePersistedGame()

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const res = await fetch(publicUrl('data/categories.json'))
        if (!res.ok) throw new Error('Could not load categories')
        const data = await res.json()

        await Promise.all(
          data.categories
            .filter((c) => c.validator === 'static' && c.listUrl)
            .map((c) => loadStaticList(c.listUrl)),
        )

        if (cancelled) return
        setConfig(data)
        setView(onboardingComplete ? 'list' : 'onboarding')
      } catch (error) {
        if (!cancelled) setLoadError(error.message || 'Failed to load')
      }
    }

    boot()
    return () => {
      cancelled = true
    }
    // Intentionally run once on mount; onboarding state is read from the initial closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loadError) {
    return (
      <div className="app-shell">
        <p className="load-error">{loadError}</p>
      </div>
    )
  }

  if (!config || !view) {
    return (
      <div className="app-shell">
        <p className="loading">Loading…</p>
      </div>
    )
  }

  const categories = config.categories
  const activeCategory = categories.find((c) => c.id === activeId) ?? null
  const womenCategory = categories.find((c) => c.id === 'women') ?? categories[0]

  function openCategory(id) {
    setActiveId(id)
    setSessionNames(results[id]?.names ?? null)
    if (results[id]) {
      setView('results')
    } else {
      setView('prep')
    }
  }

  return (
    <div className="app-shell">
      {view === 'onboarding' && (
        <Onboarding
          category={womenCategory}
          onContinue={() => {
            completeOnboarding()
            setView('list')
          }}
        />
      )}

      {view === 'list' && (
        <CategoryList
          categories={categories}
          results={results}
          onSelect={openCategory}
        />
      )}

      {view === 'prep' && activeCategory && (
        <CategoryPrep
          category={activeCategory}
          onBack={() => {
            setActiveId(null)
            setView('list')
          }}
          onStart={() => setView('playing')}
        />
      )}

      {view === 'playing' && activeCategory && (
        <GameScreen
          key={activeCategory.id}
          category={activeCategory}
          durationSeconds={config.durationSeconds}
          onFinish={(names) => {
            setSessionNames(names)
            saveResult(activeCategory.id, names)
            setView('results')
          }}
        />
      )}

      {view === 'results' && activeCategory && (
        <Results
          category={activeCategory}
          names={results[activeCategory.id]?.names ?? sessionNames ?? []}
          onBack={() => {
            setActiveId(null)
            setSessionNames(null)
            setView('list')
          }}
          onRedo={() => {
            clearResult(activeCategory.id)
            setSessionNames(null)
            setView('prep')
          }}
        />
      )}
    </div>
  )
}
