const { chromium } = require('/opt/npm-tools/node_modules/playwright-core');
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'out');
(async () => {
  const jobs = JSON.parse(fs.readFileSync(OUT + '/jobs.json', 'utf8'));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  for (const d of ['pdf/print', 'pdf/guides', 'preview']) fs.mkdirSync(OUT + '/' + d, { recursive: true });
  for (const j of jobs) {
    const p = await b.newPage({ viewport: { width: Math.round(j.w * 96 / 25.4), height: Math.round(j.h * 96 / 25.4) }, deviceScaleFactor: 4 });
    await p.goto('file://' + j.html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
    const over = await p.evaluate(() => { const i = document.querySelector('.in'); return i.scrollHeight > i.clientHeight + 1; });
    if (over) console.log('OVERFLOW', j.name);
    await p.pdf({ path: `${OUT}/pdf/${j.guides ? 'guides' : 'print'}/${j.name}.pdf`, width: j.w + 'mm', height: j.h + 'mm', printBackground: true, pageRanges: '1' });
    if (j.guides) await p.screenshot({ path: `${OUT}/preview/${j.name}.png` });
    await p.close();
  }
  await b.close(); console.log('rendered', jobs.length);
})();
