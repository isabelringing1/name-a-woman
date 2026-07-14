import { useEffect, useRef } from 'react'

export function NameInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  autoFocus = true,
  placeholder = '',
  status = 'idle',
}) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      onSubmit?.()
    }
  }

  function handleClear(event) {
    event.preventDefault()
    if (disabled || !value) return
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <label className={`name-input name-input--${status}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Answer"
      />
      <button
        type="button"
        className="name-input__mark"
        onClick={handleClear}
        disabled={disabled || !value}
        aria-label="Clear input"
        tabIndex={-1}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M3 3L15 15" stroke="#E23B3B" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M15 3L3 15" stroke="#E23B3B" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </button>
    </label>
  )
}
