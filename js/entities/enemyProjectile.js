/**
 * EnemyProjectile -- Proyectil del Nigromante (shooter)
 */
import { normalize } from '../utils.js';

export class EnemyProjectile {
    constructor(x, y, tx, ty, speed=210, damage=9, color='#3B0754') {
        this.type = 'enemyProjectile';
        this.x=x; this.y=y;
        this.radius=5.5; this.damage=damage; this.color=color; this.alive=true;
        this.life=3.2;
        const n = normalize(tx - x, ty - y);
        this.vx=n.x*speed; this.vy=n.y*speed;
    }
    update(dt, game){
        this.x+=this.vx*dt; this.y+=this.vy*dt;
        this.life-=dt;
        if (this.life<=0) this.alive=false;
        if (this.x < -80 || this.x > game.worldWidth+80 || this.y < -80 || this.y > game.worldHeight+80) this.alive=false;
        // colisión con jugador se maneja en EntityManager/Game
    }
    render(ctx, camera){
        const sx=this.x-camera.x, sy=this.y-camera.y;
        if (sx<-20||sx>camera.w+20||sy<-20||sy>camera.h+20) return;
        ctx.imageSmoothingEnabled=false;
        // estela pixel
        ctx.fillStyle=this.color+'44';
        ctx.fillRect(Math.floor(sx - this.vx*0.02)-1, Math.floor(sy - this.vy*0.02)-1, 4, 4);
        ctx.fillStyle='#000';
        ctx.fillRect(Math.floor(sx)-4, Math.floor(sy)-4, 8, 8);
        ctx.fillStyle=this.color;
        ctx.fillRect(Math.floor(sx)-3, Math.floor(sy)-3, 6, 6);
        // cráneo pixel 3x3
        ctx.fillStyle='rgba(255,255,255,0.92)';
        ctx.fillRect(Math.floor(sx)-1, Math.floor(sy)-1, 2, 2);
    }
}
