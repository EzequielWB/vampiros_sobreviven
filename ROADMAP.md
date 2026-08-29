# Roadmap — "Los Vampiros Supervivientes de Ezequiel"

Guía de contexto y planes para continuar el desarrollo (pensada para retomar el trabajo en una sesión nueva).

---

## 1. Qué es el juego

Bullet heaven estilo **Vampire Survivors**, en vanilla JavaScript (ES6 modules) + HTML5 Canvas 2D + CSS3. **Cero frameworks, cero dependencias, cero build**. Todo el audio es sintetizado con Web Audio API y los sprites son arrays de píxeles 16x16 renderizados a canvas.

- 9 personajes jugables (config + sprite + selección + upgrades)
- 4 tipos de enemigos (Noctámbulo/grunt, Goliat/tank, Acechador/runner, Nigromante/shooter)
- Sistema de oleadas con escalado por minuto
- Sistema XP / level-up con 3 opciones RNG
- Spatial hash grid (O(n)) para colisiones con cientos de enemigos
- Object pooling de enemigos + LOD para distancia
- Soporte mobile (joystick virtual, límites de enemigos, warning de rotación)

## 2. Arquitectura / mapa de archivos

```
index.html              Single-page app (menú, selección, HUD, pantallas)
GUIA.txt                Spec original pegada (Canvas2D, sin frameworks, grid, deltaTime)
css/style.css           Tema gótico pixel
js/
  main.js               Entry point, expone window.game para debug
  config.js             TODOS los datos: clases, armas, enemigos, oleadas, upgrades, ultimates
  game.js               Clase Game (~2200 líneas): loop, state machine, armas, ultimates, render, upgrades
  entityManager.js      Registry de entidades, colisiones por grid, pooling
  spatialGrid.js        Hash grid 80px
  inputManager.js       WASD/arrows/touch/joystick
  uiHandler.js          DOM HUD, menús, level-up UI
  audioManager.js       Sonidos sintetizados (15+)
  pixelSprites.js       Data de sprites 16x16 + drawPixelSprite
  utils.js              Helpers matemáticos
  systems/waveDirector.js   Spawning por oleadas
  systems/weaponSystem.js   STUB muerto (ver Pendientes Fase 2)
  entities/{player,enemy,projectile,enemyProjectile,gem,fireball,shield}.js
```

**Patrón clave**: los datos viven en `config.js` (CONFIG.PLAYER.CLASSES, CONFIG.WEAPONS, CONFIG.ULTIMATES, CONFIG.UPGRADES_POOL). La lógica de combate está inline en `game.js` (`_updateWeapons()`, `_doUltimateX()`, `_updateUltimateX()`). Para agregar contenido nuevo, lo habitual es: definir en config → usar en game.js → sprite en pixelSprites.js → card en index.html.

## 3. Personajes (9)

| Clase | Arma principal | Técnica (ULT) | Estado |
|---|---|---|---|
| Caballero | Espada (arco) + Escudo | Corte Divino (360°) | ✅ completo |
| Mago | Varita auto-target + Bola de fuego | Rayo Aniquilador | ✅ completo |
| Pícaro | Dagas rápidas + Aura de Ajo | Lluvia de Bombas | ✅ completo |
| Artoria | Espada doble golpe | Excalibur (rayo x2) | ✅ completo |
| Cu Chulainn | Lanza lineal Gae Dearg | Gae Bolg (explosión replicante) | ✅ completo |
| Emiya | Arco de flechas | UBW (arena de cortes) | ✅ completo |
| Alucard | Pistolas Casull & Jackal | **Liberation** (familiars orbitantes) | ✅ completo |
| Kratos | Hacha Léviatán (lanzar/recall/ricochet) | **Ira Espartana** (aura + lifesteal + speed) | ✅ completo |
| Musashi | Doble katana Niten + parry pasivo | **Gorin no Sho** (5 posturas) | ✅ completo |

## 4. Estado actual y FASE 1 (COMPLETADA)

La Fase 1 destrabó a los 3 personajes nuevos. Todo lo listado abajo **ya está hecho**:

- `_doUltimateAlucard()` / `_updateUltimateAlucard(dt)` en `game.js` (Liberation: murciélagos que orbitan y cazan)
- `_doUltimateKratos()` / `_updateUltimateKratos(dt)` (Ira Espartana: AoE + lifesteal `ult.lifesteal` + `_rageSpeedBoost`)
- `_doUltimateMusashi()` / `_updateUltimateMusashi(dt)` (Gorin no Sho: pulsos radiales por postura)
- `_tryMusashiParry(attacker)` (contraataque 2.2x que bloquea el golpe; llamado desde `entityManager.js`)
- Render de los 3 ultimates (bloque de definitivas en `_renderWorld`)
- Upgrades `alucard_up` (+2 familiars), `kratos_up` (+2 ricochets, se suma en `_throwLeviathan`), `musashi_up` (+2.4s duración)
- Labels del botón ULT (LIB/RAGE/GORIN) en `_updateUltimateButton`
- **Fix crítico extra**: se eliminó la línea corrupta `>>>>>> REPLACE` en `pixelSprites.js` (rompía la sintaxis de TODOS los módulos del juego)
- Verificado con smoke test de Node (mock de DOM) + `node --check`

> ⚠️ Nota: `player.js`, `entityManager.js`, `config.js`, `index.html` e `images/cu-idle.png` tienen cambios sin commitear que existían ANTES de la Fase 1 (trabajo previo del usuario). No los tocar salvo que sea necesario.

## 5. FASE 2 — Pulido (pendiente)

1. **HUD de arma hardcodeado** → `game.js:2159`. Solo reconoce caballero/mago/pícaro; las otras 6 clases muestran texto genérico. Hacer un mapa de nombres para las 9:
   - caballero `[SWD] Espada+[SHD]`
   - mago `[ORB] Varita+[FIR]`
   - picaro `[DAG] Dagas+[GAR]`
   - artoria `[SWD] Excalibur base`
   - cu `[LNC] Gae Dearg`
   - emiya `[BOW] Arco`
   - alucard `[GUN] Casull & Jackal`
   - kratos `[AXE] Léviatán`
   - musashi `[KAT] Niten Ichi-ryū`
   - Añadir también el nombre de la técnica (ULT).

2. **WeaponSystem** (`js/systems/weaponSystem.js`) es dead code: se instancia y se llama `update()` cada frame pero solo decrementa 3 timers. Toda la lógica real está inline en `_updateWeapons()`. Decidir: (a) mover la lógica de armas ahí para limpiar `game.js` (~2200 líneas es mucho), o (b) eliminar la clase y sus referencias. Ojo: la opción (a) es refactor riesgoso; probar cada clase después.

3. **`images/cu-idle.png`** no se usa en ningún lado. Eliminar o conectarlo (por ahora los sprites son puramente procedurales).

4. **Balance**: probar los 9 personajes minuto a minuto. Especial atención a:
   - Alucard Liberation: 8 familiars × tick 0.55s × dmg 35 puede ser OP.
   - Kratos lifesteal 15% con daño 65 × tick 0.12s es muy fuerte vs oleadas densas.
   - Musashi parry: 2.2x daño cada slash (window 0.35s) — verificar que no haga el juego trivial.

## 6. FASE 3 — Contenido nuevo

1. **Nuevos enemigos** (agregar a `CONFIG.ENEMY.TYPES` + sprite + lógica en `enemy.js` + mix en `CONFIG.WAVE.MIX`):
   - Elite/mini-boss: aparece cada N minutos, HP x8, drops garantizados, aura de daño.
   - Suicida explosivo: corre al jugador y explota por contacto.
   - Enjambre lento: 3-4 enemigos unidos que avanzan juntos, se separan al recibir daño.
   - Support: potencia a los enemigos cercanos (+daño/velocidad) mientras vive.

2. **Oleadas más profundas**: extender la tabla `CONFIG.WAVE.MIX` a minutos 10-15+ y revisar el escalado (`hpPerMinute`, `damagePerMinute`, `speedPerMinute`) para partidas largas. La guía original pide "Rate = BaseRate / (1 + (Time / 60))" — verificar si el waveDirector cumple eso o se puede mejorar.

3. **Más upgrades genéricos**: velocidad de proyectil, alcance de arma, chance de crit extra, drop% de gemas, life steal genérico, invulnerabilidad corta al hacer daño...

4. **Segunda técnica por personaje** desbloqueable por nivel (ej: nivel 10) — requiere UI nueva en el HUD y arreglar `_updateUltimateButton` y `tryActivateUltimate` para soportar 2 técnicas.

## 7. FASE 4 — Features aspiracionales

1. **Armas evolucionadas** (estilo Vampire Survivors): fusionar upgrade exclusivo + arma base → arma nueva (ej: Espada+`artoria_up` x3 → Excalibur permanente).
2. **Mapas/biomas**: tiles distintos, obstáculos, zonas de bonus.
3. **Bestiario + logros** con persistencia en `localStorage` (kills por enemigo, tiempo total, personajes usados).
4. **Modo survival infinito** (oleadas sin techo) y **modo jefe** (boss cada 5 min con HP gigante).
5. **Más personajes** reutilizando la arquitectura (config + sprite + 1 arma + 1 ult).
6. **Skill tree pasivo** o reliquias de inicio seleccionables antes de la partida.
7. **Release/build**: no hay bundler. Para producción se puede empaquetar manualmente o agregar ausVite (opcional, el juego anda sin build). Hosting estático (GitHub Pages / Netlify / Vercel) directo por ser puro estático.

## 8. Cómo correr / probar

```powershell
# Desde la raíz del proyecto:
python -m http.server 8080
# Abrir http://localhost:8080
```

- Los ES modules NO funcionan con file:// (CORS). Siempre usar un server HTTP.
- Debug en consola: `window.game` / `window.GAME`.
- Tests: no hay suite formal. Para validar sintaxis de un módulo:
  `Copy-Item js\game.js "$env:TEMP\g.mjs" -Force; node --check "$env:TEMP\g.mjs"`
- Existe un smoke test de Node con DOM simulado (helpers en `C:\Users\Ezequ\AppData\Local\Temp\opencode\ultimate_smoke.mjs`) que se puede reusar/ampliar para probar funcionalidad sin navegador.

## 9. Glosario de métodos clave en game.js

- `_updateWeapons(dt)` — dispara el arma de cada clase (rama por `classId`)
- `tryActivateUltimate()` / `_updateUltimate(dt)` — activa/tickea la técnica según classId
- `_doUltimateX()` / `_updateUltimateX(dt)` — patrón de definitivas (una dupla por clase)
- `_tryMusashiParry(e)` — parry pasivo de Musashi (llamado desde entityManager)
- `applyUpgrade(id)` — switch de mejoras; agregar casos aquí al crear upgrades
- `triggerLevelUp()` — arma el pool de 3 opciones RNG (70% de chance de incluir la exclusiva)
- `_renderWorld(ctx)` — todo el render; los ultimates se pintan en el bloque `if(this.ultimateActive)` (~línea 1850+)
- `spawnDamageNumber / spawnExplosion / spawnGemAt / spawnPickupText` — helpers de feedback

## 10. Checklist rápido para continuar la sesión

1. Leer `config.js` (fuente de verdad de datos) y `game.js` (lógica).
2. Confirmar que no haya marcadores de conflicto: buscar `<<<<<<<`, `=======`, `>>>>>>>`.
3. Correr `node --check` sobre lo que se toque.
4. Levantar `python -m http.server 8080` y probar en navegador.
5. Prioridad inmediata: Fase 2 (HUD de armas → weaponSystem → balance). Luego Fase 3.