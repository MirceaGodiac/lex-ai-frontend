import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PromptComposer from '../components/PromptComposer'

const promptIdeas = [
  'concediere fara preaviz',
  'mostenire fara testament',
  'clauze dintr-un contract de chirie',
  'contestarea unei amenzi rutiere',
  'ore suplimentare neplatite',
]

function HomePage() {
  const navigate = useNavigate()
  const navigationTimeoutRef = useRef<number | null>(null)
  const [isIntroVisible, setIsIntroVisible] = useState(false)
  const [isRouteHandoffActive, setIsRouteHandoffActive] = useState(false)
  const [promptValue, setPromptValue] = useState('')

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsIntroVisible(true)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [])

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current !== null) {
        window.clearTimeout(navigationTimeoutRef.current)
      }
    }
  }, [])

  function handlePromptSubmit(nextPrompt: string) {
    const trimmedPrompt = nextPrompt.trim()

    if (trimmedPrompt.length === 0 || isRouteHandoffActive) {
      return
    }

    const navigateToProduct = () => {
      navigate('/product?panel=assistant', {
        state: {
          initialPrompt: trimmedPrompt,
          source: 'home',
          submittedAt: Date.now(),
        },
      })
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigateToProduct()
      return
    }

    setPromptValue(trimmedPrompt)
    setIsRouteHandoffActive(true)
    navigationTimeoutRef.current = window.setTimeout(navigateToProduct, 280)
  }

  return (
    <section
      className={`page page-home${isIntroVisible ? ' page-home--intro-visible' : ''}${isRouteHandoffActive ? ' page-home--handoff-active' : ''}`}
    >
      <div className="hero-stack">
        <div className="hero-copy">
          <h1>
            Descrii cazul,
            <br />
            vezi baza legala.
          </h1>
          <p>
            LexGraph iti arata raspunsul si articolele care il sustin.
          </p>
        </div>

        <PromptComposer
          promptPrefix="Intreaba-l pe LexAi despre "
          promptIdeas={promptIdeas}
          value={promptValue}
          onChange={setPromptValue}
          onSubmit={handlePromptSubmit}
          ariaLabel="Prompt"
        />
      </div>
    </section>
  )
}

export default HomePage
