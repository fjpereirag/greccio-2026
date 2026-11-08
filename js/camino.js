/* Greccio 2026 · el camino (canvas 2D, sin librerías)
   Versión dinámica: vuelo de entrada desde la estrella, estelas de luz al viajar, destello al llegar a cada imagen,
   marcos con luz que los recorre, fotos vivas (zoom lento), rayos y lluvia de oro ante el Belén final. */
(() => {
  const S = window.GRECCIO || (window.GRECCIO = { tone: 0, reduce: false });
  const cv = document.getElementById('camino'), cx = cv.getContext('2d');
  // I: Greccio, 1223 · después, la Parroquia Cristo de la Paz hoy · al final, el Belén «Navidad 2026»
  const SRC = ['img/01-vela.webp',
    'img/p-belen-viviente.webp', 'img/p-misa-ninos.webp', 'img/p-jovenes.webp', 'img/p-fachada.webp',
    'img/05-portal.webp'];
  const LAST = SRC.length - 1;
  const imgs = SRC.map(src => { const i = new Image(); i.decoding = 'async'; i.src = src; return i; });

  const SPACING = 16, HOLD = 6, CAM_Y = 1;
  const pathX = (z) => Math.sin(z * .16) * .9 + Math.sin(z * .053 + 1.3) * 1.6;
  const ease = (t) => t * t * (3 - 2 * t), clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  let W = 0, H = 0, DPR = 1, F = 1, HOR = 0, CXs = 0, stars = [];
  const resize = () => {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const portrait = W < H;
    F = portrait ? H * .95 : H * 1.25;
    HOR = H * (portrait ? .30 : .36);
    CXs = W * .5;
    stars = Array.from({ length: Math.round(W * H / 2200) }, () => ({ x: Math.random() * W, y: Math.random() * HOR * 1.05, r: Math.random() * 1.1 + .25, p: Math.random() * 6.28, s: .6 + Math.random() * 1.6 }));
  };
  addEventListener('resize', resize); resize();

  // polvo de luz en el mundo: flota despacio; al viajar se estira en estelas
  const dust = Array.from({ length: 240 }, () => ({ x: (Math.random() - .5) * 26, y: -.5 + Math.random() * 9, z: Math.random() * 70, s: Math.random(), w: Math.random() * 6.28 }));
  // bruma baja
  const mist = Array.from({ length: 80 }, () => { const z = Math.random() * SPACING * 6, side = Math.random() < .5 ? -1 : 1;
    return { z, x: pathX(z) + side * (1.2 + Math.random() * 9), y: -.6 + Math.random() * 1.4, r: 1.6 + Math.random() * 3.2, warm: Math.random() }; });
  // chispas de oro (pantalla) para la llegada al Belén
  let sparks = [];
  const burst = (x, y, n) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = 80 + Math.random() * 420;
    sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 1, d: .5 + Math.random() * 1.1, r: .8 + Math.random() * 2.2 }); } };

  const aspect = (i) => { const im = imgs[i]; return im.naturalWidth ? im.naturalHeight / im.naturalWidth : 1.68; };
  const finalPW = () => Math.min(W, H * .96 / aspect(LAST));
  const stationW = (i) => (i === LAST ? finalPW() : Math.min((W < H ? (i >= 1 ? .74 : .5) : (i >= 1 ? .32 : .24)) * W, H * .46 / aspect(i))) * HOLD / F;
  const stationY = (i) => CAM_Y - (H * (i === LAST ? .5 : .355) - HOR) * HOLD / F;
  const project = (x, y, z, cam) => { const d = z - cam.z; if (d <= .05) return null; const k = F / d; return { x: CXs + (x - cam.x) * k, y: HOR - (y - cam.y) * k, k, d }; };

  const rrect = (x, y, w, h, r) => { cx.beginPath(); if (cx.roundRect) cx.roundRect(x, y, w, h, r); else cx.rect(x, y, w, h); };
  // punto sobre el perímetro de un rectángulo (u de 0 a 1)
  const perim = (x, y, w, h, u) => { const P = 2 * (w + h); let d = ((u % 1) + 1) % 1 * P;
    if (d < w) return [x + d, y]; d -= w; if (d < h) return [x + w, y + d]; d -= h; if (d < w) return [x + w - d, y + h]; d -= w; return [x, y + h - d]; };

  let camZ = -110, camXs = 0, t = 0, last = performance.now(), speed = 0, arrived = -1, flash = 0, shine = 1, wasMoving = false, finalBurst = false;
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const reduce = S.reduce; t += reduce ? 0 : dt;

    /* cámara */
    const tone = S.tone, i = Math.min(LAST, Math.floor(tone)), f = tone - i;
    const k = i >= LAST ? 0 : ease(clamp((f - .15) / .7, 0, 1));
    let target = (i + k) * SPACING;
    if (!S.entered) target = -110 + Math.sin(t * .3) * 2;          // antes de entrar: lejos, esperando
    const prevZ = camZ;
    const rate = S.entered && camZ < -2 ? 1.25 : 2.4;              // el vuelo de entrada, más largo
    camZ += (target - camZ) * (reduce ? 1 : Math.min(1, dt * rate));
    speed += (((camZ - prevZ) / Math.max(dt, .001)) - speed) * Math.min(1, dt * 8);
    const warp = clamp(Math.abs(speed) / 26, 0, 1);
    const cam = { z: camZ, y: CAM_Y, x: 0 };
    camXs += (pathX(camZ + HOLD) - camXs) * (reduce ? 1 : Math.min(1, dt * 2.4)); cam.x = camXs;

    // salida (susurro de viento) y llegada (destello)
    const moving = warp > .25;
    if (moving && !wasMoving && S.entered) S.whoosh && S.whoosh(warp);
    wasMoving = moving;
    const atStation = Math.round(camZ / SPACING);
    if (S.entered && Math.abs(camZ - atStation * SPACING) < .5 && warp < .12 && atStation !== arrived && atStation >= 0) {
      arrived = atStation; if (!reduce) { flash = atStation === LAST ? 1.25 : .8; shine = 0; }
      if (atStation === LAST && !finalBurst && !reduce) { finalBurst = true; burst(W / 2, H * .5, 160); }
    }
    if (arrived !== LAST) finalBurst = false;
    flash = Math.max(0, flash - dt * 1.3); shine = Math.min(1, shine + dt * .7);

    /* cielo */
    const sky = cx.createLinearGradient(0, 0, 0, HOR);
    sky.addColorStop(0, '#030612'); sky.addColorStop(.55, '#0A1736'); sky.addColorStop(1, '#1A2D58');
    cx.fillStyle = sky; cx.fillRect(0, 0, W, HOR + 1);
    const ground = cx.createLinearGradient(0, HOR, 0, H);
    ground.addColorStop(0, '#121E3A'); ground.addColorStop(.25, '#070B16'); ground.addColorStop(1, '#020308');
    cx.fillStyle = ground; cx.fillRect(0, HOR, W, H - HOR);
    for (const s of stars) { const a = .3 + .7 * (reduce ? .7 : (.5 + .5 * Math.sin(t * s.s + s.p)));
      cx.globalAlpha = a; cx.fillStyle = '#F4F1FF';
      if (warp > .2) { cx.fillRect(s.x, s.y, s.r, s.r * (1 + warp * 6)); } else { cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 6.283); cx.fill(); } }
    cx.globalAlpha = 1;

    /* la estrella de Belén, con destello anamórfico */
    const sx = CXs + (pathX(camZ + 400) - cam.x) * F / 400, sy = H * (W < H ? .12 : .13);
    const sr = Math.min(W, H) * (.5 + .18 * Math.min(1, Math.max(0, tone) / LAST)) * (1 + warp * .25);
    let g = cx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    g.addColorStop(0, 'rgba(255,250,235,.95)'); g.addColorStop(.06, 'rgba(255,236,190,.6)'); g.addColorStop(.25, 'rgba(242,210,150,.16)'); g.addColorStop(1, 'rgba(242,210,150,0)');
    cx.fillStyle = g; cx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    const hz = project(pathX(camZ + 300), 0, camZ + 300, cam);
    if (hz) { const bg = cx.createLinearGradient(sx, sy, hz.x, HOR); bg.addColorStop(0, 'rgba(255,240,200,.38)'); bg.addColorStop(1, 'rgba(255,240,200,0)');
      cx.fillStyle = bg; cx.beginPath(); cx.moveTo(sx - 3, sy); cx.lineTo(hz.x - W * .1, HOR); cx.lineTo(hz.x + W * .1, HOR); cx.lineTo(sx + 3, sy); cx.fill(); }
    const breathe = reduce ? 1 : 1 + Math.sin(t * 1.2) * .07;
    cx.save(); cx.translate(sx, sy); cx.globalCompositeOperation = 'lighter';
    // raya anamórfica (azulada, de lado a lado)
    const an = cx.createLinearGradient(-W * .7, 0, W * .7, 0);
    an.addColorStop(0, 'rgba(120,170,255,0)'); an.addColorStop(.5, `rgba(190,215,255,${.55 + warp * .3})`); an.addColorStop(1, 'rgba(120,170,255,0)');
    cx.fillStyle = an; cx.fillRect(-W * .7, -1.2, W * 1.4, 2.4);
    [[0, 1.0], [Math.PI / 2, .78], [Math.PI / 4, .4], [-Math.PI / 4, .4]].forEach(([a, l]) => {
      cx.save(); cx.rotate(a + (reduce ? 0 : t * .03)); const L = sr * .66 * l * breathe;
      const lg = cx.createLinearGradient(0, -L, 0, L); lg.addColorStop(0, 'rgba(255,245,220,0)'); lg.addColorStop(.5, 'rgba(255,248,230,.95)'); lg.addColorStop(1, 'rgba(255,245,220,0)');
      cx.fillStyle = lg; cx.beginPath(); cx.moveTo(0, -L); cx.lineTo(2.8, 0); cx.lineTo(0, L); cx.lineTo(-2.8, 0); cx.fill(); cx.restore(); });
    // anillos de lente
    cx.strokeStyle = 'rgba(255,220,170,.10)'; cx.lineWidth = 1.2;
    for (const rr of [.16, .3]) { cx.beginPath(); cx.arc(0, 0, sr * rr * breathe, 0, 6.283); cx.stroke(); }
    cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(0, 0, 3.6, 0, 6.283); cx.fill();
    cx.restore();

    /* bruma */
    const drawMist = (near) => {
      for (const m of mist) {
        let z = m.z; while (z < camZ + .5) z += SPACING * 6;
        const dz = z - camZ; if ((dz < 12) !== near) continue;
        const p = project(m.x + (reduce ? 0 : Math.sin(t * .07 + m.z) * .5), m.y, z, cam); if (!p) continue;
        const r = m.r * p.k; if (r < 2) continue;
        const a = clamp((dz - 1.5) / 6, 0, 1) * clamp(1 - dz / 90, 0, 1) * .5;
        const gg = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        const c = m.warm > .7 ? '130,108,96' : '72,90,130';
        gg.addColorStop(0, `rgba(${c},${a})`); gg.addColorStop(.6, `rgba(${c},${a * .35})`); gg.addColorStop(1, `rgba(${c},0)`);
        cx.fillStyle = gg; cx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      }
    };
    drawMist(false);

    /* el camino: más brillo al viajar */
    const pts = [];
    for (let s = 0; s < 220; s++) { const z = camZ + .6 + Math.pow(s / 219, 2.2) * 320; const p = project(pathX(z), 0, z, cam); if (p) pts.push(p); }
    cx.save(); cx.globalCompositeOperation = 'lighter';
    const boost = 1 + warp * .8;
    for (const [mult, col] of [[9, `rgba(242,170,80,${.06 * boost})`], [3.5, `rgba(255,200,120,${.2 * boost})`], [1, 'rgba(255,238,196,.97)']]) {
      cx.strokeStyle = col; cx.lineCap = mult === 1 ? 'round' : 'butt';
      for (let s = 1; s < pts.length; s++) {
        const a = pts[s - 1], b = pts[s];
        cx.lineWidth = clamp(.075 * b.k * mult, 1, mult === 9 ? 30 : mult === 3.5 ? 11 : 4.2);
        cx.globalAlpha = clamp(1 - b.d / 330, 0, 1);
        cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
      }
    }
    // pulsos que corren hacia la estrella
    if (!reduce) for (let n = 0; n < 18; n++) {
      const z = camZ + 1 + ((t * (6 + warp * 30) + n * 7) % 126); const p = project(pathX(z), .02, z, cam); if (!p) continue;
      const r = clamp(.09 * p.k, 1, 3.4); cx.globalAlpha = clamp(1 - p.d / 126, 0, 1) * clamp((p.d - 1.5) / 4, 0, 1);
      const pg = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4); pg.addColorStop(0, 'rgba(255,250,235,1)'); pg.addColorStop(1, 'rgba(255,220,150,0)');
      cx.fillStyle = pg; cx.fillRect(p.x - r * 4, p.y - r * 4, r * 8, r * 8);
    }
    cx.restore(); cx.globalAlpha = 1;

    /* rayos detrás del Belén final */
    const finalNear = clamp((camZ - (LAST - .9) * SPACING) / (.9 * SPACING), 0, 1);
    if (finalNear > 0) {
      const pz = LAST * SPACING + HOLD, pp = project(pathX(pz), stationY(LAST), pz, cam);
      if (pp) { cx.save(); cx.translate(pp.x, pp.y); cx.globalCompositeOperation = 'lighter'; cx.rotate(reduce ? 0 : t * .05);
        const R = Math.max(W, H) * 1.1;
        for (let n = 0; n < 18; n++) { cx.rotate(6.283 / 18); const rg = cx.createLinearGradient(0, 0, 0, -R);
          rg.addColorStop(0, `rgba(255,214,140,${.22 * finalNear})`); rg.addColorStop(1, 'rgba(255,214,140,0)');
          cx.fillStyle = rg; cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(-R * .07, -R); cx.lineTo(R * .07, -R); cx.fill(); }
        cx.restore(); }
    }

    /* estaciones */
    for (let j = imgs.length - 1; j >= 0; j--) {
      const z = j * SPACING + HOLD, dz = z - camZ;
      if (dz < .8 || dz > 150) continue;
      const im = imgs[j]; if (!im.complete || !im.naturalWidth) continue;
      const w = stationW(j), h = w * aspect(j), yc = stationY(j);
      const p = project(pathX(z), yc, z, cam); if (!p) continue;
      const pw = w * p.k, ph = h * p.k;
      const alpha = clamp((dz - 1.2) / 2.6, 0, 1) * clamp(1 - (dz - 60) / 90, 0, 1);
      if (alpha <= 0) continue;
      const isFinal = j === LAST;
      cx.save(); cx.translate(p.x, p.y);
      // inclinación suave hacia el camino (sensación de 3D) y vaivén
      if (!isFinal && !reduce) cx.rotate(clamp((p.x - CXs) / W, -.6, .6) * .1 + Math.sin(t * .5 + j) * .006);
      // resplandor
      cx.globalAlpha = alpha * .95;
      const gr = cx.createRadialGradient(0, 0, 0, 0, 0, Math.max(pw, ph) * .8);
      gr.addColorStop(0, 'rgba(255,190,110,.36)'); gr.addColorStop(1, 'rgba(255,190,110,0)');
      cx.fillStyle = gr; cx.fillRect(-pw * 1.5, -ph, pw * 3, ph * 2);
      // foto viva: zoom lento dentro del marco
      cx.globalAlpha = alpha;
      const rad = isFinal ? 0 : Math.min(pw, ph) * .045;
      const zoom = reduce ? 1 : 1.03 + .05 * (.5 + .5 * Math.sin(t * .12 + j * 1.7));
      const iw = im.naturalWidth, ih = im.naturalHeight, cw = iw / (isFinal ? 1 : zoom), ch = ih / (isFinal ? 1 : zoom);
      const ox = (iw - cw) * (.5 + (reduce ? 0 : Math.sin(t * .09 + j) * .35)), oy = (ih - ch) * .5;
      cx.save(); rrect(-pw / 2, -ph / 2, pw, ph, rad); cx.clip();
      cx.drawImage(im, ox, oy, cw, ch, -pw / 2, -ph / 2, pw, ph);
      // barrido de brillo al llegar
      if (shine < 1 && j === arrived) {
        const sxp = -pw + shine * pw * 3;
        const sg = cx.createLinearGradient(sxp - pw * .3, -ph / 2, sxp + pw * .3, ph / 2);
        sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,246,220,.35)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
        cx.globalCompositeOperation = 'lighter'; cx.fillStyle = sg; cx.fillRect(-pw / 2, -ph / 2, pw, ph);
      }
      cx.restore();
      if (!isFinal) {
        // marco dorado y una luz que lo recorre
        cx.strokeStyle = 'rgba(217,178,106,.8)'; cx.lineWidth = Math.max(.6, .014 * p.k);
        rrect(-pw / 2, -ph / 2, pw, ph, rad); cx.stroke();
        if (!reduce) { cx.globalCompositeOperation = 'lighter';
          for (const off of [0, .5]) { const [qx, qy] = perim(-pw / 2, -ph / 2, pw, ph, t * .12 + j * .21 + off);
            const lr = Math.max(6, pw * .09), lg = cx.createRadialGradient(qx, qy, 0, qx, qy, lr);
            lg.addColorStop(0, 'rgba(255,250,230,.95)'); lg.addColorStop(.3, 'rgba(255,214,140,.5)'); lg.addColorStop(1, 'rgba(255,214,140,0)');
            cx.fillStyle = lg; cx.fillRect(qx - lr, qy - lr, lr * 2, lr * 2); }
          cx.globalCompositeOperation = 'source-over'; }
      }
      // reflejo
      cx.globalAlpha = alpha * .12;
      cx.save(); cx.translate(0, ph / 2); cx.scale(1, -.35); cx.drawImage(im, -pw / 2, -ph, pw, ph); cx.restore();
      cx.restore(); cx.globalAlpha = 1;
    }
    drawMist(true);

    /* polvo de luz: puntos que flotan, estelas al viajar */
    if (!reduce) {
      cx.save(); cx.globalCompositeOperation = 'lighter'; cx.lineCap = 'round';
      const trail = clamp(speed * .055, -3, 9);
      for (const d of dust) {
        while (d.z < camZ + .4) { d.z += 70; d.x = (Math.random() - .5) * 26; }
        while (d.z > camZ + 70.4) d.z -= 70;
        const y = d.y + Math.sin(t * .6 + d.w) * .15;
        const p = project(d.x + pathX(d.z) * .5, y, d.z, cam); if (!p) continue;
        const a = clamp(1 - p.d / 70, 0, 1) * clamp((p.d - .6) / 3, 0, 1) * (.35 + d.s * .5);
        if (warp > .08) { const q = project(d.x + pathX(d.z) * .5, y, d.z + trail, cam); if (!q) continue;
          cx.strokeStyle = `rgba(255,${200 + d.s * 50 | 0},${150 + d.s * 80 | 0},${a * (.4 + warp * .6)})`;
          cx.lineWidth = clamp(.02 * p.k, .6, 2.6); cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(q.x, q.y); cx.stroke(); }
        else { const r = clamp(.025 * p.k, .5, 2.4); cx.fillStyle = `rgba(255,226,170,${a * (.5 + .5 * Math.sin(t * 2 + d.w))})`;
          cx.beginPath(); cx.arc(p.x, p.y, r, 0, 6.283); cx.fill(); }
      }
      cx.restore();
    }

    /* chispas de oro */
    if (sparks.length) {
      cx.save(); cx.globalCompositeOperation = 'lighter';
      sparks = sparks.filter(s => (s.life -= dt / s.d) > 0);
      for (const s of sparks) { s.vy += 260 * dt; s.vx *= .985; s.x += s.vx * dt; s.y += s.vy * dt;
        cx.globalAlpha = s.life; cx.fillStyle = s.life > .6 ? '#FFF6DE' : '#F2C46E';
        cx.beginPath(); cx.arc(s.x, s.y, s.r * (.5 + s.life), 0, 6.283); cx.fill(); }
      cx.restore(); cx.globalAlpha = 1;
    }

    /* destello de llegada */
    if (flash > 0) {
      cx.save(); cx.globalCompositeOperation = 'lighter';
      const fg = cx.createRadialGradient(W / 2, H * .38, 0, W / 2, H * .38, Math.max(W, H) * .8);
      fg.addColorStop(0, `rgba(255,236,190,${Math.min(.5, flash * .38)})`); fg.addColorStop(1, 'rgba(255,200,120,0)');
      cx.fillStyle = fg; cx.fillRect(0, 0, W, H); cx.restore();
    }

    // viñeta inferior para leer el texto
    const v = cx.createLinearGradient(0, H * .55, 0, H);
    const vk = 1 - clamp((S.tone - (LAST - .6)) / .5, 0, 1) * .9;
    v.addColorStop(0, 'rgba(3,4,9,0)'); v.addColorStop(1, `rgba(3,4,9,${.85 * vk})`);
    cx.fillStyle = v; cx.fillRect(0, H * .55, W, H * .45);
  };
  requestAnimationFrame(frame);
})();
