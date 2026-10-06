const SOUNDS = {
  bounce: new Audio( 'assets/sounds/ball-bounce.mp3' ),
  break: new Audio( 'assets/sounds/break-sound.mp3' ),
};

// Cada llamada reproduce una copia para que los sonidos se puedan solapar
function playSound( name ) {
  const sound = SOUNDS[ name ];
  if ( !sound ) return;
  const copy = sound.cloneNode();
  // El navegador puede rechazar play() antes de la primera interacción: el juego sigue sin sonido
  copy.play().catch( () => {} );
}
