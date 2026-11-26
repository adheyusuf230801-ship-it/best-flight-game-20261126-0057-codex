import { TERRAIN, VIEW } from './config.js';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const ease = (t) => (1 - Math.cos(Math.PI * clamp(t, 0, 1))) / 2;

export class Terrain {
  constructor(rng, length = TERRAIN.valleyLength) {
    this.length = Number.isFinite(length) && length > 0 ? length : TERRAIN.valleyLength;
    this.ridges = [];
    this.fields = [];
    this.airstrips = [];
    this.rings = [];
    const segments = Math.max(4, Math.ceil(this.length / 650));
    for (let i = 0; i <= segments; i++) {
      const broadRidge = Math.sin(i * 0.73) * TERRAIN.ridgeAmp * 0.38;
      this.ridges.push({
        x: i * this.length / segments,
        h: clamp(610 + broadRidge + rng.range(-TERRAIN.ridgeAmp * 0.65,
          TERRAIN.ridgeAmp * 0.65), 465, VIEW.h - 70),
      });
    }
    const names = ['Pine Creek', 'Orchard Bend', 'Hiker’s Rest', 'Ridgeline Post'];
    const fractions = [0.02, 0.32, 0.62, 0.91];
    const stripLength = Math.min(780, this.length * 0.075);
    for (let i = 0; i < fractions.length; i++) {
      const x = this.length * fractions[i];
      this.airstrips.push({ x, len: stripLength, name: names[i] });
    }
    // Strip elevation is sampled before flattening; the public strip shape stays small.
    this._stripHeights = this.airstrips.map((strip) => this._ridgeAt(strip.x + strip.len / 2));
    this._apron = Math.min(220, this.length * 0.018);
    this._riverPhase = rng.range(0, Math.PI * 2);
    this._riverOffset = rng.range(29, 45);
    let x = this.length * 0.015;
    while (x < this.length * 0.985) {
      const x1 = Math.min(this.length, x + rng.range(160, 420));
      this.fields.push({ x0: x, x1, crop: rng.pick(['wheat', 'meadow', 'barley', 'fallow']) });
      x = x1 + rng.range(90, 230);
    }
    // Six gates run from departure toward the final strip, always clear of the ground.
    for (let i = 0; i < 6; i++) {
      const ringX = this.length * (0.14 + i * 0.137) + rng.range(-0.012, 0.012) * this.length;
      const r = rng.range(43, 52);
      this.rings.push({
        x: ringX,
        y: clamp(this.groundHeight(ringX) - rng.range(150, 280), r + 70, VIEW.h - 230),
        r,
        id: i,
      });
    }
  }

  _ridgeAt(x) {
    const at = clamp(x, 0, this.length) / this.length * (this.ridges.length - 1);
    const index = Math.min(this.ridges.length - 2, Math.floor(at));
    const a = this.ridges[index];
    const b = this.ridges[index + 1];
    return a.h + (b.h - a.h) * ease(at - index);
  }

  groundHeight(x) {
    const worldX = clamp(x, 0, this.length);
    const natural = this._ridgeAt(worldX);
    for (let i = 0; i < this.airstrips.length; i++) {
      const strip = this.airstrips[i];
      const distance = Math.max(strip.x - worldX, worldX - strip.x - strip.len, 0);
      if (distance === 0) return this._stripHeights[i];
      if (distance < this._apron) {
        return this._stripHeights[i] + (natural - this._stripHeights[i]) * ease(distance / this._apron);
      }
    }
    return natural;
  }

  isStrip(x) {
    return this.airstrips.find((strip) => x >= strip.x && x <= strip.x + strip.len) || null;
  }

  riverY(x) {
    const at = clamp(x, 0, this.length);
    const bend = Math.sin(at / 510 + this._riverPhase) * 12
      + Math.sin(at / 1170 + this._riverPhase * 0.7) * 7;
    return this.groundHeight(at) + this._riverOffset + bend;
  }

  riverAt(x) { return this.riverY(x); }
}
