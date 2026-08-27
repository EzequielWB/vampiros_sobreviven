/**
 * Enemy -- PASO 3: Variaciones (grunt/tank/runner/shooter) + IA steering
 */
import { CONFIG } from '../config.js';
import { normalize } from '../utils.js';
import { SPRITES, drawPixelSprite } from '../pixelSprites.js';

export class Enemy {
    constructor(x, y, typeId = 'grunt', scaledStats = null) {
        this.type = 'enemy';
        this.x = x; this.y = y;
        this.enemyType = typeId;
        const def = CONFIG.ENEMY.TYPES[typeId] || CONFIG.ENEMY.TYPES.grunt;
        this.def = def;
        this.radius = def.radius;
        this.alive = true;
        this.isRanged = !!def.ranged;

        const s = scaledStats || { hp: CONFIG.ENEMY.BASE_HP, damage: CONFIG.ENEMY.BASE_DAMAGE, speed: CONFIG.ENEMY.BASE_SPEED };
        this.maxHp = Math.floor(s.hp * def.hpMul);
        this.hp = this.maxHp;
        this.damage = Math.max(2, Math.floor(s.damage * def.dmgMul));
        this.speed = Math.min(CONFIG.ENEMY.SCALING.maxSpeed, s.speed * def.spdMul) * (0.94 + Math.random()*0.12);

        this.emoji = def.emoji;
        this.color = def.color;
        this.xpValue = def.xp || 12;

        this.hitFlash = 0;
        this.stun = 0;
        this.shootTimer = def.ranged ? (0.4 + Math.random()*0.8) : 0;
        this.wobble = Math.random()*Math.PI*2;
    }

    update(dt, game) {
        if (!game.player || !game.player.alive) { this.wobble+=dt*1.8; this.x+=Math.cos(this.wobble)*6*dt; return; }
        if (this.stun > 0) { this.stun -= dt; return; }

        const dx = game.player.x - this.x, dy = game.player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        const nx = dx / dist, ny = dy / dist;

        if (this.isRanged) {
            // Mantener distancia: si está muy cerca, acercarse lento; si está a 160-220, quedarse y disparar
            const ideal = 185;
            const diff = dist - ideal;
            // Movimiento amortiguado
            const moveFactor = Math.abs(diff) > 35 ? Math.sign(diff) * 0.55 : 0;
            this.x += nx * this.speed * moveFactor * dt;
            this.y += ny * this.speed * moveFactor * dt;

            this.shootTimer -= dt;
            if (this.shootTimer <= 0 && dist < 520 && dist > 40) {
                this.shootTimer = this.def.shootCooldown + randRange(-0.25, 0.35);
                this._shoot(game);
            }
        } else {
            this.x += nx * this.speed * dt;
            this.y += ny * this.speed * dt;
        }
        if (this.hitFlash > 0) this.hitFlash -= dt;
    }

    _shoot(game) {
        // Crear proyectil enemigo hacia jugador
        const p = game.player;
        const speed = this.def.projSpeed || 210;
        const dmg = Math.max(4, Math.floor(this.damage * 0.85));
        // Import dinámico evitado: Game tiene método spawnEnemyProjectile
        game.spawnEnemyProjectile?.(this.x, this.y, p.x, p.y, speed, dmg, this.color);
        game.audio?.shoot?.();
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.hitFlash = 0.14;
        if (this.hp <= 0) { this.alive = false; return true; }
        return false;
    }

    applyKnockback(dirX, dirY, force=60) {
        this.x += dirX * force * 0.14;
        this.y += dirY * force * 0.14;
        this.stun = 0.07;
    }

    render(ctx, camera) {
        const sx = this.x - camera.x, sy = this.y - camera.y;
        if (sx < -48 || sx > camera.w+48 || sy < -48 || sy > camera.h+48) return;
        // sombra pixel
        ctx.fillStyle='rgba(0,0,0,0.32)';
        const shW=this.radius*1.7, shH=4;
        ctx.fillRect(sx - shW/2, sy + this.radius + 2, shW, shH);
        // sprite pixel -- más grande en mobile
        const map={ grunt:'grunt', tank:'tank', runner:'runner', shooter:'shooter' };
        const key=map[this.enemyType]||'grunt';
        const sprite=SPRITES[key]||SPRITES.grunt;
        const isMobile = (typeof window !== 'undefined' && window.innerWidth < 860);
        const base = this.enemyType==='tank'?2.3:this.enemyType==='runner'?1.7:2.0;
        const scale = isMobile ? base * 1.35 : base;
        drawPixelSprite(ctx, sprite, sx, sy, scale, false, this.hitFlash>0);
        // halo tirador
        if (this.isRanged) {
            ctx.strokeStyle='rgba(59,7,84,0.95)'; ctx.lineWidth=1.4;
            ctx.beginPath(); ctx.arc(sx, sy, this.radius+6, -0.45, 0.45); ctx.stroke();
            ctx.fillStyle='#3B0754';
            ctx.beginPath(); ctx.arc(sx+7, sy-9, 2, 0, Math.PI*2); ctx.fill();
        }
        if (this.hp < this.maxHp) {
            const w=this.radius*2.2, h=4, pct=Math.max(0,this.hp/this.maxHp);
            ctx.fillStyle='#000'; ctx.fillRect(sx-w/2-1, sy-this.radius-11-1, w+2, h+2);
            ctx.fillStyle='rgba(0,0,0,0.62)'; ctx.fillRect(sx-w/2, sy-this.radius-11, w, h);
            ctx.fillStyle = this.def.id==='tank' ? '#7A1432' : pct>0.5?'#610C27':pct>0.25?'#3B0754':'#45081C';
            ctx.fillRect(sx-w/2, sy-this.radius-11, w*pct, h);
        }
        if (this.isRanged && this.shootTimer < 0.35) {
            ctx.fillStyle='rgba(255,255,255,0.95)';
            ctx.fillRect(sx-1, sy - this.radius - 16, 2, 2);
        }
    }
}

function randRange(a,b){ return a + Math.random()*(b-a); }
