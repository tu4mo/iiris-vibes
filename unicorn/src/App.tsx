import { useState } from 'react'
import { Editor } from './components/Editor'
import { Game } from './components/game/Game'
import { useDrawing } from './hooks/useDrawing'

// The game is the main view; the editor opens on top of it.
function App() {
  const drawing = useDrawing()
  const [editing, setEditing] = useState(false)
  // The game only takes up the drawing once the editor closes, rather than rebuilding the
  // unicorn behind the editor on every stroke.
  const [gameDrawing, setGameDrawing] = useState(drawing.drawing)
  if (!editing && gameDrawing !== drawing.drawing) setGameDrawing(drawing.drawing)

  return (
    <>
      <Game drawing={gameDrawing} paused={editing} onEdit={() => setEditing(true)} />
      <Editor {...drawing} open={editing} onClose={() => setEditing(false)} />
    </>
  )
}

export default App
