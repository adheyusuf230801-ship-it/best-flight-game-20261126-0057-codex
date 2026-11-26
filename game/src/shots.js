import { TUNING } from './config.js';

export function applyShot(game, name) {
  game.start();
  game.sound.stopEngine();
  game.messageTimer = 0;
  game.elapsed = 12;
  const p = game.plane, book = game.missions, t = game.terrain;
  const jitter = game.rng.range(-4, 4);
  if (name === 'rings') {
    const m = book.current;
    book.ringPassed(m.rings[0]); book.ringPassed(m.rings[1]);
    const next = m.rings[2];
    Object.assign(p, { x: next.x - 410, y: next.y + 27 + jitter, vx: 203, vy: -7,
      pitch: -0.09, throttle: 0.76, fuel: 76, landed: false, airborne: true });
    game.timeLeft = 137;
    game.message = 'GATE 02 CLEARED · +150 · Follow the ridgeline'; game.messageTimer = 4;
    game.burst(p.x - 100, p.y + 8);
  } else if (name === 'landing' || name === 'end') {
    book.queue = book.queue.filter(m => m.id !== 'delivery');
    book.queue.unshift({ id: 'delivery', name: 'Special Delivery', brief: 'Carry the valley mail to the marked airstrip. Ease off the throttle and touch down gently.' });
    book.position = t.airstrips[1].x + 20;
    const m = book.startNext(), strip = m.targetStrip;
    Object.assign(p, { x: strip.x - 290, y: t.groundHeight(strip.x) - 65 + jitter,
      vx: 116, vy: 12, pitch: 0.035, throttle: 0.24, fuel: 43, landed: false, airborne: true });
    if (name === 'landing') Object.assign(p, { x: strip.x - 240, y: t.groundHeight(strip.x) - 150 + jitter });
    book.ringsHit = 6; book.score = 1400; book.deliveries = 1; book.bestLanding = 1.4;
    game.timeLeft = 69;
    game.message = `FINAL APPROACH · ${strip.name.toUpperCase()} · Keep it soft`; game.messageTimer = 4;
    if (name === 'end') {
      Object.assign(p, { x: strip.x + 220, y: t.groundHeight(strip.x) - 9, vx: 0, vy: 0,
        pitch: 0, throttle: 0, landed: true, airborne: false });
      book.complete(); book.bestLanding = 0.8;
      game.state = 'over';
      game.endReason = 'Mail delivered. Passenger home. A fine day to fly.';
      game.messageTimer = 0;
    }
  } else {
    // Bring the first gate into the departure composition without changing terrain APIs.
    const strip = t.airstrips[0];
    const ring = book.current.rings[0];
    ring.x = strip.x + strip.len + 45;
    ring.y = t.groundHeight(ring.x) - 145;
    Object.assign(p, { x: strip.x + 225, y: t.groundHeight(strip.x) - 9,
      vx: 103, vy: 0, pitch: -0.025, throttle: 0.96, fuel: 99,
      landed: true, airborne: false });
    game.timeLeft = TUNING.sortieTime;
    game.message = 'PINE CREEK · Cleared for takeoff · Hold A to climb'; game.messageTimer = 5;
  }
  game.score = book.score;
  game.fuel = p.fuel;
  if (name !== 'end') game.state = 'playing';
}
