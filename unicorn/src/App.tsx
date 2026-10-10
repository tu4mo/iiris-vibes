import { useCallback, useState } from 'react'
import { Editor } from './components/Editor'
import { Game } from './components/game/Game'
import { useDrawing } from './hooks/useDrawing'

// The game is the main view; the editor opens on top of it.
function App() {
  const drawing = useDrawing()
  const [editing, setEditing] = useState(false)
  const openEditor = useCallback(() => setEditing(true), [])

  return (
    <>
      <Game drawing={drawing.drawing} paused={editing} onEdit={openEditor} />
      <Editor {...drawing} open={editing} onClose={() => setEditing(false)} />
    </>
  )
}

export default App
