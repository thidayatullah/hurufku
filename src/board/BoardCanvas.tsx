import {
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { Layer, Line, Rect, Stage, Text } from 'react-konva'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import {
  alignSelectedStickers,
  getLetterDimensions,
  moveSticker,
  pointInPolygon,
  replacePendingInkWithSticker,
  setSelection,
  setTool,
  type StickerStyle,
} from './board'
import { clearGlyphWidthCache } from './measure'
import { recognize } from './recognize'
import type { Board, BoardPoint, InkBounds, Stroke } from './types'
import {
  boardAccent,
  boardInk,
  maxBoardScale,
  minBoardScale,
  recognitionConfidenceThreshold,
  recognitionPauseMs,
} from '../theme/tokens'

type BoardCanvasProps = {
  board: Board
  setBoard: Dispatch<SetStateAction<Board>>
  stickerStyle: StickerStyle
  width: number
  height: number
  onViewportChange: (viewport: Viewport) => void
  onPendingInkChange: (hasPendingInk: boolean) => void
}

export type BoardCanvasHandle = {
  clearInk: () => void
  resetZoom: () => void
  transformInk: () => void
}

export type Viewport = {
  scale: number
  x: number
  y: number
}

const initialViewport: Viewport = { scale: 1, x: 0, y: 0 }

const flattenPoints = (points: BoardPoint[]) =>
  points.flatMap(({ x, y }) => [x, y])

const getBounds = (strokes: Stroke[]): InkBounds => {
  const points = strokes.flat()
  const xs = points.map(({ x }) => x)
  const ys = points.map(({ y }) => y)
  const padding = 8
  const x = Math.min(...xs) - padding
  const y = Math.min(...ys) - padding
  return {
    x,
    y,
    width: Math.max(32, Math.max(...xs) - x + padding),
    height: Math.max(48, Math.max(...ys) - y + padding),
  }
}

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `letter-${Date.now()}-${Math.random().toString(16).slice(2)}`

export const BoardCanvas = forwardRef<BoardCanvasHandle, BoardCanvasProps>(
  function BoardCanvas(
    {
      board,
      setBoard,
      stickerStyle,
      width,
      height,
      onViewportChange,
      onPendingInkChange,
    },
    ref,
  ) {
  const stageRef = useRef<Konva.Stage>(null)
  const timerRef = useRef<number | null>(null)
  const pendingRef = useRef<Stroke[]>([])
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null)
  const [viewport, setViewport] = useState(initialViewport)
  const [pendingStrokes, setPendingStrokes] = useState<Stroke[]>([])
  const [drawing, setDrawing] = useState(false)
  const [lasso, setLasso] = useState<BoardPoint[]>([])
  const [picker, setPicker] = useState<{
    alternatives: string[]
    bounds: InkBounds
  } | null>(null)
  const [fontsLoaded, setFontsLoaded] = useState(false)

  const updateViewport = useCallback(
    (next: Viewport) => {
      setViewport(next)
      onViewportChange(next)
    },
    [onViewportChange],
  )

  const updatePending = (strokes: Stroke[]) => {
    pendingRef.current = strokes
    setPendingStrokes(strokes)
    onPendingInkChange(strokes.length > 0)
  }

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const clearInk = useCallback(() => {
    clearTimer()
    pendingRef.current = []
    setPendingStrokes([])
    setPicker(null)
    onPendingInkChange(false)
  }, [onPendingInkChange])

  const commitGlyph = useCallback(
    (glyph: string, bounds: InkBounds) => {
      setBoard((current) =>
        replacePendingInkWithSticker(
          current,
          makeId(),
          glyph,
          bounds,
          stickerStyle,
        ),
      )
      clearInk()
    },
    [clearInk, setBoard, stickerStyle],
  )

  const transformInk = useCallback(() => {
    const strokes = pendingRef.current
    if (strokes.length === 0) return
    const bounds = getBounds(strokes)
    const result = recognize(strokes)
    if (result.confidence >= recognitionConfidenceThreshold) {
      commitGlyph(result.glyph, bounds)
      return
    }
    setPicker({ alternatives: result.alternatives, bounds })
  }, [commitGlyph])

  const resetZoom = useCallback(() => {
    updateViewport(initialViewport)
  }, [updateViewport])

  useImperativeHandle(
    ref,
    () => ({ clearInk, resetZoom, transformInk }),
    [clearInk, resetZoom, transformInk],
  )

  useEffect(() => () => clearTimer(), [])

  useEffect(() => {
    let active = true
    document.fonts.ready.then(() => {
      if (!active) return
      clearGlyphWidthCache()
      setFontsLoaded(true)
    })
    return () => {
      active = false
    }
  }, [])

  const boardPoint = (): BoardPoint | null => {
    const pointer = stageRef.current?.getPointerPosition()
    if (!pointer) return null
    return {
      x: (pointer.x - viewport.x) / viewport.scale,
      y: (pointer.y - viewport.y) / viewport.scale,
    }
  }

  const startPointer = (event: KonvaEventObject<PointerEvent>) => {
    if (event.target !== event.target.getStage()) return
    const point = boardPoint()
    if (!point) return

    if (board.tool === 'hand') {
      setBoard((current) => setSelection(current, []))
    } else if (board.tool === 'pencil') {
      clearTimer()
      if (picker) {
        updatePending([[point]])
        setPicker(null)
      } else {
        updatePending([...pendingRef.current, [point]])
      }
      setDrawing(true)
    } else if (board.tool === 'lasso') {
      setLasso([point])
    }
  }

  const movePointer = () => {
    const point = boardPoint()
    if (!point) return
    if (board.tool === 'pencil' && drawing) {
      const next = [...pendingRef.current]
      next[next.length - 1] = [...next[next.length - 1], point]
      updatePending(next)
    } else if (board.tool === 'lasso' && lasso.length > 0) {
      setLasso((current) => [...current, point])
    }
  }

  const endPointer = () => {
    if (board.tool === 'pencil' && drawing) {
      setDrawing(false)
      clearTimer()
      timerRef.current = window.setTimeout(transformInk, recognitionPauseMs)
    } else if (board.tool === 'lasso' && lasso.length > 2) {
      const selectedIds = board.letters
        .filter((letter) => {
          const dimensions = getLetterDimensions(letter)
          return pointInPolygon(
            {
              x: letter.x + dimensions.width / 2,
              y: letter.y + dimensions.height / 2,
            },
            lasso,
          )
        })
        .map(({ id }) => id)
      setBoard((current) =>
        alignSelectedStickers(setSelection(current, selectedIds)),
      )
    }
    if (board.tool === 'lasso') setLasso([])
  }

  const onWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault()
    const pointer = stageRef.current?.getPointerPosition()
    if (!pointer) return
    const direction = event.evt.deltaY > 0 ? -1 : 1
    const scale = Math.min(
      maxBoardScale,
      Math.max(minBoardScale, viewport.scale * (direction > 0 ? 1.08 : 1 / 1.08)),
    )
    const boardX = (pointer.x - viewport.x) / viewport.scale
    const boardY = (pointer.y - viewport.y) / viewport.scale
    updateViewport({
      scale,
      x: pointer.x - boardX * scale,
      y: pointer.y - boardY * scale,
    })
  }

  const onTouchMove = (event: KonvaEventObject<TouchEvent>) => {
    if (event.evt.touches.length !== 2) return
    event.evt.preventDefault()
    const [first, second] = Array.from(event.evt.touches)
    const distance = Math.hypot(
      second.clientX - first.clientX,
      second.clientY - first.clientY,
    )
    const stageBox = stageRef.current?.container().getBoundingClientRect()
    if (!stageBox) return
    if (!pinchRef.current) {
      pinchRef.current = { distance, scale: viewport.scale }
      return
    }
    const midpoint = {
      x: (first.clientX + second.clientX) / 2 - stageBox.left,
      y: (first.clientY + second.clientY) / 2 - stageBox.top,
    }
    const scale = Math.min(
      maxBoardScale,
      Math.max(
        minBoardScale,
        pinchRef.current.scale * (distance / pinchRef.current.distance),
      ),
    )
    const boardX = (midpoint.x - viewport.x) / viewport.scale
    const boardY = (midpoint.y - viewport.y) / viewport.scale
    updateViewport({
      scale,
      x: midpoint.x - boardX * scale,
      y: midpoint.y - boardY * scale,
    })
  }

  const pickerStyle = picker
    ? {
        left: picker.bounds.x * viewport.scale + viewport.x,
        top:
          (picker.bounds.y + picker.bounds.height) * viewport.scale +
          viewport.y +
          8,
      }
    : undefined

  return (
    <div className="canvas-shell" style={{ width, height }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        draggable={board.tool === 'hand'}
        onDragEnd={(event) => {
          if (event.target === event.target.getStage()) {
            updateViewport({
              ...viewport,
              x: event.target.x(),
              y: event.target.y(),
            })
          }
        }}
        onPointerDown={startPointer}
        onPointerMove={movePointer}
        onPointerUp={endPointer}
        onPointerLeave={endPointer}
        onWheel={onWheel}
        onTouchMove={onTouchMove}
        onTouchEnd={() => {
          pinchRef.current = null
        }}
      >
        <Layer key={fontsLoaded ? 'board-fonts' : 'board-fallback'}>
          {board.letters.map((letter) => {
            const dimensions = getLetterDimensions(letter)
            const selected = board.selectedIds.includes(letter.id)
            return (
              <Fragment key={letter.id}>
                {selected && (
                  <Rect
                    x={letter.x - 4}
                    y={letter.y - 4}
                    width={dimensions.width + 8}
                    height={dimensions.height + 8}
                    stroke={boardAccent}
                    strokeWidth={3 / viewport.scale}
                    dash={[8 / viewport.scale, 5 / viewport.scale]}
                    listening={false}
                  />
                )}
                <Text
                  text={letter.glyph}
                  x={letter.x}
                  y={letter.y}
                  fontSize={dimensions.height}
                  fontFamily={letter.fontFamily}
                  fill={letter.fill}
                  draggable
                  onPointerDown={(event) => {
                    event.cancelBubble = true
                    if (board.tool !== 'hand') {
                      clearInk()
                      setLasso([])
                    }
                    setBoard((current) =>
                      setSelection(setTool(current, 'hand'), [letter.id]),
                    )
                  }}
                  onDragMove={(event) => {
                    event.cancelBubble = true
                    setBoard((current) =>
                      moveSticker(current, letter.id, {
                        x: event.target.x(),
                        y: event.target.y(),
                      }),
                    )
                  }}
                />
              </Fragment>
            )
          })}
          {pendingStrokes.map((stroke, index) => (
            <Line
              key={`ink-${index}`}
              points={flattenPoints(stroke)}
              stroke={boardInk}
              strokeWidth={8 / viewport.scale}
              lineCap="round"
              lineJoin="round"
              tension={0.2}
              listening={false}
            />
          ))}
          {lasso.length > 0 && (
            <Line
              points={flattenPoints(lasso)}
              stroke={boardAccent}
              strokeWidth={3 / viewport.scale}
              dash={[8 / viewport.scale, 5 / viewport.scale]}
              closed={lasso.length > 2}
              listening={false}
            />
          )}
        </Layer>
      </Stage>
      {picker && (
        <div className="glyph-picker ink-picker" style={pickerStyle}>
          <span className="picker-label">Choose a letter</span>
          {picker.alternatives.map((glyph) => (
            <button
              type="button"
              className="btn glyph-tile"
              key={glyph}
              onClick={() => commitGlyph(glyph, picker.bounds)}
            >
              {glyph}
            </button>
          ))}
        </div>
      )}
    </div>
  )
  },
)
