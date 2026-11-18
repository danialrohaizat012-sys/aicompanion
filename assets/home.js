import * as N from './nuri3d.js';
import {createPlayer} from './scenes.js';

/* header: border on scroll, mobile menu */
const head = document.querySelector('.site-head');
const onScroll = () => head.classList.toggle('scrolled', window.scrollY > 8);
addEventListener('scroll', onScroll, {passive: true}); onScroll();
const menuBtn = document.querySelector('.menu-btn'), nav = document.getElementById('nav');
menuBtn.addEventListener('click', () => { const open = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', open); });
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }));

const still = N.prefersReducedMotion();
const gl = N.webglAvailable();

/* hero */
if (gl) {
  const el = document.getElementById('heroStage');
  try {
    const st = N.createStage(el, {target: [0, 1.45, 0], camera: [4.3, 2.7, 7.1], minDist: 5, maxDist: 11});
    const nuri = N.createNuri({look: 'signature', colour: 'pearl', dock: 'slim', name: 'Kront'});
    nuri.root.rotation.y = -.38; st.scene.add(nuri.root);
    st.fit(nuri.root, [.55, .38, 1.3], .86);
    st.onFrame(t => nuri.idle(t, still));
    el.querySelector('.fallback').remove();
    st.autoPause();
  } catch (e) { console.warn('3D unavailable', e); }
}

/* add-ons */
const ADDONS = {
  rover: {
    title: 'NURI Rover',
    text: 'A tracked base that lets NURI move around a desk, a counter or a classroom table. NURI slides into its cradle like a dock, and the Rover\'s battery keeps it charged through the same USB-C port.',
    spec: [['Drive', 'Twin rubber tracks, four road wheels a side'], ['Size', 'About 130 × 108 × 42 mm (planned)'], ['Power', 'Own battery; charges NURI through its base'], ['Sensing', 'Front depth sensor and headlights'], ['Control', 'Commanded by NURI over a wired link (planned)']]
  },
  board: {
    title: 'NURI Board',
    text: 'A 10-inch screen that becomes NURI\'s whiteboard. NURI talks the student through a problem while the Board shows each step, so the lesson is easy to follow.',
    spec: [['Screen', '10.1" display on an adjustable stand'], ['Link', 'Wi-Fi to the NURI app'], ['Power', 'Its own USB-C supply'], ['Uses', 'Lessons, shop menus and queues, daily briefs'], ['Or', 'Use a tablet you already own (planned)']]
  }
};
const textEl = document.getElementById('addonText'), noteEl = document.getElementById('addonNote');
function renderText(id) {
  const a = ADDONS[id];
  textEl.innerHTML = `<span class="status">Concept · optional · price to be announced</span><h3 style="font-size:28px;margin:12px 0 14px;letter-spacing:-.02em">${a.title}</h3><p class="lead">${a.text}</p><ul class="spec">${a.spec.map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`).join('')}</ul>`;
}

let addonStage = null, scene = null, current = null;
function clearScene() { if (!current) return; current.objs.forEach(o => { addonStage.scene.remove(o.root || o.group); o.dispose(); }); current = null; }
function buildRover() {
  const nuri = N.createNuri({look: 'focus', colour: 'graphite', showDock: false});
  const rover = N.createRover('graphite');
  const carrier = new addonStage.THREE.Group(); carrier.add(rover.group, nuri.root); nuri.root.position.y = rover.deckY;
  addonStage.scene.add(carrier);
  addonStage.fit({center: [0, 1.3, 0], radius: 4.4}, [.55, .5, 1], 1);
  const R = 1.8, speed = .5;
  let ang = 0;
  return {objs: [{root: carrier, dispose: () => { rover.dispose(); nuri.dispose(); }}], frame(t, dt) {
    if (!still) ang += dt * speed / R;
    carrier.position.set(Math.cos(ang) * R, 0, Math.sin(ang) * R);
    carrier.rotation.y = -ang;                       // travel along the circle (local +z forward)
    rover.update(still ? 0 : speed, dt);
    nuri.setPose(Math.sin(t * .6) * .6, (-10 + Math.sin(t * .9) * 8) * Math.PI / 180);
  }};
}
function buildBoard() {
  const nuri = N.createNuri({look: 'focus', colour: 'pearl', dock: 'slim', name: 'Reka'});
  nuri.root.position.set(-1.6, 0, 1.4); nuri.root.rotation.y = .25;
  const board = N.createBoard(); board.group.position.set(2.6, 0, -1.6); board.group.rotation.y = -.42;
  addonStage.scene.add(nuri.root, board.group);
  addonStage.fit({center: [.6, 3.4, -.5], radius: 6.3}, [.12, .25, 1], 1);
  let frameN = 0, lookAt = 0, s = {writing: false};
  return {objs: [nuri, board], frame(t) {
    if (frameN++ % 2 === 0) s = board.draw(still ? 13 : t);   // redraw the screen every other frame
    const want = s.writing ? .95 : 0;                           // look at the board while a step is written, then back
    lookAt += (want - lookAt) * .06;
    nuri.setPose(lookAt, (-12 - lookAt * 6) * Math.PI / 180);
    nuri.idle(t, true);
  }};
}
function show(id) {
  addonTab = id;
  renderText(id);
  document.querySelectorAll('.tabs [role=tab]').forEach(b => b.setAttribute('aria-selected', b.id === 'tab-' + id));
  document.getElementById('panel-addon').setAttribute('aria-labelledby', 'tab-' + id);
  if (!addonStage) return;
  clearScene(); current = id === 'rover' ? buildRover() : buildBoard();
  addonStage.controls.update();
}
document.querySelectorAll('.tabs [role=tab]').forEach(b => b.addEventListener('click', () => show(b.id.replace('tab-', ''))));
document.querySelector('.tabs').addEventListener('keydown', e => {
  if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const tabs = [...document.querySelectorAll('.tabs [role=tab]')], i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
  const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); n.click();
});
// the add-on scene is only created when the section comes near the screen
let addonTab = 'rover';
function initAddons() {
  try {
    addonStage = N.createStage(document.getElementById('addonStage'), {target: [0, 1.2, 0], camera: [6.5, 5.2, 9.5]});
    addonStage.onFrame((t, dt) => { if (current) current.frame(t, dt); });
    addonStage.autoPause();
    show(addonTab);
  } catch (e) { console.warn('3D unavailable', e); addonStage = null; noteEl.textContent = '3D preview unavailable on this device.'; }
}
if (gl) {
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); initAddons(); } }, {rootMargin: '400px 0px'});
  io.observe(document.getElementById('addonStage'));
} else noteEl.textContent = '3D preview needs WebGL.';
show('rover');

/* NURI in action: created when the section comes near the screen */
(() => {
  const el = document.getElementById('sceneStage'); if (!el) return;
  const chips = [...document.querySelectorAll('.chips [data-scene]')], btn = document.getElementById('playBtn');
  const who = document.getElementById('capWho'), text = document.getElementById('capText');
  if (!gl) { text.textContent = 'The animations need WebGL.'; btn.hidden = true; return; }
  let player = null;
  const ui = {
    onScene(i) { chips.forEach((c, k) => { c.setAttribute('aria-selected', k === i); c.querySelector('em').style.width = k < i ? '100%' : '0'; }); },
    onCaption(w, s) { who.textContent = w + ':'; text.textContent = s; },
    onProgress(i, p) { const em = chips[i].querySelector('em'); em.style.width = (p * 100).toFixed(1) + '%'; }
  };
  const io = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting) || player) return; io.disconnect();
    try { player = createPlayer(el, ui); if (!player.playing) { btn.textContent = 'Play'; btn.setAttribute('aria-pressed', 'false'); } }
    catch (e) { console.warn('3D unavailable', e); text.textContent = 'Animations are unavailable on this device.'; }
  }, {rootMargin: '300px 0px'});
  io.observe(el);
  chips.forEach((c, i) => c.addEventListener('click', () => player && player.go(i)));
  btn.addEventListener('click', () => { if (!player) return; const on = player.toggle(); btn.textContent = on ? 'Pause' : 'Play'; btn.setAttribute('aria-pressed', on); });
})();
