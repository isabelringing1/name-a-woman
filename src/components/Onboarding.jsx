import { useState } from 'react'
import { validateAnswer } from '../validators'
import { NameInput } from './NameInput'

export function Onboarding({ category, onContinue }) {
  const [value, setValue] = useState('')
  const [resolvedName, setResolvedName] = useState(null)
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState('idle')

  async function handleSubmit() {
    if (resolvedName || checking) return
    setChecking(true)
    setStatus('idle')
    try {
      const result = await validateAnswer(value, category)
      if (result.ok) {
        setResolvedName(result.name)
        setStatus('success')
      } else {
        setStatus('error')
      }
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="screen screen--centered">
      <div className="screen__main">
        <h1 className="headline">Name a woman* to begin</h1>
        {resolvedName ? (
          <p className="resolved-name">{resolvedName}</p>
        ) : (
          <NameInput
            value={value}
            onChange={(next) => {
              setValue(next)
              if (status !== 'idle') setStatus('idle')
            }}
            onSubmit={handleSubmit}
            disabled={checking}
            status={status}
          />
        )}
        {resolvedName && (
          <button type="button" className="btn btn--start" onClick={onContinue}>
            CONTINUE
          </button>
        )}
      </div>
      <p className="disclaimer footnote">{category.disclaimer}</p>
    </div>
  )
}
