/*
 * "NURI in action": short animated scenes (concept) built from the same 3D model.
 * Each scene: set dressing, a camera move, NURI's gaze, nods and talking face, timed subtitles
 * and an optional voice track (generated with Kokoro TTS, see tools/make-voice.py).
 * NURI only uses the K151's real joints: pan and tilt, inside their limits.
 */
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/RoundedBoxGeometry.js';
import * as N from './nuri3d.js';
import {VOICE, VOICE_FPS} from './scene-voice.js';

const PI = Math.PI, D2R = PI / 180, mm = v => v * N.MM;
const rbox = (w, h, d, r = .03) => new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2) * .999);
function add(parent, geo, mat, p = [0, 0, 0], r = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const nod = (t, t0, deg = 6, len = .7) => t > t0 && t < t0 + len ? Math.sin((t - t0) / len * 2 * PI) * deg : 0;
const within = (t, a, b) => t >= a && t < b;

/* ---------- props ---------- */
function desk(color = '#d6c09f') {
  const g = new THREE.Group();
  add(g, rbox(22, .4, 12, .06), new THREE.MeshStandardMaterial({color, roughness: .78}), [0, -.2, 0]);
  return g;
}
function canvasScreen(w, h, res) {
  const canvas = document.createElement('canvas'); canvas.width = res; canvas.height = Math.round(res * h / w);
  const ctx = canvas.getContext('2d'), tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map: tex, toneMapped: false}));
  return {canvas, ctx, tex, mesh};
}
function tablet(draw) {
  const g = new THREE.Group(), w = mm(200), h = mm(130), t = mm(7), bezel = mm(6), standH = mm(60);
  const alu = new THREE.MeshStandardMaterial({color: '#c9ced3', metalness: .85, roughness: .32});
  add(g, rbox(w * .45, mm(4), mm(60), mm(2)), alu, [0, mm(2), -mm(4)]);
  add(g, rbox(w * .45, mm(8), mm(4), mm(1.5)), alu, [0, mm(6), mm(22)]);
  add(g, rbox(w * .3, standH, mm(3), mm(1.5)), alu, [0, standH / 2 + mm(4), -mm(14)], [-.25, 0, 0]);
  const panel = new THREE.Group(); panel.position.set(0, mm(5), mm(19)); panel.rotation.x = -.22; g.add(panel);
  add(panel, rbox(w, h, t, mm(8)), new THREE.MeshStandardMaterial({color: '#aab0b6', metalness: .7, roughness: .38}), [0, h / 2, -t / 2]);
  add(panel, rbox(w - mm(.6), h - mm(.6), mm(1), mm(7.6)), new THREE.MeshPhysicalMaterial({color: '#05080c', roughness: .08, clearcoat: 1}), [0, h / 2, mm(.1)]);
  const s = canvasScreen(w - 2 * bezel, h - 2 * bezel, 1024); s.mesh.position.set(0, h / 2, mm(.7)); panel.add(s.mesh);
  return {group: g, screen: s.mesh, update(time) { draw(s.ctx, s.canvas.width, s.canvas.height, time); s.tex.needsUpdate = true; }, dispose() { s.tex.dispose(); }};
}
function laptop(draw) {
  const g = new THREE.Group(), W = mm(300), D = mm(210);
  const shell = new THREE.MeshStandardMaterial({color: '#b8bdc2', metalness: .8, roughness: .35});
  add(g, rbox(W, mm(9), D, mm(6)), shell, [0, mm(4.5), 0]);
  add(g, rbox(W - mm(30), mm(.6), D * .45, mm(2)), new THREE.MeshStandardMaterial({color: '#2b2f34', roughness: .7}), [0, mm(9.2), -mm(18)]);
  add(g, rbox(mm(100), mm(.6), mm(60), mm(3)), new THREE.MeshStandardMaterial({color: '#a9aeb3', metalness: .6, roughness: .4}), [0, mm(9.2), mm(60)]);
  const lid = new THREE.Group(); lid.position.set(0, mm(9), -D / 2); lid.rotation.x = -.3; g.add(lid);
  add(lid, rbox(W, D * .95, mm(6), mm(6)), shell, [0, D * .475, -mm(3)]);
  const s = canvasScreen(W - mm(16), D * .95 - mm(16), 1024); s.mesh.position.set(0, D * .475, mm(.2)); lid.add(s.mesh);
  return {group: g, screen: s.mesh, update(time) { draw(s.ctx, s.canvas.width, s.canvas.height, time); s.tex.needsUpdate = true; }, dispose() { s.tex.dispose(); }};
}
function phone(draw) {
  // a phone leaning on a small stand, screen towards the viewer
  const g = new THREE.Group(), w = mm(72), h = mm(150);
  const dark = new THREE.MeshStandardMaterial({color: '#23272c', metalness: .5, roughness: .4});
  add(g, rbox(mm(60), mm(5), mm(50), mm(2)), dark, [0, mm(2.5), 0]);
  const body = new THREE.Group(); body.position.set(0, mm(5), mm(8)); body.rotation.x = -.32; g.add(body);
  add(body, rbox(w, h, mm(8), mm(9)), dark, [0, h / 2, -mm(4)]);
  const s = canvasScreen(w - mm(5), h - mm(6), 512); s.mesh.position.set(0, h / 2, mm(.2)); body.add(s.mesh);
  return {group: g, screen: s.mesh, update(time) { draw(s.ctx, s.canvas.width, s.canvas.height, time); s.tex.needsUpdate = true; }, dispose() { s.tex.dispose(); }};
}
function pillBox() {
  const g = new THREE.Group(), lids = ['#e8a3a3', '#f0c98a', '#e9e08e', '#a9d9a5', '#9fd0e6', '#a9b5ea', '#d0a9e6'];
  add(g, rbox(mm(150), mm(16), mm(34), mm(4)), new THREE.MeshStandardMaterial({color: '#f3f1ec', roughness: .5}), [0, mm(8), 0]);
  lids.forEach((c, i) => add(g, rbox(mm(19), mm(3), mm(30), mm(1.5)), new THREE.MeshPhysicalMaterial({color: c, roughness: .25, clearcoat: .6}), [(i - 3) * mm(20.5), mm(17), 0]));
  return g;
}
function lamp() {
  const g = new THREE.Group(), metal = new THREE.MeshStandardMaterial({color: '#2c3036', metalness: .6, roughness: .4});
  add(g, new THREE.CylinderGeometry(.55, .6, .12, 40), metal, [0, .06, 0]);
  add(g, new THREE.CylinderGeometry(.04, .04, 4.2, 12), metal, [0, 2.2, 0]);
  const shade = add(g, new THREE.CylinderGeometry(.55, 1.15, 1.1, 40, 1, true), new THREE.MeshStandardMaterial({color: '#efe2c8', roughness: .9, side: THREE.DoubleSide, emissive: '#ffcf87', emissiveIntensity: .35}), [0, 4.3, 0]);
  shade.castShadow = false;
  const bulb = new THREE.PointLight('#ffc27a', 9, 18, 1.6); bulb.position.set(0, 3.9, 0); bulb.castShadow = false; g.add(bulb);
  return g;
}

/* ---------- screen drawings ---------- */
const FONT = 'Inter, Arial, sans-serif';
function txt(ctx, s, x, y, size, color = '#1d2430', weight = 500, align = 'left') { ctx.font = `${weight} ${size}px ${FONT}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); }
function rr(ctx, x, y, w, h, r, fill) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }
const cueOf = id => VOICE[id].cues.map(c => c.start);

function drawQueue(ctx, W, H, t) {
  const c = cueOf('reception'), num = t > c[2], staff = t > c[3] + .6;
  ctx.fillStyle = '#f7f6f2'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1f7a62'; ctx.fillRect(0, 0, W, 96); txt(ctx, 'Welcome!', 40, 48, 44, '#fff', 600);
  txt(ctx, 'Now serving', 40, 170, 30, '#6a7178'); txt(ctx, 'A010', 40, 240, 86, '#15191d', 700);
  rr(ctx, W / 2, 130, W / 2 - 40, 230, 18, num ? '#e4f1ec' : '#eef0ef');
  txt(ctx, 'Your number', W / 2 + 30, 175, 30, '#6a7178');
  if (num) { ctx.globalAlpha = ease((t - c[2]) / .4); txt(ctx, 'A012', W / 2 + 30, 262, 96, '#1f7a62', 700); ctx.globalAlpha = 1; }
  else { rr(ctx, W / 2 + 30, 222, 300, 76, 38, t > c[1] ? '#1f7a62' : '#15191d'); txt(ctx, 'Take a number', W / 2 + 180, 260, 30, '#fff', 600, 'center'); }
  txt(ctx, num ? 'About 5 minutes' : 'Tap or just ask NURI', 40, H - 74, 30, '#3a4047');
  if (staff) { rr(ctx, W / 2, H - 108, W / 2 - 40, 68, 34, '#15191d'); txt(ctx, '✓  Staff notified', W / 2 + 30, H - 74, 28, '#8ff0c4', 600); }
  else txt(ctx, 'Concept demo', W - 40, H - 74, 22, '#9aa2aa', 400, 'right');
}
function drawBrief(ctx, W, H, t) {
  const c = cueOf('assist');
  ctx.fillStyle = '#fbfbf9'; ctx.fillRect(0, 0, W, H);
  if (t > c[4]) { // the quotation draft, opened for review
    txt(ctx, 'Quotation #24 · Draft', 48, 56, 38, '#15191d', 600);
    rr(ctx, W - 260, 28, 212, 56, 28, '#fdf1d8'); txt(ctx, 'Not sent', W - 154, 56, 26, '#8a5a00', 600, 'center');
    [['NURI × 2', 'RM 1,998'], ['Nest Dock × 2', 'RM 100'], ['Setup & training', 'RM 300']].forEach(([a, b], i) => {
      const y = 160 + i * 86; ctx.fillStyle = '#eceae4'; ctx.fillRect(48, y + 40, W - 96, 2); txt(ctx, a, 48, y, 34, '#1d2430'); txt(ctx, b, W - 48, y, 34, '#1d2430', 600, 'right');
    });
    txt(ctx, 'Total', 48, 450, 36, '#15191d', 700); txt(ctx, 'RM 2,398', W - 48, 450, 36, '#1f7a62', 700, 'right');
    rr(ctx, 48, H - 128, 300, 76, 14, '#15191d'); txt(ctx, 'Approve & send', 198, H - 90, 30, '#fff', 600, 'center');
    txt(ctx, 'NURI waits for you', 380, H - 90, 28, '#6a7178');
    return;
  }
  txt(ctx, 'Today · NURI brief', 48, 56, 40, '#15191d', 600);
  const rows = [['09:30', 'Client call', 'Top priority', c[1] + .6], ['11:00', 'Quotation #24', 'Draft ready', c[2] + .8], ['15:00', 'Stock check', 'Reminder set', c[2] + 2.4]];
  rows.forEach(([a, b, d, at], i) => {
    const y = 160 + i * 120, k = ease((t - at) / .5);
    ctx.globalAlpha = .2 + .8 * k; rr(ctx, 40, y - 46, W - 80, 92, 14, i === 0 ? '#e4f1ec' : '#f1f1ee');
    txt(ctx, a, 70, y, 34, '#1f7a62', 600); txt(ctx, b, 210, y, 36, '#15191d', 600); txt(ctx, d, W - 70, y, 28, '#6a7178', 400, 'right'); ctx.globalAlpha = 1;
  });
  if (t > c[3]) { rr(ctx, 40, H - 128, 300, 76, 14, '#1f7a62'); txt(ctx, 'Opening draft…', 190, H - 90, 30, '#fff', 600, 'center'); }
}
function drawCall(ctx, W, H, t) {
  const c = cueOf('companion'), calling = t > c[4];
  ctx.fillStyle = calling ? '#10261f' : '#14171b'; ctx.fillRect(0, 0, W, H);
  if (!calling) { txt(ctx, '9:02', W / 2, H * .26, 110, '#eef1f3', 300, 'center'); txt(ctx, 'Wednesday', W / 2, H * .36, 30, '#9aa2aa', 400, 'center'); return; }
  const p = (t - c[4]) % 1.4 / 1.4;
  ctx.strokeStyle = `rgba(143,240,196,${1 - p})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(W / 2, H * .36, 92 + p * 70, 0, 2 * PI); ctx.stroke();
  ctx.fillStyle = '#e7a76f'; ctx.beginPath(); ctx.arc(W / 2, H * .36, 92, 0, 2 * PI); ctx.fill();
  txt(ctx, 'A', W / 2, H * .36 + 4, 92, '#fff', 600, 'center');
  txt(ctx, 'Aisyah', W / 2, H * .58, 52, '#fff', 600, 'center'); txt(ctx, 'Calling…', W / 2, H * .64, 32, '#8ff0c4', 500, 'center');
  ctx.fillStyle = '#d8453c'; ctx.beginPath(); ctx.arc(W / 2, H * .84, 56, 0, 2 * PI); ctx.fill();
}

/* ---------- gaze: aim NURI's real pan/tilt joints at a point in the scene ---------- */
const _p = new THREE.Vector3(), _q = new THREE.Vector3();
function aim(nuri, world) {
  nuri.root.updateMatrixWorld(true);
  nuri.tilt.getWorldPosition(_q); nuri.root.worldToLocal(_q);
  _p.copy(world); nuri.root.worldToLocal(_p).sub(_q);
  return [THREE.MathUtils.clamp(Math.atan2(_p.x, _p.z), -120 * D2R, 120 * D2R), -Math.atan2(_p.y, Math.hypot(_p.x, _p.z))];
}
const worldOf = obj => obj.getWorldPosition(new THREE.Vector3());

/* ---------- scenes ---------- */
// frame(t) -> {look: point NURI looks at, extra: [pan, tilt] offsets in degrees (nods)}
export const SCENES = [
  {
    id: 'learn', title: 'Learn', label: 'Homework at the desk',
    view: {center: [-.6, 2.6, 0], radius: 6.6, dir: [.1, .3, 1]},
    build(scene) {
      const c = cueOf('learn');
      const d = desk(), nuri = N.createNuri({look: 'focus', colour: 'pearl', dock: 'slim', name: 'Reka'});
      nuri.root.position.set(-4.4, 0, -1.2); nuri.root.rotation.y = .5;
      const board = N.createBoard(); board.group.position.set(1.6, 0, .6); board.group.rotation.y = -.42;
      scene.add(d, nuri.root, board.group);
      const student = V3(-1.5, 5, 11);
      // board steps appear as the conversation reaches them
      const steps = [0, c[1] + .4, c[2] + 1.2, c[3] + .2, c[3] + 2.4];
      const boardT = t => { let k = 0; steps.forEach((s, i) => { if (t >= s) k = i; }); return k * 2.4 + Math.min(2.39, t - steps[k]); };
      return {objs: [d, nuri, board], nuri, frame(t) {
        board.draw(boardT(t));
        const atBoard = within(t, c[0] + 1.8, c[1] - .1) || within(t, c[2] + .7, c[3] + 4);
        return {look: atBoard ? board.screenWorld() : student, extra: [0, nod(t, c[2], 7) + nod(t, c[3] + 3.3, 6, .5) + nod(t, c[3] + 3.8, 6, .5)]};
      }};
    }
  },
  {
    id: 'reception', title: 'Reception', label: 'Greeting customers at the counter',
    view: {center: [-.4, 2, 0], radius: 5.2, dir: [.08, .3, 1]},
    build(scene) {
      const c = cueOf('reception');
      const d = desk('#8a6a4c'), nuri = N.createNuri({look: 'buddy', colour: 'coral', dock: 'nest', name: 'Kront'});
      nuri.root.position.set(-3.5, 0, -1); nuri.root.rotation.y = .45;
      const tab = tablet(drawQueue); tab.group.position.set(1.5, 0, .9); tab.group.rotation.y = -.42;
      scene.add(d, nuri.root, tab.group);
      const customer = V3(-1.2, 5, 11);
      return {objs: [d, nuri, tab], nuri, frame(t) {
        tab.update(t);
        const atTab = within(t, c[1] + .5, c[2] + .9) || within(t, c[3] - .1, c[3] + 1.1);
        return {look: atTab ? worldOf(tab.screen) : customer, extra: [0, nod(t, c[1] + .2, 6) + nod(t, c[3] + 2, 5)]};
      }};
    }
  },
  {
    id: 'assist', title: 'Assist', label: 'Morning brief before work',
    view: {center: [-.8, 2.4, -.2], radius: 7.4, dir: [.05, .36, 1]},
    build(scene) {
      const c = cueOf('assist');
      const d = desk('#cfc6b8'), nuri = N.createNuri({look: 'signature', colour: 'graphite', dock: 'slim', name: 'Kront'});
      nuri.root.position.set(-5.4, 0, -1.6); nuri.root.rotation.y = .5;
      const lap = laptop(drawBrief); lap.group.position.set(1.8, 0, .4); lap.group.rotation.y = -.36;
      scene.add(d, nuri.root, lap.group);
      const you = V3(-2.5, 6, 12);
      return {objs: [d, nuri, lap], nuri, frame(t) {
        lap.update(t);
        const atLap = within(t, c[2] + 1.6, c[3]) || within(t, c[3] + .9, c[4] + .3);
        return {look: atLap ? worldOf(lap.screen) : you, extra: [0, nod(t, c[0] + 1.6, 6) + nod(t, c[3] + .5, 6)]};
      }};
    }
  },
  {
    id: 'companion', title: 'Companion', label: 'An evening check-in', evening: true,
    view: {center: [-.3, 1.7, .2], radius: 4.8, dir: [.12, .3, 1]},
    build(scene) {
      const c = cueOf('companion');
      const d = desk('#a98a6a'), nuri = N.createNuri({look: 'buddy', colour: 'pearl', dock: 'nest', name: 'Reka'});
      nuri.root.position.set(-1.8, 0, -.8); nuri.root.rotation.y = .3;
      const l = lamp(); l.position.set(-4.6, 0, -2.6);
      const pills = pillBox(); pills.position.set(-1.2, 0, 2.6); pills.rotation.y = .12;
      const ph = phone(drawCall); ph.group.position.set(2.4, 0, .9); ph.group.rotation.y = -.55;
      scene.add(d, nuri.root, l, pills, ph.group);
      const mak = V3(-.4, 5, 11);
      return {objs: [d, nuri, {root: l}, {root: pills}, ph], nuri, frame(t) {
        ph.update(t);
        const atPills = within(t, c[0] + 2.3, c[1] - .2), atPhone = within(t, c[4] - .1, c[4] + 2.2);
        return {look: atPills ? worldOf(pills) : atPhone ? worldOf(ph.screen) : mak, extra: [0, nod(t, c[1] + .6, 7) + nod(t, c[3] + .5, 6)]};
      }};
    }
  }
];
SCENES.forEach(s => { s.voice = VOICE[s.id]; s.duration = s.voice.duration; s.captions = s.voice.cues; s.audio = `assets/audio/scene-${s.id}.mp3`; });

/* talking face: a small mouth under the eyes, driven by the voice envelope */
function addMouth(nuri) {
  const eyeMat = nuri.eyes.children[0].material;
  const mouth = new THREE.Mesh(new RoundedBoxGeometry(mm(6), mm(1.6), mm(.4), 3, mm(.6)), eyeMat);
  mouth.position.set(0, -mm(10.5), 0); nuri.eyes.add(mouth);
  // calmer reflections on the CoreS3 glass so the face stays readable
  nuri.root.traverse(o => { const m = o.material; if (m && m.clearcoat && m.color.getHSL({}).l < .05) { m.envMapIntensity = .25; m.clearcoatRoughness = .35; m.roughness = .3; } });
  return mouth;
}

/* ---------- player ---------- */
export function createPlayer(stageEl, ui) {
  const still = N.prefersReducedMotion();
  const stage = N.createStage(stageEl, {controls: false, camera: [4, 3, 8], target: [0, 1.4, 0], floor: false});
  const lights = stage.scene.children.filter(o => o.isLight);
  const audio = new Audio(); audio.preload = 'none';
  let idx = 0, cur = null, t = 0, playing = !still, captionKey = '', sound = false, visible = true, pose = [0, 0], blinkAt = 1.5, lastAt = -1;
  function clear() { if (!cur) return; cur.objs.forEach(o => { stage.scene.remove(o.root || o.group || o); if (o.dispose) o.dispose(); }); cur = null; }
  function syncAudio() {
    if (!(sound && playing && visible)) { if (!audio.paused) audio.pause(); return; }
    if (Math.abs(audio.currentTime - t) > .25) audio.currentTime = t;
    if (audio.paused && !audio.ended && t < SCENES[idx].duration - .15) audio.play().catch(() => { sound = false; ui.onSound && ui.onSound(false); });
  }
  function load(i) {
    clear(); idx = (i + SCENES.length) % SCENES.length; t = still && !playing ? SCENES[idx].duration * .45 : 0;
    const sc = SCENES[idx]; cur = sc.build(stage.scene); cur.mouth = addMouth(cur.nuri);
    pose = aim(cur.nuri, cur.frame(t).look);
    lights.forEach(l => { l.intensity = l.userData.base ??= l.intensity; if (sc.evening) l.intensity *= l.isDirectionalLight ? .18 : .45; });
    stage.renderer.toneMappingExposure = sc.evening ? .85 : 1;
    stageEl.classList.toggle('evening', !!sc.evening);
    audio.src = sc.audio;
    ui.onScene && ui.onScene(idx, sc);
    captionKey = ''; syncAudio();
  }
  function setCaption() {
    const sc = SCENES[idx]; let c = sc.captions[0];
    sc.captions.forEach(k => { if (t >= k.start - .15) c = k; });
    const key = idx + ':' + c.start;
    if (key !== captionKey) { captionKey = key; ui.onCaption && ui.onCaption(c.who, c.text); }
    ui.onProgress && ui.onProgress(idx, Math.min(1, t / sc.duration));
  }
  stage.onFrame((time, dt) => {
    const sc = SCENES[idx];
    if (playing) {
      // the voice track is the clock while sound is on, so the face and subtitles stay in sync
      t += dt;
      const at = audio.currentTime, moving = sound && !audio.paused && audio.readyState >= 3 && at !== lastAt; lastAt = at;
      if (moving && Math.abs(at - t) > .08 && Math.abs(at - t) < .6) t = at;
    }
    if (t >= sc.duration - .02) { if (playing) { load(idx + 1); return; } t = sc.duration - .02; }
    // slow camera move around the scene's framing
    const a = (t / sc.duration - .5) * .3, v = sc.view, dir = new THREE.Vector3(...v.dir).normalize();
    const rot = new THREE.Vector3(dir.x * Math.cos(a) - dir.z * Math.sin(a), dir.y, dir.x * Math.sin(a) + dir.z * Math.cos(a));
    const cam = stage.camera, f = Math.min(cam.fov * D2R, 2 * Math.atan(Math.tan(cam.fov * D2R / 2) * cam.aspect));
    const dist = v.radius / Math.sin(f / 2) * (1 - ease(t / sc.duration) * .06);
    cam.position.set(...v.center).addScaledVector(rot, dist); cam.lookAt(...v.center);
    if (!cur) return;
    const {look, extra = [0, 0]} = cur.frame(t);
    const goal = aim(cur.nuri, look), k = still ? 1 : 1 - Math.exp(-Math.min(dt, .1) * 5);
    pose[0] += (goal[0] - pose[0]) * k; pose[1] += (goal[1] - pose[1]) * k;
    const idle = still ? 0 : Math.sin(time * 1.1) * 1.2;
    cur.nuri.setPose(pose[0] + extra[0] * D2R, pose[1] + (extra[1] + idle) * D2R);
    // talking face from the voice envelope; blink now and then
    const amp = (+sc.voice.env[Math.floor(t * VOICE_FPS)] || 0) / 9;
    cur.mouth.scale.set(1 + amp * .35, .55 + amp * 2.4, 1);
    const b = time - blinkAt, eyes = cur.nuri.eyes.children;
    eyes[0].scale.y = eyes[1].scale.y = b > 0 && b < .16 ? Math.max(.15, Math.abs(b - .08) / .08) : 1;
    if (b >= .16) blinkAt = time + 2.2 + Math.random() * 2.8;
    setCaption(); syncAudio();
  });
  new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; syncAudio(); }), {threshold: .05}).observe(stageEl);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; syncAudio(); });
  load(0);
  stage.autoPause();
  const api = {
    play() { if (t >= SCENES[idx].duration - .05) t = 0; playing = true; syncAudio(); },
    pause() { playing = false; syncAudio(); },
    toggle() { playing ? api.pause() : api.play(); return playing; },
    go(i) { load(i); },
    seek(s) { t = Math.max(0, Math.min(SCENES[idx].duration - .05, s)); if (audio.readyState) audio.currentTime = t; },
    setSound(on) { sound = !!on; if (sound) { playing = true; audio.preload = 'auto'; t = 0; } syncAudio(); return sound; }, // sound on replays the scene from the start
    get sound() { return sound; }, get time() { return t; }, get playing() { return playing; }, get index() { return idx; }
  };
  return api;
}
