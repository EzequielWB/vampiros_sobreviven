/**
 * Game -- PASO 4+5: Roles exclusivos (Aura solo Pícaro, Escudo Caballero, Bola Mago) + combate completo + nivel
 */
import { CONFIG, GameState } from './config.js';
import { InputManager } from './inputManager.js';
import { EntityManager } from './entityManager.js';
import { WaveDirector } from './systems/waveDirector.js';
import { WeaponSystem } from './systems/weaponSystem.js';
import { UIHandler } from './uiHandler.js';
import { Player } from './entities/player.js';
import { Enemy } from './entities/enemy.js';
import { EnemyProjectile } from './entities/enemyProjectile.js';
import { Gem } from './entities/gem.js';
import { Projectile } from './entities/projectile.js';
import { Fireball } from './entities/fireball.js';
import { Shield } from './entities/shield.js';
import { AudioManager } from './audioManager.js';
import { formatTime } from './utils.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = GameState.MENU;
        this.lastClass = 'caballero';

        this.elapsed = 0;
        this.kills = 0;

        this.camera = { x: 0, y: 0, w: canvas.width, h: canvas.height };
        this.worldWidth = 2600;
        this.worldHeight = 1600;

        this.input = new InputManager();
        this.entityManager = new EntityManager(CONFIG.GRID.CELL_SIZE);
        this.waveDirector = new WaveDirector(this);
        this.weaponSystem = new WeaponSystem(this);
        this.ui = new UIHandler(this);
        this.audio = new AudioManager();

        this._lastTime = 0;
        this._rafId = null;
        this.player = null;

        this.floatingTexts = [];
        this.explosions = []; // {x,y,r,life,maxLife}
        this.shieldBreaks = []; // {x,y,life}
        // Timers de armas por clase (automáticas) -- técnicas exclusivas
        this._timers = { whip: 0, wand: 0, dagger: 0, garlic: 0, shield: 0, fireball: 0 };
        this._whipFlash = 0;
        this._whipAngle = 0;
        this._garlicPulse = 0;
        this._shieldPulse = 0;

        this.loop = this.loop.bind(this);
        this._onResize = this._onResize.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onPointerDown = this._onPointerDown.bind(this);
    }

    init() {
        this.input.init();
        this.ui.init();
        this._setupCanvas();
        this._onResize();
        window.addEventListener('resize', this._onResize);
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('mousedown', this._onPointerDown);
        // touch para audio resume
        window.addEventListener('touchstart', () => this.audio.resume(), { once: true });

        this.setState(GameState.MENU);
        this._lastTime = performance.now();
        this._rafId = requestAnimationFrame(this.loop);

        console.log(`%c${CONFIG.TITLE} -- PASO 3`, 'color:#ffbe0b;font-weight:bold;font-size:13px');
        console.log('[PASO 3] Oleadas en bordes + escalado/minuto + 4 tipos enemigos + roles diferenciados + audio sintético');
        console.log('Roles: Caballero (Espada arco) | Mago (Varita auto) | Pícaro (Dagas + Aura)');
        console.log('Controles: WASD mover | G grid | T stress 120 | P/ESC pausa | ESPACIO: reiniciar (en GameOver)');
    }

    _setupCanvas() {
        const isMobile = window.innerWidth < 860;
        const rawDpr = window.devicePixelRatio || 1;
        const dpr = isMobile ? Math.min(rawDpr, 1.5) : Math.min(rawDpr, 2);
        const rect = this.canvas.getBoundingClientRect();
        const w = rect.width || this.canvas.parentElement.clientWidth || CONFIG.CANVAS.WIDTH;
        const h = rect.height || w * 9/16;
        this.canvas.width = Math.floor(CONFIG.CANVAS.WIDTH * dpr);
        this.canvas.height = Math.floor(CONFIG.CANVAS.HEIGHT * dpr);
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // En mobile, zoom 1.33x para que no se vea chiquito
        this.logicalWidth = isMobile ? 960 : CONFIG.CANVAS.WIDTH;
        this.logicalHeight = isMobile ? 540 : CONFIG.CANVAS.HEIGHT;
        this.camera.w = this.logicalWidth;
        this.camera.h = this.logicalHeight;
        this.camera.h = this.logicalHeight;
    }

    _onResize() {
        this._setupCanvas();
        if (!this.player) {
            this.camera.x = (this.worldWidth - this.logicalWidth) / 2;
            this.camera.y = (this.worldHeight - this.logicalHeight) / 2;
        }
    }

    _onPointerDown() {
        this.audio.resume();
    }

    _onKeyDown(e) {
        const k = e.key.toLowerCase();
        this.audio.resume();

        if (k === 'p' || k === 'escape') {
            if (this.state === GameState.GAMEPLAY) { this.setState(GameState.PAUSED); this.audio.pause(); }
            else if (this.state === GameState.PAUSED) this.setState(GameState.GAMEPLAY);
            else if (this.state === GameState.GAME_OVER) this.setState(GameState.MENU);
            return;
        }
        if (k === 'g') {
            CONFIG.GRID.DEBUG_DRAW = !CONFIG.GRID.DEBUG_DRAW;
        }
        if (k === 'm') {
            const muted = this.audio.toggleMute();
            this.spawnPickupText(this.player ? this.player.x : this.worldWidth/2, this.player ? this.player.y-30 : this.worldHeight/2, muted ? '[MUT] SILENCIO' : '[SND] SONIDO', '#ffbe0b');
        }
        if (k === 't' && this.state === GameState.GAMEPLAY) {
            this._stressTest(120);
        }
        // ESPACIO ahora es REINICIAR en GameOver, no ataque
        if (k === ' ' || k === 'spacebar') {
            if (this.state === GameState.GAME_OVER) {
                e.preventDefault();
                this.startGame(this.lastClass);
                return;
            }
            if (this.state === GameState.MENU) return;
            // En gameplay ya no hace nada (ataque es automático)
            e.preventDefault();
        }
        if (k === 'l' && this.state === GameState.GAMEPLAY) {
            this.spawnGemBurst(this.player.x, this.player.y, 8);
        }
        if (k === 'enter' && this.state === GameState.GAME_OVER) {
            this.startGame(this.lastClass);
        }
    }

    setState(newState) {
        if (this.state === newState) return;
        const prev = this.state;
        this.state = newState;
        this.ui.showState(newState);
        console.log(`[State] ${prev} -> ${newState}`);
        if (newState === GameState.GAME_OVER) {
            this.audio.gameOver();
            this.ui.showGameOver({ time: this.elapsed, kills: this.kills, level: this.player?.level || 1 });
        }
        if (newState === GameState.PAUSED) this.audio.pause();
        const wantJoy = (newState === GameState.GAMEPLAY);
        this.input.setJoystickVisible?.(wantJoy);
        const container = document.getElementById('game-container');
        if(container){
            const isMenu = (newState===GameState.MENU || newState===GameState.CLASS_SELECT);
            container.classList.toggle('menu-mode', isMenu && window.innerWidth < 860);
        }
        document.body.classList.toggle('gameplay', wantJoy);
        document.body.classList.toggle('menu', !wantJoy);
    }

    startGame(classId = 'caballero') {
        this.lastClass = classId;
        this.elapsed = 0;
        this.kills = 0;
        this.floatingTexts = [];
        this.explosions = [];
        this.shieldBreaks = [];
        this._timers = { whip: 0.35, wand: 0.28, dagger: 0.2, garlic: 0, shield: 1.0, fireball: 1.2 };
        this._whipFlash = 0;
        this._garlicPulse = 0;
        this._shieldPulse = 0;

        this.entityManager = new EntityManager(CONFIG.GRID.CELL_SIZE);
        this.waveDirector = new WaveDirector(this);
        this.weaponSystem = new WeaponSystem(this);

        const px = this.worldWidth / 2, py = this.worldHeight / 2;
        this.player = new Player(px, py, classId);
        this.entityManager.setPlayer(this.player);

        // Armas iniciales por clase -- técnicas exclusivas
        if (classId === 'mago') this.player.weapons = ['wand','fireball'];
        else if (classId === 'caballero') this.player.weapons = ['whip','shield'];
        else this.player.weapons = ['dagger','garlic']; // pícaro: dagas + aura exclusiva

        this.spawnGemBurst(px + 90, py, 3);
        this.spawnGemBurst(px - 80, py - 60, 2);

        this.audio.resume();
        this.setState(GameState.GAMEPLAY);
        this._centerCamera(true);
    }

    _centerCamera(immediate=false){
        if(!this.player) return;
        const tx = this.player.x - this.logicalWidth/2, ty = this.player.y - this.logicalHeight/2;
        if(immediate){ this.camera.x=tx; this.camera.y=ty; }
        else { this.camera.x += (tx - this.camera.x)*0.12; this.camera.y += (ty - this.camera.y)*0.12; }
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.worldWidth - this.logicalWidth));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.worldHeight - this.logicalHeight));
    }

    spawnDamageNumber(x,y,text,color='#fff'){ this.floatingTexts.push({x,y,vy:-44,life:0.75,maxLife:0.75,text,color}); }
    spawnPickupText(x,y,text,color){ this.spawnDamageNumber(x,y,text,color); }
    spawnGemBurst(x,y,count=3){
        for(let i=0;i<count;i++){ const ang=Math.random()*Math.PI*2, r=18+Math.random()*26; this.entityManager.add(new Gem(x+Math.cos(ang)*r, y+Math.sin(ang)*r)); }
    }
    spawnGemAt(x,y){ this.entityManager.add(new Gem(x,y)); }
    spawnEnemyProjectile(x,y,tx,ty,speed,damage,color){
        this.entityManager.add(new EnemyProjectile(x,y,tx,ty,speed,damage,color));
    }
    spawnExplosion(x,y,radius,color='#ff6b35'){
        this.explosions.push({x,y,radius, life:0.32, maxLife:0.32, color});
    }
    spawnShieldBreak(x,y){
        this.shieldBreaks.push({x,y,life:0.45, maxLife:0.45});
        this.audio.shieldBreak();
    }

    _stressTest(n=120){
        const scaled=this.waveDirector.getScaledStats(this.elapsed);
        const cam=this.camera;
        const types=['grunt','tank','runner','shooter'];
        for(let i=0;i<n;i++){
            const side=Math.floor(Math.random()*4); let x,y; const m=32;
            if(side===0){ x=cam.x+Math.random()*cam.w; y=cam.y-m; }
            else if(side===1){ x=cam.x+cam.w+m; y=cam.y+Math.random()*cam.h; }
            else if(side===2){ x=cam.x+Math.random()*cam.w; y=cam.y+cam.h+m; }
            else { x=cam.x-m; y=cam.y+Math.random()*cam.h; }
            const t = types[Math.floor(Math.random()*types.length)];
            this.entityManager.add(new Enemy(x,y,t,scaled));
        }
        this.spawnDamageNumber(this.player.x, this.player.y-42, `+${n} ENEMIGOS`, '#ffbe0b');
    }

    // --- Armas automáticas por clase (PASO 3 preview, PASO 4 completo) ---
    _updateWeapons(dt){
        if(this.state!=='GAMEPLAY' || !this.player) return;
        const p=this.player;
        const cls=p.classId;
        const reduce = 1 - p.stats.cooldownReduction;

        // AUX: buscar N enemigos más cercanos
        const nearest = (n=1, range=420) => {
            const out=[];
            let candidates=[...this.entityManager.enemies].filter(e=>e.alive);
            candidates.sort((a,b)=>{
                const da=(a.x-p.x)**2 + (a.y-p.y)**2, db=(b.x-p.x)**2 + (b.y-p.y)**2;
                return da-db;
            });
            for(const e of candidates){
                const d2=(e.x-p.x)**2+(e.y-p.y)**2;
                if(d2<range*range){ out.push(e); if(out.length>=n) break; }
            }
            return out;
        };

        // Caballero: Espada arco frontal automático cada ~0.72s
        if (cls==='caballero' || p.weapons.includes('whip')) {
            this._timers.whip -= dt;
            const cd = (CONFIG.WEAPONS.WHIP.cooldown + (CONFIG.PLAYER.CLASSES.caballero.weaponMods.cooldown - CONFIG.WEAPONS.WHIP.cooldown))* reduce;
            // usar 0.72 aprox
            const effCD = 0.72 * reduce;
            if(this._timers.whip<=0){
                this._timers.whip = effCD;
                this._doWhip();
            }
            if(this._whipFlash>0) this._whipFlash-=dt;
        }

        // Mago: Varita
        if(cls==='mago' || p.weapons.includes('wand')){
            this._timers.wand -= dt;
            const effCD = 0.40 * reduce;
            if(this._timers.wand<=0){
                this._timers.wand = effCD;
                const count = 1 + (p.stats.projectileCount|0) + (CONFIG.PLAYER.CLASSES.mago.weaponMods.projectileCount||0) -1;
                const targets = nearest(Math.max(1,count), 560);
                if(targets.length===0){
                    const tx=p.x + p.facing*140, ty=p.y;
                    this._fireWand(tx,ty);
                } else {
                    for(let i=0;i<Math.min(targets.length, Math.max(1,count)); i++){
                        const t=targets[i];
                        const jitter = (i===0?0: (Math.random()-0.5)*18);
                        this._fireWand(t.x + jitter, t.y + jitter);
                    }
                }
            }
            // Bola de fuego exclusiva
            this._timers.fireball -= dt;
            const baseCdF = CONFIG.WEAPONS.FIREBALL.cooldown - (p._fireballBonus.cd || 0);
            const effCDF = Math.max(1.0, baseCdF * reduce);
            if(this._timers.fireball<=0){
                this._timers.fireball = effCDF;
                const fbTargets = nearest(1, 620);
                if(fbTargets.length>0){
                    this._fireFireball(fbTargets[0].x, fbTargets[0].y);
                } else {
                    // disparar al frente si no hay enemigos
                    this._fireFireball(p.x + p.facing*180, p.y);
                }
            }
        }

        // Caballero: pulso visual escudo
        if(cls==='caballero'){
            this._shieldPulse += dt*1.8;
        }

        // Pícaro: Dagas rápidas + Aura Ajo
        if(cls==='picaro'){
            // Dagas
            this._timers.dagger -= dt;
            const effCD = 0.30 * reduce;
            if(this._timers.dagger<=0){
                this._timers.dagger = effCD;
                const count = 2 + (p.stats.projectileCount|0);
                const targets = nearest(count, 500);
                if(targets.length===0){
                    const tx=p.x + p.facing*160, ty=p.y;
                    this._fireDagger(tx,ty);
                    if(count>1) setTimeout(()=>this._fireDagger(tx+ (Math.random()-0.5)*12, ty+ (Math.random()-0.5)*12), 70);
                } else {
                    // disparar a N distintos o al mismo si hay pocos
                    for(let i=0;i<count;i++){
                        const t=targets[i % targets.length];
                        const delay = i*65;
                        setTimeout(()=>{ if(this.state==='GAMEPLAY' && p.alive) this._fireDagger(t.x, t.y); }, delay);
                    }
                }
            }
            // Aura ajo tick
            this._timers.garlic -= dt;
            this._garlicPulse += dt*2.2;
            if(this._timers.garlic<=0){
                this._timers.garlic = 0.26; // tick
                this._doGarlicTick();
            }
        } else if(p.weapons.includes('garlic')){
            // caso genérico (por upgrades futuros)
            this._timers.garlic -= dt;
            if(this._timers.garlic<=0){ this._timers.garlic=0.32; this._doGarlicTick(); }
        }
    }

    _fireWand(tx,ty){
        const p=this.player;
        const dmg = Math.ceil(CONFIG.WEAPONS.WAND.damage * p.stats.damageMultiplier);
        this.entityManager.add(new Projectile(p.x, p.y, tx, ty, 420, dmg, 7, p.classData.color));
        this.audio.shoot();
    }
    _fireDagger(tx,ty){
        const p=this.player;
        const base = CONFIG.WEAPONS.DAGGER.damage;
        const isCritRoll = Math.random() < p.stats.critChance;
        const dmg = Math.ceil(base * p.stats.damageMultiplier * (isCritRoll? p.stats.critDamage : 1));
        const proj = new Projectile(p.x, p.y, tx, ty, 500, dmg, 5, '#ffbe0b');
        proj.isCrit = isCritRoll;
        this.entityManager.add(proj);
        this.audio.dagger();
    }
    _fireFireball(tx,ty){
        const p=this.player;
        const mods = CONFIG.PLAYER.CLASSES.mago.specialMods;
        const bonus = p._fireballBonus || {dmg:0, radius:0};
        const dmg = Math.ceil((mods.fireballDamage + (bonus.dmg||0)) * p.stats.damageMultiplier);
        const radius = (mods.fireballExplosion || 72) + (bonus.radius||0);
        const speed = mods.fireballSpeed || 285;
        const fb = new Fireball(p.x, p.y, tx, ty, speed, dmg, radius);
        this.entityManager.add(fb);
        this.audio.fireballShoot();
    }
    _doWhip(){
        const p=this.player;
        const range = CONFIG.PLAYER.CLASSES.caballero.weaponMods.range || 108;
        const dmg = Math.ceil(CONFIG.PLAYER.CLASSES.caballero.weaponMods.damage * p.stats.damageMultiplier);
        const arc = CONFIG.WEAPONS.WHIP.arc;
        // Auto-ataque: buscar enemigo más cercano en rango para orientar el arco
        let whipAngle = p.facing===1 ? 0 : Math.PI;
        let nearest = null, bestD2 = range*range;
        const preCandidates = this.entityManager.grid.query(p.x, p.y, range+6);
        for(const e of preCandidates){
            if(e.type!=='enemy' || !e.alive) continue;
            const dx=e.x-p.x, dy=e.y-p.y;
            const d2=dx*dx+dy*dy;
            if(d2 < bestD2){ bestD2=d2; nearest=e; }
        }
        if(nearest){
            whipAngle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
            // actualizar facing visual
            p.facing = Math.cos(whipAngle) >= 0 ? 1 : -1;
        }
        this._whipAngle = whipAngle;
        // Query grid en radio range
        const candidates = preCandidates;
        let hits=0;
        for(const e of candidates){
            if(e.type!=='enemy' || !e.alive) continue;
            const dx=e.x - p.x, dy=e.y - p.y;
            const d2=dx*dx+dy*dy;
            if(d2 > range*range) continue;
            const ang = Math.atan2(dy,dx);
            let delta = Math.abs(ang - whipAngle);
            if(delta>Math.PI) delta=2*Math.PI - delta;
            if(delta > arc/2) continue;
            // Golpe
            const isCrit = Math.random() < p.stats.critChance;
            const finalDmg = Math.ceil(dmg * (isCrit? p.stats.critDamage:1));
            const dead = e.takeDamage(finalDmg);
            this.spawnDamageNumber(e.x, e.y-13, isCrit?`${finalDmg}!`:`${finalDmg}`, isCrit?'#ffbe0b':'#fff');
            // Knockback en dirección del arco
            e.applyKnockback(Math.cos(whipAngle), Math.sin(whipAngle), 70);
            this.audio.enemyHit();
            hits++;
            if(dead){
                this.kills++;
                if(Math.random()<0.72) this.entityManager.add(new Gem(e.x,e.y));
                this.audio.enemyDeath();
            }
        }
        if(hits>0) this.audio.whip();
        this._whipFlash = 0.18;
        // visual pasará a render: dibujar arco
    }
    _doGarlicTick(){
        const p=this.player;
        const radius = (CONFIG.PLAYER.CLASSES.picaro.weaponMods.garlicRadius || 75) + (p.stats.magnetRadius?0:0);
        // upgrades pueden ampliar: buscamos garlic_up implícito
        const auraR = radius + ((p._garlicBonus)||0);
        const dmg = Math.ceil(CONFIG.WEAPONS.GARLIC.damage * p.stats.damageMultiplier * 0.85);
        const candidates = this.entityManager.grid.query(p.x, p.y, auraR);
        let hits=0;
        for(const e of candidates){
            if(e.type!=='enemy' || !e.alive) continue;
            const d2=(e.x-p.x)**2+(e.y-p.y)**2;
            if(d2 < auraR*auraR){
                const dead=e.takeDamage(dmg);
                if(hits<3) this.spawnDamageNumber(e.x, e.y-10, `${dmg}`, '#6EE7B7');
                e.hitFlash=0.09;
                hits++;
                if(dead){
                    this.kills++;
                    if(Math.random()<0.65) this.entityManager.add(new Gem(e.x,e.y));
                    this.audio.enemyDeath();
                }
            }
        }
        if(hits>0) this.audio.garlicTick();
    }

    _handleProjectileCollisions(){
        for(const proj of this.entityManager.projectiles){
            if(!proj.alive) continue;
            // Bola de fuego: explosión AoE
            if(proj.subType === 'fireball'){
                const candidates=this.entityManager.grid.query(proj.x, proj.y, proj.radius + 12);
                let hit=false;
                for(const e of candidates){
                    if(e.type!=='enemy' || !e.alive) continue;
                    const dx=proj.x-e.x, dy=proj.y-e.y, r=proj.radius+e.radius;
                    if(dx*dx+dy*dy < r*r){ hit=true; break; }
                }
                if(hit){
                    proj.explode(this);
                }
                continue;
            }
            const candidates=this.entityManager.grid.query(proj.x, proj.y, 24);
            for(const e of candidates){
                if(e.type!=='enemy' || !e.alive) continue;
                const dx=proj.x-e.x, dy=proj.y-e.y, r=proj.radius+e.radius;
                if(dx*dx+dy*dy < r*r){
                    let dmg=proj.damage;
                    if(!proj.isCrit && Math.random() < this.player.stats.critChance){
                        dmg = Math.ceil(dmg * this.player.stats.critDamage);
                        proj.isCrit=true;
                    }
                    const dead=e.takeDamage(Math.ceil(dmg));
                    this.spawnDamageNumber(e.x, e.y-13, proj.isCrit?`${Math.ceil(dmg)}!`:`${Math.ceil(dmg)}`, proj.isCrit?'#ffbe0b':'#fff');
                    this.audio.enemyHit();
                    proj.alive=false;
                    if(dead){
                        this.kills++;
                        if(Math.random()<0.70) this.spawnGemAt(e.x,e.y);
                        this.audio.enemyDeath();
                    }
                    break;
                }
            }
        }
    }

    loop(timestamp){
        this._rafId=requestAnimationFrame(this.loop);
        let dt=(timestamp - this._lastTime)/1000;
        this._lastTime=timestamp;
        if(dt>CONFIG.LOOP.MAX_DELTA) dt=CONFIG.LOOP.MAX_DELTA;
        if(dt<0) dt=0;
        this.update(dt);
        this.render();
    }

    update(dt){
        this.ui.updateHUD(dt);
        switch(this.state){
            case GameState.GAMEPLAY:
                this.elapsed+=dt;
                this.waveDirector.update(dt);
                this.weaponSystem.update(dt);
                this._updateWeapons(dt);

                this.entityManager.update(dt, this);
                this._handleProjectileCollisions();

                for(const t of this.floatingTexts){ t.y+=t.vy*dt; t.life-=dt; }
                this.floatingTexts=this.floatingTexts.filter(t=>t.life>0);
                for(const ex of this.explosions){ ex.life-=dt; }
                this.explosions=this.explosions.filter(e=>e.life>0);
                for(const sb of this.shieldBreaks){ sb.life-=dt; }
                this.shieldBreaks=this.shieldBreaks.filter(e=>e.life>0);

                this._centerCamera(false);

                // Recolección de gemas ya está en Gem.update (magnet)
                // Level up ya disparado desde Gem

                if(this.player && this.player.hp<=0){
                    this.player.alive=false;
                    this.setState(GameState.GAME_OVER);
                }
                break;
            case GameState.MENU:
            case GameState.CLASS_SELECT:
                this.elapsed+=dt*0.3;
                break;
            case GameState.PAUSED:
            case GameState.LEVEL_UP:
            case GameState.GAME_OVER:
                break;
        }
    }

    triggerLevelUp(){
        this.audio.levelUp();
        const p=this.player;
        const pool=CONFIG.UPGRADES_POOL.filter(u=>{
            if(u.type==='exclusive'){
                return u.forClass===p.classId;
            }
            return true;
        });
        // Asegurar que al menos una mejora sea de la técnica exclusiva si está disponible (30% más peso)
        const shuffled=[...pool].sort(()=>Math.random()-0.5);
        // Si hay exclusivas, forzar que una de las 3 sea exclusiva con 70% prob
        let opts = shuffled.slice(0,3);
        const exclusive = pool.filter(u=>u.type==='exclusive');
        if(exclusive.length>0 && Math.random()<0.7 && !opts.some(o=>o.type==='exclusive')){
            // reemplazar una aleatoria por una exclusiva
            const ex = exclusive[Math.floor(Math.random()*exclusive.length)];
            opts[Math.floor(Math.random()*3)] = ex;
        }
        this.setState(GameState.LEVEL_UP);
        this.ui.renderLevelUpOptions(opts);
    }
    applyUpgrade(id){
        const p=this.player;
        if(!p) return;
        switch(id){
            case 'hp_up': p.stats.maxHealth+=22; p.heal(22); break;
            case 'dmg_up': p.stats.damageMultiplier+=0.15; break;
            case 'spd_up': p.stats.moveSpeed*=1.12; break;
            case 'mag_up': p.stats.magnetRadius+=28; break;
            case 'cd_up': p.stats.cooldownReduction=Math.min(0.60, p.stats.cooldownReduction+0.10); break;
            case 'proj_up': p.stats.projectileCount+=1; break;
            case 'armor_up': p.stats.armor+=1; break;
            case 'garlic_up': p._garlicBonus = (p._garlicBonus||0)+20; if(p.stats.magnetRadius<140) p.stats.magnetRadius+=6; break;
            case 'shield_up': p.shieldMaxCharges = (p.shieldMaxCharges||1)+1; p._shieldCdBonus=(p._shieldCdBonus||0)+1.8; if(!p.shieldActive){ p.shieldCharges=p.shieldMaxCharges; p.shieldActive=true; } break;
            case 'fireball_up': p._fireballBonus.dmg = (p._fireballBonus.dmg||0)+10; p._fireballBonus.radius=(p._fireballBonus.radius||0)+14; p._fireballBonus.cd=(p._fireballBonus.cd||0)+0.22; break;
        }
        this.audio.pickup();
        this.spawnPickupText(p.x, p.y-24, 'MEJORA!', '#ffbe0b');
        this.setState(GameState.GAMEPLAY);
    }

    render(){
        const ctx=this.ctx, W=this.logicalWidth, H=this.logicalHeight;
        ctx.fillStyle=CONFIG.CANVAS.BACKGROUND; ctx.fillRect(0,0,W,H);
        if(this.state===GameState.GAMEPLAY || this.state===GameState.PAUSED || this.state===GameState.LEVEL_UP){
            this._renderWorld(ctx);
        } else {
            this._renderMenuBackground(ctx);
        }
        if(CONFIG.GRID.DEBUG_DRAW && this.entityManager.grid) this.entityManager.grid.debugDraw(ctx, this.camera);
        if(this.state===GameState.GAMEPLAY && !this.player){
            ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.font='12px JetBrains Mono, monospace'; ctx.textAlign='center'; ctx.fillText('Esperando jugador...', W/2, H/2);
        }
    }

    _renderWorld(ctx){
        const cam=this.camera;
        ctx.save();
        ctx.strokeStyle=CONFIG.COLORS.grid; ctx.lineWidth=1;
        const gs=64, sx=-(cam.x%gs), sy=-(cam.y%gs);
        for(let x=sx;x<cam.w;x+=gs){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,cam.h); ctx.stroke(); }
        for(let y=sy;y<cam.h;y+=gs){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(cam.w,y); ctx.stroke(); }
        ctx.strokeStyle='rgba(97,12,39,0.38)'; ctx.lineWidth=2; ctx.setLineDash([8,8]);
        ctx.strokeRect(-cam.x, -cam.y, this.worldWidth, this.worldHeight); ctx.setLineDash([]); ctx.restore();

        // Aura garlic -- EXCLUSIVA PÍCARO
        if(this.player && this.player.classId==='picaro'){
            const sxp=this.player.x - cam.x, syp=this.player.y - cam.y;
            const r=(CONFIG.PLAYER.CLASSES.picaro.weaponMods.garlicRadius||75) + (this.player._garlicBonus||0);
            const pulse = 0.85 + Math.sin(this._garlicPulse)*0.12;
            ctx.fillStyle=`rgba(0,76,64,${0.14 + Math.abs(Math.sin(this._garlicPulse))*0.08})`;
            ctx.beginPath(); ctx.arc(sxp, syp, r*pulse, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle='rgba(0,76,64,0.52)'; ctx.lineWidth=1.6; ctx.setLineDash([6,6]);
            ctx.beginPath(); ctx.arc(sxp, syp, r, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle='rgba(0,76,64,0.70)';
            for(let i=0;i<3;i++){
                const ang = this._garlicPulse*1.2 + i*2.09;
                const rr = r*0.72;
                ctx.beginPath(); ctx.arc(sxp+Math.cos(ang)*rr, syp+Math.sin(ang)*rr, 2, 0, Math.PI*2); ctx.fill();
            }
        }

        // Escudo -- EXCLUSIVO CABALLERO (visual + cargas)
        if(this.player && this.player.classId==='caballero'){
            const sxp=this.player.x - cam.x, syp=this.player.y - cam.y;
            if(this.player.shieldActive && this.player.shieldCharges>0){
                const r = CONFIG.PLAYER.CLASSES.caballero.specialMods.shieldRadius || 32;
                Shield.render(ctx, sxp, syp, r, this._shieldPulse, this.player.shieldCharges);
            } else if(!this.player.shieldActive){
                // cooldown indicador
                const cd = this.player.shieldCooldown || 0;
                if(cd>0){
                    const maxCd = CONFIG.PLAYER.CLASSES.caballero.specialMods.shieldCooldown || 11;
                    const pct = 1 - (cd / maxCd);
                    ctx.fillStyle='rgba(0,0,0,0.55)';
                    ctx.fillRect(sxp-22, syp+this.player.radius+10, 44, 4);
                    ctx.fillStyle='#610C27';
                    ctx.fillRect(sxp-22, syp+this.player.radius+10, 44*pct, 4);
                }
            }
        }

        // Entidades
        this.entityManager.render(ctx, cam);

        // Explosiones de bola de fuego
        for(const ex of this.explosions){
            const sx=ex.x - cam.x, sy=ex.y - cam.y;
            const prog = 1 - (ex.life/ex.maxLife);
            const r = ex.radius * (0.35 + prog*0.95);
            const alpha = (ex.life/ex.maxLife)*0.42;
            ctx.fillStyle=`rgba(97,12,39,${alpha})`;
            ctx.beginPath(); ctx.arc(sx,sy,r,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle=`rgba(59,7,84,${alpha*0.85})`;
            ctx.lineWidth=2; ctx.beginPath(); ctx.arc(sx,sy,r*0.6,0,Math.PI*2); ctx.stroke();
            // chispas violeta
            ctx.fillStyle=`rgba(59,7,84,${alpha})`;
            for(let i=0;i<4;i++){
                const ang = prog*6 + i*1.57;
                ctx.beginPath(); ctx.arc(sx+Math.cos(ang)*r*0.55, sy+Math.sin(ang)*r*0.55, 2.5,0,Math.PI*2); ctx.fill();
            }
        }
        // Breaks de escudo
        for(const sb of this.shieldBreaks){
            const sx=sb.x - cam.x, sy=sb.y - cam.y;
            const alpha=sb.life/sb.maxLife;
            ctx.globalAlpha=alpha;
            ctx.strokeStyle='rgba(97,12,39,0.95)'; ctx.lineWidth=2;
            ctx.beginPath();
            for(let k=0;k<6;k++){
                const ang=k*1.047;
                const r1=12, r2=22+ (1-alpha)*8;
                ctx.moveTo(sx+Math.cos(ang)*r1, sy+Math.sin(ang)*r1);
                ctx.lineTo(sx+Math.cos(ang)*r2, sy+Math.sin(ang)*r2);
            }
            ctx.stroke();
            ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.font='11px serif'; ctx.textAlign='center';
            ctx.fillText('[SHD]', sx, sy);
        }
        ctx.globalAlpha=1;

        // Whip arco visual -- ahora orientado al enemigo más cercano
        if(this._whipFlash>0 && this.player){
            const p=this.player;
            const sxp=p.x - cam.x, syp=p.y - cam.y;
            const range= (CONFIG.PLAYER.CLASSES.caballero.weaponMods.range||108);
            const alpha = this._whipFlash / 0.18;
            ctx.fillStyle=`rgba(97,12,39,${0.28*alpha})`;
            ctx.strokeStyle=`rgba(226,232,240,${0.45*alpha})`;
            ctx.lineWidth=2;
            const start = (this._whipAngle || (p.facing===1?0:Math.PI)) - CONFIG.WEAPONS.WHIP.arc/2;
            ctx.beginPath(); ctx.moveTo(sxp,syp); ctx.arc(sxp,syp, range, start, start+CONFIG.WEAPONS.WHIP.arc); ctx.closePath(); ctx.fill(); ctx.stroke();
            // brillo interior gótico
            const ang = this._whipAngle || 0;
            ctx.fillStyle=`rgba(59,7,84,${0.22*alpha})`;
            ctx.beginPath(); ctx.arc(sxp + Math.cos(ang)*range*0.58, syp + Math.sin(ang)*range*0.58, 9, 0, Math.PI*2); ctx.fill();
        }

        // Floating texts
        for(const t of this.floatingTexts){
            const sx=t.x - cam.x, sy=t.y - cam.y;
            const alpha=t.life / t.maxLife;
            ctx.globalAlpha=alpha;
            ctx.fillStyle=t.color; ctx.font='bold 13px JetBrains Mono, monospace'; ctx.textAlign='center';
            ctx.fillText(t.text, sx, sy);
        }
        ctx.globalAlpha=1;

        // HUD extra (arma activa + técnica exclusiva)
        if(this.state===GameState.GAMEPLAY && this.player){
            const cls = CONFIG.PLAYER.CLASSES[this.player.classId];
            ctx.fillStyle='rgba(0,0,0,0.48)'; ctx.fillRect(this.logicalWidth-230, 46, 220, 28); ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.strokeRect(this.logicalWidth-230, 46, 220, 28);
            ctx.fillStyle='#fff'; ctx.font='10px JetBrains Mono, monospace'; ctx.textAlign='right';
            const wName = cls.id==='caballero'?'[SWD] Espada+[SHD]':cls.id==='mago'?'[ORB] Varita+[FIR]':'[DAG] Dagas+[GAR]';
            ctx.fillText(`${cls.emoji} ${cls.name} -- ${wName}`, this.logicalWidth-16, 63);
            ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.font='9px JetBrains Mono, monospace';
            ctx.fillText('Auto-ataque - No requiere teclas', this.logicalWidth-16, 72);
        }

        // Debug overlay
        if(this.state===GameState.GAMEPLAY){
            const s=this.entityManager.getCollisionStats();
            ctx.fillStyle='rgba(0,0,0,0.54)'; ctx.fillRect(10,46,340,68); ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.strokeRect(10,46,340,68);
            ctx.fillStyle='rgba(255,255,255,0.92)'; ctx.font='10px JetBrains Mono, monospace'; ctx.textAlign='left';
            const typeCounts = {};
            for(const e of this.entityManager.enemies) typeCounts[e.def?.id||e.enemyType||'grunt']=(typeCounts[e.def?.id||'grunt']||0)+1;
            const mixStr = Object.entries(typeCounts).map(([k,v])=>`${k}:${v}`).join(' ');
            ctx.fillText(`Ent: ${this.entityManager.count()}  Ene: ${this.entityManager.enemyCount()} [${mixStr}]  Celdas:${s.grid.cellsUsed}`, 16, 60);
            ctx.fillText(`Oleada #${this.waveDirector.waveNumber}  Intervalo: ${(this.waveDirector.spawnCooldown).toFixed(2)}s`, 16, 74);
            ctx.fillText(`Grid: ${s.checks} checks vs Brute ${s.brute}  Ahorro ${s.saved}%`, 16, 88);
            ctx.fillStyle=s.saved>80?'#6EE7B7':s.saved>50?'#A78BFA':'#F43F5E'; ctx.fillText(`[OK] Spawn en bordes - Escalado x minuto - Paleta gótica`,16,102);
            ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.fillText(`G:grid M:mute T:+120  ESPACIO: reiniciar (muerte)`,16,112);
            if(this.entityManager.enemyCount()===0){
                ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.textAlign='center'; ctx.fillText('¡Sobrevive! Armas automáticas por clase', cam.w/2, 24);
            }
        }
    }

    _renderMenuBackground(ctx){
        const t=this.elapsed;
        for(let i=0;i<3;i++){
            const x=(Math.sin(t*0.2+i)*40 + CONFIG.CANVAS.WIDTH/2), y=(Math.cos(t*0.15+i*1.3)*20+220+i*90), r=120+i*60;
            const col = i===0 ? `rgba(97,12,39,${0.16})` : i===1 ? `rgba(59,7,84,${0.14})` : `rgba(0,76,64,${0.10})`;
            const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,col); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
        }
        ctx.fillStyle='rgba(255,255,255,0.55)';
        for(let i=0;i<80;i++){ const x=(i*137.5+t*10)%CONFIG.CANVAS.WIDTH, y=(i*73.3)%380, a=0.3+Math.sin(t+i)*0.2; ctx.globalAlpha=Math.max(0,a); ctx.fillRect(x,y,1.2,1.2); }
        ctx.globalAlpha=1;
        ctx.fillStyle='rgba(255,255,255,0.22)'; ctx.font='10px JetBrains Mono, monospace'; ctx.textAlign='center';
        ctx.fillText('PASO 4+5 -- Combate (armas+proyectiles+daño) - XP magnet - Nivel + UI - Técnicas exclusivas - Grid O(n)', CONFIG.CANVAS.WIDTH/2, CONFIG.CANVAS.HEIGHT-18);
        ctx.fillStyle='rgba(97,12,39,0.95)'; ctx.beginPath(); ctx.arc(CONFIG.CANVAS.WIDTH-22,18,4,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='rgba(97,12,39,0.32)'; ctx.lineWidth=8; ctx.beginPath(); ctx.arc(CONFIG.CANVAS.WIDTH-22,18,4+Math.abs(Math.sin(t*3))*6,0,Math.PI*2); ctx.stroke();
    }

    destroy(){
        if(this._rafId) cancelAnimationFrame(this._rafId);
        window.removeEventListener('resize', this._onResize);
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('mousedown', this._onPointerDown);
        this.input.destroy();
    }
}
