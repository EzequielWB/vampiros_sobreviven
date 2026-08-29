/**
 * UIHandler -- Gestión de DOM / HUD / Menús y State Machine visual
 * Separado del loop para mantener SRP.
 */
import { GameState, CONFIG } from './config.js';
import { formatTime } from './utils.js';

export class UIHandler {
    constructor(game) {
        this.game = game;

        // Cache DOM
        this.els = {
            hud: document.getElementById('hud'),
            hpFill: document.getElementById('hp-fill'),
            hpText: document.getElementById('hp-text'),
            xpFill: document.getElementById('xp-fill'),
            xpText: document.getElementById('xp-text'),
            timer: document.getElementById('timer'),
            kills: document.getElementById('kill-counter'),
            debug: document.getElementById('debug'),
            dbgFps: document.getElementById('dbg-fps'),
            dbgEntities: document.getElementById('dbg-entities'),
            dbgState: document.getElementById('dbg-state'),
            screens: {
                [GameState.MENU]: document.getElementById('screen-menu'),
                [GameState.CLASS_SELECT]: document.getElementById('screen-class'),
                [GameState.LEVEL_UP]: document.getElementById('screen-levelup'),
                [GameState.GAME_OVER]: document.getElementById('screen-gameover'),
                [GameState.PAUSED]: document.getElementById('screen-paused'),
            },
            statTime: document.getElementById('stat-time'),
            statKills: document.getElementById('stat-kills'),
            statLevel: document.getElementById('stat-level'),
        };
    }

    init() {
        // Botones principales
        document.getElementById('btn-play')?.addEventListener('click', () => {
            this.game.setState(GameState.CLASS_SELECT);
        });
        document.getElementById('btn-howto')?.addEventListener('click', () => {
            document.getElementById('howto-panel')?.classList.toggle('hidden');
        });
        document.getElementById('btn-back-menu')?.addEventListener('click', () => {
            this.game.setState(GameState.MENU);
        });
        document.querySelectorAll('.pick-class').forEach(btn => {
            btn.addEventListener('click', () => {
                const cls = btn.dataset.class;
                this.game.startGame(cls);
            });
        });
        document.getElementById('btn-retry')?.addEventListener('click', () => {
            this.game.startGame(this.game.lastClass || 'caballero');
        });
        document.getElementById('btn-menu')?.addEventListener('click', () => {
            this.game.setState(GameState.MENU);
        });
        document.getElementById('btn-resume')?.addEventListener('click', () => {
            this.game.setState(GameState.GAMEPLAY);
        });
        document.getElementById('btn-quit')?.addEventListener('click', () => {
            this.game.setState(GameState.MENU);
        });
        document.getElementById('btn-reroll')?.addEventListener('click', () => {
            this.game.reRollUpgrades();
        });

        // Cards clickeables
        document.querySelectorAll('.class-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('pick-class')) return;
                const cls = card.dataset.class;
                if (cls) this.game.startGame(cls);
            });
        });
    }

    /** Muestra solo la screen del estado actual */
    showState(state) {
        const hudVisible = (state === GameState.GAMEPLAY || state === GameState.PAUSED || state === GameState.LEVEL_UP);
        this.els.hud.classList.toggle('hidden', !hudVisible);
        for (const [key, el] of Object.entries(this.els.screens)) {
            if (!el) continue;
            const visible = (key === state);
            el.classList.toggle('hidden', !visible);
            el.classList.toggle('active', visible);
        }
        if (this.els.dbgState) this.els.dbgState.textContent = `State: ${state}`;
        // Si vamos a selección de clase, re-renderizar sprites pixel (mismo que in-game)
        if(state === GameState.CLASS_SELECT){
            // esperar a que la transición termine y el canvas sea visible
            setTimeout(()=>this.renderClassPreviews(), 40);
            setTimeout(()=>this.renderClassPreviews(), 220);
        }
    }

    renderClassPreviews(){
        // usa el mismo SPRITES que in-game -- importa dinámico para no romper ciclo
        import('./pixelSprites.js').then(m=>{
            document.querySelectorAll('.pixel-portrait').forEach(c=>{
                const cls=c.dataset.class;
                if(cls) m.renderClassPreview(c, cls);
            });
        }).catch(()=>{});
    }

    updateHUD(dt) {
        const p = this.game.player;
        const em = this.game.entityManager;

        if (p) {
            const hpPct = (p.hp / p.stats.maxHealth) * 100;
            if (this.els.hpFill) this.els.hpFill.style.width = `${hpPct}%`;
            if (this.els.hpText) this.els.hpText.textContent = `${Math.ceil(p.hp)}/${p.stats.maxHealth}`;
            const xpPct = (p.xp / p.xpToNext) * 100;
            if (this.els.xpFill) this.els.xpFill.style.width = `${xpPct}%`;
            if (this.els.xpText) this.els.xpText.textContent = `Lv ${p.level} -- ${p.xp}/${p.xpToNext}`;
        }
        if (this.els.timer) this.els.timer.textContent = formatTime(this.game.elapsed || 0);
        if (this.els.kills) this.els.kills.textContent = `[SKL] ${this.game.kills || 0}`;

        // Debug opcional con tecla F3 o CONFIG
        if (this.els.dbgFps) this.els.dbgFps.textContent = `FPS: ${Math.round(1 / (dt || 0.016))}`;
        if (this.els.dbgEntities && em) this.els.dbgEntities.textContent = `Ent: ${em.count()}`;
    }

    showGameOver(stats) {
        if (this.els.statTime) this.els.statTime.textContent = formatTime(stats.time);
        if (this.els.statKills) this.els.statKills.textContent = stats.kills;
        if (this.els.statLevel) this.els.statLevel.textContent = stats.level;
    }

    // PASO 5: renderizar 3 opciones RNG
    renderLevelUpOptions(options) {
        const c = document.getElementById('upgrade-options');
        if (!c) return;
        c.innerHTML = '';
        options.forEach(opt => {
            const div = document.createElement('div');
            div.className = 'class-card';
            div.innerHTML = `
                <div class="class-icon">${opt.emoji}</div>
                <h3>${opt.name}</h3>
                <p class="class-desc">${opt.desc}</p>
                <button class="btn primary small">ELEGIR</button>
            `;
            div.querySelector('button').addEventListener('click', () => {
                this.game.applyUpgrade(opt.id);
            });
            c.appendChild(div);
        });
    }

    /** Muestra/oculta el botón de re-roll con el contador restante (3 por partida máx) */
    renderRerollButton(remaining) {
        const btn = document.getElementById('btn-reroll');
        if (!btn) return;
        const n = remaining || 0;
        btn.textContent = `RE-ROLL (${n})`;
        btn.classList.toggle('hidden', n <= 0);
        btn.disabled = n <= 0;
    }
}
