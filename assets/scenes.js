/*
 * "NURI in action": short animated scenes (concept) built from the same 3D model.
 * Each scene: set dressing, a camera move, NURI's head and face animation, and timed subtitles.
 */
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/RoundedBoxGeometry.js';
import * as N from './nuri3d.js';

const PI = Math.PI, D2R = PI / 180, mm = v => v * N.MM;
const rbox = (w, h, d, r = .03) => new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2) * .999);
function add(parent, geo, mat, p = [0, 0, 0], r = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- props ---------- */
function desk(color = '#d6c09f') {
  const g = new THREE.Group();
  add(g, rbox(22, .4, 12, .06), new THREE.MeshStandardMaterial({color, roughness: .78}), [0, -.2, 0]);
  return g;
}
function screenDevice({w, h, t = mm(7), bezel = mm(6), standH = mm(60), tilt = -.22, draw, res = 1024}) {
  const g = new THREE.Group();
  const canvas = document.createElement('canvas'); canvas.width = res; canvas.height = Math.round(res * (h - 2 * bezel) / (w - 2 * bezel));
  const ctx = canvas.getContext('2d'), tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const alu = new THREE.MeshStandardMaterial({color: '#c9ced3', metalness: .85, roughness: .32});
  add(g, rbox(w * .45, mm(4), mm(60), mm(2)), alu, [0, mm(2), -mm(4)]);
  add(g, rbox(w * .45, mm(8), mm(4), mm(1.5)), alu, [0, mm(6), mm(22)]);
  add(g, rbox(w * .3, standH, mm(3), mm(1.5)), alu, [0, standH / 2 + mm(4), -mm(14)], [-.25, 0, 0]);
  const panel = new THREE.Group(); panel.position.set(0, mm(5), mm(19)); panel.rotation.x = tilt; g.add(panel);
  add(panel, rbox(w, h, t, mm(8)), new THREE.MeshStandardMaterial({color: '#aab0b6', metalness: .7, roughness: .38}), [0, h / 2, -t / 2]);
  add(panel, rbox(w - mm(.6), h - mm(.6), mm(1), mm(7.6)), new THREE.MeshPhysicalMaterial({color: '#05080c', roughness: .08, clearcoat: 1}), [0, h / 2, mm(.1)]);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(w - 2 * bezel, h - 2 * bezel), new THREE.MeshBasicMaterial({map: tex, toneMapped: false}));
  screen.position.set(0, h / 2, mm(.7)); panel.add(screen);
  return {group: g, update(time) { draw(ctx, canvas.width, canvas.height, time); tex.needsUpdate = true; }, dispose() { tex.dispose(); }};
}
function laptop(draw) {
  const g = new THREE.Group(), W = mm(300), D = mm(210);
  const shell = new THREE.MeshStandardMaterial({color: '#b8bdc2', metalness: .8, roughness: .35});
  add(g, rbox(W, mm(9), D, mm(6)), shell, [0, mm(4.5), 0]);
  add(g, rbox(W - mm(30), mm(.6), D * .45, mm(2)), new THREE.MeshStandardMaterial({color: '#2b2f34', roughness: .7}), [0, mm(9.2), -mm(18)]);
  add(g, rbox(mm(100), mm(.6), mm(60), mm(3)), new THREE.MeshStandardMaterial({color: '#a9aeb3', metalness: .6, roughness: .4}), [0, mm(9.2), mm(60)]);
  const lid = new THREE.Group(); lid.position.set(0, mm(9), -D / 2); lid.rotation.x = -.32; g.add(lid);
  add(lid, rbox(W, D * .95, mm(6), mm(6)), shell, [0, D * .475, -mm(3)]);
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 660;
  const ctx = canvas.getContext('2d'), tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(W - mm(16), D * .95 - mm(16)), new THREE.MeshBasicMaterial({map: tex, toneMapped: false}));
  scr.position.set(0, D * .475, mm(.2)); lid.add(scr);
  return {group: g, update(time) { draw(ctx, 1024, 660, time); tex.needsUpdate = true; }, dispose() { tex.dispose(); }};
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
function drawQueue(ctx, W, H, t) {
  ctx.fillStyle = '#f7f6f2'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1f7a62'; ctx.fillRect(0, 0, W, 96); txt(ctx, 'Welcome!', 40, 48, 44, '#fff', 600);
  txt(ctx, 'Now serving', 40, 170, 30, '#6a7178'); txt(ctx, 'A010', 40, 240, 86, '#15191d', 700);
  const show = t > 2.4;
  ctx.fillStyle = show ? '#e4f1ec' : '#eef0ef'; ctx.fillRect(W / 2, 130, W / 2 - 40, 230);
  txt(ctx, 'Your number', W / 2 + 30, 175, 30, '#6a7178');
  txt(ctx, show ? 'A012' : '—', W / 2 + 30, 260, 96, show ? '#1f7a62' : '#b0b6b3', 700);
  txt(ctx, show ? 'About 5 minutes' : 'Tap to take a number', 40, H - 70, 30, '#3a4047');
  txt(ctx, 'Concept demo', W - 40, H - 70, 22, '#9aa2aa', 400, 'right');
}
function drawBrief(ctx, W, H, t) {
  ctx.fillStyle = '#fbfbf9'; ctx.fillRect(0, 0, W, H);
  txt(ctx, 'Today · NURI brief', 48, 56, 40, '#15191d', 600);
  const rows = [['09:30', 'Client call', 'Top priority'], ['11:00', 'Send quotation #24', 'Draft ready'], ['15:00', 'Stock check', 'Reminder set']];
  rows.forEach(([a, b, c], i) => {
    const y = 150 + i * 120, on = t > 1 + i * 1.6;
    ctx.globalAlpha = on ? 1 : .25; ctx.fillStyle = i === 0 ? '#e4f1ec' : '#f1f1ee'; ctx.fillRect(40, y - 44, W - 80, 92);
    txt(ctx, a, 70, y, 34, '#1f7a62', 600); txt(ctx, b, 210, y, 36, '#15191d', 600); txt(ctx, c, W - 70, y, 28, '#6a7178', 400, 'right'); ctx.globalAlpha = 1;
  });
  if (t > 5.4) { ctx.fillStyle = '#15191d'; ctx.fillRect(40, H - 120, 330, 76); txt(ctx, 'Review draft', 72, H - 82, 30, '#fff', 600); txt(ctx, 'NURI asks before sending anything', 400, H - 82, 26, '#6a7178'); }
}

/* ---------- scenes ---------- */
// captions: [start, speaker, text]; poses: function(t) -> [pan, tilt]
export const SCENES = [
  {
    id: 'learn', title: 'Learn', label: 'Homework at the desk', duration: 10,
    view: {center: [.6, 3.0, -.4], radius: 6.4, dir: [.18, .28, 1]},
    captions: [[0, 'NURI', 'Let\'s solve it together. What should we do with the +3?'], [3.4, 'NURI', 'Move it to the other side. Now we have 2x = 8.'], [7, 'NURI', 'So x = 4. Well done!']],
    build(scene) {
      const d = desk(), nuri = N.createNuri({look: 'focus', colour: 'pearl', dock: 'slim', name: 'Reka'});
      nuri.root.position.set(-1.7, 0, 1.4); nuri.root.rotation.y = .3;
      const board = N.createBoard(); board.group.position.set(2.5, 0, -1.6); board.group.rotation.y = -.42;
      scene.add(d, nuri.root, board.group);
      let look = 0;
      return {objs: [d, nuri, board], nuri, frame(t) {
        const s = board.draw(t * 1.45 + .4); const want = s.writing ? 1.0 : -.05;
        look += (want - look) * .06; nuri.setPose(look, (-12 - look * 6) * D2R);
      }};
    }
  },
  {
    id: 'reception', title: 'Reception', label: 'Greeting customers at the counter', duration: 9,
    view: {center: [.4, 1.5, 0], radius: 4.1, dir: [.35, .32, 1]},
    captions: [[0, 'NURI', 'Welcome! Would you like to take a number?'], [3, 'NURI', 'You are A012. It\'s about five minutes.'], [6, 'NURI', 'I\'ve let the staff know you\'re here.']],
    build(scene) {
      const d = desk('#8a6a4c'), nuri = N.createNuri({look: 'buddy', colour: 'coral', dock: 'nest', name: 'Kront'});
      nuri.root.position.set(-.9, 0, .5); nuri.root.rotation.y = .15;
      const tab = screenDevice({w: mm(200), h: mm(130), draw: drawQueue}); tab.group.position.set(1.9, 0, -.1); tab.group.rotation.y = -.45;
      scene.add(d, nuri.root, tab.group);
      return {objs: [d, nuri, tab], nuri, frame(t) {
        tab.update(t);
        const toTab = t > 2 && t < 3.3 ? 1 : t > 5.6 && t < 6.6 ? .6 : 0;
        nuri.pan.rotation.y += (toTab * .9 - nuri.pan.rotation.y) * .07; nuri.tilt.rotation.x = (-9 + Math.sin(t * 1.2) * 2) * D2R;
      }};
    }
  },
  {
    id: 'assist', title: 'Assist', label: 'Morning brief before work', duration: 9.5,
    view: {center: [1.3, 2.2, -.6], radius: 6.6, dir: [-.12, .36, 1]},
    captions: [[0, 'You', 'NURI, what matters most today?'], [2.4, 'NURI', 'Three things. Your 9:30 client call comes first.'], [5.6, 'NURI', 'The quotation draft is on your laptop. Want to review it?']],
    build(scene) {
      const d = desk('#cfc6b8'), nuri = N.createNuri({look: 'signature', colour: 'graphite', dock: 'slim', name: 'Kront'});
      nuri.root.position.set(-2.6, 0, 1.3); nuri.root.rotation.y = .5;
      const lap = laptop(drawBrief); lap.group.position.set(3.9, 0, -1.4); lap.group.rotation.y = -.38;
      scene.add(d, nuri.root, lap.group);
      return {objs: [d, nuri, lap], nuri, frame(t) {
        lap.update(t);
        const toLap = t > 5.4 && t < 7.4 ? 1 : 0, nod = t > 2.4 && t < 3 ? Math.sin((t - 2.4) * 10) * 4 : 0;
        nuri.pan.rotation.y += (toLap * 1.05 - nuri.pan.rotation.y) * .07; nuri.tilt.rotation.x = (-14 + nod) * D2R;
      }};
    }
  },
  {
    id: 'companion', title: 'Companion', label: 'An evening check-in', duration: 9.5, evening: true,
    view: {center: [.2, 1.6, 0], radius: 4.4, dir: [.3, .3, 1]},
    captions: [[0, 'NURI', 'Good evening. Have you taken your 9 pm medicine?'], [3.4, 'NURI', 'Great. Shall I call Aisyah to say goodnight?'], [6.6, 'NURI', 'Calling Aisyah now…']],
    build(scene) {
      const d = desk('#a98a6a'), nuri = N.createNuri({look: 'buddy', colour: 'pearl', dock: 'nest', name: 'Reka'});
      nuri.root.position.set(-.3, 0, .4); nuri.root.rotation.y = .1;
      const l = lamp(); l.position.set(-3.4, 0, -1.6);
      scene.add(d, nuri.root, l);
      return {objs: [d, nuri, {root: l, dispose() {}}], nuri, frame(t) {
        nuri.pan.rotation.y = Math.sin(t * .5) * .08; nuri.tilt.rotation.x = (-16 + Math.sin(t * .9) * 3) * D2R;
      }};
    }
  }
];

/* ---------- player ---------- */
export function createPlayer(stageEl, ui, opts = {}) {
  const still = N.prefersReducedMotion();
  const stage = N.createStage(stageEl, {controls: false, camera: [4, 3, 8], target: [0, 1.4, 0], floor: false});
  const lights = stage.scene.children.filter(o => o.isLight);
  let idx = 0, cur = null, t = 0, playing = !still, captionKey = '';
  function clear() { if (!cur) return; cur.objs.forEach(o => { stage.scene.remove(o.root || o.group || o); if (o.dispose) o.dispose(); }); cur = null; }
  function load(i) {
    clear(); idx = (i + SCENES.length) % SCENES.length; t = still ? SCENES[idx].duration * .45 : 0;
    const sc = SCENES[idx]; cur = sc.build(stage.scene);
    lights.forEach(l => { l.intensity = l.userData.base ??= l.intensity; if (sc.evening) l.intensity *= l.isDirectionalLight ? .18 : .45; });
    stage.renderer.toneMappingExposure = sc.evening ? .85 : 1;
    stageEl.classList.toggle('evening', !!sc.evening);
    ui.onScene && ui.onScene(idx, sc);
    captionKey = '';
  }
  function setCaption() {
    const sc = SCENES[idx]; let c = sc.captions[0];
    sc.captions.forEach(k => { if (t >= k[0]) c = k; });
    const key = idx + ':' + c[0];
    if (key !== captionKey) { captionKey = key; ui.onCaption && ui.onCaption(c[1], c[2]); }
    ui.onProgress && ui.onProgress(idx, Math.min(1, t / sc.duration));
  }
  stage.onFrame((time, dt) => {
    const sc = SCENES[idx];
    if (playing) t += dt;
    if (t > sc.duration) { load(idx + 1); return; }
    // slow camera move around the scene's framing
    const a = (t / sc.duration - .5) * .32, v = sc.view, dir = new THREE.Vector3(...v.dir).normalize();
    const rot = new THREE.Vector3(dir.x * Math.cos(a) - dir.z * Math.sin(a), dir.y, dir.x * Math.sin(a) + dir.z * Math.cos(a));
    const cam = stage.camera, f = Math.min(cam.fov * D2R, 2 * Math.atan(Math.tan(cam.fov * D2R / 2) * cam.aspect));
    const dist = v.radius / Math.sin(f / 2) * (1 - ease(t / sc.duration) * .06);
    cam.position.set(...v.center).addScaledVector(rot, dist); cam.lookAt(...v.center);
    if (cur) {
      cur.frame(t, dt);
      // talking: the eyes bounce gently while a NURI line is on screen
      const speaking = sc.captions.some(([s, who], i) => who === 'NURI' && t >= s && t < (sc.captions[i + 1]?.[0] ?? sc.duration) - .4);
      cur.nuri.eyes.position.y = cur.nuri.eyes.userData.y0 ??= cur.nuri.eyes.position.y;
      if (speaking && !still) cur.nuri.eyes.position.y += Math.abs(Math.sin(time * 9)) * mm(.8);
    }
    setCaption();
  });
  load(0);
  stage.autoPause();
  return {
    play() { playing = true; }, pause() { playing = false; }, toggle() { playing = !playing; return playing; },
    go(i) { load(i); }, get playing() { return playing; }, get index() { return idx; }
  };
}
