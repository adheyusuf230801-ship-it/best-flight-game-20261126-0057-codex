import { TUNING } from './config.js';
import { createRng } from './random.js';
import { Terrain } from './terrain.js';
import { Plane } from './plane.js';
import { MissionBook } from './missions.js';
import { Input } from './input.js';
import { SoundBoard } from './audio.js';
import { LAYOUT } from './render.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    const seed = new URLSearchParams(globalThis.location?.search || '').get('seed');
    this.seed = seed === null ? 20261126 : Number(seed);
    this.rng = createRng(this.seed);
    this.terrain = new Terrain(this.rng);
    const strip = this.terrain.airstrips[0];
    this.plane = new Plane(strip.x + 120, this.terrain.groundHeight(strip.x + 120) - 9);
    this.plane.landed = true;
    this.plane.airborne = false;
    this.missions = new MissionBook(this.rng, this.terrain);
    this.missions.startNext();
    this.input = new Input(canvas);
    this.sound = new SoundBoard();
    this.state = 'title';
    this.timeLeft = TUNING.sortieTime;
    this.score = 0;
    this.fuel = this.plane.fuel;
    this.message = '';
    this.messageTimer = 0;
    this.particles = [];
    this.floaters = [];
    this.shake = 0;
    this.elapsed = 0;
    this.endReason = '';
  }

  start() {
    // Rebuild from the seed so restarts reproduce the same valley and mission order.
    this.rng = createRng(this.seed);
    this.terrain = new Terrain(this.rng);
    this.missions = new MissionBook(this.rng, this.terrain);
    const strip = this.terrain.airstrips[0];
    this.plane.reset(strip.x + 120, this.terrain.groundHeight(strip.x + 120) - 9);
    Object.assign(this.plane, { vx: 62, vy: 0, throttle: 0.78, landed: true, airborne: false });
    this.missions.position = this.plane.x;
    this.missions.startNext();
    this.timeLeft = TUNING.sortieTime;
    this.score = 0;
    this.fuel = this.plane.fuel;
    this.particles = [];
    this.floaters = [];
    this.shake = 0;
    this.elapsed = 0;
    this.endReason = '';
    this.message = 'MAIL LOADED · Build speed, then hold A to climb';
    this.messageTimer = 7;
    this.state = 'playing';
    this.sound.startEngine();
  }

  finish(reason, crash = false) {
    this.state = 'over';
    this.endReason = reason;
    this.sound.stopEngine();
    if (crash) { this.sound.crash(); this.shake = 10; }
    else this.sound.levelup();
  }

  burst(x, y) {
    for (let i = 0; i < 24; i++) {
      const angle = this.rng.range(0, Math.PI * 2);
      const speed = this.rng.range(20, 100);
      this.particles.push({ x, y, vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed, life: 1, maxLife: 1 });
    }
  }

  update(dt) {
    const enter = this.input.consumePressed('Enter');
    const pause = this.input.consumePressed('KeyP');
    if (this.input.consumePressed('KeyM')) this.sound.toggleMuted();
    const clicked = this.input.consumeClicks().some(p => {
      const b = this.state === 'title' ? LAYOUT.start : this.state === 'over' ? LAYOUT.restart : null;
      return b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
    });
    if ((enter || clicked) && (this.state === 'title' || this.state === 'over')) this.start();
    if (pause && (this.state === 'playing' || this.state === 'paused')) {
      this.state = this.state === 'paused' ? 'playing' : 'paused';
      if (this.state === 'paused') this.sound.stopEngine(); else this.sound.startEngine();
    }
    // Only edges from this frame should survive; held flight keys live in keysDown.
    this.input.pressed.clear();
    dt = Math.max(0, Math.min(0.05, dt));
    if (this.state !== 'paused') this.shake *= Math.exp(-7 * dt);
    if (this.state !== 'playing') return;
    this.elapsed += dt;
    this.messageTimer = Math.max(0, this.messageTimer - dt);
    const steps = Math.max(1, Math.ceil(dt * 120));
    for (let i = 0; i < steps && this.state === 'playing'; i++) {
      const step = dt / steps;
      const previous = { x: this.plane.x, y: this.plane.y, vy: this.plane.vy };
      const events = this.plane.update(step, this.input, TUNING, this.terrain);
      const m = this.missions.current;
      const ring = m.id === 'rings' ? m.rings[m.ringsDone] : null;
      if (ring) {
        // Segment distance also counts a gate crossed between frames.
        const dx = this.plane.x - previous.x, dy = this.plane.y - previous.y;
        const t = Math.max(0, Math.min(1, ((ring.x - previous.x) * dx + (ring.y - previous.y) * dy) / (dx * dx + dy * dy || 1)));
        if (Math.hypot(previous.x + dx * t - ring.x, previous.y + dy * t - ring.y) < ring.r
          && this.missions.ringPassed(ring)) {
          this.sound.chime(); this.burst(ring.x, ring.y);
          this.floaters.push({ x: ring.x, y: ring.y, text: '+150', life: 1.8 });
          this.message = m.ringsDone === m.ringsTotal ? 'ROUTE COMPLETE · Land at Ridgeline Post' : `GATE ${m.ringsDone} CLEARED · Keep climbing`;
          this.messageTimer = 3;
        }
      }
      if (events.includes('stall')) { this.sound.alarm(); this.message = 'STALL · Lower the nose and add throttle'; this.messageTimer = 3; }
      if (events.includes('ground-hit')) {
        const strip = this.terrain.isStrip(this.plane.x);
        this.plane.touchdownVy = Math.max(0, previous.vy + TUNING.gravity * step);
        const report = this.missions.landReport(this.plane, strip);
        if (events.includes('crashed') || !report.ok || report.softness >= 2.2) {
          this.finish(events.includes('crashed') ? 'The mountains claimed this flight.' : !report.ok ? 'Touchdown outside the assigned landing zone.' : 'Hard touchdown. Bring her in a little softer.', true);
          if (report.softness >= 2.2) this.shake = 0.4;
        } else if (m.state === 'pickup') {
          m.state = 'return';
          this.sound.land();
          this.message = `PASSENGER ABOARD · Fly to ${m.targetStrip.name}`;
          this.messageTimer = 6;
          this.plane.fuel = Math.min(100, this.plane.fuel + 25);
        } else {
          this.missions.complete(); this.sound.land();
          this.floaters.push({ x: this.plane.x, y: this.plane.y - 45,
            text: `SOFT LANDING +${report.bonus}`, life: 2.2 });
          this.message = `SPECIAL DELIVERY · SOFT LANDING +${report.bonus}`;
          this.messageTimer = 6;
          this.missions.position = this.plane.x;
          this.missions.startNext();
          this.plane.fuel = Math.min(100, this.plane.fuel + 35);
          this.timeLeft += 45;
        }
      }
      if (this.plane.x < 0 || this.plane.x > this.terrain.length + 200) this.finish('You reached the edge of the valley.');
    }
    this.score = this.missions.score;
    this.fuel = this.plane.fuel;
    if (this.fuel <= 0 && this.state === 'playing') {
      this.message = 'FUEL EMPTY · Glide to the marked airstrip'; this.messageTimer = 2;
      if (this.plane.landed) this.finish('Engine out. Safely down in the valley.');
    }
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    if (!this.timeLeft && this.state === 'playing') this.finish('The last light has faded. Your shift is over.');
    for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 35 * dt; p.life -= dt; }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const p of this.floaters) { p.y -= dt * 30; p.life -= dt; }
    this.floaters = this.floaters.filter(p => p.life > 0);
  }
}
