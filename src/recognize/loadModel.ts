import { loadGraphModel, type GraphModel } from '@tensorflow/tfjs-converter'
import '@tensorflow/tfjs-backend-cpu'
import '@tensorflow/tfjs-backend-wasm'
import { ready, setBackend } from '@tensorflow/tfjs-core'

const MODEL_URL = '/models/emnist-letters/model.json'

let modelPromise: Promise<GraphModel> | null = null

const loadWithBackend = async (backend: 'wasm' | 'cpu'): Promise<GraphModel> => {
  await setBackend(backend)
  await ready()
  return loadGraphModel(MODEL_URL)
}

const loadModelOnce = async (): Promise<GraphModel> => {
  try {
    return await loadWithBackend('wasm')
  } catch {
    return loadWithBackend('cpu')
  }
}

export const loadLetterModel = async (): Promise<GraphModel> => {
  if (!modelPromise) {
    modelPromise = loadModelOnce()
  }
  return modelPromise
}

export const warmLetterModel = async (): Promise<void> => {
  await loadLetterModel()
}
