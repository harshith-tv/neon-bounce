/* ============================================================
   NEON BOUNCE - Ultimate Edition
   Pure vanilla JS + Canvas. Mobile-first, no dependencies.
   Features: 6 levels, power-ups (shield/magnet/slow-mo),
   coins & score, moving hazards, stars, level select,
   pause, sound, and progress saved to localStorage.
   ============================================================ */

(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const S = window.Sound;

  // ---- DOM ----
  const hud = document.getElementById("hud");
  const hudLevel = document.getElementById("hud-level");
  const hudRings = document.getElementById("hud-rings");
  const hudScore = document.getElementById("hud-score");
  const hudLives = document.getElementById("hud-lives");
  const powerbar = document.getElementById("powerbar");

  const startScreen = document.getElementById("start-screen");
  const levelselectScreen = document.getElementById("levelselect-screen");
  const pauseScreen = document.getElementById("pause-screen");
  const winScreen = document.getElementById("win-screen");
  const overScreen = document.getElementById("over-screen");
  const clearScreen = document.getElementById("clear-screen");
  const winText = document.getElementById("win-text");
  const overText = document.getElementById("over-text");
  const clearText = document.getElementById("clear-text");
  const starsEl = document.getElementById("stars");
  const levelGrid = document.getElementById("level-grid");
  const btnSound = document.getElementById("btn-sound");
  const btnTheme = document.getElementById("btn-theme");

  const overlays = [startScreen, levelselectScreen, pauseScreen, winScreen, overScreen, clearScreen];

  // ---- Buttons ----
  bindTap("btn-play", () => { S.unlock(); startGame(); });
  bindTap("btn-levels", () => { S.unlock(); S.click(); openLevelSelect(); });
  bindTap("btn-back", () => { S.click(); show(startScreen); });
  bindTap("btn-pause", () => pauseGame());
  bindTap("btn-resume", () => resumeGame());
  bindTap("btn-quit", () => quitToMenu());
  bindTap("btn-quit2", () => quitToMenu());
  bindTap("btn-next", () => { S.click(); nextLevel(); });
  bindTap("btn-replay", () => { S.click(); retryLevel(); });
  bindTap("btn-retry", () => { S.click(); retryLevel(); });
  bindTap("btn-restart", () => { S.click(); state.level = 0; startGame(); });
  bindTap("btn-sound", () => {
    S.unlock();
    const on = S.toggle();
    btnSound.textContent = "SOUND: " + (on ? "ON" : "OFF");
    if (on) S.click();
  });
  bindTap("btn-theme", () => {
    S.unlock(); S.click();
    setTheme(themeName === "neon" ? "retro" : "neon");
    updateThemeLabel();
    draw(); // repaint static menu frame in the new theme
  });

  function updateThemeLabel() {
    if (btnTheme) btnTheme.textContent = "THEME: " + (themeName === "neon" ? "NEON" : "RETRO");
  }

  function bindTap(id, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", fn);
  }

  // ---- Viewport / DPR ----
  let W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  // ============================================================
  //  LEVEL DATA
  //  platforms: {x,y,w,h}
  //  spikes:    {x,y,w}
  //  movers:    {x,y,w,h, axis:'x'|'y', range, speed, phase}  (moving platform)
  //  saws:      {x,y,r, range, speed, axis}                   (moving hazard)
  //  rings:     {x,y}
  //  coins:     {x,y}
  //  powers:    {x,y, type:'shield'|'magnet'|'slow'}
  //  goal:      {x,y}
  // ============================================================
  const G_Y = 520;
  const LEVELS = [
    {
      name: "Genesis Grid",
      start: { x: 80, y: 400 },
      platforms: [{ x: 0, y: G_Y, w: 700, h: 200 }, { x: 820, y: G_Y, w: 1500, h: 200 }],
      spikes: [{ x: 380, y: G_Y, w: 90 }],
      movers: [],
      saws: [],
      rings: [{ x: 300, y: 440 }, { x: 560, y: 380 }, { x: 900, y: 440 }, { x: 1200, y: 440 }, { x: 1500, y: 380 }],
      coins: [{ x: 430, y: 300 }, { x: 1000, y: 360 }, { x: 1350, y: 360 }],
      powers: [{ x: 1100, y: 300, type: "shield" }],
      goal: { x: 2000, y: 440 },
      width: 2300,
    },
    {
      name: "Pulse Ascent",
      start: { x: 80, y: 400 },
      platforms: [
        { x: 0, y: G_Y, w: 500, h: 200 },
        { x: 620, y: 440, w: 240, h: 160 },
        { x: 960, y: 360, w: 240, h: 240 },
        { x: 1300, y: G_Y, w: 1300, h: 200 },
      ],
      spikes: [{ x: 1500, y: G_Y, w: 90 }, { x: 1750, y: G_Y, w: 90 }],
      movers: [],
      saws: [],
      rings: [{ x: 300, y: 440 }, { x: 700, y: 360 }, { x: 1060, y: 280 }, { x: 1400, y: 440 }, { x: 1650, y: 440 }, { x: 2100, y: 440 }],
      coins: [{ x: 880, y: 300 }, { x: 1180, y: 240 }, { x: 2000, y: 360 }],
      powers: [{ x: 1060, y: 220, type: "magnet" }],
      goal: { x: 2450, y: 440 },
      width: 2700,
    },
    {
      name: "Void Leap",
      start: { x: 80, y: 380 },
      platforms: [
        { x: 0, y: G_Y, w: 420, h: 200 },
        { x: 560, y: G_Y, w: 220, h: 200 },
        { x: 920, y: 460, w: 200, h: 140 },
        { x: 1260, y: 400, w: 200, h: 200 },
        { x: 1620, y: G_Y, w: 300, h: 200 },
        { x: 2040, y: G_Y, w: 1000, h: 200 },
      ],
      spikes: [{ x: 300, y: G_Y, w: 90 }, { x: 2150, y: G_Y, w: 90 }, { x: 2450, y: G_Y, w: 90 }],
      movers: [],
      saws: [{ x: 1360, y: 340, r: 26, range: 120, speed: 0.02, axis: "y" }],
      rings: [{ x: 480, y: 440 }, { x: 660, y: 440 }, { x: 1000, y: 380 }, { x: 1360, y: 320 }, { x: 1720, y: 440 }, { x: 2100, y: 440 }, { x: 2650, y: 440 }],
      coins: [{ x: 740, y: 340 }, { x: 1500, y: 300 }, { x: 2300, y: 360 }],
      powers: [{ x: 1620, y: 380, type: "slow" }],
      goal: { x: 2950, y: 440 },
      width: 3200,
    },
    {
      name: "Kinetic Rift",
      start: { x: 80, y: 400 },
      platforms: [
        { x: 0, y: G_Y, w: 480, h: 200 },
        { x: 1000, y: G_Y, w: 300, h: 200 },
        { x: 1900, y: G_Y, w: 1400, h: 200 },
      ],
      spikes: [{ x: 2100, y: G_Y, w: 90 }, { x: 2500, y: G_Y, w: 90 }],
      movers: [
        { x: 560, y: 460, w: 160, h: 24, axis: "x", range: 220, speed: 0.02, phase: 0 },
        { x: 1420, y: 440, w: 160, h: 24, axis: "y", range: 120, speed: 0.025, phase: 1 },
      ],
      saws: [{ x: 2300, y: 460, r: 28, range: 160, speed: 0.03, axis: "x" }],
      rings: [{ x: 300, y: 440 }, { x: 640, y: 380 }, { x: 1120, y: 440 }, { x: 1480, y: 360 }, { x: 2000, y: 440 }, { x: 2700, y: 440 }],
      coins: [{ x: 800, y: 340 }, { x: 1500, y: 260 }, { x: 2850, y: 360 }],
      powers: [{ x: 1120, y: 320, type: "shield" }],
      goal: { x: 3200, y: 440 },
      width: 3450,
    },
    {
      name: "Photon Storm",
      start: { x: 80, y: 380 },
      platforms: [
        { x: 0, y: G_Y, w: 400, h: 200 },
        { x: 520, y: 440, w: 180, h: 160 },
        { x: 820, y: 380, w: 180, h: 220 },
        { x: 1120, y: 460, w: 180, h: 140 },
        { x: 1500, y: G_Y, w: 400, h: 200 },
        { x: 2100, y: G_Y, w: 1300, h: 200 },
      ],
      spikes: [{ x: 1600, y: G_Y, w: 90 }, { x: 1750, y: G_Y, w: 90 }, { x: 2200, y: G_Y, w: 90 }, { x: 2700, y: G_Y, w: 90 }],
      movers: [{ x: 1300, y: 420, w: 150, h: 24, axis: "y", range: 130, speed: 0.03, phase: 0 }],
      saws: [
        { x: 900, y: 300, r: 26, range: 120, speed: 0.03, axis: "y" },
        { x: 2450, y: 460, r: 28, range: 150, speed: 0.035, axis: "x" },
      ],
      rings: [{ x: 300, y: 440 }, { x: 600, y: 360 }, { x: 900, y: 300 }, { x: 1200, y: 380 }, { x: 1650, y: 440 }, { x: 2350, y: 440 }, { x: 2900, y: 440 }],
      coins: [{ x: 700, y: 300 }, { x: 1000, y: 240 }, { x: 3000, y: 360 }],
      powers: [{ x: 1550, y: 380, type: "magnet" }, { x: 2100, y: 360, type: "slow" }],
      goal: { x: 3300, y: 440 },
      width: 3550,
    },
    {
      name: "Singularity",
      start: { x: 80, y: 380 },
      platforms: [
        { x: 0, y: G_Y, w: 380, h: 200 },
        { x: 900, y: G_Y, w: 220, h: 200 },
        { x: 1700, y: G_Y, w: 220, h: 200 },
        { x: 2500, y: G_Y, w: 1200, h: 200 },
      ],
      spikes: [{ x: 2650, y: G_Y, w: 90 }, { x: 2900, y: G_Y, w: 90 }, { x: 3150, y: G_Y, w: 90 }],
      movers: [
        { x: 460, y: 460, w: 150, h: 24, axis: "x", range: 260, speed: 0.022, phase: 0 },
        { x: 1240, y: 440, w: 150, h: 24, axis: "y", range: 140, speed: 0.03, phase: 1 },
        { x: 2040, y: 460, w: 150, h: 24, axis: "x", range: 260, speed: 0.024, phase: 2 },
      ],
      saws: [
        { x: 1400, y: 320, r: 30, range: 160, speed: 0.035, axis: "y" },
        { x: 2800, y: 460, r: 30, range: 180, speed: 0.04, axis: "x" },
      ],
      rings: [{ x: 300, y: 440 }, { x: 700, y: 380 }, { x: 1000, y: 440 }, { x: 1500, y: 360 }, { x: 1800, y: 440 }, { x: 2300, y: 380 }, { x: 2600, y: 440 }, { x: 3300, y: 440 }],
      coins: [{ x: 550, y: 320 }, { x: 1300, y: 260 }, { x: 2100, y: 320 }, { x: 3400, y: 360 }],
      powers: [{ x: 900, y: 360, type: "shield" }, { x: 1700, y: 360, type: "slow" }, { x: 2500, y: 360, type: "magnet" }],
      goal: { x: 3650, y: 440 },
      width: 3900,
    },
  ];

  // ---- Physics ----
  const GRAVITY = 0.62;
  const MOVE_SPEED = 3.6;
  const JUMP_TAP = 9.5;
  const JUMP_HOLD = 15;
  const BOUNCE_DAMP = 0.55;
  const BALL_R = 18;
  const MAX_FALL = 16;

  const POWER_DUR = {  // frames (~60fps)
    shield: 60 * 8,
    magnet: 60 * 8,
    slow: 60 * 6,
  };
  const POWER_LABEL = { shield: "SHIELD", magnet: "MAGNET", slow: "SLOW-MO" };

  // ============================================================
  //  THEMES
  //  Two palettes: NEON (default) and RETRO (classic red rubber ball).
  //  Every canvas color is pulled from the active theme (TH()).
  //  'glow' toggles shadow-blur so RETRO looks flat & old-school.
  // ============================================================
  const THEMES = {
    neon: {
      glow: true,
      bgTop: "#0a0524", bgBottom: "#05010f",
      grid: "rgba(138, 92, 255, 0.12)",
      haze: "rgba(22, 242, 229, 0.10)", hazeEnd: "rgba(22, 242, 229, 0)",
      platformFill: "rgba(20, 12, 48, 0.95)", platformEdge: "#8a5cff",
      moverFill: "rgba(22, 242, 229, 0.15)", moverEdge: "#16f2e5",
      spike: "#ff2fd0", saw: "#ff2fd0", sawHub: "#05010f",
      ring: "#16f2e5", coin: "#ffd23f",
      goalOuter: "#ff2fd0", goalInner: "#16f2e5", goalPole: "rgba(255, 47, 208, 0.5)",
      ballIn: "#bffffb", ballMid: "#16f2e5", ballOut: "#0b7d78",
      ballLine: "rgba(5, 1, 15, 0.6)", trail: "#16f2e5",
      shield: "#16f2e5", shieldAura: "rgba(22, 242, 229, 0.8)",
      power: { shield: "#16f2e5", magnet: "#ffd23f", slow: "#8a5cff" },
      landBurst: "#8a5cff",
    },
    retro: {
      glow: false,
      bgTop: "#cfe8d0", bgBottom: "#b7d8bb",      // pale LCD green-grey sky
      grid: "rgba(40, 70, 45, 0.10)",
      haze: "rgba(255, 255, 255, 0.12)", hazeEnd: "rgba(255, 255, 255, 0)",
      platformFill: "#3a5a3f", platformEdge: "#1e3a24",  // mossy green blocks
      moverFill: "#5a7a52", moverEdge: "#2e4a2f",
      spike: "#2e2e2e", saw: "#444444", sawHub: "#111111",
      ring: "#f2c200", coin: "#f2c200",            // classic yellow hoops/coins
      goalOuter: "#1e3a24", goalInner: "#f2c200", goalPole: "rgba(30, 58, 36, 0.6)",
      ballIn: "#ff8a7a", ballMid: "#e53321", ballOut: "#9c1a10",  // red rubber ball
      ballLine: "rgba(60, 10, 5, 0.7)", trail: "#e53321",
      shield: "#2f7fff", shieldAura: "rgba(47, 127, 255, 0.85)",
      power: { shield: "#2f7fff", magnet: "#f2c200", slow: "#7a5cff" },
      landBurst: "#2e4a2f",
    },
  };

  let themeName = localStorage.getItem("neonbounce_theme") || "neon";
  if (!THEMES[themeName]) themeName = "neon";
  function TH() { return THEMES[themeName]; }
  function POWER_COLOR_OF(type) { return TH().power[type]; }
  function applyThemeAttr() { document.documentElement.setAttribute("data-theme", themeName); }
  function setTheme(name) {
    themeName = THEMES[name] ? name : "neon";
    localStorage.setItem("neonbounce_theme", themeName);
    applyThemeAttr();
  }
  applyThemeAttr();

  // ---- Progress (stars per level) ----
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem("neonbounce_progress") || "{}"); }
    catch { return {}; }
  }
  function saveProgress(p) { localStorage.setItem("neonbounce_progress", JSON.stringify(p)); }

  // ---- State ----
  const state = {
    running: false,
    paused: false,
    level: 0,
    lives: 3,
    score: 0,
    best: parseInt(localStorage.getItem("neonbounce_best") || "0", 10),
    progress: loadProgress(),
  };

  let level, ball, camX, ringsTotal, ringsGot, coinsGot, particles;
  let holding, holdFrames, goalPulse = 0, tick = 0;
  let shake = 0;
  let active = { shield: 0, magnet: 0, slow: 0 };
  // responsiveness helpers: buffer a tap and allow coyote-time jumps
  let jumpBuffer = 0;   // frames a pending tap stays valid
  let coyote = 0;       // frames since last grounded that still allow a jump
  const JUMP_BUFFER_FRAMES = 8;  // ~130ms window: a tap just before landing still fires
  const COYOTE_FRAMES = 6;       // ~100ms: jump still works just after leaving ground

  function unlocked(i) {
    if (i === 0) return true;
    return !!state.progress[i - 1]; // previous level cleared
  }

  function loadLevel(i) {
    level = LEVELS[i];
    ball = { x: level.start.x, y: level.start.y, vx: MOVE_SPEED, vy: 0, onGround: false, trail: [], spin: 0 };
    camX = 0;
    ringsGot = 0;
    coinsGot = 0;
    ringsTotal = level.rings.length;
    particles = [];
    holding = false;
    holdFrames = 0;
    active = { shield: 0, magnet: 0, slow: 0 };
    // reset collectibles / hazards
    level._rings = level.rings.map((r) => ({ x: r.x, y: r.y, got: false }));
    level._coins = (level.coins || []).map((c) => ({ x: c.x, y: c.y, got: false }));
    level._powers = (level.powers || []).map((p) => ({ x: p.x, y: p.y, type: p.type, got: false }));
    level._movers = (level.movers || []).map((m) => ({ ...m, baseX: m.x, baseY: m.y, t: (m.phase || 0) * Math.PI }));
    level._saws = (level.saws || []).map((s) => ({ ...s, baseX: s.x, baseY: s.y, t: 0 }));
    updateHud();
  }

  // ============================================================
  //  INPUT
  // ============================================================
  function performJump() {
    ball.vy = -JUMP_TAP;
    ball.onGround = false;
    holding = true;
    holdFrames = 0;
    jumpBuffer = 0;
    coyote = 0;
    spawnBurst(ball.x, ball.y + BALL_R, TH().ballMid, 8);
    S.jump();
  }

  function doJumpStart() {
    if (!state.running || state.paused) return;
    // instant jump if grounded or within coyote window; otherwise buffer the tap
    if (ball.onGround || coyote > 0) {
      performJump();
    } else {
      jumpBuffer = JUMP_BUFFER_FRAMES;
    }
  }
  function doJumpEnd() { holding = false; }

  const jumpZone = document.getElementById("jump-zone");
  jumpZone.addEventListener("touchstart", (e) => { e.preventDefault(); doJumpStart(); }, { passive: false });
  jumpZone.addEventListener("touchend", (e) => { e.preventDefault(); doJumpEnd(); }, { passive: false });
  jumpZone.addEventListener("mousedown", doJumpStart);
  window.addEventListener("mouseup", doJumpEnd);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); doJumpStart(); }
    if (e.code === "Escape" || e.key === "p") { if (state.running) state.paused ? resumeGame() : pauseGame(); }
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") doJumpEnd();
  });

  // ============================================================
  //  PARTICLES
  // ============================================================
  function spawnBurst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 1 + Math.random() * 3.5;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: 1, color, r: 2 + Math.random() * 2 });
    }
  }
  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.03;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function addScore(n) {
    state.score += n;
    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem("neonbounce_best", String(state.best));
    }
    updateHud();
  }

  // ============================================================
  //  UPDATE
  // ============================================================
  function update() {
    if (!state.running || state.paused) return;
    tick++;
    goalPulse += 0.08;
    if (shake > 0) shake *= 0.85;

    const slowFactor = active.slow > 0 ? 0.55 : 1;

    // decay power timers
    for (const k of ["shield", "magnet", "slow"]) if (active[k] > 0) active[k]--;
    renderPowerbar();

    // decay a buffered tap (consumed on landing in the collision step below)
    if (jumpBuffer > 0) jumpBuffer--;

    // move hazards / movers (unaffected by slow-mo for fairness of timing? keep affected)
    for (const m of level._movers) {
      m.t += m.speed;
      if (m.axis === "x") m.x = m.baseX + Math.sin(m.t) * m.range;
      else m.y = m.baseY + Math.sin(m.t) * m.range;
    }
    for (const s of level._saws) {
      s.t += s.speed;
      if (s.axis === "x") s.x = s.baseX + Math.sin(s.t) * s.range;
      else s.y = s.baseY + Math.sin(s.t) * s.range;
    }

    // horizontal auto-roll
    ball.vx = MOVE_SPEED * slowFactor;
    ball.x += ball.vx;
    ball.spin += ball.vx * 0.04;

    // variable jump
    if (holding && !ball.onGround && ball.vy < 0 && holdFrames < 12) {
      ball.vy -= 0.85; holdFrames++;
      if (ball.vy < -JUMP_HOLD) ball.vy = -JUMP_HOLD;
    }

    // gravity
    ball.vy += GRAVITY * slowFactor;
    if (ball.vy > MAX_FALL) ball.vy = MAX_FALL;
    ball.y += ball.vy * slowFactor;

    // solid surfaces = platforms + moving platforms
    ball.onGround = false;
    const solids = level.platforms.concat(level._movers);
    for (const p of solids) {
      const withinX = ball.x + BALL_R > p.x && ball.x - BALL_R < p.x + p.w;
      if (!withinX) continue;
      const topH = p.h != null ? p.h : 200;
      if (ball.vy >= 0 && ball.y + BALL_R >= p.y && ball.y + BALL_R <= p.y + Math.max(28, ball.vy + 2)) {
        ball.y = p.y - BALL_R;
        if (ball.vy > 6) { spawnBurst(ball.x, ball.y + BALL_R, TH().landBurst, 6); S.land(); }
        if (!holding && ball.vy > 3) ball.vy = -ball.vy * BOUNCE_DAMP;
        else { ball.vy = 0; ball.onGround = true; }
        // ride horizontal movers
        if (p.axis === "x") ball.x += Math.cos(p.t) * p.speed * p.range;
      }
    }

    // grounded bookkeeping: refresh coyote window and fire any buffered tap instantly
    if (ball.onGround) {
      coyote = COYOTE_FRAMES;
      if (jumpBuffer > 0) performJump();
    } else if (coyote > 0) {
      coyote--;
    }

    // spikes
    for (const s of level.spikes) {
      const sx = s.x + s.w / 2, sy = s.y - 26;
      if (Math.abs(ball.x - sx) < s.w / 2 + BALL_R - 6 && ball.y + BALL_R > sy) {
        if (!consumeShield()) return die("Popped on a spike");
      }
    }

    // saws
    for (const s of level._saws) {
      if (Math.hypot(ball.x - s.x, ball.y - s.y) < s.r + BALL_R - 4) {
        if (!consumeShield()) return die("Sliced by a saw");
      }
    }

    // fell out
    if (ball.y - BALL_R > H + 200 || ball.y > G_Y + 320) return die("Fell into the void");

    // magnet pull
    const pull = active.magnet > 0;

    // rings
    for (const r of level._rings) {
      if (r.got) continue;
      if (pull && Math.hypot(ball.x - r.x, ball.y - r.y) < 150) {
        r.x += (ball.x - r.x) * 0.16; r.y += (ball.y - r.y) * 0.16;
      }
      if (Math.hypot(ball.x - r.x, ball.y - r.y) < BALL_R + 16) {
        r.got = true; ringsGot++; addScore(100); S.ring();
        spawnBurst(r.x, r.y, TH().ring, 14); updateHud();
      }
    }

    // coins
    for (const c of level._coins) {
      if (c.got) continue;
      if (pull && Math.hypot(ball.x - c.x, ball.y - c.y) < 150) {
        c.x += (ball.x - c.x) * 0.16; c.y += (ball.y - c.y) * 0.16;
      }
      if (Math.hypot(ball.x - c.x, ball.y - c.y) < BALL_R + 14) {
        c.got = true; coinsGot++; addScore(50); S.coin();
        spawnBurst(c.x, c.y, TH().coin, 10);
      }
    }

    // power-ups
    for (const pw of level._powers) {
      if (pw.got) continue;
      if (Math.hypot(ball.x - pw.x, ball.y - pw.y) < BALL_R + 18) {
        pw.got = true;
        active[pw.type] = POWER_DUR[pw.type];
        addScore(75); S.power();
        spawnBurst(pw.x, pw.y, POWER_COLOR_OF(pw.type), 20);
        renderPowerbar();
      }
    }

    // goal
    if (Math.hypot(ball.x - level.goal.x, ball.y - level.goal.y) < BALL_R + 30) return winLevel();

    // trail
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 14) ball.trail.shift();

    // camera
    camX = ball.x - W * 0.34;
    if (camX < 0) camX = 0;
    if (camX > level.width - W) camX = Math.max(0, level.width - W);

    updateParticles();
  }

  function consumeShield() {
    if (active.shield > 0) {
      active.shield = 0;
      renderPowerbar();
      spawnBurst(ball.x, ball.y, TH().shield, 24);
      shake = 10;
      // bounce back up so the ball survives
      ball.vy = -JUMP_TAP;
      S.power();
      return true;
    }
    return false;
  }

  function die(reason) {
    S.hit();
    shake = 16;
    spawnBurst(ball.x, ball.y, TH().spike, 26);
    state.lives--;
    updateHud();
    state.running = false;
    if (state.lives <= 0) {
      S.gameover();
      overText.textContent = reason + ". No lives left. Score " + state.score + ".";
      show(overScreen);
    } else {
      overText.textContent = "";
      setTimeout(() => {
        const carryScore = state.score;
        loadLevel(state.level);
        state.score = carryScore;
        state.running = true;
        requestAnimationFrame(loop);
      }, 650);
    }
  }

  function starRating() {
    // 3 stars = all rings, 2 = >=60%, 1 = finished
    const pct = ringsTotal ? ringsGot / ringsTotal : 1;
    if (pct >= 1) return 3;
    if (pct >= 0.6) return 2;
    return 1;
  }

  function winLevel() {
    state.running = false;
    S.win();
    const stars = starRating();
    // rings & coins are already scored on pickup; add a flat level-clear bonus
    addScore(500);
    // save best stars for this level
    const prev = state.progress[state.level] || 0;
    state.progress[state.level] = Math.max(prev, stars);
    saveProgress(state.progress);

    starsEl.innerHTML = [1, 2, 3].map((n) => n <= stars ? "★" : "<span class='dim'>★</span>").join(" ");
    winText.textContent = `Rings ${ringsGot}/${ringsTotal} · Coins ${coinsGot} · Score ${state.score}`;
    spawnBurst(level.goal.x, level.goal.y, TH().goalInner, 30);

    if (state.level + 1 >= LEVELS.length) {
      clearText.textContent = `Final score ${state.score}. You mastered Neon Bounce.`;
      show(clearScreen);
    } else {
      show(winScreen);
    }
  }

  // ============================================================
  //  RENDER
  // ============================================================
  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();

    ctx.save();
    const sx = shake > 0.5 ? (Math.random() - 0.5) * shake : 0;
    const sy = shake > 0.5 ? (Math.random() - 0.5) * shake : 0;
    ctx.translate(-camX + sx, sy);

    if (level._movers) drawMovers();
    drawPlatforms();
    drawSpikes();
    if (level._saws) drawSaws();
    drawRings();
    drawCoins();
    drawPowers();
    drawGoal();
    drawParticles();
    drawBall();

    ctx.restore();
  }

  // glow amount — 0 in retro (flat), scaled value in neon
  function blur(n) { return TH().glow ? n : 0; }

  let bgOffset = 0;
  function drawBackground() {
    const th = TH();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, th.bgTop);
    g.addColorStop(1, th.bgBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    bgOffset = (camX * 0.4) % 80;
    ctx.strokeStyle = th.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -bgOffset; x < W; x += 80) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y < H; y += 80) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    const hg = ctx.createRadialGradient(W / 2, H * 0.2, 0, W / 2, H * 0.2, W * 0.7);
    hg.addColorStop(0, th.haze);
    hg.addColorStop(1, th.hazeEnd);
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, W, H);
  }

  function blockRect(x, y, w, h, fill, edge) {
    ctx.fillStyle = fill;
    roundRect(x, y, w, h, TH().glow ? 6 : 2); ctx.fill();
    ctx.strokeStyle = edge; ctx.lineWidth = 3;
    ctx.shadowColor = edge; ctx.shadowBlur = blur(16);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
    ctx.shadowBlur = 0;
    // retro: draw a solid outline so blocks read as chunky tiles
    if (!TH().glow) {
      ctx.lineWidth = 2;
      roundRect(x, y, w, h, 2); ctx.stroke();
    }
  }

  function drawPlatforms() {
    const th = TH();
    for (const p of level.platforms) blockRect(p.x, p.y, p.w, p.h, th.platformFill, th.platformEdge);
  }

  function drawMovers() {
    const th = TH();
    for (const m of level._movers) {
      ctx.fillStyle = th.moverFill;
      roundRect(m.x, m.y, m.w, m.h, th.glow ? 6 : 2); ctx.fill();
      ctx.strokeStyle = th.moverEdge; ctx.lineWidth = 2;
      ctx.shadowColor = th.moverEdge; ctx.shadowBlur = blur(16);
      roundRect(m.x, m.y, m.w, m.h, th.glow ? 6 : 2); ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  function drawSpikes() {
    const th = TH();
    for (const s of level.spikes) {
      const count = 3, seg = s.w / count;
      ctx.fillStyle = th.spike; ctx.shadowColor = th.spike; ctx.shadowBlur = blur(14);
      for (let i = 0; i < count; i++) {
        const bx = s.x + i * seg;
        ctx.beginPath(); ctx.moveTo(bx, s.y); ctx.lineTo(bx + seg / 2, s.y - 28); ctx.lineTo(bx + seg, s.y); ctx.closePath(); ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
  }

  function drawSaws() {
    const th = TH();
    for (const s of level._saws) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(tick * 0.2);
      ctx.fillStyle = th.saw; ctx.shadowColor = th.saw; ctx.shadowBlur = blur(18);
      const teeth = 8;
      ctx.beginPath();
      for (let i = 0; i < teeth * 2; i++) {
        const ang = (i / (teeth * 2)) * Math.PI * 2;
        const rad = i % 2 === 0 ? s.r : s.r * 0.6;
        ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = th.sawHub;
      ctx.beginPath(); ctx.arc(0, 0, s.r * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  function drawRings() {
    const th = TH();
    for (const r of level._rings) {
      if (r.got) continue;
      const pulse = 1 + Math.sin(goalPulse * 2 + r.x) * 0.12;
      ctx.strokeStyle = th.ring; ctx.lineWidth = 4;
      ctx.shadowColor = th.ring; ctx.shadowBlur = blur(16);
      ctx.beginPath(); ctx.arc(r.x, r.y, 13 * pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  function drawCoins() {
    const th = TH();
    for (const c of level._coins) {
      if (c.got) continue;
      const sq = Math.abs(Math.sin(tick * 0.08 + c.x));
      ctx.fillStyle = th.coin; ctx.shadowColor = th.coin; ctx.shadowBlur = blur(14);
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 9 * (0.4 + sq * 0.6), 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function drawPowers() {
    for (const pw of level._powers) {
      if (pw.got) continue;
      const col = POWER_COLOR_OF(pw.type);
      const pulse = 1 + Math.sin(goalPulse * 3) * 0.15;
      ctx.strokeStyle = col; ctx.lineWidth = 3;
      ctx.shadowColor = col; ctx.shadowBlur = blur(20);
      ctx.beginPath(); ctx.arc(pw.x, pw.y, 16 * pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(pw.x, pw.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function drawGoal() {
    const th = TH();
    const gx = level.goal.x, gy = level.goal.y;
    const pulse = 1 + Math.sin(goalPulse * 2) * 0.15;
    ctx.strokeStyle = th.goalPole; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(gx, gy - 40); ctx.lineTo(gx, gy + 120); ctx.stroke();
    ctx.strokeStyle = th.goalOuter; ctx.lineWidth = 6;
    ctx.shadowColor = th.goalOuter; ctx.shadowBlur = blur(24);
    ctx.beginPath(); ctx.arc(gx, gy, 30 * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = th.goalInner; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(gx, gy, 18 * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawParticles() {
    const doGlow = TH().glow;
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = doGlow ? 10 : 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }

  function drawBall() {
    const th = TH();
    // trail (skipped in retro for an authentic solid-ball look)
    if (th.glow) {
      for (let i = 0; i < ball.trail.length; i++) {
        const t = ball.trail[i];
        ctx.globalAlpha = (i / ball.trail.length) * 0.4;
        ctx.fillStyle = th.trail;
        ctx.beginPath(); ctx.arc(t.x, t.y, BALL_R * (i / ball.trail.length), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // shield aura
    if (active.shield > 0) {
      ctx.strokeStyle = th.shieldAura; ctx.lineWidth = 3;
      ctx.shadowColor = th.shield; ctx.shadowBlur = blur(20);
      ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R + 7 + Math.sin(tick * 0.2) * 2, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    const grad = ctx.createRadialGradient(ball.x - 5, ball.y - 5, 2, ball.x, ball.y, BALL_R);
    grad.addColorStop(0, th.ballIn); grad.addColorStop(0.5, th.ballMid); grad.addColorStop(1, th.ballOut);
    ctx.fillStyle = grad; ctx.shadowColor = th.ballMid; ctx.shadowBlur = blur(22);
    ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // retro: classic dark rim + two spin dots like the Nokia ball
    if (!th.glow) {
      ctx.strokeStyle = th.ballOut; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = th.ballLine;
      for (const off of [0, Math.PI]) {
        const dx = Math.cos(ball.spin + off) * BALL_R * 0.5;
        const dy = Math.sin(ball.spin + off) * BALL_R * 0.5;
        ctx.beginPath(); ctx.arc(ball.x + dx, ball.y + dy, 3, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.strokeStyle = th.ballLine; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(ball.x, ball.y);
      ctx.lineTo(ball.x + Math.cos(ball.spin) * BALL_R * 0.7, ball.y + Math.sin(ball.spin) * BALL_R * 0.7);
      ctx.stroke();
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ============================================================
  //  HUD / POWERBAR / SCREENS
  // ============================================================
  function updateHud() {
    hudLevel.textContent = state.level + 1;
    hudRings.textContent = `${ringsGot}/${ringsTotal}`;
    hudScore.textContent = state.score;
    hudLives.textContent = state.lives;
  }

  function renderPowerbar() {
    const chips = [];
    for (const k of ["shield", "magnet", "slow"]) {
      if (active[k] > 0) {
        const secs = Math.ceil(active[k] / 60);
        chips.push(`<div class="pwr-chip" style="color:${POWER_COLOR_OF(k)}">${POWER_LABEL[k]} ${secs}</div>`);
      }
    }
    if (chips.length) {
      powerbar.innerHTML = chips.join("");
      powerbar.classList.remove("hidden");
    } else {
      powerbar.innerHTML = "";
      powerbar.classList.add("hidden");
    }
  }

  function show(el) { hideAll(); el.classList.remove("hidden"); }
  function hideAll() { overlays.forEach((e) => e.classList.add("hidden")); }

  function openLevelSelect() {
    levelGrid.innerHTML = "";
    LEVELS.forEach((lv, i) => {
      const cell = document.createElement("button");
      const open = unlocked(i);
      cell.className = "level-cell" + (open ? "" : " locked");
      if (open) {
        const stars = state.progress[i] || 0;
        cell.innerHTML = `${i + 1}<span class="cell-stars">${"★".repeat(stars)}${"·".repeat(3 - stars)}</span>`;
        cell.addEventListener("click", () => { S.unlock(); S.click(); state.level = i; startGame(); });
      } else {
        cell.innerHTML = `<span class="lock">🔒</span>`;
      }
      levelGrid.appendChild(cell);
    });
    show(levelselectScreen);
  }

  // ============================================================
  //  FLOW
  // ============================================================
  function startGame() {
    hideAll();
    hud.classList.remove("hidden");
    state.lives = 3;
    state.score = 0;
    state.paused = false;
    loadLevel(state.level);
    if (S.isEnabled()) S.startMusic();
    state.running = true;
    requestAnimationFrame(loop);
  }

  function nextLevel() {
    state.level++;
    hideAll();
    loadLevel(state.level);
    state.paused = false;
    state.running = true;
    requestAnimationFrame(loop);
  }

  function retryLevel() {
    hideAll();
    state.lives = 3;
    loadLevel(state.level);
    state.paused = false;
    state.running = true;
    requestAnimationFrame(loop);
  }

  function pauseGame() {
    if (!state.running || state.paused) return;
    state.paused = true;
    S.click();
    S.stopMusic();
    show(pauseScreen);
  }

  function resumeGame() {
    if (!state.paused) return;
    hideAll();
    state.paused = false;
    S.click();
    if (S.isEnabled()) S.startMusic();
    requestAnimationFrame(loop);
  }

  function quitToMenu() {
    state.running = false;
    state.paused = false;
    S.stopMusic();
    S.click();
    hud.classList.add("hidden");
    powerbar.classList.add("hidden");
    show(startScreen);
    loadLevel(state.level);
    draw();
  }

  // ============================================================
  //  MAIN LOOP
  // ============================================================
  function loop() {
    update();
    draw();
    if (state.running && !state.paused) requestAnimationFrame(loop);
  }

  // init: sound + theme labels + static frame behind menu
  btnSound.textContent = "SOUND: " + (S.isEnabled() ? "ON" : "OFF");
  updateThemeLabel();
  loadLevel(0);
  draw();
})();
