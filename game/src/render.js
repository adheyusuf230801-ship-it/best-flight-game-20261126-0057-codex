import { VIEW, TUNING } from './config.js';
import { UNITS_PER_METRE } from './missions.js';

export const LAYOUT = Object.freeze({
  start: Object.freeze({ x: 470, y: 528, w: 340, h: 56 }),
  restart: Object.freeze({ x: 470, y: 550, w: 340, h: 56 }),
});
const C = { ink: '#142b2f', cream: '#f4ecd4', gold: '#efc472', mint: '#afe3ce', muted: '#9cb3ad' };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function path(ctx, points, fill, stroke, width = 1) {
  ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  if (fill) { ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
function text(ctx, s, x, y, size = 14, color = C.cream, font = 'sans-serif', align = 'left') {
  ctx.fillStyle = color; ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.fillText(s, x, y);
}
function line(ctx, x, y, x2, y2, color, width = 1) { path(ctx, [[x, y], [x2, y2]], null, color, width); }
function circle(ctx, x, y, r, color, stroke, width = 1) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (color) { ctx.fillStyle = color; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
function panel(ctx, x, y, w, h, alpha = 0.94) {
  ctx.fillStyle = `rgba(15, 36, 40, ${alpha})`; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#76948966'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
function button(ctx, b, label) {
  ctx.fillStyle = C.gold; ctx.fillRect(b.x, b.y, b.w, b.h);
  text(ctx, label, b.x + b.w / 2, b.y + 35, 15, C.ink, 'monospace', 'center');
  text(ctx, '↗', b.x + b.w - 28, b.y + 36, 24, C.ink, 'sans-serif', 'center');
}
function pine(ctx, x, y, size, color) {
  line(ctx, x, y, x, y - size * 0.7, color, 2);
  path(ctx, [[x, y - size], [x - size * 0.23, y - size * 0.45], [x - size * 0.12, y - size * 0.45],
    [x - size * 0.34, y - size * 0.12], [x + size * 0.34, y - size * 0.12],
    [x + size * 0.12, y - size * 0.45], [x + size * 0.23, y - size * 0.45]], color);
}
function mountain(ctx, camera, height, color, scale, snow = false) {
  const pts = [];
  for (let x = -80; x <= VIEW.w + 80; x += 24) {
    const w = x + camera * scale;
    const y = height + Math.sin(w / 173) * 53 + Math.sin(w / 71) * 30 + Math.sin(w / 33) * 13;
    pts.push([x, y]);
  }
  path(ctx, [[-80, 800], ...pts, [1360, 800]], color);
  if (snow) {
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i];
      if (y < pts[i - 1][1] && y < pts[i + 1][1] && y < height - 15) {
        path(ctx, [[x - 27, y + 24], [x, y], [x + 32, y + 27], [x + 11, y + 19],
          [x + 2, y + 29], [x - 8, y + 15]], '#e4dfcd');
      }
    }
  }
}
function drawPlane(ctx, plane, cameraX, cameraY, time) {
  ctx.save(); ctx.translate(plane.x - cameraX, plane.y - cameraY); ctx.rotate(plane.pitch); ctx.scale(1.22, 1.22);
  // Landing gear, far wing, and tailplane sit behind the high wing fuselage.
  line(ctx, -9, 1, -5, 9, '#293b3c', 2);
  line(ctx, 18, 1, 14, 9, '#293b3c', 2);
  circle(ctx, -5, 9, 3.4, '#182e32', '#c6c3aa', 1);
  circle(ctx, 14, 9, 4, '#182e32', '#c6c3aa', 1);
  path(ctx, [[-24, -2], [-37, -23], [-28, -24], [-13, -3]], '#d6b46c', '#263a3c');
  path(ctx, [[-24, -1], [-43, -5], [-41, -1], [-18, 5]], '#eee8d0', '#293f40');
  path(ctx, [[-34, -4], [-16, -8], [6, -11], [26, -5], [32, 0], [26, 6], [-7, 6], [-31, 1]], '#f5e7bb', '#243c3d', 1.2);
  path(ctx, [[-29, -1], [24, 1], [26, 4], [-13, 3]], '#b65337');
  path(ctx, [[-4, -11], [3, -18], [13, -17], [23, -7]], '#355b62', '#e2dfc5', 1);
  line(ctx, 8, -17, 10, -8, '#dfddc5', 1.5);
  path(ctx, [[-14, -12], [-39, -17], [-35, -21], [8, -16], [22, -12]], '#efe4c5', '#2b4544');
  line(ctx, -15, -11, 0, 5, '#576b65', 1.1);
  path(ctx, [[25, -6], [32, -3], [32, 3], [25, 5]], '#b9573b');
  ctx.globalAlpha = 0.18; ctx.fillStyle = '#fff2c8'; ctx.beginPath(); ctx.ellipse(34, -1, 4, 24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.65;
  const prop = Math.sin(time * 75) * 21;
  line(ctx, 34, -1 - prop, 34, -1 + prop, '#e7eadc', 2);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 12; ctx.shadowColor = '#ed7860'; circle(ctx, -36, -20, 2, '#fb8872');
  ctx.shadowColor = '#bdffda'; circle(ctx, 20, -12, 2, '#c4ffdc');
  ctx.shadowColor = '#ffebaf'; circle(ctx, 30, -2, 2, '#fff2c8');
  ctx.restore();
}

function instruments(ctx, game) {
  const p = game.plane;
  panel(ctx, 28, 678, 1224, 96, 0.96);
  const alt = Math.max(0, (game.terrain.groundHeight(p.x) - p.y - 9) / UNITS_PER_METRE);
  const speed = Math.hypot(p.vx, p.vy) / UNITS_PER_METRE * 3.6;
  const heading = ((p.pitch * 180 / Math.PI) % 360 + 360) % 360;
  const readings = [['ALTITUDE / AGL', `${alt.toFixed(0)}`, 'm'], ['AIR SPEED', `${speed.toFixed(0)}`, 'km/h'],
    ['HEADING', `${heading.toFixed(0).padStart(3, '0')}`, '°']];
  readings.forEach(([label, value, unit], i) => {
    const x = 52 + i * 172;
    text(ctx, label, x, 702, 10, C.muted, 'monospace');
    text(ctx, value, x, 743, 33, C.mint, 'monospace');
    text(ctx, unit, x + (i === 1 ? 75 : 85), 741, 12, C.muted, 'monospace');
    line(ctx, x + 146, 697, x + 146, 755, '#49635b');
  });
  const fx = 568;
  text(ctx, 'FUEL', fx, 702, 10, C.muted, 'monospace');
  text(ctx, `${Math.ceil(game.fuel)}%`, fx + 118, 702, 12, C.cream, 'monospace', 'right');
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i < game.fuel / 100 * 16 ? (game.fuel < 20 ? '#ea8668' : C.gold) : '#354b46';
    ctx.fillRect(fx + i * 7.5, 718, 5, 19);
  }
  text(ctx, `THR ${Math.round(p.throttle * 100)}%`, fx, 755, 10, C.muted, 'monospace');
  line(ctx, 714, 697, 714, 755, '#49635b');
  text(ctx, 'VALLEY POST / SCORE', 740, 702, 10, C.muted, 'monospace');
  text(ctx, String(game.score).padStart(5, '0'), 740, 745, 33, C.cream, 'monospace');
  const m = Math.floor(game.timeLeft / 60), s = Math.floor(game.timeLeft % 60);
  line(ctx, 934, 697, 934, 755, '#49635b');
  text(ctx, 'DAYLIGHT REMAINING', 960, 702, 10, C.muted, 'monospace');
  text(ctx, `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`, 960, 745, 33, game.timeLeft < 30 ? '#ed997a' : C.gold, 'monospace');
  text(ctx, game.sound.muted ? 'M / OFF' : 'M / ON', 1227, 748, 10, C.muted, 'monospace', 'right');
}

export function drawGame(ctx, game) {
  const { terrain, plane, missions } = game;
  const cameraX = clamp(plane.x - 330, 0, terrain.length - VIEW.w + 130);
  const cameraY = Math.min(0, plane.y - 350);
  const time = game.elapsed || 0;
  const shake = game.shake > 0.1 ? Math.min(10, game.shake * 6) : 0;
  // The decaying value keeps the jolt moving even after a hard landing ends play.
  const shakeX = Math.sin((time + game.shake) * 91) * shake;
  const shakeY = Math.cos((time + game.shake) * 83) * shake * 0.5;
  ctx.save();
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  const sky = ctx.createLinearGradient(0, 0, 0, 680);
  sky.addColorStop(0, '#648c9c'); sky.addColorStop(0.44, '#b9c6be'); sky.addColorStop(0.83, '#f0d6a3'); sky.addColorStop(1, '#eac38f');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  const glow = ctx.createRadialGradient(1000, 213, 3, 1000, 213, 220);
  glow.addColorStop(0, '#fff3c78c'); glow.addColorStop(1, '#fff0bc00');
  ctx.fillStyle = glow; ctx.fillRect(770, 0, 480, 480);
  circle(ctx, 1000 - cameraX * 0.008, 213, 43, '#fff0c4');
  for (let i = 0; i < 7; i++) {
    const x = ((i * 231 - cameraX * 0.05 + time * 3) % 1550 + 1550) % 1550 - 130;
    const y = 135 + Math.sin(i * 2.4) * 62;
    ctx.fillStyle = '#f8edda38'; ctx.beginPath(); ctx.ellipse(x, y, 85, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 42, y - 7, 56, 13, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.save(); ctx.translate(0, -cameraY * 0.25);
  mountain(ctx, cameraX, 357, '#9eafa9', 0.13, true);
  mountain(ctx, cameraX + 900, 420, '#829c95', 0.25, true);
  mountain(ctx, cameraX + 1800, 487, '#587e75', 0.42);
  for (let x = -15; x < 1300; x += 19) {
    const w = x + cameraX * 0.42;
    const y = 498 + Math.sin(w / 173) * 53 + Math.sin(w / 71) * 30;
    pine(ctx, x, y + 30, 18 + (Math.sin(w) + 1) * 13, '#52796e');
  }
  ctx.restore();
  ctx.save();
  ctx.translate(shakeX, shakeY);
  ctx.translate(-cameraX, -cameraY);
  const pts = [];
  for (let x = cameraX - 40; x <= cameraX + VIEW.w + 40; x += 8) pts.push([x, terrain.groundHeight(x)]);
  const earth = ctx.createLinearGradient(0, 450, 0, 900);
  earth.addColorStop(0, '#66866b'); earth.addColorStop(0.5, '#355c4c'); earth.addColorStop(1, '#1d4037');
  path(ctx, [[cameraX - 40, 1200], ...pts, [cameraX + 1320, 1200]], earth, null);
  path(ctx, pts, null, '#a5b783', 3);
  for (const f of terrain.fields) {
    if (f.x1 < cameraX || f.x0 > cameraX + 1300) continue;
    const mid = (f.x0 + f.x1) / 2, y = terrain.groundHeight(mid) + 19;
    const colors = { wheat: '#aaa269', meadow: '#718657', barley: '#b8a46b', fallow: '#8b8060' };
    path(ctx, [[f.x0, y], [f.x1, y + 8], [f.x1 - 35, y + 40], [f.x0 + 15, y + 27]], colors[f.crop]);
    for (let x = f.x0 + 18; x < f.x1 - 20; x += 16) line(ctx, x, y + 5, x - 3, y + 25, '#364d3b38');
  }
  const river = [];
  for (let x = cameraX - 40; x < cameraX + 1340; x += 8) river.push([x, terrain.riverY(x) + 34]);
  path(ctx, river, null, '#8daa9277', 27); path(ctx, river, null, '#68a2a1', 16); path(ctx, river, null, '#b1d0b299', 2);
  // A seeded landscape without consuming random state during rendering.
  for (let i = Math.floor((cameraX - 70) / 31); i < (cameraX + 1350) / 31; i++) {
    const x = i * 31 + Math.sin(i * 8.23) * 9;
    if (terrain.isStrip(x) || terrain.isStrip(x + 40) || terrain.isStrip(x - 40)) continue;
    pine(ctx, x, terrain.groundHeight(x) + 8, 22 + (Math.sin(i * 13.1) + 1) * 15, '#264e42');
  }
  const mission = missions.current;
  const destination = mission?.state === 'pickup' ? mission.pickupStrip : mission?.targetStrip;
  for (const strip of terrain.airstrips) {
    if (strip.x + strip.len < cameraX || strip.x > cameraX + 1350) continue;
    const y = terrain.groundHeight(strip.x);
    const target = strip === destination;
    ctx.fillStyle = '#b4a27c'; ctx.fillRect(strip.x, y, strip.len, 15);
    ctx.fillStyle = '#8a7e60'; ctx.fillRect(strip.x, y + 13, strip.len, 4);
    for (let x = strip.x + 35; x < strip.x + strip.len - 20; x += 55) {
      line(ctx, x, y + 7, x + 25, y + 7, '#eee1ae', 2);
    }
    for (const x of [strip.x + 12, strip.x + strip.len - 25]) {
      for (let j = 0; j < 3; j++) line(ctx, x + j * 5, y + 2, x + j * 5, y + 12, '#eee5c4', 2);
    }
    const poleX = strip.x + strip.len - 48;
    line(ctx, poleX, y, poleX, y - 45, '#d5d6ba', 2);
    path(ctx, [[poleX, y - 45], [poleX + 36, y - 40 + Math.sin(time * 3) * 2], [poleX + 32, y - 31], [poleX, y - 35]], '#c46647');
    for (let j = 0; j < 3; j++) line(ctx, poleX + 7 + j * 9, y - 43 + j, poleX + 6 + j * 9, y - 34 + j, '#f0dbb2', 4);
    const signX = strip.x + 165;
    line(ctx, signX, y - 17, signX, y - 4, '#d9d3ae', 2);
    text(ctx, `${target ? '↓  ' : ''}${strip.name.toUpperCase()}`, signX, y - 30, 11, target ? '#fff0b3' : '#e2dec3', 'monospace', 'center');
    if (target) { circle(ctx, strip.x + 20, y - 4, 3, C.gold); circle(ctx, strip.x + strip.len - 20, y - 4, 3, C.gold); }
  }
  if (mission?.flag && mission.state === 'pickup') {
    const { x, y } = mission.flag;
    line(ctx, x, y, x, y - 46, C.cream, 2);
    path(ctx, [[x, y - 46], [x + 26, y - 39], [x, y - 30]], '#ec8b5b');
    text(ctx, 'HIKER PICKUP', x, y - 58, 11, C.cream, 'monospace', 'center');
  }
  if (mission?.id === 'rings') mission.rings.forEach((r, i) => {
    if (r.x + r.r < cameraX || r.x - r.r > cameraX + VIEW.w || i < mission.ringsDone) return;
    const active = i === mission.ringsDone;
    ctx.save(); ctx.shadowColor = C.gold; ctx.shadowBlur = active ? 19 : 0;
    circle(ctx, r.x, r.y, r.r, '#f6d18409', active ? '#ffe0a0' : '#d9ca9290', active ? 3 : 2);
    ctx.shadowBlur = 0; circle(ctx, r.x, r.y, r.r + 7, null, '#fff0b12b', 1);
    text(ctx, `${i + 1}`.padStart(2, '0'), r.x, r.y - r.r - 17, 12, C.gold, 'monospace', 'center');
    if (active) text(ctx, 'FLIGHT GATE', r.x, r.y + r.r + 27, 9, '#f0e2bd', 'monospace', 'center');
    ctx.restore();
  });
  for (const p of game.particles) {
    ctx.globalAlpha = clamp(p.life, 0, 1); circle(ctx, p.x, p.y, 2.5, C.gold);
  }
  ctx.globalAlpha = 1;
  for (const f of game.floaters) text(ctx, f.text, f.x, f.y, 23, C.gold, 'monospace', 'center');
  // Ground shadow anchors the little plane to the valley.
  const altitude = terrain.groundHeight(plane.x) - plane.y;
  ctx.globalAlpha = clamp(0.28 - altitude / 1300, 0.04, 0.24);
  ctx.fillStyle = '#102e2b'; ctx.beginPath(); ctx.ellipse(plane.x + 10, terrain.groundHeight(plane.x) + 9, 40, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1; ctx.restore();
  const airspeed = Math.hypot(plane.vx, plane.vy);
  if (game.state === 'playing' && airspeed > TUNING.maxSpeed * 0.6) {
    const intensity = clamp((airspeed / TUNING.maxSpeed - 0.6) / 0.4, 0, 1);
    ctx.save(); ctx.globalAlpha = 0.05 + intensity * 0.08;
    for (let i = 0; i < Math.ceil(intensity * 24); i++) {
      // Animate without consuming the seeded simulation's random state.
      const span = VIEW.w + 80;
      const x = ((i * 197 - time * airspeed * 1.8) % span + span) % span - 40;
      const y = plane.y - cameraY + Math.sin(i * 2.4 + 0.7) * 125;
      if (Math.abs(x - (plane.x - cameraX)) < 60 && Math.abs(y - (plane.y - cameraY)) < 35) continue;
      line(ctx, x, y, x + 12 + intensity * 20, y, C.cream);
    }
    ctx.restore();
  }
  drawPlane(ctx, plane, cameraX - shakeX, cameraY - shakeY, time);
  // Navigation frame and mission card.
  text(ctx, '↗  RIDGELINE COURIER', 34, 43, 16, C.ink, 'monospace');
  text(ctx, 'VALLEY AIRMAIL SERVICE  /  EST. 1984', 35, 63, 9, '#2b4c4e', 'monospace');
  text(ctx, 'N  46° 38′     E  09° 49′', 1245, 41, 11, C.ink, 'monospace', 'right');
  text(ctx, 'DAWN PATROL  ·  CLEAR SKIES', 1245, 62, 9, '#2b4c4e', 'monospace', 'right');
  panel(ctx, 28, 88, 475, 91, 0.9);
  text(ctx, `SORTIE ${String(missions.deliveries + 1).padStart(2, '0')}  /  ${mission?.name.toUpperCase() || 'VALLEY POST'}`, 47, 112, 11, C.gold, 'monospace');
  const brief = mission?.id === 'rings' ? `Fly six gates in order, then land at ${destination.name}.` : mission?.state === 'pickup' ? `Collect the hiker at ${destination.name}.` : `Touch down gently at ${destination?.name || 'the marked strip'}.`;
  text(ctx, brief, 47, 137, 13, C.cream);
  if (mission?.id === 'rings') {
    for (let i = 0; i < mission.ringsTotal; i++) circle(ctx, 52 + i * 20, 158, 3, i < mission.ringsDone ? C.gold : '#4b655b', i === mission.ringsDone ? C.gold : null);
    text(ctx, `${mission.ringsDone} / ${mission.ringsTotal} GATES`, 192, 162, 9, C.muted, 'monospace');
  } else text(ctx, mission?.state === 'pickup' ? 'SEARCH & RESCUE · PICKUP' : 'PRIORITY CARGO ABOARD', 47, 162, 9, C.muted, 'monospace');
  // Off-screen objective bearing is kept visible even during departure roll.
  const nextRing = mission?.id === 'rings' ? mission.rings[mission.ringsDone] : null;
  const goalX = nextRing?.x ?? destination?.x;
  if (goalX !== undefined && (goalX - cameraX > 1190 || goalX < cameraX)) {
    const right = goalX > plane.x;
    panel(ctx, right ? 1062 : 28, 277, 190, 49, 0.78);
    text(ctx, `${right ? '→' : '←'}  ${nextRing ? 'NEXT GATE' : 'AIRSTRIP'}`, right ? 1077 : 43, 298, 11, C.gold, 'monospace');
    text(ctx, `${(Math.abs(goalX - plane.x) / 1000).toFixed(1)} km ahead`, right ? 1077 : 43, 315, 10, C.cream, 'monospace');
  }
  if (game.messageTimer > 0 && game.state === 'playing') {
    panel(ctx, 265, 610, 750, 38, 0.85);
    text(ctx, game.message, 640, 634, 12, C.gold, 'monospace', 'center');
  }
  instruments(ctx, game);
  if (game.state === 'playing') text(ctx, 'W / S  THROTTLE     A / D  PITCH                                      P  PAUSE', 640, 793, 9, '#b9c8b7', 'monospace', 'center');
  if (game.state !== 'playing') {
    ctx.fillStyle = '#09232580'; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    if (game.state === 'title') {
      panel(ctx, 340, 193, 600, 425, 0.97);
      text(ctx, 'THE VALLEY IS COUNTING ON YOU', 640, 233, 11, C.gold, 'monospace', 'center');
      text(ctx, 'RIDGELINE', 640, 296, 58, C.cream, 'Georgia, serif', 'center');
      text(ctx, 'C O U R I E R', 640, 334, 26, C.gold, 'Georgia, serif', 'center');
      line(ctx, 520, 354, 760, 354, '#779083');
      text(ctx, 'A little plane. A big mountain. Precious cargo.', 640, 384, 16, '#c1cdbd', 'Georgia, serif', 'center');
      text(ctx, 'W / S or ↑ / ↓    THROTTLE', 640, 427, 12, C.cream, 'monospace', 'center');
      text(ctx, 'A / D or ← / →    PITCH', 640, 453, 12, C.cream, 'monospace', 'center');
      text(ctx, 'P  PAUSE     M  MUTE     ENTER  START', 640, 491, 11, C.muted, 'monospace', 'center');
      button(ctx, LAYOUT.start, 'START YOUR ROUTE');
      text(ctx, 'FLY THE GATES. DELIVER THE MAIL. MAKE IT HOME.', 640, 605, 9, C.muted, 'monospace', 'center');
    } else if (game.state === 'paused') {
      panel(ctx, 410, 290, 460, 200);
      text(ctx, 'HOLDING PATTERN', 640, 360, 32, C.cream, 'Georgia, serif', 'center');
      text(ctx, 'Take a breath. The valley can wait.', 640, 404, 15, C.muted, 'sans-serif', 'center');
      text(ctx, 'PRESS P TO RESUME', 640, 454, 12, C.gold, 'monospace', 'center');
    } else {
      panel(ctx, 340, 178, 600, 459, 0.97);
      text(ctx, 'VALLEY AIRMAIL / FLIGHT REPORT', 640, 217, 11, C.gold, 'monospace', 'center');
      text(ctx, 'SORTIE OVER', 640, 275, 43, C.cream, 'Georgia, serif', 'center');
      text(ctx, game.endReason || 'Another story from the mountains.', 640, 311, 13, C.muted, 'sans-serif', 'center');
      text(ctx, String(game.score).padStart(5, '0'), 640, 377, 47, C.gold, 'monospace', 'center');
      text(ctx, 'TOTAL POINTS', 640, 402, 10, C.muted, 'monospace', 'center');
      line(ctx, 395, 427, 885, 427, '#49635b');
      const stats = [['DELIVERIES', missions.deliveries], ['RINGS HIT', missions.ringsHit], ['BEST LANDING', missions.bestLanding === null ? '—' : `${missions.bestLanding.toFixed(1)} m/s`]];
      stats.forEach(([label, value], i) => {
        const x = 470 + i * 170;
        text(ctx, value.toString(), x, 475, 25, C.cream, 'monospace', 'center');
        text(ctx, label, x, 500, 9, C.muted, 'monospace', 'center');
      });
      button(ctx, LAYOUT.restart, 'FLY ANOTHER SORTIE');
      text(ctx, 'OR PRESS ENTER', 640, 625, 9, C.muted, 'monospace', 'center');
    }
  }
  ctx.restore();
}
