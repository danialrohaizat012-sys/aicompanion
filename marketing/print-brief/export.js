// Export the print brief: PDF (A4 landscape, 4 pages) + one PNG per page.
// Usage: node export.js [preview]   (local server at the repo root on :8767)
const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch(), prev = process.argv[2] === 'preview';
  const p = await b.newPage({viewport: {width: 1123, height: 794}, deviceScaleFactor: prev ? 1.2 : 2.6});
  await p.goto('http://localhost:8767/marketing/print-brief/brief.html', {waitUntil: 'networkidle'});
  await p.evaluate(() => document.fonts.ready);
  await p.addStyleTag({content: 'html,body{background:none}.page{margin:0!important}'});
  const pages = await p.$$('.page');
  const base = prev ? 'preview' : 'nuri-taklimat-cetak';
  for (let i = 0; i < pages.length; i++) await pages[i].screenshot({path: __dirname + '/' + base + '-p' + (i + 1) + '.png'});
  if (!prev) await p.pdf({path: __dirname + '/nuri-taklimat-cetak-v1.pdf', width: '297mm', height: '210mm', printBackground: true, preferCSSPageSize: true});
  console.log('pages', pages.length); await b.close();
})();
