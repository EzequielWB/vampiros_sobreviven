/**
 * WaveDirector — PASO 3: Oleadas en bordes de cámara, escalado por minuto, mix de tipos
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
    }

    reset() {
        this.timer = 0;
        this.spawnCooldown = CONFIG.WAVE.INTERVAL;
        this.totalSpawned = 0;
        this.waveNumber = 0;
    }

    getScaledStats(elapsedSeconds) {
        const minutes = elapsedSeconds / 60;
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
        const order = ['grunt','tank','runner','shooter'];
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
        this.spawnCooldown -= dt;
        if (this.spawnCooldown <= 0) {
            const elapsed = this.game.elapsed || 0;
            const minutes = elapsed / 60;
            // Interval disminuye levemente con el tiempo para presión creciente
            const interval = Math.max(0.22, CONFIG.WAVE.INTERVAL - minutes * 0.035);
            this.spawnCooldown = interval;

            const count = Math.min(
                CONFIG.WAVE.MAX_PER_WAVE,
                CONFIG.WAVE.BASE_COUNT + Math.floor(minutes * CONFIG.WAVE.COUNT_PER_MINUTE) + (this.waveNumber % 3 === 0 ? 1 : 0)
            );

            const scaled = this.getScaledStats(elapsed);
            const cam = this.game.camera;

            for (let i=0;i<count;i++) {
                const typeId = this._pickType(minutes);
                const pos = this._randomSpawnPos(cam);
                // Jitter para no spawnear todos en el mismo pixel
                pos.x += rand(-18, 18); pos.y += rand(-18, 18);
                const enemy = new Enemy(pos.x, pos.y, typeId, scaled);
                this.game.entityManager.add(enemy);
                this.totalSpawned++;
            }
            this.waveNumber++;
            // Sonido sutil cada 3 oleadas
            if (this.waveNumber % 4 === 0) this.game.audio?.spawnWave?.();

            // Evento especial: mini-horda de corredores cada 45s
            if (Math.floor(elapsed) % 45 === 0 && Math.floor(elapsed) !== 0 && this.timer % 1 < dt) {
                // ya spawneada como parte de count, este es extra
                for (let i=0;i<4;i++) {
                    const pos = this._randomSpawnPos(cam);
                    this.game.entityManager.add(new Enemy(pos.x,pos.y,'runner', scaled));
                    this.totalSpawned++;
                }
            }
        }
    }
}
