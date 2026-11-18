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
import {T as tr} from './i18n.js?v=a05019bc';
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
  {id: 'signature', name: 'Signature', blurb: tr('Slim face frame and soft side panels. The everyday NURI.', 'Bingkai muka yang nipis dan panel sisi yang lembut. NURI untuk hari-hari.')},
  {id: 'focus', name: 'Focus', blurb: tr('Headphone-style side cups with a high, open band. Made for study and work.', 'Cawan sisi gaya headphone dengan lengkung atas yang terbuka. Sesuai untuk belajar dan bekerja.')},
  {id: 'buddy', name: 'Buddy', blurb: tr('Rounded frame and small side ears. Friendly at home and at the counter.', 'Bingkai bulat dan telinga kecil di sisi. Mesra di rumah, mesra di kaunter.')}
];
export const COLOURS = [
  {id: 'pearl', name: 'Pearl', suit: '#eef1f0', accent: '#4fbf9f'},
  {id: 'graphite', name: 'Graphite', suit: '#3b4149', accent: '#86d9c1'},
  {id: 'coral', name: 'Coral', suit: '#f6e6de', accent: '#e9785a'}
];
export const BASE_PRICE = 999;
export const DOCKS = [
  {id: 'slim', name: 'Slim Dock', price: 0, blurb: tr('Low tray that disappears on a desk. Slide NURI in to charge. Included.', 'Dulang rendah yang tak semak atas meja. Letak NURI, terus mengecas. Termasuk.')},
  {id: 'nest', name: 'Nest Dock', price: 50, blurb: tr('A shallow bowl wrapped in woven rings, like a small nest. +RM50.', 'Mangkuk cetek berlilit cincin anyaman, macam sarang kecil. +RM50.')}
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
    // a soft, rounded slab with a continuous U-shaped rim (open at the front so NURI slides in)
    const floor = mm(4.5), t = mm(3.2), rimH = mm(7), lip = mm(9);
    const px = POCKET.w / 2, pz = POCKET.d / 2, W = POCKET.w + 2 * t + mm(2), D = POCKET.d + t + lip + mm(1);
    const cz = (lip - t) / 2;                                   // slab centre, shifted forward for the engraving lip
    const slab = extrude(rr(W, D, mm(10)), floor, mm(1.6)); slab.rotateX(-PI / 2); slab.translate(0, -floor / 2 - floor / 2, 0);
    add(g, slab, m.dock, [0, 0, cz]);
    // U rim: shape drawn in plan view (x, -z), extruded upward
    const u = new THREE.Shape(), ro = mm(6), ri = mm(2), X = px + t, Zb = pz + t, Zf = pz;
    u.moveTo(-X, -Zf); u.lineTo(-X, Zb - ro); u.quadraticCurveTo(-X, Zb, -X + ro, Zb); u.lineTo(X - ro, Zb); u.quadraticCurveTo(X, Zb, X, Zb - ro);
    u.lineTo(X, -Zf); u.lineTo(px, -Zf); u.lineTo(px, pz - ri); u.quadraticCurveTo(px, pz, px - ri, pz); u.lineTo(-px + ri, pz); u.quadraticCurveTo(-px, pz, -px, pz - ri); u.lineTo(-px, -Zf); u.closePath();
    const rim = extrude(u, rimH, mm(1.2)); rim.rotateX(-PI / 2); rim.translate(0, -rimH / 2, 0);
    add(g, rim, m.dock, [0, rimH / 2 + mm(.4), 0]);
    // thin accent line around the slab, three slim vents per side, USB-C plug and input, support ribs
    const band = extrude(rr(W + mm(.9), D + mm(.9), mm(10.4)), mm(.7), 0); band.rotateX(-PI / 2);
    add(g, band, m.accent, [0, -floor + mm(.8), cz]);
    mirror(sd => [-1, 0, 1].forEach(i => add(g, rbox(mm(.5), mm(3.2), mm(9), mm(.25)), m.hole, [sd * (X + mm(.2)), rimH * .55, i * mm(13) - mm(4)])));
    add(g, rbox(mm(8.2), mm(2.4), mm(5), mm(1)), m.metal, [0, mm(7.5), -pz + mm(2)]);
    add(g, rbox(mm(9.2), mm(3.4), mm(.8), mm(1.5)), m.port, [0, mm(3.2), -Zb - mm(1.4)]);
    [-1, 0, 1].forEach(i => add(g, rbox(mm(3), mm(2), POCKET.d - mm(8), mm(.6)), m.rubber, [i * mm(14), mm(1), 0]));
    // engraving on the top of the front lip, slightly recessed
    const tex = engraveTexture(engraving(name), false);
    add(g, new THREE.PlaneGeometry(mm(36), mm(5.4)), new THREE.MeshStandardMaterial({map: tex, roughness: .55}), [0, mm(.02), pz + lip / 2 + mm(.3)], [-PI / 2, 0, 0]);
    info = {height: floor + mm(.6), footprint: [W, D]};
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
/* Accessories: carry NURI while you walk                              */
/* One NURI Go Cradle (latches, battery, quick-release plate) fits two  */
/* mounts: a camera-style Strap Clip and a Shoulder Perch. Shown on a   */
/* dress form wearing a backpack, at real size.                         */
/* ------------------------------------------------------------------ */
function ringGeo(ow, oh, iw, ih, r, ri, depth) {
  const sh = rr(ow, oh, r); sh.holes.push(rr(iw, ih, ri, new THREE.Path()));
  const g = new THREE.ExtrudeGeometry(sh, {depth, bevelEnabled: false, curveSegments: 10}); g.translate(0, 0, -depth / 2); return g;
}
// The cradle NURI rides in. Origin = top of the support ribs, where the K151 base sits.
function goCradle(m, name) {
  const g = new THREE.Group(), W = POCKET.w + mm(6), D = POCKET.d + mm(6);
  // battery body (2000 mAh cell) and the rim, one rounded shell
  add(g, rbox(W + mm(2), mm(12), D + mm(2), mm(6)), m.dock, [0, -mm(6), 0]);
  add(g, ringGeo(W, D, POCKET.w, POCKET.d, mm(6), mm(2), mm(7)), m.dock, [0, mm(3.5), 0], [PI / 2, 0, 0]);
  add(g, rbox(W + mm(2.4), mm(1.2), D + mm(2.4), mm(6)), m.accent, [0, -mm(8.4), 0]);              // accent seam
  [-1, 0, 1].forEach(i => add(g, rbox(mm(3), mm(2), POCKET.d - mm(8), mm(.6)), m.rubber, [i * mm(14), -mm(1), 0]));
  add(g, rbox(mm(8.2), mm(2.4), mm(5), mm(1)), m.metal, [0, mm(5.5), -POCKET.d / 2 + mm(2)]);        // USB-C plug into the base
  // spring latches: lips clip 1.2 mm over the base's top edge, still 4 mm below the head
  mirror(sd => {
    const l = new THREE.Group(); l.position.set(sd * (W / 2 + mm(.6)), 0, 0); g.add(l);
    add(l, rbox(mm(3), mm(12.3), mm(16), mm(1.2)), m.accent, [0, mm(6.15), 0]);
    add(l, rbox(mm(4.4), mm(1.4), mm(16), mm(.6)), m.accent, [-sd * mm(3.2), mm(11.8), 0]);
    add(l, rbox(mm(1), mm(5), mm(10), mm(.4)), m.hole, [sd * mm(1.6), mm(4), 0]);                      // finger grip
  });
  // front: engraving, three charge LEDs; side: USB-C input
  add(g, new THREE.PlaneGeometry(mm(34), mm(5.2)), new THREE.MeshStandardMaterial({map: engraveTexture(engraving(name), false), roughness: .55}), [0, -mm(4.6), D / 2 + mm(1.05)]);
  [-1, 0, 1].forEach(i => add(g, cyl(mm(.9), mm(.9), mm(.6), 12), i < 1 ? m.led : m.hole, [mm(20) + i * mm(3.2), -mm(9.6), D / 2 + mm(1.1)], [PI / 2, 0, 0]));
  add(g, rbox(mm(.8), mm(3.4), mm(9.2), mm(1.4)), m.port, [-(W / 2 + mm(1.2)), -mm(6.5), -mm(14)]);
  // quick-release dovetail underneath (slides into either mount, locks with a spring button)
  const dt = new THREE.Shape(); dt.moveTo(-mm(15), 0); dt.lineTo(mm(15), 0); dt.lineTo(mm(19), -mm(5)); dt.lineTo(-mm(19), -mm(5)); dt.closePath();
  const dg = new THREE.ExtrudeGeometry(dt, {depth: D - mm(6), bevelEnabled: false}); dg.translate(0, -mm(12), -(D - mm(6)) / 2);
  add(g, dg, m.dockDark);
  return {group: g, bottom: -mm(17), W, D};
}
// a mount's receiver: rails that take the dovetail, plus the release button
function receiver(m, len) {
  const g = new THREE.Group();
  add(g, rbox(mm(56), mm(4), len, mm(2)), m.dockDark, [0, mm(2), 0]);
  mirror(sd => add(g, rbox(mm(6), mm(5), len, mm(1.2)), m.dockDark, [sd * mm(22), mm(6.5), 0]));
  add(g, cyl(mm(4), mm(4), mm(3), 24), m.accent, [mm(22) + mm(4.5), mm(5), len / 2 - mm(8)], [0, 0, PI / 2]);
  return g;
}
// dress form wearing a backpack: chest ellipsoid, shoulder bar, neck with a wooden cap
function dressForm() {
  const g = new THREE.Group(), linen = new THREE.MeshStandardMaterial({color: '#e8e1d4', roughness: .92}), wood = new THREE.MeshStandardMaterial({color: '#6e5038', roughness: .55});
  const chest = new THREE.SphereGeometry(1, 72, 48); chest.scale(mm(180), mm(250), mm(118)); add(g, chest, linen, [0, -mm(215), 0]);
  const sh = new THREE.CapsuleGeometry(mm(62), mm(250), 16, 48); sh.rotateZ(PI / 2); sh.scale(1, 1, .95); add(g, sh, linen, [0, -mm(18), 0]);
  add(g, cyl(mm(50), mm(54), mm(120), 48), linen, [0, mm(95), 0]);
  add(g, cyl(mm(56), mm(56), mm(12), 48), wood, [0, mm(160), 0]);
  add(g, new THREE.SphereGeometry(mm(11), 24, 16), wood, [0, mm(174), 0]);
  mirror(sd => add(g, cyl(mm(52), mm(52), mm(8), 40), wood, [sd * mm(187), -mm(18), 0], [0, 0, PI / 2]));   // arm caps
  return g;
}
const STRAP_W = mm(62), STRAP_T = mm(14);
function strapCurve(sd) {
  const zs = (x, y) => { const e = 1 - (x / mm(180)) ** 2 - ((y + mm(215)) / mm(250)) ** 2; return e > 0 ? mm(118) * Math.sqrt(e) : 0; };
  const pts = [], R = mm(62) + STRAP_T / 2 + mm(2);
  const front = [-430, -340, -250, -170, -100].map(y => { const x = sd * mm(96 + (y + 430) * .06); return new THREE.Vector3(x, mm(y), zs(x, mm(y)) + STRAP_T / 2 + mm(2)); });
  pts.push(...front);
  [28, 55, 90, 125, 152].forEach(a => { const r = a * D2R; pts.push(new THREE.Vector3(sd * mm(118), -mm(18) + R * Math.sin(r), R * Math.cos(r))); });
  pts.push(...front.slice().reverse().map(v => new THREE.Vector3(v.x, v.y, -v.z)));
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
}
function strapGeo(curve) {
  const sh = rr(STRAP_W, STRAP_T, mm(5));   // the path normal runs across the body here, so width goes on shape x
  return new THREE.ExtrudeGeometry(sh, {steps: 220, bevelEnabled: false, extrudePath: curve});
}
// local frame on the strap at parameter t: x across, along = tangent, out = away from the body
function strapFrame(curve, t) {
  const p = curve.getPointAt(t), T = curve.getTangentAt(t).normalize(), X = new THREE.Vector3(1, 0, 0);
  const N = new THREE.Vector3().crossVectors(X, T).normalize(), Xo = new THREE.Vector3().crossVectors(T, N).normalize();
  return {p, T, N, X: Xo};
}
function findT(curve, test) { let best = 0, bv = Infinity; for (let i = 0; i <= 400; i++) { const t = i / 400, v = test(curve.getPointAt(t), t); if (v < bv) { bv = v; best = t; } } return best; }

export function createWearable(kind, colourId = 'pearl', name = '') {
  const m = materials(COLOURS.find(c => c.id === colourId) || COLOURS[0]);
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  body.add(dressForm());
  const webbing = new THREE.MeshStandardMaterial({color: '#33383e', roughness: .95}), webEdge = new THREE.MeshStandardMaterial({color: '#23272b', roughness: .9});
  const curves = [1, -1].map(strapCurve);
  curves.forEach(c => add(body, strapGeo(c), webbing));
  // sternum strap with a buckle, so it reads as a backpack
  const sy = -mm(205), sz = c => c.getPointAt(findT(c, p => p.z > 0 ? Math.abs(p.y - sy) : 1e9)).z + STRAP_T / 2 + mm(1.5);
  // follows the chest between the two straps, in short segments
  const chestZ = x => mm(118) * Math.sqrt(Math.max(0, 1 - (x / mm(180)) ** 2 - ((sy + mm(215)) / mm(250)) ** 2)) + mm(3);
  const xs = Math.abs(curves[0].getPointAt(findT(curves[0], p => p.z > 0 ? Math.abs(p.y - sy) : 1e9)).x);
  for (let i = 0; i < 16; i++) {
    const x0 = -xs + (2 * xs) * i / 16, x1 = -xs + (2 * xs) * (i + 1) / 16, z0 = Math.max(chestZ(x0), sz(curves[0]) * 0), z1 = chestZ(x1);
    const seg = add(body, rbox(Math.hypot(x1 - x0, z1 - z0) + mm(1), mm(20), mm(2.4), mm(.6)), webEdge, [(x0 + x1) / 2, sy, (z0 + z1) / 2]);
    seg.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
  }
  const bz = chestZ(0);
  add(body, rbox(mm(46), mm(26), mm(7), mm(3)), m.rubber, [0, sy, bz + mm(3)]);
  const fem = add(body, rbox(mm(18), mm(18), mm(6), mm(2)), m.accent, [mm(14), sy, bz + mm(5.5)]); fem.castShadow = false;
  const parts = [];   // [object, explode offset in its parent's frame]
  const nuri = createNuri({look: kind === 'strap' ? 'buddy' : 'signature', colour: colourId, showDock: false});
  const cr = goCradle(m, name), carrier = new THREE.Group(); carrier.add(cr.group, nuri.root); nuri.root.position.y = mm(1);
  let mountWorld, frameMat, maxPanToWearer;
  if (kind === 'strap') {
    // Strap Clip: two plates clamp the strap with two thumbscrews (like a camera clip); a hinged shelf keeps NURI level
    const c = curves[0], t = findT(c, (p, t) => (t < .5 && p.z > 0) ? Math.abs(p.y + mm(165)) : 1e9), f = strapFrame(c, t);
    const mount = new THREE.Group(); body.add(mount);
    mount.matrixAutoUpdate = true; const basis = new THREE.Matrix4().makeBasis(f.X, f.T, f.N);
    mount.quaternion.setFromRotationMatrix(basis); mount.position.copy(f.p).addScaledVector(f.N, STRAP_T / 2);
    const front = new THREE.Group(); mount.add(front);
    const plate = extrude(rr(mm(92), mm(60), mm(9)), mm(6), mm(1)); add(front, plate, m.dock, [0, 0, mm(3)]);
    add(mount, extrude(rr(mm(92), mm(60), mm(9)), mm(4), mm(.8)), m.dockDark, [0, 0, -STRAP_T - mm(2.5)]);
    const knobs = new THREE.Group(); mount.add(knobs);
    mirror(sd => {
      add(mount, cyl(mm(2.5), mm(2.5), STRAP_T + mm(12), 16), m.metal, [sd * mm(39), mm(12), -STRAP_T / 2 + mm(1)], [PI / 2, 0, 0]);
      const k = add(knobs, cyl(mm(8), mm(8), mm(9), 28), m.metal, [sd * mm(39), mm(12), mm(11)], [PI / 2, 0, 0]);
      k.material = new THREE.MeshStandardMaterial({color: '#9aa1a8', metalness: .9, roughness: .45, flatShading: true});
      add(knobs, cyl(mm(4), mm(4), mm(1), 20), m.accent, [sd * mm(39), mm(12), mm(15.7)], [PI / 2, 0, 0]);
    });
    // hinge with detents at the bottom of the plate; the shelf pivots so NURI sits level whatever the strap angle
    const hinge = new THREE.Group(); hinge.position.set(0, -mm(24), mm(9)); front.add(hinge);
    add(hinge, cyl(mm(5), mm(5), mm(62), 28), m.dockDark, [0, 0, 0], [0, 0, PI / 2]);
    mirror(sd => add(hinge, cyl(mm(6.5), mm(6.5), mm(3), 12), m.accent, [sd * mm(32.5), 0, 0], [0, 0, PI / 2]));
    const up = new THREE.Vector3(0, 1, 0); hinge.rotation.x = Math.atan2(f.N.dot(up), f.T.dot(up)) - 0;
    const shelf = new THREE.Group(); shelf.position.set(0, mm(2), 0); hinge.add(shelf);
    add(shelf, rbox(mm(62), mm(6), mm(84), mm(3)), m.dock, [0, mm(3), mm(44)]);
    mirror(sd => { const tri = new THREE.Shape(); tri.moveTo(0, 0); tri.lineTo(mm(40), 0); tri.lineTo(0, -mm(18)); tri.closePath();
      const tg = new THREE.ExtrudeGeometry(tri, {depth: mm(4), bevelEnabled: false}); tg.rotateY(-PI / 2); add(shelf, tg, m.dock, [sd * mm(24) + mm(2), 0, mm(4)]); });
    const rec = receiver(m, mm(70)); rec.position.set(0, mm(6), mm(48)); shelf.add(rec);
    carrier.position.set(0, mm(6) + mm(4) - cr.bottom, mm(48)); shelf.add(carrier);
    parts.push([front, [0, 0, mm(28)]], [knobs, [0, 0, mm(55)]], [carrier, [0, mm(18), mm(70)]], [nuri.root, [0, mm(40), 0]]);
    maxPanToWearer = 130 * D2R;
  } else {
    // Shoulder Perch: EVA saddle on the backpack strap where it crosses the shoulder, two hook-and-loop straps,
    // rigid top plate with an outrigger so NURI sits over the shoulder tip, clear of your head
    const c = curves[0], t = findT(c, p => -p.y), f = strapFrame(c, t);
    const mount = new THREE.Group(); body.add(mount);
    const fwd = f.T.clone().negate(); mount.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(f.X, f.N, fwd));
    mount.position.copy(f.p).addScaledVector(f.N, STRAP_T / 2);
    const foam = new THREE.MeshStandardMaterial({color: '#2b2f34', roughness: 1});
    add(mount, rbox(mm(80), mm(16), mm(120), mm(7)), foam, [0, mm(8), 0]);
    mirror(sd => add(mount, rbox(mm(8), mm(26), mm(120), mm(3.5)), foam, [sd * (STRAP_W / 2 + mm(5)), -mm(5), 0]));
    const straps = [-1, 1].map(sz => { const r = add(mount, ringGeo(mm(90), mm(44), mm(84), mm(38), mm(8), mm(6), mm(22)), m.accent, [0, -mm(1), sz * mm(40)]); return [r, [0, 0, sz * mm(22)]]; });
    const top = new THREE.Group(); top.position.set(0, mm(16), 0); mount.add(top);
    add(top, extrude(rr(mm(112), mm(100), mm(14)), mm(6), mm(1.2)).rotateX(PI / 2), m.dock, [mm(18), mm(6), 0]);
    const rec = receiver(m, mm(70)); rec.position.set(mm(36), mm(6), 0); top.add(rec);
    carrier.position.set(mm(36), mm(6) + mm(4) - cr.bottom, 0); top.add(carrier);
    parts.push(...straps, [top, [0, mm(22), 0]], [carrier, [0, mm(26), 0]], [nuri.root, [0, mm(40), 0]]);
    maxPanToWearer = 60 * D2R;   // firmware limit on the perch, so the head never swings towards your face
  }
  parts.forEach(pt => { pt.push(pt[0].position.clone()); });
  root.updateMatrixWorld(true);
  mountWorld = nuri.root.getWorldPosition(new THREE.Vector3());
  return {
    root, body, nuri, parts, maxPanToWearer, focus: mountWorld,
    explode(k) { parts.forEach(([o, off, p0]) => o.position.set(p0.x + off[0] * k, p0.y + off[1] * k, p0.z + off[2] * k)); },
    dispose() { dispose(root); }
  };
}

/* ------------------------------------------------------------------ */
/* Add-on 2: NURI Board (teaching panel, Wi-Fi display)                */
/* ------------------------------------------------------------------ */
export function createBoard() {
  const g = new THREE.Group(), m = materials(COLOURS[1]);
  const W = mm(246), H = mm(172), T = mm(6.5), bez = mm(6);
  const canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = 860;
  const ctx = canvas.getContext('2d'), tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  // minimal aluminium stand: thin base plate, front lip and a leaning back support
  const alu = new THREE.MeshStandardMaterial({color: '#c9ced3', metalness: .85, roughness: .32});
  const stand = new THREE.Group(); g.add(stand);
  add(stand, rbox(mm(120), mm(4), mm(78), mm(2)), alu, [0, mm(2), -mm(6)]);
  add(stand, rbox(mm(120), mm(9), mm(4), mm(1.5)), alu, [0, mm(6.5), mm(31)]);
  add(stand, rbox(mm(70), mm(118), mm(3), mm(1.5)), alu, [0, mm(58), -mm(10)], [-.26, 0, 0]);
  const tilt = -.24, panel = new THREE.Group(); panel.position.set(0, mm(5), mm(27)); panel.rotation.x = tilt; stand.add(panel);
  const backMat = new THREE.MeshStandardMaterial({color: '#aab0b6', metalness: .7, roughness: .38});
  add(panel, rbox(W, H, T, mm(10)), backMat, [0, H / 2, -T / 2]);
  add(panel, rbox(W - mm(.6), H - mm(.6), mm(1), mm(9.6)), m.glass, [0, H / 2, mm(.1)]);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W - 2 * bez, H - 2 * bez), new THREE.MeshBasicMaterial({map: tex, toneMapped: false}));
  screen.position.set(0, H / 2, mm(.7)); panel.add(screen);
  add(panel, cyl(mm(1.2), mm(1.2), mm(.4), 16), m.core, [0, H - bez / 2, mm(.7)], [PI / 2, 0, 0]);
  const steps = ['2x + 3 = 11', '2x = 11 − 3', '2x = 8', 'x = 8 ÷ 2', 'x = 4'];
  const notes = tr(['Start with the equation', 'Move +3 to the right side', 'Simplify', 'Divide both sides by 2', 'Check: 2(4) + 3 = 11 ✓'], ['Mula dengan persamaan', 'Alihkan +3 ke sebelah kanan', 'Ringkaskan', 'Bahagi kedua-dua belah dengan 2', 'Semak: 2(4) + 3 = 11 ✓']);
  function draw(t) {
    const cycle = 15, u = t % cycle, shown = Math.min(steps.length, Math.floor(u / 2.4) + 1), part = (u % 2.4) / 1.2;
    ctx.fillStyle = '#fbfbf8'; ctx.fillRect(0, 0, 1280, 860);
    ctx.fillStyle = '#eef2ef'; ctx.fillRect(0, 0, 1280, 92);
    ctx.fillStyle = '#1d2b27'; ctx.font = '600 38px Inter, Arial, sans-serif'; ctx.textBaseline = 'middle'; ctx.fillText(tr('Algebra · Solving for x', 'Algebra · Cari nilai x'), 48, 47);
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
    ctx.fillStyle = '#9aa39f'; ctx.font = '400 20px Inter, Arial, sans-serif'; ctx.fillText(tr('Concept demo · lesson content shown on the NURI Board', 'Demo konsep · isi pelajaran dipaparkan pada NURI Board'), 48, 826);
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
