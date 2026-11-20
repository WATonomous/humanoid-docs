// Pioneer, our humanoid, rendered live in 3D and drawn as ASCII with a glowing aura.
// The model and its joint layout come from the WATonomous website (pioneer.glb + kinematics).
//
// <canvas data-ascii-pioneer data-mode="background"> anywhere on a page turns into one.

import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

const BASE = document.documentElement.dataset.base || '/';
const RAMP = ' .,:;-=+*%#@';
const AURA = '.·:;+*';
// Joint angles (rad) for the displayed pose; names from pioneer-kinematics.json.
const POSE = {
  r_shoulder_roll: 0.12,
  l_shoulder_roll: 0.12,
  r_elbow: -0.25,
  l_elbow: -0.25,
  neck_pitch: 0.05,
};

// ---- model -----------------------------------------------------------------
async function loadPioneer() {
  const [gltf, spec] = await Promise.all([
    new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(`${BASE}models/pioneer.glb`),
    fetch(`${BASE}models/pioneer-kinematics.json`).then((r) => r.json()),
  ]);
  // Same assembly as the website's PioneerRobot: links from the URDF joints, meshes reparented.
  const root = new THREE.Group();
  root.rotation.x = -Math.PI / 2; // URDF is Z-up
  const links = new Map(spec.links.map((n) => [n, Object.assign(new THREE.Group(), {name: n})]));
  root.add(links.get(spec.root));
  const pivots = new Map();
  for (const j of spec.joints) {
    const origin = new THREE.Group();
    origin.position.fromArray(j.xyz);
    origin.rotation.set(j.rpy[0], j.rpy[1], j.rpy[2], 'ZYX');
    const pivot = new THREE.Group();
    origin.add(pivot);
    pivot.add(links.get(j.child));
    links.get(j.parent).add(origin);
    pivots.set(j.name, {pivot, axis: new THREE.Vector3().fromArray(j.axis).normalize(), j});
  }
  gltf.scene.updateMatrixWorld(true);
  const meshes = [];
  gltf.scene.traverse((o) => o.isMesh && meshes.push(o));
  for (const mesh of meshes) {
    let n = mesh;
    let link = '';
    while (n) {
      const b = n.name.replace(/__glow$/, '');
      if (links.has(b)) {
        link = b;
        break;
      }
      n = n.parent;
    }
    if (!link) continue;
    mesh.matrixWorld.decompose(mesh.position, mesh.quaternion, mesh.scale);
    mesh.material = /__glow$/.test(n.name)
      ? new THREE.MeshBasicMaterial({color: 0xffffff})
      : new THREE.MeshStandardMaterial({color: 0xdddddd, roughness: 0.55, metalness: 0.1});
    links.get(link).add(mesh);
  }
  // A relaxed pose: arms slightly out and bent, so the silhouette reads as a person.
  const pose = (name, v) => {
    const p = pivots.get(name);
    if (!p) return;
    const val = THREE.MathUtils.clamp(v, p.j.lower, p.j.upper);
    p.pivot.quaternion.setFromAxisAngle(p.axis, val);
  };
  for (const [name, v] of Object.entries(POSE)) pose(name, v);
  // Centre it on the turntable axis with its feet at y = 0.
  const body = new THREE.Group();
  body.add(root);
  body.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(body);
  const c = box.getCenter(new THREE.Vector3());
  body.position.set(-c.x, -box.min.y, -c.z);
  const robot = new THREE.Group(); // the turntable
  robot.add(body);
  robot.userData.height = box.max.y - box.min.y;
  return robot;
}

// ---- ASCII renderer --------------------------------------------------------------
class AsciiPioneer {
  constructor(canvas, robot) {
    this.canvas = canvas;
    this.mode = canvas.dataset.mode || 'background';
    this.ctx = canvas.getContext('2d');
    this.robot = robot;
    this.scene = new THREE.Scene();
    this.scene.add(robot);
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(2.5, 3, 3);
    const fill = new THREE.DirectionalLight(0xffffff, 0.6);
    fill.position.set(-3, 1, 2);
    const rim = new THREE.DirectionalLight(0xffffff, 3.5);
    rim.position.set(-2, 2.5, -3);
    this.scene.add(key, fill, rim, new THREE.AmbientLight(0xffffff, 0.12));
    const h = robot.userData.height;
    this.camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
    // data-frame="full" shows the whole robot; "bust" is a close-up of the helmet and shoulders.
    if (canvas.dataset.frame === 'bust') {
      this.camera.position.set(0, h * 0.84, h * 1.45);
      this.camera.lookAt(0, h * 0.74, 0);
    } else {
      this.camera.position.set(0, h * 0.6, h * 2.4);
      this.camera.lookAt(0, h * 0.5, 0);
    }
    this.gl = new THREE.WebGLRenderer({antialias: false, alpha: true, preserveDrawingBuffer: false});
    this.mouse = {x: 0, y: 0, tx: 0, ty: 0};
    this.start = performance.now();
    this.resize();
    addEventListener('resize', () => this.resize());
    addEventListener('pointermove', (e) => {
      this.mouse.tx = (e.clientX / innerWidth) * 2 - 1;
      this.mouse.ty = (e.clientY / innerHeight) * 2 - 1;
    }, {passive: true});
    document.addEventListener('themechange', () => this.readTheme());
    this.readTheme();
  }

  readTheme() {
    const css = getComputedStyle(this.canvas);
    this.color = css.getPropertyValue('--ascii-color').trim() || '#7cc4ff';
    this.glow = css.getPropertyValue('--ascii-glow').trim() || 'rgba(91,155,213,0.9)';
    this.opacity = parseFloat(css.getPropertyValue('--ascii-opacity')) || 1;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = r.width * dpr;
    this.canvas.height = r.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cellH = this.mode === 'hero' ? 8 : 10;
    this.cellW = this.cellH * 0.6;
    this.cols = Math.max(10, Math.floor(r.width / this.cellW));
    this.rows = Math.max(10, Math.floor(r.height / this.cellH));
    // Render 2x2 samples per cell so thin parts (fingers, visor rim) still register.
    this.target?.dispose();
    this.target = new THREE.WebGLRenderTarget(this.cols * 2, this.rows * 2);
    this.pixels = new Uint8Array(this.cols * 2 * this.rows * 2 * 4);
    this.camera.aspect = (this.cols * this.cellW) / (this.rows * this.cellH);
    this.camera.updateProjectionMatrix();
    this.lum = new Float32Array(this.cols * this.rows);
    this.cover = new Float32Array(this.cols * this.rows);
    this.aura = new Float32Array(this.cols * this.rows);
    this.seed = new Float32Array(this.cols * this.rows).map(() => Math.random());
  }

  sample() {
    const W = this.cols * 2;
    this.gl.setRenderTarget(this.target);
    this.gl.setClearColor(0x000000, 0);
    this.gl.clear();
    this.gl.render(this.scene, this.camera);
    this.gl.readRenderTargetPixels(this.target, 0, 0, W, this.rows * 2, this.pixels);
    this.gl.setRenderTarget(null);
    const {cols, rows, pixels, lum, cover} = this;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let l = 0;
        let a = 0;
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            // render targets are bottom-up
            const i = (((rows - 1 - r) * 2 + (1 - dy)) * W + c * 2 + dx) * 4;
            const al = pixels[i + 3] / 255;
            a += al;
            l += al * (0.3 * pixels[i] + 0.59 * pixels[i + 1] + 0.11 * pixels[i + 2]) / 255;
          }
        }
        cover[r * cols + c] = a / 4;
        lum[r * cols + c] = a ? l / a : 0;
      }
    }
    // Aura: how close each empty cell is to the body (cheap box dilation, radius 4).
    const R = 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const k = r * cols + c;
        if (cover[k] > 0.25) {
          this.aura[k] = 0;
          continue;
        }
        let best = 0;
        for (let y = Math.max(0, r - R); y <= Math.min(rows - 1, r + R); y++) {
          for (let x = Math.max(0, c - R); x <= Math.min(cols - 1, c + R); x++) {
            if (cover[y * cols + x] > 0.25) best = Math.max(best, 1 - Math.hypot(x - c, (y - r) * 1.6) / (R + 1));
          }
        }
        this.aura[k] = best;
      }
    }
  }

  draw(now) {
    const t = (now - this.start) / 1000;
    const m = this.mouse;
    m.x += (m.tx - m.x) * 0.05;
    m.y += (m.ty - m.y) * 0.05;
    this.robot.rotation.y = -0.5 + Math.sin(t * 0.25) * 0.55 + m.x * 0.25;
    this.robot.rotation.x = m.y * 0.05;
    this.sample();

    const {ctx, cols, rows, cellW, cellH} = this;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalAlpha = this.opacity;
    // soft halo behind the figure
    const g = ctx.createRadialGradient(this.w / 2, this.h * 0.45, 0, this.w / 2, this.h * 0.45, this.h * 0.55);
    g.addColorStop(0, this.glow.replace(/[\d.]+\)$/, '0.22)'));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.font = `600 ${cellH}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.glow;
    const flick = Math.floor(t * 8);
    for (let pass = 0; pass < 2; pass++) {
      // pass 0: aura particles (blurred); pass 1: the body
      ctx.shadowBlur = pass ? 6 : 10;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const k = r * cols + c;
          if (pass === 1 && this.cover[k] > 0.25) {
            const v = Math.min(1, Math.max(0, (this.lum[k] - 0.08) * 1.4)); // contrast stretch
            // silhouette edge: a cell of body next to empty space gets a bright outline character
            const edge =
              (c > 0 && this.cover[k - 1] <= 0.25) || (c < cols - 1 && this.cover[k + 1] <= 0.25) ||
              (r > 0 && this.cover[k - cols] <= 0.25) || (r < rows - 1 && this.cover[k + cols] <= 0.25);
            const ch = edge ? (v > 0.5 ? '@' : '#') : RAMP[Math.max(1, Math.round(v * (RAMP.length - 1)))];
            ctx.globalAlpha = this.opacity * (edge ? 0.95 : 0.4 + 0.6 * v);
            ctx.fillText(ch, c * cellW, r * cellH);
          } else if (pass === 0 && this.aura[k] > 0) {
            const s = this.seed[k];
            // particles flicker and drift upward a little, like heat off the body
            const on = ((s * 997 + flick + r) % 7) < 2.2 * this.aura[k] + 0.4;
            if (!on) continue;
            const ch = AURA[Math.floor(((s * 13 + flick * 0.37) % 1) * AURA.length)];
            ctx.globalAlpha = this.opacity * this.aura[k] * 0.55;
            ctx.fillText(ch, c * cellW, r * cellH - ((t * 6 + s * 20) % 6) * this.aura[k]);
          }
        }
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

// ---- boot ---------------------------------------------------------------------
const canvases = [...document.querySelectorAll('canvas[data-ascii-pioneer]')];
if (canvases.length) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  loadPioneer().then((robot) => {
    const views = canvases.map((cv, i) => new AsciiPioneer(cv, i ? robot.clone() : robot));
    canvases.forEach((cv) => cv.classList.add('ready'));
    let last = 0;
    const loop = (now) => {
      if (!document.hidden && now - last > 1000 / 30) {
        views.forEach((v) => v.draw(now));
        last = now;
      }
      if (!reduce) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    if (reduce) views.forEach((v) => v.draw(performance.now()));
  }).catch((err) => console.error('ascii-pioneer', err));
}
