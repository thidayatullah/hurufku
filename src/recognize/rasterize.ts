import type { Stroke } from '../board/types'

const OUTPUT_SIZE = 28
const CANVAS_SIZE = 112
const DEFAULT_MARGIN = 0.2

type RasterizeConfig = {
  outputSize?: number
  marginRatio?: number
  invertInk?: boolean
  rotate90Clockwise?: boolean
  flipHorizontal?: boolean
}

type PixelBuffer = Float32Array<ArrayBufferLike>

type CanvasLike = HTMLCanvasElement | OffscreenCanvas

const makeCanvas = (size: number): CanvasLike => {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(size, size)
  }
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
}

const getContext = (canvas: CanvasLike): OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D => {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new Error('2D canvas is unavailable')
  }
  return context
}

const rotate90Clockwise = (pixels: PixelBuffer, size: number): PixelBuffer => {
  const next: PixelBuffer = new Float32Array(pixels.length)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const from = y * size + x
      const to = x * size + (size - 1 - y)
      next[to] = pixels[from]
    }
  }
  return next
}

const flipHorizontally = (pixels: PixelBuffer, size: number): PixelBuffer => {
  const next: PixelBuffer = new Float32Array(pixels.length)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const from = y * size + x
      const to = y * size + (size - 1 - x)
      next[to] = pixels[from]
    }
  }
  return next
}

const nonEmptyStrokes = (strokes: Stroke[]): Stroke[] =>
  strokes.filter((stroke) => stroke.length > 0)

export const rasterizeStrokes = (
  strokes: Stroke[],
  config: RasterizeConfig = {},
): PixelBuffer => {
  const outputSize = config.outputSize ?? OUTPUT_SIZE
  const marginRatio = config.marginRatio ?? DEFAULT_MARGIN
  const invertInk = config.invertInk ?? true
  const rotate = config.rotate90Clockwise ?? true
  const flipHorizontal = config.flipHorizontal ?? true

  const validStrokes = nonEmptyStrokes(strokes)
  if (validStrokes.length === 0) {
    return new Float32Array(outputSize * outputSize)
  }

  const points = validStrokes.flat()
  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxY = Math.max(...points.map((point) => point.y))

  const width = Math.max(1, maxX - minX)
  const height = Math.max(1, maxY - minY)
  const side = Math.max(width, height)
  const margin = side * marginRatio
  const sourceSide = side + margin * 2
  const drawScale = CANVAS_SIZE / sourceSide

  const sourceCanvas = makeCanvas(CANVAS_SIZE)
  const sourceContext = getContext(sourceCanvas)
  sourceContext.fillStyle = '#000'
  sourceContext.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  sourceContext.strokeStyle = '#fff'
  sourceContext.lineCap = 'round'
  sourceContext.lineJoin = 'round'
  sourceContext.lineWidth = Math.max(2, CANVAS_SIZE * 0.11 * drawScale)

  const offsetX = (sourceSide - width) / 2
  const offsetY = (sourceSide - height) / 2

  validStrokes.forEach((stroke) => {
    sourceContext.beginPath()
    stroke.forEach((point, index) => {
      const x = (point.x - minX + offsetX) * drawScale
      const y = (point.y - minY + offsetY) * drawScale
      if (index === 0) {
        sourceContext.moveTo(x, y)
      } else {
        sourceContext.lineTo(x, y)
      }
    })
    sourceContext.stroke()
  })

  const outputCanvas = makeCanvas(outputSize)
  const outputContext = getContext(outputCanvas)
  outputContext.drawImage(sourceCanvas as CanvasImageSource, 0, 0, outputSize, outputSize)
  const imageData = outputContext.getImageData(0, 0, outputSize, outputSize)

  const pixels: PixelBuffer = new Float32Array(outputSize * outputSize)
  for (let i = 0; i < pixels.length; i += 1) {
    const gray = imageData.data[i * 4] / 255
    pixels[i] = invertInk ? 1 - gray : gray
  }

  let normalized: PixelBuffer = pixels
  if (rotate) normalized = rotate90Clockwise(normalized, outputSize)
  if (flipHorizontal) normalized = flipHorizontally(normalized, outputSize)

  return normalized
}
