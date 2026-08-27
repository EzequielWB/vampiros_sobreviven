/**
 * Gem -- Gema de XP
 * PASO 2: Entidad básica para probar magnet y colisiones.
 * Lógica completa de dropeo en PASO 4, aquí solo atracción básica.
 */
import { CONFIG } from '../config.js';
import { dist2 } from '../utils.js';

export class Gem {
    constructor(x, y, value = CONFIG.XP.GEM_VALUE) {
        this.type = 'gem';
        this.x = x; this.y = y;
        this.radius = CONFIG.XP.GEM_RADIUS;
        this.value = value;
        this.alive = true;
        this._phase = Math.random() * Math.PI * 2;
        this._bob = 0;
    }

    update(dt, game) {
        if (!game.player) return;
        const p = game.player;
        const d2 = dist2(this.x, this.y, p.x, p.y);
        const magnetR = p.stats.magnetRadius;
        const pickupR = p.stats.pickupRadius;

        // Atracción si dentro de magnetRadius
        if (d2 < magnetR * magnetR) {
            const d = Math.sqrt(d2) || 1;
            const nx = (p.x - this.x) / d;
            const ny = (p.y - this.y) / d;
            // Acelera al acercarse
            const speed = CONFIG.XP.MAGNET_SPEED * (1.2 - d / magnetR * 0.5);
            this.x += nx * speed * dt;
            this.y += ny * speed * dt;
            // Si muy cerca, recolectar
            if (d < pickupR + this.radius + 6) {
                const leveled = p.gainXP(this.value);
                this.alive = false;
                game.spawnPickupText?.(this.x, this.y, `+${this.value} XP`, '#3B0754');
                if (leveled) {
                    game.triggerLevelUp();
                }
            }
        } else {
            // Flotación idle
            this._bob += dt * 2.5;
        }
    }

    render(ctx, camera) {
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;
        if (sx < -20 || sx > camera.w + 20 || sy < -20 || sy > camera.h + 20) return;

        const bobOff = Math.sin(this._bob + this._phase) * 2.5;
        // Brillo gótico violeta
        ctx.beginPath();
        ctx.arc(sx, sy + bobOff, this.radius + 3, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(59,7,84,0.22)';
        ctx.fill();
        // Gema violeta vacío
        ctx.save();
        ctx.translate(sx, sy + bobOff);
        ctx.rotate(Math.PI/4);
        ctx.fillStyle = '#3B0754';
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1;
        // Diamante cuadrado rotado
        const s = this.radius;
        ctx.beginPath();
        ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0); ctx.closePath();
        ctx.fill(); ctx.stroke();
        // Brillo interno
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.arc(-2, -2, 1.6, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
}
