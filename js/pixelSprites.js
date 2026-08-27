/**
 * pixelSprites.js -- Sprites pixel art góticos para Los vampiros supervivientes de Ezequiel
 * Paleta gótica: #0F172A, #3B0754, #610C27, #004C40, #1E1E24
 * Cada sprite es un array de 16 strings (16x16). '.' = transparente
 * Colores: X=negro outline, M=metal claro #E2E8F0, m=metal medio #94A3B8,
 *          R=bordó #610C27, r=bordó claro #7A1432, V=violeta #3B0754, v=violeta claro #A78BFA,
 *          G=verde ftalo #004C40, g=verde claro #34D399, S=piel #E8C4A8, s=sombra piel #9A7B6A,
 *          B=gris cripta #1E1E24, W=blanco #FFFFFF, Y=oro #FFBE0B (para detalles)
 */

export const PALETTE = {
  'X': '#000000',
  'M': '#E2E8F0',
  'm': '#94A3B8',
  'R': '#610C27',
  'r': '#7A1432',
  'V': '#3B0754',
  'v': '#A78BFA',
  'G': '#004C40',
  'g': '#34D399',
  'S': '#E8C4A8',
  's': '#9A7B6A',
  'B': '#1E1E24',
  'W': '#FFFFFF',
  'Y': '#FFBE0B',
  '.': null
};

// Caballero -- armadura pesada, casco con visor, espada
export const SPRITE_CABALLERO = [
  "................",
  "......XXXX......",
  ".....XXXXXX.....",
  "....XXXXXXXX....",
  "...XXXMMMMXXX...",
  "..XXMMMMMMMMXX..",
  "..XXMMXXXXMMXX..",
  ".XXMMX....XMMXX.",
  ".XXMM......MMXX.",
  ".XXMM......MMXX.",
  "XXMMMMMMMMMMMMXX",
  "XXMMMMRMMRMMMMXX",
  "XXMMMMMMMMMMMMXX",
  ".XXMMMMMMMMMMXX.",
  ".XXXMMMMMMMMXXX.",
  "..XXXXXXXXXXXX..",
];

// Mago -- sombrero puntiagudo, túnica violeta, báculo
export const SPRITE_MAGO = [
  ".......XX.......",
  "......XXXX......",
  ".....XXXXXX.....",
  "....XXXXXXXX....",
  "...XXVVVVVVXX...",
  "..XXVVVVVVVVXX..",
  ".XXVVVVVVVVVVXX.",
  ".XXVV....VVVVXX.",
  "XXVV......VVVVXX",
  "XXVV..VV..VVVVXX",
  "XXVVVVVVVVVVVVXX",
  ".XXVVVVVVVVVVXX.",
  "..XXVVVVVVVVXX..",
  "...XXVVVVVVXX...",
  "....XXXXXXXX....",
  ".....XXXXXX.....",
];

// Pícaro -- capucha verde oscura, daga, ágil
export const SPRITE_PICARO = [
  "......XXXX......",
  ".....XXXXXX.....",
  "....XXXXXXXX....",
  "...XXGGGGGGXX...",
  "..XXGGGGGGGGXX..",
  ".XXGG....GGGGXX.",
  ".XXGG....GGGGXX.",
  "XXGGGGGGGGGGGGXX",
  "XXGGRR..RRGGGGXX",
  "XXGG......GGGGXX",
  ".XXGGGGGGGGGGXX.",
  "..XXGGGGGGGGXX..",
  "...XXGGGGGGXX...",
  "....XXXXXXXX....",
  ".....XXXXXX.....",
  "......XXXX......",
];

// Enemigos
export const SPRITE_GRUNT = [
  "................",
  ".....XXXXXX.....",
  "....XXXXXXXX....",
  "...XXRRRRRRXX...",
  "..XXRRRRRRRRXX..",
  ".XXRRRXXXXRRRXX.",
  ".XXRRX....XRRXX.",
  ".XXRR......RRXX.",
  ".XXRR..XX..RRXX.",
  "XXRRRRXXXXRRRRXX",
  "XXRRRRRRRRRRRRXX",
  ".XXRRRRRRRRRRXX.",
  "..XXRRRRRRRRXX..",
  "...XXXXXXXXXX...",
  "....XXXXXXXX....",
  ".....XXXXXX.....",
];

export const SPRITE_TANK = [
  "....XXXXXXXX....",
  "...XXXXXXXXXX...",
  "..XXXXXXXXXXXX..",
  ".XXXRRRRRRRRXXX.",
  ".XXRRRRRRRRRRXX.",
  "XXRRRRXXXXRRRRXX",
  "XXRRXX....XXRRXX",
  "XXRRX......XRRXX",
  "XXRR........RRXX",
  "XXRR...XX...RRXX",
  "XXRRRRXXXXRRRRXX",
  "XXRRRRRRRRRRRRXX",
  "XXRRRRRRRRRRRRXX",
  ".XXRRRRRRRRRRXX.",
  "..XXXXXXXXXXXX..",
  "...XXXXXXXXXX...",
];

export const SPRITE_RUNNER = [
  "................",
  "................",
  "....XXXXXXXX....",
  "...XXRRRRRRXX...",
  "..XXRRRRRRRRXX..",
  ".XXRR......RRXX.",
  "XXRR..XXXX..RRXX",
  "XXRR..XXXX..RRXX",
  ".XXRR......RRXX.",
  "..XXRRRRRRRRXX..",
  "...XXXXXXXXXX...",
  "....XXXXXXXX....",
  "................",
  "................",
  "................",
  "................",
];

export const SPRITE_SHOOTER = [
  ".......XXXX.....",
  "......XXXXXX....",
  ".....XXXXXXXX...",
  "....XXVVVVVVXX..",
  "...XXVVVVVVVVXX.",
  "..XXVVVXXXXVVVXX",
  ".XXVVXX....XXVVX",
  ".XXVV......VVXX.",
  ".XXVV..XX..VVXX.",
  "XXVVVVXXXXVVVVXX",
  "XXVVVVVVVVVVVVXX",
  ".XXVVVVVVVVVVXX.",
  "..XXVVVVVVVVXX..",
  "...XXVVVVVVXX...",
  "....XXXXXXXX....",
  ".....XXXXXX.....",
];

// Gemas pixel (no sprite 16x16, se dibuja como diamante)
// Se mantiene el dibujo actual pero con paleta violeta -- ya está en gem.js

export const SPRITES = {
  caballero: SPRITE_CABALLERO,
  mago: SPRITE_MAGO,
  picaro: SPRITE_PICARO,
  grunt: SPRITE_GRUNT,
  tank: SPRITE_TANK,
  runner: SPRITE_RUNNER,
  shooter: SPRITE_SHOOTER,
};

/**
 * Dibuja un sprite pixel art en canvas context
 * @param {CanvasRenderingContext2D} ctx
 * @param {string[]} sprite - array 16 strings
 * @param {number} cx - centro x en pantalla
 * @param {number} cy - centro y
 * @param {number} scale - tamaño pixel (2 = 32x32)
 * @param {boolean} flip - espejo horizontal
 * @param {boolean} whiteFlash - si true, todo blanco (hit)
 */
export function drawPixelSprite(ctx, sprite, cx, cy, scale = 2, flip = false, whiteFlash = false) {
  const h = sprite.length;
  const w = sprite[0].length;
  const ox = cx - (w * scale) / 2;
  const oy = cy - (h * scale) / 2;
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < h; y++) {
    const row = sprite[y];
    for (let x = 0; x < w; x++) {
      const ch = row[flip ? (w - 1 - x) : x];
      const col = PALETTE[ch];
      if (!col) continue;
      ctx.fillStyle = whiteFlash ? '#FFFFFF' : col;
      ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
    }
  }
  // outline extra para hit flash ya es blanco
}

/**
 * Renderiza preview en un <canvas> de clase -- usa EXACTO mismo sprite que in-game
 */
export function renderClassPreview(canvas, classId) {
  if (!canvas) return;
  const sprite = SPRITES[classId];
  if (!sprite) return;
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = 72; // un poco más grande para que se vea bien en mobile
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.imageSmoothingEnabled = false;
    // fondo gótico con resplandor según clase
    const bg = { caballero:'#1E1E24', mago:'#1A1030', picaro:'#0F1E1A' }[classId] || '#1E1E24';
    const glow = { caballero:'rgba(97,12,39,0.22)', mago:'rgba(59,7,84,0.22)', picaro:'rgba(0,76,64,0.22)' }[classId] || 'rgba(59,7,84,0.15)';
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,size,size);
    // resplandor central
    const grad = ctx.createRadialGradient(size/2, size/2, 8, size/2, size/2, 36);
    grad.addColorStop(0, glow);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,size,size);
    // borde pixel negro
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(1,1,size-2,size-2);
    // borde interior sutil clase
    ctx.strokeStyle = { caballero:'#610C27', mago:'#3B0754', picaro:'#004C40' }[classId] || '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(3,3,size-6,size-6);
    // patrón grid sutil
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for(let i=0;i<size;i+=8){ ctx.fillRect(i,0,1,size); ctx.fillRect(0,i,size,1); }
    // dibujar sprite centrado, scale 3.5 = 56px (ocupa bien el canvas) -- MISMO sprite que in-game
    drawPixelSprite(ctx, sprite, size/2, size/2 + 1, 3.5, false, false);
    // sombra inferior pixel
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(size/2 - 16, size - 11, 32, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(size/2 - 12, size - 7, 24, 2);
  } catch(e){
    console.warn('renderClassPreview fallo', e);
  }
}
