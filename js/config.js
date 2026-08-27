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
                weaponMods: { range: 168, cooldown: 0.58, damage: 26, width: 22 },
                specialMods: {}
            },
            emiya: {
                id: 'emiya', name: 'Emiya', emoji: '[EMI]', color: '#D4D4D8',
                desc: 'Herrero. Arco de flechas | UBW arena de cortes 5s.',
                weapon: 'bow', special: 'ubw',
                modifiers: { maxHealth: +5, armor: +1, moveSpeed: +12, damageMultiplier: 1.08, cooldownReduction: 0.10, critChance: 0.08 },
                weaponMods: { cooldown: 0.34, damage: 13, speed: 520, count: 1 },
                specialMods: {}
            }
        }
    },

    ENEMY: {
        SIZE: 14,
        BASE_HP: 20, BASE_DAMAGE: 10, BASE_SPEED: 65,
        SCALING: { hpPerMinute: 7, damagePerMinute: 1.8, speedPerMinute: 3.2, maxSpeed: 155 },
        TYPES: {
            grunt:   { id:'grunt',   name:'Noctámbulo', emoji:'[VMP]', color:'#610C27', hpMul:1.0, dmgMul:1.0, spdMul:1.0, radius:14, xp:12 },
            tank:    { id:'tank',    name:'Goliat',     emoji:'[OGRE]', color:'#7A1432', hpMul:3.2, dmgMul:1.6, spdMul:0.62, radius:20, xp:28 },
            runner:  { id:'runner',  name:'Acechador',  emoji:'[BAT]', color:'#45081C', hpMul:0.55, dmgMul:0.85, spdMul:1.65, radius:11, xp:10 },
            shooter: { id:'shooter', name:'Nigromante', emoji:'[ZMB]', color:'#3B0754', hpMul:0.95, dmgMul:0.9, spdMul:0.85, radius:15, xp:18, ranged:true, shootCooldown:1.8, projSpeed:210, projDamage:9 },
        }
    },

    WAVE: {
        BASE_RATE: 0.9,
        INTERVAL: 0.55,
        SPAWN_MARGIN: 46,
        BASE_COUNT: 3,
        COUNT_PER_MINUTE: 1.7,
        MAX_PER_WAVE: 18,
        MAX_ENEMIES: 380,
        MAX_ENEMIES_MOBILE: 220,
        MIX: [
            { minute: 0, grunt: 0.85, tank: 0.05, runner: 0.10, shooter: 0.00 },
            { minute: 1, grunt: 0.65, tank: 0.10, runner: 0.20, shooter: 0.05 },
            { minute: 2, grunt: 0.50, tank: 0.15, runner: 0.20, shooter: 0.15 },
            { minute: 4, grunt: 0.40, tank: 0.20, runner: 0.22, shooter: 0.18 },
            { minute: 7, grunt: 0.30, tank: 0.25, runner: 0.23, shooter: 0.22 },
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
        BOW:      { id:'bow',      name:'Arco',             emoji:'[BOW]', cooldown: 0.34, damage: 13, speed: 520, behavior: 'arrow' }
    },

    ULTIMATES: {
        caballero: { id:'ult_cab', name:'Corte Divino',   emoji:'[SWD]', cooldown:30, duration:0.45, range:220, damage:88, arc: Math.PI*2, knockback:110 },
        mago:      { id:'ult_mag', name:'Rayo Aniquilador', emoji:'[RAY]', cooldown:30, duration:3,   width:44, length:760, tickDamage:16, tickRate:0.08 },
        picaro:    { id:'ult_pic', name:'Lluvia de Bombas', emoji:'[BMB]', cooldown:30, duration:3,   interval:0.16, bombDamage:26, bombRadius:54, bombsPerTick:1 },
        artoria:   { id:'ult_art', name:'Excalibur',      emoji:'[EXC]', cooldown:30, duration:3,   width:88, length:760, tickDamage:28, tickRate:0.07 },
        cu:        { id:'ult_cu',  name:'Gae Bolg',       emoji:'[GAE]', cooldown:30, duration:0.6,  lanceRange: 520, lanceWidth: 28, damage: 110, explosion: 96 },
        emiya:     { id:'ult_emi', name:'UBW',            emoji:'[UBW]', cooldown:30, duration:5,   radius: 168, tickDamage:9, tickRate:0.14 }
    },

    UPGRADES_POOL: [
        { id:'hp_up',     name:'+22 Vida Máx',        desc:'+22 vida máxima y cura', emoji:'[HP]', type:'generic' },
        { id:'dmg_up',    name:'+15% Daño',           desc:'Más daño en todas las armas', emoji:'[DMG]', type:'generic' },
        { id:'spd_up',    name:'+12% Velocidad',      desc:'Te mueves más rápido', emoji:'[SPD]', type:'generic' },
        { id:'mag_up',    name:'+28 Imán',            desc:'Atrae gemas desde más lejos', emoji:'[MAG]', type:'generic' },
        { id:'cd_up',     name:'-10% Cooldown',       desc:'Atacas más seguido', emoji:'[TMR]', type:'generic' },
        { id:'proj_up',   name:'+1 Proyectil',        desc:'Un proyectil extra (mago/pícaro)', emoji:'[PRJ]', type:'generic' },
        { id:'armor_up',  name:'+1 Armadura',         desc:'Reduce daño recibido', emoji:'[SHD]', type:'generic' },
        { id:'garlic_up',   name:'Ajo +20 radio / +30% daño', desc:'Aura más grande y letal', emoji:'[GAR]', type:'exclusive', forClass:'picaro' },
        { id:'shield_up',   name:'Escudo +1 carga / -20% CD', desc:'Escudo más resistente', emoji:'[SHD]', type:'exclusive', forClass:'caballero' },
        { id:'fireball_up', name:'Bola +25% daño y explosión', desc:'Explosión más grande', emoji:'[FIR]', type:'exclusive', forClass:'mago' },
        { id:'artoria_up',  name:'Espada +15% doble filo', desc:'Excalibur base más fuerte', emoji:'[SWD]', type:'exclusive', forClass:'artoria' },
        { id:'cu_up',       name:'Lanza +18 alcance', desc:'Gae Bolg más letal', emoji:'[LNC]', type:'exclusive', forClass:'cu' },
        { id:'emiya_up',    name:'Arco +1 flecha', desc:'Flechas extra y UBW', emoji:'[BOW]', type:'exclusive', forClass:'emiya' },
    ],

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
