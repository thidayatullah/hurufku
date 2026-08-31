import { useEffect, useState } from 'react'
import { BoardCanvas } from './board/BoardCanvas'
import { emptyBoard, type Language } from './board/types'

export default function App() {
  const [board, setBoard] = useState(() => emptyBoard())
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  useEffect(() => {
    const onResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const toolbarHeight = 56
  const setLanguage = (language: Language) => {
    setBoard((current) => ({ ...current, language }))
  }

  return (
    <div className="app">
      <header className="toolbar">
        <h1>HurufPad</h1>
        <div className="toolbar-actions" role="group" aria-label="Spoken language">
          <button
            type="button"
            aria-pressed={board.language === 'en'}
            onClick={() => setLanguage('en')}
          >
            English
          </button>
          <button
            type="button"
            aria-pressed={board.language === 'id'}
            onClick={() => setLanguage('id')}
          >
            Indonesia
          </button>
        </div>
      </header>
      <main className="board-wrap">
        <BoardCanvas
          letters={board.letters}
          width={size.width}
          height={Math.max(120, size.height - toolbarHeight)}
        />
      </main>
    </div>
  )
}
