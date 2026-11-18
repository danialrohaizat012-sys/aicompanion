import * as N from './nuri3d.js';
import {createPlayer} from './scenes.js';
import {T} from './i18n.js';

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

/* Accessories: Strap Clip and Shoulder Perch, created when the section comes near the screen */
(() => {
  const stageEl = document.getElementById('accStage'); if (!stageEl) return;
  const ACC = {
    strap: {
      title: 'NURI Strap Clip',
      text: T('Clip NURI to the shoulder strap of your bag and talk on the move. A locking cradle holds NURI by its base, a battery in the cradle keeps it charged through the same USB-C port as the dock, and NURI can turn round to face you when you speak.',
        'Klip NURI pada tali beg sandang, dan berbuallah sambil berjalan. Cradle berkunci pegang NURI pada tapaknya, bateri dalam cradle cas NURI melalui port USB-C yang sama macam dock, dan NURI boleh berpaling menghadap anda bila anda bercakap.'),
      spec: T([['Fits', 'Padded bag straps up to 60 mm wide and 15 mm thick'], ['Holds', 'Locking cradle with a front tab; quick-release button'], ['Power', 'Battery in the cradle, charges NURI through its base (planned)'], ['Travel mode', 'Gentle movement while you walk; turns to you when you talk'], ['Safety', 'Tether loop; strap sits 50 mm behind the head, outside its turning circle']],
        [['Sesuai', 'Tali beg berpad, lebar sampai 60 mm dan tebal 15 mm'], ['Pegangan', 'Cradle berkunci dengan tab depan; butang lepas pantas'], ['Kuasa', 'Bateri dalam cradle, cas NURI melalui tapaknya (dirancang)'], ['Mod jalan', 'Bergerak perlahan masa berjalan; berpaling ke arah anda bila bercakap'], ['Keselamatan', 'Ada gelung tali keselamatan; tali beg 50 mm di belakang kepala, jauh dari laluan pusingannya']])
    },
    perch: {
      title: 'NURI Shoulder Perch',
      text: T('NURI rides on your shoulder, close to your ear. A padded saddle sits on the shoulder and two soft straps loop under the arm, so NURI stays level while you walk and can turn to talk to you face to face.',
        'NURI duduk atas bahu, dekat dengan telinga anda. Pelapik berpad duduk atas bahu dan dua tali lembut lilit bawah lengan, jadi NURI kekal stabil masa berjalan dan boleh berpaling untuk sembang bersemuka.'),
      spec: T([['Wear', 'Padded saddle and two adjustable under-arm straps'], ['Position', 'On the outer shoulder, about 15 cm from the neck'], ['Power', 'Battery in the cradle, charges NURI through its base (planned)'], ['Travel mode', 'Holds steady while you walk; turns to you when you talk'], ['Safety', 'Locking cradle and tether loop; head turns clear of your head and neck in the 3D model']],
        [['Cara pakai', 'Pelapik berpad dan dua tali bawah lengan yang boleh dilaras'], ['Kedudukan', 'Di hujung bahu, lebih kurang 15 cm dari leher'], ['Kuasa', 'Bateri dalam cradle, cas NURI melalui tapaknya (dirancang)'], ['Mod jalan', 'Kekal stabil masa berjalan; berpaling ke arah anda bila bercakap'], ['Keselamatan', 'Cradle berkunci dan gelung tali keselamatan; dalam model 3D, kepala NURI berpusing tanpa kena kepala atau leher anda']])
    }
  };
  const textEl = document.getElementById('accText'), noteEl = document.getElementById('accNote');
  const tabs = [...document.querySelectorAll('#accessories [role=tab]')];
  let stage = null, cur = null, which = 'strap';
  function render(id) {
    const a = ACC[id];
    textEl.innerHTML = `<span class="status">${T('Concept · accessory · price to be announced', 'Konsep · aksesori · harga akan diumumkan')}</span><h3 style="font-size:28px;margin:12px 0 14px;letter-spacing:-.02em">${a.title}</h3><p class="lead">${a.text}</p><ul class="spec">${a.spec.map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`).join('')}</ul>`;
  }
  function build(id) {
    if (cur) { stage.scene.remove(cur.root); cur.dispose(); cur = null; }
    const nuri = N.createNuri({look: id === 'strap' ? 'buddy' : 'signature', colour: id === 'strap' ? 'coral' : 'pearl', showDock: false});
    const acc = id === 'strap' ? N.createStrapClip('coral', 'Kront') : N.createShoulderPerch('pearl', 'Reka');
    const root = new stage.THREE.Group(), body = new stage.THREE.Group(); root.add(body); body.add(acc.group, nuri.root); nuri.root.position.y = acc.mountY;
    stage.scene.add(root);
    if (id === 'strap') { root.rotation.y = -.55; stage.fit({center: [0, -.3, -.6], radius: 4.7}, [.5, .25, 1], 1); }
    else { root.rotation.y = -.35; stage.fit({center: [-2.6, -.4, 0], radius: 6.4}, [.35, .32, 1], 1); }
    stage.controls.update();
    let pose = [0, 0];
    cur = {root, dispose() { acc.dispose(); nuri.dispose(); }, frame(t, dt) {
      // walking: a light bounce and sway; NURI turns to the wearer every few seconds, then looks ahead
      if (!still) { body.position.y = Math.abs(Math.sin(t * PI * 1.8)) * N.MM * 3; body.rotation.z = Math.sin(t * PI * .9) * .025; }
      const u = t % 8, toYou = u > 4.4 && u < 7;
      const goal = toYou ? (id === 'strap' ? [2.05, -38 * PI / 180] : [-1.45, -22 * PI / 180]) : [Math.sin(t * .7) * .18, -6 * PI / 180];
      const k = still ? 1 : 1 - Math.exp(-dt * 3.5); pose[0] += (goal[0] - pose[0]) * k; pose[1] += (goal[1] - pose[1]) * k;
      nuri.setPose(pose[0], pose[1]);
    }};
  }
  const PI = Math.PI;
  function show(id) {
    which = id; render(id);
    tabs.forEach(b => b.setAttribute('aria-selected', b.id === 'tab-' + id));
    document.getElementById('panel-acc').setAttribute('aria-labelledby', 'tab-' + id);
    if (stage) build(id);
  }
  tabs.forEach(b => b.addEventListener('click', () => show(b.id.replace('tab-', ''))));
  tabs[0].parentElement.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true'), n = tabs[(i + 1) % tabs.length]; n.focus(); n.click();
  });
  render(which);
  if (!gl) { noteEl.textContent = T('3D preview needs WebGL.', 'Pratonton 3D memerlukan WebGL.'); return; }
  const io = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting) || stage) return; io.disconnect();
    try {
      stage = N.createStage(stageEl, {target: [0, 0, 0], camera: [5, 3, 8], floor: false, minDist: 4, maxDist: 30});
      stage.onFrame((t, dt) => cur && cur.frame(t, dt));
      stage.autoPause(); build(which);
    } catch (e) { console.warn('3D unavailable', e); stage = null; noteEl.textContent = T('3D preview unavailable on this device.', 'Pratonton 3D tidak tersedia pada peranti ini.'); }
  }, {rootMargin: '400px 0px'});
  io.observe(stageEl);
})();
