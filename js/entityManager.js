/**
 * EntityManager -- PASO 2: Completo con colisiones por Spatial Hashing
 * - Rebuild O(n) cada frame
 * - Colisiones sin O(n^2): solo chequea vecinos 3x3
 * - Métricas de rendimiento
 */
import { SpatialGrid } from './spatialGrid.js';
import { dist2 } from './utils.js';
import { Enemy } from './entities/enemy.js';

export class EntityManager {
    constructor(cellSize = 80) {
        this.grid = new SpatialGrid(cellSize);
        this.entities = [];
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.gems = [];
        this.player = null;
        this.enemyPool = [];
        this.maxPool = 80;
        this._frame = 0;
        this.collisionChecks = 0;
        this.bruteForceChecks = 0;
    }
    acquireEnemy(x,y,typeId,scaled){
        let e = this.enemyPool.pop();
        if(e){
            e.reset(x,y,typeId,scaled);
        } else {
            e = new Enemy(x,y,typeId,scaled);
        }
        this.add(e);
        return e;
    }
    releaseToPool(e){
        if(this.enemyPool.length < this.maxPool){
            e._gridKey=null;
            this.enemyPool.push(e);
        }
    }

    setPlayer(player) {
        this.player = player;
        this.add(player);
    }

    add(entity) {
        this.entities.push(entity);
        if (entity.type === 'enemy') this.enemies.push(entity);
        else if (entity.type === 'projectile') this.projectiles.push(entity);
        else if (entity.type === 'enemyProjectile') this.enemyProjectiles.push(entity);
        else if (entity.type === 'gem') this.gems.push(entity);
    }

    remove(entity) { entity.alive = false; }

    _gc() {
        const alive = (e) => e.alive !== false;
        // pool enemigos muertos (evita GC spikes con 500+)
        const dead = this.enemies.filter(e=>!alive(e));
        for(const e of dead) this.releaseToPool(e);
        this.entities = this.entities.filter(alive);
        this.enemies = this.enemies.filter(alive);
        this.projectiles = this.projectiles.filter(alive);
        this.enemyProjectiles = this.enemyProjectiles.filter(alive);
        this.gems = this.gems.filter(alive);
    }

    rebuildGrid() { this.grid.rebuild(this.entities); }

    queryNearby(entity, radius) { return this.grid.queryNearby(entity, radius); }

    /**
     * Colisiones principales usando Grid -- evita O(n^2)
     * 1) Enemigo vs Jugador (daño por contacto)
     * 2) Enemigo vs Enemigo (separación leve para no stackear)
     * 3) Proyectil vs Enemigo (para PASO 4, ya preparado)
     * Retorna { checks, hits }
     */
    handleCollisions(game) {
        this.collisionChecks = 0;
        let hits = 0;

        // 1) Jugador vs Enemigos -- query alrededor del jugador
        if (game.player && game.player.alive) {
            const p = game.player;
            const radius = p.radius + 18 + 20; // radio jugador + enemigo max + margen
            const candidates = this.grid.query(p.x, p.y, radius);
            for (const e of candidates) {
                if (e.type !== 'enemy' || !e.alive) continue;
                this.collisionChecks++;
                const r = p.radius + e.radius;
                if (dist2(p.x, p.y, e.x, e.y) < r * r) {
                    hits++;
                    // Daño con iFrames del player (manejado en player.takeDamage)
                    // Empuje
                    const dx = e.x - p.x, dy = e.y - p.y;
                    const len = Math.hypot(dx, dy) || 1;
                    // Separación inmediata para no quedar trabado
                    const push = 10;
                    p.x -= (dx / len) * push * 0.3;
                    p.y -= (dy / len) * push * 0.3;
                    e.x += (dx / len) * push * 0.7;
                    e.y += (dy / len) * push * 0.7;

                    // Shield del caballero se maneja dentro de takeDamage(game)
                    const prevCharges = p.shieldCharges;
                    const dmg = p.takeDamage(e.damage, game);
                    if (dmg > 0) {
                        game.spawnDamageNumber?.(p.x, p.y - 18, `-${Math.ceil(dmg)}`, '#e63946');
                        game.audio?.hurt?.();
                        e.hitFlash = 0.15;
                    } else if (prevCharges > 0 && p.shieldCharges < prevCharges) {
                        // bloqueado por escudo
                        e.hitFlash = 0.12;
                    } else if (p.invulnerable > 0) {
                        // iFrame, no daño
                    }
                }
            }
        }

        // 1b) Proyectiles enemigos vs Jugador
        for (const ep of this.enemyProjectiles) {
            if (!ep.alive || !game.player || !game.player.alive) continue;
            this.collisionChecks++;
            const p = game.player;
            const r = ep.radius + p.radius;
            if (dist2(ep.x, ep.y, p.x, p.y) < r*r) {
                ep.alive = false;
                const prev = p.shieldCharges;
                const dmg = p.takeDamage(ep.damage, game);
                if (dmg > 0) {
                    game.spawnDamageNumber?.(p.x, p.y - 18, `-${Math.ceil(dmg)}`, '#ff006e');
                    game.audio?.hurt?.();
                    const dx = p.x - ep.x, dy = p.y - ep.y;
                    const len = Math.hypot(dx,dy)||1;
                    p.x += dx/len*8; p.y += dy/len*8;
                    if (p.hp <= 0) { p.alive=false; }
                } else if (prev > 0 && p.shieldCharges < prev) {
                    // bloqueado
                }
            }
        }

        // (Proyectiles vs Enemigos se maneja en Game._handleProjectileCollisions con daño real — se omite aquí para no duplicar checks)
        this.bruteForceChecks = this.enemies.length * (this.enemies.length - 1) / 2 + this.enemies.length;

        return { checks: this.collisionChecks, hits, brute: this.bruteForceChecks };
    }

    separateEnemies(game) {
        // LOD: solo cada 2 frames y solo cerca del jugador (400px) para no quemar CPU con 500+ enemigos
        if((this._frame & 1) === 1) return;
        const px = game?.player?.x, py = game?.player?.y;
        const hasPlayer = px !== undefined;
        for (const e of this.enemies) {
            if (!e.alive) continue;
            if(hasPlayer){
                const dxp = e.x - px, dyp = e.y - py;
                if(dxp*dxp + dyp*dyp > 500*500) continue; // lejos, no separar
            }
            const neighbors = this.grid.query(e.x, e.y, e.radius * 2.1);
            for (const other of neighbors) {
                if (other === e || other.type !== 'enemy' || !other.alive) continue;
                const dx = e.x - other.x, dy = e.y - other.y;
                const d2 = dx*dx + dy*dy;
                const minDist = e.radius + other.radius;
                if (d2 < minDist*minDist && d2 > 0.01) {
                    const d = Math.sqrt(d2);
                    const overlap = (minDist - d) * 0.45;
                    const nx = dx / d, ny = dy / d;
                    e.x += nx * overlap * 0.5;
                    e.y += ny * overlap * 0.5;
                    other.x -= nx * overlap * 0.5;
                    other.y -= ny * overlap * 0.5;
                }
            }
        }
    }

    update(dt, game) {
        this._frame++;
        // 1) Update entidades con LOD: enemigos lejos (>700px) se actualizan cada 3 frames
        const px = game?.player?.x, py = game?.player?.y;
        for (const e of this.entities) {
            if (e.alive === false || typeof e.update !== 'function') continue;
            if(e.type==='enemy' && px!==undefined){
                const dx=e.x-px, dy=e.y-py;
                const d2=dx*dx+dy*dy;
                if(d2 > 700*700 && (this._frame % 3) !== 0) continue; // LOD lejos
                if(d2 > 1100*1100) continue; // muy lejos, no mover hasta que se acerque la cámara
            }
            e.update(dt, game);
        }
        this.rebuildGrid();
        if (this.enemies.length > 0) this.separateEnemies(game);
        this.handleCollisions(game);
        this._gc();
    }

    render(ctx, camera) {
        for (const e of this.entities) {
            if (e.alive !== false && typeof e.render === 'function') {
                e.render(ctx, camera);
            }
        }
    }

    count() { return this.entities.length; }
    enemyCount() { return this.enemies.length; }
    getCollisionStats() {
        return {
            checks: this.collisionChecks,
            brute: this.bruteForceChecks,
            saved: this.bruteForceChecks > 0 ? Math.round((1 - this.collisionChecks / this.bruteForceChecks) * 100) : 0,
            grid: this.grid.getStats()
        };
    }
}
