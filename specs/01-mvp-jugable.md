# SPEC 01 — MVP jugable de Arkanoid

> **Status:** Borrador
> **Depends on:** —
> **Date:** 2026-10-05
> **Objective:** Crear un MVP jugable de Arkanoid en el navegador con 3 niveles, pala controlada con teclado y ratón, vidas, puntuación y efectos de sonido y explosión.

---

## Alcance

**Dentro:**

- `index.html` en la raíz del repo con un `<canvas>` de 800×600.
- Código en 5 scripts clásicos dentro de `src/`: `config.js`, `levels.js`, `input.js`, `audio.js` y `game.js`.
- Pala controlada con teclado (flechas ← → y A/D) y con ratón (sigue la X del cursor). Gana el último input usado.
- La pelota empieza pegada a la pala y se lanza con Espacio o clic.
- Rebote en la pala con ángulo según el punto de impacto.
- Rebote en las paredes izquierda, derecha y superior. Si la pelota cae por abajo se pierde una vida.
- 3 niveles fijos. Al limpiar uno se carga el siguiente. Al limpiar el 3º aparece la pantalla de victoria.
- Todos los bloques se rompen de 1 golpe. El color es solo estético.
- 10 puntos por bloque.
- 3 vidas y pantalla de Game Over.
- HUD en el canvas con la puntuación y las vidas.
- La velocidad de la pelota sube un 15% en cada nivel.
- Pantallas: inicio, jugando, pausa (tecla P), Game Over y victoria.
- Sonido `ball-bounce.mp3` en los rebotes con pala y paredes, y `break-sound.mp3` al romper un bloque.
- Animación de explosión de 4 frames (`EXPLOSION_FRAMES`) en cada bloque roto.

**Fuera de alcance (para specs futuras):**

- Récord o puntuación guardada entre sesiones (localStorage).
- Bloques de varios golpes o indestructibles.
- Power-ups, cápsulas, enemigos y disparos.
- Pantalla intermedia "Nivel N" entre niveles.
- Nivel mostrado en el HUD.
- Control táctil y versión móvil.
- Canvas responsive o escalado a pantalla completa.
- Música de fondo y botón de silencio.
- Editor de niveles.
- Tests automáticos.

---

## Modelo de datos

### Constantes (`src/config.js`)

```js
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
```

### Niveles (`src/levels.js`)

Cada nivel es un array de strings de 12 caracteres. Cada carácter es una celda. `.` es una celda vacía.

```js
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
```

`buildBricks(levelIndex)` convierte un layout en un array de bloques. La celda `(fila, col)` va en `x = BRICK_OFFSET_X + col * BRICK_W` y `y = BRICK_OFFSET_Y + fila * BRICK_H`.

### Input (`src/input.js`)

```js
const input = {
  left: false,           // ArrowLeft o KeyA pulsada
  right: false,          // ArrowRight o KeyD pulsada
  mouseX: null,          // X del cursor en coordenadas del canvas
  lastSource: 'keyboard',  // 'keyboard' | 'mouse'
  actionPressed: false,  // Espacio o clic; flanco, se consume en un frame
  pausePressed: false,   // KeyP; flanco, se consume en un frame
};
```

### Estado del juego (`src/game.js`)

```js
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
```

### Audio (`src/audio.js`)

`playSound(name)` con `name` igual a `'bounce'` o `'break'`. Usa `assets/sounds/ball-bounce.mp3` y `assets/sounds/break-sound.mp3`. Cada llamada reproduce una copia (`cloneNode`) para que los sonidos se puedan solapar.

### Convenciones

- Coordenadas con origen arriba a la izquierda, en píxeles del canvas.
- Velocidades en píxeles por segundo, multiplicadas por `dt` (en segundos) en cada frame.
- `x`, `y` de cada entidad es su esquina superior izquierda.
- Velocidad de la pelota en el nivel `n` (base 0): `BALL_BASE_SPEED * BALL_SPEED_STEP ** n`, es decir 360, 414 y 476 px/s.
- Orden de carga en `index.html`: `assets/spritesheet.js`, `src/config.js`, `src/levels.js`, `src/input.js`, `src/audio.js` y `src/game.js`.

---

## Plan de implementación

1. **Esqueleto.** Crear `index.html` (canvas `#game` de 800×600, centrado, fondo de página oscuro) que cargue los 6 scripts en el orden indicado. Crear `src/config.js` con las constantes. Crear `src/game.js` con un loop de `requestAnimationFrame` que calcule `dt` limitado a `MAX_DT` y pinte el fondo de negro. Arrancar el loop dentro de `loadSpritesheet`. Crear `src/levels.js`, `src/input.js` y `src/audio.js` vacíos. Prueba manual: con `npx serve .` se ve un canvas negro y la consola no muestra errores.
2. **Bloques.** En `src/levels.js`, añadir `COLOR_MAP`, `LEVELS` y `buildBricks(levelIndex)`. En `game.js`, cargar el nivel 1 en `state.bricks` y dibujar los bloques vivos con `drawSprite(ctx, 'block_' + color, ...)`. Prueba manual: se ven 5 filas de 12 bloques en los colores del nivel 1.
3. **Input y pala.** En `src/input.js`, escuchar `keydown`/`keyup` (flechas, A/D, Espacio, P) en `window` y `mousemove`/`mousedown` en el canvas. Convertir `clientX` a coordenadas del canvas con `getBoundingClientRect`. Llamar a `preventDefault` en Espacio y flechas. En `game.js`, mover la pala según `input.lastSource`: con teclado a `PADDLE_SPEED`, y con ratón centrada en `mouseX`. Limitarla al ancho del canvas y dibujarla con `drawSprite(ctx, 'paddle', ...)`. Prueba manual: la pala se mueve con flechas, con A/D y con el ratón, y no sale del canvas.
4. **Pelota y paredes.** La pelota empieza pegada (`stuck: true`) centrada sobre la pala y la sigue. Con `actionPressed` se lanza a la velocidad del nivel con `LAUNCH_ANGLE`. Rebota en las paredes izquierda, derecha y superior, recolocándose dentro del canvas para no quedarse pegada. Si `ball.y > CANVAS_H`, vuelve a quedar pegada a la pala (las vidas llegan en el paso 7). Prueba manual: Espacio o clic lanzan la pelota, que rebota en tres paredes y vuelve a la pala al caer.
5. **Rebote en la pala.** Si la pelota solapa la pala y `vy > 0`, calcular `offset = (centroPelota - centroPala) / (PADDLE_W / 2)` limitado a [-1, 1] y `ángulo = offset * MAX_BOUNCE_ANGLE`. La nueva velocidad es `vx = v * sin(ángulo)` y `vy = -v * cos(ángulo)`, conservando el módulo `v`. Prueba manual: un golpe en el centro sale casi vertical y uno en los bordes sale inclinado hacia ese lado.
6. **Colisión con bloques y puntos.** Detectar el solape AABB entre la pelota y los bloques vivos. Procesar como mucho un bloque por frame. El eje de rebote es el de menor penetración: se invierte `vx` o `vy`. El bloque pasa a `alive: false` y se suman `POINTS_PER_BRICK` a `state.score`. Prueba manual: cada impacto rompe un bloque y la pelota rebota en el eje correcto.
7. **Vidas, HUD y Game Over.** Al caer la pelota, restar una vida. Con vidas restantes, la pelota vuelve a la pala y los bloques se quedan como estaban. Con 0 vidas, `state.screen = 'gameover'` y se dibuja la capa "GAME OVER" con la puntuación. Dibujar el HUD arriba: `Puntos: N` a la izquierda y `Vidas: N` a la derecha, en texto blanco. Prueba manual: perder 3 pelotas muestra "GAME OVER" y el juego se detiene.
8. **Pantalla de inicio y reinicio.** El juego arranca en `screen: 'menu'`, con la capa "ARKANOID" y "Pulsa Espacio o haz clic para empezar". En `menu`, `actionPressed` llama a `resetGame()` (puntos 0, vidas 3, nivel 1, pelota pegada) y pasa a `playing`, consumiendo esa pulsación para que no lance la pelota. En `gameover`, `actionPressed` vuelve a `menu`. Prueba manual: inicio → jugar → Game Over → inicio → partida nueva con 0 puntos y 3 vidas.
9. **Pausa.** En `playing`, `pausePressed` pasa a `paused`. En `paused`, vuelve a `playing`. En pausa no se actualizan ni la pala ni la pelota, y se dibuja la capa "PAUSA" con "Pulsa P para continuar". Prueba manual: P congela el juego y P lo reanuda donde estaba.
10. **Niveles y victoria.** Cuando no quedan bloques vivos, incrementar `levelIndex`. Si quedan niveles, cargar el siguiente con `buildBricks`, vaciar `explosions` y dejar la pelota pegada con la velocidad del nuevo nivel. Vidas y puntos se mantienen. Al superar el nivel 3, `state.screen = 'win'` con la capa "¡HAS GANADO!" y la puntuación. En `win`, `actionPressed` vuelve a `menu`. Prueba manual: limpiar los 3 niveles lleva a la pantalla de victoria.
11. **Sonidos.** Implementar `playSound` en `src/audio.js`. Llamar a `playSound('bounce')` en los rebotes con pala y paredes, y a `playSound('break')` al romper un bloque. Capturar el rechazo de la promesa de `play()` para no ensuciar la consola. Prueba manual: se oyen ambos sonidos en sus eventos.
12. **Explosiones.** Al romper un bloque, añadir `{ x, y, color, elapsed: 0 }` a `state.explosions`. Cada frame sumar `dt * 1000` a `elapsed` y dibujar el frame `Math.floor(elapsed / EXPLOSION_DURATION)` de `EXPLOSION_FRAMES[color]` con `drawFrame`, al tamaño del bloque. Eliminar la explosión cuando ese índice llega a 4. Prueba manual: cada bloque roto muestra una animación breve en su posición y desaparece.

---

## Criterios de aceptación

- [ ] Al servir la raíz con `npx serve .` y abrir `index.html`, la consola no muestra errores.
- [ ] Al cargar se ve la pantalla de inicio con "Pulsa Espacio o haz clic para empezar".
- [ ] Espacio o clic en la pantalla de inicio empieza el nivel 1 con la pelota pegada a la pala.
- [ ] La pala se mueve con ← → y con A/D.
- [ ] La pala sigue la X del ratón cuando se mueve sobre el canvas.
- [ ] La pala nunca sale de los bordes del canvas.
- [ ] Con la pelota pegada, Espacio o clic la lanzan hacia arriba.
- [ ] La pelota rebota en las paredes izquierda, derecha y superior.
- [ ] Un golpe en el centro de la pala devuelve la pelota casi vertical, y uno cerca de un borde la devuelve inclinada hacia ese lado.
- [ ] Cada bloque desaparece al primer impacto y suma exactamente 10 puntos al HUD.
- [ ] El HUD muestra `Puntos: N` y `Vidas: N` en todo momento durante el juego.
- [ ] Si la pelota cae por abajo, `Vidas` baja en 1 y la pelota vuelve a la pala sin reiniciar los bloques.
- [ ] Al perder la 3ª vida aparece "GAME OVER" con la puntuación final.
- [ ] Desde "GAME OVER", Espacio o clic vuelven a la pantalla de inicio, y la siguiente partida empieza con 0 puntos y 3 vidas.
- [ ] La tecla P pausa el juego y muestra "PAUSA", y otra pulsación de P lo reanuda en el mismo punto.
- [ ] Al romper todos los bloques del nivel 1 se carga el nivel 2 (pirámide invertida) con la pelota pegada a la pala, conservando puntos y vidas.
- [ ] Al romper todos los bloques del nivel 2 se carga el nivel 3 (tablero de ajedrez).
- [ ] En los niveles 2 y 3 la pelota va visiblemente más rápido que en el nivel 1.
- [ ] Al romper todos los bloques del nivel 3 aparece "¡HAS GANADO!" con la puntuación final (1380 si no se pierde ningún bloque: 138 bloques × 10).
- [ ] Desde "¡HAS GANADO!", Espacio o clic vuelven a la pantalla de inicio.
- [ ] Se oye `ball-bounce.mp3` al rebotar en la pala y en las paredes.
- [ ] Se oye `break-sound.mp3` al romper un bloque.
- [ ] Cada bloque roto muestra una animación de explosión de 4 frames en su posición.
- [ ] La velocidad de la pelota es la misma con el navegador a 60 Hz y a 120 Hz o más.

---

## Decisiones

- **Sí:** teclado (flechas y A/D) más ratón, con prioridad para el último input usado. Permite jugar de las dos formas sin un selector.
- **No:** solo ratón o solo teclado. Limitaría al jugador sin ahorrar apenas código.
- **Sí:** 3 vidas con Game Over. Es el equilibrio clásico entre duración y reto.
- **Sí:** 3 niveles fijos definidos como arrays de strings. Son legibles y se editan a mano sin herramientas.
- **No:** 2 o 5 niveles. Dos niveles prueban poco la progresión, y cinco solo añaden diseño de layouts.
- **Sí:** pelota pegada a la pala y lanzamiento con Espacio o clic, con un ángulo fijo de 15°. El jugador controla cuándo empieza, y el ángulo evita un rebote vertical infinito.
- **Sí:** ángulo de rebote según el punto de impacto en la pala, con un máximo de 60°. Es el comportamiento de Arkanoid y permite apuntar.
- **No:** reflexión simple en la pala. El jugador no podría apuntar.
- **Sí:** todos los bloques de 1 golpe. Reduce el modelo de datos del MVP. La resistencia por color queda para otra spec.
- **Sí:** el color gris se usa como bloque normal (fila superior del nivel 2). Su explosión reutiliza los frames rojos, como ya define `spritesheet.js`.
- **Sí:** 10 puntos fijos por bloque. Es fácil de verificar.
- **No:** puntos según el color. Requiere una tabla extra sin aportar al MVP.
- **Sí:** velocidad de la pelota +15% por nivel y constante dentro de cada nivel. Da progresión de dificultad sin complicar la física.
- **No:** acelerar con cada golpe. Añade estado y casos al perder una vida.
- **Sí:** `requestAnimationFrame` con delta time en px/s y `dt` limitado a 1/30 s. La velocidad no depende de la frecuencia del monitor, y el límite evita saltos grandes al volver de otra pestaña.
- **No:** velocidades en px/frame. El juego iría el doble de rápido a 120 Hz.
- **Sí:** canvas de 800×600 con bloques a 64×32, pala a 120×16 y pelota a 16×16.
- **No:** 480×640 vertical a tamaño nativo. Queda pequeño en monitores actuales.
- **Sí:** 5 scripts clásicos en `src/` (`config`, `levels`, `input`, `audio` y `game`). Hay separación de responsabilidades sin depender de módulos ES, y es coherente con `spritesheet.js`, que también es un script clásico.
- **No:** módulos ES. Mezclar módulos con los globales de `spritesheet.js` añade fricción sin beneficio en un MVP.
- **No:** separar `physics.js` y `render.js`. Hay demasiados globales compartidos para el tamaño actual. Se puede hacer en una refactorización futura.
- **Sí:** 5 estados de pantalla (`menu`, `playing`, `paused`, `gameover` y `win`). Desde Game Over y victoria se vuelve al inicio.
- **No:** una pantalla intermedia "Nivel N". Añadiría un sexto estado y temporizadores.
- **Sí:** sonidos y explosiones con los assets existentes. Ya están en el repo y su coste es bajo.
- **Sí:** `EXPLOSION_DURATION` (150 ms) se interpreta como la duración de **cada frame**, así que la animación completa dura 600 ms. Si durara 150 ms en total, cada frame duraría 37,5 ms y apenas se vería. *Decisión propuesta para revisar antes de aprobar.*
- **Sí:** colisión con bloques por AABB y eje de menor penetración, con un bloque como máximo por frame. Es simple y evita dobles rebotes que anulan la dirección.
- **No:** persistencia de récord. Queda para otra spec.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| El navegador bloquea el audio antes de la primera interacción del usuario | El primer sonido solo puede ocurrir después de Espacio o clic en la pantalla de inicio. El rechazo de `play()` se captura en `audio.js` y el juego sigue sin sonido. |
| La pelota atraviesa un bloque en un frame largo (tunneling) | `dt` está limitado a 1/30 s. A la velocidad máxima (476 px/s) avanza como mucho ~16 px por frame, que es menos que su tamaño (16 px) y que el alto de un bloque (32 px). |
| Abrir `index.html` con `file://` bloquea el spritesheet por reglas de origen | Servir siempre la raíz por HTTP (`npx serve .` o `python -m http.server`), como indica `CLAUDE.md`. |
| La X del ratón está desplazada si el canvas se escala por CSS | Convertir `clientX` con `getBoundingClientRect` y la relación `canvas.width / rect.width`. |
| La pulsación de Espacio que empieza la partida también lanza la pelota | `actionPressed` es un flanco que se consume en el frame en que se procesa (paso 8). |
| La pala movida con el ratón "teletransporta" su posición sobre la pelota | El rebote con la pala solo se aplica si `vy > 0`, así que no hay rebotes dobles hacia abajo. |

---

## Qué **no** entra en esta spec

- Récord o puntuación persistente (localStorage).
- Bloques de varios golpes o indestructibles.
- Power-ups, cápsulas, enemigos y disparos.
- Pantalla intermedia "Nivel N" y nivel en el HUD.
- Control táctil, versión móvil y canvas responsive.
- Música de fondo y botón de silencio.
- Editor de niveles.
- Tests automáticos.

Cada uno de estos, si llega, va en su propia spec.
