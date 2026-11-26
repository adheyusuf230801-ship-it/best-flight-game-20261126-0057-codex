export class SoundBoard {
  constructor() {
    this.muted = false;
    this._ctx = null;
    this._master = null;
    this._engine = null;
    this._engineWanted = false;
  }

  // Call directly from a pointer or keyboard gesture. Never opens audio on load.
  unlock() {
    try {
      if (!this._ctx || this._ctx.state === 'closed') {
        const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AudioContext) return false;
        const context = new AudioContext();
        const master = context.createGain();
        master.gain.value = this.muted ? 0 : 0.5;
        master.connect(context.destination);
        this._ctx = context;
        this._master = master;
        this._engine = null;
      }
      if (this._ctx.state === 'suspended') {
        const resume = this._ctx.resume();
        if (resume?.catch) resume.catch(() => {});
      }
      if (this._engineWanted) this._ensureEngine();
      return true;
    } catch {
      return false;
    }
  }

  setMuted(value) {
    this.muted = Boolean(value);
    try {
      if (this._ctx && this._master) {
        const now = this._ctx.currentTime;
        this._master.gain.cancelScheduledValues(now);
        this._master.gain.setTargetAtTime(this.muted ? 0 : 0.5, now, 0.015);
      }
    } catch { /* Audio is optional, including when the browser closes its context. */ }
    return this.muted;
  }

  toggleMuted() { return this.setMuted(!this.muted); }

  // Each note is [delay, frequency, duration, volume, waveform, endFrequency].
  _play(notes) {
    try {
      const ctx = this._ctx;
      if (!ctx || !this._master || ctx.state !== 'running' || this.muted) return;
      const now = ctx.currentTime;
      for (const [delay, hz, duration, volume, type = 'sine', endHz = hz] of notes) {
        const oscillator = ctx.createOscillator();
        const envelope = ctx.createGain();
        const start = now + delay;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(hz, start);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endHz), start + duration);
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(volume, start + 0.008);
        envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(envelope);
        envelope.connect(this._master);
        oscillator.onended = () => {
          try { oscillator.disconnect(); envelope.disconnect(); } catch { /* No audio required. */ }
        };
        oscillator.start(start);
        oscillator.stop(start + duration + 0.02);
      }
    } catch { /* Unsupported or blocked audio never interrupts play. */ }
  }

  click() { this._play([[0, 620, 0.045, 0.13, 'triangle', 400]]); }
  chime() { this._play([[0, 660, 0.18, 0.16], [0.09, 990, 0.28, 0.13]]); }
  alarm() { this._play([[0, 230, 0.14, 0.12, 'square'], [0.2, 185, 0.16, 0.1, 'square']]); }
  thud() { this._play([[0, 105, 0.16, 0.28, 'triangle', 32]]); }
  crash() {
    this._play([[0, 150, 0.55, 0.24, 'sawtooth', 24],
      [0.025, 89, 0.42, 0.19, 'square', 18], [0.07, 317, 0.3, 0.08, 'triangle', 35]]);
  }
  land() { this._play([[0, 130, 0.12, 0.18, 'triangle', 60], [0.14, 440, 0.24, 0.09]]); }
  levelup() {
    this._play([[0, 440, 0.2, 0.14], [0.12, 554.37, 0.2, 0.14],
      [0.24, 659.25, 0.22, 0.14], [0.38, 880, 0.5, 0.15]]);
  }

  _ensureEngine() {
    try {
      if (this._engine || !this._ctx || !this._master || this._ctx.state === 'closed') return;
      const oscillator = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.value = 52;
      gain.gain.value = 0.055;
      oscillator.connect(gain);
      gain.connect(this._master);
      oscillator.start();
      this._engine = { oscillator, gain };
    } catch { /* Screenshots and browsers without audio still work. */ }
  }

  startEngine() {
    this._engineWanted = true;
    this._ensureEngine();
  }

  stopEngine() {
    this._engineWanted = false;
    const engine = this._engine;
    this._engine = null;
    try {
      if (engine) {
        engine.oscillator.stop();
        engine.oscillator.disconnect();
        engine.gain.disconnect();
      }
    } catch { /* Stopping twice or stopping a closed context is harmless. */ }
  }
}
