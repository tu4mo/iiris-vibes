# Unicorn

A small pixel-art game: walk your unicorn across a field to the castle, jumping over (or
onto) snails along the way. Inside the castle, jump for the dresses hanging on the walls
(the unicorn wears the last one it grabbed) and find the secret passage at the end. The
passage is a dark cave full of diamonds; its way out leads back to the field, and the game
starts over. Each level has its own looping chiptune, synthesized in the browser; the
speaker button turns it off. Click the unicorn in the top-left corner to open the editor
and redesign it; the game uses your drawing as the sprite.

Everything is drawn with DOM elements, no `<canvas>`.

## Development

```sh
npm install
npm run dev     # start the dev server
npm run build   # type-check and build to dist/
npm run lint    # oxlint
```

## Layout

- `src/audio` – the music: a text format for songs, the three level songs, and a small
  Web Audio synth that loops one at a time.
- `src/drawing` – the drawing model: layers, pixels, painting, storage. No React.
- `src/presets` – the built-in unicorn and its hair styles.
- `src/game` – shared game pieces: the `Field` model, sky bands, indoor walls, seeded noise,
  the castle, snail, dress and diamond shapes, pickups, and the sprite's animation frames.
- `src/game/levels` – one module per level (`meadow`, `castleHall`, `cave`), each exporting a `Level`;
  `LEVELS` in `index.ts` sets the order they're played in.
- `src/components` – the React UI: `Editor` and its toolbar, and `game/` for the game
  view (`Game` steps through the levels, `LevelRun` plays one, `usePlayLoop` runs the physics).
