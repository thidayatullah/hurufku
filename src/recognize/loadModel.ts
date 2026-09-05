import '@tensorflow/tfjs-backend-cpu'
import '@tensorflow/tfjs-backend-wasm'
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm'
import { ready, setBackend } from '@tensorflow/tfjs-core'
import { loadLayersModel, type LayersModel } from '@tensorflow/tfjs-layers'
import wasmSimdUrl from '@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-simd.wasm?url'
import wasmThreadedSimdUrl from '@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-threaded-simd.wasm?url'
import wasmUrl from '@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm.wasm?url'

const MODEL_URL = '/models/handwritten-to-text/model.json'

let modelPromise: Promise<LayersModel> | null = null

setWasmPaths({
  'tfjs-backend-wasm.wasm': wasmUrl,
  'tfjs-backend-wasm-simd.wasm': wasmSimdUrl,
  'tfjs-backend-wasm-threaded-simd.wasm': wasmThreadedSimdUrl,
})

const loadWithBackend = async (
  backend: 'wasm' | 'cpu',
): Promise<LayersModel> => {
  await setBackend(backend)
  await ready()
  return loadLayersModel(MODEL_URL)
}

const loadModelOnce = async (): Promise<LayersModel> => {
  try {
    return await loadWithBackend('wasm')
  } catch {
    return loadWithBackend('cpu')
  }
}

export const loadLetterModel = async (): Promise<LayersModel> => {
  if (!modelPromise) {
    modelPromise = loadModelOnce()
  }
  return modelPromise
}

export const warmLetterModel = async (): Promise<void> => {
  await loadLetterModel()
}
