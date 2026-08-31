import { Layer, Stage, Text } from 'react-konva'
import type { Letter } from './types'

type BoardCanvasProps = {
  letters: Letter[]
  width: number
  height: number
}

export function BoardCanvas({ letters, width, height }: BoardCanvasProps) {
  return (
    <Stage width={width} height={height}>
      <Layer>
        {letters.map((letter) => (
          <Text
            key={letter.id}
            text={letter.glyph}
            x={letter.x}
            y={letter.y}
            width={letter.width}
            height={letter.height}
            fontSize={letter.height}
            fontFamily={letter.fontFamily}
            fill={letter.fill}
            draggable
          />
        ))}
      </Layer>
    </Stage>
  )
}
