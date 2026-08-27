/**
 * main.js -- Punto de entrada
 * Los vampiros supervivientes de Ezequiel -- PASO 1
 */
import { Game } from './game.js';
import { renderClassPreview } from './pixelSprites.js';

const canvas = document.getElementById('gameCanvas');

if (!canvas) {
    throw new Error('No se encontró #gameCanvas');
}

const game = new Game(canvas);
game.init();

// Render previews pixel para selección de clase
function renderPreviews(){
  document.querySelectorAll('.pixel-portrait').forEach(c=>{
    const cls=c.dataset.class;
    if(cls) renderClassPreview(c, cls);
  });
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', renderPreviews);
else renderPreviews();
// Re-render si se vuelve al menú (por si canvas se limpia)
setTimeout(renderPreviews, 300);
setInterval(renderPreviews, 1200); // refresco suave para asegurar pixel tras cambios de estado

// Exponer para debug en consola
window.game = game;
window.GAME = game;

console.log('%c[Main] Juego cargado. Usa window.game para inspeccionar.', 'color:#610C27');
console.log('Controles: WASD mover | P/ESC pausa | G grid | M mute | Pixel art gótico');
