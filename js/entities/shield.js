/**
 * Shield -- Escudo del Caballero
 * No es una entidad independiente en el grid; es un buff visual que sigue al jugador.
 * Se gestiona desde Game + Player. Este archivo solo exporta helpers de render.
 * El escudo bloquea el siguiente daño y se rompe. Reaparece tras cooldown.
 */
export class Shield {
    static render(ctx, sx, sy, radius, pulse, charges) {
        // paleta gótica: azul abisal + bordó
        const p = 0.88 + Math.sin(pulse)*0.10;
        ctx.fillStyle=`rgba(15,23,42,${0.32})`;
        ctx.beginPath(); ctx.arc(sx, sy, radius * p, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle=`rgba(97,12,39,${0.62})`;
        ctx.lineWidth=2.2;
        ctx.setLineDash([7,5]);
        ctx.beginPath(); ctx.arc(sx, sy, radius, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
        // brillo interior
        ctx.strokeStyle=`rgba(255,255,255,${0.22 + Math.sin(pulse*1.6)*0.08})`;
        ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.arc(sx, sy, radius*0.72, 0, Math.PI*2); ctx.stroke();
        // icono escudo orbitando si hay cargas
        if(charges>0){
            for(let i=0;i<charges;i++){
                const ang = pulse*0.9 + i*(Math.PI*2/Math.max(1,charges));
                const ox = Math.cos(ang)*radius, oy=Math.sin(ang)*radius;
                ctx.font='14px serif';
                ctx.textAlign='center'; ctx.textBaseline='middle';
                // sombra
                ctx.fillStyle='rgba(0,0,0,0.45)';
                ctx.fillText('[SHD]', sx+ox+1, sy+oy+1);
                ctx.fillStyle='#fff';
                ctx.fillText('[SHD]', sx+ox, sy+oy);
            }
        }
    }
}
