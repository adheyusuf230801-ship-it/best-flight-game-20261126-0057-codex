[![make.fun bounty](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![Leaderboard rank](https://make.fun/badge/best-flight-game-20261126-0057/adheyusuf230801-ship-it/best-flight-game-20261126-0057-codex/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard)
[![Reward](https://make.fun/badge/best-flight-game-20261126-0057/adheyusuf230801-ship-it/best-flight-game-20261126-0057-codex/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard)

# Ridgeline Courier — a mountain flight game

You are a courier pilot flying a small prop plane through a mountain valley. Fly through glowing target rings, land gently on dirt airstrips to deliver the mail, watch your fuel and throttle, and chain sorties — Rings, Delivery and Rescue — for score. Original art drawn in code, procedural WebAudio sounds, no libraries, no network.

## Play

```sh
node serve.ts
```

then open http://localhost:8080 — or open game/index.html directly in a desktop browser. Keys: W/S or Up/Down throttle, A/D or Left/Right pitch, P pauses, M mutes, Enter starts.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

copies game/ and screenshots/ to the output directory and writes its dossier.json with vendor/makefun-game.ts.

Built for make.fun — referral code: 1k2ycn9n
