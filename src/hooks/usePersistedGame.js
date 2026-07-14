import { useEffect, useState } from 'react'

const STORAGE_KEY = 'name-a-woman:v1'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { onboardingComplete: false, results: {} }
    const parsed = JSON.parse(raw)
    return {
      onboardingComplete: Boolean(parsed.onboardingComplete),
      results:
        parsed.results && typeof parsed.results === 'object' ? parsed.results : {},
    }
  } catch {
    return { onboardingComplete: false, results: {} }
  }
}

export function usePersistedGame() {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  function completeOnboarding() {
    setState((prev) => ({ ...prev, onboardingComplete: true }))
  }

  function saveResult(categoryId, names) {
    setState((prev) => ({
      ...prev,
      results: {
        ...prev.results,
        [categoryId]: {
          names,
          completedAt: Date.now(),
        },
      },
    }))
  }

  function clearResult(categoryId) {
    setState((prev) => {
      const next = { ...prev.results }
      delete next[categoryId]
      return { ...prev, results: next }
    })
  }

  return {
    onboardingComplete: state.onboardingComplete,
    results: state.results,
    completeOnboarding,
    saveResult,
    clearResult,
  }
}
