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
import { Group, Layer, Line, Rect, Stage, Text } from 'react-konva'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import {
  addItem,
  alignSelectedStickers,
  createScribble,
  getItemDimensions,
  moveItem,
  moveItems,
  pointInPolygon,
  removeItems,
  setSelection,
  setTool,
  type InkStyle,
} from './board'
import { clearGlyphWidthCache } from './measure'
import type { Board, BoardItem, BoardPoint, InkBounds, Stroke } from './types'
import {
  boardAccent,
  brushes,
  inkSettleMs,
  maxBoardScale,
  minBoardScale,
  strokeWeights,
} from '../theme/tokens'

type BoardCanvasProps = {
  board: Board
  setBoard: Dispatch<SetStateAction<Board>>
  inkStyle: InkStyle
  width: number
  height: number
  onViewportChange: (viewport: Viewport) => void
  onPendingInkChange: (hasPendingInk: boolean) => void
}

export type BoardCanvasHandle = {
  clearInk: () => void
  resetZoom: () => void
  commitScribble: () => void
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
  `item-${Date.now()}-${Math.random().toString(16).slice(2)}`

const brushStrokeWidth = (style: InkStyle) =>
  strokeWeights[style.weight] * brushes[style.brush].widthScale

const selectedOutlinePadding = 4

type SelectionDrag = {
  anchorId: string
  ids: string[]
  positions: Map<string, BoardPoint>
}

export const BoardCanvas = forwardRef<BoardCanvasHandle, BoardCanvasProps>(
  function BoardCanvas(
    {
      board,
      setBoard,
      inkStyle,
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
  const pinchRef = useRef<{
    distance: number
    scale: number
    anchor: BoardPoint
  } | null>(null)
  const viewportRef = useRef(initialViewport)
  const drawingRef = useRef(false)
  const lassoRef = useRef<BoardPoint[]>([])
  const selectionDragRef = useRef<SelectionDrag | null>(null)
  const [viewport, setViewport] = useState(initialViewport)
  const [pendingStrokes, setPendingStrokes] = useState<Stroke[]>([])
  const [lasso, setLasso] = useState<BoardPoint[]>([])
  const [fontsLoaded, setFontsLoaded] = useState(false)

  const updateViewport = useCallback(
    (next: Viewport) => {
      viewportRef.current = next
      setViewport(next)
      onViewportChange(next)
    },
    [onViewportChange],
  )

  const updatePending = useCallback(
    (strokes: Stroke[]) => {
      pendingRef.current = strokes
      setPendingStrokes(strokes)
      onPendingInkChange(strokes.length > 0)
    },
    [onPendingInkChange],
  )

  const setLassoPoints = useCallback((points: BoardPoint[]) => {
    lassoRef.current = points
    setLasso(points)
  }, [])

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
    onPendingInkChange(false)
  }, [onPendingInkChange])

  const commitScribble = useCallback(() => {
    const strokes = pendingRef.current
    if (strokes.length === 0) return
    const bounds = getBounds(strokes)
    setBoard((current) =>
      addItem(current, createScribble(makeId(), strokes, bounds, inkStyle)),
    )
    clearInk()
  }, [clearInk, inkStyle, setBoard])

  const resetZoom = useCallback(() => {
    updateViewport(initialViewport)
  }, [updateViewport])

  useImperativeHandle(
    ref,
    () => ({ clearInk, resetZoom, commitScribble }),
    [clearInk, resetZoom, commitScribble],
  )

  useEffect(() => () => clearTimer(), [])

  /** A second finger always means navigate, so drop whatever the first one started. */
  const cancelActiveGesture = useCallback(() => {
    const stage = stageRef.current
    if (stage?.isDragging()) stage.stopDrag()
    if (drawingRef.current) {
      drawingRef.current = false
      clearTimer()
      updatePending(pendingRef.current.slice(0, -1))
    }
    if (lassoRef.current.length > 0) setLassoPoints([])
  }, [setLassoPoints, updatePending])

  /**
   * Pinch runs on native listeners rather than Konva events: Konva only reports a
   * touch when it lands on a node it tracks, and Safari otherwise steals the
   * gesture for page zoom, which made pinch fire only some of the time.
   */
  useEffect(() => {
    const container = stageRef.current?.container()
    if (!container) return

    const readPinch = (touches: TouchList) => {
      const box = container.getBoundingClientRect()
      const [first, second] = [touches[0], touches[1]]
      return {
        distance: Math.hypot(
          second.clientX - first.clientX,
          second.clientY - first.clientY,
        ),
        midpoint: {
          x: (first.clientX + second.clientX) / 2 - box.left,
          y: (first.clientY + second.clientY) / 2 - box.top,
        },
      }
    }

    const startPinch = (event: TouchEvent) => {
      if (event.touches.length !== 2) return
      event.preventDefault()
      cancelActiveGesture()
      const { distance, midpoint } = readPinch(event.touches)
      const { scale, x, y } = viewportRef.current
      pinchRef.current = {
        distance,
        scale,
        anchor: {
          x: (midpoint.x - x) / scale,
          y: (midpoint.y - y) / scale,
        },
      }
    }

    const movePinch = (event: TouchEvent) => {
      const pinch = pinchRef.current
      if (!pinch || event.touches.length !== 2) return
      event.preventDefault()
      const { distance, midpoint } = readPinch(event.touches)
      // Holding the starting board point under the moving midpoint pans and zooms at once.
      const scale = Math.min(
        maxBoardScale,
        Math.max(minBoardScale, pinch.scale * (distance / pinch.distance)),
      )
      updateViewport({
        scale,
        x: midpoint.x - pinch.anchor.x * scale,
        y: midpoint.y - pinch.anchor.y * scale,
      })
    }

    const endPinch = (event: TouchEvent) => {
      if (event.touches.length < 2) pinchRef.current = null
    }

    const blockSafariZoom = (event: Event) => event.preventDefault()

    container.addEventListener('touchstart', startPinch, { passive: false })
    container.addEventListener('touchmove', movePinch, { passive: false })
    container.addEventListener('touchend', endPinch)
    container.addEventListener('touchcancel', endPinch)
    container.addEventListener('gesturestart', blockSafariZoom)
    container.addEventListener('gesturechange', blockSafariZoom)

    return () => {
      container.removeEventListener('touchstart', startPinch)
      container.removeEventListener('touchmove', movePinch)
      container.removeEventListener('touchend', endPinch)
      container.removeEventListener('touchcancel', endPinch)
      container.removeEventListener('gesturestart', blockSafariZoom)
      container.removeEventListener('gesturechange', blockSafariZoom)
    }
  }, [cancelActiveGesture, updateViewport])

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
    if (pinchRef.current) return
    const point = boardPoint()
    if (!point) return

    if (board.tool === 'hand') {
      setBoard((current) => setSelection(current, []))
    } else if (board.tool === 'pencil') {
      clearTimer()
      updatePending([...pendingRef.current, [point]])
      drawingRef.current = true
    } else if (board.tool === 'lasso') {
      setLassoPoints([point])
    }
  }

  const movePointer = () => {
    if (pinchRef.current) return
    const point = boardPoint()
    if (!point) return
    if (board.tool === 'pencil' && drawingRef.current) {
      const next = [...pendingRef.current]
      next[next.length - 1] = [...next[next.length - 1], point]
      updatePending(next)
    } else if (board.tool === 'lasso' && lassoRef.current.length > 0) {
      setLassoPoints([...lassoRef.current, point])
    }
  }

  const endPointer = () => {
    if (board.tool === 'pencil' && drawingRef.current) {
      drawingRef.current = false
      clearTimer()
      timerRef.current = window.setTimeout(commitScribble, inkSettleMs)
    } else if (board.tool === 'lasso' && lasso.length > 2) {
      const selectedIds = board.items
        .filter((item) => {
          const dimensions = getItemDimensions(item)
          return pointInPolygon(
            {
              x: item.x + dimensions.width / 2,
              y: item.y + dimensions.height / 2,
            },
            lasso,
          )
        })
        .map(({ id }) => id)
      setBoard((current) =>
        alignSelectedStickers(setSelection(current, selectedIds)),
      )
    }
    if (board.tool === 'lasso') setLassoPoints([])
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

  const renderItem = (item: BoardItem) => {
    const dimensions = getItemDimensions(item)
    const selected = board.selectedIds.includes(item.id)
    const canListen = board.tool !== 'pencil' && board.tool !== 'lasso'
    const onItemPointerDown = (event: KonvaEventObject<PointerEvent>) => {
      event.cancelBubble = true
      if (board.tool === 'eraser') {
        const ids = selected ? board.selectedIds : [item.id]
        setBoard((current) => removeItems(current, ids))
        return
      }
      if (board.tool !== 'hand') {
        clearInk()
        setLassoPoints([])
      }
      setBoard((current) => {
        const next = setTool(current, 'hand')
        return selected ? next : setSelection(next, [item.id])
      })
    }
    const onItemDragStart = (event: KonvaEventObject<DragEvent>) => {
      event.cancelBubble = true
      const ids = selected ? board.selectedIds : [item.id]
      selectionDragRef.current = {
        anchorId: item.id,
        ids,
        positions: new Map(
          board.items
            .filter((boardItem) => ids.includes(boardItem.id))
            .map((boardItem) => [
              boardItem.id,
              { x: boardItem.x, y: boardItem.y },
            ]),
        ),
      }
    }
    const onItemDragMove = (event: KonvaEventObject<DragEvent>) => {
      event.cancelBubble = true
      const drag = selectionDragRef.current
      const anchorPosition = drag?.positions.get(drag.anchorId)
      if (!drag || !anchorPosition) {
        setBoard((current) =>
          moveItem(current, item.id, {
            x: event.target.x(),
            y: event.target.y(),
          }),
        )
        return
      }
      const delta = {
        x: event.target.x() - anchorPosition.x,
        y: event.target.y() - anchorPosition.y,
      }
      setBoard((current) =>
        moveItems(
          current,
          new Map(
            drag.ids.map((id) => {
              const start = drag.positions.get(id) ?? anchorPosition
              return [id, { x: start.x + delta.x, y: start.y + delta.y }]
            }),
          ),
        ),
      )
    }
    const onItemDragEnd = (event: KonvaEventObject<DragEvent>) => {
      onItemDragMove(event)
      selectionDragRef.current = null
    }

    return (
      <Fragment key={item.id}>
        {selected && (
          <Rect
            x={item.x - selectedOutlinePadding}
            y={item.y - selectedOutlinePadding}
            width={dimensions.width + selectedOutlinePadding * 2}
            height={dimensions.height + selectedOutlinePadding * 2}
            stroke={boardAccent}
            strokeWidth={3 / viewport.scale}
            dash={[8 / viewport.scale, 5 / viewport.scale]}
            listening={false}
          />
        )}
        {item.kind === 'letter' ? (
          <Text
            text={item.glyph}
            x={item.x}
            y={item.y}
            fontSize={dimensions.height}
            fontFamily={item.fontFamily}
            fill={item.fill}
            draggable={board.tool === 'hand'}
            listening={canListen}
            onPointerDown={onItemPointerDown}
            onDragStart={onItemDragStart}
            onDragMove={onItemDragMove}
            onDragEnd={onItemDragEnd}
          />
        ) : (
          <Group
            x={item.x}
            y={item.y}
            draggable={board.tool === 'hand'}
            listening={canListen}
            onPointerDown={onItemPointerDown}
            onDragStart={onItemDragStart}
            onDragMove={onItemDragMove}
            onDragEnd={onItemDragEnd}
          >
            {item.strokes.map((stroke, index) => {
              const brush = brushes[item.brush]
              const strokeWidth = brushStrokeWidth(item)
              return (
                <Line
                  key={`scribble-${item.id}-${index}`}
                  points={flattenPoints(stroke)}
                  stroke={item.fill}
                  opacity={brush.opacity}
                  strokeWidth={strokeWidth}
                  hitStrokeWidth={Math.max(strokeWidth, 24)}
                  lineCap={brush.lineCap}
                  lineJoin={brush.lineJoin}
                  tension={brush.tension}
                />
              )
            })}
          </Group>
        )}
      </Fragment>
    )
  }

  const pendingBrush = brushes[inkStyle.brush]
  const pendingStrokeWidth = brushStrokeWidth(inkStyle)

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
        draggable={board.tool !== 'pencil' && board.tool !== 'lasso'}
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
      >
        <Layer key={fontsLoaded ? 'board-fonts' : 'board-fallback'}>
          {board.items.map(renderItem)}
          {pendingStrokes.map((stroke, index) => (
            <Line
              key={`ink-${index}`}
              points={flattenPoints(stroke)}
              stroke={inkStyle.fill}
              opacity={pendingBrush.opacity}
              strokeWidth={pendingStrokeWidth}
              lineCap={pendingBrush.lineCap}
              lineJoin={pendingBrush.lineJoin}
              tension={pendingBrush.tension}
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
    </div>
  )
  },
)
