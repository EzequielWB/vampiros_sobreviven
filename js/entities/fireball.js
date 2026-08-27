/**
 * Fireball -- Bola de Fuego explosiva del Mago
 * Vuela hacia el enemigo más cercano, al impactar o expirar explota en AoE.
 * Usa SpatialGrid para explosión O(k).
 */
import { normalize } from '../utils.js';

export class Fireball {
    constructor(x, y, tx, ty, speed = 285, damage = 34, explosionRadius = 72) {
        this.type = 'projectile'; // se gestiona como proyectil para EntityManager
        this.subType = 'fireball';
        this.x = x; this.y = y;
        this.radius = 14;
        this.damage = damage;
        this.explosionRadius = explosionRadius;
        this.speed = speed;
        this.alive = true;
        this.life = 1.45; // explota sola si no impacta
        this.trail = [];
        const n = normalize(tx - x, ty - y);
        this.vx = n.x * speed;
        this.vy = n.y * speed;
        this.color = '#610C27';
    }

    update(dt, game) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        this.trail.unshift({x:this.x, y:this.y});
        if(this.trail.length>7) this.trail.pop();

        // Fuera de mundo
        if(this.x < -80 || this.x > game.worldWidth+80 || this.y < -80 || this.y > game.worldHeight+80) {
            this.alive = false;
        }
        if(this.life <= 0){
            this.explode(game);
        }
    }

    explode(game){
        if(!this.alive) return;
        this.alive = false;
        // AoE vía grid
        const candidates = game.entityManager.grid.query(this.x, this.y, this.explosionRadius);
        let hits=0;
        for(const e of candidates){
            if(e.type!=='enemy' || !e.alive) continue;
            const dx=e.x-this.x, dy=e.y-this.y;
            if(dx*dx+dy*dy < this.explosionRadius*this.explosionRadius){
                const dmg = Math.ceil(this.damage * (game.player? game.player.stats.damageMultiplier:1));
                const dead = e.takeDamage(dmg);
                game.spawnDamageNumber?.(e.x, e.y-12, `${dmg}`, '#610C27');
                const len=Math.hypot(dx,dy)||1;
                e.applyKnockback(dx/len, dy/len, 45);
                hits++;
                if(dead){
                    game.kills++;
                    if(Math.random()<0.75) game.spawnGemAt?.(e.x, e.y);
                    game.audio?.enemyDeath?.();
                } else {
                    game.audio?.enemyHit?.();
                }
            }
        }
        // Efecto visual de explosión
        game.spawnExplosion?.(this.x, this.y, this.explosionRadius, this.color);
        game.audio?.fireballExplode?.();
        // Si no se pudo dropear por import, fallback a spawn via game
        if(hits===0){
            // aun así sonido
        }
    }

    // Para colisión directa antes de explotar por tiempo
    tryDirectHit(game){
        const candidates = game.entityManager.grid.query(this.x, this.y, this.radius + 14);
        for(const e of candidates){
            if(e.type!=='enemy' || !e.alive) continue;
            const dx=this.x-e.x, dy=this.y-e.y, r=this.radius+e.radius;
            if(dx*dx+dy*dy < r*r){
                this.explode(game);
                return true;
            }
        }
        return false;
    }

    render(ctx, camera){
        const sx=this.x - camera.x, sy=this.y - camera.y;
        if(sx < -40 || sx > camera.w+40 || sy < -40 || sy > camera.h+40) return;
        // estela gótica bordó
        for(let i=0;i<this.trail.length;i++){
            const t=this.trail[i];
            const sxt=t.x - camera.x, syt=t.y - camera.y;
            const a = 0.22 * (1 - i/this.trail.length);
            ctx.fillStyle=`rgba(97,12,39,${a})`;
            ctx.beginPath(); ctx.arc(sxt, syt, this.radius * (1 - i*0.11), 0, Math.PI*2); ctx.fill();
        }
        // núcleo
        ctx.fillStyle='rgba(97,12,39,0.32)';
        ctx.beginPath(); ctx.arc(sx,sy,this.radius+5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=this.color;
        ctx.beginPath(); ctx.arc(sx,sy,this.radius,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.arc(sx-2,sy-2,3,0,Math.PI*2); ctx.fill();
        ctx.font='11px serif'; ctx.textAlign='center'; ctx.fillText('[FIR]', sx, sy+1);
    }
}


