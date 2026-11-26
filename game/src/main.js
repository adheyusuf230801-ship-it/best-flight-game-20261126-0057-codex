import { Game } from './world.js';
import { drawGame } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const game = new Game(canvas);
const unlock = () => game.sound.unlock();
window.addEventListener('pointerdown', unlock, { once: true });
window.addEventListener('keydown', unlock, { once: true });
const params = new URLSearchParams(window.location.search);
if (params.has('shot')) {
  applyShot(game, params.get('shot'));
  requestAnimationFrame(() => {
    drawGame(ctx, game);
    requestAnimationFrame(() => {
      drawGame(ctx, game);
      window.__shotReady = true;
    });
  });
} else {
  let previous;
  function frame(now) {
    const dt = previous === undefined ? 0 : Math.max(0, Math.min(0.05, (now - previous) / 1000));
    previous = now;
    game.update(dt);
    drawGame(ctx, game);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
