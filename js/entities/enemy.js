/**
 * Enemy -- PASO 3: Variaciones (grunt/tank/runner/shooter) + IA steering
 */
import { CONFIG } from '../config.js';
import { normalize } from '../utils.js';
import { SPRITES, drawPixelSprite } from '../pixelSprites.js';

export class Enemy {
    constructor(x, y, typeId = 'grunt', scaledStats = null) {
        this.type = 'enemy';
        this.reset(x,y,typeId,scaledStats);
    }
    reset(x, y, typeId = 'grunt', scaledStats = null){
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
        // limpiar grid keys
        this._gridKey = null; this._gridCol=0; this._gridRow=0;
        // Comportamientos especiales
        this.elite = !!def.elite;
        this.suicide = !!def.suicide;
        this.swarm = !!def.swarm;
        this.support = !!def.support;
        this.auraTimer = 0;
        if (this.elite) this.auraTimer = this.def.auraTick;
        this.swarmSplits = 0;
        this.swarmTotal = def.swarmMembers || 3;
        // Support buff
        this.buffTimer = 0;
        this.exploded = false;
        // Berserker: carga (dash)
        this.charge = !!def.charge;
        this.chargeTimer = def.chargeCooldown || 2.6;
        this._charging = false;
        this._chargeDirX = 0; this._chargeDirY = 0;
        // Elite spawner (Señor Brujo)
        this.spawner = !!def.spawner;
        this.spawnTimer = def.spawnInterval || 7;
        // Aura hex de area (Señor Brujo)
        this.hexAreaTimer = 0;
        return this;
    }

    update(dt, game) {
        if (!game.player || !game.player.alive) { this.wobble+=dt*1.8; this.x+=Math.cos(this.wobble)*6*dt; return; }
        if (this.stun > 0) { this.stun -= dt; return; }

        const dx = game.player.x - this.x, dy = game.player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        const nx = dx / dist, ny = dy / dist;

        // SUPPORT BUFF: re-evaluar periódicamente si hay un support cerca
        this._buffCheck = (this._buffCheck||0) - dt;
        if (this._buffCheck <= 0) {
            this._buffCheck = 0.4;
            this._hasBuff = false;
            this._dmgBuff = 0;
            const sr = 175;
            const cands = game.entityManager?.grid?.query(this.x, this.y, sr);
            if (cands) {
                for (const c of cands) {
                    if (c.type==='enemy' && c.support && c.alive) {
                        const d2 = (c.x-this.x)*(c.x-this.x)+(c.y-this.y)*(c.y-this.y);
                        if (d2 < (c.def?.supportRadius||170)*(c.def?.supportRadius||170)) {
                            this._hasBuff = true;
                            this._dmgBuff = c.def?.dmgBuff || 0.5;
                            break;
                        }
                    }
                }
            }
        }
        const buffMult = this._hasBuff ? (1 + (this.def?.spdBuff || 0.35)) : 1;

        // SUICIDA: corre hacia el jugador y explota por contacto
        if (this.suicide) {
            this.speed = this.def.spdMul * CONFIG.ENEMY.BASE_SPEED * 1.1;
            this.wobble += dt*6;
            this.x += nx * this.speed * buffMult * dt;
            this.y += ny * this.speed * buffMult * dt;
            if (dist < (this.def.fuseDist || 34)) {
                this._explode(game);
            }
            if (this.hitFlash > 0) this.hitFlash -= dt;
            return;
        }

        // BERSERKER: carga periodica (dash de alta velocidad / dano)
        if (this.charge) {
            this.chargeTimer -= dt;
            if (this._charging) {
                // Movimiento de carga en linea recta con impulso
                this.x += this._chargeDirX * CONFIG.ENEMY.BASE_SPEED * (this.def.chargeSpeed || 5.2) * dt;
                this.y += this._chargeDirY * CONFIG.ENEMY.BASE_SPEED * (this.def.chargeSpeed || 5.2) * dt;
                // La carga termina tras un breve tramo
                this._chargeTime = (this._chargeTime || 0) + dt;
                if (this._chargeTime >= 0.55) {
                    this._charging = false;
                    this.chargeTimer = this.def.chargeCooldown || 2.6;
                }
            } else {
                // Se acerca lentamente preparandose
                this.x += nx * this.speed * buffMult * 0.6 * dt;
                this.y += ny * this.speed * buffMult * 0.6 * dt;
                if (this.chargeTimer <= 0 && dist < 320) {
                    // comenzar carga hacia donde esta el jugador
                    this._charging = true;
                    this._chargeTime = 0;
                    const cl = Math.hypot(dx, dy) || 1;
                    this._chargeDirX = dx / cl; this._chargeDirY = dy / cl;
                    game.spawnDamageNumber?.(this.x, this.y - this.radius - 8, '¡CARGA!', '#FDB47E');
                    game.audio?.spawnWave?.();
                }
            }
            if (this.hitFlash > 0) this.hitFlash -= dt;
            return;
        }

        if (this.isRanged) {
            // Mantener distancia: si está muy cerca, acercarse lento; si está a 160-220, quedarse y disparar
            const ideal = 185;
            const diff = dist - ideal;
            // Movimiento amortiguado
            const moveFactor = Math.abs(diff) > 35 ? Math.sign(diff) * 0.55 : 0;
            this.x += nx * this.speed * moveFactor * buffMult * dt;
            this.y += ny * this.speed * moveFactor * buffMult * dt;

            this.shootTimer -= dt;
            if (this.shootTimer <= 0 && dist < 520 && dist > 40) {
                this.shootTimer = this.def.shootCooldown + randRange(-0.25, 0.35);
                this._shoot(game);
            }
        } else {
            this.x += nx * this.speed * buffMult * dt;
            this.y += ny * this.speed * buffMult * dt;
        }

        // ELITE: aura de daño periódico al jugador
        if (this.elite) {
            this.auraTimer -= dt;
            if (this.auraTimer <= 0) {
                this.auraTimer = this.def.auraTick || 0.8;
                if (dist < (this.def.auraRadius || 95)) {
                    const dmg = Math.max(4, Math.floor(this.damage * 0.5));
                    const dealt = game.player.takeDamage?.(dmg, game);
                    if (dealt > 0) {
                        game.spawnDamageNumber?.(game.player.x, game.player.y-18, `-${Math.ceil(dealt)}`, '#e63946');
                        game.audio?.hurt?.();
                    }
                }
            }
        }
        // ELITE SPAWNER (Señor Brujo): invoca refuerzos y maldice en area
        if (this.spawner) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                this.spawnTimer = this.def.spawnInterval || 7;
                if (dist < 480) {
                    const acq = game.entityManager?.acquireEnemy;
                    const scaled = { hp: Math.max(12, this.maxHp * 0.06), damage: this.damage * 0.6, speed: CONFIG.ENEMY.BASE_SPEED };
                    for (let i = 0; i < (this.def.spawnCount || 4); i++) {
                        const ang = Math.random() * Math.PI * 2;
                        const rr = 24 + Math.random() * 40;
                        const sx = this.x + Math.cos(ang) * rr, sy = this.y + Math.sin(ang) * rr;
                        const t = Math.random() < 0.5 ? 'grunt' : 'runner';
                        if (acq) acq(sx, sy, t, scaled);
                        else game.entityManager?.add?.(new Enemy(sx, sy, t, scaled));
                    }
                    game.spawnExplosion?.(this.x, this.y, 60, '#6D28D9');
                    game.audio?.spawnWave?.();
                }
            }
            // Hex en area: debilita al jugador que este dentro
            if (game.player && dist < (this.def.hexRadius || 120)) {
                game.player.applyHex?.(1.5, 1);
            }
        }

        // ENJAMBRE: se divide al recibir daño (suelta un miembro por cada fracción de HP perdida)
        if (this.swarm && !this._swarmDead) {
            const membersLeft = this.swarmTotal - this.swarmSplits;
            const pct = this.hp / this.maxHp;
            const splitPoint = 1 - (this.swarmSplits+1) / this.swarmTotal;
            if (membersLeft > 0 && pct < splitPoint - 0.001) {
                this._splitSwarm(game);
            }
        }

        if (this.hitFlash > 0) this.hitFlash -= dt;
    }

    _explode(game){
        if (this.exploded) return;
        this.exploded = true;
        this.alive = false;
        const r = this.def.explodeRadius || 62;
        const dmg = Math.ceil((this.def.explodeDamage || 30) * 1);
        // Daño al jugador si está en radio
        const p = game.player;
        if (p && p.alive){
            const dx = p.x - this.x, dy = p.y - this.y;
            const dist = Math.hypot(dx,dy) || 1;
            if (dist < r + p.radius){
                const dealt = p.takeDamage?.(dmg, game);
                if (dealt > 0) game.spawnDamageNumber?.(p.x, p.y-18, `-${Math.ceil(dealt)}`, '#F59E0B');
            }
            // Daño a otros enemigos cercanos (explosión en cadena)
            const candidates = game.entityManager?.grid?.query(this.x, this.y, r);
            if (candidates){
                for (const e of candidates){
                    if (e===this || e.type!=='enemy' || !e.alive) continue;
                    const dx2 = e.x-this.x, dy2 = e.y-this.y;
                    const d2 = dx2*dx2+dy2*dy2;
                    if (d2 < r*r){
                        e.takeDamage(dmg);
                        if(!e.alive && game.kills!==undefined){ game.kills++; if(Math.random()<0.5) game.spawnGemAt?.(e.x,e.y); }
                    }
                    const len = Math.hypot(dx2,dy2)||1;
                    e.applyKnockback?.(dx2/len, dy2/len, 90);
                }
            }
        }
        game.spawnExplosion?.(this.x, this.y, r, '#F59E0B');
        game.audio?.fireballExplode?.();
        if (Math.random() < 0.8) game.spawnGemAt?.(this.x, this.y);
    }

    _splitSwarm(game){
        // Suelta un grunt cercano como entidad independiente
        const ang = Math.random()*Math.PI*2, r = 14+Math.random()*12;
        const sx = this.x + Math.cos(ang)*r, sy = this.y + Math.sin(ang)*r;
        if (game.entityManager?.acquireEnemy){
            game.entityManager.acquireEnemy(sx, sy, 'grunt', {
                hp: Math.max(10, this.maxHp*0.5),
                damage: this.damage,
                speed: CONFIG.ENEMY.BASE_SPEED
            });
        }
        this.swarmSplits++;
    }

    _shoot(game) {
        // Crear proyectil enemigo hacia jugador
        const p = game.player;
        const speed = this.def.projSpeed || 210;
        const dmg = Math.max(4, Math.floor(this.damage * 0.85));
        // Import dinámico evitado: Game tiene método spawnEnemyProjectile
        game.spawnEnemyProjectile?.(this.x, this.y, p.x, p.y, speed, dmg, this.color, { pierce: !!this.def.pierce, hex: !!this.def.hex });
        game.audio?.shoot?.();
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.hitFlash = 0.14;
        if (this.hp <= 0) { this.alive = false; if (this.elite) this._eliteShouldDrop = true; return true; }
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
        const map={ grunt:'grunt', tank:'tank', runner:'runner', shooter:'shooter', elite:'elite', suicide:'suicide', swarm:'swarm', support:'support', piercer:'piercer', hexer:'hexer', berserker:'berserker', elite_colossus:'elite_colossus', elite_hexlord:'elite_hexlord' };
        const key=map[this.enemyType]||'grunt';
        const sprite=SPRITES[key]||SPRITES.grunt;
        const big = this.enemyType==='elite'||this.enemyType==='elite_colossus'||this.enemyType==='elite_hexlord';
        const scale=big?2.5:this.enemyType==='tank'?2.5:this.enemyType==='runner'||this.enemyType==='suicide'?1.7:this.enemyType==='swarm'||this.enemyType==='berserker'?2.2:2.0;
        drawPixelSprite(ctx, sprite, sx, sy, scale, false, this.hitFlash>0);
        // Halo tirador
        if (this.isRanged) {
            ctx.strokeStyle=this.def.pierce?'rgba(96,165,250,0.95)':this.def.hex?'rgba(192,132,252,0.95)':'rgba(59,7,84,0.95)';
            ctx.lineWidth=1.4;
            ctx.beginPath(); ctx.arc(sx, sy, this.radius+6, -0.45, 0.45); ctx.stroke();
            ctx.fillStyle=this.def.pierce?'#60A5FA':this.def.hex?'#C084FC':'#3B0754';
            ctx.beginPath(); ctx.arc(sx+7, sy-9, 2, 0, Math.PI*2); ctx.fill();
        }
        // Aura de maldicion del hexer (debuff)
        if (this.def.hex) {
            ctx.strokeStyle='rgba(192,132,252,0.5)'; ctx.lineWidth=1.3;
            ctx.setLineDash([4,5]);
            ctx.beginPath(); ctx.arc(sx, sy, this.radius+16, 0, Math.PI*2); ctx.stroke();
            ctx.setLineDash([]);
        }
        // Halo del señor brujo (area hex + spawn)
        if (this.enemyType==='elite_hexlord') {
            ctx.strokeStyle='rgba(109,40,217,0.6)'; ctx.lineWidth=1.8;
            ctx.setLineDash([6,5]);
            ctx.beginPath(); ctx.arc(sx, sy, this.def.hexRadius || 120, 0, Math.PI*2); ctx.stroke();
            ctx.setLineDash([]);
        }
        // Indicador de carga del berserker
        if (this.charge && this._charging) {
            ctx.strokeStyle='rgba(253,180,126,0.8)'; ctx.lineWidth=2;
            ctx.beginPath(); ctx.arc(sx, sy, this.radius+5, 0, Math.PI*2); ctx.stroke();
        }
        // Halo de aura del elite (daño)
        if (this.elite) {
            ctx.strokeStyle='rgba(220,38,38,0.55)'; ctx.lineWidth=1.6;
            ctx.setLineDash([5,5]);
            ctx.beginPath(); ctx.arc(sx, sy, this.def.auraRadius || 95, 0, Math.PI*2); ctx.stroke();
            ctx.setLineDash([]);
        }
        // Halo de buff del support
        if (this.support) {
            ctx.strokeStyle='rgba(167,139,250,0.5)'; ctx.lineWidth=1.3;
            ctx.setLineDash([4,5]);
            ctx.beginPath(); ctx.arc(sx, sy, this.def.supportRadius || 170, 0, Math.PI*2); ctx.stroke();
            ctx.setLineDash([]);
        }
        // Suicida parpadea (indica peligro de explosión)
        if (this.suicide && Math.floor(this.wobble*8)%2===0) {
            ctx.fillStyle='rgba(245,158,11,0.35)';
            ctx.beginPath(); ctx.arc(sx, sy, this.radius+4, 0, Math.PI*2); ctx.fill();
        }
        if (this.hp < this.maxHp) {
            const w=this.radius*2.2, h=4, pct=Math.max(0,this.hp/this.maxHp);
            ctx.fillStyle='#000'; ctx.fillRect(sx-w/2-1, sy-this.radius-11-1, w+2, h+2);
            ctx.fillStyle='rgba(0,0,0,0.62)'; ctx.fillRect(sx-w/2, sy-this.radius-11, w, h);
            ctx.fillStyle = this.elite ? '#FFBE0B' : this.def.id==='tank' ? '#7A1432' : pct>0.5?'#610C27':pct>0.25?'#3B0754':'#45081C';
            ctx.fillRect(sx-w/2, sy-this.radius-11, w*pct, h);
        }
        if (this.isRanged && this.shootTimer < 0.35) {
            ctx.fillStyle='rgba(255,255,255,0.95)';
            ctx.fillRect(sx-1, sy - this.radius - 16, 2, 2);
        }
    }
}

function randRange(a,b){ return a + Math.random()*(b-a); }
