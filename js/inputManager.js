/**
 * InputManager -- teclado + mouse + táctil (joystick + toque directo)
 * Expone getMovementVector() normalizado, prioriza táctil si está activo.
 */
export class InputManager {
    constructor() {
        this.keys = new Set();
        this.mouse = { x: 0, y: 0, down: false };
        this.touchVec = { x: 0, y: 0 };
        this.touchActive = false;
        this.isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

        // joystick
        this.joyEl = null;
        this.stickEl = null;
        this.joyActive = false;
        this.joyCenter = { x: 0, y: 0 };
        this.joyRadius = 52;

        this._keyDown = this._keyDown.bind(this);
        this._keyUp = this._keyUp.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
    }

    init(target = window) {
        target.addEventListener('keydown', this._keyDown);
        target.addEventListener('keyup', this._keyUp);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mouseup', this._onMouseUp);
        // táctil
        window.addEventListener('touchstart', this._onTouchStart, { passive: false });
        window.addEventListener('touchmove', this._onTouchMove, { passive: false });
        window.addEventListener('touchend', this._onTouchEnd, { passive: false });
        window.addEventListener('touchcancel', this._onTouchEnd, { passive: false });
        // joystick elems (pueden no existir al init si DOM no listo)
        setTimeout(()=>this._bindJoystick(), 200);
    }

    _bindJoystick(){
        this.joyEl = document.getElementById('joystick');
        this.stickEl = document.getElementById('joystick-stick');
        if(!this.joyEl || !this.stickEl) return;
        // evitar que el joystick capture scroll
        this.joyEl.addEventListener('touchstart', this._onTouchStart, { passive:false });
        this.joyEl.addEventListener('touchmove', this._onTouchMove, { passive:false });
        this.joyEl.addEventListener('touchend', this._onTouchEnd, { passive:false });
    }

    destroy(target = window) {
        target.removeEventListener('keydown', this._keyDown);
        target.removeEventListener('keyup', this._keyUp);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mousedown', this._onMouseDown);
        window.removeEventListener('mouseup', this._onMouseUp);
        window.removeEventListener('touchstart', this._onTouchStart);
        window.removeEventListener('touchmove', this._onTouchMove);
        window.removeEventListener('touchend', this._onTouchEnd);
        window.removeEventListener('touchcancel', this._onTouchEnd);
    }

    _keyDown(e) {
        const k = e.key.toLowerCase();
        this.keys.add(k);
        if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) {
            if (e.target === document.body) e.preventDefault();
        }
    }
    _keyUp(e) { this.keys.delete(e.key.toLowerCase()); }
    _onMouseMove(e) { this.mouse.x = e.clientX; this.mouse.y = e.clientY; }
    _onMouseDown() { this.mouse.down = true; }
    _onMouseUp() { this.mouse.down = false; }

    _isTouchOnJoystick(touch){
        if(!this.joyEl) return false;
        const r = this.joyEl.getBoundingClientRect();
        const pad = 18;
        return touch.clientX >= r.left - pad && touch.clientX <= r.right + pad && touch.clientY >= r.top - pad && touch.clientY <= r.bottom + pad;
    }

    _onTouchStart(e){
        const t = e.touches[0];
        if(!t) return;
        const target = e.target;
        if(target.closest && target.closest('button')) return;
        // En menú, permitir scroll normal (no capturar toque como movimiento)
        const hudHidden = document.getElementById('hud')?.classList.contains('hidden');
        const inGameplay = !hudHidden;
        if(!inGameplay && !this._isTouchOnJoystick(t)){
            // en menú, no interferir con scroll
            return;
        }

        // detectar si es joystick
        if(this._isTouchOnJoystick(t)){
            e.preventDefault();
            this.joyActive = true;
            const r = this.joyEl.getBoundingClientRect();
            this.joyCenter.x = r.left + r.width/2;
            this.joyCenter.y = r.top + r.height/2;
            this.joyEl.classList.add('active');
            this.joyEl.classList.remove('hidden');
            document.getElementById('touch-hint')?.classList.add('hidden');
            this._updateJoystick(t);
            return;
        }
        // toque directo en canvas/juego: mover hacia el punto tocado
        // solo si estamos en gameplay (lo verifica el que consume el vector, pero lo activamos igual)
        // si toca fuera del joystick y dentro del game-container, activar movimiento directo
        const container = document.getElementById('game-container');
        if(container && container.contains(target) || target.id==='gameCanvas'){
            // no prevenir si es UI
            e.preventDefault();
            this.touchActive = true;
            // para toque directo, calcularemos vector en getMovementVector usando la posición del toque vs centro de pantalla
            // guardamos la posición del toque
            this.touchVec.x = 0; this.touchVec.y = 0; // se calculará en move usando el centro del canvas
            this._lastTouch = { x: t.clientX, y: t.clientY };
            // mostrar joystick en el punto de toque como feedback (opcional)
            this._updateDirectTouch(t);
        }
    }

    _onTouchMove(e){
        const t = e.touches[0];
        if(!t) return;
        if(this.joyActive){
            e.preventDefault();
            this._updateJoystick(t);
        } else if(this.touchActive){
            e.preventDefault();
            this._lastTouch = { x: t.clientX, y: t.clientY };
            this._updateDirectTouch(t);
        }
    }

    _onTouchEnd(e){
        if(this.joyActive){
            this.joyActive = false;
            this.touchVec.x = 0; this.touchVec.y = 0;
            this.joyEl?.classList.remove('active');
            if(this.stickEl) this.stickEl.style.transform = 'translate(0,0)';
            // si no hay más touches, ocultar hint? no
        }
        if(this.touchActive){
            // si no quedan dedos, desactivar
            if(e.touches.length===0){
                this.touchActive = false;
                this.touchVec.x = 0; this.touchVec.y = 0;
                this._lastTouch = null;
            }
        }
    }

    _updateJoystick(touch){
        const dx = touch.clientX - this.joyCenter.x;
        const dy = touch.clientY - this.joyCenter.y;
        const dist = Math.hypot(dx,dy);
        const max = this.joyRadius;
        let nx = dx / max, ny = dy / max;
        if(dist > max){
            const a = Math.atan2(dy,dx);
            nx = Math.cos(a);
            ny = Math.sin(a);
        }
        // clamp
        nx = Math.max(-1, Math.min(1, nx));
        ny = Math.max(-1, Math.min(1, ny));
        this.touchVec.x = nx;
        this.touchVec.y = ny;
        // mover stick visual
        if(this.stickEl){
            const tx = nx * (max - 22);
            const ty = ny * (max - 22);
            this.stickEl.style.transform = `translate(${tx}px, ${ty}px)`;
        }
    }

    _updateDirectTouch(touch){
        // vector desde el centro de la pantalla (o centro del canvas) hacia el toque
        const canvas = document.getElementById('gameCanvas');
        if(!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const cx = rect.left + rect.width/2;
        const cy = rect.top + rect.height/2;
        let dx = touch.clientX - cx;
        let dy = touch.clientY - cy;
        const len = Math.hypot(dx,dy);
        if(len < 12){ this.touchVec.x=0; this.touchVec.y=0; return; }
        // normalizar, pero con zona muerta y clamped
        this.touchVec.x = dx / len;
        this.touchVec.y = dy / len;
        // si está muy cerca, reducir magnitud para movimiento fino (opcional)
        // para simplificar, siempre magnitud 1 si len > 12
    }

    isDown(key){ return this.keys.has(key.toLowerCase()); }

    getMovementVector(){
        // joystick / toque directo tiene prioridad sobre teclado
        if(this.joyActive || this.touchActive){
            const x = this.touchVec.x, y = this.touchVec.y;
            if(Math.hypot(x,y) > 0.08) return { x, y };
        }
        let x = 0, y = 0;
        if (this.isDown('w') || this.isDown('arrowup')) y -= 1;
        if (this.isDown('s') || this.isDown('arrowdown')) y += 1;
        if (this.isDown('a') || this.isDown('arrowleft')) x -= 1;
        if (this.isDown('d') || this.isDown('arrowright')) x += 1;
        if (x !== 0 && y !== 0) {
            const inv = 1 / Math.hypot(x, y);
            x *= inv; y *= inv;
        }
        return { x, y };
    }

    consume(key){
        const k = key.toLowerCase();
        if (this.keys.has(k)) { this.keys.delete(k); return true; }
        return false;
    }

    // Mostrar/ocultar joystick según estado del juego y si es touch
    setJoystickVisible(visible){
        if(!this.joyEl) this._bindJoystick();
        if(!this.joyEl) return;
        if(visible && this.isTouchDevice){
            this.joyEl.classList.remove('hidden');
            document.getElementById('touch-hint')?.classList.remove('hidden');
        } else {
            this.joyEl.classList.add('hidden');
            document.getElementById('touch-hint')?.classList.add('hidden');
        }
    }
}
