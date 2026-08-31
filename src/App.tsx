import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BoardCanvas,
  type BoardCanvasHandle,
  type Viewport,
} from './board/BoardCanvas'
import {
  defaultStickerStyle,
  placeStickerFromGrid,
  selectableBoardFonts,
  selectableLetterFills,
  setCapsLock,
  setLanguage,
  setSelectedFill,
  setSelectedFont,
  setSelectedSize,
  setTool,
  type StickerStyle,
} from './board/board'
import { speakLetters } from './board/speak'
import { emptyBoard, type Language, type Tool } from './board/types'
import { letterSizes, type LetterSize } from './theme/tokens'

/** Icons are Material Symbols ligatures — the web stand-in for the SF Symbols in docs/DESIGN.md. */
const tools: { value: Tool; label: string; icon: string }[] = [
  { value: 'hand', label: 'Hand', icon: 'back_hand' },
  { value: 'pencil', label: 'Pencil', icon: 'stylus' },
  { value: 'eraser', label: 'Eraser', icon: 'ink_eraser' },
  { value: 'lasso', label: 'Lasso', icon: 'lasso_select' },
  { value: 'addSticker', label: 'Add Sticker', icon: 'text_fields' },
]

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `letter-${Date.now()}-${Math.random().toString(16).slice(2)}`

export default function App() {
  const [board, setBoard] = useState(() => emptyBoard())
  const [stickerStyle, setStickerStyle] =
    useState<StickerStyle>(defaultStickerStyle)
  const [viewport, setViewport] = useState<Viewport>({
    scale: 1,
    x: 0,
    y: 0,
  })
  const boardWrapRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<BoardCanvasHandle>(null)
  const [size, setSize] = useState({ width: 320, height: 320 })
  const [hasPendingInk, setHasPendingInk] = useState(false)

  useEffect(() => {
    const element = boardWrapRef.current
    if (!element) return
    const updateSize = () => {
      setSize({
        width: element.clientWidth,
        height: element.clientHeight,
      })
    }
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    updateSize()
    return () => observer.disconnect()
  }, [])


  const selectedLetters = useMemo(
    () =>
      board.letters.filter((letter) => board.selectedIds.includes(letter.id)),
    [board.letters, board.selectedIds],
  )

  const chooseLanguage = (language: Language) => {
    setBoard((current) => setLanguage(current, language))
  }

  const chooseStyle = <Key extends keyof StickerStyle>(
    key: Key,
    value: StickerStyle[Key],
  ) => {
    setStickerStyle((current) => ({ ...current, [key]: value }))
    setBoard((current) => {
      if (key === 'size') {
        return setSelectedSize(current, value as LetterSize)
      }
      if (key === 'fill') {
        return setSelectedFill(current, value as StickerStyle['fill'])
      }
      return setSelectedFont(current, value as StickerStyle['fontFamily'])
    })
  }

  const addGridSticker = (glyph: string) => {
    const visible = {
      left: -viewport.x / viewport.scale,
      top: -viewport.y / viewport.scale,
      right: (size.width - viewport.x) / viewport.scale,
      bottom: (size.height - viewport.y) / viewport.scale,
    }
    setBoard((current) =>
      placeStickerFromGrid(
        current,
        makeId(),
        current.capsLock ? glyph : glyph.toLowerCase(),
        visible,
        stickerStyle,
      ),
    )
  }

  const handleViewportChange = useCallback((next: Viewport) => {
    setViewport(next)
  }, [])

  const isZoomed = viewport.scale !== 1 || viewport.x !== 0 || viewport.y !== 0
  const zoomPercent = Math.round(viewport.scale * 100)

  return (
    <div className="app">
      <header className="toolbar">
        <h1 className="brand">HurufPad</h1>
        <div
          className="language-group"
          role="group"
          aria-label="Spoken language"
        >
          <button
            type="button"
            className="btn"
            aria-pressed={board.language === 'id'}
            onClick={() => chooseLanguage('id')}
          >
            <span aria-hidden="true">🇮🇩</span> Indonesia
          </button>
          <button
            type="button"
            className="btn"
            aria-pressed={board.language === 'en'}
            onClick={() => chooseLanguage('en')}
          >
            <span aria-hidden="true">🇬🇧</span> English
          </button>
        </div>
      </header>
      {selectedLetters.length === 1 && board.tool === 'hand' && (
        <section className="inspector" aria-label="Sticker style">
          <span className="panel-label">Size</span>
          {(Object.keys(letterSizes) as LetterSize[]).map((sizeName) => (
            <button
              type="button"
              className="btn inspector-chip"
              aria-pressed={selectedLetters[0].size === sizeName}
              onClick={() => chooseStyle('size', sizeName)}
              key={sizeName}
            >
              {sizeName}
            </button>
          ))}
          <span className="panel-label">Color</span>
          {selectableLetterFills.map((fill, index) => (
            <button
              type="button"
              className="color-swatch"
              aria-label={`Letter color ${index + 1}`}
              aria-pressed={selectedLetters[0].fill === fill}
              style={{ backgroundColor: fill }}
              onClick={() => chooseStyle('fill', fill)}
              key={fill}
            />
          ))}
          <span className="panel-label">Font</span>
          {selectableBoardFonts.map((fontFamily) => (
            <button
              type="button"
              className="btn inspector-chip"
              aria-pressed={selectedLetters[0].fontFamily === fontFamily}
              style={{ fontFamily }}
              onClick={() => chooseStyle('fontFamily', fontFamily)}
              key={fontFamily}
            >
              {fontFamily}
            </button>
          ))}
        </section>
      )}
      {board.tool === 'addSticker' && (
        <section className="letter-panel" aria-label="Add a letter">
          <button
            type="button"
            className="icon-button caps-button"
            aria-label="Caps lock"
            aria-pressed={board.capsLock}
            onClick={() =>
              setBoard((current) => setCapsLock(current, !current.capsLock))
            }
          >
            <span
              className={board.capsLock ? 'icon icon-filled' : 'icon'}
              aria-hidden="true"
            >
              keyboard_capslock
            </span>
          </button>
          <div className="letter-grid">
            {alphabet.map((glyph) => (
              <button
                type="button"
                className="btn glyph-tile"
                onClick={() => addGridSticker(glyph)}
                key={glyph}
              >
                {board.capsLock ? glyph : glyph.toLowerCase()}
              </button>
            ))}
          </div>
        </section>
      )}
      <main className="board-wrap" ref={boardWrapRef}>
        <BoardCanvas
          ref={canvasRef}
          board={board}
          setBoard={setBoard}
          stickerStyle={stickerStyle}
          width={size.width}
          height={size.height}
          onViewportChange={handleViewportChange}
          onPendingInkChange={setHasPendingInk}
        />
        <div className="island tool-island" role="group" aria-label="Board tools">
          {tools.map((tool) => (
            <button
              type="button"
              className="icon-button"
              aria-pressed={board.tool === tool.value}
              aria-label={tool.label}
              onClick={() => {
                if (tool.value !== 'pencil') canvasRef.current?.clearInk()
                setBoard((current) => setTool(current, tool.value))
              }}
              key={tool.value}
            >
              <span className="icon" aria-hidden="true">
                {tool.icon}
              </span>
            </button>
          ))}
          {selectedLetters.length > 0 && (
            <>
              <span className="island-divider" aria-hidden="true" />
              <button
                type="button"
                className="icon-button icon-button-accent"
                aria-label="Speak"
                onClick={() => speakLetters(selectedLetters, board.language)}
              >
                <span className="icon" aria-hidden="true">
                  record_voice_over
                </span>
              </button>
            </>
          )}
        </div>
        <div className="island zoom-island">
          <span className="zoom-level">{zoomPercent}%</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Reset zoom"
            disabled={!isZoomed}
            onClick={() => canvasRef.current?.resetZoom()}
          >
            <span className="icon" aria-hidden="true">
              zoom_out_map
            </span>
          </button>
        </div>
        {hasPendingInk && (
          <div className="island action-island">
            <button
              type="button"
              className="icon-button"
              aria-label="I’m done"
              onClick={() => canvasRef.current?.transformInk()}
            >
              <span className="icon" aria-hidden="true">
                wand_stars
              </span>
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
