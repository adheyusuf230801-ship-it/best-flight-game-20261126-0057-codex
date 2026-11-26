import { TUNING } from './config.js';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const TAU = Math.PI * 2;
const angleDifference = (a, b) => ((a - b + Math.PI) % TAU + TAU) % TAU - Math.PI;
const GEAR_HEIGHT = 9;

export class Plane {
  constructor(x, y) { this.reset(x, y); }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 175;
    this.vy = 0;
    this.pitch = 0;
    this.throttle = 0.58;
    this.fuel = TUNING.fuelStart;
    this.damage = 0;
    this.airborne = true;
    this.landed = false;
    this._stalling = false;
    this._crashed = false;
  }

  update(dt, input, tuning = TUNING, terrain) {
    const events = [];
    if (!Number.isFinite(dt) || dt <= 0 || this._crashed) return events;
    const keys = input?.keysDown || input?.keys || new Set();
    const held = (...codes) => codes.some((code) => keys.has(code));
    const throttleInput = Number(held('ArrowUp', 'KeyW')) - Number(held('ArrowDown', 'KeyS'));
    // Negative pitch means nose up in canvas coordinates.
    const pitchInput = Number(held('ArrowRight', 'KeyD')) - Number(held('ArrowLeft', 'KeyA'));
    const elapsed = Math.min(dt, 0.25); // Do not tunnel through mountains after a suspended tab.
    const steps = Math.ceil(elapsed / (1 / 120));
    const step = elapsed / steps;
    const emit = (event) => { if (!events.includes(event)) events.push(event); };

    for (let i = 0; i < steps; i++) {
      this.throttle = clamp(this.throttle + throttleInput * 0.42 * step, 0, 1);
      const authority = 0.3 + 0.7 * clamp(Math.hypot(this.vx, this.vy) / tuning.stallSpeed, 0, 1);
      this.pitch = clamp(this.pitch + pitchInput * 0.9 * authority * step, -0.95, 0.85);
      const requestedBurn = tuning.fuelBurn * this.throttle * step;
      const burn = Math.min(this.fuel, requestedBurn);
      const poweredFraction = this.fuel > 0
        ? (requestedBurn > 0 ? burn / requestedBurn : 1) : 0;
      this.fuel = Math.max(0, this.fuel - burn);
      const thrust = tuning.thrustMax * this.throttle * poweredFraction * (1 - this.damage * 0.004);
      const speed = Math.hypot(this.vx, this.vy);
      const flightAngle = speed > 0.1 ? Math.atan2(this.vy, this.vx) : this.pitch;
      const angleOfAttack = angleDifference(flightAngle, this.pitch);
      const stallFactor = clamp(speed / tuning.stallSpeed, 0, 1);
      const flowFactor = clamp(1 - Math.max(0, Math.abs(angleOfAttack) - 0.35) * 2.3, 0.12, 1);
      const liftCoefficient = clamp(0.3 + angleOfAttack * 2.4, -0.45, 1.25);
      const lift = tuning.liftK * speed * speed * liftCoefficient
        * stallFactor * stallFactor * flowFactor * (1 - this.damage * 0.003);
      const drag = tuning.dragK * speed * speed * (1 + Math.abs(angleOfAttack) * 1.7);
      const ax = Math.cos(this.pitch) * thrust - Math.cos(flightAngle) * drag
        + Math.sin(flightAngle) * lift;
      const ay = Math.sin(this.pitch) * thrust - Math.sin(flightAngle) * drag
        - Math.cos(flightAngle) * lift + tuning.gravity;

      if (this.landed) {
        const strip = terrain.isStrip(this.x);
        const slope = (terrain.groundHeight(this.x + 2) - terrain.groundHeight(this.x - 2)) / 4;
        // Ground roll is still driven by the engine. Pull back after building airspeed.
        if (speed > tuning.stallSpeed * 1.12 && ay < -8 && this.pitch < -0.08) {
          this.landed = false;
          this.airborne = true;
          this.vy = Math.min(-12, this.vx * slope);
          this.y = terrain.groundHeight(this.x) - GEAR_HEIGHT - 1;
        } else {
          const rollingFriction = strip ? 11 : 24;
          this.vx = Math.max(0, this.vx + ax * step - rollingFriction * step);
          this.vx = Math.min(this.vx, tuning.maxSpeed);
          this.x += this.vx * step;
          this.y = terrain.groundHeight(this.x) - GEAR_HEIGHT;
          this.vy = this.vx * slope;
          if (Math.abs(slope) > 0.42 && this.vx > 65) {
            emit('ground-hit');
            this._crash(emit);
            break;
          }
          continue;
        }
      }

      this.vx += ax * step;
      this.vy += ay * step;
      const newSpeed = Math.hypot(this.vx, this.vy);
      if (newSpeed > tuning.maxSpeed) {
        const ratio = tuning.maxSpeed / newSpeed;
        this.vx *= ratio;
        this.vy *= ratio;
      }
      this.x += this.vx * step;
      this.y += this.vy * step;

      const stalling = speed < tuning.stallSpeed || (Math.abs(angleOfAttack) > 0.55 && flowFactor < 0.6);
      if (stalling && !this._stalling) emit('stall');
      this._stalling = stalling;
      const ground = terrain.groundHeight(this.x);
      if (this.y + GEAR_HEIGHT < ground) continue;

      emit('ground-hit');
      this.y = ground - GEAR_HEIGHT;
      const slope = (terrain.groundHeight(this.x + 2) - terrain.groundHeight(this.x - 2)) / 4;
      const impact = Math.max(0, this.vy - this.vx * slope);
      const strip = terrain.isStrip(this.x);
      const safeVertical = strip ? 75 : 58;
      const safeForward = strip ? 235 : 185;
      if (impact > safeVertical || Math.abs(this.vx) > safeForward || this.vx < -12
        || Math.abs(slope) > 0.28 || Math.abs(this.pitch - Math.atan(slope)) > 0.45) {
        this._crash(emit);
        break;
      }
      if (impact > 28) {
        this.damage = clamp(this.damage + tuning.damageHard * (impact - 28) / 35, 0, 100);
      }
      if (this.damage >= 100) {
        this._crash(emit);
        break;
      }
      this.vy = this.vx * slope;
      this.airborne = false;
      this.landed = true;
      this._stalling = false;
      emit('landed-ok');
    }
    return events;
  }

  _crash(emit) {
    this.damage = 100;
    this.vx = 0;
    this.vy = 0;
    this.throttle = 0;
    this.airborne = false;
    this.landed = false;
    this._crashed = true;
    emit('crashed');
  }
}
