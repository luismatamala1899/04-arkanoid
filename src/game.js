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

let lastTime = null;

// Partida nueva: puntos 0, vidas 3, nivel 1 y pelota pegada a la pala
function resetGame() {
  state.score = 0;
  state.lives = START_LIVES;
  state.levelIndex = 0;
  state.bricks = buildBricks( state.levelIndex );
  state.explosions = [];
  resetBall();
}

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

// Velocidad de la pelota en el nivel actual: 360, 414 y 476 px/s
function levelSpeed() {
  return BALL_BASE_SPEED * BALL_SPEED_STEP ** state.levelIndex;
}

function stickBallToPaddle() {
  const b = state.ball;
  const p = state.paddle;
  b.x = p.x + p.w / 2 - b.size / 2;
  b.y = p.y - b.size;
}

function resetBall() {
  const b = state.ball;
  b.vx = 0;
  b.vy = 0;
  b.stuck = true;
  stickBallToPaddle();
}

function updateBall( dt ) {
  const b = state.ball;

  if ( b.stuck ) {
    stickBallToPaddle();
    if ( input.actionPressed ) {
      const v = levelSpeed();
      b.vx = v * Math.sin( LAUNCH_ANGLE );
      b.vy = -v * Math.cos( LAUNCH_ANGLE );
      b.stuck = false;
    }
    return;
  }

  b.x += b.vx * dt;
  b.y += b.vy * dt;

  if ( b.x < 0 ) {
    b.x = 0;
    b.vx = Math.abs( b.vx );
    playSound( 'bounce' );
  } else if ( b.x + b.size > CANVAS_W ) {
    b.x = CANVAS_W - b.size;
    b.vx = -Math.abs( b.vx );
    playSound( 'bounce' );
  }

  if ( b.y < 0 ) {
    b.y = 0;
    b.vy = Math.abs( b.vy );
    playSound( 'bounce' );
  }

  hitBrick();
  bounceOnPaddle();

  if ( b.y > CANVAS_H ) {
    loseLife();
  }
}

// Vidas y puntos se mantienen; la pelota sale a la velocidad del nuevo nivel al lanzarla
function nextLevel() {
  state.levelIndex++;
  if ( state.levelIndex < LEVELS.length ) {
    state.bricks = buildBricks( state.levelIndex );
    state.explosions = [];
    resetBall();
  } else {
    state.screen = 'win';
  }
}

// Los bloques se quedan como estaban; solo la pelota vuelve a la pala
function loseLife() {
  state.lives--;
  if ( state.lives > 0 ) {
    resetBall();
  } else {
    state.screen = 'gameover';
  }
}

function overlaps( a, aw, ah, r ) {
  return a.x < r.x + r.w && a.x + aw > r.x && a.y < r.y + r.h && a.y + ah > r.y;
}

// Rompe como mucho un bloque por frame y rebota en el eje de menor penetración
function hitBrick() {
  const b = state.ball;
  const brick = state.bricks.find( ( r ) => r.alive && overlaps( b, b.size, b.size, r ) );
  if ( !brick ) return;

  const penX = Math.min( b.x + b.size - brick.x, brick.x + brick.w - b.x );
  const penY = Math.min( b.y + b.size - brick.y, brick.y + brick.h - b.y );
  if ( penX < penY ) {
    b.vx = -b.vx;
  } else {
    b.vy = -b.vy;
  }

  brick.alive = false;
  state.score += POINTS_PER_BRICK;
  playSound( 'break' );
  state.explosions.push( { x: brick.x, y: brick.y, color: brick.color, elapsed: 0 } );
}

// EXPLOSION_DURATION es la duración de cada frame; la explosión se elimina tras el último
function updateExplosions( dt ) {
  for ( const e of state.explosions ) e.elapsed += dt * 1000;
  state.explosions = state.explosions.filter(
    ( e ) => Math.floor( e.elapsed / EXPLOSION_DURATION ) < EXPLOSION_FRAMES[ e.color ].length
  );
}

// El ángulo de salida depende de dónde golpea la pelota: centro → vertical, bordes → hasta 60°
function bounceOnPaddle() {
  const b = state.ball;
  const p = state.paddle;
  if ( b.vy <= 0 || !overlaps( b, b.size, b.size, p ) ) return;

  const ballCenter = b.x + b.size / 2;
  const paddleCenter = p.x + p.w / 2;
  const offset = Math.max( -1, Math.min( 1, ( ballCenter - paddleCenter ) / ( PADDLE_W / 2 ) ) );
  const angle = offset * MAX_BOUNCE_ANGLE;
  const v = Math.hypot( b.vx, b.vy );

  b.vx = v * Math.sin( angle );
  b.vy = -v * Math.cos( angle );
  playSound( 'bounce' );
}

function update( dt ) {
  switch ( state.screen ) {
    case 'menu':
      if ( input.actionPressed ) {
        resetGame();
        state.screen = 'playing';
      }
      break;
    case 'playing':
      if ( input.pausePressed ) {
        state.screen = 'paused';
        break;
      }
      updatePaddle( dt );
      updateBall( dt );
      if ( state.screen === 'playing' && !state.bricks.some( ( r ) => r.alive ) ) {
        nextLevel();
      }
      break;
    case 'paused':
      if ( input.pausePressed ) state.screen = 'playing';
      break;
    case 'gameover':
    case 'win':
      if ( input.actionPressed ) state.screen = 'menu';
      break;
  }
  updateExplosions( dt );

  // Las pulsaciones se consumen aquí, así la que empieza la partida no lanza la pelota
  input.actionPressed = false;
  input.pausePressed = false;
}

function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, CANVAS_W, CANVAS_H );

  for ( const b of state.bricks ) {
    if ( b.alive ) drawSprite( ctx, 'block_' + b.color, b.x, b.y, b.w, b.h );
  }

  for ( const e of state.explosions ) {
    const frame = EXPLOSION_FRAMES[ e.color ][ Math.floor( e.elapsed / EXPLOSION_DURATION ) ];
    drawFrame( ctx, frame, e.x, e.y, BRICK_W, BRICK_H );
  }

  const p = state.paddle;
  drawSprite( ctx, 'paddle', p.x, p.y, p.w, p.h );

  const b = state.ball;
  drawSprite( ctx, 'ball', b.x, b.y, b.size, b.size );

  drawHud();

  if ( state.screen === 'menu' ) {
    drawOverlay( 'ARKANOID', 'Pulsa Espacio o haz clic para empezar' );
  } else if ( state.screen === 'paused' ) {
    drawOverlay( 'PAUSA', 'Pulsa P para continuar' );
  } else if ( state.screen === 'gameover' ) {
    drawOverlay( 'GAME OVER', 'Puntos: ' + state.score );
  } else if ( state.screen === 'win' ) {
    drawOverlay( '¡HAS GANADO!', 'Puntos: ' + state.score );
  }
}

function drawHud() {
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText( 'Puntos: ' + state.score, 16, 30 );

  // Una bola por vida; el texto se coloca según START_LIVES para que no se desplace al perder vidas
  const gap = 6;
  const ballsX = CANVAS_W - 16 - START_LIVES * ( BALL_SIZE + gap ) + gap;
  ctx.textAlign = 'right';
  ctx.fillText( 'Vidas:', ballsX - 10, 30 );
  for ( let i = 0; i < state.lives; i++ ) {
    drawSprite( ctx, 'ball', ballsX + i * ( BALL_SIZE + gap ), 30 - BALL_SIZE / 2, BALL_SIZE, BALL_SIZE );
  }
}

// Capa semitransparente con un título y un subtítulo centrados
function drawOverlay( title, subtitle ) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect( 0, 0, CANVAS_W, CANVAS_H );

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 56px monospace';
  ctx.fillText( title, CANVAS_W / 2, CANVAS_H / 2 - 30 );
  ctx.font = '22px monospace';
  ctx.fillText( subtitle, CANVAS_W / 2, CANVAS_H / 2 + 30 );
}

function loop( now ) {
  if ( lastTime === null ) lastTime = now;
  const dt = Math.min( ( now - lastTime ) / 1000, MAX_DT );
  lastTime = now;

  update( dt );
  render();

  requestAnimationFrame( loop );
}

resetGame();

loadSpritesheet( () => {
  requestAnimationFrame( loop );
} );
