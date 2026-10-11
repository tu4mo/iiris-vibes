import type { TailwindColor } from '../../drawing/colors'
import { pixelArt } from '../../drawing/pixelArt'
import type { Shape } from '../shape'

// A pixel-art castle at the end of the meadow: two side towers and a center tower rising
// from a crenellated keep, each with its own pastel bricks and mortar, a striped cone
// roof and a flag. Glowing windows, and a dark arched doorway (d) with a two-cell golden
// arch around it (a, A), which the unicorn walks into.
const COLORS: Record<string, TailwindColor> = {
  k: 'indigo-950',
  d: 'indigo-950',
  // Side towers: bricks and mortar.
  v: 'violet-100',
  w: 'violet-200',
  x: 'violet-300',
  // The top of the center tower.
  s: 'sky-100',
  t: 'sky-200',
  u: 'sky-300',
  // The keep.
  p: 'pink-100',
  q: 'pink-200',
  m: 'pink-300',
  // Roofs, in two stripes each.
  R: 'rose-400',
  P: 'pink-500',
  S: 'sky-400',
  T: 'sky-500',
  V: 'violet-400',
  W: 'violet-500',
  // Flags on slate poles, windows and the golden arch.
  g: 'green-400',
  l: 'slate-500',
  a: 'amber-300',
  A: 'amber-400',
}

export const CASTLE: Shape = pixelArt(
  `
  ...........................................kkkkkk.....................................
  ..........................................klaaaaak....................................
  ..........................................klaaaaak....................................
  ..........................................klaaaaak....................................
  ........kkkkkk............................klkkkkk.............................kkkkkk..
  .......klgggggk...........................klk................................klRRRRRk.
  .......klgggggk..........................kWlk................................klRRRRRk.
  .......klgggggk..........................kWWk................................klRRRRRk.
  .......klkkkkk..........................kVVVVk...............................klkkkkk..
  .......klk.............................kVVVVVVk..............................klk......
  ......kPlk............................kWWWWWWWWk............................kTlk......
  ......kPPk...........................kWWWWWWWWWWk...........................kTTk......
  .....kRRRRk..........................kVVVVVVVVVVk..........................kSSSSk.....
  ....kRRRRRRk........................kVVVVVVVVVVVVk........................kSSSSSSk....
  ....kPPPPPPk.......................kWWWWWWWWWWWWWWk.......................kTTTTTTk....
  ...kPPPPPPPPk.....................kWWWWWWWWWWWWWWWWk.....................kTTTTTTTTk...
  ..kRRRRRRRRRRk....................kVVVVVVVVVVVVVVVVk....................kSSSSSSSSSSk..
  ..kRRRRRRRRRRk...................kVVVVVVVVVVVVVVVVVVk...................kSSSSSSSSSSk..
  .kPPPPPPPPPPPPk...................kuuuuuuuuuuuuuuuuk...................kTTTTTTTTTTTTk.
  kPPPPPPPPPPPPPPk..................ktssssusssstsusstk..................kTTTTTTTTTTTTTTk
  kRRRRRRRRRRRRRRk..................ksssstussstssustsk..................kSSSSSSSSSSSSSSk
  kRRRRRRRRRRRRRRRk.................kssstsusstsssutssk.................kSSSSSSSSSSSSSSSk
  kxxxxxxxxxxxxxxk..................kuuuuuuuuuuuuuuuuk..................kxxxxxxxxxxxxxxk
  kxvvvvwvxvvwvvvk..................ksusssstsusstsssuk..................kxvvvvwvxvvwvvvk
  kxvvvwvvxvwvvvvk..................ktusssaaaaaassssuk..................kxvvvwvvxvwvvvvk
  kxvvwvvvxwvvvvwk..................ksusstaaaaaassstuk..................kxvvwvvvxwvvvvwk
  kxxxxxxxxxxxxxxk..................kuuuuuaaaaaauuuuuk..................kxxxxxxxxxxxxxxk
  kvwvvxvwvvvvxvvk..................ksstssaaaaaasusssk..................kvwvvxvwvvvvxvvk
  kwvvvxwvvvvwxvvk..................kstsssaaaaaatusssk..................kwvvvxwvvvvwxvvk
  kvvvvxvvvvwvxvvk..................ktssssaaaaaasusstk..................kvvvvxvvvvwvxvvk
  kxxxxxxxxxxxxxxkkkk...kkkk...kkkk.kuuuuuuuuuuuuuuuukkk...kkkk...kkkk..kxxxxxxxxxxxxxxk
  kxvwvvvvxvvvvwvmppqk.kmqppk.kmpppkksustssssusssstsuppqk.kmqppk.kmpppk.kxvwvvvvxvvvvwvk
  kxwvvvvwxvvvwvvmpqpk.kmpppk.kmppqkksutsssstussstssupqpk.kmpppk.kmppqk.kxwvvvvwxvvvwvvk
  kxvvvvwvxvvwvvvmqppkkkmpppkkkmpqpkksusssstsusstsssuqppkkkmpppkkkmpqpkkkxvvvvwvxvvwvvvk
  kxxxxxaaaaxxxxxmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmxxxxxaaaaxxxxxk
  kvvvwxaaaavvxvwppppmppppqpmppqpppmqppppqmpppqppmpqppppmppppqpmppqpppmqpvvvwxaaaavvxvwk
  kvvwvxaaaavvxwvpppqmpppqppmpqppppmppppqpmppqpppmqppppqmpppqppmpqppppmppvvwvxaaaavvxwvk
  kvwvvxaaaavvxvvppqpmppqpppmqppppqmpppqppmpqppppmppppqpmppqpppmqppppqmppvwvvxaaaavvxvvk
  kxxxxxaaaaxxxxxmmmmmmmmmmmmmmmmmmmmAaddddddddddddaAmmmmmmmmmmmmmmmmmmmmxxxxxaaaaxxxxxk
  kxvvvwaaaawvvvvmppppqpmppqpppmqpAaddddddddddddddddddaApqpmppqpppmqppppqxvvvwaaaawvvvvk
  kxvvwvvvxwvvvvwmpppqppmpqppppAaddddddddddddddddddddddddaAmpqppppmppppqpxvvwvvvxwvvvvwk
  kxvwvvvvxvvvvwvmppqpppmqppppAaddddddddddddddddddddddddddaAqppppqmpppqppxvwvvvvxvvvvwvk
  kxxxxxxxxxxxxxxmmmmmmmmmmmmAaddddddddddddddddddddddddddddaAmmmmmmmmmmmmxxxxxxxxxxxxxxk
  kwvvvxwvvvvwxvvpqppmpqppppAaddddddddddddddddddddddddddddddaApmppppqpmppwvvvxwvvvvwxvvk
  kvvvvxvvvvwvxvvqpppmqppppAaddddddddddddddddddddddddddddddddaAmpppqppmpqvvvvxvvvvwvxvvk
  kvvvwxvvvwvvxvwppppmppppqAaddddddddddddddddddddddddddddddddaAmppqpppmqpvvvwxvvvwvvxvwk
  kxxxxxxxxxxxxxxmmmmmmmmmmAaddddddddddddddddddddddddddddddddaAmmmmmmmmmmxxxxxxxxxxxxxxk
  kxwvvvvwxvvvwvvmpqppppmppAaddddddddddddddddddddddddddddddddaApqpmppqpppxwvvvvwxvvvwvvk
  kxvvvvwvxvvwvvvmqppppqmppAaddddddddddddddddddddddddddddddddaAqppmpqppppxvvvvwvxvvwvvvk
  kxvvvwvvxvwvvvvmppppqpmppAaddddddddddddddddddddddddddddddddaApppmqppppqxvvvwvvxvwvvvvk
  kxxxxxxxxxxxxxxmmmmmmmmmmAaddddddddddddddddddddddddddddddddaAmmmmmmmmmmxxxxxxxxxxxxxxk
  kvvwvxvvwvvvxwvpppqmpppqpAaddddddddddddddddddddddddddddddddaAmpqppppmppvvwvxvvwvvvxwvk
  kvwvvxaaaavvxvvppqpmppqppAaddddddddddddddddddddddddddddddddaAmqppppqmppvwvvxaaaavvxvvk
  kwvvvxaaaavwxvvpqppmpqpppAaddddddddddddddddddddddddddddddddaAmppppqpmppwvvvxaaaavwxvvk
  kxxxxxaaaaxxxxxmmmmmmmmmmAaddddddddddddddddddddddddddddddddaAmmmmmmmmmmxxxxxaaaaxxxxxk
  kxvvwvaaaavvvvwmpppqppmpqAaddddddddddddddddddddddddddddddddaApppmppppqpxvvwvaaaavvvvwk
  kxvwvvaaaavvvwvmppqpppmqpAaddddddddddddddddddddddddddddddddaAppqmpppqppxvwvvaaaavvvwvk
  kxwvvvaaaavvwvvmpqppppmppAaddddddddddddddddddddddddddddddddaApqpmppqpppxwvvvaaaavvwvvk
  kxxxxxxxxxxxxxxmmmmmmmmmmAaddddddddddddddddddddddddddddddddaAmmmmmmmmmmxxxxxxxxxxxxxxk
  kvvvvxvvvvwvxvvqpppmqppppAaddddddddddddddddddddddddddddddddaAmpppqppmpqvvvvxvvvvwvxvvk
  kvvvwxvvvwvvxvwppppmppppqAaddddddddddddddddddddddddddddddddaAmppqpppmqpvvvwxvvvwvvxvwk
  kvvwvxvvwvvvxwvpppqmpppqpAaddddddddddddddddddddddddddddddddaAmpqppppmppvvwvxvvwvvvxwvk
  kxxxxxxxxxxxxxxmmmmmmmmmmAaddddddddddddddddddddddddddddddddaAmmmmmmmmmmxxxxxxxxxxxxxxk
  kxvvvvwvxvvwvvvmqppppqmppAaddddddddddddddddddddddddddddddddaAqppmpqppppxvvvvwvxvvwvvvk
  kxvvvwvvxvwvvvvmppppqpmppAaddddddddddddddddddddddddddddddddaApppmqppppqxvvvwvvxvwvvvvk
  kxvvwvvvxwvvvvwmpppqppmpqAaddddddddddddddddddddddddddddddddaApppmppppqpxvvwvvvxwvvvvwk
  kxxxxxxxxxxxxxxmmmmmmmmmmAaddddddddddddddddddddddddddddddddaAmmmmmmmmmmxxxxxxxxxxxxxxk
  kvwvvxvwvvvvxvvppqpmppqppAaddddddddddddddddddddddddddddddddaAmqppppqmppvwvvxvwvvvvxvvk
  kwvvvxwvvvvwxvvpqppmpqpppAaddddddddddddddddddddddddddddddddaAmppppqpmppwvvvxwvvvvwxvvk
  kvvvvxvvvvwvxvvqpppmqppppAaddddddddddddddddddddddddddddddddaAmpppqppmpqvvvvxvvvvwvxvvk
  kxxxxxxxxxxxxxxmmmmmmmmmmAaddddddddddddddddddddddddddddddddaAmmmmmmmmmmxxxxxxxxxxxxxxk
  kxvwvvvvxvvvvwvmppqpppmqpAaddddddddddddddddddddddddddddddddaAppqmpppqppxvwvvvvxvvvvwvk
  kxwvvvvwxvvvwvvmpqppppmppAaddddddddddddddddddddddddddddddddaApqpmppqpppxwvvvvwxvvvwvvk
  kxvvvvwvxvvwvvvmqppppqmppAaddddddddddddddddddddddddddddddddaAqppmpqppppxvvvvwvxvvwvvvk
  `,
  (char) => COLORS[char],
)

// The doorway's left column in the drawing: walking past it into the castle finishes the
// level.
export const CASTLE_DOOR_LEFT = 27
