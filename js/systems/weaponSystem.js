/**
 * WeaponSystem — Gestión de armas, proyectiles y cálculo de daño
 * PASO 1: stub. Implementación completa en PASO 4.
 *
 * Armas requeridas:
 *  - Látigo/Espada (ataque horizontal/frontal, cooldown)
 *  - Varita Mágica (auto-target al enemigo más cercano)
 *  - Ajo/Aura (AoE constante alrededor del jugador)
 */

export class WeaponSystem {
    constructor(game) {
        this.game = game;
        // Cooldowns por arma
        this.timers = {
            whip: 0,
            wand: 0,
            garlic: 0
        };
    }

    reset() {
        this.timers.whip = 0;
        this.timers.wand = 0;
        this.timers.garlic = 0;
    }

    // PASO 4: update con deltaTime, query SpatialGrid para targets
    update(dt) {
        // Stub PASO 1: solo cuenta timers, sin disparos reales
        // Lógica real en PASO 4 usará:
        //  - this.game.entityManager.grid.query(...) para encontrar enemigo más cercano (varita)
        //  - colisiones AoE y proyectiles con grid
        for (const k in this.timers) {
            if (this.timers[k] > 0) this.timers[k] -= dt;
        }
    }

    // Helpers que se usarán en PASO 4
    _findNearestEnemy(player, maxRange = 400) {
        const em = this.game.entityManager;
        if (!em) return null;
        let best = null, bestD2 = maxRange * maxRange;
        const candidates = em.enemies;
        for (const e of candidates) {
            if (!e.alive) continue;
            const dx = e.x - player.x, dy = e.y - player.y;
            const d2 = dx*dx + dy*dy;
            if (d2 < bestD2) { bestD2 = d2; best = e; }
        }
        return best;
    }
}
