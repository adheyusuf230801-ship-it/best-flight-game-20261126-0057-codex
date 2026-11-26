import { MISSIONS, TUNING } from './config.js';

// The renderer uses the same scale for altitude and vertical speed.
export const UNITS_PER_METRE = 10;
export class MissionBook {
  constructor(rng, terrain) {
    this.rng = rng;
    this.terrain = terrain;
    this.reset();
  }

  reset() {
    this.queue = [...MISSIONS];
    this.current = null;
    this.score = 0;
    this.deliveries = 0;
    this.ringsHit = 0;
    this.position = this.terrain.airstrips[0].x;
    this.bestLanding = null;
  }

  startNext() {
    if (!this.queue.length) {
      this.queue = [...MISSIONS];
      for (let i = this.queue.length - 1; i > 0; i--) {
        const j = this.rng.int(i + 1);
        [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
      }
    }
    const template = this.queue.shift();
    const strips = this.terrain.airstrips;
    const next = strips.find(s => s.x > this.position + 100) || strips[0];
    this.current = { ...template, ringsDone: 0, ringsTotal: 0,
      targetStrip: next, state: 'active', rings: [], flag: null, pickupStrip: null };
    if (template.id === 'rings') {
      this.current.rings = this.terrain.rings.slice().sort((a, b) => a.x - b.x).slice(0, 6);
      this.current.ringsTotal = this.current.rings.length;
      const lastX = this.current.rings.at(-1)?.x ?? this.position;
      this.current.targetStrip = strips.find(s => s.x > lastX) || strips.at(-1);
    } else if (template.id === 'rescue') {
      const index = strips.indexOf(next);
      this.current.pickupStrip = next;
      this.current.flag = { x: next.x + next.len * 0.65,
        y: this.terrain.groundHeight(next.x + next.len * 0.65) };
      this.current.targetStrip = strips[(index + 1) % strips.length];
      this.current.state = 'pickup';
    }
    return this.current;
  }

  ringPassed(ring) {
    const m = this.current;
    if (!m || m.id !== 'rings' || m.state === 'complete'
      || m.rings[m.ringsDone] !== ring) return false;
    this.score += TUNING.ringBonus;
    this.ringsHit++;
    m.ringsDone++;
    return true;
  }

  landReport(plane, strip) {
    const m = this.current;
    const speed = Math.abs(plane.touchdownVy ?? plane.vy);
    const softness = speed / UNITS_PER_METRE;
    const target = m?.state === 'pickup' ? m.pickupStrip : m?.targetStrip;
    const ready = m && (m.id !== 'rings' || m.ringsDone === m.ringsTotal);
    const ok = Boolean(ready && strip && strip === target && !plane._crashed);
    const bonus = ok ? Math.round(TUNING.landBonus * (softness < 2.2 ? 1 : 0.5)) : 0;
    if (ok && (this.bestLanding === null || softness < this.bestLanding)) this.bestLanding = softness;
    return { ok, softness, bonus };
  }

  complete() {
    if (!this.current || this.current.state === 'complete') return false;
    this.current.state = 'complete';
    this.score += TUNING.landBonus;
    this.deliveries++;
    return true;
  }
}
