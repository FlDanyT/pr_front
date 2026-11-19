import { useEffect, useRef, useState, type PointerEvent } from 'react'

type View = { x: number; y: number; scale: number }
type Drag = { pointerId: number; x: number; y: number; viewX: number; viewY: number }

const GRID_STEP = 40
const MIN_SCALE = 0.25
const MAX_SCALE = 4

export default function App() {
  const boardRef = useRef<HTMLElement>(null)
  const dragRef = useRef<Drag | null>(null)
  const [view, setView] = useState<View>(() => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    scale: 1,
  }))
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const board = boardRef.current
    if (!board) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = board.getBoundingClientRect()
      const pointerX = event.clientX - rect.left
      const pointerY = event.clientY - rect.top

      setView(current => {
        const nextScale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, current.scale * Math.exp(-event.deltaY * 0.0015)),
        )
        const ratio = nextScale / current.scale

        return {
          scale: nextScale,
          x: pointerX - (pointerX - current.x) * ratio,
          y: pointerY - (pointerY - current.y) * ratio,
        }
      })
    }

    board.addEventListener('wheel', onWheel, { passive: false })
    return () => board.removeEventListener('wheel', onWheel)
  }, [])

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0 && event.button !== 1) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      viewX: view.x,
      viewY: view.y,
    }
    setIsDragging(true)
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setView(current => ({
      ...current,
      x: drag.viewX + event.clientX - drag.x,
      y: drag.viewY + event.clientY - drag.y,
    }))
  }

  const stopDragging = (event: PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    setIsDragging(false)
  }

  return (
    <main
      ref={boardRef}
      className={`board${isDragging ? ' board--dragging' : ''}`}
      aria-label="Рабочая область доски"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onLostPointerCapture={stopDragging}
      style={{
        backgroundPosition: `${view.x}px ${view.y}px`,
        backgroundSize: `${GRID_STEP * view.scale}px ${GRID_STEP * view.scale}px`,
      }}
    >
      <div
        className="board-object"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
      >
        <svg className="cube" viewBox="0 0 96 96" role="img" aria-label="Куб">
          <polygon points="48,7 88,28 48,49 8,28" fill="#81d0ca" />
          <polygon points="8,28 48,49 48,89 8,68" fill="#31a8a5" />
          <polygon points="48,49 88,28 88,68 48,89" fill="#157b7d" />
        </svg>
      </div>
    </main>
  )
}
