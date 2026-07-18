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

function CreatorTag() {
  return (
    <a
      className="creator-tag"
      href="https://isabisabel.com/"
      aria-label="Visit isabisabel.com"
    >
      <span>isabisabel</span>
      <img src={publicUrl('flower.png')} alt="" />
    </a>
  )
}

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

        const staticCategories = await Promise.all(
          data.categories
            .filter((c) => c.validator === 'static' && c.listUrl)
            .map(async (c) => ({
              id: c.id,
              answerCount: (await loadStaticList(c.listUrl)).byKey.size,
            })),
        )
        const answerCounts = new Map(
          staticCategories.map(({ id, answerCount }) => [id, answerCount]),
        )
        data.categories = data.categories.map((category) => ({
          ...category,
          answerCount: answerCounts.get(category.id),
        }))

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
        <CreatorTag />
      </div>
    )
  }

  if (!config || !view) {
    return (
      <div className="app-shell">
        <p className="loading">Loading…</p>
        <CreatorTag />
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
          durationMinutes={config.durationMinutes}
          results={results}
          onSelect={openCategory}
        />
      )}

      {view === 'prep' && activeCategory && (
        <CategoryPrep
          category={activeCategory}
          durationMinutes={config.durationMinutes}
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
          durationSeconds={config.durationMinutes * 60}
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
            setView('playing')
          }}
        />
      )}
      <CreatorTag />
    </div>
  )
}
