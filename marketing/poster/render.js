// Render the poster's NURI images: node render.js  (needs a local server at the repo root on :8766)
const {chromium} = require('playwright');
const SHOTS = {
  'hero':        'look=signature&colour=pearl&dock=slim&name=&pan=-14&tilt=-10&dir=[0.62,0.16,1.25]&size=2400&margin=1.0&rot=-8',
  'look-signature': 'look=signature&colour=pearl&dock=slim&name=Reka&pan=-10&tilt=-8&dir=[0.55,0.28,1.3]&size=1200&radius=2.75&cy=1.55',
  'look-focus':  'look=focus&colour=graphite&dock=nest&name=Kront&pan=-10&tilt=-8&dir=[0.55,0.28,1.3]&size=1200&radius=2.75&cy=1.55',
  'look-buddy':  'look=buddy&colour=coral&dock=slim&name=Mira&pan=-10&tilt=-8&dir=[0.55,0.28,1.3]&size=1200&radius=2.75&cy=1.55'
};
(async () => {
  const b = await chromium.launch({args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  for (const [name, q] of Object.entries(SHOTS)) {
    if (process.argv[2] && !name.startsWith(process.argv[2])) continue;
    const size = +new URLSearchParams(q).get('size');
    const p = await b.newPage({viewport: {width: size, height: size}});
    p.on('pageerror', e => console.log('ERR', e.message));
    await p.goto('http://localhost:8766/marketing/poster/render.html?' + q);
    await p.waitForFunction(() => window.done, null, {timeout: 120000});
    await (await p.$('#v')).screenshot({path: __dirname + '/img/' + name + '.png', omitBackground: true});
    console.log('rendered', name); await p.close();
  }
  await b.close();
})();
