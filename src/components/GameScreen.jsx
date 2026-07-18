import { useEffect, useRef, useState } from 'react'
import { validateAnswer } from '../validators'
import { NameInput } from './NameInput'
import { NameList } from './NameList'

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function entryName(entry) {
  return typeof entry === 'string' ? entry : entry.name
}

export function GameScreen({ category, durationSeconds, onFinish }) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds)
  const [value, setValue] = useState('')
  const [names, setNames] = useState([])
  const [status, setStatus] = useState('idle')
  const [rejectedInput, setRejectedInput] = useState(null)
  const [checking, setChecking] = useState(false)
  const namesRef = useRef(names)
  const onFinishRef = useRef(onFinish)
  const finishedRef = useRef(false)
  const timerRef = useRef(null)

  useEffect(() => {
    namesRef.current = names
  }, [names])

  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerRef.current)
          timerRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current != null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (secondsLeft !== 0 || finishedRef.current) return
    finishedRef.current = true
    onFinishRef.current(namesRef.current)
  }, [secondsLeft])

  function handleGiveUp() {
    if (finishedRef.current) return
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    setSecondsLeft(0)
  }

  function handleOverride() {
    if (!rejectedInput || secondsLeft <= 0) return

    const already = namesRef.current.some(
      (entry) => entryName(entry).toLowerCase() === rejectedInput.toLowerCase(),
    )
    if (already) {
      setRejectedInput(null)
      return
    }

    const nextNames = [{ name: rejectedInput, link: false }, ...namesRef.current]
    namesRef.current = nextNames
    setNames(nextNames)
    setValue('')
    setRejectedInput(null)
    setStatus('success')
  }

  async function handleSubmit() {
    if (checking || secondsLeft <= 0) return
    const submittedValue = value
    setChecking(true)
    setStatus('idle')
    try {
      const result = await validateAnswer(submittedValue, category)
      console.log(result)
      if (!result.ok) {
        setStatus('error')
        setRejectedInput(
          category.validator === 'wikipedia' ? submittedValue.trim() : null,
        )
        return
      }

      const already = namesRef.current.some(
        (entry) => entryName(entry).toLowerCase() === result.name.toLowerCase(),
      )
      if (already) {
        setStatus('error')
        setRejectedInput(null)
        return
      }

      const nextNames = [result.name, ...namesRef.current]
      namesRef.current = nextNames
      setNames(nextNames)
      setValue((current) => (current === submittedValue ? '' : current))
      setRejectedInput(null)
      setStatus('success')

      if (
        category.validator !== 'wikipedia' &&
        category.answerCount > 0 &&
        nextNames.length >= category.answerCount
      ) {
        if (timerRef.current != null) {
          window.clearInterval(timerRef.current)
          timerRef.current = null
        }
        setSecondsLeft(0)
      }
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="screen screen--game">
      <p className="timer" aria-live="polite">
        {formatTime(secondsLeft)}
      </p>
      <h1 className="headline headline--game">{category.prompt}</h1>
      {category.disclaimer && (
        <p className="disclaimer">{category.disclaimer}</p>
      )}
      <NameInput
        value={value}
        onChange={(next) => {
          setValue(next)
          setRejectedInput(null)
          if (status !== 'idle') setStatus('idle')
        }}
        onSubmit={handleSubmit}
        disabled={secondsLeft <= 0}
        status={status}
      />
      {rejectedInput && (
        <button
          type="button"
          className="btn btn--give-up btn--override"
          onClick={handleOverride}
          disabled={secondsLeft <= 0}
        >
          I swear {rejectedInput} is a {category.id === 'men' ? 'man' : 'woman'}
        </button>
      )}
      <button
        type="button"
        className="btn btn--give-up"
        onClick={handleGiveUp}
        disabled={secondsLeft <= 0}
      >
        I'm out of {category.display_name}
      </button>
      <NameList
        names={names}
        newestFirst
        linkType={category.entryLink ?? (category.validator === 'wikipedia' ? 'wikipedia' : null)}
      />
    </div>
  )
}
