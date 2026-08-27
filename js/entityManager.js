/**
 * EntityManager — PASO 2: Completo con colisiones por Spatial Hashing
 * - Rebuild O(n) cada frame
 * - Colisiones sin O(n²): solo chequea vecinos 3x3
 * - Métricas de rendimiento
 */
import { SpatialGrid } from './spatialGrid.js';
import { dist2 } from './utils.js';

export class EntityManager {
    constructor(cellSize = 80) {
        this.grid = new SpatialGrid(cellSize);
        this.entities = [];
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.gems = [];
        this.player = null;
        // Stats colisiones
        this.collisionChecks = 0;
        this.bruteForceChecks = 0; // cuánto nos ahorramos
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
        this.entities = this.entities.filter(alive);
        this.enemies = this.enemies.filter(alive);
        this.projectiles = this.projectiles.filter(alive);
        this.enemyProjectiles = this.enemyProjectiles.filter(alive);
        this.gems = this.gems.filter(alive);
        if (this.player && !this.player.alive) {
            // mantener referencia para game over, pero no en entities si murió? lo dejamos
        }
    }

    rebuildGrid() { this.grid.rebuild(this.entities); }

    queryNearby(entity, radius) { return this.grid.queryNearby(entity, radius); }

    /**
     * Colisiones principales usando Grid — evita O(n²)
     * 1) Enemigo vs Jugador (daño por contacto)
     * 2) Enemigo vs Enemigo (separación leve para no stackear)
     * 3) Proyectil vs Enemigo (para PASO 4, ya preparado)
     * Retorna { checks, hits }
     */
    handleCollisions(game) {
        this.collisionChecks = 0;
        let hits = 0;

        // 1) Jugador vs Enemigos — query alrededor del jugador
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

        // 2) Proyectiles vs Enemigos — PASO 4 preview (sin daño aún, solo conteo)
        // Cada proyectil query a su radio
        for (const proj of this.projectiles) {
            if (!proj.alive) continue;
            const candidates = this.grid.query(proj.x, proj.y, 24);
            for (const e of candidates) {
                if (e.type !== 'enemy' || !e.alive) continue;
                this.collisionChecks++;
                const r = (proj.radius || 6) + e.radius;
                if (dist2(proj.x, proj.y, e.x, e.y) < r * r) {
                    // En PASO 4: e.takeDamage(proj.damage); proj.alive=false; spawnea gem
                    // Aquí solo detectamos para métrica
                }
            }
        }

        // Brute force estimate
        this.bruteForceChecks = this.enemies.length * (this.enemies.length - 1) / 2 + this.enemies.length;

        return { checks: this.collisionChecks, hits, brute: this.bruteForceChecks };
    }

    /** Separación leve entre enemigos para evitar stacking — usa Grid */
    separateEnemies() {
        for (const e of this.enemies) {
            if (!e.alive) continue;
            const neighbors = this.grid.query(e.x, e.y, e.radius * 2.2);
            for (const other of neighbors) {
                if (other === e || other.type !== 'enemy' || !other.alive) continue;
                const dx = e.x - other.x, dy = e.y - other.y;
                const d2 = dx*dx + dy*dy;
                const minDist = e.radius + other.radius;
                if (d2 < minDist*minDist && d2 > 0.01) {
                    const d = Math.sqrt(d2);
                    const overlap = (minDist - d) * 0.5;
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
        // 1) Update entidades
        for (const e of this.entities) {
            if (e.alive !== false && typeof e.update === 'function') {
                e.update(dt, game);
            }
        }

        // 2) Rebuild grid O(n) — CRÍTICO antes de colisiones
        this.rebuildGrid();

        // 3) Separación (opcional, barato con grid)
        if (this.enemies.length > 0) this.separateEnemies();

        // 4) Colisiones eficientes
        this.handleCollisions(game);

        // 5) GC
        this._gc();
        // Nota: grid queda con datos del frame actual para render debug; se reconstruye al próximo update
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
