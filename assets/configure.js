import * as N from './nuri3d.js';
import {T, asset} from './i18n.js';

const $ = id => document.getElementById(id);
const state = {look: 'signature', colour: 'pearl', dock: '', name: '', rover: false, board: false, scene: 'dock', moving: false};
const still = N.prefersReducedMotion();

/* restore from URL so a configuration can be shared */
const q = new URLSearchParams(location.search);
for (const k of ['look', 'colour', 'dock']) { const v = q.get(k); const list = {look: N.LOOKS, colour: N.COLOURS, dock: N.DOCKS}[k]; if (v && list.some(o => o.id === v)) state[k] = v; }
if (q.get('name')) state.name = q.get('name').replace(/[^a-z0-9 ]/gi, '').slice(0, 10);

/* option cards */
function radioGroup(el, items, key, img) {
  el.innerHTML = items.map(it => `<button type="button" class="opt" role="radio" data-id="${it.id}" aria-checked="false">${img ? `<img src="${img(it)}" alt="" width="240" height="240" loading="lazy">` : ''}<b>${it.name}</b><small>${it.blurb}</small></button>`).join('');
  el.querySelectorAll('[role=radio]').forEach(b => b.addEventListener('click', () => { state[key] = b.dataset.id; update(); }));
  el.addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return; e.preventDefault();
    const btns = [...el.querySelectorAll('[role=radio]')], i = btns.findIndex(b => b.dataset.id === state[key]);
    const n = btns[(i + (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : btns.length - 1)) % btns.length]; state[key] = n.dataset.id; update(); n.focus();
  });
}
radioGroup($('looks'), N.LOOKS, 'look', it => asset(`img/look-${it.id}.webp`));
radioGroup($('docks'), N.DOCKS, 'dock', it => asset(`img/dock-${it.id}.webp`));
$('colours').innerHTML = N.COLOURS.map(c => `<button type="button" class="colour" role="radio" data-id="${c.id}" aria-checked="false"><i style="background:linear-gradient(135deg,${c.suit} 50%,${c.accent} 50%)"></i>${c.name}</button>`).join('');
$('colours').querySelectorAll('[role=radio]').forEach(b => b.addEventListener('click', () => { state.colour = b.dataset.id; update(); }));

$('name').value = state.name;
let nameTimer;
$('name').addEventListener('input', e => { e.target.value = e.target.value.replace(/[^a-z0-9 ]/gi, '').slice(0, 10); state.name = e.target.value; renderText(); clearTimeout(nameTimer); nameTimer = setTimeout(rebuild, 160); });
$('addRover').addEventListener('change', e => { state.rover = e.target.checked; if (e.target.checked) state.scene = 'rover'; update(); });
$('addBoard').addEventListener('change', e => { state.board = e.target.checked; if (e.target.checked) state.scene = 'board'; update(); });
document.querySelectorAll('[data-scene]').forEach(b => b.addEventListener('click', () => { state.scene = b.dataset.scene; update(); }));
$('moveBtn').addEventListener('click', () => { state.moving = !state.moving; $('moveBtn').setAttribute('aria-pressed', state.moving); $('moveBtn').textContent = state.moving ? T('Stop movement', 'Berhenti') : T('Test movement', 'Uji pergerakan'); moveT0 = stage ? stage.clock.elapsedTime : 0; });

const name = id => (list => list.find(o => o.id === id).name);
function renderText() {
  const look = name(state.look)(N.LOOKS), colour = name(state.colour)(N.COLOURS), dock = state.dock ? name(state.dock)(N.DOCKS) : '', eng = N.engraving(state.name);
  $('lookName').textContent = look; $('colourName').textContent = colour; $('engravePreview').textContent = eng;
  const addons = [state.rover && 'NURI Rover', state.board && 'NURI Board'].filter(Boolean);
  const dockPrice = state.dock ? N.DOCKS.find(d => d.id === state.dock).price : 0, total = N.BASE_PRICE + dockPrice;
  $('dockPrice').textContent = !state.dock ? T('Slim included · pick one to see it', 'Slim dah termasuk · pilih untuk tengok') : dockPrice ? '+RM' + dockPrice : T('Included', 'Termasuk');
  $('total').textContent = 'RM' + total.toLocaleString('en-MY');
  $('summary').innerHTML = [['NURI Base', 'RM' + N.BASE_PRICE], [T('Look', 'Rupa'), look], [T('Colour', 'Warna'), colour], ['Dock', !dock ? T('Slim Dock (included, not chosen yet)', 'Slim Dock (dah termasuk, belum dipilih)') : dock + (dockPrice ? ' (+RM' + dockPrice + ')' : T(' (included)', ' (termasuk)'))], [T('Engraving', 'Ukiran'), eng + T(' (free)', ' (percuma)')], ['Add-ons', addons.join(', ') || T('None', 'Tiada')]].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  $('addonNote').textContent = addons.length ? T('Add-on prices will be announced after prototyping and are not included above.', 'Harga add-on akan diumumkan bila prototaip siap, dan belum dikira dalam jumlah di atas.') : '';
  const lines = [T('Hi Cipta Robo, I would like to register interest in NURI:', 'Hai Cipta Robo, saya berminat nak dapatkan NURI. Ini pilihan saya:'), T('Look: ', 'Rupa: ') + look, T('Colour: ', 'Warna: ') + colour, 'Dock: ' + (dock || 'Slim Dock') + (dockPrice ? ' (+RM' + dockPrice + ')' : T(' (included)', ' (termasuk)')), T('Engraving: ', 'Ukiran: ') + eng, 'Add-ons: ' + (addons.join(', ') || T('None', 'Tiada')), T('Target price: RM', 'Harga sasaran: RM') + total.toLocaleString('en-MY') + (addons.length ? T(' + add-ons (TBA)', ' + add-on (harga belum diumumkan)') : '')];
  $('waSend').href = 'https://wa.me/60199400004?text=' + encodeURIComponent(lines.join('\n'));
  const url = new URL(location.href); url.search = new URLSearchParams({look: state.look, colour: state.colour, ...(state.dock ? {dock: state.dock} : {}), ...(state.name ? {name: state.name} : {})}).toString();
  history.replaceState(null, '', url);
}
function update() {
  document.querySelectorAll('#looks [role=radio]').forEach(b => b.setAttribute('aria-checked', b.dataset.id === state.look));
  document.querySelectorAll('#docks [role=radio]').forEach(b => b.setAttribute('aria-checked', b.dataset.id === state.dock));
  document.querySelectorAll('#colours [role=radio]').forEach(b => b.setAttribute('aria-checked', b.dataset.id === state.colour));
  document.querySelectorAll('[data-scene]').forEach(b => b.setAttribute('aria-pressed', b.dataset.scene === state.scene));
  $('addRover').checked = state.rover; $('addBoard').checked = state.board;
  renderText(); rebuild();
}
$('copy').addEventListener('click', async () => {
  const txt = [T('NURI configuration (pre-order not open)', 'Pilihan NURI saya (tempahan belum dibuka)'), ...[...$('summary').querySelectorAll('dt')].map(dt => dt.textContent + ': ' + dt.nextElementSibling.textContent), T('Target price: ', 'Harga sasaran: ') + $('total').textContent + T(' (add-on prices TBA)', ' (harga add-on belum diumumkan)'), location.href].join('\n');
  const label = $('copy').textContent;
  try { await navigator.clipboard.writeText(txt); $('copy').textContent = T('Copied', 'Disalin'); setTimeout(() => $('copy').textContent = label, 1600); } catch { window.prompt(T('Copy your configuration', 'Salin pilihan anda'), txt); }
});

/* 3D */
let stage = null, objs = [], nuri = null, rover = null, board = null, carrier = null, moveT0 = 0, frameN = 0, boardState = {writing: false};
function rebuild() {
  if (!stage) return;
  objs.forEach(o => { stage.scene.remove(o.root || o.group); o.dispose(); }); objs = []; rover = board = carrier = null;
  const opts = {look: state.look, colour: state.colour, dock: state.dock, name: state.name};
  if (state.scene === 'rover') {
    nuri = N.createNuri({...opts, showDock: false}); rover = N.createRover(state.colour);
    carrier = new stage.THREE.Group(); carrier.add(rover.group, nuri.root); nuri.root.position.y = rover.deckY; carrier.rotation.y = -.5;
    stage.scene.add(carrier); objs.push({root: carrier, dispose: () => { rover.dispose(); nuri.dispose(); }});
  } else {
    nuri = N.createNuri(opts); stage.scene.add(nuri.root); objs.push(nuri);
    if (state.scene === 'board') { nuri.root.position.set(-1.6, 0, 1.4); nuri.root.rotation.y = .25; board = N.createBoard(); board.group.position.set(2.6, 0, -1.6); board.group.rotation.y = -.42; stage.scene.add(board.group); objs.push(board); }
    else nuri.root.rotation.y = -.4;
  }
  const fitKey = state.scene + state.dock;
  if (lastScene !== fitKey) {
    if (state.scene === 'dock') stage.fit(nuri.root, [.6, .4, 1.3], .9);
    else if (state.scene === 'rover') stage.fit({center: [0, 1.8, 0], radius: 3.5}, [.7, .5, 1], 1);
    else stage.fit({center: [.6, 3.4, -.5], radius: 6.3}, [.12, .25, 1], 1);
    lastScene = fitKey;
  }
  const issues = N.checkClearance(nuri);
  $('check').className = 'check-line' + (issues.length ? ' warn' : '');
  $('check').innerHTML = issues.length ? `<b>${T('Check', 'Semak')}:</b> ${issues.join('; ')}` : T('<b>Clearance checked:</b> touch zones, screen, side port and full movement stay clear.', '<b>Dah disemak:</b> zon sentuh, skrin, port sisi dan pergerakan penuh semuanya tak terhalang.');
}
let lastScene = null;
if (N.webglAvailable()) {
  try {
    stage = N.createStage($('stage'), {target: [0, 1.45, 0], camera: [4.4, 2.8, 7.4]});
    $('fallback').remove();
    stage.onFrame((t, dt) => {
      if (!nuri) return;
      if (state.moving) {
        const u = t - moveT0; nuri.setPose(Math.sin(u * .7) * N.K.panLimit, N.K.tiltMin + (N.K.tiltMax - N.K.tiltMin) * (.5 + .5 * Math.cos(u * 1.1)));
      } else if (board) {
        if (frameN++ % 2 === 0) boardState = board.draw(still ? 13 : t);
        const want = boardState.writing ? .95 : 0; nuri.pan.rotation.y += (want - nuri.pan.rotation.y) * .06; nuri.tilt.rotation.x = -12 * Math.PI / 180;
      } else nuri.idle(t, still);
      if (rover && carrier) { rover.update(still ? 0 : .35, dt); if (!still) carrier.rotation.y += dt * .25; }
    });
    stage.start();
  } catch (e) { console.warn('3D unavailable', e); stage = null; $('fallback').innerHTML = `<p class="muted small">${T('3D preview is unavailable on this device.', 'Pratonton 3D tidak tersedia pada peranti ini.')}</p>`; }
} else $('fallback').innerHTML = `<p class="muted small">${T('3D preview needs WebGL.', 'Pratonton 3D memerlukan WebGL.')}</p>`;
update();
