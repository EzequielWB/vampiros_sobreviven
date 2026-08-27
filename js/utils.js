/**
 * utils.js — Helpers matemáticos / geométricos
 * Usado por todas las entidades. Sin dependencias.
 */

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const lerp = (a, b, t) => a + (b - a) * t;

export const dist2 = (ax, ay, bx, by) => {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
};
export const dist = (ax, ay, bx, by) => Math.sqrt(dist2(ax, ay, bx, by));

export const normalize = (x, y) => {
    const len = Math.hypot(x, y) || 1;
    return { x: x / len, y: y / len };
};

export const rand = (min, max) => Math.random() * (max - min) + min;
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

// Formato MM:SS
export const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

// Hash para Spatial Grid: "x,y"
export const hashCell = (col, row) => `${col},${row}`;
