/**
 * Projectile -- Stub PASO 2/3, implementación PASO 4
 * Ya deja la estructura para que EntityManager lo gestione con Grid.
 */
import { normalize } from '../utils.js';

export class Projectile {
    constructor(x, y, targetX, targetY, speed = 360, damage = 12, radius = 6, color = '#48cae4') {
        this.type = 'projectile';
        this.x = x; this.y = y;
        this.radius = radius;
        this.damage = damage;
        this.color = color;
        this.alive = true;
        this.life = 1.6; // segundos antes de desaparecer
        const n = normalize(targetX - x, targetY - y);
        this.vx = n.x * speed;
        this.vy = n.y * speed;
    }

    update(dt, game) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0) this.alive = false;
        // Fuera del mundo
        if (this.x < -60 || this.x > game.worldWidth + 60 || this.y < -60 || this.y > game.worldHeight + 60) {
            this.alive = false;
        }
    }

    render(ctx, camera) {
        const sx = this.x - camera.x, sy = this.y - camera.y;
        if (sx < -20 || sx > camera.w + 20 || sy < -20 || sy > camera.h + 20) return;
        ctx.imageSmoothingEnabled=false;
        // estela pixel 3x3
        ctx.fillStyle = this.color + '44';
        ctx.fillRect(Math.floor(sx - this.vx*0.018)-1, Math.floor(sy - this.vy*0.018)-1, 4, 4);
        // cuerpo pixel 6x6 con borde
        ctx.fillStyle='#000';
        ctx.fillRect(Math.floor(sx)-4, Math.floor(sy)-4, 8, 8);
        ctx.fillStyle=this.color;
        ctx.fillRect(Math.floor(sx)-3, Math.floor(sy)-3, 6, 6);
        // brillo pixel 2x2
        ctx.fillStyle='rgba(255,255,255,0.85)';
        ctx.fillRect(Math.floor(sx)-2, Math.floor(sy)-2, 2, 2);
    }
}
