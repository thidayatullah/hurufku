import { useEffect } from 'react'
import { warmLetterModel } from './loadModel'

export const useLetterModel = () => {
  useEffect(() => {
    void warmLetterModel()
  }, [])
}
