/**
 * SpatialGrid — Partición espacial por Hashing en Grid
 * PASO 2: Implementación completa con métricas y debug.
 * Evita O(n²) al consultar solo celdas vecinas.
 * Con 1000 entidades: O(n) rebuild + queries O(k) vs O(1M) chequeos.
 */
import { hashCell } from './utils.js';

export class SpatialGrid {
    constructor(cellSize = 80) {
        this.cellSize = cellSize;
        this.cells = new Map(); // key -> Set<entity>
        this.stats = { cellsUsed: 0, avgPerCell: 0, maxPerCell: 0, queries: 0 };
    }

    clear() {
        this.cells.clear();
    }

    _cellCoords(x, y) {
        return {
            col: Math.floor(x / this.cellSize),
            row: Math.floor(y / this.cellSize)
        };
    }

    _key(col, row) { return hashCell(col, row); }

    insert(entity) {
        const { col, row } = this._cellCoords(entity.x, entity.y);
        const key = this._key(col, row);
        if (!this.cells.has(key)) this.cells.set(key, new Set());
        this.cells.get(key).add(entity);
        entity._gridKey = key;
        entity._gridCol = col;
        entity._gridRow = row;
    }

    query(x, y, radius = 0) {
        const { col, row } = this._cellCoords(x, y);
        const span = radius > 0 ? Math.ceil(radius / this.cellSize) : 0;
        const result = [];
        for (let dc = -span; dc <= span; dc++) {
            for (let dr = -span; dr <= span; dr++) {
                const key = this._key(col + dc, row + dr);
                const bucket = this.cells.get(key);
                if (bucket) {
                    for (const e of bucket) result.push(e);
                }
            }
        }
        this.stats.queries++;
        return result;
    }

    queryNearby(entity, radius = 0) {
        return this.query(entity.x, entity.y, radius);
    }

    rebuild(entities) {
        this.clear();
        this.stats.queries = 0;
        for (const e of entities) {
            if (e.alive !== false) this.insert(e);
        }
        // Métricas
        let total = 0, max = 0;
        for (const bucket of this.cells.values()) {
            total += bucket.size;
            if (bucket.size > max) max = bucket.size;
        }
        this.stats.cellsUsed = this.cells.size;
        this.stats.avgPerCell = this.cells.size ? (total / this.cells.size).toFixed(1) : 0;
        this.stats.maxPerCell = max;
    }

    getStats() { return { ...this.stats }; }

    // Debug: dibujar grilla y ocupación
    debugDraw(ctx, camera) {
        const cs = this.cellSize;
        const startCol = Math.floor(camera.x / cs);
        const endCol = Math.floor((camera.x + camera.w) / cs);
        const startRow = Math.floor(camera.y / cs);
        const endRow = Math.floor((camera.y + camera.h) / cs);
        ctx.save();
        // Celdas con entidades en violeta gótico
        ctx.fillStyle = 'rgba(59,7,84,0.08)';
        for (const [key, bucket] of this.cells) {
            const [c, r] = key.split(',').map(Number);
            if (c < startCol || c > endCol || r < startRow || r > endRow) continue;
            const x = c * cs - camera.x;
            const y = r * cs - camera.y;
            const alpha = Math.min(0.20, bucket.size * 0.045);
            ctx.fillStyle = `rgba(59,7,84,${alpha})`;
            ctx.fillRect(x, y, cs, cs);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        for (let c = startCol; c <= endCol; c++) {
            const x = c * cs - camera.x;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, camera.h); ctx.stroke();
        }
        for (let r = startRow; r <= endRow; r++) {
            const y = r * cs - camera.y;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(camera.w, y); ctx.stroke();
        }
        ctx.restore();
    }
}
