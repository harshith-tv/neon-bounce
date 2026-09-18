/* ============================================================
   NEON BOUNCE - Audio engine
   Procedural Web Audio sound effects + a light background pulse.
   No audio files needed. Exposes window.Sound.
   ============================================================ */

(() => {
  "use strict";

  let ctx = null;
  let master = null;
  let musicGain = null;
  let enabled = (localStorage.getItem("neonbounce_sound") ?? "on") === "on";
  let musicTimer = null;
  let musicStep = 0;

  function ensureCtx() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.12;
    musicGain.connect(master);
  }

  // must be called from a user gesture to unlock audio on mobile
  function unlock() {
    ensureCtx();
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  function tone({ freq = 440, type = "sine", dur = 0.15, vol = 0.3, glideTo = null, delay = 0 }) {
    if (!enabled || !ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise({ dur = 0.2, vol = 0.3 }) {
    if (!enabled || !ctx) return;
    const t0 = ctx.currentTime;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1800;
    src.connect(lp);
    lp.connect(g);
    g.connect(master);
    src.start(t0);
  }

  const Sound = {
    unlock,

    isEnabled() { return enabled; },

    setEnabled(v) {
      enabled = v;
      localStorage.setItem("neonbounce_sound", v ? "on" : "off");
      if (!v) this.stopMusic();
    },

    toggle() {
      this.setEnabled(!enabled);
      return enabled;
    },

    jump() { tone({ freq: 300, glideTo: 620, type: "square", dur: 0.14, vol: 0.22 }); },

    land() { tone({ freq: 180, glideTo: 90, type: "sine", dur: 0.12, vol: 0.25 }); },

    ring() {
      tone({ freq: 880, type: "triangle", dur: 0.1, vol: 0.25 });
      tone({ freq: 1320, type: "triangle", dur: 0.12, vol: 0.2, delay: 0.05 });
    },

    coin() { tone({ freq: 1046, glideTo: 1568, type: "square", dur: 0.12, vol: 0.18 }); },

    power() {
      tone({ freq: 440, glideTo: 1200, type: "sawtooth", dur: 0.28, vol: 0.2 });
      tone({ freq: 660, glideTo: 1600, type: "triangle", dur: 0.3, vol: 0.15, delay: 0.04 });
    },

    hit() {
      noise({ dur: 0.3, vol: 0.35 });
      tone({ freq: 220, glideTo: 60, type: "sawtooth", dur: 0.3, vol: 0.25 });
    },

    win() {
      const notes = [523, 659, 784, 1046];
      notes.forEach((f, i) => tone({ freq: f, type: "triangle", dur: 0.18, vol: 0.25, delay: i * 0.1 }));
    },

    gameover() {
      const notes = [440, 349, 262];
      notes.forEach((f, i) => tone({ freq: f, type: "sawtooth", dur: 0.3, vol: 0.22, delay: i * 0.14 }));
    },

    click() { tone({ freq: 660, type: "square", dur: 0.06, vol: 0.15 }); },

    // light arpeggiated background pulse
    startMusic() {
      if (!enabled || !ctx || musicTimer) return;
      const scale = [130.8, 164.8, 196.0, 261.6, 196.0, 164.8];
      musicStep = 0;
      musicTimer = setInterval(() => {
        if (!enabled) return;
        const f = scale[musicStep % scale.length];
        const t0 = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42);
        osc.connect(g);
        g.connect(musicGain);
        osc.start(t0);
        osc.stop(t0 + 0.45);
        musicStep++;
      }, 460);
    },

    stopMusic() {
      if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
      }
    },
  };

  window.Sound = Sound;
})();
