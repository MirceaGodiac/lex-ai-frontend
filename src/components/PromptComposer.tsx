import { useEffect, useState, type KeyboardEvent } from 'react'

interface PromptComposerProps {
  promptPrefix: string
  promptIdeas: string[]
  value: string
  onChange: (value: string) => void
  onSubmit?: (value: string) => void
  ariaLabel: string
  className?: string
  animateIdeas?: boolean
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 18V6M7 11l5-5 5 5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function PromptComposer({
  promptPrefix,
  promptIdeas,
  value,
  onChange,
  onSubmit,
  ariaLabel,
  className = '',
  animateIdeas = true,
}: PromptComposerProps) {
  const [ideaIndex, setIdeaIndex] = useState(0)
  const [typedIdea, setTypedIdea] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const canSubmit = value.trim().length > 0

  useEffect(() => {
    if (!animateIdeas || promptIdeas.length === 0) {
      return
    }

    const currentIdea = promptIdeas[ideaIndex]
    const isComplete = typedIdea === currentIdea
    const isEmpty = typedIdea.length === 0

    const delay = isDeleting ? (isEmpty ? 240 : 36) : isComplete ? 1500 : 72

    const timeoutId = window.setTimeout(() => {
      if (!isDeleting) {
        if (isComplete) {
          setIsDeleting(true)
          return
        }

        setTypedIdea(currentIdea.slice(0, typedIdea.length + 1))
        return
      }

      if (!isEmpty) {
        setTypedIdea(currentIdea.slice(0, typedIdea.length - 1))
        return
      }

      setIsDeleting(false)
      setIdeaIndex((currentIndex) => (currentIndex + 1) % promptIdeas.length)
    }, delay)

    return () => window.clearTimeout(timeoutId)
  }, [animateIdeas, ideaIndex, isDeleting, promptIdeas, typedIdea])

  function handleSubmit() {
    if (!onSubmit || !canSubmit) {
      return
    }

    onSubmit(value.trim())
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return
    }

    event.preventDefault()
    handleSubmit()
  }

  return (
    <section className={`prompt-card${className ? ` ${className}` : ''}`} aria-label={ariaLabel}>
      <div className="prompt-card__frame">
        <div className="prompt-card__editor">
          <label className="prompt-card__input-wrap">
            <span className="sr-only">{ariaLabel}</span>
            <textarea
              className="prompt-card__input"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              aria-label={ariaLabel}
            />
            {value.length === 0 ? (
              <span className="prompt-card__placeholder">
                <span className="prompt-card__placeholder-prefix">
                  {promptPrefix}
                </span>
                {animateIdeas ? (
                  <>
                    <span className="prompt-card__placeholder-text">
                      {typedIdea}
                    </span>
                    <span className="prompt-card__cursor" aria-hidden="true">
                      |
                    </span>
                  </>
                ) : null}
              </span>
            ) : null}
          </label>
        </div>

        <div className="prompt-card__toolbar">
          <button
            className="prompt-icon-button prompt-icon-button-primary"
            type="button"
            aria-label="Send prompt"
            disabled={!onSubmit || !canSubmit}
            onClick={handleSubmit}
          >
            <ArrowUpIcon />
          </button>
        </div>
      </div>
    </section>
  )
}
