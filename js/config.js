/**
 * Los vampiros supervivientes de Ezequiel -- Configuración Global
 * Estética Gótica Pixel: paleta Azul Abisal / Violeta Vacío / Bordó Sangre / Verde Ftalo / Gris Cripta
 * Fate: 6 clases (3 base + Artoria/Cu/Emiya)
 */

export const GameState = Object.freeze({
    MENU: 'MENU',
    CLASS_SELECT: 'CLASS_SELECT',
    GAMEPLAY: 'GAMEPLAY',
    PAUSED: 'PAUSED',
    LEVEL_UP: 'LEVEL_UP',
    GAME_OVER: 'GAME_OVER'
});

export const CONFIG = Object.freeze({
    TITLE: 'Los vampiros supervivientes de Ezequiel',

    CANVAS: { WIDTH: 1280, HEIGHT: 720, BACKGROUND: '#0F172A' },

    GRID: { CELL_SIZE: 80, DEBUG_DRAW: false },

    LOOP: { MAX_DELTA: 0.033, TARGET_FPS: 60 },

    PLAYER: {
        SIZE: 18,
        BASE: {
            maxHealth: 100, moveSpeed: 180, magnetRadius: 90, armor: 0,
            cooldownReduction: 0, damageMultiplier: 1, projectileCount: 0,
            critChance: 0.05, critDamage: 1.5, pickupRadius: 18
        },
        CLASSES: {
            caballero: {
                id: 'caballero', name: 'Caballero', emoji: '[SHD]', color: '#E2E8F0',
                desc: 'Fortaleza. Espada + Escudo que bloquea y reaparece.',
                weapon: 'whip', special: 'shield',
                modifiers: { maxHealth: +45, armor: +4, moveSpeed: 0, damageMultiplier: 1.0, cooldownReduction: 0 },
                weaponMods: { range: 110, cooldown: 0.72, damage: 22, knockback: 70 },
                specialMods: { shieldCooldown: 11, shieldCharges: 1, shieldDuration: 999, shieldRadius: 32 }
            },
            mago: {
                id: 'mago', name: 'Mago', emoji: '[MAG]', color: '#C4B5FD',
                desc: 'Cataclismo. Varita + Bola de Fuego explosiva.',
                weapon: 'wand', special: 'fireball',
                modifiers: { maxHealth: -15, armor: 0, moveSpeed: +10, damageMultiplier: 1.30, cooldownReduction: 0.22, critChance: 0.04 },
                weaponMods: { cooldown: 0.38, damage: 14, speed: 420, projectileCount: 1 },
                specialMods: { fireballCooldown: 3.4, fireballDamage: 34, fireballSpeed: 285, fireballRadius: 78, fireballExplosion: 72 }
            },
            picaro: {
                id: 'picaro', name: 'Pícaro', emoji: '[DAG]', color: '#6EE7B7',
                desc: 'Torbellino. Dagas + Aura de Ajo exclusiva.',
                weapon: 'dagger', special: 'garlic',
                modifiers: { maxHealth: -10, armor: 0, moveSpeed: +52, critChance: 0.18, critDamage: 1.75, damageMultiplier: 1.0, cooldownReduction: 0.10 },
                weaponMods: { cooldown: 0.28, damage: 9, speed: 480, count: 2, garlicRadius: 75, garlicDamage: 7 }
            },
            artoria: {
                id: 'artoria', name: 'Artoria', emoji: '[ART]', color: '#60A5FA',
                desc: 'Rey de Caballeros. Espada doble golpe | Excalibur rayo amarillo x2.',
                weapon: 'artoria_sword', special: 'excalibur',
                modifiers: { maxHealth: +30, armor: +2, moveSpeed: +8, damageMultiplier: 1.10, cooldownReduction: 0.06 },
                weaponMods: { range: 118, cooldown: 0.62, damage: 19, knockback: 55 },
                specialMods: {}
            },
            cu: {
                id: 'cu', name: 'Cu Chulainn', emoji: '[CU]', color: '#F87171',
                desc: 'Hijo de la Luz. Lanza roja lineal | Gae Bolg explosivo.',
                weapon: 'lance', special: 'gae_bolg',
                modifiers: { maxHealth: +20, armor: +1, moveSpeed: +18, damageMultiplier: 1.18, cooldownReduction: 0.08 },
                weaponMods: { range: 168, cooldown: 0.58, damage: 26, width: 38 },
                specialMods: {}
            },
            emiya: {
                id: 'emiya', name: 'Emiya', emoji: '[EMI]', color: '#D4D4D8',
                desc: 'Herrero. Arco de flechas | UBW arena de cortes 5s.',
                weapon: 'bow', special: 'ubw',
                modifiers: { maxHealth: +5, armor: +1, moveSpeed: +12, damageMultiplier: 1.08, cooldownReduction: 0.10, critChance: 0.08 },
                weaponMods: { cooldown: 0.34, damage: 13, speed: 520, count: 1 },
                specialMods: {}
            },
            alucard: {
                id: 'alucard', name: 'Alucard', emoji: '[ALU]', color: '#F87171',
                desc: 'Vampiro Primordial. Pistolas Casull + Jackal | Liberation: Familiars devoradores.',
                weapon: 'alucard_guns', special: 'liberation',
                modifiers: { maxHealth: +35, armor: +3, moveSpeed: +5, damageMultiplier: 1.25, cooldownReduction: 0.12, critChance: 0.15, critDamage: 2.0 },
                weaponMods: { cooldown: 0.18, damage: 16, speed: 680, count: 2, spread: 0.12 },
                specialMods: { familiarCount: 6, familiarDamage: 22, familiarDuration: 8, familiarRadius: 280 }
            },
            kratos: {
                id: 'kratos', name: 'Kratos', emoji: '[KRAT]', color: '#E2E8F0',
                desc: 'Fantasma de Esparta. Hacha Léviatán (lanzar/recall) | Ira Espartana: furia cuerpo a cuerpo.',
                weapon: 'leviathan', special: 'spartan_rage',
                modifiers: { maxHealth: +60, armor: +6, moveSpeed: -10, damageMultiplier: 1.35, cooldownReduction: 0.05 },
                weaponMods: { throwCooldown: 1.1, recallCooldown: 0.8, damage: 42, throwRange: 320, recallDamage: 28, ricochet: 2 },
                specialMods: { rageDuration: 6, rageDamage: 55, rageRadius: 85, rageSpeed: 1.4 }
            },
            musashi: {
                id: 'musashi', name: 'Miyamoto Musashi', emoji: '[MUS]', color: '#FFBE0B',
                desc: 'Kensei. Niten Ichi-ryū (doble katana) | Gorin no Sho: 5 posturas perfectas.',
                weapon: 'niten', special: 'gorin',
                modifiers: { maxHealth: +15, armor: +2, moveSpeed: +35, damageMultiplier: 1.22, cooldownReduction: 0.15, critChance: 0.22, critDamage: 1.8 },
                weaponMods: { slashCooldown: 0.22, damage: 18, range: 105, dualHits: 2, parryWindow: 0.35 },
                specialMods: { stanceDuration: 10, stanceCount: 5, stanceDamage: 38, stanceRadius: 140 }
            }
        }
    },

    ENEMY: {
        SIZE: 14,
        BASE_HP: 20, BASE_DAMAGE: 10, BASE_SPEED: 65,
        SCALING: { hpPerMinute: 7, damagePerMinute: 2.6, speedPerMinute: 4.2, maxSpeed: 170 },
        TYPES: {
            grunt:   { id:'grunt',   name:'Noctámbulo', emoji:'[VMP]', color:'#610C27', hpMul:1.0, dmgMul:1.0, spdMul:1.0, radius:14, xp:12 },
            tank:    { id:'tank',    name:'Goliat',     emoji:'[OGRE]', color:'#7A1432', hpMul:3.2, dmgMul:1.6, spdMul:0.62, radius:20, xp:28 },
            runner:  { id:'runner',  name:'Acechador',  emoji:'[BAT]', color:'#45081C', hpMul:0.55, dmgMul:0.85, spdMul:1.65, radius:11, xp:10 },
            shooter: { id:'shooter', name:'Nigromante', emoji:'[ZMB]', color:'#3B0754', hpMul:0.95, dmgMul:0.9, spdMul:0.85, radius:15, xp:18, ranged:true, shootCooldown:1.8, projSpeed:210, projDamage:9 },
            elite:   { id:'elite',   name:'Abad Antiguo', emoji:'[ELT]', color:'#7F1D1D', hpMul:8.0, dmgMul:2.0, spdMul:0.5, radius:24, xp:140, elite:true, auraRadius:95, auraDamage:12, auraTick:0.8, guaranteedGems:5 },
            suicide: { id:'suicide', name:'Espina Volátil', emoji:'[SPI]', color:'#F59E0B', hpMul:0.7, dmgMul:1.4, spdMul:1.8, radius:12, xp:9, suicide:true, explodeRadius:62, explodeDamage:30, fuseDist:34 },
            swarm:   { id:'swarm',   name:'Enjambre', emoji:'[SWM]', color:'#0F766E', hpMul:2.6, dmgMul:0.8, spdMul:0.55, radius:20, xp:20, swarm:true, swarmMembers:3 },
            support: { id:'support', name:'Sacerdote', emoji:'[SUP]', color:'#A78BFA', hpMul:2.0, dmgMul:0.7, spdMul:0.6, radius:16, xp:40, support:true, supportRadius:170, dmgBuff:0.5, spdBuff:0.35 },
            piercer: { id:'piercer', name:'Lancero Perforante', emoji:'[LNC]', color:'#60A5FA', hpMul:1.1, dmgMul:1.1, spdMul:0.75, radius:14, xp:20, ranged:true, shootCooldown:2.3, projSpeed:320, projDamage:11, pierce:true },
            hexer:   { id:'hexer',   name:'Brujo Lúgubre',     emoji:'[HX]',  color:'#C084FC', hpMul:1.6, dmgMul:0.9, spdMul:0.6,  radius:16, xp:50, ranged:true, shootCooldown:3.2, projSpeed:260, projDamage:8, hex:true },
            berserker: { id:'berserker', name:'Berserker',     emoji:'[BRK]', color:'#FDB47E', hpMul:2.4, dmgMul:1.8, spdMul:1.15, radius:18, xp:35, charge:true, chargeCooldown:2.6, chargeSpeed:5.2, chargeDamage:26 },
            elite_colossus: { id:'elite_colossus', name:'Coloso Abisal', emoji:'[COL]', color:'#7A1432', hpMul:14.0, dmgMul:2.6, spdMul:0.38, radius:30, xp:220, elite:true, auraRadius:130, auraDamage:18, auraTick:0.7, guaranteedGems:9 },
            elite_hexlord: { id:'elite_hexlord', name:'Señor Brujo', emoji:'[HLD]', color:'#6D28D9', hpMul:9.0, dmgMul:2.2, spdMul:0.5, radius:24, xp:200, elite:true, spawner:true, spawnInterval:7, spawnCount:4, hexRadius:120, hexDamage:8, hexTick:1.0, guaranteedGems:8 },
        }
    },

    WAVE: {
        BASE_RATE: 0.9,
        INTERVAL: 0.55,
        SPAWN_MARGIN: 46,
        BASE_COUNT: 3,
        COUNT_PER_MINUTE: 1.7,
        MAX_PER_WAVE: 13,
        MAX_ENEMIES: 240,
        MAX_ENEMIES_MOBILE: 150,
        MIX: [
            { minute: 0, grunt: 0.85, tank: 0.05, runner: 0.10, shooter: 0.00 },
            { minute: 1, grunt: 0.65, tank: 0.10, runner: 0.20, shooter: 0.05 },
            { minute: 2, grunt: 0.50, tank: 0.15, runner: 0.20, shooter: 0.15 },
            { minute: 4, grunt: 0.40, tank: 0.20, runner: 0.22, shooter: 0.18 },
            { minute: 7, grunt: 0.30, tank: 0.25, runner: 0.23, shooter: 0.22 },
            { minute: 8, grunt: 0.26, tank: 0.22, runner: 0.22, shooter: 0.18, suicide: 0.06, support: 0.06 },
            { minute: 10, grunt: 0.16, tank: 0.16, runner: 0.16, shooter: 0.16, piercer: 0.08, hexer: 0.05, berserker: 0.06, suicide: 0.10, swarm: 0.06, support: 0.07 },
            { minute: 12, grunt: 0.12, tank: 0.16, runner: 0.14, shooter: 0.16, piercer: 0.12, hexer: 0.08, berserker: 0.08, suicide: 0.12, swarm: 0.08, support: 0.08 },
            { minute: 15, grunt: 0.08, tank: 0.15, runner: 0.12, shooter: 0.16, piercer: 0.15, hexer: 0.10, berserker: 0.10, suicide: 0.14, swarm: 0.10, support: 0.10 },
            { minute: 18, grunt: 0.05, tank: 0.14, runner: 0.10, shooter: 0.16, piercer: 0.16, hexer: 0.13, berserker: 0.12, suicide: 0.15, swarm: 0.12, support: 0.12 },
            { minute: 22, grunt: 0.03, tank: 0.12, runner: 0.09, shooter: 0.16, piercer: 0.17, hexer: 0.15, berserker: 0.13, suicide: 0.16, swarm: 0.13, support: 0.14 },
        ]
    },

    XP: {
        GEM_VALUE: 12,
        FORMULA: (level) => Math.floor(100 * Math.pow(level, 1.5)),
        MAGNET_SPEED: 420, GEM_RADIUS: 7
    },

    WEAPONS: {
        WHIP:     { id:'whip',     name:'Espada Sagrada',   emoji:'[SWD]', cooldown: 0.72, damage: 22, range: 110, arc: Math.PI*1.05, knockback: 70, behavior: 'frontal_arc' },
        WAND:     { id:'wand',     name:'Varita Mágica',    emoji:'[ORB]', cooldown: 0.38, damage: 14, speed: 420, behavior: 'nearest_target' },
        DAGGER:   { id:'dagger',   name:'Dagas',            emoji:'[DAG]', cooldown: 0.28, damage: 9,  speed: 480, count: 2, behavior: 'nearest_target_rapid' },
        GARLIC:   { id:'garlic',   name:'Aura de Ajo',      emoji:'[GAR]', cooldown: 0.22, damage: 7,  radius: 75,  behavior: 'aoe_constant', exclusive: 'picaro' },
        SHIELD:   { id:'shield',   name:'Escudo Sagrado',   emoji:'[SHD]', cooldown: 11, charges: 1, radius: 32, behavior: 'shield_block', exclusive: 'caballero' },
        FIREBALL: { id:'fireball', name:'Bola de Fuego',    emoji:'[FIR]', cooldown: 3.4, damage: 34, speed: 285, radius: 14, explosion: 72, behavior: 'explosive', exclusive: 'mago' },
        ARTORIA_SWORD: { id:'artoria_sword', name:'Excalibur (base)', emoji:'[SWD]', cooldown: 0.62, damage: 19, range: 118, arc: Math.PI*1.05, hits:2, behavior: 'double_arc' },
        LANCE:    { id:'lance',    name:'Gae Dearg',        emoji:'[LNC]', cooldown: 0.58, damage: 26, range: 168, width: 22, behavior: 'line_thrust' },
        BOW:      { id:'bow',      name:'Arco',             emoji:'[BOW]', cooldown: 0.34, damage: 13, speed: 520, behavior: 'arrow' },
        ALUCARD_GUNS: { id:'alucard_guns', name:'Casull & Jackal', emoji:'[GUN]', cooldown: 0.18, damage: 16, speed: 680, count: 2, spread: 0.12, behavior: 'dual_pistol' },
        LEVIATHAN: { id:'leviathan', name:'Hacha Léviatán', emoji:'[AXE]', throwCooldown: 1.1, recallCooldown: 0.8, damage: 42, throwRange: 320, recallDamage: 28, ricochet: 2, behavior: 'throw_recall' },
        NITEN:    { id:'niten',    name:'Niten Ichi-ryū',  emoji:'[KAT]', cooldown: 0.22, damage: 18, range: 105, dualHits: 2, parryWindow: 0.35, behavior: 'dual_slash' }
    },

    ULTIMATES: {
        caballero: { id:'ult_cab', name:'Corte Divino',   emoji:'[SWD]', cooldown:30, duration:0.45, range:220, damage:88, arc: Math.PI*2, knockback:110 },
        mago:      { id:'ult_mag', name:'Rayo Aniquilador', emoji:'[RAY]', cooldown:30, duration:3,   width:44, length:760, tickDamage:16, tickRate:0.08 },
        picaro:    { id:'ult_pic', name:'Lluvia de Bombas', emoji:'[BMB]', cooldown:30, duration:3,   interval:0.16, bombDamage:26, bombRadius:54, bombsPerTick:1 },
        artoria:   { id:'ult_art', name:'Excalibur',      emoji:'[EXC]', cooldown:30, duration:3,   width:88, length:760, tickDamage:28, tickRate:0.07 },
        cu:        { id:'ult_cu',  name:'Gae Bolg',       emoji:'[GAE]', cooldown:30, duration:0.6,  lanceRange: 520, lanceWidth: 28, damage: 110, explosion: 96 },
        emiya:     { id:'ult_emi', name:'UBW',            emoji:'[UBW]', cooldown:30, duration:5,   radius: 168, tickDamage:9, tickRate:0.14 },
        alucard:   { id:'ult_alu', name:'Liberation',     emoji:'[LIB]', cooldown:30, duration:10,  familiarCount: 8, familiarDamage: 35, familiarRadius: 320, familiarLife: 8 },
        kratos:    { id:'ult_kra', name:'Ira Espartana',  emoji:'[RAGE]', cooldown:30, duration:8,   damage: 65, radius: 95, tickRate: 0.12, speedMult: 1.5, lifesteal: 0.15 },
        musashi:   { id:'ult_mus', name:'Gorin no Sho',   emoji:'[GOR]', cooldown:30, duration:12,  stanceCount: 5, stanceDamage: 48, stanceRadius: 160, stanceInterval: 2.4 }
    },
    SECOND_ULTIMATES: {
        caballero: { id:'ult2_cab', name:'Asalto Sagrado', emoji:'[HWY]', cooldown:30, duration:0.7,  range:300, damage:150, arc: Math.PI*2, knockback:160 },
        mago:      { id:'ult2_mag', name:'Nova Arcana',    emoji:'[NVA]', cooldown:30, duration:4,   width:70, length:1000, tickDamage:26, tickRate:0.06 },
        picaro:    { id:'ult2_pic', name:'Lluvia Ácida',   emoji:'[ACD]', cooldown:30, duration:4.5, interval:0.12, bombDamage:42, bombRadius:72, bombsPerTick:2 },
        artoria:   { id:'ult2_art', name:'Excalibur Prophecy', emoji:'[XCP]', cooldown:30, duration:4, width:140, length:1000, tickDamage:44, tickRate:0.05 },
        cu:        { id:'ult2_cu',  name:'Gae Bolg Masivo', emoji:'[GBM]', cooldown:30, duration:0.8, lanceRange: 700, lanceWidth: 36, damage: 200, explosion: 140 },
        emiya:     { id:'ult2_emi', name:'UBW: Domo de Espadas', emoji:'[DEB]', cooldown:30, duration:8, radius: 240, tickDamage:15, tickRate:0.10 },
        alucard:   { id:'ult2_alu', name:'Calvario del Cazador', emoji:'[CAL]', cooldown:30, duration:14, familiarCount: 13, familiarDamage: 58, familiarRadius: 400, familiarLife: 12 },
        kratos:    { id:'ult2_kra', name:'Furia del Olimpo', emoji:'[FDO]', cooldown:30, duration:10, damage: 105, radius: 125, tickRate: 0.09, speedMult: 1.7, lifesteal: 0.28 },
        musashi:   { id:'ult2_mus', name:'Vacío de los 5 Anillos', emoji:'[V5A]', cooldown:30, duration:15, stanceCount: 7, stanceDamage: 72, stanceRadius: 190, stanceInterval: 2.0 }
    },

    UPGRADES_POOL: [
        { id:'hp_up',     name:'+22 Vida Máx',        desc:'+22 vida máxima y cura', emoji:'[HP]', type:'generic' },
        { id:'dmg_up',    name:'+15% Daño',           desc:'Más daño en todas las armas', emoji:'[DMG]', type:'generic' },
        { id:'spd_up',    name:'+12% Velocidad',      desc:'Te mueves más rápido', emoji:'[SPD]', type:'generic' },
        { id:'mag_up',    name:'+28 Imán',            desc:'Atrae gemas desde más lejos', emoji:'[MAG]', type:'generic' },
        { id:'cd_up',     name:'-10% Cooldown',       desc:'Atacas más seguido', emoji:'[TMR]', type:'generic' },
        { id:'proj_up',   name:'+1 Proyectil',        desc:'Un proyectil extra (mago/pícaro)', emoji:'[PRJ]', type:'generic' },
        { id:'armor_up',  name:'+1 Armadura',         desc:'Reduce daño recibido', emoji:'[SHD]', type:'generic' },
        { id:'projspeed_up', name:'+20% Vel. Proyectil', desc:'Proyectiles más rápidos', emoji:'[PRJ]', type:'generic' },
        { id:'range_up',     name:'+15% Alcance',     desc:'Más alcance en armas', emoji:'[RNG]', type:'generic' },
        { id:'crit_up',      name:'+10% Crítico',     desc:'Más chance de daño crítico', emoji:'[CRT]', type:'generic' },
        { id:'gemdrop_up',   name:'+15% Drop de Gemas', desc:'Más gemas al matar', emoji:'[GBL]', type:'generic' },
        { id:'lifesteal_up', name:'+5% Robo de Vida', desc:'Te curas con tu daño', emoji:'[LIF]', type:'generic' },
        { id:'onhit_iframe_up', name:'IFrames al golpear', desc:'Breve inmunidad al hacer daño', emoji:'[SHD]', type:'generic' },
        { id:'garlic_up',   name:'Ajo +20 radio / +30% daño', desc:'Aura más grande y letal', emoji:'[GAR]', type:'exclusive', forClass:'picaro' },
        { id:'shield_up',   name:'Escudo +1 carga / -20% CD', desc:'Escudo más resistente', emoji:'[SHD]', type:'exclusive', forClass:'caballero' },
        { id:'fireball_up', name:'Bola +25% daño y explosión', desc:'Explosión más grande', emoji:'[FIR]', type:'exclusive', forClass:'mago' },
        { id:'artoria_up',  name:'Espada +15% doble filo', desc:'Excalibur base más fuerte', emoji:'[SWD]', type:'exclusive', forClass:'artoria' },
        { id:'cu_up',       name:'Lanza +18 alcance', desc:'Gae Bolg más letal', emoji:'[LNC]', type:'exclusive', forClass:'cu' },
        { id:'emiya_up',    name:'Arco +1 flecha', desc:'Flechas extra y UBW', emoji:'[BOW]', type:'exclusive', forClass:'emiya' },
        { id:'alucard_up',  name:'Pistolas +2 familiars', desc:'Liberation invoca más', emoji:'[GUN]', type:'exclusive', forClass:'alucard' },
        { id:'kratos_up',   name:'Hacha +2 ricochets', desc:'Léviatán rebota más', emoji:'[AXE]', type:'exclusive', forClass:'kratos' },
        { id:'musashi_up',  name:'Niten +1 postura', desc:'Gorin no Sho dura más', emoji:'[KAT]', type:'exclusive', forClass:'musashi' },
    ],

    // Velocidad de progresión: el "tiempo de juego" avanza más rápido que el tiempo real.
    // SPEED 5 → en 1 min real se está en prog 5 y en 3 min reales se llega a prog 15
    // (todo el contenido desplegado). Tras eso solo escala la dificultad.
    PROGRESSION: { SPEED: 5.0 },

    COLORS: {
        background: '#0F172A',
        grid: 'rgba(30,30,36,0.55)',
        player: '#E2E8F0',
        enemy: '#610C27',
        gem: '#3B0754',
        whip: 'rgba(97,12,39,0.92)',
        wand: 'rgba(59,7,84,0.96)',
        garlic: 'rgba(0,76,64,0.28)',
        shield: 'rgba(15,23,42,0.52)',
        fireball: 'rgba(97,12,39,0.96)'
    }
});
