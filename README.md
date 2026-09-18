# Neon Bounce — Ultimate Edition

A futuristic remake of the classic Nokia **Bounce** game. A glowing energy ball
rolls and bounces through neon side-scrolling levels — collect rings and coins,
grab power-ups, dodge spikes and spinning saws, and reach the goal ring. Built
as a pure static web app (HTML + CSS + vanilla JS), mobile-first, installable as
a PWA, and ready to host on GitHub Pages.

## Play

- **Tap / hold** anywhere to jump. Quick tap = small hop, hold longer = higher jump.
- On desktop: **Space** or **Up arrow** to jump, **Esc** or **P** to pause.
- Switch between **Neon** and **Retro** looks with the **THEME** toggle on the start screen.
- Collect cyan **rings** and gold **coins** for score.
- Grab **power-ups**, avoid magenta **spikes** and **saws**, and reach the big **goal ring**.
- You have **3 lives** per run. Score and per-level stars are saved locally.

## Features

- **6 hand-designed neon levels** with increasing difficulty
- **Power-ups:**
  - **Shield** (cyan) — absorbs one hit and bounces you back to safety
  - **Magnet** (gold) — pulls nearby rings and coins toward you
  - **Slow-mo** (violet) — slows time so tricky jumps are easier
- **Moving platforms** and **spinning saw** hazards
- **Coins + rings + score** with a live HUD
- **Star rating** per level (3 = all rings, 2 = 60%+, 1 = finished)
- **Level select** screen with locked/unlocked progression and earned stars
- **Pause / resume / quit** any time
- **Two themes:** switchable **Neon** (glowing cyberpunk) and **Retro** (classic red rubber ball with a flat LCD look, chunky green blocks, and CRT scanlines). Toggle on the start screen; your choice is saved.
- **Procedural sound effects + background music** (Web Audio, no audio files), with a sound toggle
- Particle bursts, glowing trail, screen shake, parallax grid background
- **PWA:** installable to your home screen and playable **offline** (service worker)
- Full touch + mouse + keyboard support, safe-area aware for notched phones
- Progress saved in `localStorage`; zero dependencies, no build step

## Run locally

Open `index.html` in a browser. For PWA/service-worker and touch testing, serve
it over HTTP:

```bash
# any static server works, e.g. Python
python3 -m http.server 8000
# then visit http://localhost:8000
```

> Note: the service worker and "install to home screen" only activate when served
> over HTTP(S), not from a `file://` path. The game itself plays fine either way.

## Host on GitHub Pages

1. Create a new GitHub repository (e.g. `neon-bounce`).
2. Push all files to the repo root:

   ```bash
   git init
   git add .
   git commit -m "Neon Bounce - Ultimate Edition"
   git branch -M main
   git remote add origin https://github.com/<your-username>/neon-bounce.git
   git push -u origin main
   ```

3. In the repo on GitHub, go to **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Select branch **main** and folder **/ (root)**, then **Save**.
6. Wait a minute, then open your live game at:

   ```
   https://<your-username>.github.io/neon-bounce/
   ```

Because it's fully static, no build or backend is required. On a phone you can
then use the browser's "Add to Home Screen" to install it as an app.

## File structure

```
index.html     # markup, HUD, menus, PWA + service-worker registration
style.css      # neon theme, level-select grid, animations, responsive layout
audio.js       # procedural Web Audio sound engine (window.Sound)
game.js        # game engine: physics, levels, power-ups, input, rendering
manifest.json  # PWA manifest
icon.svg       # app icon
sw.js          # service worker for offline play
README.md      # this file
```

## Customizing

- **Add levels:** append a new object to the `LEVELS` array in `game.js`
  (supports `platforms`, `spikes`, `movers`, `saws`, `rings`, `coins`, `powers`, `goal`).
- **Tune feel:** edit the physics constants near the top of `game.js`
  (`GRAVITY`, `MOVE_SPEED`, `JUMP_TAP`, `JUMP_HOLD`, `BOUNCE_DAMP`).
- **Power-up durations:** edit `POWER_DUR` in `game.js`.
- **Recolor / add themes:** canvas colors live in the `THEMES` object in
  `game.js` (add a palette and it becomes selectable via `setTheme`); UI colors
  live in the CSS variables at the top of `style.css` with per-theme overrides
  under `[data-theme="retro"]`.
- **Sounds:** tweak the tones in `audio.js`.

## Reset progress

Progress and settings live in `localStorage` under the keys
`neonbounce_progress`, `neonbounce_best`, `neonbounce_sound`, and
`neonbounce_theme`. Clear your site data (or those keys) to reset.
