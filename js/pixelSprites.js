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
  'A': '#1E40AF',
  'a': '#60A5FA',
  'C': '#1E3A8A',
  'c': '#3B82F6',
  'E': '#991B1B',
  'e': '#D4D4D8',
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

// Artoria -- azul real con dorado, Excalibur (azul #1E40AF, amarillo #FFBE0B)
export const SPRITE_ARTORIA = [
  "......XXXX......",
  ".....XXXXXX.....",
  "....XXXXXXXX....",
  "...XXAAAAAAXX...",
  "..XXAAAYYYAAXX..",
  ".XXAAYYYAYYYAAXX",
  ".XXAAY....YAAXX.",
  "XXAAYY....YYAAXX",
  "XXAAAYYYYYYYAAXX",
  "XXAAWWWWWWWWAAXX",
  "XXAAWMMMMMWWAAXX",
  ".XXAAWWWWWWAAXX.",
  "..XXAAAAAAAAXX..",
  "...XXXXXXXXXX...",
  "....XXXXXXXX....",
  ".....XXXXXX.....",
];

// Cu Chulainn -- azul y rojo, lanza Gae Bolg
export const SPRITE_CU = [
  "......XXXX......",
  ".....XXXXXX.....",
  "....XXXXXXXX....",
  "...XXCCCCCCXX...",
  "..XXCCCRRRCCXX..",
  ".XXCCRRRRRRCCXX.",
  ".XXCCRR..RRCCXX.",
  "XXCCCRRRRRRCCXX.",
  "XXCCRR....RRCCXX",
  "XXCCRR....RRCCXX",
  "XXCCCCCCCCCCCCXX",
  ".XXCCCCCCCCCCXX.",
  "..XXCCCCCCCCXX..",
  "...XXXXXXXXXX...",
  "....XXXXRXXXX...",
  ".....XXXXXX.....",
];

// Emiya -- rojo/gris/blanco, arco
export const SPRITE_EMIYA = [
  "......XXXX......",
  ".....XXXXXX.....",
  "....XXXXXXXX....",
  "...XXWWWWWWXX...",
  "..XXWWWWWWWWXX..",
  ".XXWWWWWWWWWWXX.",
  ".XXWWEEEEWWWWXX.",
  "XXWWEE....EEWWXX",
  "XXWWEE....EEWWXX",
  "XXWWEEEEEEEEWWXX",
  "XXWWEEEEEEEEWWXX",
  ".XXWWWWWWWWWWXX.",
  "..XXWWWWWWWWXX..",
  "...XXXXXXXXXX...",
  "....XXX..XXX....",
  ".....XX..XX.....",
];

// Alucard (Hellsing) -- ALTO, abrigo largo ondeando, sombrero fedora, pistolas gemelas en pose disparando
// Colores: R=sangre, W=blanco hueso, B=negro abismo, E=rojo ojo, Y=oro gatillo
export const SPRITE_ALUCARD = [
  ".......XX.......",
  "......XXXX......",
  ".....XRRRRRX....",
  "....XRRRRRRRX...",
  "...XRRYYYYYYRX..",
  "..XRRYYWWYYYRRX.",
  ".XRRYYWWWWYYRRX.",
  ".XRRWWBBBBWWWRRX",
  "XRRRWWBBBBWWWRRX",
  "XRRRWWWWWWWWWRRX",
  "XRRRRRWWWWRRRRRX",
  ".XRRRRRRRRRRRRX.",
  "..XRRRRRRRRRRX..",
  "...XRRRRRRRRX...",
  "....XXXXXXXX....",
  ".....XX..XX.....",
];

// Kratos (God of War) -- ANCHO, brazos cruzados con hacha Léviatán en espalda, runas brillantes, barba densa
// Colores: S=piel pálida, R=marcas guerra, B=negro/runas, M=metal hacha, C=azul hielo filo
export const SPRITE_KRATOS = [
  "......XXXX......",
  ".....XXXXXX.....",
  "....XXXXXXXX....",
  "...XXSSSSSSXX...",
  "..XXSSSSSSSSXX..",
  ".XXSSRRRRSSSSXX.",
  ".XXSSRRRRSSSSXX.",
  "XXSSRRCCCCRRSSXX",
  "XXSSRRCCCCRRSSXX",
  "XXSSSSCCCCSSSSXX",
  "XXSSSSMMMMMSSSXX",
  ".XXSSMMMMMMSSXX.",
  "..XXSSSSSSSSXX..",
  "...XXXXMMMMXX...",
  "....XXMMMMXX....",
  ".....XXMMXX.....",
];

// Miyamoto Musashi -- POSTURA NITEN: katanas cruzadas (una alta, otra baja), kimono ondeando, mirada penetrante
// Colores: Y=kimono dorado, W=blanco/acero, B=negro tsuka, R=detalle rojo, K=rojo oscuro
export const SPRITE_MUSASHI = [
  ".......XX.......",
  "......XXXX......",
  ".....XYYYYYX....",
  "....XYYYYYYYX...",
  "...XYYWWWWWYYX..",
  "..XYYWWBBBWWYYX.",
  ".XYYWWBBBBBWWYX.",
  "XYYYWWBBBBBWWYYX",
  "XYYYWWWWWWWWWYYX",
  "XYYWWBBBBBBBWWYX",
  ".XYYWWBBBBBWWYX.",
  "..XYYWWWWWWWYX..",
  "...XYYYYYYYX...",
  "....XXXXXXXX....",
  ".....XWWWWX.....",
  "......XX..XX....",
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

// Elite / mini-boss -- Abad Antiguo con capa y detalles dorados
export const SPRITE_ELITE = [
  "................",
  "....XXXXXXXX....",
  "...XXXXXXXXXX...",
  "..XXRRRRRRRRXX..",
  ".XXRRRRRRRRRRXX.",
  ".XXRYYYYYYYYRXX.",
  ".XXRR..XX..RRXX.",
  ".XXRR..XX..RRXX.",
  ".XXRRYYYYYYRRXX.",
  "XXRRRRRRRRRRRRXX",
  "XXRRRRRRRRRRRRXX",
  "XXRRRRRRRRRRRRXX",
  ".XXRRRRRRRRRRXX.",
  "..XXRRRRRRRRXX..",
  "...XXRRRRRRXX...",
  "....XXXXXXXX....",
];

// Suicida explosivo -- Espina Volátil naranja
export const SPRITE_SUICIDE = [
  "................",
  ".......YY.......",
  ".......YYY......",
  "......YrrYY.....",
  ".....YrrrrYY....",
  "....YrrrrrYYY...",
  "...YrrrrrYYY....",
  "..YrrrrYYYYY....",
  "..YrrrYYYYYY....",
  ".YYYrrrrrrYYY...",
  ".YYrrrrrrrYY....",
  "..YrrrrrYYY.....",
  "..YrrrYYY.......",
  "...YYYYYY.......",
  "....YYYY........",
  "................",
];

// Enjambre -- grupo de criaturas verde ftalo
export const SPRITE_SWARM = [
  "................",
  "................",
  "....GGGG........",
  "...GGGGGG.......",
  "...GGggGG...GG..",
  "...GgggG...GGGG.",
  "....GGGG...GggG.",
  "...........GggG.",
  "...........GGGG.",
  "..GG..GG........",
  ".GGGG.GGGG......",
  "..GG...GG.......",
  "................",
  "................",
  "................",
  "................",
];

// Support -- Sacerdote violeta con capucha
export const SPRITE_SUPPORT = [
  "................",
  "......VVVV......",
  ".....VVVVVV.....",
  "....VVVVVVVV....",
  "....VV....VV....",
  "....V..WW..V....",
  "....VVWWWWVV....",
  "...VVVVVVVVVV...",
  "..VVVVVVVVVVVV..",
  "..VVVVVVVVVVVV..",
  "..VVvvvvvvvvVV..",
  "..VVVVVVVVVVVV..",
  "...VVVVVVVVVV...",
  "....VVVVVVVV....",
  "................",
  "................",
];

// Lancero Perforante -- azul, esbelto, con lanza larga
export const SPRITE_PIERCER = [
  "................",
  "......XXXX......",
  "......XaAX......",
  ".....XaaAaX.....",
  ".....XaAAAAX....",
  "....XaAAAaX.....",
    "....XaAAaX......",
    "...XaAAaAX......",
    "...XaAAAAaX.....",
  "...XaaaaaaX.....",
  "..XaWWWWaaX.....",
  "..XaaaaaaX......",
  "...XXXXXX.......",
  "................",
  "................",
  "................",
];

// Brujo Lúgubre -- violeta con ojos blancos brillantes y runas
export const SPRITE_HEXER = [
  "....XXXXXX......",
  "...XXXXXXXX.....",
  "..XXVVVVVVXX....",
  "..XVVVVVVVVX....",
  "..XVvWWWWvVX....",
  "..XVvWWWWvVX....",
  "..XVVVVVVVVX....",
  "...XVVVVVVVX....",
  "..XXXVVVVXXX....",
  ".XXVXVVVVXVXX...",
  ".XXVVVVVVVVXX...",
  ".XXVVVXXVVVXX...",
  "..XXVVVVVVXX....",
  "...XXVVVVXX.....",
  "....XXXXXX......",
  "................",
];

// Berserker -- ancho, piel, marcas rojas de guerra, cuerpo poderoso
export const SPRITE_BERSERKER = [
  "....XXXXXXXX....",
  "...XXXXXXXXXX...",
  "..XXSSSSSSSSXX..",
  ".XXSSSSRRSSSSXX.",
  ".XXSSSRRRRSSSXX.",
  ".XXSSSSRRSSSSXX.",
  ".XXSSWWWSSSSSXX.",
  "XXSSSSSSSSSSSSXX",
  "XXSSRRRRRRRRSSXX",
  "XXSSRRRRRRRRSSXX",
  "XXSSSSSSSSSSSSXX",
  ".XXSRRRRRRRRXX..",
  "..XXSSSSSSSSXX..",
  "...XXXRXXRXXX...",
  "....XXRXXRXX....",
  "................",
];

// Coloso Abisal -- elite tanque masivo, bordó oscuro con detalles dorados
export const SPRITE_ELITE_COLOSSUS = [
  "....XXXXXXXX....",
  "...XXXXXXXXXX...",
  "..XXXXXXXXXXXX..",
  ".XXRRRRRRRRRRXX.",
  ".XRRRRRRRRRRRRX.",
  "XRRYYYYYYYYYYRRX",
  "XRRRYYYYYYYYRRRX",
  "XRRYYYYYYYYYYRRX",
  "XRRYRRRRRRRRYRRX",
  "XRRRRRWWWWRRRRRX",
  "XRRRRRWWWWRRRRRX",
  "XRRRRRRRRRRRRRRX",
  "XRRRRRRRRRRRRRRX",
  ".XRRRRRRRRRRRRX.",
  ".XXrRRRRRRRRrXX.",
  "...XXXXXXXXXXXX.",
];

// Señor Brujo -- elite spawner violeta oscuro con corona y runas doradas
export const SPRITE_ELITE_HEXLORD = [
  "..YY....YY......",
  ".YYYY..YYYY.....",
  ".YVVYYVVVYY.....",
  "YVVVVVVVVVVY....",
  "YVVVVVVVVVVVY...",
  "YVVvWWWWvVVVVY..",
  "YVVvWWWWvVVVVVY.",
  "YVVVVVVVVVVVVVY.",
  ".YVVVVVVVVVVVY..",
  "..YVVvvvvvvVY...",
  "..YVVVVVVVVVY...",
  "..YVVVvVVvVVY...",
  "...YVVVVVVVVY...",
  "...YVVVVVVVY....",
  "...YVVVVVVVY....",
  "....YVVVVVY.....",
];

export const SPRITES = {
  caballero: SPRITE_CABALLERO,
  mago: SPRITE_MAGO,
  picaro: SPRITE_PICARO,
  artoria: SPRITE_ARTORIA,
  cu: SPRITE_CU,
  emiya: SPRITE_EMIYA,
  alucard: SPRITE_ALUCARD,
  kratos: SPRITE_KRATOS,
  musashi: SPRITE_MUSASHI,
  grunt: SPRITE_GRUNT,
  tank: SPRITE_TANK,
  runner: SPRITE_RUNNER,
  shooter: SPRITE_SHOOTER,
  elite: SPRITE_ELITE,
  suicide: SPRITE_SUICIDE,
  swarm: SPRITE_SWARM,
  support: SPRITE_SUPPORT,
  piercer: SPRITE_PIERCER,
  hexer: SPRITE_HEXER,
  berserker: SPRITE_BERSERKER,
  elite_colossus: SPRITE_ELITE_COLOSSUS,
  elite_hexlord: SPRITE_ELITE_HEXLORD,
};

const _cache = new Map();
function _getCachedCanvas(sprite, scale, whiteFlash){
  if(typeof document === 'undefined') return null;
  const id = sprite === SPRITE_CABALLERO ? 'cab' : sprite === SPRITE_MAGO ? 'mag' : sprite === SPRITE_PICARO ? 'pic' : sprite === SPRITE_ARTORIA ? 'art' : sprite === SPRITE_CU ? 'cu' : sprite === SPRITE_EMIYA ? 'emi' : sprite === SPRITE_GRUNT ? 'gru' : sprite === SPRITE_TANK ? 'tnk' : sprite === SPRITE_RUNNER ? 'run' : sprite === SPRITE_SHOOTER ? 'sho' : sprite === SPRITE_ELITE ? 'elt' : sprite === SPRITE_SUICIDE ? 'spi' : sprite === SPRITE_SWARM ? 'swm' : sprite === SPRITE_SUPPORT ? 'sup' : sprite === SPRITE_PIERCER ? 'prc' : sprite === SPRITE_HEXER ? 'hex' : sprite === SPRITE_BERSERKER ? 'brk' : sprite === SPRITE_ELITE_COLOSSUS ? 'col' : sprite === SPRITE_ELITE_HEXLORD ? 'hld' : 'unk';
  const key = `${id}_${scale}_${whiteFlash?1:0}`;
  if(_cache.has(key)) return _cache.get(key);
  const w = sprite[0].length, h = sprite.length;
  const sc = Math.round(scale*10)/10; // normalizar 2.9 -> 2.9
  const cw = document.createElement('canvas');
  cw.width = Math.ceil(w * sc);
  cw.height = Math.ceil(h * sc);
  const c = cw.getContext('2d');
  if(!c) return null;
  c.imageSmoothingEnabled = false;
  for(let y=0;y<h;y++){
    const row = sprite[y];
    for(let x=0;x<w;x++){
      const col = PALETTE[row[x]];
      if(!col) continue;
      c.fillStyle = whiteFlash ? '#FFFFFF' : col;
      c.fillRect(Math.floor(x*sc), Math.floor(y*sc), Math.ceil(sc), Math.ceil(sc));
    }
  }
  _cache.set(key, cw);
  return cw;
}

/**
 * Dibuja un sprite pixel art — versión rápida con cache + drawImage (10-15x más rápida)
 */
export function drawPixelSprite(ctx, sprite, cx, cy, scale = 2, flip = false, whiteFlash = false) {
  const canv = _getCachedCanvas(sprite, scale, whiteFlash);
  if(canv){
    const w = canv.width, h = canv.height;
    ctx.imageSmoothingEnabled = false;
    if(flip){
      ctx.save();
      ctx.scale(-1,1);
      ctx.drawImage(canv, -cx - w/2, cy - h/2);
      ctx.restore();
    } else {
      ctx.drawImage(canv, cx - w/2, cy - h/2);
    }
    return;
  }
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
    const bg = { caballero:'#1E1E24', mago:'#1A1030', picaro:'#0F1E1A', artoria:'#0F1E3A', cu:'#0F1A2A', emiya:'#1E1E24' }[classId] || '#1E1E24';
    const glow = { caballero:'rgba(97,12,39,0.22)', mago:'rgba(59,7,84,0.22)', picaro:'rgba(0,76,64,0.22)', artoria:'rgba(30,64,175,0.24)', cu:'rgba(185,28,28,0.22)', emiya:'rgba(212,212,216,0.20)' }[classId] || 'rgba(59,7,84,0.15)';
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
    ctx.strokeStyle = { caballero:'#610C27', mago:'#3B0754', picaro:'#004C40', artoria:'#1E40AF', cu:'#991B1B', emiya:'#D4D4D8' }[classId] || '#000';
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
