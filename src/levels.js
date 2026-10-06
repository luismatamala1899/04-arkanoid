const COLOR_MAP = {
  R: 'red', Y: 'yellow', C: 'cyan', M: 'magenta',
  H: 'hotpink', G: 'green', S: 'gray',
};

const LEVELS = [
  [ // Nivel 1 — rectángulo, 60 bloques
    'RRRRRRRRRRRR',
    'YYYYYYYYYYYY',
    'CCCCCCCCCCCC',
    'MMMMMMMMMMMM',
    'GGGGGGGGGGGG',
  ],
  [ // Nivel 2 — pirámide invertida, 42 bloques
    'SSSSSSSSSSSS',
    '.RRRRRRRRRR.',
    '..YYYYYYYY..',
    '...CCCCCC...',
    '....MMMM....',
    '.....HH.....',
  ],
  [ // Nivel 3 — tablero de ajedrez, 36 bloques
    'R.R.R.R.R.R.',
    '.Y.Y.Y.Y.Y.Y',
    'C.C.C.C.C.C.',
    '.M.M.M.M.M.M',
    'H.H.H.H.H.H.',
    '.G.G.G.G.G.G',
  ],
];

function buildBricks( levelIndex ) {
  const bricks = [];
  LEVELS[ levelIndex ].forEach( ( row, fila ) => {
    for ( let col = 0; col < row.length; col++ ) {
      const color = COLOR_MAP[ row[ col ] ];
      if ( !color ) continue;
      bricks.push( {
        x: BRICK_OFFSET_X + col * BRICK_W,
        y: BRICK_OFFSET_Y + fila * BRICK_H,
        w: BRICK_W,
        h: BRICK_H,
        color,
        alive: true,
      } );
    }
  } );
  return bricks;
}
