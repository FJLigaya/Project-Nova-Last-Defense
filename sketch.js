// ================================================
// PROJECT NOVA: LAST DEFENSE
// CS Elective 4 — Graphic Design
// Developed By: Michael, Justin, Romel, Abraham, Filjoy
// ================================================

let STATE = "start";

// 30 waves per level. Boss waves: 5,10,15,20,25,30
let wave = 1;
let level = 1;
let enemiesThisWave = 0;
let enemiesToSpawn = 8;
let enemiesKilled = 0;
let waveInProgress = false;
let waveTimer = 0;
let waveMessage = "";
let waveMessageTimer = 0;
let bossWave = false;
let betweenWaves = false;

let bossIntroActive = false;
let bossIntroTimer = 0;
let bossIntroName = "";
const BOSS_INTRO_DURATION = 180;

let levelCompleteActive = false;
let levelCompleteTimer = 0;
const LEVEL_COMPLETE_DURATION = 240;

let player;
let bullets = [];
let enemyBullets = [];
let enemies = [];
let particles = [];
let stars = [];
let powerups = [];
let boss = null;

let score = 0;
let highScore = 0;
let lives = 3;
let shield = 0;
let shieldMax = 1;
let paused = false;
let highestLevel = 1;
let highestWave = 1;

let currentWeapon = "single";
let shootCooldown = 0;
let fireMode = "auto";

let novaActive = false;
let novaTimer = 0;
const NOVA_DURATION = 60 * 20;
let prevWeapon = "single";

// Boss name table — keyed to wave position within 30-wave cycle
const BOSS_NAMES = {
  5:  "COMMANDER MICHAEL",
  10: "PHANTOM JUSTIN",
  15: "TITAN ROMEL",
  20: "OVERLORD ABRAHAM",
  25: "CAPTAIN FILJOY",
  30: "SUPREME COMMANDER ZAPANTA"
};

// ================================================
// AUDIO
// ================================================
let audioCtx;
function playSound(type) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let o = audioCtx.createOscillator();
    let g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    if (type === "shoot") {
      o.frequency.setValueAtTime(880, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.07);
      g.gain.setValueAtTime(0.07, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);
      o.start(); o.stop(audioCtx.currentTime + 0.07);
    } else if (type === "explode") {
      o.type = "sawtooth";
      o.frequency.setValueAtTime(200, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.3);
      g.gain.setValueAtTime(0.18, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      o.start(); o.stop(audioCtx.currentTime + 0.3);
    } else if (type === "hit") {
      o.frequency.setValueAtTime(300, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
      g.gain.setValueAtTime(0.12, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      o.start(); o.stop(audioCtx.currentTime + 0.15);
    } else if (type === "shield") {
      o.frequency.setValueAtTime(600, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.2);
      g.gain.setValueAtTime(0.1, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      o.start(); o.stop(audioCtx.currentTime + 0.2);
    } else if (type === "powerup") {
      o.frequency.setValueAtTime(440, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.25);
      g.gain.setValueAtTime(0.12, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      o.start(); o.stop(audioCtx.currentTime + 0.3);
    } else if (type === "boss") {
      o.type = "square";
      o.frequency.setValueAtTime(80, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.5);
      g.gain.setValueAtTime(0.2, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      o.start(); o.stop(audioCtx.currentTime + 0.5);
    } else if (type === "levelup") {
      o.type = "sine";
      o.frequency.setValueAtTime(440, audioCtx.currentTime);
      o.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 0.4);
      o.frequency.linearRampToValueAtTime(1320, audioCtx.currentTime + 0.8);
      g.gain.setValueAtTime(0.15, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.0);
      o.start(); o.stop(audioCtx.currentTime + 1.0);
    }
  } catch(e) {}
}

// ================================================
// BULLET (player)
// ================================================
class Bullet {
  constructor(x, y, vx, vy, type) {
    this.x = x; this.y = y;
    this.vx = vx || 0;
    this.vy = vy || -11;
    this.type = type || "single";
    this.active = true;
    this.dmg = (type === "laser" || type === "nova") ? 2 : 1;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    if (this.y < -30 || this.x < -30 || this.x > width + 30) this.active = false;
  }
  draw() {
    noStroke();
    if (this.type === "laser") {
      fill(255, 50, 50, 60); ellipse(this.x, this.y, 12, 28);
      fill(255, 130, 130); rect(this.x - 2, this.y - 12, 4, 24);
    } else if (this.type === "nova") {
      fill(255, 220, 50, 80); ellipse(this.x, this.y, 20, 20);
      fill(255, 240, 120); ellipse(this.x, this.y, 10, 10);
      fill(255, 255, 200, 200); ellipse(this.x, this.y, 4, 4);
    } else if (this.type === "spread" || this.type === "triple") {
      fill(255, 180, 0, 60); ellipse(this.x, this.y, 13, 13);
      fill(255, 230, 100); ellipse(this.x, this.y, 6, 10);
    } else {
      fill(0, 255, 200, 60); ellipse(this.x, this.y, 12, 18);
      fill(150, 255, 230); ellipse(this.x, this.y, 5, 12);
    }
  }
}

// ================================================
// ENEMY BULLET
// ================================================
class EnemyBullet {
  constructor(x, y, vx, vy) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.active = true;
    this.w = 8; this.h = 8;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    if (this.y > height+20 || this.y < -20 || this.x < -20 || this.x > width+20) this.active = false;
  }
  draw() {
    noStroke();
    fill(255, 80, 80, 80); ellipse(this.x, this.y, this.w+6, this.h+6);
    fill(255, 120, 120); ellipse(this.x, this.y, this.w, this.h);
  }
}

// ================================================
// PLAYER
// ================================================
class Player {
  constructor() {
    this.x = width/2; this.y = height-80;
    this.w = 40; this.h = 50;
    this.speed = 5;
    this.invincible = 0;
    this.thrusterAnim = 0;
    this.trail = [];
  }
  update() {
    if (keyIsDown(LEFT_ARROW)  || keyIsDown(65)) this.x -= this.speed;
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) this.x += this.speed;
    if (keyIsDown(UP_ARROW)    || keyIsDown(87)) this.y -= this.speed;
    if (keyIsDown(DOWN_ARROW)  || keyIsDown(83)) this.y += this.speed;
    this.x = constrain(this.x, this.w/2, width - this.w/2);
    this.y = constrain(this.y, this.h/2, height - this.h/2);
    if (fireMode === "auto") this.shoot();
    if (fireMode === "spacebar" && keyIsDown(32)) this.shoot();
    if (shootCooldown > 0) shootCooldown--;
    if (this.invincible > 0) this.invincible--;
    this.thrusterAnim = (this.thrusterAnim + 0.3) % TWO_PI;
    this.trail.push({x: this.x, y: this.y + this.h/2});
    if (this.trail.length > 20) this.trail.shift();
  }
  shoot() {
    if (shootCooldown > 0) return;
    let spd = -12;
    let gun = currentWeapon;
    if (gun === "single") {
      bullets.push(new Bullet(this.x, this.y-this.h/2, 0, spd, "single"));
      shootCooldown = 10;
    } else if (gun === "double") {
      bullets.push(new Bullet(this.x-9, this.y-this.h/2, 0, spd, "single"));
      bullets.push(new Bullet(this.x+9, this.y-this.h/2, 0, spd, "single"));
      shootCooldown = 10;
    } else if (gun === "spread") {
      bullets.push(new Bullet(this.x, this.y-this.h/2, 0, spd, "spread"));
      bullets.push(new Bullet(this.x, this.y-this.h/2, -3.5, spd*0.95, "spread"));
      bullets.push(new Bullet(this.x, this.y-this.h/2,  3.5, spd*0.95, "spread"));
      shootCooldown = 13;
    } else if (gun === "triple") {
      bullets.push(new Bullet(this.x-14, this.y-this.h/2, 0, spd, "triple"));
      bullets.push(new Bullet(this.x,    this.y-this.h/2, 0, spd, "triple"));
      bullets.push(new Bullet(this.x+14, this.y-this.h/2, 0, spd, "triple"));
      shootCooldown = 8;
    } else if (gun === "laser") {
      bullets.push(new Bullet(this.x, this.y-this.h/2, 0, -17, "laser"));
      shootCooldown = 5;
    } else if (gun === "nova") {
      for (let i = 0; i < 5; i++) {
        let ang = -HALF_PI + (i-2)*0.3;
        bullets.push(new Bullet(this.x, this.y-this.h/2, cos(ang)*14, sin(ang)*14, "nova"));
      }
      shootCooldown = 7;
    }
    playSound("shoot");
  }
  takeDamage() {
    if (this.invincible > 0) return;
    if (shield > 0) {
      shield--;
      playSound("shield");
      this.invincible = 40;
      showMessage("SHIELD HIT! " + shield + " LEFT");
    } else {
      lives--;
      this.invincible = 120;
      spawnExplosion(this.x, this.y, color(255,200,100), 10);
      playSound("hit");
      if (lives <= 0) {
        if (score > highScore) highScore = score;
        if (level > highestLevel) highestLevel = level;
        if (wave > highestWave) highestWave = wave;
        STATE = "gameover";
      }
    }
  }
  draw() {
    if (shield > 0) {
      let sa = map(shield, 0, shieldMax, 60, 200);
      fill(0, 200, 255, sa*0.3 + sin(frameCount*0.1)*20);
      noStroke(); ellipse(this.x, this.y, this.w+36, this.h+36);
      stroke(0, 220, 255, sa); strokeWeight(2); noFill();
      ellipse(this.x, this.y, this.w+34, this.h+34);
    }
    if (this.invincible > 0 && frameCount%6 < 3) return;
    for (let i = 0; i < this.trail.length; i++) {
      let a = map(i, 0, this.trail.length, 0, 80);
      fill(0, 200, 255, a); noStroke();
      ellipse(this.trail[i].x, this.trail[i].y, 6, 6);
    }
    push(); translate(this.x, this.y);
    let fH = 15 + sin(this.thrusterAnim)*8;
    fill(255,150,0,180); noStroke();
    ellipse(-10, this.h/2, 10, fH); ellipse(10, this.h/2, 10, fH);
    fill(255,255,100,200);
    ellipse(-10, this.h/2, 5, fH*0.6); ellipse(10, this.h/2, 5, fH*0.6);
    let sc = weaponColor();
    fill(sc[0], sc[1], sc[2]);
    stroke(150,240,255); strokeWeight(1.5);
    beginShape();
    vertex(0,-this.h/2); vertex(-this.w/2,this.h/2);
    vertex(-this.w/4,this.h/4); vertex(0,this.h/3);
    vertex(this.w/4,this.h/4); vertex(this.w/2,this.h/2);
    endShape(CLOSE);
    fill(100,255,255,180); noStroke(); ellipse(0,-this.h/6,14,18);
    fill(sc[0],sc[1],sc[2],30); ellipse(0,0,this.w+20,this.h+20);
    pop();
  }
  hits(obj) {
    return abs(this.x-obj.x) < (this.w/2+obj.w/2)-5 &&
           abs(this.y-obj.y) < (this.h/2+obj.h/2)-5;
  }
}

function weaponColor() {
  if (currentWeapon==="single") return [0,200,255];
  if (currentWeapon==="double") return [100,255,150];
  if (currentWeapon==="spread") return [255,200,50];
  if (currentWeapon==="triple") return [200,100,255];
  if (currentWeapon==="laser")  return [255,80,80];
  if (currentWeapon==="nova")   return [255,240,80];
  return [0,200,255];
}

// ================================================
// ENEMY — 8 types
// ================================================
class Enemy {
  constructor(forcedType) {
    this.x = random(30, width-30);
    this.y = random(-120, -20);
    this.active = true;
    this.animOffset = random(TWO_PI);
    this.shootTimer = floor(random(60,180));
    this.zigzagT = 0;
    this.type = (forcedType !== undefined) ? forcedType : floor(random(8));

    let diffMult = 1 + (level-1)*0.12;
    let spd = (1 + wave*0.06) * diffMult;

    if (this.type === 0) {
      this.w=36; this.h=22;
      this.hp=1+floor((level-1)*0.3); this.maxHp=this.hp;
      this.speed=(random(1.2,2.2)+spd)*diffMult;
      this.col=color(255,80,80); this.pts=10;
      this.canShoot=wave>=3||level>1;
    } else if (this.type === 1) {
      this.w=26; this.h=26; this.hp=1; this.maxHp=1;
      this.speed=(random(3,5.5)+spd*1.2)*diffMult;
      this.col=color(255,200,50); this.pts=20; this.canShoot=false;
    } else if (this.type === 2) {
      this.w=46; this.h=46;
      this.hp=2+floor(wave/4)+floor((level-1)*0.5); this.maxHp=this.hp;
      this.speed=(random(0.6,1.2)+spd*0.4)*diffMult;
      this.col=color(180,50,255); this.pts=30;
      this.canShoot=wave>=2||level>1;
    } else if (this.type === 3) {
      this.w=30; this.h=30; this.hp=1; this.maxHp=1;
      this.speed=(random(2,3.5)+spd)*diffMult;
      this.col=color(50,220,180); this.pts=25; this.canShoot=false;
      this.diagDir=random()<0.5?1:-1;
    } else if (this.type === 4) {
      this.w=40; this.h=40;
      this.hp=2+floor((level-1)*0.4); this.maxHp=this.hp;
      this.speed=(random(0.8,1.4)+spd*0.6)*diffMult;
      this.col=color(255,120,30); this.pts=35; this.canShoot=true;
    } else if (this.type === 5) {
      this.w=18; this.h=18; this.hp=1; this.maxHp=1;
      this.speed=(random(2.5,4)+spd*1.5)*diffMult;
      this.col=color(200,50,255); this.pts=15; this.canShoot=false;
      this.driftTargetX=player?player.x:width/2;
    } else if (this.type === 6) {
      this.w=38; this.h=28;
      this.hp=2+floor((level-1)*0.3); this.maxHp=this.hp;
      this.speed=(random(0.5,1.0)+spd*0.3)*diffMult;
      this.col=color(255,80,0); this.pts=40; this.canShoot=true;
      this.shootTimer=floor(random(40,80));
    } else if (this.type === 7) {
      this.w=32; this.h=32;
      this.hp=2+floor((level-1)*0.3); this.maxHp=this.hp;
      this.speed=(random(1.2,2.2)+spd*0.5)*diffMult;
      this.col=color(80,200,255); this.pts=45; this.canShoot=true;
      this.arcT=0; this.baseX=this.x;
      this.shootTimer=floor(random(50,100));
    }
  }

  update() {
    if (this.type===1) {
      this.zigzagT+=0.08; this.x+=sin(this.zigzagT)*3.5; this.y+=this.speed;
    } else if (this.type===3) {
      this.x+=this.diagDir*this.speed*0.8; this.y+=this.speed*0.8;
    } else if (this.type===5) {
      let dx=this.driftTargetX-this.x; this.x+=dx*0.012; this.y+=this.speed;
    } else if (this.type===7) {
      this.arcT+=0.045;
      this.x=this.baseX+sin(this.arcT)*90; this.y+=this.speed*0.7;
    } else {
      this.y+=this.speed;
    }
    this.x=constrain(this.x,this.w/2,width-this.w/2);
    if (this.y>height+50) this.active=false;

    if (this.canShoot && this.y>0) {
      this.shootTimer--;
      if (this.shootTimer<=0) {
        let bspd=(3.5+wave*0.06)*(1+(level-1)*0.08);
        if (this.type===0||this.type===2) {
          enemyBullets.push(new EnemyBullet(this.x, this.y+this.h/2, 0, bspd));
        } else if (this.type===4) {
          enemyBullets.push(new EnemyBullet(this.x, this.y+this.h/2, 0, bspd));
          enemyBullets.push(new EnemyBullet(this.x, this.y, -bspd, 0));
          enemyBullets.push(new EnemyBullet(this.x, this.y, bspd, 0));
        } else if (this.type===6) {
          enemyBullets.push(new EnemyBullet(this.x, this.y+this.h/2, 0, bspd*1.4));
        } else if (this.type===7) {
          enemyBullets.push(new EnemyBullet(this.x, this.y, -bspd*1.1, 0.5));
          enemyBullets.push(new EnemyBullet(this.x, this.y,  bspd*1.1, 0.5));
        }
        this.shootTimer=max(25,floor(random(70,150))-wave*2-level*3);
      }
    }
  }

  draw() {
    push(); translate(this.x, this.y);
    let pulse=sin(frameCount*0.1+this.animOffset)*3;
    fill(red(this.col),green(this.col),blue(this.col),40);
    noStroke(); ellipse(0,0,this.w+18+pulse,this.h+18+pulse);
    stroke(255,255,255,80); strokeWeight(1); fill(this.col);

    if (this.type===0) {
      ellipse(0,2,this.w,this.h);
      fill(red(this.col)*0.6,green(this.col)*0.6,blue(this.col)*0.6);
      ellipse(0,-4,this.w*0.5,this.h*0.9);
      fill(255,255,200,180); noStroke(); ellipse(0,-4,8,8);
    } else if (this.type===1) {
      beginShape();
      vertex(0,-this.h/2); vertex(this.w/2,0);
      vertex(0,this.h/2); vertex(-this.w/2,0);
      endShape(CLOSE);
      fill(255,255,150,180); noStroke(); ellipse(0,0,6,6);
    } else if (this.type===2) {
      beginShape();
      for (let a=0;a<6;a++){let ang=(TWO_PI/6)*a-PI/6;vertex(cos(ang)*this.w/2,sin(ang)*this.h/2);}
      endShape(CLOSE);
      fill(red(this.col)*0.5,green(this.col)*0.5,blue(this.col)*0.5);
      ellipse(0,0,16,16); this._drawHpBar();
    } else if (this.type===3) {
      fill(red(this.col),green(this.col),blue(this.col),160);
      beginShape();
      vertex(0,-this.h/2); vertex(-this.w/2,this.h/2); vertex(this.w/2,this.h/2);
      endShape(CLOSE);
      fill(200,255,240,200); noStroke(); ellipse(0,0,8,8);
    } else if (this.type===4) {
      beginShape();
      for (let a=0;a<8;a++){let ang=(TWO_PI/8)*a;vertex(cos(ang)*this.w/2,sin(ang)*this.h/2);}
      endShape(CLOSE);
      fill(255,200,100,180); noStroke(); ellipse(0,0,12,12); this._drawHpBar();
    } else if (this.type===5) {
      beginShape();
      for (let a=0;a<5;a++){let ang=(TWO_PI/5)*a-PI/2;vertex(cos(ang)*this.w/2,sin(ang)*this.h/2);}
      endShape(CLOSE);
      fill(255,180,255,200); noStroke(); ellipse(0,0,5,5);
    } else if (this.type===6) {
      fill(this.col); stroke(255,200,80,120); strokeWeight(1.5);
      beginShape();
      vertex(-this.w*0.35,-this.h/2); vertex(this.w*0.35,-this.h/2);
      vertex(this.w/2,this.h/2); vertex(-this.w/2,this.h/2);
      endShape(CLOSE);
      fill(red(this.col)*0.7,green(this.col)*0.7,blue(this.col)*0.7);
      rect(-this.w/2-8,-4,10,14,2); rect(this.w/2-2,-4,10,14,2);
      fill(255,255,100,180+sin(frameCount*0.2)*55); noStroke();
      ellipse(0,this.h/4,10,8); this._drawHpBar();
    } else if (this.type===7) {
      push(); rotate(frameCount*0.06);
      fill(this.col); stroke(180,240,255,140); strokeWeight(1);
      for (let p=0;p<2;p++){
        beginShape();
        for (let a=0;a<6;a++){
          let ang=(TWO_PI/6)*a+p*(PI/6);
          let r=p===0?this.w/2:this.w/4;
          vertex(cos(ang)*r,sin(ang)*r);
        }
        endShape(CLOSE);
      }
      fill(200,240,255,200); noStroke(); ellipse(0,0,10,10);
      pop(); this._drawHpBar();
    }
    pop();
  }
  _drawHpBar() {
    noStroke(); fill(60,0,0); rect(-18,-this.h/2-8,36,5);
    fill(0,220,100); rect(-18,-this.h/2-8,36*(this.hp/this.maxHp),5);
  }
}

// ================================================
// BOSS — 6 unique designs, all drawn INSIDE push/translate
// Difficulty scales hard with level
// Each boss has a UNIQUE attack pattern
// ================================================
class Boss {
  constructor() {
    this.x = width/2; this.y = -160;
    this.targetY = 110;
    this.active = true;
    this.phase = 1;
    this.shootTimer = 70;
    this.moveTimer = 0;
    this.animT = 0;
    this.enraged = false;

    let wk = ((wave-1)%30)+1;
    this.waveKey = wk;
    this.name = BOSS_NAMES[wk] || "GUARDIAN";
    this.isFinalBoss = (wk === 30);

    // Difficulty multiplier — grows significantly each level
    let diffMult = 1 + (level-1)*0.18;

    // Each boss has individually tuned stats
    if (wk === 5) {
      // COMMANDER MICHAEL — medium, methodical
      this.w=120; this.h=70;
      this.maxHp = Math.round((22+level*5)*diffMult);
      this.pts=200+level*25; this.speed=(1.1+level*0.07)*diffMult;
      this.col=color(0,140,255); this.p2t=0.5; this.p3t=-1;
      this.isMega=false; this.isBig=false;
    } else if (wk === 10) {
      // PHANTOM JUSTIN — fast, sneaky
      this.w=100; this.h=80;
      this.maxHp = Math.round((28+level*6)*diffMult);
      this.pts=280+level*30; this.speed=(1.5+level*0.09)*diffMult;
      this.col=color(220,30,60); this.p2t=0.5; this.p3t=0.25;
      this.isMega=false; this.isBig=true;
    } else if (wk === 15) {
      // TITAN ROMEL — slow, tanky, hits hard
      this.w=160; this.h=90;
      this.maxHp = Math.round((40+level*8)*diffMult);
      this.pts=380+level*40; this.speed=(0.9+level*0.05)*diffMult;
      this.col=color(150,30,255); this.p2t=0.55; this.p3t=0.25;
      this.isMega=false; this.isBig=true;
    } else if (wk === 20) {
      // OVERLORD ABRAHAM — balanced, multi-phase
      this.w=150; this.h=90;
      this.maxHp = Math.round((50+level*9)*diffMult);
      this.pts=460+level*50; this.speed=(1.2+level*0.06)*diffMult;
      this.col=color(0,200,80); this.p2t=0.6; this.p3t=0.3;
      this.isMega=true; this.isBig=true;
    } else if (wk === 25) {
      // CAPTAIN FILJOY — aggressive, chaotic
      this.w=170; this.h=100;
      this.maxHp = Math.round((60+level*11)*diffMult);
      this.pts=540+level*60; this.speed=(1.4+level*0.08)*diffMult;
      this.col=color(255,180,0); this.p2t=0.55; this.p3t=0.28;
      this.isMega=true; this.isBig=true;
    } else {
      // SUPREME COMMANDER ZAPANTA — final, overwhelming
      this.w=190+min(level*3,50); this.h=110+min(level*2,30);
      this.maxHp = Math.round((80+level*14)*diffMult);
      this.pts=700+level*90; this.speed=(1.6+level*0.1)*diffMult;
      this.col=color(255,20,80); this.p2t=0.6; this.p3t=0.3;
      this.isMega=true; this.isBig=true;
    }

    this.hp = this.maxHp;
  }

  update() {
    if (this.y < this.targetY) { this.y+=2.5; return; }
    this.animT += 0.04;
    this.moveTimer++;

    let hpRatio = this.hp/this.maxHp;
    if (hpRatio<=this.p2t && this.phase<2) { this.phase=2; this.speed*=1.3; }
    if (this.p3t>0 && hpRatio<=this.p3t && this.phase<3) {
      this.phase=3; this.speed*=1.2; this.enraged=true;
    }

    // Movement pattern varies by boss
    if (this.waveKey===5) {
      // Michael: slow sweep
      this.x += sin(this.moveTimer*0.015)*3;
    } else if (this.waveKey===10) {
      // Justin: fast erratic
      this.x += sin(this.moveTimer*0.03)*4 + sin(this.moveTimer*0.07)*2;
    } else if (this.waveKey===15) {
      // Romel: slow pendulum
      this.x = width/2 + sin(this.moveTimer*0.012)*220;
      this.y = this.targetY + sin(this.moveTimer*0.018)*20;
    } else if (this.waveKey===20) {
      // Abraham: figure-8 drift
      this.x = width/2 + sin(this.moveTimer*0.018)*180;
      this.y = this.targetY + sin(this.moveTimer*0.036)*35;
    } else if (this.waveKey===25) {
      // Filjoy: aggressive charge + retreat
      this.x += sin(this.moveTimer*0.025)*(3+this.phase);
      this.y = this.targetY + sin(this.moveTimer*0.02)*50;
    } else {
      // Zapanta: multi-axis chaos
      this.x = width/2 + sin(this.moveTimer*0.02)*200 + sin(this.moveTimer*0.05)*60;
      this.y = this.targetY + sin(this.moveTimer*0.015)*40;
    }
    this.x = constrain(this.x, this.w/2, width-this.w/2);

    this.shootTimer--;
    // Fire rate scales with phase AND level
    let rate = max(8, 60 - this.phase*15 - level*1.5);
    if (this.shootTimer<=0) {
      this.shootTimer=rate;
      this.firePattern();
    }
  }

  // ── Each boss fires a UNIQUE pattern ──
  firePattern() {
    let spd = (3+level*0.18+this.phase*0.7)*(1+(level-1)*0.06);

    if (this.waveKey===5) {
      // MICHAEL — disciplined V-formations
      if (this.phase===1) {
        // 3-shot V
        for (let i=-1;i<=1;i++)
          enemyBullets.push(new EnemyBullet(this.x+i*25, this.y+this.h/2, i*1.2, spd));
      } else {
        // Double V
        for (let i=-2;i<=2;i++)
          enemyBullets.push(new EnemyBullet(this.x+i*20, this.y+this.h/2, i*1.0, spd));
      }

    } else if (this.waveKey===10) {
      // JUSTIN — scattered burst, unpredictable angles
      let count = 5 + this.phase*3 + floor(level*0.3);
      for (let i=0;i<count;i++) {
        let ang = random(PI*0.15, PI*0.85);
        enemyBullets.push(new EnemyBullet(this.x, this.y+this.h/2,
          cos(ang)*spd*(0.7+random(0.6)), sin(ang)*spd*(0.7+random(0.6))));
      }

    } else if (this.waveKey===15) {
      // ROMEL — slow heavy cannonballs in fixed radial bursts
      let count = 6 + this.phase*2 + floor(level*0.4);
      for (let i=0;i<count;i++) {
        let ang = (TWO_PI/count)*i;
        // Only fire bullets going generally downward (vy > 0)
        let vy = abs(sin(ang))*spd + 0.5;
        let vx = cos(ang)*spd*0.8;
        enemyBullets.push(new EnemyBullet(this.x, this.y+this.h/2, vx, vy));
      }

    } else if (this.waveKey===20) {
      // ABRAHAM — rotating spiral
      let count = 6+this.phase*3+floor(level*0.35);
      for (let i=0;i<count;i++) {
        let ang=(TWO_PI/count)*i + this.animT*(1+this.phase*0.5);
        enemyBullets.push(new EnemyBullet(this.x, this.y+this.h/2,
          cos(ang)*spd, sin(ang)*spd+0.4));
      }
      if (this.phase>=2) {
        // Side bursts
        enemyBullets.push(new EnemyBullet(this.x-this.w/2, this.y, -spd, 0.8));
        enemyBullets.push(new EnemyBullet(this.x+this.w/2, this.y,  spd, 0.8));
      }

    } else if (this.waveKey===25) {
      // FILJOY — tri-ring chaos
      let rings=[5,9,13];
      let useRings=this.phase;
      for (let r=0;r<useRings;r++) {
        let count=rings[r]+floor(level*0.25);
        for (let i=0;i<count;i++) {
          let ang=(TWO_PI/count)*i+this.animT*(r+1)*1.2;
          let s=spd+r*0.7;
          enemyBullets.push(new EnemyBullet(this.x, this.y+this.h/2,
            cos(ang)*s, sin(ang)*s+0.3));
        }
      }

    } else {
      // ZAPANTA — quad-ring + side cannons, maximally overwhelming
      let rings=[6,10,14,18];
      let useRings=this.phase===3?4:this.phase===2?3:2;
      for (let r=0;r<useRings;r++) {
        let count=rings[r]+floor(level*0.3);
        for (let i=0;i<count;i++) {
          let ang=(TWO_PI/count)*i+this.animT*(r+1)*1.5;
          let s=spd+r*0.6;
          enemyBullets.push(new EnemyBullet(this.x, this.y+this.h/2,
            cos(ang)*s, sin(ang)*s+0.3));
        }
      }
      if (this.phase>=2) {
        enemyBullets.push(new EnemyBullet(this.x-this.w/2, this.y, -spd, 1.2));
        enemyBullets.push(new EnemyBullet(this.x+this.w/2, this.y,  spd, 1.2));
      }
      if (this.phase===3) {
        // Diagonal downward missiles
        enemyBullets.push(new EnemyBullet(this.x-40, this.y+this.h/2, -1.5, spd*1.1));
        enemyBullets.push(new EnemyBullet(this.x+40, this.y+this.h/2,  1.5, spd*1.1));
      }
    }
  }

  // ── Each boss has a UNIQUE VISUAL design, all drawn inside push/translate ──
  draw() {
    push();
    translate(this.x, this.y);

    let pulse = sin(this.animT*2)*5;
    let hpRatio = this.hp/this.maxHp;
    let enrageGlow = this.enraged ? (100+sin(frameCount*0.3)*80) : 0;

    // ── COMMANDER MICHAEL (wave 5) ──
    // Blue military gunship: rectangular body, armored wings, visor
    if (this.waveKey===5) {
      // Outer glow
      fill(0,140,255,25+enrageGlow*0.2); noStroke();
      ellipse(0,0,this.w+40+pulse,this.h+40+pulse);

      // Wing panels
      fill(0,80,180); stroke(100,200,255,120); strokeWeight(1.5);
      rect(-this.w/2-18,-10,22,28,3);
      rect(this.w/2-4,-10,22,28,3);

      // Main hull — flat rectangular command ship
      fill(20,100,200); stroke(150,220,255,180); strokeWeight(2);
      rect(-this.w/2,-this.h/2,this.w,this.h,8);

      // Armor stripe across middle
      fill(0,60,140); noStroke();
      rect(-this.w/2,-8,this.w,16);

      // Visor / cockpit window
      fill(0,220,255,200); stroke(180,240,255); strokeWeight(1);
      rect(-28,-this.h/2+10,56,18,4);
      // Visor glare
      fill(255,255,255,60); noStroke();
      rect(-22,-this.h/2+13,18,6,2);

      // Eyes (headlights)
      fill(0,255,200,220); noStroke();
      ellipse(-22,6,14,10);
      ellipse(22,6,14,10);
      fill(0,180,140); ellipse(-22,6,7,5); ellipse(22,6,7,5);

      // Cannon barrels
      fill(0,60,140); stroke(100,180,255,100); strokeWeight(1);
      rect(-8,this.h/2-2,16,18,3);
      rect(-28,this.h/2+2,12,14,2);
      rect(16,this.h/2+2,12,14,2);

    // ── PHANTOM JUSTIN (wave 10) ──
    // Red triangular stealth fighter, sharp & angular
    } else if (this.waveKey===10) {
      // Eerie red glow
      fill(255,20,50,20+enrageGlow*0.2); noStroke();
      ellipse(0,0,this.w+50+pulse*2,this.h+50+pulse*2);

      // Swept wings
      fill(150,10,30); stroke(255,60,80,140); strokeWeight(1.5);
      beginShape();
      vertex(0,-this.h/2-10);
      vertex(-this.w/2-20,this.h/2);
      vertex(-this.w/3,this.h/4);
      vertex(0,this.h/3);
      vertex(this.w/3,this.h/4);
      vertex(this.w/2+20,this.h/2);
      endShape(CLOSE);

      // Core fuselage
      fill(210,20,50); stroke(255,100,120,180); strokeWeight(2);
      beginShape();
      vertex(0,-this.h/2-10);
      vertex(-this.w/4,0);
      vertex(-this.w/5,this.h/2);
      vertex(this.w/5,this.h/2);
      vertex(this.w/4,0);
      endShape(CLOSE);

      // Glowing cockpit slit
      fill(255,50,80,200); noStroke();
      ellipse(0,-this.h/4,30,8);
      fill(255,150,160,160); ellipse(0,-this.h/4,14,4);

      // Eye lenses (sinister)
      fill(255,0,30,240); stroke(255,80,80,100); strokeWeight(1);
      ellipse(-14,4,12,8);
      ellipse(14,4,12,8);
      // Pupils
      fill(80,0,0); noStroke();
      ellipse(-14,4,5,5); ellipse(14,4,5,5);

      // Wing missiles
      fill(100,10,20); noStroke();
      rect(-this.w/2-14,this.h/4-4,10,16,2);
      rect(this.w/2+4,this.h/4-4,10,16,2);

    // ── TITAN ROMEL (wave 15) ──
    // Purple brutalist fortress: massive hexagonal body, thick plating
    } else if (this.waveKey===15) {
      // Heavy purple atmosphere
      fill(140,20,255,22+enrageGlow*0.2); noStroke();
      ellipse(0,0,this.w+60+pulse,this.h+60+pulse);

      // Thick outer plating ring
      fill(90,10,180); stroke(200,100,255,140); strokeWeight(2.5);
      beginShape();
      for (let a=0;a<6;a++){
        let ang=(TWO_PI/6)*a-PI/6;
        vertex(cos(ang)*(this.w/2+8),sin(ang)*(this.h/2+8));
      }
      endShape(CLOSE);

      // Inner hex body
      fill(120,30,220); stroke(220,150,255,180); strokeWeight(2);
      beginShape();
      for (let a=0;a<6;a++){
        let ang=(TWO_PI/6)*a-PI/6;
        vertex(cos(ang)*this.w/2,sin(ang)*this.h/2);
      }
      endShape(CLOSE);

      // Armor bolts / panel lines
      fill(80,10,160); noStroke();
      for (let a=0;a<6;a++){
        let ang=(TWO_PI/6)*a-PI/6;
        ellipse(cos(ang)*this.w/2*0.72,sin(ang)*this.h/2*0.72,8,8);
      }

      // Eye block — wide rectangular visor
      fill(180,80,255,200); stroke(220,180,255); strokeWeight(1);
      rect(-36,-14,72,20,5);
      // Visor segments
      fill(255,200,255,160); noStroke();
      for (let i=-2;i<=2;i++) rect(i*13-4,-11,8,14,2);

      // Bottom cannon mount
      fill(80,10,160); stroke(180,80,255,120); strokeWeight(1);
      rect(-20,this.h/2-4,40,16,4);
      fill(200,100,255,200); noStroke(); ellipse(0,this.h/2+6,14,10);

      // Shoulder cannons
      fill(90,10,180); stroke(200,80,255,100); strokeWeight(1);
      rect(-this.w/2-12,-8,14,20,3);
      rect(this.w/2-2,-8,14,20,3);

    // ── OVERLORD ABRAHAM (wave 20) ──
    // Green bio-organic command ship: hexagonal overlapping plates, organic glow
    } else if (this.waveKey===20) {
      // Green plasma field
      fill(0,200,80,18+enrageGlow*0.2); noStroke();
      ellipse(0,0,this.w+70+pulse,this.h+70+pulse);
      fill(0,150,60,15); ellipse(0,0,this.w+40+pulse,this.h+40+pulse);

      // Bio-organic outer ring (rotating plates)
      push();
      rotate(this.animT*0.3);
      fill(0,120,50); stroke(0,255,120,100); strokeWeight(1.5);
      for (let a=0;a<6;a++) {
        push(); rotate((TWO_PI/6)*a);
        rect(-10,-this.h/2-22,20,18,3);
        pop();
      }
      pop();

      // Main hull — double-hex
      fill(0,160,60); stroke(0,255,100,180); strokeWeight(2);
      beginShape();
      for (let a=0;a<6;a++){
        let ang=(TWO_PI/6)*a;
        vertex(cos(ang)*this.w/2,sin(ang)*this.h/2);
      }
      endShape(CLOSE);

      // Inner glow hex
      fill(0,200,80,120); noStroke();
      beginShape();
      for (let a=0;a<6;a++){
        let ang=(TWO_PI/6)*a;
        vertex(cos(ang)*this.w/2*0.55,sin(ang)*this.h/2*0.55);
      }
      endShape(CLOSE);

      // Eyes — compound (3 per side)
      let eyePositions=[[-24,-8],[-12,-8],[0,-8],[12,-8],[24,-8]];
      for (let ep of eyePositions) {
        fill(0,255,100,220); stroke(100,255,150,100); strokeWeight(1);
        ellipse(ep[0],ep[1],10,10);
        fill(0,80,30); noStroke(); ellipse(ep[0],ep[1],4,4);
        fill(200,255,200,150); ellipse(ep[0]-2,ep[1]-2,2,2);
      }

      // Bio mandibles at bottom
      fill(0,100,40); stroke(0,220,100,100); strokeWeight(1);
      triangle(-40,this.h/2-10,-55,this.h/2+20,-28,this.h/2);
      triangle(40,this.h/2-10,55,this.h/2+20,28,this.h/2);

    // ── CAPTAIN FILJOY (wave 25) ──
    // Gold solar destroyer: radiant sun-like disc with spike array
    } else if (this.waveKey===25) {
      // Golden corona glow
      fill(255,200,0,20+enrageGlow*0.2); noStroke();
      ellipse(0,0,this.w+80+pulse*2,this.h+80+pulse*2);
      fill(255,160,0,15); ellipse(0,0,this.w+50+pulse,this.h+50+pulse);

      // Rotating spike array
      push();
      rotate(this.animT*0.4);
      fill(200,130,0); stroke(255,220,50,120); strokeWeight(1);
      for (let a=0;a<12;a++) {
        push(); rotate((TWO_PI/12)*a);
        triangle(-5,-this.w/2-4,5,-this.w/2-4,0,-this.w/2-22);
        pop();
      }
      pop();

      // Outer ring
      fill(220,160,0); stroke(255,230,80,200); strokeWeight(2.5);
      ellipse(0,0,this.w,this.h*0.75);

      // Inner disc
      fill(255,200,30); stroke(255,240,100,160); strokeWeight(2);
      ellipse(0,0,this.w*0.65,this.h*0.5);

      // Core reactor
      let coreGlow=200+sin(frameCount*0.3)*55;
      fill(255,240,80,coreGlow); noStroke();
      ellipse(0,0,this.w*0.32,this.h*0.24);
      fill(255,255,180); ellipse(0,0,this.w*0.14,this.h*0.1);

      // Eyes — wide apart on the ring
      fill(255,80,0,230); stroke(255,160,0,120); strokeWeight(1);
      ellipse(-this.w*0.22,0,18,14);
      ellipse( this.w*0.22,0,18,14);
      fill(120,30,0); noStroke();
      ellipse(-this.w*0.22,0,7,7); ellipse(this.w*0.22,0,7,7);
      // Anger brows
      stroke(255,100,0,180); strokeWeight(2.5);
      line(-this.w*0.27,-8,-this.w*0.17,-5);
      line( this.w*0.17,-8, this.w*0.27,-5);

      // Bottom arc cannon
      noFill(); stroke(255,200,50,150); strokeWeight(3);
      arc(0,10,60,30,0,PI);
      fill(255,180,0); noStroke(); ellipse(-30,10,8,8); ellipse(30,10,8,8);

    // ── SUPREME COMMANDER ZAPANTA (wave 30) ──
    // Dark crimson dreadnought: overwhelming, multi-component, intimidating
    } else {
      // Massive red void field
      fill(200,10,50,15+enrageGlow*0.25); noStroke();
      ellipse(0,0,this.w+100+pulse*3,this.h+100+pulse*3);
      fill(255,30,80,10); ellipse(0,0,this.w+60+pulse,this.h+60+pulse);

      // Outer rotating energy rings
      push();
      rotate(this.animT*0.25);
      stroke(255,50,80,80+enrageGlow*0.5); strokeWeight(2); noFill();
      ellipse(0,0,this.w+30,this.h+30);
      for (let a=0;a<8;a++) {
        push(); rotate((TWO_PI/8)*a);
        fill(180,10,40); noStroke();
        ellipse(0,-(this.h/2+18),8,14);
        pop();
      }
      pop();

      // Extended side wings — prongs
      fill(120,5,30); stroke(255,40,70,120); strokeWeight(1.5);
      // Left prong
      beginShape();
      vertex(-this.w/2,0); vertex(-this.w/2-30,-10);
      vertex(-this.w/2-45,this.h/4); vertex(-this.w/2-20,this.h/2);
      vertex(-this.w/2,this.h/3);
      endShape(CLOSE);
      // Right prong
      beginShape();
      vertex(this.w/2,0); vertex(this.w/2+30,-10);
      vertex(this.w/2+45,this.h/4); vertex(this.w/2+20,this.h/2);
      vertex(this.w/2,this.h/3);
      endShape(CLOSE);

      // Main hull
      fill(160,10,40); stroke(255,60,90,200); strokeWeight(2.5);
      beginShape();
      vertex(0,-this.h/2-16);
      vertex(-this.w*0.38,-this.h/4);
      vertex(-this.w/2,0);
      vertex(-this.w*0.42,this.h/2);
      vertex(-this.w*0.18,this.h/2+12);
      vertex(this.w*0.18,this.h/2+12);
      vertex(this.w*0.42,this.h/2);
      vertex(this.w/2,0);
      vertex(this.w*0.38,-this.h/4);
      endShape(CLOSE);

      // Internal armor striping
      fill(100,5,25); noStroke();
      rect(-this.w/2+8,-8,this.w-16,16,4);
      rect(-this.w/2+18,this.h/4-6,this.w-36,12,4);

      // Main visor — wide sinister slit
      fill(255,20,50,200+sin(frameCount*0.2)*55);
      stroke(255,80,100,100); strokeWeight(1);
      rect(-this.w/2+14,-this.h/4-4,this.w-28,12,6);
      // Visor scan line
      let scanX=map(sin(frameCount*0.05),-1,1,-this.w/2+18,this.w/2-22);
      fill(255,100,120,200); noStroke(); rect(scanX,-this.h/4-2,12,8,2);

      // Two large main eyes
      fill(255,30,60,240); stroke(255,80,90,120); strokeWeight(1);
      ellipse(-this.w/4,8,22,16);
      ellipse( this.w/4,8,22,16);
      // Pupils — large and menacing
      fill(60,0,15); noStroke();
      ellipse(-this.w/4,8,9,9); ellipse(this.w/4,8,9,9);
      // Eye highlight
      fill(255,150,160,200);
      ellipse(-this.w/4-3,5,4,3); ellipse(this.w/4-3,5,4,3);

      // Brow ridge — angry
      fill(130,10,30); stroke(255,50,70,100); strokeWeight(2);
      line(-this.w/4-14,0,-this.w/4+14,4);
      line( this.w/4-14,4, this.w/4+14,0);

      // Core power reactor
      let rA=200+sin(frameCount*0.28)*55;
      fill(255,80,50,rA); noStroke(); ellipse(0,0,44+pulse,32+pulse);
      fill(255,180,100); ellipse(0,0,22,16);
      fill(255,240,200); ellipse(0,0,9,7);

      // Bottom quad-cannons
      fill(100,5,25); stroke(255,40,60,100); strokeWeight(1);
      rect(-50,this.h/2+6,22,18,3);
      rect(-18,this.h/2+8,14,22,3);
      rect(4,this.h/2+8,14,22,3);
      rect(28,this.h/2+6,22,18,3);
    }

    // ── HP BAR (all bosses) ──
    noStroke();
    fill(40,0,0,200);
    rect(-this.w/2,-this.h/2-22,this.w,11,3);
    fill(hpRatio>0.5?color(0,230,100):hpRatio>0.25?color(255,200,0):color(255,40,40));
    rect(-this.w/2,-this.h/2-22,this.w*hpRatio,11,3);
    // HP bar shine
    fill(255,255,255,30); rect(-this.w/2,-this.h/2-22,this.w*hpRatio,4,3);

    // Boss name label
    fill(255); textAlign(CENTER,CENTER); textSize(10); textFont("monospace");
    text(this.name + "  HP: " + this.hp, 0, -this.h/2-34);

    if (this.enraged) {
      fill(255,50,50,150+sin(frameCount*0.3)*105);
      textSize(9); text("⚠ ENRAGED ⚠", 0, -this.h/2-46);
    }

    pop();
  }

  hits(blt) {
    return abs(blt.x-this.x)<this.w/2 && abs(blt.y-this.y)<this.h/2;
  }
}

// ================================================
// PARTICLE
// ================================================
class Particle {
  constructor(x,y,col){
    this.x=x; this.y=y;
    this.vx=random(-4,4); this.vy=random(-4,4);
    this.life=random(30,60); this.maxLife=this.life;
    this.size=random(3,10);
    this.col=col||color(255,150,50);
  }
  update(){this.x+=this.vx;this.y+=this.vy;this.vy+=0.1;this.life--;this.vx*=0.97;}
  draw(){
    let a=map(this.life,0,this.maxLife,0,255);
    fill(red(this.col),green(this.col),blue(this.col),a);
    noStroke(); ellipse(this.x,this.y,this.size*(this.life/this.maxLife));
  }
  isDead(){return this.life<=0;}
}

// ================================================
// POWERUP
// ================================================
class Powerup {
  constructor(x,y,forcedType){
    this.x=x; this.y=y; this.w=24; this.h=24;
    this.speed=1.5; this.active=true; this.anim=0;
    if (forcedType){this.type=forcedType;}
    else {
      let r=random();
      if      (r<0.2)  this.type="life";
      else if (r<0.38) this.type="shield";
      else if (r<0.55) this.type="double";
      else if (r<0.7)  this.type="spread";
      else if (r<0.85) this.type="triple";
      else             this.type="laser";
    }
  }
  update(){this.y+=this.speed;this.anim+=0.06;if(this.y>height+30)this.active=false;}
  draw(){
    push();translate(this.x,this.y);
    let pulse=sin(this.anim)*4;
    noStroke();textAlign(CENTER,CENTER);textFont("monospace");
    let cols={life:[255,50,100],shield:[0,200,255],double:[100,255,150],
      spread:[255,200,50],triple:[200,100,255],laser:[255,80,80]};
    let labels={life:"♥",shield:"🛡",double:"DBL",spread:"SPR",triple:"TRI",laser:"LSR"};
    let c=cols[this.type]||[255,255,255];
    fill(c[0],c[1],c[2],180+sin(this.anim)*50);
    ellipse(0,0,26+pulse,26+pulse);
    fill(this.type==="double"||this.type==="shield"?0:255);
    noStroke();textSize(this.type==="life"||this.type==="shield"?14:9);
    text(labels[this.type]||"?",0,0);
    pop();
  }
}

// ================================================
// STARS
// ================================================
function createStars(){
  stars=[];
  for(let i=0;i<140;i++){
    stars.push({x:random(width),y:random(height),size:random(1,3.5),
      speed:random(0.3,1.0),brightness:random(120,255)});
  }
}
function drawStars(){
  noStroke();
  for(let s of stars){
    s.y+=s.speed*(1+wave*0.008);
    if(s.y>height){s.y=0;s.x=random(width);}
    fill(s.brightness,s.brightness,s.brightness,200);
    ellipse(s.x,s.y,s.size,s.size);
  }
}
function spawnExplosion(x,y,col,count){
  count=count||18;
  for(let i=0;i<count;i++) particles.push(new Particle(x,y,col));
}

// ================================================
// HUD
// ================================================
function drawHUD(){
  fill(0,0,0,150);noStroke();rect(0,0,width,58);
  textFont("monospace");
  fill(0,255,200);textSize(12);textAlign(LEFT,TOP);
  text("SCORE: "+score,10,6);
  text("HI:    "+highScore,10,22);

  let shieldY=42;
  if(shield>0||novaActive){
    fill(0,80,120);noStroke();rect(10,shieldY,100,7,3);
    fill(0,200,255);rect(10,shieldY,100*(shield/shieldMax),7,3);
    fill(0,200,255);textSize(9);textAlign(LEFT,TOP);
    text("SHIELD "+shield+"/"+shieldMax,116,shieldY);
  }

  textAlign(CENTER,TOP);
  fill(255,80,120);textSize(15);text("♥".repeat(lives),width/2,6);
  fill(255,220,50);textSize(11);text("LVL "+level+"  WAVE "+wave,width/2,24);

  textAlign(RIGHT,TOP);
  let wc=weaponColor();fill(wc[0],wc[1],wc[2]);textSize(11);
  text("GUN: "+currentWeapon.toUpperCase(),width-10,6);

  if(novaActive){
    let secsLeft=ceil(novaTimer/60);
    noStroke();fill(80,70,0);rect(width-110,24,100,7,3);
    fill(255,230,50);rect(width-110,24,100*(novaTimer/NOVA_DURATION),7,3);
    fill(255,240,80);textSize(9);textAlign(RIGHT,TOP);
    text("NOVA "+secsLeft+"s",width-10,34);
  }

  fill(120);textSize(9);textAlign(CENTER);
  text("WASD/Arrows—Move | P—Pause | D—Demo(W25 Boss)",width/2,height-12);
}

// ================================================
// MESSAGES
// ================================================
function showMessage(msg){waveMessage=msg;waveMessageTimer=180;}
function drawWaveMessage(){
  if(waveMessageTimer<=0)return;
  let a=waveMessageTimer>30?255:map(waveMessageTimer,0,30,0,255);
  textAlign(CENTER,CENTER);textFont("monospace");
  fill(255,220,50,a*0.35);textSize(28);text(waveMessage,width/2+2,height/2+2);
  fill(255,220,50,a);textSize(26);text(waveMessage,width/2,height/2);
  waveMessageTimer--;
}

// ================================================
// BOSS INTRO
// ================================================
function drawBossIntro(){
  if(!bossIntroActive)return;
  bossIntroTimer--;
  if(bossIntroTimer<=0){
    bossIntroActive=false;
    boss=new Boss();
    playSound("boss");
    return;
  }

  let prog=1-(bossIntroTimer/BOSS_INTRO_DURATION);
  let flashA=sin(frameCount*0.3)*100+120;
  fill(0,0,0,185);noStroke();rect(0,0,width,height);

  let wk=((wave-1)%30)+1;
  let isFinal=(wk===30);

  if(isFinal){
    let bA=sin(frameCount*0.25)*80+100;
    stroke(255,20,80,bA);strokeWeight(8);noFill();
    rect(4,4,width-8,height-8,4);
    stroke(255,80,40,bA*0.4);strokeWeight(16);
    rect(2,2,width-4,height-4,6);
  } else {
    stroke(255,200,50,flashA*0.5);strokeWeight(4);noFill();
    rect(5,5,width-10,height-10,4);
  }

  textAlign(CENTER,CENTER);textFont("monospace");
  let warnA=150+sin(frameCount*0.4)*105;
  fill(255,220,50,warnA);textSize(18);
  text("⚠  W A R N I N G  ⚠",width/2,height/2-90);

  let nameCol=isFinal?color(255,60,100):color(255,120,50);
  let nameA=180+sin(frameCount*0.2)*75;
  fill(red(nameCol),green(nameCol),blue(nameCol),nameA*0.3);
  textSize(isFinal?26:22);
  text(bossIntroName,width/2+2,height/2+2);
  fill(red(nameCol),green(nameCol),blue(nameCol),nameA);
  text(bossIntroName,width/2,height/2);

  fill(200,200,255,160+sin(frameCount*0.15)*60);textSize(12);
  if(isFinal){
    text("⚠ FINAL DEFENSE PROTOCOL ACTIVATED ⚠",width/2,height/2+52);
    text("SUPREME COMMANDER APPROACHES",width/2,height/2+70);
  } else {
    text("APPROACHING — PREPARE FOR COMBAT",width/2,height/2+52);
  }

  fill(50,50,80);noStroke();rect(width/2-100,height/2+106,200,6,3);
  fill(isFinal?color(255,60,100):color(255,200,50));
  rect(width/2-100,height/2+106,200*prog,6,3);
}

// ================================================
// LEVEL COMPLETE
// ================================================
function drawLevelComplete(){
  if(!levelCompleteActive)return;
  levelCompleteTimer--;
  if(levelCompleteTimer<=0){
    levelCompleteActive=false;
    level++;wave=1;
    if(level>highestLevel)highestLevel=level;
    showMessage("LEVEL "+level+" — ENGAGE!");
    startWave();return;
  }
  let prog=1-(levelCompleteTimer/LEVEL_COMPLETE_DURATION);
  fill(0,0,0,200);noStroke();rect(0,0,width,height);

  for(let i=0;i<12;i++){
    let ang=(TWO_PI/12)*i+frameCount*0.02;
    let r=100+sin(frameCount*0.1+i)*20;
    let sx=width/2+cos(ang)*r; let sy=height/2-20+sin(ang)*r*0.5;
    fill(255,220,50,100+sin(frameCount*0.15+i*0.5)*80);noStroke();
    ellipse(sx,sy,5,5);
  }

  textAlign(CENTER,CENTER);textFont("monospace");
  fill(0,255,150,40);textSize(46);text("LEVEL COMPLETE",width/2+2,height/2-70+2);
  fill(0,255,150,220+sin(frameCount*0.15)*35);textSize(44);
  text("LEVEL COMPLETE",width/2,height/2-70);
  fill(255,220,50);textSize(14);text("LEVEL "+level+" CLEARED",width/2,height/2-20);
  fill(200,220,255);textSize(12);
  text("NEXT LEVEL: "+(level+1)+" — DIFFICULTY INCREASING",width/2,height/2+14);
  fill(20,30,50);noStroke();rect(width/2-120,height/2+48,240,8,4);
  fill(0,255,150);rect(width/2-120,height/2+48,240*prog,8,4);
  fill(150,180,255);textSize(10);text("Preparing next level...",width/2,height/2+76);
}

// ================================================
// WAVE SYSTEM — 30 waves per level
// Boss waves: 5,10,15,20,25,30
// ================================================
function isBossWaveNum(w){
  let wk=((w-1)%30)+1;
  return wk===5||wk===10||wk===15||wk===20||wk===25||wk===30;
}

function startWave(){
  waveInProgress=true;betweenWaves=false;bossIntroActive=false;
  enemiesThisWave=0;enemiesKilled=0;boss=null;enemyBullets=[];
  bossWave=isBossWaveNum(wave);

  let diffBonus=(level-1)*4;
  enemiesToSpawn=bossWave?0:(12+wave*2+diffBonus);

  if(bossWave){
    let wk=((wave-1)%30)+1;
    bossIntroName="⚠ "+(BOSS_NAMES[wk]||"BOSS")+" APPROACHING ⚠";
    bossIntroActive=true;bossIntroTimer=BOSS_INTRO_DURATION;
    showMessage("WAVE "+wave+" — BOSS INCOMING");
  } else {
    showMessage("LVL "+level+"  WAVE "+wave);
  }
  if(wave>highestWave)highestWave=wave;
}

function spawnWaveEnemies(){
  if(bossWave)return;
  let spawnInterval=max(6,45-wave-(level-1)*3);
  if(enemiesThisWave<enemiesToSpawn&&frameCount%spawnInterval===0){
    if(wave>=5&&random()<0.35){
      let rowY=random(-130,-40);
      let count=floor(random(3,6));
      let sx=random(40,width-40-count*52);
      for(let i=0;i<count&&enemiesThisWave<enemiesToSpawn;i++){
        let e=new Enemy(floor(random(6)));
        e.x=sx+i*56;e.y=rowY;
        enemies.push(e);enemiesThisWave++;
      }
    } else {enemies.push(new Enemy());enemiesThisWave++;}
  }
}

function advanceWave(){
  let wk=((wave-1)%30)+1;
  if(wk===30){
    waveInProgress=false;betweenWaves=false;
    levelCompleteActive=true;levelCompleteTimer=LEVEL_COMPLETE_DURATION;
    playSound("levelup");
    enemies=[];enemyBullets=[];powerups=[];
  } else {
    wave++;waveTimer=0;betweenWaves=true;
    setTimeout(()=>{startWave();},2000);
  }
}

// ================================================
// SCREENS
// ================================================
function drawStartScreen(){
  background(5,5,20);drawStars();
  textAlign(CENTER,CENTER);textFont("monospace");

  fill(255,80,120,50);textSize(34);text("PROJECT NOVA",width/2+2,height/2-200+2);
  fill(255,80,120);textSize(32);text("PROJECT NOVA",width/2,height/2-200);
  fill(0,220,255,50);textSize(24);text("LAST DEFENSE",width/2+2,height/2-165+2);
  fill(0,220,255);textSize(22);text("LAST DEFENSE",width/2,height/2-165);
  fill(180,180,220);textSize(10);text("CS ELECTIVE 4 — GRAPHIC DESIGN",width/2,height/2-142);

  fill(160,200,255);textSize(11);
  text("Humanity's final fleet has fallen.",width/2,height/2-120);
  text("Defeat the corrupted commanders and survive the endless invasion.",width/2,height/2-104);

  if(highScore>0){fill(255,220,50);textSize(12);text("HIGH SCORE: "+highScore,width/2,height/2-84);}

  fill(255,220,50);textSize(12);text("SELECT FIRE MODE:",width/2,height/2-62);
  let modes=["auto","mouse","spacebar"];
  let labels=["AUTO FIRE","MOUSE CLICK","SPACEBAR"];
  let cols=[[0,255,150],[0,180,255],[255,150,50]];
  for(let i=0;i<3;i++){
    let bx=width/2-162+i*162,by=height/2-34;
    let sel=fireMode===modes[i];
    fill(sel?cols[i][0]:25,sel?cols[i][1]:25,sel?cols[i][2]:55,sel?210:180);
    stroke(cols[i][0],cols[i][1],cols[i][2]);strokeWeight(sel?2:1);
    rect(bx-56,by-14,112,28,6);
    fill(sel?0:cols[i][0],sel?0:cols[i][1],sel?0:cols[i][2]);
    noStroke();textSize(11);text(labels[i],bx,by);
  }

  fill(150,150,200);textSize(11);noStroke();
  text("WASD/Arrows—Move  |  P—Pause  |  D—Demo skip",width/2,height/2+8);

  fill(255);textSize(11);textAlign(LEFT,CENTER);
  let ex=width/2-180;
  fill(255,80,80);    text("● Saucer +10",  ex,     height/2+28);
  fill(255,200,50);   text("◆ Diamond +20", ex+110, height/2+28);
  fill(180,50,255);   text("⬡ Tank +30",    ex+230, height/2+28);
  fill(50,220,180);   text("▲ Stealth +25", ex,     height/2+46);
  fill(255,120,30);   text("⬡ Octagon +35", ex+110, height/2+46);
  fill(200,50,255);   text("● Swarm +15",   ex+230, height/2+46);
  fill(255,80,0);     text("▬ Bomber +40",  ex,     height/2+64);
  fill(80,200,255);   text("✦ Spinner +45", ex+110, height/2+64);

  textAlign(CENTER,CENTER);
  fill(255,100,130);textSize(11);text("BOSS ROSTER",width/2,height/2+90);
  fill(180,180,220);textSize(9);
  text("W5: COMMANDER MICHAEL  |  W10: PHANTOM JUSTIN  |  W15: TITAN ROMEL",width/2,height/2+106);
  text("W20: OVERLORD ABRAHAM  |  W25: CAPTAIN FILJOY  |  W30: SUPREME COMMANDER ZAPANTA",width/2,height/2+120);

  fill(100,255,150);textSize(10);
  text("DBL  SPR  TRI  LSR — permanent weapon pickups",width/2,height/2+138);
  fill(255,240,80);
  text("NOV — boss-exclusive, 120s then reverts",width/2,height/2+152);
  fill(100,140,200);textSize(9);
  text("Developed By: Michael  Justin  Romel  Abraham  Filjoy",width/2,height/2+170);

  if(frameCount%60<35){fill(0,255,150);textSize(18);noStroke();text("PRESS ENTER TO START",width/2,height/2+194);}
}

function drawPauseScreen(){
  fill(0,0,0,175);noStroke();rect(0,0,width,height);
  textAlign(CENTER,CENTER);textFont("monospace");
  fill(0,230,255,80);textSize(58);text("PAUSED",width/2+3,height/2-110+3);
  fill(0,230,255);textSize(56);text("PAUSED",width/2,height/2-110);

  let rH=mouseX>width/2-90&&mouseX<width/2+90&&mouseY>height/2-40&&mouseY<height/2+4;
  fill(rH?color(0,255,150):color(20,60,40));stroke(0,255,150);strokeWeight(1.5);
  rect(width/2-90,height/2-40,180,44,8);
  fill(rH?0:color(0,255,150));noStroke();textSize(16);text("▶  RESUME  (P)",width/2,height/2-18);

  let rS=mouseX>width/2-90&&mouseX<width/2+90&&mouseY>height/2+18&&mouseY<height/2+62;
  fill(rS?color(255,180,50):color(60,40,0));stroke(255,180,50);strokeWeight(1.5);
  rect(width/2-90,height/2+18,180,44,8);
  fill(rS?0:color(255,180,50));noStroke();textSize(16);text("↺  RESTART",width/2,height/2+40);

  let rE=mouseX>width/2-90&&mouseX<width/2+90&&mouseY>height/2+76&&mouseY<height/2+120;
  fill(rE?color(255,80,80):color(60,20,20));stroke(255,80,80);strokeWeight(1.5);
  rect(width/2-90,height/2+76,180,44,8);
  fill(rE?0:color(255,80,80));noStroke();textSize(16);text("⏏  EXIT TO MENU",width/2,height/2+98);
}

function drawGameOverScreen(){
  background(5,5,20);drawStars();
  textAlign(CENTER,CENTER);textFont("monospace");
  fill(255,50,50,60);textSize(58);text("GAME OVER",width/2+3,height/2-130+3);
  fill(255,70,70);textSize(56);text("GAME OVER",width/2,height/2-130);
  fill(255);textSize(14);
  text("FINAL SCORE:     "+score,    width/2,height/2-50);
  text("HIGH SCORE:      "+highScore,width/2,height/2-24);
  text("HIGHEST LEVEL:   "+highestLevel,width/2,height/2+4);
  text("LAST WAVE:       "+wave,     width/2,height/2+30);
  if(score>=highScore&&score>0){
    fill(255,220,50,180+sin(frameCount*0.2)*75);textSize(14);
    text("✦ NEW HIGH SCORE! ✦",width/2,height/2+60);
  }
  fill(100,140,200);textSize(10);
  text("Developed By: Michael  Justin  Romel  Abraham  Filjoy",width/2,height/2+88);
  if(frameCount%60<35){fill(0,255,150);textSize(16);text("PRESS ENTER TO PLAY AGAIN",width/2,height/2+120);}
}

// ================================================
// RESET
// ================================================
function resetGame(){
  score=0;lives=3;shield=0;wave=1;level=1;
  waveInProgress=false;betweenWaves=false;waveTimer=0;
  bossWave=false;boss=null;
  bullets=[];enemyBullets=[];enemies=[];particles=[];powerups=[];
  currentWeapon="single";shootCooldown=0;
  novaActive=false;novaTimer=0;prevWeapon="single";paused=false;
  bossIntroActive=false;bossIntroTimer=0;
  levelCompleteActive=false;levelCompleteTimer=0;
  player=new Player();createStars();startWave();
}

// ================================================
// DEMO MODE — press D to jump to Wave 25 (Filjoy)
// for a faster classroom demo of boss visuals
// ================================================
function activateDemo(){
  enemies=[];enemyBullets=[];boss=null;powerups=[];
  wave=25;
  score=max(score,5000);
  bossWave=false;waveInProgress=false;betweenWaves=false;
  bossIntroActive=false;levelCompleteActive=false;
  showMessage("DEMO: WAVE 25 — CAPTAIN FILJOY");
  setTimeout(()=>{startWave();},1500);
}

// ================================================
// SETUP
// ================================================
function setup(){
  createCanvas(620,720);
  textFont("monospace");
  createStars();
  STATE="start";
}

// ================================================
// DRAW LOOP
// ================================================
function draw(){
  if(STATE==="start"){drawStartScreen();return;}
  if(STATE==="gameover"){drawGameOverScreen();return;}
  if(paused){drawPauseScreen();return;}

  background(5,5,20);drawStars();waveTimer++;

  if(levelCompleteActive){drawLevelComplete();drawHUD();return;}

  if(bossIntroActive){
    for(let i=particles.length-1;i>=0;i--){
      particles[i].update();particles[i].draw();
      if(particles[i].isDead())particles.splice(i,1);
    }
    drawBossIntro();drawHUD();return;
  }

  if(novaActive){
    novaTimer--;
    if(novaTimer<=0){novaActive=false;currentWeapon=prevWeapon;showMessage("NOVA EXPIRED → "+prevWeapon.toUpperCase());}
  }

  if(waveInProgress&&!bossWave){
    if(enemiesThisWave>=enemiesToSpawn&&enemies.length===0&&!betweenWaves){
      betweenWaves=true;waveTimer=0;advanceWave();
    }
  }

  if(bossWave&&boss!==null&&!boss.active){
    bossWave=false;waveInProgress=false;boss=null;
    prevWeapon=novaActive?prevWeapon:currentWeapon;
    currentWeapon="nova";novaActive=true;novaTimer=NOVA_DURATION;shield=shieldMax;
    showMessage("BOSS DOWN! NOVA (120s) + SHIELD!");
    waveTimer=0;setTimeout(()=>{advanceWave();},3000);
  }

  if(waveInProgress)spawnWaveEnemies();

  player.update();player.draw();

  for(let i=bullets.length-1;i>=0;i--){
    bullets[i].update();bullets[i].draw();
    if(!bullets[i].active)bullets.splice(i,1);
  }

  for(let i=enemyBullets.length-1;i>=0;i--){
    enemyBullets[i].update();enemyBullets[i].draw();
    let eb=enemyBullets[i];
    if(eb&&eb.active&&player.invincible<=0){
      if(abs(eb.x-player.x)<player.w/2&&abs(eb.y-player.y)<player.h/2){
        eb.active=false;player.takeDamage();
      }
    }
    if(enemyBullets[i]&&!enemyBullets[i].active)enemyBullets.splice(i,1);
  }

  for(let i=enemies.length-1;i>=0;i--){
    enemies[i].update();enemies[i].draw();
    if(!enemies[i].active){enemies.splice(i,1);continue;}
    for(let j=bullets.length-1;j>=0;j--){
      if(!bullets[j]||!bullets[j].active)continue;
      let e=enemies[i];let b=bullets[j];
      if(abs(b.x-e.x)<e.w/2&&abs(b.y-e.y)<e.h/2){
        b.active=false;e.hp-=b.dmg;
        if(e.hp<=0){
          spawnExplosion(e.x,e.y,e.col);playSound("explode");score+=e.pts;
          if(score>highScore)highScore=score;
          if(random()<0.18)powerups.push(new Powerup(e.x,e.y));
          e.active=false;enemiesKilled++;
        } else {spawnExplosion(e.x,e.y,color(255,255,100),6);playSound("hit");}
      }
    }
    if(enemies[i]&&enemies[i].active&&player.invincible<=0&&player.hits(enemies[i])){
      spawnExplosion(enemies[i].x,enemies[i].y,enemies[i].col);
      enemies[i].active=false;player.takeDamage();
    }
    if(enemies[i]&&!enemies[i].active)enemies.splice(i,1);
  }

  if(boss!==null&&boss.active){
    boss.update();boss.draw();
    for(let j=bullets.length-1;j>=0;j--){
      if(!bullets[j]||!bullets[j].active)continue;
      if(boss.hits(bullets[j])){
        boss.hp-=bullets[j].dmg;
        spawnExplosion(bullets[j].x,bullets[j].y,color(255,255,100),5);
        bullets[j].active=false;
        if(boss.hp<=0){
          spawnExplosion(boss.x,boss.y,boss.col,65);
          spawnExplosion(boss.x-50,boss.y+20,color(255,150,50),30);
          spawnExplosion(boss.x+50,boss.y-20,color(255,80,80),30);
          playSound("explode");score+=boss.pts;
          if(score>highScore)highScore=score;
          boss.active=false;
        } else {playSound("hit");}
      }
    }
    if(player.invincible<=0&&abs(player.x-boss.x)<boss.w/2&&abs(player.y-boss.y)<boss.h/2)
      player.takeDamage();
  }

  for(let i=powerups.length-1;i>=0;i--){
    powerups[i].update();powerups[i].draw();
    if(player.hits(powerups[i])){
      playSound("powerup");let t=powerups[i].type;
      if(t==="life"){lives=min(lives+1,5);showMessage("EXTRA LIFE!");}
      else if(t==="shield"){shield=min(shield+shieldMax,shieldMax);showMessage("SHIELD RESTORED!");}
      else {
        if(novaActive){prevWeapon=t;showMessage(t.toUpperCase()+" QUEUED (after NOVA)");}
        else{currentWeapon=t;showMessage(t.toUpperCase()+" WEAPON!");}
      }
      powerups[i].active=false;
    }
    if(!powerups[i].active)powerups.splice(i,1);
  }

  for(let i=particles.length-1;i>=0;i--){
    particles[i].update();particles[i].draw();
    if(particles[i].isDead())particles.splice(i,1);
  }

  drawWaveMessage();drawHUD();
}

// ================================================
// INPUT
// ================================================
function mousePressed(){
  if(STATE==="start"){
    let modes=["auto","mouse","spacebar"];
    for(let i=0;i<3;i++){
      let bx=width/2-162+i*162,by=height/2-34;
      if(mouseX>bx-56&&mouseX<bx+56&&mouseY>by-14&&mouseY<by+14)fireMode=modes[i];
    }
    return;
  }
  if(paused){
    if(mouseX>width/2-90&&mouseX<width/2+90&&mouseY>height/2-40&&mouseY<height/2+4)paused=false;
    if(mouseX>width/2-90&&mouseX<width/2+90&&mouseY>height/2+18&&mouseY<height/2+62){paused=false;resetGame();STATE="playing";}
    if(mouseX>width/2-90&&mouseX<width/2+90&&mouseY>height/2+76&&mouseY<height/2+120){paused=false;STATE="start";}
    return;
  }
  if(STATE==="playing"&&fireMode==="mouse")player.shoot();
}

function keyPressed(){
  if(keyCode===ENTER&&(STATE==="start"||STATE==="gameover")){resetGame();STATE="playing";}
  if((key==="p"||key==="P")&&STATE==="playing")paused=!paused;
  if((key==="d"||key==="D")&&STATE==="playing"&&!paused)activateDemo();
  if(STATE==="start"&&keyCode===TAB){
    let modes=["auto","mouse","spacebar"];
    fireMode=modes[(modes.indexOf(fireMode)+1)%3];
  }
}