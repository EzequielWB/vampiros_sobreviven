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
        this.explosions = [];
        this.shieldBreaks = [];
        this._timers = { whip: 0, wand: 0, dagger: 0, garlic: 0, shield: 0, fireball: 0 };
        this._whipFlash = 0;
        this._whipAngle = 0;
        this._garlicPulse = 0;
        this._shieldPulse = 0;
        this._gridPattern = null;
        this._gridPatternCanvas = null;
        this.fps = 60;
        this._fpsAcc = 0; this._fpsCount = 0; this._lastFpsTime = 0;
        this._quality = 'high';
        // Definitiva
        this.ultimateCooldown = 0;
        this.ultimateActive = null; // {type, timer, dirX, dirY, tick}
        this.ultimateBombs = []; // para picaro: bombas en vuelo
        this._ultBeamPulse = 0;

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
        window.addEventListener('touchstart', () => this.audio.resume(), { once: true });
        // botón definitiva
        document.getElementById('ultimate-btn')?.addEventListener('click', ()=>this.tryActivateUltimate());
        document.getElementById('ultimate-btn')?.addEventListener('touchstart', (e)=>{ e.preventDefault(); this.tryActivateUltimate(); }, {passive:false});
        // tecla R para definitiva en PC
        window.addEventListener('keydown', (e)=>{ if(e.key.toLowerCase()==='r') this.tryActivateUltimate(); });

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
        this.logicalWidth = CONFIG.CANVAS.WIDTH;
        this.logicalHeight = CONFIG.CANVAS.HEIGHT;
        this.camera.w = this.logicalWidth;
        this.camera.h = this.logicalHeight;
        this._gridPattern = null;
    }
    _ensureGridPattern(){
        if(this._gridPattern) return this._gridPattern;
        const s = 64;
        const c = document.createElement('canvas');
        c.width = s; c.height = s;
        const g = c.getContext('2d');
        g.fillStyle = CONFIG.COLORS.background;
        g.fillRect(0,0,s,s);
        g.strokeStyle = CONFIG.COLORS.grid;
        g.lineWidth = 1;
        g.strokeRect(0,0,s,s);
        g.strokeStyle = 'rgba(0,0,0,0.08)';
        g.strokeRect(0,0,s,s);
        this._gridPatternCanvas = c;
        this._gridPattern = this.ctx.createPattern(c, 'repeat');
        return this._gridPattern;
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
        document.body.classList.toggle('gameplay', wantJoy);
        document.body.classList.toggle('menu', !wantJoy);
        // side notice solo en menú
        const side=document.getElementById('side-notice');
        if(side){
            const isMenu = (newState===GameState.MENU || newState===GameState.CLASS_SELECT);
            side.classList.toggle('hidden', !isMenu);
        }
        // ultimate button solo en gameplay
        this._updateUltimateButton();
    }

    startGame(classId = 'caballero') {
        this.lastClass = classId;
        this.elapsed = 0;
        this.kills = 0;
        this.floatingTexts = [];
        this.explosions = [];
        this.shieldBreaks = [];
        this._timers = { whip: 0.35, wand: 0.28, dagger: 0.2, garlic: 0, shield: 1.0, fireball: 1.2, lance: 0.28, bow: 0.28 };
        this._whipFlash = 0; // legacy, ya no se usa para Artoria
        this._lanceFlash = 0;
        this._lanceAngle = 0;
        this._garlicPulse = 0;
        this._shieldPulse = 0;
        this._artoriaSwingDir = 1; // 1 = derecha, -1 = izquierda (alterna cada ataque)
        this._gaeBolgLances = [];
        this._whipSwings = []; // array de {angle, timer, maxTimer, isArtoria}
        this._musashiHand = 1; // 1 = derecha, -1 = izquierda
        this._musashiParryTimer = 0;
        this._musashiSlashes = [];
        this._musashiStances = [];
        this._leviathan = null;
        this._leviathanThrown = false;
        this._alucardMuzzleFlash = null;
        // Alucard familiars (ultimate)
        this._alucardFamiliars = [];
        // Kratos rage visual
        this._kratosRagePulse = 0;
        // Musashi stance tracking
        this._musashiStanceCount = 0;

        this.entityManager = new EntityManager(CONFIG.GRID.CELL_SIZE);
        this.waveDirector = new WaveDirector(this);
        this.weaponSystem = new WeaponSystem(this);

        const px = this.worldWidth / 2, py = this.worldHeight / 2;
        this.player = new Player(px, py, classId);
        this.entityManager.setPlayer(this.player);

        // Armas iniciales por clase -- técnicas exclusivas
        if (classId === 'mago') this.player.weapons = ['wand','fireball'];
        else if (classId === 'caballero') this.player.weapons = ['whip','shield'];
        else if (classId === 'artoria') this.player.weapons = ['artoria_sword'];
        else if (classId === 'cu') this.player.weapons = ['lance'];
        else if (classId === 'emiya') this.player.weapons = ['bow'];
        else if (classId === 'alucard') this.player.weapons = ['alucard_guns'];
        else if (classId === 'kratos') this.player.weapons = ['leviathan'];
        else if (classId === 'musashi') this.player.weapons = ['niten'];
        else this.player.weapons = ['dagger','garlic']; // pícaro

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

    spawnDamageNumber(x,y,text,color='#fff'){
        if(this.floatingTexts.length > 18) this.floatingTexts.shift();
        if(window.innerWidth < 860 && this.floatingTexts.length > 10) return;
        this.floatingTexts.push({x,y,vy:-44,life:0.75,maxLife:0.75,text,color, scale:1});
    }
    spawnPickupText(x,y,text,color){ this.spawnDamageNumber(x,y,text,color); }
    spawnExcaliburText(){
        const p=this.player;
        // Texto grande amarillo pixel sobre la cabeza, dura 1.1s
        this.floatingTexts.push({x:p.x, y:p.y-42, vy:-18, life:1.15, maxLife:1.15, text:'EXCALIBUR!!', color:'#FFBE0B', scale:1.85, isExcalibur:true});
        // destello
        this.spawnExplosion(p.x, p.y-12, 18, '#FFBE0B');
    }
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
        const isMobile = window.innerWidth < 860;
        const maxEnemies = isMobile ? CONFIG.WAVE.MAX_ENEMIES_MOBILE : CONFIG.WAVE.MAX_ENEMIES;
        const cur = this.entityManager.enemyCount();
        const canSpawn = Math.max(0, maxEnemies - cur);
        const actual = Math.min(n, Math.floor(canSpawn * 0.7));
        if(actual<=0){ this.spawnDamageNumber(this.player.x, this.player.y-32, `LIMITE ${maxEnemies}`, '#F43F5E'); return; }
        const scaled=this.waveDirector.getScaledStats(this.elapsed);
        const cam=this.camera;
        const types=['grunt','tank','runner','shooter'];
        for(let i=0;i<actual;i++){
            const side=Math.floor(Math.random()*4); let x,y; const m=32;
            if(side===0){ x=cam.x+Math.random()*cam.w; y=cam.y-m; }
            else if(side===1){ x=cam.x+cam.w+m; y=cam.y+Math.random()*cam.h; }
            else if(side===2){ x=cam.x+Math.random()*cam.w; y=cam.y+cam.h+m; }
            else { x=cam.x-m; y=cam.y+Math.random()*cam.h; }
            const t = types[Math.floor(Math.random()*types.length)];
            if(this.entityManager.acquireEnemy) this.entityManager.acquireEnemy(x,y,t,scaled);
            else this.entityManager.add(new Enemy(x,y,t,scaled));
        }
        this.spawnDamageNumber(this.player.x, this.player.y-42, `+${actual} ENEMIGOS`, '#FFBE0B');
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
        }

        // Actualizar swings visuales (Artoria y Caballero) — SIEMPRE, independiente de clase
        if(this._whipSwings && this._whipSwings.length > 0){
            for(const s of this._whipSwings) s.timer -= dt;
            this._whipSwings = this._whipSwings.filter(s => s.timer > 0);
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
            this._timers.garlic -= dt;
            if(this._timers.garlic<=0){ this._timers.garlic=0.32; this._doGarlicTick(); }
        }

        // Artoria: Espada doble golpe
        if(cls==='artoria'){
            this._timers.whip -= dt;
            const effCD = 0.62 * reduce;
            if(this._timers.whip<=0){
                this._timers.whip = effCD;
                this._doArtoriaSword();
            }
        }
        // Cu: Lanza lineal
        if(cls==='cu'){
            if(!this._timers.lance) this._timers.lance=0;
            this._timers.lance -= dt;
            const effCD = 0.58 * reduce;
            if(this._timers.lance<=0){
                this._timers.lance = effCD;
                this._doLance();
            }
        }
        // Emiya: Arco
        if(cls==='emiya'){
            if(!this._timers.bow) this._timers.bow=0;
            this._timers.bow -= dt;
            const effCD = 0.34 * reduce;
            if(this._timers.bow<=0){
                this._timers.bow = effCD;
                const count = 1 + (p.stats.projectileCount|0);
                const targets = nearest(count, 580);
                if(targets.length===0){
                    this._fireArrow(p.x + p.facing*160, p.y);
                } else {
                    for(let i=0;i<Math.min(targets.length,count);i++){
                        this._fireArrow(targets[i].x, targets[i].y);
                    }
                }
            }
        }

        // Alucard: Pistolas duales (Casull + Jackal) - auto-target rápido
        if(cls==='alucard'){
            if(!this._timers.alucard_guns) this._timers.alucard_guns=0;
            this._timers.alucard_guns -= dt;
            const mods = CONFIG.PLAYER.CLASSES.alucard.weaponMods;
            const effCD = (mods.cooldown || 0.18) * reduce;
            if(this._timers.alucard_guns<=0){
                this._timers.alucard_guns = effCD;
                const count = (mods.count || 2) + (p.stats.projectileCount|0);
                const targets = nearest(count, 620);
                if(targets.length===0){
                    // Disparar al frente con spread
                    for(let i=0;i<count;i++){
                        const ang = (p.facing===1?0:Math.PI) + (Math.random()-0.5)*mods.spread;
                        this._fireAlucardShot(p.x + Math.cos(ang)*30, p.y + Math.sin(ang)*30, ang);
                    }
                } else {
                    for(let i=0;i<Math.min(targets.length, count);i++){
                        const t = targets[i];
                        const ang = Math.atan2(t.y-p.y, t.x-p.x) + (Math.random()-0.5)*mods.spread;
                        this._fireAlucardShot(p.x + Math.cos(ang)*30, p.y + Math.sin(ang)*30, ang);
                    }
                }
            }
        }

        // Kratos: Hacha Léviatán (lanzar + recall con ricochet)
        if(cls==='kratos'){
            if(!this._timers.leviathan_throw) this._timers.leviathan_throw=0;
            if(!this._timers.leviathan_recall) this._timers.leviathan_recall=0;
            this._timers.leviathan_throw -= dt;
            this._timers.leviathan_recall -= dt;

            const mods = CONFIG.PLAYER.CLASSES.kratos.weaponMods;
            const throwCD = (mods.throwCooldown || 1.1) * reduce;
            const recallCD = (mods.recallCooldown || 0.8) * reduce;

            // Lanzar hacha
            if(this._timers.leviathan_throw<=0 && !this._leviathanThrown){
                this._timers.leviathan_throw = throwCD;
                const targets = nearest(1, mods.throwRange || 320);
                if(targets.length>0){
                    this._throwLeviathan(targets[0].x, targets[0].y);
                } else {
                    this._throwLeviathan(p.x + p.facing*200, p.y);
                }
            }
            // Recall automático si la hacha está volando
            if(this._leviathanThrown && this._timers.leviathan_recall<=0){
                this._timers.leviathan_recall = recallCD;
                this._recallLeviathan();
            }
        }

        // Musashi: Niten Ichi-ryū (doble katana alternada + parry pasivo)
        if(cls==='musashi'){
            if(!this._timers.niten) this._timers.niten=0;
            this._timers.niten -= dt;
            const mods = CONFIG.PLAYER.CLASSES.musashi.weaponMods;
            const effCD = (mods.slashCooldown || 0.22) * reduce;
            if(this._timers.niten<=0){
                this._timers.niten = effCD;
                // Alternar mano: 1 = derecha, -1 = izquierda
                this._musashiHand = (this._musashiHand === 1) ? -1 : 1;
                this._doMusashiSlash(this._musashiHand);
            }
            // Parry pasivo: si recibe daño durante parryWindow, contraataca
            if(this._musashiParryTimer > 0) this._musashiParryTimer -= dt;
        }
        // tick definitiva (enfriamiento y activa)
        this._updateUltimate(dt);
        this._updateUltimateButton();
    }

    tryActivateUltimate(){
        if(this.state!=='GAMEPLAY' || !this.player) return;
        if(this.ultimateCooldown > 0) {
            this.spawnPickupText(this.player.x, this.player.y-18, `CD ${Math.ceil(this.ultimateCooldown)}s`, '#94A3B8');
            this.audio.pause();
            return;
        }
        if(this.ultimateActive) return;
        const cls=this.player.classId;
        const ult=CONFIG.ULTIMATES[cls];
        if(!ult) return;
        this.audio.resume();
        this.ultimateCooldown = ult.cooldown;
        // activar según clase
        if(cls==='caballero'){
            // Corte 360 doble rango
            this.ultimateActive={type:'caballero', timer:ult.duration, range:ult.range, damage:ult.damage};
            this._doUltimateCaballero();
            this.audio.whip(); this.audio.shieldUp();
            this.spawnPickupText(this.player.x, this.player.y-28, 'CORTE DIVINO!', '#FFBE0B');
        } else if(cls==='mago'){
            let dirX=this.player.facing, dirY=0;
            const nearest=this._findNearestForUltimate(700);
            if(nearest){
                const dx=nearest.x-this.player.x, dy=nearest.y-this.player.y;
                const len=Math.hypot(dx,dy)||1; dirX=dx/len; dirY=dy/len;
            }
            this.ultimateActive={type:'mago', timer:ult.duration, dirX, dirY, width:ult.width, length:ult.length, tickDamage:ult.tickDamage, tickRate:ult.tickRate, tick:0};
        } else if(cls==='artoria'){
            let dirX=this.player.facing, dirY=0;
            const nearest=this._findNearestForUltimate(700);
            if(nearest){ const dx=nearest.x-this.player.x, dy=nearest.y-this.player.y; const len=Math.hypot(dx,dy)||1; dirX=dx/len; dirY=dy/len; }
            this.ultimateActive={type:'artoria', timer:ult.duration, dirX, dirY, width:ult.width, length:ult.length, tickDamage:ult.tickDamage, tickRate:ult.tickRate, tick:0};
            // Texto EXCALIBUR!! pixel amarillo grande sobre la cabeza
            this.spawnExcaliburText();
            this.audio.levelUp(); this.audio.fireballShoot();
        } else if(cls==='cu'){
            // Gae Bolg: lanza hacia el más cercano, cae y explota
            let tx=this.player.x + this.player.facing*520, ty=this.player.y;
            const nearest=this._findNearestForUltimate(620);
            if(nearest){ tx=nearest.x; ty=nearest.y; }
            this.ultimateActive={type:'cu', timer:0.55, tx, ty, damage:ult.damage, explosion:ult.explosion};
            // efecto inmediato: marca y luego explota
            this._doUltimateCu(tx,ty, ult);
            this.audio.fireballShoot(); this.audio.fireballExplode();
            this.spawnPickupText(this.player.x, this.player.y-28, 'GAE BOLG!', '#F87171');
            this._updateUltimateButton();
            return;
        } else if(cls==='emiya'){
            this.ultimateActive={type:'emiya', timer:ult.duration, radius:ult.radius, tickDamage:ult.tickDamage, tickRate:ult.tickRate, tick:0};
            this.audio.levelUp(); this.audio.shoot();
            this.spawnPickupText(this.player.x, this.player.y-28, 'UNLIMITED BLADE WORKS!', '#D4D4D8');
            this._updateUltimateButton();
            return;
        } else if(cls==='picaro'){
            this.ultimateActive={type:'picaro', timer:ult.duration, interval:ult.interval, bombDamage:ult.bombDamage, bombRadius:ult.bombRadius, tick:0};
            this.audio.dagger(); this.audio.fireballExplode();
            this.spawnPickupText(this.player.x, this.player.y-28, 'LLUVIA DE BOMBAS!', '#6EE7B7');
        } else if(cls==='alucard'){
            this._doUltimateAlucard();
        } else if(cls==='kratos'){
            this._doUltimateKratos();
        } else if(cls==='musashi'){
            this._doUltimateMusashi();
        }
        this._updateUltimateButton();
    }

    _findNearestForUltimate(range=700){
        const p=this.player;
        let best=null, bestD2=range*range;
        for(const e of this.entityManager.enemies){
            if(!e.alive) continue;
            const d2=(e.x-p.x)**2+(e.y-p.y)**2;
            if(d2<bestD2){ bestD2=d2; best=e; }
        }
        return best;
    }

    _updateUltimate(dt){
        if(this.ultimateCooldown>0) this.ultimateCooldown-=dt;
        if(this.ultimateCooldown<0) this.ultimateCooldown=0;
        if(!this.ultimateActive) return;
        const ult=this.ultimateActive;
        ult.timer-=dt;
        this._ultBeamPulse+=dt*8;
        if(ult.type==='mago' || ult.type==='artoria'){
            ult.tick-=dt;
            if(ult.tick<=0){
                ult.tick=ult.tickRate;
                this._doUltimateMagoTick(ult);
            }
        } else if(ult.type==='picaro'){
            ult.tick-=dt;
            if(ult.tick<=0){
                ult.tick=ult.interval;
                this._doUltimatePicaroTick(ult);
            }
        } else if(ult.type==='emiya'){
            ult.tick-=dt;
            if(ult.tick<=0){
                ult.tick=ult.tickRate;
                this._doUltimateEmiyaTick(ult);
            }
        } else if(ult.type==='cu'){
            // Gae Bolg ya explotó al activar, solo espera timer
        } else if(ult.type==='alucard'){
            this._updateUltimateAlucard(dt);
        } else if(ult.type==='kratos'){
            this._updateUltimateKratos(dt);
        } else if(ult.type==='musashi'){
            this._updateUltimateMusashi(dt);
        }
        if(ult.timer<=0){
            this.ultimateActive=null;
            this._ultBeamPulse=0;
            // Reset speed boost de Kratos
            if(this.player) this.player._rageSpeedBoost = 1;
        }
    }

    _doUltimateCaballero(){
        const p=this.player;
        const ult=CONFIG.ULTIMATES.caballero;
        const range=ult.range;
        const dmg=Math.ceil(ult.damage * p.stats.damageMultiplier);
        const candidates=this.entityManager.grid.query(p.x,p.y,range+4);
        let hits=0;
        for(const e of candidates){
            if(e.type!=='enemy'||!e.alive) continue;
            const dx=e.x-p.x, dy=e.y-p.y;
            if(dx*dx+dy*dy > range*range) continue;
            const dead=e.takeDamage(dmg);
            this.spawnDamageNumber(e.x,e.y-14, `${dmg}`, '#FFBE0B');
            const len=Math.hypot(dx,dy)||1;
            e.applyKnockback(dx/len, dy/len, ult.knockback||110);
            hits++;
            if(dead){ this.kills++; if(Math.random()<0.85) this.spawnGemAt(e.x,e.y); this.audio.enemyDeath(); }
            else this.audio.enemyHit();
        }
        // onda expansiva visual
        this.spawnExplosion(p.x,p.y,range,'#FFBE0B');
        this._whipFlash=0.35; this._whipAngle=0;
        // feedback
        if(hits>0) this.audio.fireballExplode();
    }

    _doUltimateMagoTick(ult){
        const p=this.player;
        const ox=p.x, oy=p.y;
        const dx=ult.dirX, dy=ult.dirY;
        // línea: proyectar cada enemigo y ver si está dentro del rectángulo del rayo
        const len=ult.length, halfW=ult.width/2;
        // vector perpendicular
        const px=-dy, py=dx;
        let hits=0;
        const candidates=this.entityManager.grid.query(ox + dx*len/2, oy + dy*len/2, len/2 + halfW);
        for(const e of candidates){
            if(e.type!=='enemy'||!e.alive) continue;
            const ex=e.x-ox, ey=e.y-oy;
            const proj = ex*dx + ey*dy; // proyección sobre dirección
            if(proj < 0 || proj > len) continue;
            const perp = Math.abs(ex*px + ey*py);
            if(perp > halfW + e.radius) continue;
            const dmg=Math.ceil(ult.tickDamage * p.stats.damageMultiplier);
            const dead=e.takeDamage(dmg);
            if(hits<4) this.spawnDamageNumber(e.x,e.y-10, `${dmg}`, '#A78BFA');
            e.hitFlash=0.12;
            hits++;
            if(dead){ this.kills++; if(Math.random()<0.9) this.spawnGemAt(e.x,e.y); this.audio.enemyDeath(); }
        }
        if(hits>0 && Math.random()<0.3) this.audio.enemyHit();
    }

    _doUltimatePicaroTick(ult){
        const p=this.player;
        const dmg=Math.ceil(ult.bombDamage * p.stats.damageMultiplier);
        const radius=ult.bombRadius;
        for(let i=0;i<1;i++){
            const ang = Math.random()*Math.PI*2;
            const dist = 38 + Math.random()*42;
            const bx = p.x + Math.cos(ang)*dist;
            const by = p.y + Math.sin(ang)*dist;
            this.ultimateBombs.push({x:bx,y:by, timer:0.22, damage:dmg, radius, life:0.45});
            this.spawnExplosion(bx,by,12,'#6EE7B7');
        }
        if(Math.floor(ult.timer*10)%3===0){
            for(let k=0;k<8;k++){
                const ang=k*(Math.PI*2/8) + this.elapsed*1.5;
                const bx=p.x + Math.cos(ang)*52;
                const by=p.y + Math.sin(ang)*52;
                this.ultimateBombs.push({x:bx,y:by, timer:0.18, damage:dmg, radius: radius*0.85, life:0.38});
            }
        }
        this.audio.dagger();
    }
    _doUltimateCu(tx, ty, ultCfg) {
        const p = this.player;
        // Marca en el suelo (indicador visual)
        this.spawnExplosion(tx, ty, 18, '#F87171');

        // Retardo de 0.35s y luego explosión inicial + replicación
        setTimeout(() => {
            if (this.state !== 'GAMEPLAY' || !this.player) return;

            const baseDmg = Math.ceil(ultCfg.damage * p.stats.damageMultiplier);
            const explosionRadius = ultCfg.explosion; // 96
            const maxReplications = 5;
            const replicationRadius = 180; // radio de búsqueda para replicar

            // Conjunto de enemigos ya afectados (para no replicar dos veces desde el mismo)
            const hitEnemies = new Set();
            // Cola de explosiones a procesar: { x, y, sourceEnemy, depth }
            const explosionQueue = [{ x: tx, y: ty, sourceEnemy: null, depth: 0 }];
            let totalReplications = 0;

            const processExplosion = (ex) => {
                const candidates = this.entityManager.grid.query(ex.x, ex.y, explosionRadius);
                const hitInThisExplosion = [];

                for (const e of candidates) {
                    if (e.type !== 'enemy' || !e.alive) continue;
                    if (hitEnemies.has(e)) continue; // ya fue golpeado por alguna explosión anterior

                    const dx = e.x - ex.x, dy = e.y - ex.y;
                    if (dx*dx + dy*dy >= explosionRadius*explosionRadius) continue;

                    // Golpear enemigo
                    const dead = e.takeDamage(baseDmg);
                    this.spawnDamageNumber(e.x, e.y-14, `${baseDmg}`, '#F87171');
                    const len = Math.hypot(dx, dy) || 1;
                    e.applyKnockback(dx/len, dy/len, 88);

                    hitEnemies.add(e);
                    hitInThisExplosion.push(e);

                    if (dead) {
                        this.kills++;
                        if (Math.random() < 0.9) this.spawnGemAt(e.x, e.y);
                        this.audio.enemyDeath();
                    } else {
                        this.audio.enemyHit();
                    }
                }

                // Explosión visual
                this.spawnExplosion(ex.x, ex.y, explosionRadius, '#991B1B');
                this.audio.fireballExplode();

                // REPLICACIÓN: desde cada enemigo golpeado en ESTA explosión, buscar 1 objetivo nuevo
                if (totalReplications < maxReplications && ex.depth < 3) { // límite de profundidad 3
                    for (const sourceEnemy of hitInThisExplosion) {
                        if (totalReplications >= maxReplications) break;

                        // Buscar enemigo cercano NO golpeado aún
                        const nearby = this.entityManager.grid.query(sourceEnemy.x, sourceEnemy.y, replicationRadius);
                        let target = null, bestD2 = replicationRadius * replicationRadius;

                        for (const e of nearby) {
                            if (e.type !== 'enemy' || !e.alive) continue;
                            if (hitEnemies.has(e)) continue; // ya afectado
                            const d2 = (e.x - sourceEnemy.x)**2 + (e.y - sourceEnemy.y)**2;
                            if (d2 < bestD2) { bestD2 = d2; target = e; }
                        }

                        if (target) {
                            totalReplications++;
                            // Visual: lanza conectando source -> target
                            this._renderGaeBolgLance(sourceEnemy.x, sourceEnemy.y, target.x, target.y);
                            // Programar explosión en el nuevo objetivo (pequeño delay escalonado)
                            setTimeout(() => {
                                if (this.state !== 'GAMEPLAY') return;
                                processExplosion({
                                    x: target.x,
                                    y: target.y,
                                    sourceEnemy: target,
                                    depth: ex.depth + 1
                                });
                            }, 60 * totalReplications); // 60ms entre cada replicación
                        }
                    }
                }
            };

            // Iniciar cadena
            processExplosion(explosionQueue[0]);

        }, 360);
    }

    // Helper visual: dibuja una lanza momentánea entre dos puntos
    _renderGaeBolgLance(x1, y1, x2, y2) {
        // Crear un texto flotante especial que simule la lanza
        // (el render real se hace en el frame actual via un array temporal)
        if (!this._gaeBolgLances) this._gaeBolgLances = [];
        this._gaeBolgLances.push({
            x1, y1, x2, y2,
            life: 0.25,
            maxLife: 0.25,
            created: performance.now()
        });
        // Auto-limpiar
        setTimeout(() => {
            if (this._gaeBolgLances) {
                this._gaeBolgLances = this._gaeBolgLances.filter(l => l.life > 0);
            }
        }, 300);
    }
    _doUltimateEmiyaTick(ult){
        const p=this.player;
        const dmg=Math.ceil(ult.tickDamage * p.stats.damageMultiplier);
        const r=ult.radius;
        const candidates=this.entityManager.grid.query(p.x,p.y,r);
        let hits=0;
        for(const e of candidates){
            if(e.type!=='enemy'||!e.alive) continue;
            const dx=e.x-p.x, dy=e.y-p.y;
            if(dx*dx+dy*dy < r*r){
                const dead=e.takeDamage(dmg);
                if(hits<3) this.spawnDamageNumber(e.x,e.y-10, `${dmg}`, '#D4D4D8');
                e.hitFlash=0.1;
                // efecto de corte: pequeño empuje aleatorio
                e.applyKnockback((Math.random()-0.5), (Math.random()-0.5), 12);
                hits++;
                if(dead){ this.kills++; if(Math.random()<0.75) this.spawnGemAt(e.x,e.y); this.audio.enemyDeath(); }
            }
        }
        if(hits>0 && Math.random()<0.25) this.audio.enemyHit();
    }

    // ===== DEFinitivas: Alucard / Kratos / Musashi =====

    _doUltimateAlucard(){
        const p=this.player;
        const ult=CONFIG.ULTIMATES.alucard;
        const count = ult.familiarCount + (p._alucardBonus||0);
        const familiars = [];
        for(let i=0;i<count;i++){
            familiars.push({
                idx: i,
                angle: (i/count)*Math.PI*2,
                orbitSpeed: 1.6 + (i%3)*0.35,
                dist: 58 + (i%2)*16,
                x: p.x, y: p.y,
                tick: 0.2 + i*0.03,
                tickRate: 0.55,
                damage: ult.familiarDamage,
                radius: ult.familiarRadius
            });
        }
        this._alucardFamiliars = familiars;
        this.ultimateActive = { type:'alucard', timer: ult.duration };
        this.audio.levelUp(); this.audio.shieldUp();
        this.spawnPickupText(p.x, p.y-28, 'LIBERATION!', '#F87171');
    }

    _updateUltimateAlucard(dt){
        const p=this.player;
        const ult=this.ultimateActive;
        const fams=this._alucardFamiliars;
        if(!fams || !p) return;
        for(const f of fams){
            // Orbitar alrededor del jugador
            f.angle += dt * f.orbitSpeed;
            f.x = p.x + Math.cos(f.angle)*f.dist;
            f.y = p.y + Math.sin(f.angle)*f.dist;
            f.tick -= dt;
            if(f.tick>0) continue;
            f.tick = f.tickRate;
            if(!p.alive) continue;
            // Cazar enemigo más cercano dentro del radio
            const candidates = this.entityManager.grid.query(f.x, f.y, f.radius);
            let target=null, bestD2=f.radius*f.radius;
            for(const e of candidates){
                if(e.type!=='enemy'||!e.alive) continue;
                const d2=(e.x-f.x)**2+(e.y-f.y)**2;
                if(d2<bestD2){ bestD2=d2; target=e; }
            }
            if(!target) continue;
            const isCrit = Math.random()<p.stats.critChance;
            const dmg = Math.ceil(f.damage * p.stats.damageMultiplier * (isCrit? p.stats.critDamage:1));
            const dead = target.takeDamage(dmg);
            this.spawnDamageNumber(target.x, target.y-12, isCrit?`${dmg}!`:`${dmg}`, isCrit?'#FFBE0B':'#FCA5A5');
            target.hitFlash=0.12;
            if(dead){ this.kills++; if(Math.random()<0.85) this.spawnGemAt(target.x,target.y); this.audio.enemyDeath(); }
            else this.audio.enemyHit();
            if(Math.random()<0.4) this.spawnExplosion(target.x, target.y, 26, '#F87171');
        }
        if(ult.timer<=0) this._alucardFamiliars = [];
    }

    _doUltimateKratos(){
        const p=this.player;
        const ult=CONFIG.ULTIMATES.kratos;
        p._rageSpeedBoost = ult.speedMult;
        this._kratosRagePulse = 0;
        this.ultimateActive = { type:'kratos', timer: ult.duration, damage:ult.damage, radius:ult.radius, tickRate:ult.tickRate, tick:0, lifesteal:ult.lifesteal };
        this.audio.levelUp(); this.audio.whip();
        this.spawnPickupText(p.x, p.y-28, 'IRA ESPARTANA!', '#FCA5A5');
    }

    _updateUltimateKratos(dt){
        const p=this.player;
        const ult=this.ultimateActive;
        this._kratosRagePulse += dt*5;
        ult.tick -= dt;
        if(ult.tick>0) return;
        ult.tick = ult.tickRate;
        const dmg = Math.ceil(ult.damage * p.stats.damageMultiplier);
        const r = ult.radius;
        const candidates = this.entityManager.grid.query(p.x, p.y, r);
        let hits=0;
        for(const e of candidates){
            if(e.type!=='enemy'||!e.alive) continue;
            const dx=e.x-p.x, dy=e.y-p.y;
            if(dx*dx+dy*dy > r*r) continue;
            const dead = e.takeDamage(dmg);
            this.spawnDamageNumber(e.x, e.y-13, `${dmg}`, '#FCA5A5');
            const len = Math.hypot(dx,dy)||1;
            e.applyKnockback(dx/len, dy/len, 130);
            e.hitFlash = 0.14;
            hits++;
            if(dead){ this.kills++; if(Math.random()<0.85) this.spawnGemAt(e.x,e.y); this.audio.enemyDeath(); }
            else this.audio.enemyHit();
        }
        if(ult.lifesteal && hits>0) p.heal(dmg * ult.lifesteal);
        this.spawnExplosion(p.x, p.y, r*0.5, '#991B1B');
    }

    _doUltimateMusashi(){
        const p=this.player;
        const ult=CONFIG.ULTIMATES.musashi;
        const duration = ult.duration + (p._musashiBonus||0);
        this._musashiStanceCount = 0;
        this._musashiStances = [];
        this.ultimateActive = { type:'musashi', timer: duration, damage:ult.stanceDamage, radius:ult.stanceRadius, interval:ult.stanceInterval, tick:0.4, pulses:0 };
        this.audio.levelUp(); this.audio.whip();
        this.spawnPickupText(p.x, p.y-28, 'GORIN NO SHO!', '#FFBE0B');
    }

    _updateUltimateMusashi(dt){
        const p=this.player;
        const ult=this.ultimateActive;
        // Decaimiento de posturas visuales
        if(this._musashiStances){
            for(const s of this._musashiStances) s.timer -= dt;
            this._musashiStances = this._musashiStances.filter(s=>s.timer>0);
        }
        ult.tick -= dt;
        if(ult.tick>0) return;
        ult.tick = ult.interval;
        ult.pulses++;
        this._musashiStanceCount = ult.pulses;
        // Visual de postura expansiva
        this._musashiStances.push({ radius: ult.radius, timer: ult.interval, maxTimer: ult.interval });
        const dmg = Math.ceil(ult.damage * p.stats.damageMultiplier);
        const r = ult.radius;
        const candidates = this.entityManager.grid.query(p.x, p.y, r);
        let hits=0;
        for(const e of candidates){
            if(e.type!=='enemy'||!e.alive) continue;
            const dx=e.x-p.x, dy=e.y-p.y;
            if(dx*dx+dy*dy > r*r) continue;
            const isCrit = Math.random()<p.stats.critChance;
            const finalDmg = Math.ceil(dmg*(isCrit? p.stats.critDamage:1));
            const dead = e.takeDamage(finalDmg);
            this.spawnDamageNumber(e.x, e.y-13, isCrit?`${finalDmg}!`:`${finalDmg}`, isCrit?'#FFBE0B':'#FFD700');
            const len=Math.hypot(dx,dy)||1;
            e.applyKnockback(dx/len, dy/len, 90);
            e.hitFlash=0.12;
            hits++;
            if(dead){ this.kills++; if(Math.random()<0.8) this.spawnGemAt(e.x,e.y); this.audio.enemyDeath(); }
            else this.audio.enemyHit();
        }
        this.spawnExplosion(p.x, p.y, r*0.55, '#FFBE0B');
        this.audio.whip();
    }

    _updateUltimateButton(){
        const btn=document.getElementById('ultimate-btn');
        const side=document.getElementById('side-notice');
        if(btn){
            const isMenu = (this.state===GameState.MENU || this.state===GameState.CLASS_SELECT);
            const inGame = (this.state===GameState.GAMEPLAY);
            // side notice solo en menú
            if(side) side.classList.toggle('hidden', !isMenu);
            // botón solo en gameplay
            btn.classList.toggle('hidden', !inGame);
            if(inGame){
                const cd=Math.ceil(this.ultimateCooldown);
                const fill=btn.querySelector('.ult-fill');
                const label=btn.querySelector('.ult-cooldown');
                if(label) label.textContent = cd>0 ? `${cd}` : 'LISTO';
                if(fill){
                    const pct = this.ultimateCooldown>0 ? (this.ultimateCooldown/30*100) : 0;
                    fill.style.height = `${pct}%`;
                }
                btn.classList.toggle('cooldown', this.ultimateCooldown>0);
                btn.classList.toggle('active', this.ultimateActive!==null);
                const lab=btn.querySelector('.ult-label');
                if(lab && this.player){
                    const names={caballero:'CORTE', mago:'RAYO', picaro:'BOMBAS', artoria:'EXCAL', cu:'GAE', emiya:'UBW', alucard:'LIB', kratos:'RAGE', musashi:'GORIN'};
                    lab.textContent = names[this.player.classId]||'ULT';
                }
            }
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
    _fireArrow(tx,ty){
        const p=this.player;
        const dmg=Math.ceil(13 * p.stats.damageMultiplier * (Math.random()<p.stats.critChance? p.stats.critDamage:1));
        const proj=new Projectile(p.x,p.y,tx,ty,560,dmg,5,'#D4D4D8');
        proj.isCrit = Math.random()<p.stats.critChance;
        proj.isArrow = true;
        // flecha alargada: dirección
        const ang=Math.atan2(ty-p.y, tx-p.x);
        proj.angle=ang;
        this.entityManager.add(proj);
        this.audio.shoot();
    }
    _doArtoriaSword(){
        // Alterna: primer golpe hacia un lado, segundo hacia el opuesto
        const p = this.player;
        if(!p) return;
        // Buscar enemigo más cercano para orientación base
        let nearest = null, bestD2 = (CONFIG.PLAYER.CLASSES.artoria.weaponMods.range||118)**2;
        const preCandidates = this.entityManager.grid.query(p.x, p.y, bestD2+6);
        for(const e of preCandidates){
            if(e.type!=='enemy' || !e.alive) continue;
            const dx=e.x-p.x, dy=e.y-p.y;
            const d2=dx*dx+dy*dy;
            if(d2 < bestD2){ bestD2=d2; nearest=e; }
        }
        const baseAngle = nearest ? Math.atan2(nearest.y - p.y, nearest.x - p.x) : (p.facing===1?0:Math.PI);
        const arc = CONFIG.WEAPONS.WHIP.arc; // ~189°
        // Primer golpe: offset -arc/2 (izquierda) o +arc/2 (derecha) alternando
        this._artoriaSwingDir = (this._artoriaSwingDir === 1) ? -1 : 1; // alterna 1, -1, 1...
        const swingOffset = this._artoriaSwingDir * (arc / 2); // ±94.5°
        const angle1 = baseAngle + swingOffset;
        p.facing = Math.cos(angle1) >= 0 ? 1 : -1;
        // Primer golpe con ángulo forzado
        this._doWhip(angle1);
        // Segundo golpe en dirección opuesta tras 95ms
        setTimeout(()=>{
            if(this.state!=='GAMEPLAY' || !this.player || this.player.classId!=='artoria') return;
            this._artoriaSwingDir *= -1;
            const swingOffset2 = this._artoriaSwingDir * (arc / 2);
            const angle2 = baseAngle + swingOffset2;
            p.facing = Math.cos(angle2) >= 0 ? 1 : -1;
            this._doWhip(angle2);
        }, 95);
    }
    _doLance(){
        const p=this.player;
        const clsCfg = CONFIG.PLAYER.CLASSES.cu;
        const range = clsCfg.weaponMods.range || 168;
        const width = clsCfg.weaponMods.width || 38; // ahora usa config (38)
        const baseDmg = clsCfg.weaponMods.damage || 26;
        const dmg = Math.ceil(baseDmg * p.stats.damageMultiplier);
        // dirección al más cercano o facing
        let dirX=p.facing, dirY=0;
        let nearest=null, bestD2=420*420;
        for(const e of this.entityManager.enemies){
            if(!e.alive) continue;
            const d2=(e.x-p.x)**2+(e.y-p.y)**2;
            if(d2<bestD2){ bestD2=d2; nearest=e; }
        }
        if(nearest){
            const dx=nearest.x-p.x, dy=nearest.y-p.y; const len=Math.hypot(dx,dy)||1;
            dirX=dx/len; dirY=dy/len;
            p.facing = dirX>=0?1:-1;
        }
        this._lanceAngle=Math.atan2(dirY,dirX);
        this._lanceFlash=0.18;
        // daño en línea: rectángulo desde p hacia dir
        const halfW=width/2;
        const px=-dirY, py=dirX;
        const candidates=this.entityManager.grid.query(p.x + dirX*range/2, p.y + dirY*range/2, range/2 + halfW + 14);
        let hits=0;
        for(const e of candidates){
            if(e.type!=='enemy'||!e.alive) continue;
            const ex=e.x-p.x, ey=e.y-p.y;
            const proj=ex*dirX + ey*dirY;
            if(proj<0||proj>range) continue;
            const perp=Math.abs(ex*px + ey*py);
            if(perp > halfW + e.radius) continue;
            // Falloff: más cerca de la punta = más daño (lineal 0.6x en base → 1.3x en punta)
            const tipFactor = 0.6 + 0.7 * (proj / range);
            const isCrit=Math.random()<p.stats.critChance;
            const finalDmg=Math.ceil(dmg * tipFactor * (isCrit? p.stats.critDamage:1));
            const dead=e.takeDamage(finalDmg);
            this.spawnDamageNumber(e.x,e.y-13, isCrit?`${finalDmg}!`:`${finalDmg}`, isCrit?'#FFBE0B':'#fff');
            e.applyKnockback(dirX, dirY, 62);
            hits++;
            if(dead){ this.kills++; if(Math.random()<0.72) this.spawnGemAt(e.x,e.y); this.audio.enemyDeath(); }
            else this.audio.enemyHit();
        }
        if(hits>0) this.audio.whip();
    }
    _doWhip(forcedAngle = null){
        const p=this.player;
        const cls = p.classId === 'artoria' ? 'artoria' : 'caballero';
        const range = CONFIG.PLAYER.CLASSES[cls].weaponMods.range || 108;
        const dmg = Math.ceil(CONFIG.PLAYER.CLASSES[cls].weaponMods.damage * p.stats.damageMultiplier);
        const arc = CONFIG.WEAPONS.WHIP.arc;

        let whipAngle;
        // SIEMPRE consultar grid para tener candidatos (tanto Artoria como Caballero)
        const preCandidates = this.entityManager.grid.query(p.x, p.y, range+6);

        if (forcedAngle !== null) {
            // Artoria: usar ángulo forzado (ya calculado con offset ±arc/2)
            whipAngle = forcedAngle;
            p.facing = Math.cos(whipAngle) >= 0 ? 1 : -1;
        } else {
            // Caballero: auto-aim al enemigo más cercano
            whipAngle = p.facing===1 ? 0 : Math.PI;
            let nearest = null, bestD2 = range*range;
            for(const e of preCandidates){
                if(e.type!=='enemy' || !e.alive) continue;
                const dx=e.x-p.x, dy=e.y-p.y;
                const d2=dx*dx+dy*dy;
                if(d2 < bestD2){ bestD2=d2; nearest=e; }
            }
            if(nearest){
                whipAngle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
                p.facing = Math.cos(whipAngle) >= 0 ? 1 : -1;
            }
        }

        this._whipAngle = whipAngle;
        // Query grid en radio range (ya tenemos preCandidates)
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
        // Registrar swing visual (array para soportar dos golpes superpuestos de Artoria)
        if (!this._whipSwings) this._whipSwings = [];
        this._whipSwings.push({ angle: whipAngle, timer: 0.18, maxTimer: 0.18, isArtoria: cls === 'artoria' });
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
                // Bombas de la definitiva del pícaro
                for(const b of this.ultimateBombs){
                    b.timer-=dt; b.life-=dt;
                    if(b.timer<=0 && !b.exploded){
                        b.exploded=true;
                        const candidates=this.entityManager.grid.query(b.x,b.y,b.radius);
                        for(const e of candidates){
                            if(e.type!=='enemy'||!e.alive) continue;
                            const dx=e.x-b.x, dy=e.y-b.y;
                            if(dx*dx+dy*dy < b.radius*b.radius){
                                const dead=e.takeDamage(b.damage);
                                this.spawnDamageNumber(e.x,e.y-12, `${b.damage}`, '#6EE7B7');
                                const len=Math.hypot(dx,dy)||1;
                                e.applyKnockback(dx/len, dy/len, 38);
                                if(dead){ this.kills++; if(Math.random()<0.8) this.spawnGemAt(e.x,e.y); this.audio.enemyDeath(); }
                            }
                        }
                        this.spawnExplosion(b.x,b.y,b.radius,'#6EE7B7');
                        this.audio.fireballExplode();
                    }
                }
                this.ultimateBombs=this.ultimateBombs.filter(b=>b.life>0);

                this._centerCamera(false);

                // Recolección de gemas ya está en Gem.update (magnet)
                // Level up ya disparado desde Gem

                // Actualizar hacha Léviatán (Kratos)
                this._updateLeviathan(dt);
                // Actualizar slashes Musashi
                this._updateMusashiSlashes(dt);

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

    // ===== NUEVAS ARMAS =====

    _fireAlucardShot(startX, startY, angle){
        const p=this.player;
        const mods = CONFIG.PLAYER.CLASSES.alucard.weaponMods;
        const dmg = Math.ceil((mods.damage || 16) * p.stats.damageMultiplier * (Math.random()<p.stats.critChance? p.stats.critDamage:1));
        const speed = mods.speed || 680;
        const vx = Math.cos(angle)*speed, vy = Math.sin(angle)*speed;
        const proj = new Projectile(startX, startY, startX+vx, startY+vy, speed, dmg, 5, '#F87171');
        proj.isCrit = Math.random()<p.stats.critChance;
        this.entityManager.add(proj);
        this.audio.shoot();
        // Flash visual de pistola
        this._alucardMuzzleFlash = { x: startX, y: startY, angle, timer: 0.06 };
    }

    _throwLeviathan(tx, ty){
        const p=this.player;
        const mods = CONFIG.PLAYER.CLASSES.kratos.weaponMods;
        const dmg = Math.ceil((mods.damage || 42) * p.stats.damageMultiplier);
        const speed = 480;
        const ang = Math.atan2(ty-p.y, tx-p.x);
        this._leviathan = {
            x: p.x, y: p.y,
            vx: Math.cos(ang)*speed, vy: Math.sin(ang)*speed,
            targetX: tx, targetY: ty,
            damage: dmg,
            ricochetLeft: (mods.ricochet || 2) + (p._kratosBonus||0),
            returning: false,
            returnSpeed: 600,
            trail: []
        };
        this.audio.whip(); // sonido de lanzamiento
    }

    _recallLeviathan(){
        if(!this._leviathan || this._leviathan.returning) return;
        const p=this.player;
        this._leviathan.returning = true;
        this.audio.shieldUp(); // sonido de recall
    }

    _updateLeviathan(dt){
        if(!this._leviathan) return;
        const l = this._leviathan;
        const p = this.player;

        if(!l.returning){
            // Volando hacia objetivo
            l.x += l.vx * dt;
            l.y += l.vy * dt;
            l.trail.unshift({x:l.x, y:l.y});
            if(l.trail.length>10) l.trail.pop();

            // Colisión con enemigos (ida)
            const candidates = this.entityManager.grid.query(l.x, l.y, 20);
            for(const e of candidates){
                if(e.type!=='enemy'||!e.alive) continue;
                const dx=l.x-e.x, dy=l.y-e.y, r=l.radius||12;
                if(dx*dx+dy*dy < r*r){
                    const dead = e.takeDamage(l.damage);
                    this.spawnDamageNumber(e.x,e.y-12, `${l.damage}`, '#E2E8F0');
                    e.applyKnockback(dx,dy,40);
                    if(dead){ this.kills++; if(Math.random()<0.8) this.spawnGemAt(e.x,e.y); this.audio.enemyDeath(); }
                    else this.audio.enemyHit();

                    // Ricochet
                    if(l.ricochetLeft > 0){
                        l.ricochetLeft--;
                        // Buscar nuevo target cercano
                        const nearby = this.entityManager.grid.query(l.x, l.y, 180);
                        let next = null, bestD2=180*180;
                        for(const e2 of nearby){
                            if(e2.type!=='enemy'||!e2.alive||e2===e) continue;
                            const d2=(e2.x-l.x)**2+(e2.y-l.y)**2;
                            if(d2<bestD2){ bestD2=d2; next=e2; }
                        }
                        if(next){
                            const ang = Math.atan2(next.y-l.y, next.x-l.x);
                            l.vx = Math.cos(ang)*480; l.vy = Math.sin(ang)*480;
                            return; // continuar volando
                        }
                    }
                    // Sin ricochet o sin target -> volver
                    l.returning = true;
                    return;
                }
            }
        } else {
            // Volviendo al jugador
            const dx = p.x - l.x, dy = p.y - l.y;
            const dist = Math.hypot(dx,dy);
            if(dist < 25){
                // Llegó al jugador
                this._leviathan = null;
                return;
            }
            const speed = l.returnSpeed;
            l.vx = (dx/dist)*speed; l.vy = (dy/dist)*speed;
            l.x += l.vx * dt; l.y += l.vy * dt;
            l.trail.unshift({x:l.x, y:l.y});
            if(l.trail.length>10) l.trail.pop();

            // Daño en retorno (menor)
            const candidates = this.entityManager.grid.query(l.x, l.y, 20);
            for(const e of candidates){
                if(e.type!=='enemy'||!e.alive) continue;
                const dmg = Math.ceil((CONFIG.PLAYER.CLASSES.kratos.weaponMods.recallDamage||28) * p.stats.damageMultiplier);
                const dead = e.takeDamage(dmg);
                this.spawnDamageNumber(e.x,e.y-10, `${dmg}`, '#94A3B8');
                if(dead){ this.kills++; if(Math.random()<0.7) this.spawnGemAt(e.x,e.y); this.audio.enemyDeath(); }
            }
        }

        // Fuera de límites -> volver
        if(l.x < -50 || l.x > this.worldWidth+50 || l.y < -50 || l.y > this.worldHeight+50){
            l.returning = true;
        }
    }

    _doMusashiSlash(hand){
        // hand: 1 = derecha, -1 = izquierda
        const p=this.player;
        const mods = CONFIG.PLAYER.CLASSES.musashi.weaponMods;
        const range = mods.range || 105;
        const dmg = Math.ceil((mods.damage || 18) * p.stats.damageMultiplier);
        const arc = Math.PI * 0.9; // ~162°

        // Ángulo base hacia enemigo más cercano o facing
        let baseAngle = p.facing===1 ? 0 : Math.PI;
        let nearest=null, bestD2=range*range;
        const candidates = this.entityManager.grid.query(p.x, p.y, range+6);
        for(const e of candidates){
            if(e.type!=='enemy'||!e.alive) continue;
            const dx=e.x-p.x, dy=e.y-p.y, d2=dx*dx+dy*dy;
            if(d2<bestD2){ bestD2=d2; nearest=e; }
        }
        if(nearest){
            baseAngle = Math.atan2(nearest.y-p.y, nearest.x-p.x);
            p.facing = Math.cos(baseAngle)>=0?1:-1;
        }

        // Offset según mano (±30° del centro)
        const handOffset = hand * (Math.PI/6); // ±30°
        const slashAngle = baseAngle + handOffset;

        // Activar ventana de parry
        this._musashiParryTimer = mods.parryWindow || 0.35;

        // Visual
        this._musashiSlashes = this._musashiSlashes || [];
        this._musashiSlashes.push({ angle: slashAngle, hand, timer: 0.15, maxTimer: 0.15 });

        // Daño en arco
        const halfArc = arc/2;
        const hits = [];
        for(const e of candidates){
            if(e.type!=='enemy'||!e.alive) continue;
            const dx=e.x-p.x, dy=e.y-p.y, d2=dx*dx+dy*dy;
            if(d2>range*range) continue;
            const ang = Math.atan2(dy,dx);
            let delta = Math.abs(ang - slashAngle);
            if(delta>Math.PI) delta=2*Math.PI-delta;
            if(delta > halfArc) continue;

            const isCrit = Math.random() < p.stats.critChance;
            const finalDmg = Math.ceil(dmg * (isCrit? p.stats.critDamage:1));
            const dead = e.takeDamage(finalDmg);
            this.spawnDamageNumber(e.x, e.y-13, isCrit?`${finalDmg}!`:`${finalDmg}`, isCrit?'#FFBE0B':'#FFD700');
            e.applyKnockback(Math.cos(slashAngle), Math.sin(slashAngle), 55);
            hits.push(e);
            if(dead){ this.kills++; if(Math.random()<0.75) this.spawnGemAt(e.x,e.y); this.audio.enemyDeath(); }
            else this.audio.enemyHit();
        }
        if(hits.length>0) this.audio.whip();

        // Segundo golpe dual (misma mano, 60ms después)
        if(mods.dualHits > 1){
            setTimeout(()=>{
                if(this.state!=='GAMEPLAY'||!this.player||this.player.classId!=='musashi') return;
                for(const e of hits){
                    if(!e.alive) continue;
                    const isCrit = Math.random() < p.stats.critChance;
                    const finalDmg = Math.ceil(dmg * 0.7 * (isCrit? p.stats.critDamage:1)); // 70% dmg
                    const dead = e.takeDamage(finalDmg);
                    this.spawnDamageNumber(e.x, e.y-10, isCrit?`${finalDmg}!`:`${finalDmg}`, isCrit?'#FFBE0B':'#FFD700');
                    if(dead){ this.kills++; if(Math.random()<0.7) this.spawnGemAt(e.x,e.y); this.audio.enemyDeath(); }
                }
            }, 60);
        }
    }

    _updateMusashiSlashes(dt){
        if(!this._musashiSlashes) return;
        for(const s of this._musashiSlashes) s.timer -= dt;
        this._musashiSlashes = this._musashiSlashes.filter(s=>s.timer>0);
    }

    _tryMusashiParry(attacker){
        if(this._musashiParryTimer<=0) return false;
        if(!attacker || !attacker.alive) return false;
        const p=this.player;
        this._musashiParryTimer = 0;
        const mods = CONFIG.PLAYER.CLASSES.musashi.weaponMods;
        const baseDmg = Math.ceil((mods.damage||18) * 2.2 * p.stats.damageMultiplier);
        const dx = attacker.x - p.x, dy = attacker.y - p.y;
        const len = Math.hypot(dx,dy)||1;
        attacker.applyKnockback(dx/len, dy/len, 150);
        attacker.hitFlash = 0.2;
        const isCrit = Math.random()<p.stats.critChance;
        const finalDmg = Math.ceil(baseDmg*(isCrit? p.stats.critDamage:1));
        const dead = attacker.takeDamage(finalDmg);
        this.spawnDamageNumber(attacker.x, attacker.y-14, isCrit?`${finalDmg}!`:`${finalDmg}`, '#FFBE0B');
        this._musashiSlashes = this._musashiSlashes || [];
        this._musashiSlashes.push({ angle: Math.atan2(dy,dx), hand: 0, timer: 0.3, maxTimer: 0.3, isParry: true });
        this.audio.shieldBlock();
        if(dead){ this.kills++; if(Math.random()<0.8) this.spawnGemAt(attacker.x, attacker.y); this.audio.enemyDeath(); }
        else this.audio.enemyHit();
        return true;
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
            case 'artoria_up': p.stats.damageMultiplier+=0.12; p._artoriaBonus=(p._artoriaBonus||0)+4; break;
            case 'cu_up': p.stats.damageMultiplier+=0.10; p._cuBonus=(p._cuBonus||0)+18; break;
            case 'emiya_up': p.stats.projectileCount+=1; p._emiyaBonus=(p._emiyaBonus||0)+1; break;
            case 'alucard_up': p._alucardBonus=(p._alucardBonus||0)+2; break;
            case 'kratos_up': p._kratosBonus=(p._kratosBonus||0)+2; break;
            case 'musashi_up': p._musashiBonus=(p._musashiBonus||0)+2.4; break;
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

        // Whip / Espada arcos visuales — ahora usando array _whipSwings (soporta 2 golpes superpuestos Artoria)
        if(this._whipSwings && this._whipSwings.length > 0 && this.player){
            const p=this.player;
            const sxp=p.x - cam.x, syp=p.y - cam.y;
            const arc = CONFIG.WEAPONS.WHIP.arc; // ~1.05 PI = 189°

            for(const swing of this._whipSwings){
                const alpha = swing.timer / swing.maxTimer; // 1.0 -> 0.0
                if (alpha <= 0) continue;

                const isArtoria = swing.isArtoria;
                const range = isArtoria ? (CONFIG.PLAYER.CLASSES.artoria.weaponMods.range||118) : (CONFIG.PLAYER.CLASSES.caballero.weaponMods.range||108);
                const angle = swing.angle; // ángulo fijo del golpe (ya tiene el offset ±arc/2 aplicado)
                const start = angle - arc/2;

                if (isArtoria) {
                    // Artoria: arco azul/dorado nítido, sin barrido interno
                    ctx.fillStyle=`rgba(30,64,175,${0.35*alpha})`; // azul Artoria
                    ctx.strokeStyle=`rgba(255,190,11,${0.7*alpha})`; // borde dorado
                    ctx.lineWidth=3;
                    ctx.beginPath(); ctx.moveTo(sxp,syp); ctx.arc(sxp,syp, range, start, start+arc); ctx.closePath(); ctx.fill(); ctx.stroke();
                    // Brillo central dorado en la dirección del golpe
                    ctx.fillStyle=`rgba(255,190,11,${0.5*alpha})`;
                    ctx.beginPath(); ctx.arc(sxp + Math.cos(angle)*range*0.55, syp + Math.sin(angle)*range*0.55, 12, 0, Math.PI*2); ctx.fill();
                    // Línea de "corte" fina desde el jugador hasta el borde
                    ctx.strokeStyle=`rgba(255,255,255,${0.45*alpha})`;
                    ctx.lineWidth=1.5;
                    ctx.beginPath(); ctx.moveTo(sxp, syp); ctx.lineTo(sxp + Math.cos(angle)*range, syp + Math.sin(angle)*range); ctx.stroke();
                } else {
                    // Caballero: arco bordó/blanco (comportamiento original)
                    ctx.fillStyle=`rgba(97,12,39,${0.3*alpha})`;
                    ctx.strokeStyle=`rgba(226,232,240,${0.5*alpha})`;
                    ctx.lineWidth=2;
                    ctx.beginPath(); ctx.moveTo(sxp,syp); ctx.arc(sxp,syp, range, start, start+arc); ctx.closePath(); ctx.fill(); ctx.stroke();
                    ctx.fillStyle=`rgba(59,7,84,${0.25*alpha})`;
                    ctx.beginPath(); ctx.arc(sxp + Math.cos(angle)*range*0.58, syp + Math.sin(angle)*range*0.58, 9, 0, Math.PI*2); ctx.fill();
                }
            }
        }
        // Lanza roja Cu -- línea recta (ancho desde config)
        if(this._lanceFlash>0 && this.player && this.player.classId==='cu'){
            const p=this.player;
            const sxp=p.x - cam.x, syp=p.y - cam.y;
            const ang=this._lanceAngle || 0;
            const clsCfg = CONFIG.PLAYER.CLASSES.cu;
            const range = clsCfg.weaponMods.range || 168;
            const width = clsCfg.weaponMods.width || 38;
            const alpha=this._lanceFlash / 0.18;
            ctx.save();
            ctx.translate(sxp, syp);
            ctx.rotate(ang);
            // asta (ancho variable)
            const halfW = width/2;
            ctx.fillStyle=`rgba(153,27,27,${0.92*alpha})`;
            ctx.fillRect(0, -halfW, range, width);
            ctx.fillStyle=`rgba(248,113,113,${0.95*alpha})`;
            ctx.fillRect(0, -halfW*0.4, range, width*0.4);
            // punta triangular
            ctx.fillStyle='#000';
            ctx.beginPath(); ctx.moveTo(range, -halfW*1.6); ctx.lineTo(range + 14, 0); ctx.lineTo(range, halfW*1.6); ctx.closePath(); ctx.fill();
            ctx.fillStyle='#F87171';
            ctx.beginPath(); ctx.moveTo(range, -halfW*1.2); ctx.lineTo(range + 10, 0); ctx.lineTo(range, halfW*1.2); ctx.closePath(); ctx.fill();
            ctx.fillStyle='#FFFFFF';
            ctx.beginPath(); ctx.moveTo(range, -halfW*0.6); ctx.lineTo(range + 6, 0); ctx.lineTo(range, halfW*0.6); ctx.closePath(); ctx.fill();
            ctx.restore();
            this._lanceFlash-=0.016;
            if(this._lanceFlash<0) this._lanceFlash=0;
        }

        // Definitivas (todas)
        if(this.ultimateActive){
            const ult=this.ultimateActive;
            const p=this.player; const sxp=p.x - cam.x, syp=p.y - cam.y;
            if(ult.type==='caballero'){
                const prog = 1 - (ult.timer / CONFIG.ULTIMATES.caballero.duration);
                const r = ult.range * (0.2 + prog*0.85);
                const alpha = (ult.timer / CONFIG.ULTIMATES.caballero.duration) * 0.42;
                ctx.fillStyle=`rgba(255,190,11,${alpha})`;
                ctx.beginPath(); ctx.arc(sxp, syp, r, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle=`rgba(255,255,255,${alpha*0.9})`; ctx.lineWidth=3;
                ctx.beginPath(); ctx.arc(sxp, syp, r, 0, Math.PI*2); ctx.stroke();
                ctx.strokeStyle=`rgba(97,12,39,${alpha})`; ctx.lineWidth=2;
                ctx.beginPath(); ctx.arc(sxp, syp, r*0.72, 0, Math.PI*2); ctx.stroke();
            } else if(ult.type==='mago' || ult.type==='artoria'){
                const len=ult.length, halfW=ult.width/2;
                const ang=Math.atan2(ult.dirY, ult.dirX);
                const pulse = 0.75 + Math.sin(this._ultBeamPulse)*0.22;
                const isArtoria = ult.type==='artoria';
                ctx.save();
                ctx.translate(sxp, syp);
                ctx.rotate(ang);
                ctx.fillStyle=isArtoria?`rgba(255,190,11,${0.48*pulse})`:`rgba(167,139,250,${0.42*pulse})`;
                ctx.fillRect(0, -halfW, len, halfW*2);
                ctx.fillStyle=isArtoria?`rgba(255,255,255,${0.62*pulse})`:`rgba(255,255,255,${0.55*pulse})`;
                ctx.fillRect(0, -halfW*0.38, len, halfW*0.76);
                ctx.strokeStyle=isArtoria?`rgba(255,190,11,${0.75*pulse})`:`rgba(59,7,84,${0.65*pulse})`; ctx.lineWidth=2;
                ctx.strokeRect(0, -halfW, len, halfW*2);
                ctx.fillStyle=`rgba(255,190,11,${0.85*pulse})`;
                ctx.fillRect(len-10, -halfW-2, 10, halfW*2+4);
                ctx.restore();
            } else if(ult.type==='cu' && ult.tx!==undefined){
                const sx=ult.tx - cam.x, sy=ult.ty - cam.y;
                const pulse = 0.55 + Math.sin(this._ultBeamPulse*1.6)*0.4;
                const prog = 1 - (ult.timer/0.55);
                // onda expansiva roja que crece
                ctx.fillStyle=`rgba(185,28,28,${0.28*pulse})`;
                ctx.beginPath(); ctx.arc(sx, sy, 72 + prog*28, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle=`rgba(153,27,27,${0.18*pulse})`;
                ctx.beginPath(); ctx.arc(sx, sy, 48 + prog*18, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle=`rgba(248,113,113,${0.95*pulse})`; ctx.lineWidth=3; ctx.setLineDash([8,5]);
                ctx.beginPath(); ctx.arc(sx, sy, 30 + Math.sin(this._ultBeamPulse)*6, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
                ctx.strokeStyle=`rgba(255,255,255,${0.55*pulse})`; ctx.lineWidth=1.5;
                ctx.beginPath(); ctx.arc(sx, sy, 18, 0, Math.PI*2); ctx.stroke();
                // lanza gigante vertical
                ctx.fillStyle='#000'; ctx.fillRect(sx-3, sy-38, 6, 38);
                ctx.fillStyle='#991B1B'; ctx.fillRect(sx-2, sy-36, 4, 34);
                ctx.fillStyle='#F87171'; ctx.beginPath(); ctx.moveTo(sx, sy-42); ctx.lineTo(sx-9, sy-22); ctx.lineTo(sx+9, sy-22); ctx.closePath(); ctx.fill();
                ctx.fillStyle='#FFFFFF'; ctx.beginPath(); ctx.moveTo(sx, sy-40); ctx.lineTo(sx-4, sy-26); ctx.lineTo(sx+4, sy-26); ctx.closePath(); ctx.fill();
                // destello en el suelo
                ctx.fillStyle=`rgba(248,113,113,${0.42*pulse})`;
                ctx.fillRect(sx-14, sy+8, 28, 4);
            } else if(ult.type==='emiya'){
                const r=ult.radius;
                const pulse = 0.82 + Math.sin(this._ultBeamPulse*0.9)*0.16;
                ctx.fillStyle=`rgba(194,178,128,${0.18*pulse})`;
                ctx.beginPath(); ctx.arc(sxp, syp, r*pulse, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle=`rgba(212,212,216,${0.42*pulse})`; ctx.lineWidth=2; ctx.setLineDash([5,5]);
                ctx.beginPath(); ctx.arc(sxp, syp, r, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
                ctx.strokeStyle=`rgba(153,27,27,${0.55*pulse})`; ctx.lineWidth=1.2;
                for(let k=0;k<10;k++){
                    const ang=k*(Math.PI*2/10) + this.elapsed*0.6;
                    const rx=sxp + Math.cos(ang)*r*0.72;
                    const ry=syp + Math.sin(ang)*r*0.72;
                    ctx.beginPath(); ctx.moveTo(rx, ry-8); ctx.lineTo(rx, ry+8); ctx.stroke();
                    ctx.fillStyle=`rgba(212,212,216,${0.9*pulse})`;
                    ctx.fillRect(rx-1, ry-10, 2, 6);
                }
            } else if(ult.type==='alucard'){
                const pulse = 0.7 + Math.sin(this._ultBeamPulse*0.9)*0.3;
                ctx.strokeStyle = `rgba(248,113,113,${0.28*pulse})`; ctx.lineWidth=1.5; ctx.setLineDash([5,5]);
                ctx.beginPath(); ctx.arc(sxp, syp, 70, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
                for(const f of this._alucardFamiliars){
                    const fx = f.x - cam.x, fy = f.y - cam.y;
                    if(fx < -40 || fx > cam.w+40 || fy < -40 || fy > cam.h+40) continue;
                    // sombra
                    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(fx-6, fy+7, 12, 3);
                    // cuerpo de murciélago
                    ctx.fillStyle='#7F1D1D';
                    ctx.beginPath(); ctx.arc(fx, fy, 6, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(fx-3, fy-2, 3, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(fx+3, fy-2, 3, 0, Math.PI*2); ctx.fill();
                    // alas batiendo
                    const flap = Math.sin(this.elapsed*14 + f.idx)*3;
                    ctx.fillStyle='rgba(127,29,29,0.9)';
                    ctx.beginPath(); ctx.moveTo(fx, fy-1); ctx.lineTo(fx-9, fy-5+flap); ctx.lineTo(fx-6, fy+2); ctx.closePath(); ctx.fill();
                    ctx.beginPath(); ctx.moveTo(fx, fy-1); ctx.lineTo(fx+9, fy-5+flap); ctx.lineTo(fx+6, fy+2); ctx.closePath(); ctx.fill();
                    // ojos
                    ctx.fillStyle='#fff'; ctx.fillRect(fx-2, fy-2, 2, 2); ctx.fillRect(fx+1, fy-2, 2, 2);
                    ctx.fillStyle='#000'; ctx.fillRect(fx-2, fy-2, 1, 1); ctx.fillRect(fx+1, fy-2, 1, 1);
                    // aura de caza
                    ctx.strokeStyle=`rgba(248,113,113,${0.12*pulse})`; ctx.lineWidth=1;
                    ctx.beginPath(); ctx.arc(fx, fy, 26, 0, Math.PI*2); ctx.stroke();
                }
            } else if(ult.type==='kratos'){
                const pulse = 0.62 + Math.sin(this._ultBeamPulse*1.4)*0.34;
                const r = ult.radius;
                ctx.fillStyle=`rgba(153,27,27,${0.30*pulse})`;
                ctx.beginPath(); ctx.arc(sxp, syp, r, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle=`rgba(248,113,113,${0.55*pulse})`; ctx.lineWidth=3;
                ctx.beginPath(); ctx.arc(sxp, syp, r, 0, Math.PI*2); ctx.stroke();
                ctx.strokeStyle=`rgba(255,255,255,${0.35*pulse})`; ctx.lineWidth=1.2;
                ctx.beginPath(); ctx.arc(sxp, syp, r*0.6, 0, Math.PI*2); ctx.stroke();
                ctx.fillStyle=`rgba(255,255,255,${0.8*pulse})`;
                for(let i=0;i<8;i++){
                    const a = i*(Math.PI*2/8) + this.elapsed*2;
                    const ix = sxp + Math.cos(a)*r*0.35;
                    const iy = syp + Math.sin(a)*r*0.35;
                    ctx.beginPath(); ctx.moveTo(ix, iy-8); ctx.lineTo(ix+5, iy+6); ctx.lineTo(ix-5, iy+6); ctx.closePath(); ctx.fill();
                }
            } else if(ult.type==='musashi'){
                const pulse = 0.65 + Math.sin(this._ultBeamPulse*1.1)*0.3;
                ctx.strokeStyle=`rgba(255,190,11,${0.5*pulse})`; ctx.lineWidth=2; ctx.setLineDash([10,6]);
                ctx.beginPath(); ctx.arc(sxp, syp, 40 + Math.sin(this._ultBeamPulse*0.7)*8, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
                ctx.fillStyle=`rgba(255,190,11,${0.16*pulse})`;
                ctx.beginPath(); ctx.arc(sxp, syp, 34, 0, Math.PI*2); ctx.fill();
                // pip de postura actual (5 posturas)
                const n = Math.min(ult.pulses||1, 5);
                for(let i=0;i<5;i++){
                    const a = i*(Math.PI*2/5) - Math.PI/2;
                    const kx = sxp + Math.cos(a)*22, ky = syp + Math.sin(a)*22;
                    ctx.fillStyle = i < n ? `rgba(255,190,11,${0.9*pulse})` : 'rgba(255,255,255,0.25)';
                    ctx.fillRect(kx-2, ky-2, 4, 4);
                }
            }
        }
        // Bombas de la definitiva del pícaro/cu (antes de explotar)
        for(const b of this.ultimateBombs){
            if(b.exploded) continue;
            const sx=b.x - cam.x, sy=b.y - cam.y;
            const pulse = 0.7 + Math.sin(this.elapsed*12 + b.x*0.01)*0.3;
            ctx.fillStyle=`rgba(0,0,0,${0.32*pulse})`;
            ctx.fillRect(sx-7, sy+6, 14, 4);
            ctx.fillStyle='#000';
            ctx.fillRect(sx-6, sy-6, 12, 12);
            ctx.fillStyle='#FFBE0B';
            ctx.fillRect(sx-5, sy-5, 10, 10);
            ctx.fillStyle='#000';
            ctx.fillRect(sx-2, sy-2, 4, 4);
            ctx.fillStyle=`rgba(255,255,255,${0.9*pulse})`;
            ctx.fillRect(sx-3, sy-3, 2, 2);
        }

        // Lanzas de replicación Gae Bolg (Cu Chulainn)
        if(this._gaeBolgLances && this._gaeBolgLances.length > 0){
            const now = performance.now();
            for(const lance of this._gaeBolgLances){
                const age = (now - lance.created) / 1000;
                const alpha = 1 - (age / lance.maxLife);
                if(alpha <= 0) continue;

                const sx1 = lance.x1 - cam.x, sy1 = lance.y1 - cam.y;
                const sx2 = lance.x2 - cam.x, sy2 = lance.y2 - cam.y;

                ctx.save();
                ctx.strokeStyle = `rgba(248,113,113,${0.9*alpha})`;
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 4]);
                ctx.beginPath();
                ctx.moveTo(sx1, sy1);
                ctx.lineTo(sx2, sy2);
                ctx.stroke();
                ctx.setLineDash([]);

                // Punta de lanza en el destino
                const ang = Math.atan2(sy2 - sy1, sx2 - sx1);
                ctx.fillStyle = `rgba(153,27,27,${alpha})`;
                ctx.save();
                ctx.translate(sx2, sy2);
                ctx.rotate(ang);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-10, -5);
                ctx.lineTo(-10, 5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                // Brillo en el origen
                ctx.fillStyle = `rgba(255,190,11,${0.7*alpha})`;
                ctx.beginPath();
                ctx.arc(sx1, sy1, 4, 0, Math.PI*2);
                ctx.fill();
                ctx.restore();
            }
            // Limpiar expirados
            this._gaeBolgLances = this._gaeBolgLances.filter(l => (now - l.created) / 1000 < l.maxLife);
        }

        // Hacha Léviatán (Kratos) - render trail
        if(this._leviathan){
            const l = this._leviathan;
            const sx = l.x - cam.x, sy = l.y - cam.y;
            if(sx > -50 && sx < cam.w+50 && sy > -50 && sy < cam.h+50){
                // Trail
                ctx.strokeStyle = l.returning ? 'rgba(148,163,184,0.6)' : 'rgba(226,232,240,0.8)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                for(let i=0;i<l.trail.length;i++){
                    const t = l.trail[i];
                    const tx = t.x - cam.x, ty = t.y - cam.y;
                    if(i===0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
                }
                ctx.stroke();
                // Hacha
                ctx.save();
                ctx.translate(sx, sy);
                const ang = Math.atan2(l.vy, l.vx) + Math.PI/2;
                ctx.rotate(ang);
                // Cabeza hacha
                ctx.fillStyle = '#1E1E24';
                ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(14, 6); ctx.lineTo(-14, 6); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#94A3B8';
                ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(11, 4); ctx.lineTo(-11, 4); ctx.closePath(); ctx.fill();
                // Filo azul helado
                ctx.fillStyle = l.returning ? '#60A5FA' : '#E2E8F0';
                ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(8, 2); ctx.lineTo(-8, 2); ctx.closePath(); ctx.fill();
                // Mango
                ctx.fillStyle = '#3D2B1F';
                ctx.fillRect(-2, 4, 4, 28);
                ctx.fillStyle = '#6B4F3D';
                ctx.fillRect(-1, 6, 2, 24);
                ctx.restore();
                // Brillo retorno
                if(l.returning){
                    ctx.fillStyle = 'rgba(96,165,250,0.5)';
                    ctx.beginPath(); ctx.arc(sx, sy, 18, 0, Math.PI*2); ctx.fill();
                }
            }
        }

        // Slashes Musashi (doble katana)
        if(this._musashiSlashes && this._musashiSlashes.length > 0 && this.player){
            const p=this.player;
            const sxp=p.x - cam.x, syp=p.y - cam.y;
            for(const s of this._musashiSlashes){
                const alpha = s.timer / s.maxTimer;
                if(alpha<=0) continue;
                const range = CONFIG.PLAYER.CLASSES.musashi.weaponMods.range || 105;
                const arc = Math.PI * 0.9;
                const start = s.angle - arc/2;

                if(s.isParry){
                    // Parry: destello dorado completo 360°
                    ctx.fillStyle = `rgba(255,190,11,${0.5*alpha})`;
                    ctx.beginPath(); ctx.arc(sxp, syp, range*0.7, 0, Math.PI*2); ctx.fill();
                    ctx.strokeStyle = `rgba(255,255,255,${0.8*alpha})`; ctx.lineWidth=3;
                    ctx.beginPath(); ctx.arc(sxp, syp, range*0.7, 0, Math.PI*2); ctx.stroke();
                } else {
                    // Slash normal: arco dorado/amarillo
                    ctx.fillStyle = `rgba(255,190,11,${0.35*alpha})`;
                    ctx.strokeStyle = `rgba(255,220,100,${0.7*alpha})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(sxp,syp); ctx.arc(sxp,syp, range, start, start+arc); ctx.closePath(); ctx.fill(); ctx.stroke();
                    // Línea de corte
                    ctx.strokeStyle = `rgba(255,255,255,${0.5*alpha})`; ctx.lineWidth=1.5;
                    ctx.beginPath(); ctx.moveTo(sxp, syp); ctx.lineTo(sxp + Math.cos(s.angle)*range, syp + Math.sin(s.angle)*range); ctx.stroke();
                    // Indicador mano (pequeño triángulo en la punta)
                    ctx.fillStyle = `rgba(255,190,11,${alpha})`;
                    ctx.save();
                    ctx.translate(sxp + Math.cos(s.angle)*range, syp + Math.sin(s.angle)*range);
                    ctx.rotate(s.angle);
                    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-8,-4); ctx.lineTo(-8,4); ctx.closePath(); ctx.fill();
                    ctx.restore();
                }
            }
        }

        // Posturas Gorin no Sho (Musashi ultimate)
        if(this._musashiStances && this._musashiStances.length > 0 && this.player){
            const p=this.player;
            const sxp=p.x - cam.x, syp=p.y - cam.y;
            for(const s of this._musashiStances){
                const alpha = s.timer / s.maxTimer;
                if(alpha<=0) continue;
                // Círculo expandiéndose con kanji visual
                ctx.strokeStyle = `rgba(255,190,11,${0.7*alpha})`; ctx.lineWidth=2;
                ctx.setLineDash([8,4]);
                ctx.beginPath(); ctx.arc(sxp, syp, s.radius * (1-alpha)*0.5 + s.radius*0.5, 0, Math.PI*2); ctx.stroke();
                ctx.setLineDash([]);
                // 5 líneas radiales (las 5 posturas)
                for(let i=0;i<5;i++){
                    const a = i*(Math.PI*2/5) + s.timer*4;
                    ctx.strokeStyle = `rgba(255,190,11,${0.5*alpha})`; ctx.lineWidth=1.5;
                    ctx.beginPath(); ctx.moveTo(sxp + Math.cos(a)*s.radius*0.3, syp + Math.sin(a)*s.radius*0.3);
                    ctx.lineTo(sxp + Math.cos(a)*s.radius, syp + Math.sin(a)*s.radius); ctx.stroke();
                }
            }
        }

        // Muzzle flash Alucard (pistolas)
        if(this._alucardMuzzleFlash){
            const mf = this._alucardMuzzleFlash;
            const sx = mf.x - cam.x, sy = mf.y - cam.y;
            const alpha = mf.timer / 0.06;
            if(alpha>0){
                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(mf.angle);
                ctx.fillStyle = `rgba(248,113,113,${0.9*alpha})`;
                ctx.fillRect(0, -3, 18, 6);
                ctx.fillStyle = `rgba(255,255,255,${0.8*alpha})`;
                ctx.fillRect(0, -1, 14, 2);
                ctx.restore();
            }
            mf.timer -= 1/60; // aprox
            if(mf.timer <= 0) this._alucardMuzzleFlash = null;
        }

        // Floating texts — Excalibur grande pixel
        for(const t of this.floatingTexts){
            const sx=t.x - cam.x, sy=t.y - cam.y;
            const alpha=t.life / t.maxLife;
            ctx.globalAlpha=alpha;
            if(t.isExcalibur){
                ctx.fillStyle='#000';
                ctx.font='bold 18px \"Press Start 2P\", monospace'; ctx.textAlign='center';
                ctx.fillText(t.text, sx+2, sy+2);
                ctx.fillStyle=t.color; ctx.font='bold 18px \"Press Start 2P\", monospace';
                ctx.fillText(t.text, sx, sy);
                // brillo
                ctx.fillStyle='rgba(255,255,255,0.55)';
                ctx.fillRect(sx - 42, sy - 16, 84, 2);
            } else {
                const scale=t.scale||1;
                ctx.fillStyle=t.color; ctx.font=`bold ${Math.round(13*scale)}px JetBrains Mono, monospace`; ctx.textAlign='center';
                ctx.fillText(t.text, sx, sy);
            }
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

        // HUD minimal: solo Oleadas / Tiempo / Enemigos
        if(this.state===GameState.GAMEPLAY){
            // ya tenemos HUD DOM con tiempo y kills, acá solo oleada + enemigos en canvas
            ctx.fillStyle='rgba(15,23,42,0.82)';
            ctx.fillRect(10, 46, 220, 28);
            ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.strokeRect(10,46,220,28);
            ctx.fillStyle='#E2E8F0'; ctx.font='10px \"Press Start 2P\", monospace'; ctx.textAlign='left';
            ctx.fillText(`OLEADA ${this.waveDirector.waveNumber}`, 16, 62);
            ctx.font='8px \"Press Start 2P\", monospace'; ctx.fillStyle='#94A3B8';
            ctx.fillText(`ENEMIGOS ${this.entityManager.enemyCount()}`, 16, 72);
            // tiempo ya está en HUD DOM, pero lo duplicamos sutil si querés
            if(this.entityManager.enemyCount()===0){
                ctx.fillStyle='rgba(226,232,240,0.55)'; ctx.font='8px \"Press Start 2P\", monospace'; ctx.textAlign='center';
                ctx.fillText('SOBREVIVE', cam.w/2, 26);
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
