/* Total visitor count in the footer. One running total that never resets.
   Each browser is counted once (remembered in localStorage); later visits only read the total.
   Counter: abacus.jasoncameron.dev, namespace "ciptarobo-com", key "visitors". If the service is slow or down,
   the number simply stays hidden. */
import {T} from './i18n.js?v=34bad43a';

const API = 'https://abacus.jasoncameron.dev', NS = 'ciptarobo-com', KEY = 'visitors', FLAG = 'nuri-visitor-counted';
const els = [...document.querySelectorAll('[data-visitors]')];

function remembered() { try { return localStorage.getItem(FLAG) === '1'; } catch { try { return sessionStorage.getItem(FLAG) === '1'; } catch { return false; } } }
function remember() { try { localStorage.setItem(FLAG, '1'); } catch { try { sessionStorage.setItem(FLAG, '1'); } catch {} } }

async function call(path) {
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const r = await fetch(`${API}/${path}/${NS}/${KEY}`, {signal: ctrl.signal, cache: 'no-store'});
    if (!r.ok) return null;
    const d = await r.json();
    return Number.isFinite(d.value) ? d.value : null;
  } catch { return null; } finally { clearTimeout(timer); }
}

async function run() {
  if (!els.length) return;
  let n;
  if (remembered()) n = await call('get');
  else { n = await call('hit'); if (n !== null) remember(); else n = await call('get'); }
  if (n === null || n < 1) return;
  const text = T('Total visitors: ', 'Jumlah pelawat: ') + n.toLocaleString('en-MY');
  els.forEach(el => { el.textContent = text; el.hidden = false; });
}
if ('requestIdleCallback' in window) requestIdleCallback(run, {timeout: 3000}); else setTimeout(run, 1200);
