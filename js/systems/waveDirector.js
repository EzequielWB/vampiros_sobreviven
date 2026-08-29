/**
 * WaveDirector -- PASO 3: Oleadas en bordes de cámara, escalado por minuto, mix de tipos
 * Spawnea fuera de pantalla usando camera + SPAWN_MARGIN.
 * Cantidad: BASE_COUNT + floor(minute * COUNT_PER_MINUTE)  (capado)
 * Tipos: MIX según minuto + RNG pesado.
 * Escalado: HP/Daño/Vel según CONFIG.ENEMY.SCALING.
 */
import { CONFIG } from '../config.js';
import { rand, randInt } from '../utils.js';
import { Enemy } from '../entities/enemy.js';

export class WaveDirector {
    constructor(game) {
        this.game = game;
        this.timer = 0;
        this.spawnCooldown = CONFIG.WAVE.INTERVAL;
        this.totalSpawned = 0;
        this.waveNumber = 0;
        this.eliteTimer = 0;
    }

    reset() {
        this.timer = 0;
        this.spawnCooldown = CONFIG.WAVE.INTERVAL;
        this.totalSpawned = 0;
        this.waveNumber = 0;
        this.eliteTimer = 0;
    }

    // "Minutos de progresión": tiempo de juego acelerado para que la progresión sea rápida
    _progMinutes(elapsedSeconds) {
        return (elapsedSeconds / 60) * (CONFIG.PROGRESSION.SPEED || 1);
    }

    getScaledStats(elapsedSeconds) {
        const minutes = this._progMinutes(elapsedSeconds);
        const base = CONFIG.ENEMY;
        return {
            hp: Math.floor(base.BASE_HP + base.SCALING.hpPerMinute * minutes),
            damage: Math.floor(base.BASE_DAMAGE + base.SCALING.damagePerMinute * minutes),
            speed: Math.min(base.SCALING.maxSpeed, base.BASE_SPEED + base.SCALING.speedPerMinute * minutes)
        };
    }

    _getMix(minute) {
        const mixes = CONFIG.WAVE.MIX;
        let best = mixes[0];
        for (const m of mixes) if (m.minute <= minute && m.minute >= best.minute) best = m;
        return best;
    }

    _pickType(minute) {
        const mix = this._getMix(minute);
        const r = Math.random();
        let acc = 0;
        const order = ['grunt','tank','runner','shooter','piercer','hexer','berserker','suicide','swarm','support'];
        for (const id of order) {
            acc += mix[id] || 0;
            if (r < acc) return id;
        }
        return 'grunt';
    }

    _randomSpawnPos(camera) {
        const margin = CONFIG.WAVE.SPAWN_MARGIN;
        const side = randInt(0, 3);
        let x, y;
        if (side === 0) { x = rand(camera.x - margin, camera.x + camera.w + margin); y = camera.y - margin; }
        else if (side === 1) { x = camera.x + camera.w + margin; y = rand(camera.y - margin, camera.y + camera.h + margin); }
        else if (side === 2) { x = rand(camera.x - margin, camera.x + camera.w + margin); y = camera.y + camera.h + margin; }
        else { x = camera.x - margin; y = rand(camera.y - margin, camera.y + camera.h + margin); }
        return { x, y };
    }

    update(dt) {
        if (this.game.state !== 'GAMEPLAY') return;
        this.timer += dt;

        // ---- Spawn normal de enemigos ----
        this.spawnCooldown -= dt;
        if (this.spawnCooldown <= 0) {
            const elapsed = this.game.elapsed || 0;
            const progMinutes = this._progMinutes(elapsed);
            const isMobile = (typeof window !== 'undefined' && window.innerWidth < 860);
            const maxEnemies = isMobile ? CONFIG.WAVE.MAX_ENEMIES_MOBILE : CONFIG.WAVE.MAX_ENEMIES;
            const cur = this.game.entityManager.enemyCount();
            let canSpawn = true;
            // Si estamos cerca del cap, alargar intervalo (pero SIN detener las elites)
            if (cur >= maxEnemies) { this.spawnCooldown = 0.9; canSpawn = false; }
            else if (cur > maxEnemies * 0.82) { this.spawnCooldown = 0.65; canSpawn = false; }

            if (canSpawn) {
                // Rate = BaseRate / (1 + Time/60) -- guía original (ritmo de spawn descendente suave)
                const interval = Math.max(0.22, CONFIG.WAVE.INTERVAL / (1 + progMinutes * 0.45));
                this.spawnCooldown = interval;

                let count = Math.min(
                    CONFIG.WAVE.MAX_PER_WAVE,
                    CONFIG.WAVE.BASE_COUNT + Math.floor(progMinutes * CONFIG.WAVE.COUNT_PER_MINUTE) + (this.waveNumber % 3 === 0 ? 1 : 0)
                );
                // Ajustar cantidad si nos acercamos al cap (reserva espacio para elites)
                const headroom = maxEnemies - cur - 14;
                if (headroom < 1) { this.spawnCooldown = 0.9; }
                else {
                    if (count > headroom) count = Math.max(1, Math.floor(headroom * 0.6));
                    const scaled = this.getScaledStats(elapsed);
                    const cam = this.game.camera;
                    for (let i = 0; i < count; i++) {
                        const typeId = this._pickType(progMinutes);
                        const pos = this._randomSpawnPos(cam);
                        pos.x += rand(-18, 18); pos.y += rand(-18, 18);
                        if (this.game.entityManager.acquireEnemy) {
                            this.game.entityManager.acquireEnemy(pos.x, pos.y, typeId, scaled);
                        } else {
                            this.game.entityManager.add(new Enemy(pos.x, pos.y, typeId, scaled));
                        }
                        this.totalSpawned++;
                    }
                    this.waveNumber++;
                    if (this.waveNumber % 4 === 0) this.game.audio?.spawnWave?.();
                }
            }
        }

        // ---- Elites / mini-bosses: SIEMPRE se evalúan (no bloqueados por el cap de enemigos) ----
        const elapsed = this.game.elapsed || 0;
        const progMinutes = this._progMinutes(elapsed);
        if (progMinutes >= 1.5 && !this._elitePaused) {
            // El intervalo entre elites baja con el tiempo (mas frecuentes)
            const eliteInterval = progMinutes < 5 ? 45 : progMinutes < 10 ? 32 : progMinutes < 15 ? 24 : 18;
            if (elapsed - (this._lastEliteSpawn || 0) >= eliteInterval) {
                const scaled = this.getScaledStats(elapsed);
                // Seleccionar tipo de elite (coloso/señor brujo solo tras el minuto 5 de progresión)
                let typeA, typeB;
                const r = Math.random();
                if (progMinutes >= 5 && r < 0.22) typeA = 'elite_colossus';
                else if (progMinutes >= 5 && r < 0.44) typeA = 'elite_hexlord';
                else typeA = 'elite';
                const spawn = (t) => {
                    const pos = this._randomSpawnPos(this.game.camera);
                    if (this.game.entityManager.acquireEnemy) this.game.entityManager.acquireEnemy(pos.x, pos.y, t, scaled);
                    else this.game.entityManager.add(new Enemy(pos.x, pos.y, t, scaled));
                    this.totalSpawned++;
                };
                spawn(typeA);
                this._lastEliteSpawn = elapsed;
                // En momentos avanzados, a veces llegan 2 a la vez (mezcla distinta)
                if (progMinutes >= 12 && Math.random() < 0.35) {
                    if (typeA === 'elite' && Math.random() < 0.5) typeB = 'elite_hexlord';
                    else typeB = 'elite';
                    spawn(typeB);
                }
                this.game.audio?.spawnWave?.();
            }
        }
    }
}
