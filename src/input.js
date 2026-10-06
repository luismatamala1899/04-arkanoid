const input = {
  left: false,           // ArrowLeft o KeyA pulsada
  right: false,          // ArrowRight o KeyD pulsada
  mouseX: null,          // X del cursor en coordenadas del canvas
  lastSource: 'keyboard',  // 'keyboard' | 'mouse'
  actionPressed: false,  // Espacio o clic; flanco, se consume en un frame
  pausePressed: false,   // KeyP; flanco, se consume en un frame
};

const PREVENT_DEFAULT_CODES = [ 'Space', 'ArrowLeft', 'ArrowRight' ];

function setKey( code, down ) {
  switch ( code ) {
    case 'ArrowLeft':
    case 'KeyA':
      input.left = down;
      if ( down ) input.lastSource = 'keyboard';
      break;
    case 'ArrowRight':
    case 'KeyD':
      input.right = down;
      if ( down ) input.lastSource = 'keyboard';
      break;
  }
}

window.addEventListener( 'keydown', ( e ) => {
  if ( PREVENT_DEFAULT_CODES.includes( e.code ) ) e.preventDefault();
  setKey( e.code, true );
  if ( e.repeat ) return;
  if ( e.code === 'Space' ) input.actionPressed = true;
  if ( e.code === 'KeyP' ) input.pausePressed = true;
} );

window.addEventListener( 'keyup', ( e ) => {
  if ( PREVENT_DEFAULT_CODES.includes( e.code ) ) e.preventDefault();
  setKey( e.code, false );
} );

// Convierte clientX a coordenadas del canvas, aunque el canvas esté escalado por CSS
function toCanvasX( e ) {
  const c = e.currentTarget;
  const rect = c.getBoundingClientRect();
  return ( e.clientX - rect.left ) * ( c.width / rect.width );
}

const inputCanvas = document.getElementById( 'game' );

inputCanvas.addEventListener( 'mousemove', ( e ) => {
  input.mouseX = toCanvasX( e );
  input.lastSource = 'mouse';
} );

inputCanvas.addEventListener( 'mousedown', ( e ) => {
  input.mouseX = toCanvasX( e );
  input.actionPressed = true;
} );
