/* Language helper: the page's <html lang> picks English or Bahasa Melayu. */
export const LANG = (document.documentElement.lang || 'en').toLowerCase().startsWith('ms') ? 'ms' : 'en';
export const T = (en, ms) => (LANG === 'ms' ? ms : en);
// asset URLs relative to this module, so pages in /ms/ load the same files
export const asset = path => new URL(path, import.meta.url).href;
// keep the configuration (query string) and section when switching language
document.querySelectorAll('a.lang-switch').forEach(a => a.addEventListener('click', () => {
  a.href = a.href.split(/[?#]/)[0] + location.search + location.hash;
}));
