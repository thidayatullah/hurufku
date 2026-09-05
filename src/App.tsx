import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BoardCanvas,
  type BoardCanvasHandle,
  type Viewport,
} from './board/BoardCanvas'
import {
  defaultScribbleStyle,
  defaultStickerStyle,
  placeStickerFromGrid,
  selectableBoardFonts,
  selectableBrushes,
  selectableLetterFills,
  selectableStrokeWeights,
  setCapsLock,
  setLanguage,
  setSelectedBrush,
  setSelectedFill,
  setSelectedFont,
  setSelectedSize,
  setSelectedWeight,
  setTool,
  type InkStyle,
  type StickerStyle,
} from './board/board'
import { speakLetters } from './board/speak'
import { emptyBoard, type Language, type Tool } from './board/types'
import {
  letterFills,
  letterSizes,
  type BrushKind,
  type LetterFill,
  type LetterSize,
  type StrokeWeight,
} from './theme/tokens'

/** Icons are Material Symbols ligatures — the web stand-in for the SF Symbols in docs/DESIGN.md. */
const tools: { value: Tool; label: string; icon: string }[] = [
  { value: 'hand', label: 'Hand', icon: 'back_hand' },
  { value: 'pencil', label: 'Pencil', icon: 'stylus' },
  { value: 'eraser', label: 'Eraser', icon: 'ink_eraser' },
  { value: 'lasso', label: 'Lasso', icon: 'lasso_select' },
  { value: 'addSticker', label: 'Add Sticker', icon: 'text_fields' },
]

/** Keyboard-shaped rows, but kept in A–Z order rather than QWERTY. */
const keyboardRows = ['ABCDEFGHIJ', 'KLMNOPQRS', 'TUVWXYZ'].map((row) =>
  row.split(''),
)

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `letter-${Date.now()}-${Math.random().toString(16).slice(2)}`

const randomLetterFill = (): LetterFill =>
  letterFills[Math.floor(Math.random() * letterFills.length)]

export default function App() {
  const [board, setBoard] = useState(() => emptyBoard())
  const [stickerStyle, setStickerStyle] =
    useState<StickerStyle>(defaultStickerStyle)
  const [inkStyle, setInkStyle] = useState<InkStyle>(defaultScribbleStyle)
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


  const selectedItems = useMemo(
    () => board.items.filter((item) => board.selectedIds.includes(item.id)),
    [board.items, board.selectedIds],
  )
  const selectedLetters = selectedItems.filter((item) => item.kind === 'letter')
  const selectedItem = selectedItems.length === 1 ? selectedItems[0] : null
  const selectionHasScribble = selectedItems.some(
    (item) => item.kind === 'scribble',
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

  const chooseInkStyle = <Key extends keyof InkStyle>(
    key: Key,
    value: InkStyle[Key],
  ) => {
    setInkStyle((current) => ({ ...current, [key]: value }))
  }

  const chooseScribbleStyle = <Key extends keyof InkStyle>(
    key: Key,
    value: InkStyle[Key],
  ) => {
    setInkStyle((current) => ({ ...current, [key]: value }))
    setBoard((current) => {
      if (key === 'fill') {
        return setSelectedFill(current, value as InkStyle['fill'])
      }
      if (key === 'brush') {
        return setSelectedBrush(current, value as BrushKind)
      }
      return setSelectedWeight(current, value as StrokeWeight)
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
        { ...stickerStyle, fill: randomLetterFill() },
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
      <main className="board-wrap" ref={boardWrapRef}>
        <BoardCanvas
          ref={canvasRef}
          board={board}
          setBoard={setBoard}
          inkStyle={inkStyle}
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
          {selectedItems.length > 0 && (
            <>
              <span className="island-divider" aria-hidden="true" />
              <button
                type="button"
                className="icon-button icon-button-accent"
                aria-label={
                  selectionHasScribble ? 'Scribbles cannot be spoken' : 'Speak'
                }
                aria-disabled={selectionHasScribble}
                disabled={selectionHasScribble}
                onClick={() => speakLetters(selectedLetters, board.language)}
              >
                <span className="icon" aria-hidden="true">
                  record_voice_over
                </span>
              </button>
            </>
          )}
        </div>
        {board.tool === 'pencil' && (
          <section className="island brush-island" aria-label="Stroke style">
            <span className="panel-label">Color</span>
            {selectableLetterFills.map((fill, index) => (
              <button
                type="button"
                className="color-swatch"
                aria-label={`Stroke color ${index + 1}`}
                aria-pressed={inkStyle.fill === fill}
                style={{ backgroundColor: fill }}
                onClick={() => chooseInkStyle('fill', fill)}
                key={fill}
              />
            ))}
            <span className="panel-label">Stroke</span>
            {selectableBrushes.map((brush) => (
              <button
                type="button"
                className="btn inspector-chip"
                aria-pressed={inkStyle.brush === brush}
                onClick={() => chooseInkStyle('brush', brush)}
                key={brush}
              >
                {brush[0].toUpperCase() + brush.slice(1)}
              </button>
            ))}
            <span className="panel-label">Weight</span>
            {selectableStrokeWeights.map((weight) => (
              <button
                type="button"
                className="btn inspector-chip"
                aria-pressed={inkStyle.weight === weight}
                onClick={() => chooseInkStyle('weight', weight)}
                key={weight}
              >
                {weight}
              </button>
            ))}
          </section>
        )}
        {board.tool === 'addSticker' && (
          <section className="island letter-island" aria-label="Add a letter">
            {keyboardRows.map((row, rowIndex) => (
              <div className="letter-row" key={row[0]}>
                {rowIndex === 1 && (
                  <button
                    type="button"
                    className="icon-button caps-button"
                    aria-label={
                      board.capsLock
                        ? 'Capital letters'
                        : 'Small letters'
                    }
                    aria-pressed={board.capsLock}
                    onClick={() =>
                      setBoard((current) =>
                        setCapsLock(current, !current.capsLock),
                      )
                    }
                  >
                    <span className="icon" aria-hidden="true">
                      {board.capsLock ? 'uppercase' : 'lowercase'}
                    </span>
                  </button>
                )}
                {row.map((glyph) => (
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
            ))}
          </section>
        )}
        {selectedItem && board.tool === 'hand' && (
          <section
            className="island inspector-island"
            aria-label="Sticker style"
          >
            {selectedItem.kind === 'letter' ? (
              <>
                <span className="panel-label">Size</span>
                {(Object.keys(letterSizes) as LetterSize[]).map((sizeName) => (
                  <button
                    type="button"
                    className="btn inspector-chip"
                    aria-pressed={selectedItem.size === sizeName}
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
                    aria-pressed={selectedItem.fill === fill}
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
                    aria-pressed={selectedItem.fontFamily === fontFamily}
                    style={{ fontFamily }}
                    onClick={() => chooseStyle('fontFamily', fontFamily)}
                    key={fontFamily}
                  >
                    {fontFamily}
                  </button>
                ))}
              </>
            ) : (
              <>
                <span className="panel-label">Color</span>
                {selectableLetterFills.map((fill, index) => (
                  <button
                    type="button"
                    className="color-swatch"
                    aria-label={`Scribble color ${index + 1}`}
                    aria-pressed={selectedItem.fill === fill}
                    style={{ backgroundColor: fill }}
                    onClick={() => chooseScribbleStyle('fill', fill)}
                    key={fill}
                  />
                ))}
                <span className="panel-label">Stroke</span>
                {selectableBrushes.map((brush) => (
                  <button
                    type="button"
                    className="btn inspector-chip"
                    aria-pressed={selectedItem.brush === brush}
                    onClick={() => chooseScribbleStyle('brush', brush)}
                    key={brush}
                  >
                    {brush[0].toUpperCase() + brush.slice(1)}
                  </button>
                ))}
                <span className="panel-label">Weight</span>
                {selectableStrokeWeights.map((weight) => (
                  <button
                    type="button"
                    className="btn inspector-chip"
                    aria-pressed={selectedItem.weight === weight}
                    onClick={() => chooseScribbleStyle('weight', weight)}
                    key={weight}
                  >
                    {weight}
                  </button>
                ))}
              </>
            )}
          </section>
        )}
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
              aria-label="Make sticker"
              onClick={() => canvasRef.current?.commitScribble()}
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
