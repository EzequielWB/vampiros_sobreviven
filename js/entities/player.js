/**
 * Player -- PASO 2: Implementación completa con deltaTime + iFrames + facing
 */
import { CONFIG } from '../config.js';
import { clamp } from '../utils.js';
import { SPRITES, drawPixelSprite } from '../pixelSprites.js';

export class Player {
    constructor(x, y, classId = 'caballero') {
        this.type = 'player';
        this.x = x; this.y = y;
        this.vx = 0; this.vy = 0;
        this.radius = CONFIG.PLAYER.SIZE;
        this.alive = true;

        this.classId = classId;
        this.classData = CONFIG.PLAYER.CLASSES[classId] || CONFIG.PLAYER.CLASSES.caballero;

        this.stats = this._buildStats(classId);
        this.hp = this.stats.maxHealth;
        this.level = 1;
        this.xp = 0;
        this.xpToNext = CONFIG.XP.FORMULA(this.level);

        this.world = { w: CONFIG.CANVAS.WIDTH, h: CONFIG.CANVAS.HEIGHT };

        this.weapons = [];
        this.facing = 1; // 1 derecha, -1 izquierda
        this.invulnerable = 0;
        this.hitFlash = 0;

        // Escudo exclusivo caballero
        this.shieldCharges = 0;
        this.shieldMaxCharges = 0;
        this.shieldCooldown = 0;
        this.shieldActive = false;
        this._garlicBonus = 0;
        this._fireballBonus = { dmg: 0, radius: 0, cd: 0 };
        this._shieldCdBonus = 0;
        if (this.classId === 'caballero') this.initShield();
    }

    _buildStats(classId) {
        const base = CONFIG.PLAYER.BASE;
        const mod = (CONFIG.PLAYER.CLASSES[classId]?.modifiers) || {};
        return {
            maxHealth: base.maxHealth + (mod.maxHealth || 0),
            moveSpeed: base.moveSpeed + (mod.moveSpeed || 0),
            magnetRadius: base.magnetRadius,
            armor: base.armor + (mod.armor || 0),
            cooldownReduction: clamp(base.cooldownReduction + (mod.cooldownReduction || 0), 0, 0.6),
            damageMultiplier: base.damageMultiplier * (mod.damageMultiplier || 1),
            projectileCount: base.projectileCount + (mod.projectileCount || 0),
            critChance: base.critChance + (mod.critChance || 0),
            critDamage: base.critDamage,
            pickupRadius: base.pickupRadius
        };
    }

    update(dt, game) {
        const input = game.input.getMovementVector();
        const speed = this.stats.moveSpeed;

        this.vx = input.x * speed;
        this.vy = input.y * speed;

        // Facing para armas frontales
        if (input.x > 0.1) this.facing = 1;
        else if (input.x < -0.1) this.facing = -1;

        // Movimiento independiente de FPS: pos += vel * deltaTime
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        const margin = 32;
        const W = game.worldWidth || CONFIG.CANVAS.WIDTH;
        const H = game.worldHeight || CONFIG.CANVAS.HEIGHT;
        this.x = clamp(this.x, margin, W - margin);
        this.y = clamp(this.y, margin, H - margin);

        if (this.invulnerable > 0) this.invulnerable -= dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;

        // escudo caballero
        this.updateShield(dt, game);
    }

    takeDamage(amount, game = null) {
        // Escudo del caballero: bloquea 1 golpe por carga
        if (this.shieldActive && this.shieldCharges > 0) {
            this.shieldCharges -= 1;
            if (this.shieldCharges <= 0) {
                this.shieldActive = false;
                // iniciar cooldown de recarga
                const baseCd = (CONFIG.PLAYER.CLASSES[this.classId]?.specialMods?.shieldCooldown) || 11;
                this.shieldCooldown = Math.max(4, baseCd * (1 - this.stats.cooldownReduction) - (this._shieldCdBonus||0));
            }
            this.hitFlash = 0.18;
            // feedback sin daño
            if (game) {
                game.spawnDamageNumber?.(this.x, this.y - 16, 'BLOQUEO', '#610C27');
                game.audio?.shieldBlock?.();
                game.spawnShieldBreak?.(this.x, this.y);
            }
            return 0;
        }
        if (this.invulnerable > 0) return 0;
        const mitigated = Math.max(1, amount - this.stats.armor);
        this.hp -= mitigated;
        this.invulnerable = 0.6;
        this.hitFlash = 0.22;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
        return mitigated;
    }

    // Llamado por Game para gestionar respawn de escudo
    updateShield(dt, game){
        if(this.classId !== 'caballero') return;
        if(this.shieldActive) return;
        if(this.shieldCooldown > 0){
            this.shieldCooldown -= dt;
            if(this.shieldCooldown <= 0){
                this.shieldCharges = this.shieldMaxCharges || 1;
                this.shieldActive = true;
                this.shieldCooldown = 0;
                game?.spawnDamageNumber?.(this.x, this.y - 22, 'ESCUDO!', '#610C27');
                game?.audio?.shieldUp?.();
            }
        }
    }

    initShield(){
        if(this.classId !== 'caballero') return;
        const mods = CONFIG.PLAYER.CLASSES.caballero.specialMods;
        this.shieldMaxCharges = mods.shieldCharges || 1;
        this.shieldCharges = this.shieldMaxCharges;
        this.shieldActive = true;
        this.shieldCooldown = 0;
    }

    gainXP(amount) {
        this.xp += amount;
        let leveled = false;
        while (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level += 1;
            this.xpToNext = CONFIG.XP.FORMULA(this.level);
            leveled = true;
        }
        return leveled;
    }

    heal(amount) { this.hp = clamp(this.hp + amount, 0, this.stats.maxHealth); }

    render(ctx, camera) {
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;
        if (this.invulnerable > 0 && Math.floor(this.invulnerable * 16) % 2 === 0) return;
        // Sombra pixel
        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        ctx.fillRect(sx - 10, sy + 16, 20, 4);
        // Aura magnet
        if (this.stats.magnetRadius > 0) {
            ctx.strokeStyle = this.hitFlash > 0 ? 'rgba(97,12,39,0.42)' : 'rgba(59,7,84,0.10)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 6]);
            ctx.beginPath(); ctx.arc(sx, sy, this.stats.magnetRadius, 0, Math.PI*2); ctx.stroke();
            ctx.setLineDash([]);
        }
        const sprite = SPRITES[this.classId] || SPRITES.caballero;
        const flip = this.facing < 0;
        const flash = this.hitFlash > 0;
        drawPixelSprite(ctx, sprite, sx, sy - 1, 2, flip, flash);

        // Barra vida pixel
        if (this.hp < this.stats.maxHealth) {
            const w = 36, h = 6;
            const pct = this.hp / this.stats.maxHealth;
            ctx.fillStyle = '#000';
            ctx.fillRect(sx - w/2 - 1, sy - 22 - 1, w + 2, h + 2);
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(sx - w/2, sy - 22, w, h);
            ctx.fillStyle = pct > 0.5 ? '#610C27' : pct > 0.25 ? '#7A1432' : '#3B0754';
            ctx.fillRect(sx - w/2, sy - 22, Math.ceil(w * pct), h);
            // brillo
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.fillRect(sx - w/2, sy - 22, Math.ceil(w * pct), 1);
        }
    }
}
