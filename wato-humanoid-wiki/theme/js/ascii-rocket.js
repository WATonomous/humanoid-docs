// The TVC rocket "Pioneer" lifting off, drawn as colour ASCII behind the rocketry pages.
// A small scene (rocket, flame, sparks, smoke, stars) is painted on an offscreen canvas at
// two pixels per character cell; each cell then becomes one character whose shape comes from
// the brightness and whose colour comes from the pixels under it.
//
// <canvas data-ascii-rocket> turns into one. Pages opt in with `ascii: rocket` in front matter.

(() => {
  const canvas = document.querySelector('canvas[data-ascii-rocket]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const RAMP = ' .,:;-=+*%#@';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const off = document.createElement('canvas');
  const octx = off.getContext('2d', {willReadFrequently: true});
  const glow = document.createElement('canvas');
  const gctx = glow.getContext('2d');
  let cols, rows, cellW, cellH, W, H, w, h;
  let dark = false;
  let opacity = 0.7;

  function readTheme() {
    dark = document.documentElement.getAttribute('data-theme') === 'dark';
    opacity = parseFloat(getComputedStyle(canvas).getPropertyValue('--ascii-opacity')) || 0.7;
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width;
    h = r.height;
    for (const c of [canvas, glow]) {
      c.width = w * dpr;
      c.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cellH = 11;
    cellW = cellH * 0.6;
    cols = Math.floor(w / cellW);
    rows = Math.floor(h / cellH);
    W = off.width = cols * 2;
    H = off.height = rows * 2;
  }

  // ---- particles ---------------------------------------------------------------
  const sparks = [];
  const smoke = [];
  const stars = Array.from({length: 70}, () => ({x: Math.random(), y: Math.random() * 0.75, p: Math.random() * 6.28}));
  let seed = 1;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // ---- scene --------------------------------------------------------------------
  function paint(t, dt) {
    octx.clearRect(0, 0, W, H);
    // rocket pose: climbs slowly up the canvas and loops; the TVC gimbal makes it wobble
    const cycle = (t * 0.035) % 1;
    const cx = W * 0.6 + Math.sin(t * 0.7) * W * 0.012;
    const top = H * (0.2 - cycle * 0.12);
    const len = H * 0.34;
    const bw = Math.max(8, W * 0.1);
    const tilt = Math.sin(t * 1.3) * 0.05;
    const nozzle = {x: cx - Math.sin(tilt) * len, y: top + Math.cos(tilt) * len};

    // stars
    for (const s of stars) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.5 + s.p));
      octx.fillStyle = `rgba(${dark ? '200,220,255' : '90,110,170'},${a})`;
      octx.fillRect(s.x * W, s.y * H, 1, 1);
    }

    // smoke billowing at the bottom
    if (!reduce || smoke.length < 40) {
      if (rnd() < 0.5) smoke.push({x: nozzle.x + (rnd() - 0.5) * bw, y: nozzle.y + H * 0.5, vx: (rnd() - 0.5) * W * 0.08, vy: -rnd() * H * 0.02, r: bw * 0.3, life: 1});
    }
    for (const p of smoke) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.r += bw * 0.5 * dt;
      p.life -= dt * 0.5;
      const g = octx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      const c = dark ? '150,150,165' : '120,120,135';
      g.addColorStop(0, `rgba(${c},${0.18 * p.life})`);
      g.addColorStop(1, `rgba(${c},0)`);
      octx.fillStyle = g;
      octx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    while (smoke.length && smoke[0].life <= 0) smoke.shift();

    // flame plume: layered teardrops, white-hot core to red edge, flickering
    const flick = 0.85 + 0.15 * Math.sin(t * 31) * Math.sin(t * 17);
    const plume = H * 0.5 * flick;
    const layers = [
      [1.0, 2.6, '255,40,90'],
      [0.9, 2.1, '255,70,20'],
      [0.75, 1.6, '255,140,0'],
      [0.55, 1.1, '255,215,0'],
      [0.3, 0.6, '255,255,230'],
    ];
    for (const [lk, wk, col] of layers) {
      const L = plume * lk;
      const R = bw * 0.5 * wk;
      const g = octx.createLinearGradient(0, nozzle.y, 0, nozzle.y + L);
      g.addColorStop(0, `rgba(${col},1)`);
      g.addColorStop(1, `rgba(${col},0)`);
      octx.fillStyle = g;
      octx.beginPath();
      octx.moveTo(nozzle.x - R * 0.6, nozzle.y);
      octx.quadraticCurveTo(nozzle.x - R * 1.1, nozzle.y + L * 0.35, nozzle.x + Math.sin(t * 9) * R * 0.3, nozzle.y + L);
      octx.quadraticCurveTo(nozzle.x + R * 1.1, nozzle.y + L * 0.35, nozzle.x + R * 0.6, nozzle.y);
      octx.fill();
    }

    // sparks thrown out of the exhaust
    for (let i = 0; i < (reduce ? 0 : 30); i++) {
      sparks.push({x: nozzle.x + (rnd() - 0.5) * bw * 0.8, y: nozzle.y + rnd() * plume * 0.4, vx: (rnd() - 0.5) * W * 0.45, vy: H * (0.2 + rnd() * 0.6), life: 1});
    }
    for (const s of sparks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy -= H * 0.15 * dt;
      s.life -= dt * (0.9 + rnd() * 0.6);
      const l = Math.max(0, s.life);
      const col = l > 0.75 ? '255,250,210' : l > 0.5 ? '255,200,0' : l > 0.25 ? '255,100,20' : '255,40,120';
      octx.fillStyle = `rgba(${col},${l})`;
      octx.fillRect(s.x, s.y, 2, 2);
    }
    for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].life <= 0) sparks.splice(i, 1);

    // the rocket itself: silver body, black nose cone, black bands, fins (like the real one)
    octx.save();
    octx.translate(nozzle.x, nozzle.y);
    octx.rotate(tilt);
    const body = octx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    body.addColorStop(0, '#7d838b');
    body.addColorStop(0.35, '#f1f3f5');
    body.addColorStop(1, '#8a9099');
    octx.fillStyle = body;
    octx.fillRect(-bw / 2, -len * 0.85, bw, len * 0.85);
    octx.fillStyle = '#141414';
    octx.beginPath(); // nose cone
    octx.moveTo(-bw / 2, -len * 0.85);
    octx.quadraticCurveTo(0, -len * 1.18, bw / 2, -len * 0.85);
    octx.fill();
    octx.fillRect(-bw / 2, -len * 0.55, bw, len * 0.035); // bands
    octx.fillRect(-bw / 2, -len * 0.5, bw, len * 0.035);
    octx.fillRect(-bw * 0.12, -len * 0.3, bw * 0.24, len * 0.3); // stripe
    octx.beginPath(); // fins
    octx.moveTo(-bw / 2, -len * 0.16);
    octx.lineTo(-bw * 0.95, 0);
    octx.lineTo(-bw / 2, 0);
    octx.moveTo(bw / 2, -len * 0.16);
    octx.lineTo(bw * 0.95, 0);
    octx.lineTo(bw / 2, 0);
    octx.fill();
    octx.restore();
  }

  // ---- ascii --------------------------------------------------------------------
  function render(t, dt) {
    paint(t, dt);
    const px = octx.getImageData(0, 0, W, H).data;
    ctx.clearRect(0, 0, w, h);
    gctx.clearRect(0, 0, w, h);
    gctx.font = `700 ${cellH}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    gctx.textBaseline = 'top';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let R = 0, G = 0, B = 0, A = 0;
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const i = ((r * 2 + dy) * W + c * 2 + dx) * 4;
            const a = px[i + 3] / 255;
            R += px[i] * a; G += px[i + 1] * a; B += px[i + 2] * a; A += a;
          }
        }
        if (A < 0.25) continue;
        R /= A; G /= A; B /= A;
        const lum = (0.3 * R + 0.59 * G + 0.11 * B) / 255;
        const cover = Math.min(1, A / 4);
        let v = lum * (0.4 + 0.6 * cover);
        // dark parts (nose cone, bands) still need a solid glyph to read as shape
        if (lum < 0.15) v = 0.75;
        const ch = RAMP[Math.max(1, Math.min(RAMP.length - 1, Math.round(v * (RAMP.length - 1))))];
        // on a light page, greys must be dark to show; colours stay vivid
        const sat = Math.max(R, G, B) - Math.min(R, G, B);
        if (!dark && sat < 40) {
          const k = lum < 0.15 ? 0.25 : 0.55;
          R *= k; G *= k; B *= k;
        }
        gctx.globalAlpha = Math.min(1, 0.35 + cover * 0.8);
        gctx.fillStyle = `rgb(${R | 0},${G | 0},${B | 0})`;
        gctx.fillText(ch, c * cellW, r * cellH);
      }
    }
    // bloom: a blurred copy underneath, then the crisp characters
    ctx.globalAlpha = opacity * (dark ? 1 : 0.7);
    ctx.filter = 'blur(8px)';
    ctx.drawImage(glow, 0, 0, w, h);
    ctx.drawImage(glow, 0, 0, w, h);
    ctx.filter = 'none';
    ctx.globalAlpha = opacity;
    ctx.drawImage(glow, 0, 0, w, h);
    ctx.globalAlpha = 1;
  }

  readTheme();
  resize();
  addEventListener('resize', resize);
  document.addEventListener('themechange', readTheme);
  canvas.classList.add('ready');
  const start = performance.now();
  let last = start;
  let lastDraw = 0;
  function loop(now) {
    if (!document.hidden && now - lastDraw > 1000 / 30) {
      render((now - start) / 1000, Math.min(0.05, (now - last) / 1000));
      lastDraw = now;
    }
    last = now;
    if (!reduce) requestAnimationFrame(loop);
  }
  if (reduce) {
    for (let i = 0; i < 40; i++) paint(3 + i * 0.03, 0.03);
    render(4.2, 0.03);
  } else requestAnimationFrame(loop);
})();
