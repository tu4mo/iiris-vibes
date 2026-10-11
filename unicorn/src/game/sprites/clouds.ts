import type { TailwindColor } from '../../drawing/colors'
import { pixelArt } from '../../drawing/pixelArt'
import type { Shape } from '../shape'

// The clouds in the meadow's sky, drawn by hand. Each is a heap of round puffs, lit from
// the top left: white, with shade on the lower right of each puff, and a flat bottom.
const COLORS: Record<string, TailwindColor> = {
  W: 'white',
  s: 'sky-100',
  b: 'sky-200',
  B: 'blue-200',
}
const colorOf = (char: string) => COLORS[char]

export const CLOUDS: Shape[] = [
  pixelArt(
    `
    ....WWWW....
    .WWWWWWWsW..
    WWWWWWWssWWs
    bbbbbbbbbbbb
    .BBBBBBBBBB.
    `,
    colorOf,
  ),
  pixelArt(
    `
    .......WWWW.......
    .....WWWWWWWs.....
    ..WWWWWWWWWWsWW...
    .WWWWWWWWWWssWWWs.
    WWWWWsWWWWsssWWWss
    bbbbbbbbbbbbbbbbbb
    .BBBBBBBBBBBBBBBB.
    `,
    colorOf,
  ),
  pixelArt(
    `
    ..........WWWWW...........
    ........WWWWWWWWs.........
    ...WWW..WWWWWWWWs.........
    .WWWWWWWWWWWWWWWsWWWW.....
    .WWWWWWWWWWWWWWssWWWWWW...
    WWWWWWsWWWWWWWsssWWWWWWWs.
    WWWWWssWWWWWWsssWWWWWWWWss
    bbbbbbbbbbbbbbbbbbbbbbbbbb
    .BBBBBBBBBBBBBBBBBBBBBBBB.
    `,
    colorOf,
  ),
  pixelArt(
    `
    .........WWWW.......WWW.........
    .......WWWWWWWs...WWWWWWs.......
    ..WWWWWWWWWWWWsWWWWWWWWWsWWW....
    .WWWWWWWWWWWWssWWWWWWWWssWWWWWs.
    WWWWWWsWWWWWsssWWWWWWWsssWWWWWss
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    .BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.
    `,
    colorOf,
  ),
  pixelArt(
    `
    ..............WWWWW.................
    ............WWWWWWWWW...............
    ...........WWWWWWWWWWs..............
    .....WWW...WWWWWWWWWWs.WWWW.........
    ...WWWWWWW.WWWWWWWWWWsWWWWWWW.......
    ..WWWWWWWWWWWWWWWWWWssWWWWWWWs......
    ..WWWWWWWWsWWWWWWWWsssWWWWWWWs.WWW..
    .WWWWWWWWWsWWWWWWWsssWWWWWWWssWWWWW.
    WWWWWWWWWssWWWWWWssssWWWWWWsssWWWWWs
    WWWWWWWWsssWWWWWsssssWWWWWsssWWWWWss
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    .BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.
    `,
    colorOf,
  ),
]
