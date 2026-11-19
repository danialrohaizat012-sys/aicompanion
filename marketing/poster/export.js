// Export the poster: PNG at 300 dpi (2480 × 3508 px) and a print PDF (A4, vector text).
// Usage: node export.js [preview]   (local server at the repo root on :8766)
const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: 794, height: 1123}, deviceScaleFactor: process.argv[2] === 'preview' ? 1.2 : 3.125});
  await p.goto('http://localhost:8766/marketing/poster/poster.html', {waitUntil: 'networkidle'});
  await p.evaluate(() => document.fonts.ready);
  await p.addStyleTag({content: 'html,body{background:none}.page{margin:0!important;box-shadow:none!important}'});
  const el = await p.$('.page');
  const out = __dirname + (process.argv[2] === 'preview' ? '/preview.png' : '/cipta-robo-nuri-poster-a4.png');
  await el.screenshot({path: out});
  if (process.argv[2] !== 'preview') await p.pdf({path: __dirname + '/cipta-robo-nuri-poster-a4.pdf', width: '210mm', height: '297mm', printBackground: true, preferCSSPageSize: true});
  console.log('exported', out); await b.close();
})();
