# Unicorn

A small pixel-art game: walk your unicorn across a field to the castle, jumping over (or
onto) snails along the way. Click the unicorn in the top-left corner to open the editor
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
- `src/game` – world generation (field, sky, castle, snails) and the sprite's animation frames.
- `src/components` – the React UI: `Editor` and its toolbar, and `game/` for the game view.
