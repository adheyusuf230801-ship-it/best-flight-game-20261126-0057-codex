/**
 * Hand in Ridgeline Courier by copying its static game and real browser screenshots
 * and building the canonical dossier with the competition gate's exact caps.
 * Run with Node 22: MAKEFUN_OUTPUT_DIR=out node main.ts (defaults to /output).
 * Uses only the Node standard library and the unchanged kit dossier helper.
 */
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repository = fileURLToPath(new URL('.', import.meta.url));
const output = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
mkdirSync(output, { recursive: true });
for (const directory of ['game', 'screenshots']) {
  cpSync(join(repository, directory), join(output, directory), { recursive: true });
}
writeFileSync(join(output, 'dossier.json'), buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
}));
