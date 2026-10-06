const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const state = {
  screen: 'menu',        // 'menu' | 'playing' | 'paused' | 'gameover' | 'win'
  levelIndex: 0,         // 0..2
  score: 0,
  lives: START_LIVES,
  paddle: { x: 340, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H },
  ball: { x: 0, y: 0, vx: 0, vy: 0, size: BALL_SIZE, stuck: true },
  bricks: [],            // { x, y, w, h, color, alive }
  explosions: [],        // { x, y, color, elapsed }  elapsed en ms
};

state.bricks = buildBricks( state.levelIndex );

let lastTime = null;

function updatePaddle( dt ) {
  const p = state.paddle;
  if ( input.lastSource === 'mouse' && input.mouseX !== null ) {
    p.x = input.mouseX - p.w / 2;
  } else {
    if ( input.left ) p.x -= PADDLE_SPEED * dt;
    if ( input.right ) p.x += PADDLE_SPEED * dt;
  }
  p.x = Math.max( 0, Math.min( CANVAS_W - p.w, p.x ) );
}

function update( dt ) {
  updatePaddle( dt );
}

function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, CANVAS_W, CANVAS_H );

  for ( const b of state.bricks ) {
    if ( b.alive ) drawSprite( ctx, 'block_' + b.color, b.x, b.y, b.w, b.h );
  }

  const p = state.paddle;
  drawSprite( ctx, 'paddle', p.x, p.y, p.w, p.h );
}

function loop( now ) {
  if ( lastTime === null ) lastTime = now;
  const dt = Math.min( ( now - lastTime ) / 1000, MAX_DT );
  lastTime = now;

  update( dt );
  render();

  requestAnimationFrame( loop );
}

loadSpritesheet( () => {
  requestAnimationFrame( loop );
} );
