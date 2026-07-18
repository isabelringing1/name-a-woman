import { useEffect, useRef, useState } from 'react'
import { validateAnswer } from '../validators'
import { NameInput } from './NameInput'
import { NameList } from './NameList'

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function GameScreen({ category, durationSeconds, onFinish }) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds)
  const [value, setValue] = useState('')
  const [names, setNames] = useState([])
  const [status, setStatus] = useState('idle')
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
        return
      }

      const already = namesRef.current.some(
        (n) => n.toLowerCase() === result.name.toLowerCase(),
      )
      if (already) {
        setStatus('error')
        return
      }

      const nextNames = [result.name, ...namesRef.current]
      namesRef.current = nextNames
      setNames(nextNames)
      setValue((current) => (current === submittedValue ? '' : current))
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
          if (status !== 'idle') setStatus('idle')
        }}
        onSubmit={handleSubmit}
        disabled={secondsLeft <= 0}
        status={status}
      />
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
