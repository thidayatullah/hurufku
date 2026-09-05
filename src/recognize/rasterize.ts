import type { Stroke } from '../board/types'

export const MODEL_IMAGE_WIDTH = 256
export const MODEL_IMAGE_HEIGHT = 64

type PixelBuffer = Float32Array<ArrayBufferLike>
type CanvasLike = HTMLCanvasElement | OffscreenCanvas

const makeCanvas = (): CanvasLike => {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(MODEL_IMAGE_WIDTH, MODEL_IMAGE_HEIGHT)
  }
  const canvas = document.createElement('canvas')
  canvas.width = MODEL_IMAGE_WIDTH
  canvas.height = MODEL_IMAGE_HEIGHT
  return canvas
}

const getContext = (
  canvas: CanvasLike,
): OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D => {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('2D canvas is unavailable')
  return context
}

export const rasterizeStrokes = (strokes: Stroke[]): PixelBuffer => {
  const validStrokes = strokes.filter((stroke) => stroke.length > 0)
  const pixels: PixelBuffer = new Float32Array(
    MODEL_IMAGE_WIDTH * MODEL_IMAGE_HEIGHT,
  )
  if (validStrokes.length === 0) return pixels

  const points = validStrokes.flat()
  const minX = Math.min(...points.map(({ x }) => x))
  const maxX = Math.max(...points.map(({ x }) => x))
  const minY = Math.min(...points.map(({ y }) => y))
  const maxY = Math.max(...points.map(({ y }) => y))
  const inkWidth = Math.max(1, maxX - minX)
  const inkHeight = Math.max(1, maxY - minY)
  const horizontalMargin = 12
  const verticalMargin = 6
  const scale = Math.min(
    (MODEL_IMAGE_WIDTH - horizontalMargin * 2) / inkWidth,
    (MODEL_IMAGE_HEIGHT - verticalMargin * 2) / inkHeight,
  )
  const offsetX = (MODEL_IMAGE_WIDTH - inkWidth * scale) / 2
  const offsetY = (MODEL_IMAGE_HEIGHT - inkHeight * scale) / 2

  const canvas = makeCanvas()
  const context = getContext(canvas)
  context.fillStyle = '#fff'
  context.fillRect(0, 0, MODEL_IMAGE_WIDTH, MODEL_IMAGE_HEIGHT)
  context.strokeStyle = '#000'
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.lineWidth = Math.max(2, Math.min(7, 8 * scale))

  validStrokes.forEach((stroke) => {
    context.beginPath()
    stroke.forEach((point, index) => {
      const x = (point.x - minX) * scale + offsetX
      const y = (point.y - minY) * scale + offsetY
      if (index === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    })
    context.stroke()
  })

  const imageData = context.getImageData(
    0,
    0,
    MODEL_IMAGE_WIDTH,
    MODEL_IMAGE_HEIGHT,
  )
  for (let y = 0; y < MODEL_IMAGE_HEIGHT; y += 1) {
    for (let x = 0; x < MODEL_IMAGE_WIDTH; x += 1) {
      const sourceIndex = (y * MODEL_IMAGE_WIDTH + x) * 4
      pixels[x * MODEL_IMAGE_HEIGHT + y] = imageData.data[sourceIndex] / 255
    }
  }

  return pixels
}
