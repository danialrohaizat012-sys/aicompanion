/*
 * NURI 3D: shared scene code for ciptarobo.com
 *
 * The StackChan K151 is proportioned from M5Stack's published structure files
 * (github.com/m5stack/M5_Hardware › Products/K151_StackChan/Structures) and
 * its documented overall size of 54 × 61.5 × 70.5 mm:
 *   - base 48 × 56 × 11.1 mm, USB-C opening on the rear face (charges the base battery)
 *   - head = 46.7 mm shell + ~14.8 mm CoreS3 in front, 54 × 54 mm face
 *   - ~5.4 mm gap between head and base, servo body inside
 *   - three ~4.3 mm side holes (8 mm pitch) per side, 11.6 mm below the top
 *   - rear-bottom chamfer on the shell for tilt clearance
 * The tilt pivot position is estimated. 1 scene unit = 27 mm.
 */
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/RoundedBoxGeometry.js';
import {OrbitControls} from 'three/addons/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/RoomEnvironment.js';

export const MM = 1 / 27;
const PI = Math.PI, D2R = PI / 180, mm = v => v * MM;

/* ------------------------------------------------------------------ */
/* K151 dimensions                                                     */
/* ------------------------------------------------------------------ */
export const K = {
  baseW: mm(48), baseD: mm(56), baseH: mm(11.1),
  gap: mm(5.4),
  headW: mm(54), headH: mm(54), headD: mm(61.5),
  coreD: mm(14.8),
  screenW: mm(40.8), screenH: mm(30.6), screenY: mm(2.5),
  holeR: mm(2.15), holeDrop: mm(11.6), holeBack: [7.9, 15.9, 23.9].map(mm),
  chamfer: mm(10),
  tiltMin: -74 * D2R, tiltMax: 6 * D2R, panLimit: 130 * D2R
};
K.HX = K.headW / 2; K.HY = K.headH / 2; K.HZ = K.headD / 2;
K.coreBack = K.HZ - K.coreD;                    // z where the CoreS3 meets the shell
K.headCY = K.baseH + K.gap + K.HY;              // head centre height at rest
K.pivot = new THREE.Vector3(0, K.headCY - mm(2), K.coreBack - mm(23.4)); // estimated tilt axis
K.holes = K.holeBack.map(b => ({y: K.HY - K.holeDrop, z: K.coreBack - b}));
K.sweepR = Math.hypot(K.HX, K.HZ) + mm(2);      // radius the head sweeps while panning

/* ------------------------------------------------------------------ */
/* Product options                                                     */
/* ------------------------------------------------------------------ */
export const LOOKS = [
  {id: 'signature', name: 'Signature', blurb: 'Slim face frame and soft side panels. The everyday NURI.'},
  {id: 'focus', name: 'Focus', blurb: 'Headphone-style side cups with a high, open band. Made for study and work.'},
  {id: 'buddy', name: 'Buddy', blurb: 'Rounded frame and small side ears. Friendly at home and at the counter.'}
];
export const COLOURS = [
  {id: 'pearl', name: 'Pearl', suit: '#eef1f0', accent: '#4fbf9f'},
  {id: 'graphite', name: 'Graphite', suit: '#3b4149', accent: '#86d9c1'},
  {id: 'coral', name: 'Coral', suit: '#f6e6de', accent: '#e9785a'}
];
export const BASE_PRICE = 999;
export const DOCKS = [
  {id: 'slim', name: 'Slim Dock', price: 0, blurb: 'Low tray that disappears on a desk. Slide NURI in to charge. Included.'},
  {id: 'nest', name: 'Nest Dock', price: 50, blurb: 'A shallow bowl wrapped in woven rings, like a small nest. +RM50.'}
];
export const engraving = name => ('NURI ' + (name || '').trim()).trim().toUpperCase().slice(0, 15);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const rbox = (w, h, d, r = mm(1.5), seg = 4) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2) * .999);
const cyl = (rt, rb, h, seg = 40) => new THREE.CylinderGeometry(rt, rb, h, seg);
const torus = (r, t, arc = 2 * PI, seg = 64) => new THREE.TorusGeometry(r, t, 12, seg, arc);
function add(parent, geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
  const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); m.scale.set(...s);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const mirror = fn => [-1, 1].forEach(fn);
function rr(w, h, r, s = new THREE.Shape()) {
  const x = -w / 2, y = -h / 2; r = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -PI / 2, 0);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, PI / 2);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, PI / 2, PI);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, PI, 1.5 * PI); return s;
}
function extrude(shape, depth, bevel = mm(.4)) {
  const g = new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 24});
  g.translate(0, 0, -depth / 2); return g;
}
// face frame: rails outside the top and sides, bottom rail kept inside the head outline
function faceFrameGeo(w, h, r, t, depth) {
  const s = rr(w + 2 * t, h + t, r + t); s.holes.push(rr(w, h - t, Math.max(mm(.5), r - t / 2), new THREE.Path()));
  const g = extrude(s, depth); g.translate(0, t / 2, 0); return g;
}
function polyGeo(pts, depth, bevel = mm(.4)) {
  const s = new THREE.Shape(); s.moveTo(...pts[0]); pts.slice(1).forEach(p => s.lineTo(...p)); s.closePath(); return extrude(s, depth, bevel);
}
function dispose(obj) {
  obj.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); });
}
function tag(group, zone, fn) { const n = group.children.length; fn(); group.children.slice(n).forEach(c => c.traverse(o => { if (o.isMesh) o.userData.zone = zone; })); }

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */
function materials(colour) {
  const suit = new THREE.Color(colour.suit), accent = new THREE.Color(colour.accent);
  const pla = (c, rough = .55) => new THREE.MeshPhysicalMaterial({color: c, roughness: rough, clearcoat: .15, clearcoatRoughness: .6});
  return {
    k151: new THREE.MeshPhysicalMaterial({color: '#f2f3f2', roughness: .5, clearcoat: .25, clearcoatRoughness: .5}),
    core: new THREE.MeshPhysicalMaterial({color: '#3a3e44', roughness: .45, clearcoat: .4}),
    glass: new THREE.MeshPhysicalMaterial({color: '#05080c', roughness: .08, metalness: .2, clearcoat: 1, clearcoatRoughness: .04}),
    servo: new THREE.MeshStandardMaterial({color: '#cfd3d6', roughness: .6}),
    hole: new THREE.MeshStandardMaterial({color: '#191d22', roughness: .9}),
    port: new THREE.MeshStandardMaterial({color: '#101215', roughness: .5, metalness: .6}),
    touch: new THREE.MeshStandardMaterial({color: '#e6e8e7', roughness: .3}),
    led: new THREE.MeshBasicMaterial({color: accent.clone().lerp(new THREE.Color('#ffffff'), .55), toneMapped: false}),
    eye: new THREE.MeshBasicMaterial({color: '#8ff3ff', toneMapped: false}),
    suit: pla(suit), accent: pla(accent, .5),
    dock: pla(suit.clone().lerp(new THREE.Color('#ffffff'), .1), .6),
    dockDark: pla(suit.clone().lerp(new THREE.Color('#1c2026'), .82), .6),
    nestA: pla(accent.clone().lerp(new THREE.Color('#cdb894'), .45), .7),
    nestB: pla(new THREE.Color('#cdb894').lerp(suit, .3), .75),
    rubber: new THREE.MeshStandardMaterial({color: '#25282c', roughness: .95}),
    metal: new THREE.MeshStandardMaterial({color: '#b9bec3', metalness: .9, roughness: .3}),
    cable: new THREE.MeshStandardMaterial({color: '#2a2d31', roughness: .7})
  };
}
function engraveTexture(text, dark) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const x = c.getContext('2d');
  x.fillStyle = dark ? '#2e3339' : '#e9ecea'; x.fillRect(0, 0, 1024, 160);
  x.font = '600 92px Inter, "Helvetica Neue", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  if ('letterSpacing' in x) x.letterSpacing = '18px';
  // engraved look: dark recess with a light lower lip
  x.fillStyle = dark ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.9)'; x.fillText(text, 512, 86, 960);
  x.fillStyle = dark ? '#121417' : '#7b827f'; x.fillText(text, 512, 82, 960);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

/* ------------------------------------------------------------------ */
/* K151                                                                */
/* ------------------------------------------------------------------ */
function shellGeo() {
  const b = mm(1.6), z0 = -K.HZ, z1 = K.coreBack, y0 = -K.HY, y1 = K.HY, c = K.chamfer;
  const pts = [[z1, y0], [z1, y1], [z0, y1], [z0, y0 + c], [z0 + c, y0]].map(([z, y], i) => [z + (i === 0 || i === 1 ? -b : b), y + (i === 1 || i === 2 ? -b : b)]);
  const s = new THREE.Shape(); s.moveTo(...pts[0]); pts.slice(1).forEach(p => s.lineTo(...p)); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {depth: K.headW - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4, curveSegments: 8});
  g.translate(0, 0, -(K.headW - 2 * b) / 2); g.rotateY(-PI / 2); return g;
}
function buildK151(m, base, pan, head) {
  // base (stationary) with rear USB-C opening
  add(base, rbox(K.baseW, K.baseH, K.baseD, mm(4)), m.k151, [0, K.baseH / 2, 0]);
  add(base, rbox(mm(9.2), mm(3.4), mm(1), mm(1.6)), m.port, [0, mm(5.5), -K.baseD / 2 - mm(.3)]);
  // servo body visible in the gap (pans)
  add(pan, cyl(mm(23), mm(23), K.gap + mm(8), 48), m.servo, [0, K.baseH + (K.gap + mm(8)) / 2, -mm(3)]);
  // head shell + CoreS3
  add(head, shellGeo(), m.k151);
  add(head, rbox(K.headW, K.headH, K.coreD, mm(3)), m.core, [0, 0, K.coreBack + K.coreD / 2]);
  add(head, rbox(K.screenW + mm(1), K.screenH + mm(1), mm(.8), mm(1.2)), m.glass, [0, K.screenY, K.HZ + mm(.2)]);
  add(head, cyl(mm(1.2), mm(1.2), mm(.6), 16), m.glass, [0, K.HY - mm(5.5), K.HZ + mm(.2)], [PI / 2, 0, 0]);
  // CoreS3 left-side USB-C and power button (kept clear)
  add(head, rbox(mm(.8), mm(3.2), mm(8.8), mm(1.4)), m.port, [-K.HX - mm(.2), -mm(14), K.coreBack + K.coreD / 2]);
  add(head, rbox(mm(1), mm(5), mm(2.6), mm(.8)), m.hole, [-K.HX - mm(.2), mm(4), K.coreBack + K.coreD / 2]);
  // face
  const eyes = new THREE.Group(); eyes.position.set(0, K.screenY + mm(1.5), K.HZ + mm(.8)); head.add(eyes);
  mirror(s => add(eyes, torus(mm(3.6), mm(1), PI, 32), m.eye, [s * mm(8.5), -mm(1.2), 0]));
  // shell top: three touch zones and two LED light bars
  const shellMidZ = (-K.HZ + K.coreBack) / 2, shellD = K.headD - K.coreD;
  [-1, 0, 1].forEach(i => add(head, rbox(mm(36), mm(.4), mm(12), mm(.2)), m.touch, [0, K.HY + mm(.1), shellMidZ + i * mm(14)]));
  mirror(s => add(head, rbox(mm(4.5), mm(.5), mm(31), mm(.25)), m.led, [s * (K.HX - mm(4)), K.HY + mm(.15), shellMidZ]));
  // side mounting holes
  mirror(s => K.holes.forEach(h => add(head, cyl(K.holeR, K.holeR, mm(.6), 20), m.hole, [s * (K.HX + mm(.05)), h.y, h.z], [0, 0, PI / 2])));
  return {eyes, shellD};
}

/* ------------------------------------------------------------------ */
/* NURI Suit: three looks                                              */
/* ------------------------------------------------------------------ */
function buildLook(id, m, head) {
  const z = K.HZ - mm(1.2);                    // frame lip: front 3.5 mm of the CoreS3 only
  const sideZ = K.holes[1].z, sideY = K.holes[1].y - mm(6);
  if (id === 'signature') {
    add(head, faceFrameGeo(K.headW, K.headH, mm(5), mm(2.6), mm(3.5)), m.accent, [0, 0, z]);
    mirror(s => {
      add(head, rbox(mm(3.2), mm(30), mm(25), mm(1.5)), m.suit, [s * (K.HX + mm(1.7)), sideY, sideZ]);
      add(head, rbox(mm(3.4), mm(19), mm(2.4), mm(1)), m.accent, [s * (K.HX + mm(1.9)), sideY, sideZ + mm(6)]);
    });
  }
  if (id === 'focus') {
    add(head, faceFrameGeo(K.headW, K.headH, mm(4), mm(2.2), mm(3.5)), m.suit, [0, 0, z]);
    const bandY = sideY, bandR = K.HX + mm(7);
    mirror(s => {
      add(head, cyl(mm(12.5), mm(12.5), mm(6), 48), m.accent, [s * (K.HX + mm(3.4)), bandY, sideZ], [0, 0, PI / 2]);
      add(head, torus(mm(9.5), mm(2.2)), m.suit, [s * (K.HX + mm(6.6)), bandY, sideZ], [0, PI / 2, 0]);
      add(head, cyl(mm(5), mm(5), mm(1), 32), m.suit, [s * (K.HX + mm(6.6)), bandY, sideZ], [0, 0, PI / 2]);
    });
    // band arcs over the head with >= 12 mm clearance above the touch zones
    add(head, torus(bandR, mm(2), PI, 72), m.suit, [0, bandY, sideZ], [0, 0, 0], [1, 1.52, 1]);
  }
  if (id === 'buddy') {
    add(head, faceFrameGeo(K.headW, K.headH, mm(11), mm(3.4), mm(3.5)), m.accent, [0, 0, z]);
    mirror(s => {
      // ear: rounded triangle mounted on the side holes, standing outside the LED bars
      const ear = new THREE.Shape(); ear.moveTo(-mm(9), 0); ear.quadraticCurveTo(-mm(7), mm(20), mm(1), mm(23)); ear.quadraticCurveTo(mm(8), mm(14), mm(9), 0); ear.closePath();
      const g = extrude(ear, mm(3.2), mm(.8));
      const e = add(head, g, m.suit, [s * (K.HX + mm(2)), K.HY - mm(13), sideZ - mm(2)], [0, PI / 2, -s * .2]);
      e.scale.set(1, 1, 1);
      add(head, rbox(mm(3.4), mm(12), mm(14), mm(1.4)), m.accent, [s * (K.HX + mm(1.8)), K.holes[1].y - mm(2), sideZ]);
    });
  }
}

/* ------------------------------------------------------------------ */
/* Charging docks (stationary). Pocket floor sits at y = 0.           */
/* Returns {height, frontZ, plateY, footprint}                        */
/* ------------------------------------------------------------------ */
const POCKET = {w: K.baseW + mm(1.2), d: K.baseD + mm(1.2)};
function pocketRim(g, m, wall, rimH, frontLow) {
  // rim walls stay below the K151 base top so the head can pan freely
  const W = POCKET.w + 2 * wall, D = POCKET.d + 2 * wall;
  add(g, rbox(wall, rimH, D, mm(1)), m.dock, [-(POCKET.w + wall) / 2, rimH / 2, 0]);
  add(g, rbox(wall, rimH, D, mm(1)), m.dock, [(POCKET.w + wall) / 2, rimH / 2, 0]);
  add(g, rbox(W, rimH, wall, mm(1)), m.dock, [0, rimH / 2, -(POCKET.d + wall) / 2]);
  add(g, rbox(W, frontLow, wall, mm(1)), m.dock, [0, frontLow / 2, (POCKET.d + wall) / 2]);
  // vent slots on both side walls
  mirror(s => [-2, -1, 0, 1, 2].forEach(i => add(g, rbox(mm(.6), mm(2.2), mm(5), mm(.3)), m.rubber, [s * (POCKET.w / 2 + wall + mm(.05)), rimH * .55, i * mm(8)])));
  // USB-C plug that mates with the base's rear port, plus the dock's own USB-C input
  add(g, rbox(mm(8.2), mm(2.4), mm(5), mm(1)), m.metal, [0, mm(5.5) + mm(2), -POCKET.d / 2 + mm(2)]);
  add(g, rbox(mm(9.2), mm(3.4), mm(.8), mm(1.5)), m.port, [0, rimH * .45, -(POCKET.d / 2 + wall) - mm(.2)]);
  // support ribs: 2 mm air gap under the base for the battery and PMIC
  [-1, 0, 1].forEach(i => add(g, rbox(mm(3), mm(2), POCKET.d - mm(8), mm(.6)), m.rubber, [i * mm(14), mm(1), 0]));
  return {W, D};
}
function buildDock(id, m, g, name) {
  let info;
  const plate = (w, h, y, z, dark) => {
    const tex = engraveTexture(engraving(name), dark);
    add(g, new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map: tex, roughness: .55}), [0, y, z + mm(.05)]);
  };
  if (id === 'slim') {
    const floor = mm(5), wall = mm(3.5);
    const {W, D} = pocketRim(g, m, wall, mm(8.5), mm(4));
    add(g, rbox(W, floor, D, mm(2.5)), m.dock, [0, -floor / 2, 0]);
    plate(mm(40), mm(5.6), -floor / 2 + mm(1.4), D / 2, false);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => add(g, cyl(mm(3), mm(3), mm(1), 20), m.rubber, [a * (W / 2 - mm(6)), -floor - mm(.5), b * (D / 2 - mm(6))]));
    info = {height: floor + mm(1), footprint: [W, D]};
  }
  if (id === 'nest') {
    // shallow bowl with six thin woven rings around the rim; the gaps between rings vent the base.
    // Every ring sits outside the head's pan sweep, so the head turns freely above it.
    const floor = mm(5), dish = new THREE.Group(); g.add(dish);
    pocketRim(g, m, mm(3), mm(7), mm(4));                                   // hidden locating walls + USB-C plug
    const prof = [[0, -floor], [mm(40), -floor], [mm(47), -floor + mm(.8)], [mm(52), -mm(1)], [mm(54.5), mm(3)], [mm(54), mm(6)], [mm(52.4), mm(6.6)], [mm(50.4), mm(5)], [mm(46.5), mm(.4)], [mm(40), 0], [0, 0]];
    const bowl = add(dish, new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 120), m.dock.clone());
    bowl.material.side = THREE.DoubleSide;
    // nine thin strands, each tilted a little differently so they cross like woven twigs
    for (let i = 0; i < 9; i++) {
      const r = 48 + (i * 1.7) % 5.5, y = 3 + i * .9, t = .11 + (i % 3) * .03, ph = i * 2.1;
      add(dish, torus(mm(r), mm(1.05), 2 * PI, 140), i % 3 === 1 ? m.nestA : m.nestB, [0, mm(y), 0], [PI / 2 + t * Math.cos(ph), 0, t * Math.sin(ph)]);
    }
    // engraved tag on the front of the rim
    const tag = new THREE.Group(); tag.position.set(0, mm(4.5), mm(55.6)); tag.rotation.x = -.22; dish.add(tag);
    add(tag, rbox(mm(38), mm(8), mm(2), mm(1.2)), m.dock);
    add(tag, new THREE.PlaneGeometry(mm(35), mm(5.2)), new THREE.MeshStandardMaterial({map: engraveTexture(engraving(name), false), roughness: .55}), [0, 0, mm(1.05)]);
    // dock USB-C input at the back, rubber feet underneath
    add(dish, rbox(mm(9.2), mm(3.4), mm(1), mm(1.5)), m.port, [0, mm(1.5), -mm(54.3)]);
    [0, 1, 2].forEach(i => { const a = i * 2 * PI / 3 + PI / 2; add(dish, cyl(mm(3.5), mm(3.5), mm(1), 20), m.rubber, [Math.cos(a) * mm(32), -floor - mm(.5), Math.sin(a) * mm(32)]); });
    info = {height: floor + mm(1), footprint: [mm(110), mm(110)]};
  }
  return info;
}

/* ------------------------------------------------------------------ */
/* NURI assembly                                                       */
/* ------------------------------------------------------------------ */
export function createNuri(opts = {}) {
  const o = Object.assign({look: 'signature', colour: 'pearl', dock: 'slim', name: '', showDock: true}, opts);
  const root = new THREE.Group(), lift = new THREE.Group(), dockG = new THREE.Group(), base = new THREE.Group();
  const pan = new THREE.Group(), tilt = new THREE.Group(), head = new THREE.Group();
  root.add(lift); lift.add(dockG, base); base.add(pan); pan.add(tilt); tilt.add(head);
  tilt.position.copy(K.pivot); head.position.set(0, K.headCY - K.pivot.y, -K.pivot.z);
  const colour = COLOURS.find(c => c.id === o.colour) || COLOURS[0];
  const m = materials(colour);
  const {eyes} = buildK151(m, base, pan, head);
  tag(head, 'suit', () => buildLook(o.look, m, head));
  let dockInfo = {height: 0};
  if (o.showDock && o.dock) tag(dockG, 'dock', () => { dockInfo = buildDock(o.dock, m, dockG, o.name); });
  lift.position.y = dockInfo.height || 0;
  let blinkAt = 2;
  const api = {
    root, pan, tilt, head, base, eyes, options: o, dockInfo,
    setPose(p, t) { pan.rotation.y = p; tilt.rotation.x = THREE.MathUtils.clamp(t, K.tiltMin, K.tiltMax); },
    idle(time, still = false) {
      if (still) return;
      pan.rotation.y = Math.sin(time * .45) * .22; tilt.rotation.x = (-6 + Math.sin(time * .7) * 4) * D2R;
      const d = time - blinkAt; eyes.scale.y = d > 0 && d < .16 ? Math.max(.1, Math.abs(d - .08) / .08) : 1; if (d >= .16) blinkAt = time + 2.4 + Math.random() * 3;
    },
    dispose() { dispose(root); }
  };
  return api;
}

/* Clearance check: suit parts against sensors and the full motion range */
export function checkClearance(nuri) {
  const {head, root} = nuri; root.updateMatrixWorld(true);
  const issues = new Set(), v = new THREE.Vector3(), inv = new THREE.Matrix4(), mtx = new THREE.Matrix4();
  inv.copy(head.matrixWorld).invert();
  const shellTopZ0 = -K.HZ + mm(2), shellTopZ1 = K.coreBack - mm(2);
  head.traverse(obj => {
    if (!obj.isMesh || obj.userData.zone !== 'suit') return;
    mtx.multiplyMatrices(inv, obj.matrixWorld);
    const p = obj.geometry.attributes.position, step = Math.max(1, Math.floor(p.count / 500));
    for (let i = 0; i < p.count; i += step) {
      v.fromBufferAttribute(p, i).applyMatrix4(mtx);
      if (Math.abs(v.x) < K.HX - mm(1.5) && v.z > shellTopZ0 && v.z < shellTopZ1 && v.y > K.HY - mm(.3) && v.y < K.HY + mm(12)) issues.add('covers the top touch zones or LED bars');
      if (v.z > K.HZ - mm(1) && Math.abs(v.x) < K.screenW / 2 + mm(1) && Math.abs(v.y - K.screenY) < K.screenH / 2 + mm(1)) issues.add('covers the display');
      if (v.x < -K.HX + mm(.5) && v.z > K.coreBack + mm(1) && v.z < K.HZ - mm(4)) issues.add('blocks the CoreS3 side port or power button');
      if (v.z < -K.HZ + K.chamfer + mm(2) && v.y < -K.HY + K.chamfer + mm(2)) issues.add('enters the rear servo clearance');
      const hy = v.y + K.headCY - K.pivot.y, hz = v.z - K.pivot.z;
      for (let a = K.tiltMin; a <= K.tiltMax + 1e-6; a += 3 * D2R) if (K.pivot.y + hy * Math.cos(a) - hz * Math.sin(a) < K.baseH + mm(.5)) { issues.add('touches the base while tilting'); break; }
    }
  });
  // docks: nothing may rise above the base top inside the space the head sweeps while turning
  const base = nuri.base, binv = new THREE.Matrix4().copy(base.matrixWorld).invert();
  root.traverse(obj => {
    if (!obj.isMesh || obj.userData.zone !== 'dock') return;
    mtx.multiplyMatrices(binv, obj.matrixWorld);
    const p = obj.geometry.attributes.position, step = Math.max(1, Math.floor(p.count / 800));
    for (let i = 0; i < p.count; i += step) {
      v.fromBufferAttribute(p, i).applyMatrix4(mtx);
      if (v.y > K.baseH - mm(.2) && Math.hypot(v.x, v.z) < K.sweepR + mm(2)) { issues.add('dock rises into the space the head turns through'); break; }
    }
  });
  return [...issues];
}

/* ------------------------------------------------------------------ */
/* Add-on 1: NURI Rover (tracked base)                                 */
/* ------------------------------------------------------------------ */
export function createRover(colourId = 'pearl') {
  const colour = COLOURS.find(c => c.id === colourId) || COLOURS[0], m = materials(colour);
  const g = new THREE.Group();
  const L = mm(96), R = mm(17), trackW = mm(22), bodyW = mm(62), gapT = mm(2.5);
  const trackX = bodyW / 2 + gapT + trackW / 2, axleY = R;
  // chassis
  add(g, rbox(bodyW, mm(24), mm(124), mm(5)), m.dock, [0, mm(18) + mm(12), 0]);
  add(g, rbox(bodyW + mm(2), mm(3), mm(126), mm(1.5)), m.dockDark, [0, mm(18), 0]);
  const deckY = mm(42);
  // pocket for the K151 base, same USB-C plug as the docks (powered by the rover battery)
  const pocket = new THREE.Group(); pocket.position.y = deckY; g.add(pocket);
  pocketRim(pocket, m, mm(3), mm(8.5), mm(4));
  add(pocket, rbox(POCKET.w + mm(6), mm(2), POCKET.d + mm(6), mm(1)), m.dock, [0, -mm(1), 0]);
  // front: depth sensor window and headlights; rear: power switch and charge port
  add(g, rbox(mm(30), mm(9), mm(1.2), mm(3)), m.glass, [0, mm(31), mm(62.2)]);
  mirror(s => add(g, cyl(mm(3.2), mm(3.2), mm(1.2), 24), new THREE.MeshBasicMaterial({color: '#fff7e0', toneMapped: false}), [s * mm(22), mm(31), mm(62.3)], [PI / 2, 0, 0]));
  add(g, rbox(mm(9.2), mm(3.4), mm(.8), mm(1.5)), m.port, [-mm(12), mm(30), -mm(62.2)]);
  add(g, rbox(mm(8), mm(4), mm(1), mm(1)), m.accent, [mm(12), mm(30), -mm(62.3)]);
  // tracks: sprockets, road wheels and tread pads that run around the loop
  const wheels = [], pads = [];
  const padGeo = rbox(trackW, mm(2.6), mm(6.2), mm(.8)), padMat = m.rubber;
  const P = 2 * L + 2 * PI * R, N = 52;
  mirror(s => {
    const x = s * trackX;
    [-1, 1].forEach(e => {
      const w = add(g, cyl(R - mm(3), R - mm(3), trackW - mm(4), 28), m.dockDark, [x, axleY, e * L / 2], [0, 0, PI / 2]);
      add(w, cyl(mm(5), mm(5), trackW - mm(2), 6), m.accent, [0, 0, 0]);
      wheels.push({mesh: w, r: R - mm(3)});
    });
    [-1, -.33, .33, 1].forEach(f => { const w = add(g, cyl(mm(7), mm(7), trackW - mm(6), 20), m.metal, [x, mm(8.5), f * L * .3], [0, 0, PI / 2]); wheels.push({mesh: w, r: mm(7)}); });
    // outer track guard
    add(g, rbox(mm(2), mm(10), L + mm(8), mm(1)), m.accent, [x + s * (trackW / 2 + mm(1)), axleY + mm(6), 0]);
    const inst = new THREE.InstancedMesh(padGeo, padMat, N); inst.castShadow = true; g.add(inst); pads.push({inst, x});
  });
  function pathPoint(sp) {
    sp = ((sp % P) + P) % P;
    if (sp < L) return {z: L / 2 - sp, y: 0, a: 0};                                   // bottom run, front to back
    sp -= L; if (sp < PI * R) { const a = sp / R; return {z: -L / 2 - Math.sin(a) * R, y: R - Math.cos(a) * R, a: -a}; }
    sp -= PI * R; if (sp < L) return {z: -L / 2 + sp, y: 2 * R, a: -PI};             // top run, back to front
    sp -= L; const a = sp / R; return {z: L / 2 + Math.sin(a) * R, y: R + Math.cos(a) * R, a: -PI - a};
  }
  const dummy = new THREE.Object3D();
  let travel = 0;
  function update(speed, dt) {
    travel += speed * dt;
    pads.forEach(({inst, x}) => {
      for (let i = 0; i < N; i++) {
        const q = pathPoint(i * P / N - travel);
        dummy.position.set(x, q.y + (q.y < R ? mm(1.3) : -mm(1.3)), q.z);
        dummy.rotation.set(q.a, 0, 0); dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix);
      }
      inst.instanceMatrix.needsUpdate = true;
    });
    wheels.forEach(w => { w.mesh.rotation.x = -travel / w.r; });
  }
  update(0, 0);
  return {group: g, deckY, update, dispose: () => dispose(g)};
}

/* ------------------------------------------------------------------ */
/* Add-on 2: NURI Board (teaching panel, Wi-Fi display)                */
/* ------------------------------------------------------------------ */
export function createBoard() {
  const g = new THREE.Group(), m = materials(COLOURS[1]);
  const W = mm(246), H = mm(172), T = mm(8.5), bez = mm(9);
  const canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = 860;
  const ctx = canvas.getContext('2d'), tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  // stand
  const stand = new THREE.Group(); g.add(stand);
  add(stand, rbox(mm(130), mm(7), mm(96), mm(3)), m.core, [0, mm(3.5), 0]);
  add(stand, rbox(mm(40), mm(70), mm(10), mm(3)), m.core, [0, mm(40), -mm(18)], [-.18, 0, 0]);
  const panel = new THREE.Group(); panel.position.set(0, mm(78), -mm(10)); panel.rotation.x = -.2; stand.add(panel);
  add(panel, rbox(W, H, T, mm(6)), m.core, [0, H / 2 - mm(8), 0]);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W - 2 * bez, H - 2 * bez), new THREE.MeshBasicMaterial({map: tex, toneMapped: false}));
  screen.position.set(0, H / 2 - mm(8), T / 2 + mm(.1)); panel.add(screen);
  add(panel, cyl(mm(1.5), mm(1.5), mm(.5), 16), m.glass, [0, H - mm(12), T / 2 + mm(.1)], [PI / 2, 0, 0]);
  const steps = ['2x + 3 = 11', '2x = 11 − 3', '2x = 8', 'x = 8 ÷ 2', 'x = 4'];
  const notes = ['Start with the equation', 'Move +3 to the right side', 'Simplify', 'Divide both sides by 2', 'Check: 2(4) + 3 = 11 ✓'];
  function draw(t) {
    const cycle = 15, u = t % cycle, shown = Math.min(steps.length, Math.floor(u / 2.4) + 1), part = (u % 2.4) / 1.2;
    ctx.fillStyle = '#fbfbf8'; ctx.fillRect(0, 0, 1280, 860);
    ctx.fillStyle = '#eef2ef'; ctx.fillRect(0, 0, 1280, 92);
    ctx.fillStyle = '#1d2b27'; ctx.font = '600 38px Inter, Arial, sans-serif'; ctx.textBaseline = 'middle'; ctx.fillText('Algebra · Solving for x', 48, 47);
    ctx.fillStyle = '#4fbf9f'; ctx.beginPath(); ctx.arc(1204, 47, 12, 0, 2 * PI); ctx.fill();
    ctx.fillStyle = '#6a7470'; ctx.font = '500 26px Inter, Arial, sans-serif'; ctx.fillText('NURI', 1100, 47);
    for (let i = 0; i < shown; i++) {
      const y = 170 + i * 128, last = i === shown - 1, frac = last ? Math.min(1, part) : 1;
      ctx.save(); ctx.beginPath(); ctx.rect(0, y - 70, 120 + 900 * frac, 140); ctx.clip();
      ctx.fillStyle = i === steps.length - 1 ? '#1f8a6a' : '#1d2430'; ctx.font = '500 64px "Comic Sans MS", "Segoe Print", Inter, cursive';
      ctx.fillText(steps[i], 120, y);
      ctx.restore();
      ctx.fillStyle = '#7d8783'; ctx.font = '400 24px Inter, Arial, sans-serif'; ctx.globalAlpha = frac; ctx.fillText(notes[i], 760, y + 6); ctx.globalAlpha = 1;
      ctx.fillStyle = '#c9d3cf'; ctx.font = '600 26px Inter, Arial, sans-serif'; ctx.fillText(String(i + 1), 60, y);
    }
    if (shown === steps.length && part > .9) { ctx.strokeStyle = '#1f8a6a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(250, 170 + 4 * 128, 170, 58, 0, 0, 2 * PI); ctx.stroke(); }
    ctx.fillStyle = '#9aa39f'; ctx.font = '400 20px Inter, Arial, sans-serif'; ctx.fillText('Concept demo · lesson content shown on the NURI Board', 48, 826);
    tex.needsUpdate = true;
    return {step: shown - 1, writing: part < 1};
  }
  draw(0);
  return {group: g, draw, screenWorld: () => screen.getWorldPosition(new THREE.Vector3()), dispose: () => dispose(g)};
}

/* ------------------------------------------------------------------ */
/* Stage: renderer, lights, camera, controls                          */
/* ------------------------------------------------------------------ */
export function createStage(container, opts = {}) {
  const o = Object.assign({target: [0, 1.4, 0], camera: [4.2, 3, 7.4], fov: 30, controls: true, autoRotate: false, floor: true, minDist: 3.5, maxDist: 16}, opts);
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: !!o.preserve});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c2bd, .35));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(4, 9, 6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, {left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30}); key.shadow.bias = -.0004; key.shadow.radius = 4;
  scene.add(key);
  if (o.floor) {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({opacity: .16}));
    floor.rotation.x = -PI / 2; floor.receiveShadow = true; scene.add(floor);
  }
  const camera = new THREE.PerspectiveCamera(o.fov, 1, .05, 200); camera.position.set(...o.camera);
  let controls = null;
  if (o.controls) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...o.target); controls.enableDamping = true; controls.enablePan = false;
    controls.minDistance = o.minDist; controls.maxDistance = o.maxDist; controls.minPolarAngle = .25; controls.maxPolarAngle = PI * .49;
    controls.autoRotate = o.autoRotate; controls.autoRotateSpeed = .6;
    controls.addEventListener('start', () => { controls.autoRotate = false; });
  } else camera.lookAt(...o.target);
  let fitArgs = null, userMoved = false;
  if (controls) controls.addEventListener('start', () => { userMoved = true; });
  // place the camera so a sphere (or object) fills the view at any aspect ratio
  function fit(target, dir = [1, .55, 1.6], margin = 1.12) {
    fitArgs = [target, dir, margin]; userMoved = false;
    let center, radius;
    if (target.isObject3D) { const s = new THREE.Box3().setFromObject(target).getBoundingSphere(new THREE.Sphere()); center = s.center; radius = s.radius; }
    else { center = new THREE.Vector3(...target.center); radius = target.radius; }
    const v = camera.fov * D2R, h = 2 * Math.atan(Math.tan(v / 2) * camera.aspect), f = Math.min(v, h);
    const dist = radius * margin / Math.sin(f / 2);
    camera.position.copy(center).add(new THREE.Vector3(...dir).normalize().multiplyScalar(dist));
    if (controls) { controls.target.copy(center); controls.minDistance = dist * .55; controls.maxDistance = dist * 1.8; controls.update(); }
    else camera.lookAt(center);
  }
  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (fitArgs && !userMoved) fit(...fitArgs);
  };
  new ResizeObserver(resize).observe(container); resize();
  const clock = new THREE.Clock(); let fn = null, running = false;
  function loop() { const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime; if (fn) fn(t, dt); if (controls) controls.update(); renderer.render(scene, camera); }
  const stage = {
    THREE, scene, camera, renderer, controls, clock,
    onFrame(f) { fn = f; },
    fit,
    start() { if (!running) { running = true; renderer.setAnimationLoop(loop); } },
    stop() { running = false; renderer.setAnimationLoop(null); },
    renderOnce() { loop(); },
    // only animate while visible on screen
    autoPause() { new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? stage.start() : stage.stop()), {threshold: .05}).observe(container); }
  };
  return stage;
}

export const webglAvailable = () => { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch { return false; } };
export const prefersReducedMotion = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
