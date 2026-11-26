import { VIEW } from './config.js';

const FLIGHT_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space',
]);

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.pointer = { x: VIEW.w / 2, y: VIEW.h / 2 };
    this.keys = new Set();
    this.keysDown = this.keys;
    this.pressed = new Set();
    this.pressedOnce = this.pressed;
    this._clicks = [];

    const editable = (target) => Boolean(target?.isContentEditable
      || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName || ''));
    this._move = (event) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      this.pointer.x = Math.max(0, Math.min(VIEW.w,
        (event.clientX - rect.left) * VIEW.w / rect.width));
      this.pointer.y = Math.max(0, Math.min(VIEW.h,
        (event.clientY - rect.top) * VIEW.h / rect.height));
    };
    this._down = (event) => {
      if (event.button !== 0 || event.isPrimary === false) return;
      this._move(event);
      canvas.focus({ preventScroll: true });
      this._clicks.push({ ...this.pointer });
    };
    this._keyDown = (event) => {
      if (editable(event.target)) return;
      if (FLIGHT_KEYS.has(event.code)) event.preventDefault();
      if (!this.keys.has(event.code) && !event.repeat) this.pressed.add(event.code);
      this.keys.add(event.code);
    };
    this._keyUp = (event) => { this.keys.delete(event.code); };
    this._blur = () => {
      this.keys.clear();
      this.pressed.clear();
      this._clicks.length = 0;
    };
    this._visibility = () => { if (document.hidden) this._blur(); };

    canvas.addEventListener('pointermove', this._move);
    canvas.addEventListener('pointerdown', this._down);
    window.addEventListener('keydown', this._keyDown);
    window.addEventListener('keyup', this._keyUp);
    window.addEventListener('blur', this._blur);
    document.addEventListener('visibilitychange', this._visibility);
  }

  consumeClicks() {
    const clicks = this._clicks;
    this._clicks = [];
    return clicks;
  }

  consumePressed(code) {
    return this.pressed.delete(code);
  }

  // Useful when a new game instance replaces an old one on the same canvas.
  destroy() {
    this.canvas.removeEventListener('pointermove', this._move);
    this.canvas.removeEventListener('pointerdown', this._down);
    window.removeEventListener('keydown', this._keyDown);
    window.removeEventListener('keyup', this._keyUp);
    window.removeEventListener('blur', this._blur);
    document.removeEventListener('visibilitychange', this._visibility);
    this._blur();
  }
}
