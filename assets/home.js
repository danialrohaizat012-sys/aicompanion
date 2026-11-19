import * as N from './nuri3d.js?v=34bad43a';
import {createPlayer} from './scenes.js?v=34bad43a';
import {T} from './i18n.js?v=34bad43a';

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
    text: T('A tracked base that lets NURI move around a desk, a counter or a classroom table. NURI slides into its cradle like a dock, and the Rover\'s battery keeps it charged through the same USB-C port.', 'Tapak berantai yang bawa NURI bergerak atas meja, kaunter atau meja kelas. NURI duduk dalam cradle macam atas dock, dan bateri Rover terus cas NURI melalui port USB-C yang sama.'),
    spec: T([['Drive', 'Twin rubber tracks, four road wheels a side'], ['Size', 'About 130 × 108 × 42 mm (planned)'], ['Power', 'Own battery; charges NURI through its base'], ['Sensing', 'Front depth sensor and headlights'], ['Control', 'Commanded by NURI over a wired link (planned)']], [['Pemacu', 'Dua rantai getah, empat roda di setiap sisi'], ['Saiz', 'Lebih kurang 130 × 108 × 42 mm (dirancang)'], ['Kuasa', 'Bateri sendiri; cas NURI melalui tapaknya'], ['Sensor', 'Sensor jarak di depan dan lampu hadapan'], ['Kawalan', 'Dikawal NURI melalui sambungan berwayar (dirancang)']])
  },
  board: {
    title: 'NURI Board',
    text: T('A 10-inch screen that becomes NURI\'s whiteboard. NURI talks the student through a problem while the Board shows each step, so the lesson is easy to follow.', 'Skrin 10 inci yang jadi papan putih NURI. NURI terangkan soalan pada pelajar, Board pula tunjuk setiap langkah. Senang nak ikut.'),
    spec: T([['Screen', '10.1" display on an adjustable stand'], ['Link', 'Wi-Fi to the NURI app'], ['Power', 'Its own USB-C supply'], ['Uses', 'Lessons, shop menus and queues, daily briefs'], ['Or', 'Use a tablet you already own (planned)']], [['Skrin', 'Paparan 10.1 inci atas stand boleh laras'], ['Sambungan', 'Wi-Fi ke aplikasi NURI'], ['Kuasa', 'Bekalan USB-C sendiri'], ['Kegunaan', 'Pelajaran, menu kedai, giliran dan taklimat harian'], ['Atau', 'Guna tablet sedia ada anda (dirancang)']])
  }
};
const textEl = document.getElementById('addonText'), noteEl = document.getElementById('addonNote');
function renderText(id) {
  const a = ADDONS[id];
  textEl.innerHTML = `<span class="status">${T('Concept · optional · price to be announced', 'Konsep · pilihan · harga akan diumumkan')}</span><h3 style="font-size:28px;margin:12px 0 14px;letter-spacing:-.02em">${a.title}</h3><p class="lead">${a.text}</p><ul class="spec">${a.spec.map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`).join('')}</ul>`;
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
  document.querySelectorAll('#add-ons .tabs [role=tab]').forEach(b => b.setAttribute('aria-selected', b.id === 'tab-' + id));
  document.getElementById('panel-addon').setAttribute('aria-labelledby', 'tab-' + id);
  if (!addonStage) return;
  clearScene(); current = id === 'rover' ? buildRover() : buildBoard();
  addonStage.controls.update();
}
document.querySelectorAll('#add-ons .tabs [role=tab]').forEach(b => b.addEventListener('click', () => show(b.id.replace('tab-', ''))));
document.querySelector('#add-ons .tabs').addEventListener('keydown', e => {
  if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const tabs = [...document.querySelectorAll('#add-ons .tabs [role=tab]')], i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
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
  } catch (e) { console.warn('3D unavailable', e); addonStage = null; noteEl.textContent = T('3D preview unavailable on this device.', 'Pratonton 3D tidak tersedia pada peranti ini.'); }
}
if (gl) {
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); initAddons(); } }, {rootMargin: '400px 0px'});
  io.observe(document.getElementById('addonStage'));
} else noteEl.textContent = T('3D preview needs WebGL.', 'Pratonton 3D memerlukan WebGL.');
show('rover');

/* NURI in action: created when the section comes near the screen */
(() => {
  const el = document.getElementById('sceneStage'); if (!el) return;
  const chips = [...document.querySelectorAll('.chips [data-scene]')], btn = document.getElementById('playBtn'), snd = document.getElementById('soundBtn');
  const who = document.getElementById('capWho'), text = document.getElementById('capText');
  if (!gl) { text.textContent = T('The animations need WebGL.', 'Animasi memerlukan WebGL.'); btn.hidden = snd.hidden = true; return; }
  let player = null;
  const sync = () => {
    if (!player) return;
    btn.textContent = player.playing ? T('Pause', 'Jeda') : T('Play', 'Main'); btn.setAttribute('aria-pressed', player.playing);
    snd.setAttribute('aria-pressed', player.sound); snd.querySelector('span').textContent = player.sound ? T('Sound on', 'Bunyi hidup') : T('Sound off', 'Bunyi tutup');
  };
  const ui = {
    onScene(i) { chips.forEach((c, k) => { c.setAttribute('aria-selected', k === i); c.querySelector('em').style.width = k < i ? '100%' : '0'; }); },
    onCaption(w, s) { who.textContent = w + ':'; text.textContent = s; },
    onProgress(i, p) { const em = chips[i].querySelector('em'); em.style.width = (p * 100).toFixed(1) + '%'; },
    onSound() { sync(); }
  };
  const io = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting) || player) return; io.disconnect();
    try { player = createPlayer(el, ui); sync(); }
    catch (e) { console.warn('3D unavailable', e); text.textContent = T('Animations are unavailable on this device.', 'Animasi tidak tersedia pada peranti ini.'); }
  }, {rootMargin: '300px 0px'});
  io.observe(el);
  chips.forEach((c, i) => c.addEventListener('click', () => { if (player) { player.go(i); sync(); } }));
  btn.addEventListener('click', () => { if (!player) return; player.toggle(); sync(); });
  snd.addEventListener('click', () => { if (!player) return; player.setSound(!player.sound); sync(); });
})();

/* Accessory: NURI Strap Clip with the Go Cradle, shown on a dress form wearing a backpack.
   Three views: worn, close-up, and the parts pulled apart with labels. */
(() => {
  const stageEl = document.getElementById('accStage'); if (!stageEl) return;
  const A = {
    title: 'NURI Strap Clip',
    text: T('A camera-style clip for the shoulder strap of your backpack. Two plates clamp the strap with two thumbscrews, a hinged shelf keeps NURI level whatever the strap angle, and NURI rides in the Go Cradle, which slides on and locks with one click.',
      'Klip gaya klip kamera untuk tali beg sandang anda. Dua plat mengapit tali dengan dua skru tombol, rak berengsel pastikan NURI sentiasa rata walaupun tali senget, dan NURI duduk dalam Go Cradle yang disorong masuk dan berkunci dengan satu klik.'),
    spec: T([['Fits', 'Backpack straps up to 70 mm wide and 18 mm thick'], ['Grip', 'Two plates and two stainless thumbscrews; no tools'], ['Level', 'Hinged shelf with detents follows the strap angle'], ['Go Cradle', 'Spring latches over the base edge, 2,000 mAh battery, USB-C input, charge lights'], ['Clearance', 'NURI\'s turning circle stays 11 mm in front of the strap, so it can turn round to face you'], ['Build', 'PETG/ASA prints for the prototype, PC-ABS moulding later; target under 120 g with battery (planned)']],
      [['Sesuai', 'Tali beg sampai 70 mm lebar dan 18 mm tebal'], ['Cengkaman', 'Dua plat dan dua skru tombol keluli tahan karat; tak perlu alat'], ['Rata', 'Rak berengsel dengan detent, ikut sudut tali'], ['Go Cradle', 'Latch spring atas tepi tapak, bateri 2,000 mAh, input USB-C, lampu cas'], ['Ruang', 'Laluan pusingan kepala NURI kekal 11 mm di depan tali, jadi ia boleh berpaling menghadap anda'], ['Pembuatan', 'Cetakan PETG/ASA untuk prototaip, acuan PC-ABS kemudian; sasaran bawah 120 g termasuk bateri (dirancang)']])
  };
  const LABELS = {
    cradle: T('Go Cradle · spring latches', 'Go Cradle · latch spring'), battery: T('2,000 mAh battery', 'Bateri 2,000 mAh'),
    shelf: T('Hinged shelf', 'Rak berengsel'), plate: T('Front clamp plate', 'Plat pengapit depan'),
    knob: T('Thumbscrews', 'Skru tombol'), strap: T('Your backpack strap', 'Tali beg anda')
  };
  const textEl = document.getElementById('accText'), noteEl = document.getElementById('accNote');
  const viewBtns = [...document.querySelectorAll('#accessories [data-view]')];
  textEl.innerHTML = `<span class="status">${T('Concept · accessory · price to be announced', 'Konsep · aksesori · harga akan diumumkan')}</span><h3 style="font-size:28px;margin:12px 0 14px;letter-spacing:-.02em">${A.title}</h3><p class="lead">${A.text}</p><ul class="spec">${A.spec.map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`).join('')}</ul>`;
  const PI = Math.PI, D = PI / 180;
  let stage = null, w = null, view = 'worn', ek = 0, pose = [0, 0], labels = [];
  const VIEWS = {
    worn: f => ({center: [f.x - .9, f.y + .2, f.z - 1.6], radius: 6.4, dir: [.5, .18, 1]}),
    close: f => ({center: [f.x - .1, f.y + .9, f.z - .2], radius: 3.1, dir: [.7, .32, 1]})
  };
  function setView(v) {
    view = v; viewBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.view === v));
    if (!stage || !w) return;
    if (v === 'parts') {
      // frame the pulled-apart parts themselves, seen from the side so the stack reads top to bottom
      w.explode(1); w.root.updateMatrixWorld(true);
      const box = new stage.THREE.Box3(); w.parts.forEach(([o]) => box.expandByObject(o));
      const sph = box.getBoundingSphere(new stage.THREE.Sphere()); w.explode(ek);
      stage.fit({center: sph.center.toArray(), radius: sph.radius * 1.08}, [1, .22, .42], 1);
    } else { const c = VIEWS[v](w.focus); stage.fit({center: c.center, radius: c.radius}, c.dir, 1); }
    stage.controls.update();
  }
  function build() {
    w = N.createWearable('coral', 'Kront'); stage.scene.add(w.root);
    const layer = document.createElement('div'); layer.className = 'acc-labels'; layer.setAttribute('aria-hidden', 'true'); stageEl.appendChild(layer);
    labels = w.anchors.map(a => { const el = document.createElement('span'); el.className = 'acc-label'; a.left = ['cradle', 'battery', 'shelf'].includes(a.key); el.textContent = LABELS[a.key]; layer.appendChild(el); return {a, el}; });
    setView(view);
  }
  let v3 = null;
  function frame(t, dt) {
    if (!w) return;
    const parts = view === 'parts';
    if (!still && !parts) { w.body.position.y = Math.abs(Math.sin(t * PI * 1.8)) * N.MM * 2.5; w.body.rotation.z = Math.sin(t * PI * .9) * .012; }
    else { w.body.position.y = 0; w.body.rotation.z = 0; }
    ek += ((parts ? 1 : 0) - ek) * (still ? 1 : Math.min(1, dt * 4)); w.explode(ek);
    // NURI looks ahead, and every few seconds turns round to the wearer
    const u = t % 8, toYou = !parts && u > 4.4 && u < 7;
    const goal = toYou ? [-w.maxPanToWearer * .95, -42 * D] : [Math.sin(t * .7) * (parts ? 0 : .18), -6 * D];
    const k = still ? 1 : 1 - Math.exp(-dt * 3.5); pose[0] += (goal[0] - pose[0]) * k; pose[1] += (goal[1] - pose[1]) * k;
    w.nuri.setPose(pose[0], pose[1]);
    // labels follow their parts on screen while the parts are apart
    const r = stageEl.getBoundingClientRect(), cam = stage.camera, small = r.width < 560; v3 ??= new stage.THREE.Vector3();
    labels.forEach(({a, el}) => {
      if (small && !['cradle', 'knob'].includes(a.key)) { el.style.opacity = 0; return; }
      a.obj.getWorldPosition(v3).project(cam);
      const px = (v3.x + 1) / 2 * r.width, py = (1 - v3.y) / 2 * r.height, wl = el.offsetWidth + 18;
      // keep every label inside the frame: flip it to the other side of its point if it would overflow
      el.classList.toggle('left', a.left ? px - wl > 0 || px + wl > r.width : px + wl > r.width && px - wl > 0);
      el.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
      el.style.opacity = Math.max(0, ek * 1.4 - .4).toFixed(2);
    });
  }
  viewBtns.forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  if (!gl) { noteEl.textContent = T('3D preview needs WebGL.', 'Pratonton 3D memerlukan WebGL.'); viewBtns.forEach(b => b.disabled = true); return; }
  const io = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting) || stage) return; io.disconnect();
    try {
      stage = N.createStage(stageEl, {target: [0, 0, 0], camera: [5, 3, 8], floor: false, minDist: 2, maxDist: 40});
      stage.onFrame(frame); stage.autoPause(); build();
    } catch (e) { console.warn('3D unavailable', e); stage = null; noteEl.textContent = T('3D preview unavailable on this device.', 'Pratonton 3D tidak tersedia pada peranti ini.'); }
  }, {rootMargin: '400px 0px'});
  io.observe(stageEl);
})();
