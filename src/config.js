const CANVAS_W = 800;
const CANVAS_H = 600;

const BRICK_W = 64;            // 2× el tamaño nativo del sprite (32×16)
const BRICK_H = 32;
const BRICK_OFFSET_X = 16;     // 12 columnas × 64 = 768 → 16 px de margen a cada lado
const BRICK_OFFSET_Y = 60;     // deja sitio al HUD

const PADDLE_W = 120;
const PADDLE_H = 16;
const PADDLE_Y = 560;          // borde superior de la pala
const PADDLE_SPEED = 600;      // px/s con teclado

const BALL_SIZE = 16;
const BALL_BASE_SPEED = 360;   // px/s en el nivel 1
const BALL_SPEED_STEP = 1.15;  // multiplicador por nivel
const MAX_BOUNCE_ANGLE = Math.PI / 3;   // 60° respecto a la vertical
const LAUNCH_ANGLE = Math.PI / 12;      // 15° a la derecha de la vertical

const START_LIVES = 3;
const POINTS_PER_BRICK = 10;
const MAX_DT = 1 / 30;         // límite del delta time en segundos
