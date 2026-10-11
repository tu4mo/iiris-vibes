# Unicorn

A small pixel-art game: walk your unicorn across a field to the castle, jumping over (or
onto) snails along the way. Inside the castle, jump for the dresses hanging on the walls
(the unicorn wears the last one it grabbed) and find the secret passage at the end. Click the unicorn in the top-left corner to open the editor
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

- `src/drawing` – the drawing model: layers, pixels, painting, storage. No React.
- `src/presets` – the built-in unicorn and its hair styles.
- `src/game` – shared game pieces: the `Field` model, sky bands, indoor walls, seeded noise,
  the castle, snail and dress shapes, and the sprite's animation frames.
- `src/game/levels` – one module per level (`meadow`, `castleHall`), each exporting a `Level`;
  `LEVELS` in `index.ts` sets the order they're played in.
- `src/components` – the React UI: `Editor` and its toolbar, and `game/` for the game
  view (`Game` steps through the levels, `LevelRun` plays one, `usePlayLoop` runs the physics).
