/**
 * AudioManager -- Sonidos sintéticos con Web Audio API (sin archivos externos)
 * PASO 3: feedback jugable. Se inicializa al primer input del usuario.
 */
export class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.22;
        this._muted = false;
    }

    _ensureCtx() {
        if (this.ctx) return;
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AC();
        } catch (e) { this.enabled = false; }
    }

    resume() {
        this._ensureCtx();
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    toggleMute() { this._muted = !this._muted; return this._muted; }

    _tone(freq, type='sine', duration=0.12, gain=0.8, slideTo=null, slideTime=0.08) {
        if (!this.enabled || this._muted) return;
        this._ensureCtx();
        if (!this.ctx) return;
        const t0 = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const filt = this.ctx.createBiquadFilter();
        filt.type = 'lowpass'; filt.frequency.value = 4200;
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + slideTime);
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(gain * this.volume, t0 + 0.008);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
        osc.connect(filt).connect(g).connect(this.ctx.destination);
        osc.start(t0);
        osc.stop(t0 + duration + 0.02);
    }

    _noise(duration=0.08, gain=0.5) {
        if (!this.enabled || this._muted) return;
        this._ensureCtx();
        if (!this.ctx) return;
        const t0 = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i=0;i<bufferSize;i++) data[i] = (Math.random()*2-1) * Math.pow(1 - i/bufferSize, 1.5);
        const src = this.ctx.createBufferSource(); src.buffer = buffer;
        const g = this.ctx.createGain();
        const filt = this.ctx.createBiquadFilter(); filt.type='highpass'; filt.frequency.value=1200;
        g.gain.setValueAtTime(gain*this.volume, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
        src.connect(filt).connect(g).connect(this.ctx.destination);
        src.start(t0);
    }

    // --- Sonidos del juego ---
    shoot() { this._tone(520, 'square', 0.09, 0.42, 880, 0.06); }
    dagger() { this._tone(900, 'square', 0.06, 0.35, 1200, 0.04); }
    whip() { this._noise(0.09, 0.55); this._tone(220, 'square', 0.11, 0.45, 80, 0.09); }
    garlicTick() { this._tone(180, 'triangle', 0.14, 0.18, 165, 0.12); }
    hit() { this._tone(180, 'square', 0.10, 0.6, 90, 0.08); this._noise(0.06, 0.25); }
    enemyHit() { this._tone(320, 'square', 0.07, 0.32, 180, 0.06); }
    enemyDeath() { this._tone(220, 'sawtooth', 0.16, 0.38, 70, 0.14); }
    pickup() { this._tone(600, 'sine', 0.12, 0.42, 880, 0.09); setTimeout(()=>this._tone(880,'sine',0.10,0.30,1100,0.07), 70); }
    hurt() { this._tone(140, 'sawtooth', 0.18, 0.55, 80, 0.12); }
    levelUp() {
        this._tone(440,'sine',0.14,0.45, null,0);
        setTimeout(()=>this._tone(554,'sine',0.14,0.45),90);
        setTimeout(()=>this._tone(659,'sine',0.18,0.50),180);
        setTimeout(()=>this._tone(880,'sine',0.22,0.55),300);
    }
    gameOver() { this._tone(180,'sawtooth',0.45,0.45, 55,0.4); setTimeout(()=>this._tone(120,'triangle',0.6,0.35, 45,0.5),160); }
    pause() { this._tone(500,'sine',0.09,0.30, 350,0.08); }
    spawnWave() { this._tone(90,'square',0.10,0.18, 110,0.08); }
    shieldUp() { this._tone(480,'sine',0.18,0.42, 720,0.14); setTimeout(()=>this._tone(720,'sine',0.14,0.35, 960,0.10), 100); }
    shieldBlock() { this._tone(180,'square',0.13,0.55, 320,0.09); this._noise(0.05,0.32); }
    shieldBreak() { this._tone(220,'sawtooth',0.22,0.48, 70,0.18); }
    fireballShoot() { this._tone(160,'sawtooth',0.14,0.50, 90,0.11); setTimeout(()=>this._tone(240,'square',0.10,0.35, 480,0.08), 80); }
    fireballExplode() { this._noise(0.18,0.62); this._tone(120,'square',0.22,0.55, 55,0.18); setTimeout(()=>this._tone(80,'triangle',0.28,0.42, 45,0.22), 60); }
}
