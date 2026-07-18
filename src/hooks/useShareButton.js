import { useCallback, useEffect, useRef, useState } from 'react'

function copyText(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }

  return Promise.resolve()
}

async function share({ text, url }) {
  if (typeof navigator.share === 'function') {
    await navigator.share({ text, url })
    return { copied: false }
  }

  await copyText(`${text}\n${url}`)
  return { copied: true }
}

export function useShareButton(defaultLabel = 'SHARE') {
  const [label, setLabel] = useState(defaultLabel)
  const timeoutRef = useRef(null)

  useEffect(
    () => () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    },
    [],
  )

  const onShareClick = useCallback(
    async (shareArgs) => {
      try {
        const result = await share(shareArgs)
        if (!result.copied) return

        if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
        setLabel('COPIED!')
        timeoutRef.current = window.setTimeout(() => {
          setLabel(defaultLabel)
          timeoutRef.current = null
        }, 1000)
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Could not share results', error)
        }
      }
    },
    [defaultLabel],
  )

  return { label, onShareClick }
}
