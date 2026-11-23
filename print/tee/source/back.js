// Beju Passport Tee back, v2 (Nov 2026): six passport stamps, 61 mm each, Lora Bold and Noto Serif JP Black.
// Usage: node back.js <outdir> <fontsdir>. With FRONT=<mm> (e.g. FRONT=80 PINK=#F2949C) it draws one Beju roastery stamp for the left chest instead. fontsdir holds the npm packages @fontsource/lora and @fontsource/noto-serif-jp unpacked
// as x/fontsource-lora-5.3.0/package and x/fontsource-noto-serif-jp-5.3.1/package. Writes beju-passport-tee_{c2,pink}-back.png, 3600 x 4800 px (12 x 16 in at 300 dpi).
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const OUT=process.argv[2], F=process.argv[3]; // fonts dir
const logo=fs.readFileSync(path.join(__dirname,'../../../beju-site/images/logo.svg'),'utf8');
const inner=logo.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const stamps=process.env.FRONT?[['BEJU COFFEE ROASTERS','ベージュ・大阪','ROASTERY']]:[['MOGIANA · BRAZIL','モジアナ・ブラジル','No.01'],['TURRIALBA · COSTA RICA','トゥリアルバ・コスタリカ','No.02'],['HUILA · COLOMBIA','ウイラ・コロンビア','No.03'],['GEDEO · ETHIOPIA','ゲデオ・エチオピア','No.04'],['LAKE TOBA · SUMATRA','トバ湖・スマトラ','No.05'],['OSAKA · JAPAN','大阪・日本','ROASTERY']];
function rnd(seed){return()=>{seed=(seed*16807)%2147483647;return seed/2147483647}}
function build(ink,cutId){
 const W=304.8,H=406.4,D=61,R=D/2,pitch=63.6,cx=process.env.FRONT?240:W/2,top=process.env.FRONT?58:20;
 let s='',defs='';
 // distress mask: speckles punched out of the ink
 const r=rnd(7);let dots='';
 for(let k=0;k<stamps.length;k++){const cy=top+R+k*pitch;
  for(let i=0;i<70;i++){const a=r()*Math.PI*2, rr=R-0.6-r()*2.6; const big=r()<0.15; dots+=`<ellipse cx="${(cx+Math.cos(a)*rr).toFixed(2)}" cy="${(cy+Math.sin(a)*rr).toFixed(2)}" rx="${(big?0.55:0.25)+r()*0.25}" ry="${0.2+r()*0.25}" transform="rotate(${(r()*180).toFixed(0)} ${(cx+Math.cos(a)*rr).toFixed(2)} ${(cy+Math.sin(a)*rr).toFixed(2)})"/>`;}
  for(let i=0;i<0;i++){const a=r()*Math.PI*2, rr=r()*R*0.95; dots+=`<circle cx="${(cx+Math.cos(a)*rr).toFixed(2)}" cy="${(cy+Math.sin(a)*rr).toFixed(2)}" r="${0.15+r()*0.2}"/>`;}}
 defs+=`<mask id="${cutId}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="white"/><g fill="black">${dots}</g></mask>`;
 let g='';
 stamps.forEach(([en,jp,no],k)=>{const cy=top+R+k*pitch;
  const ro=R-1.6, ri=R*0.66, rt=(ro+ri)/2; // text radius
  g+=`<circle cx="${cx}" cy="${cy}" r="${ro}" fill="none" stroke="${ink}" stroke-width="3.2"/>`;
  g+=`<circle cx="${cx}" cy="${cy}" r="${ri}" fill="none" stroke="${ink}" stroke-width="1.15"/>`;
  g+=`<circle cx="${cx-rt}" cy="${cy}" r="1.05" fill="${ink}"/><circle cx="${cx+rt}" cy="${cy}" r="1.05" fill="${ink}"/>`;
  const ta=rt-1.9; // top arc baseline radius (text sits outside-in)
  defs+=`<path id="t${k}" d="M ${cx-ta} ${cy} A ${ta} ${ta} 0 0 1 ${cx+ta} ${cy}"/>`;
  const tb=rt+1.75;
  defs+=`<path id="b${k}" d="M ${cx-tb} ${cy} A ${tb} ${tb} 0 0 0 ${cx+tb} ${cy}"/>`;
  const fsEn=en.length>17?4.3:4.9;
  g+=`<text font-family="LoraB" font-weight="700" font-size="${fsEn}" letter-spacing="${en.length>17?0.32:0.55}" fill="${ink}"><textPath href="#t${k}" startOffset="50%" text-anchor="middle">${en}</textPath></text>`;
  g+=`<text font-family="NSJ" font-weight="900" font-size="${jp.length>9?3.9:4.4}" letter-spacing="0.15" fill="${ink}"><textPath href="#b${k}" startOffset="50%" text-anchor="middle">${jp}</textPath></text>`;
  // crane
  const cs=ri*0.98; g+=`<svg x="${cx-cs/2}" y="${cy-ri*0.78}" width="${cs}" height="${cs}" viewBox="0 0 100 100">${inner.replace(/id="f"/g,'id="f'+cutId+k+'"').replace(/url\(#f\)/g,'url(#f'+cutId+k+')').replace(/#2D6A46/gi,ink)}</svg>`;
  g+=`<text x="${cx}" y="${cy+ri*0.47}" text-anchor="middle" font-family="LoraB" font-weight="700" font-size="${no==='ROASTERY'?3.5:4.0}" letter-spacing="0.35" fill="${ink}">${no}</text>`;
  const dw=ri*0.9, y=cy+ri*0.62; g+=`<line x1="${cx-dw/2}" y1="${y}" x2="${cx+dw/2}" y2="${y-0.5}" stroke="${ink}" stroke-width="1.0" stroke-dasharray="2.2 1.1"/>`;
  if(k<stamps.length-1){const y0=cy+R-0.2,y1=cy+pitch-R+0.2; g+=`<line x1="${cx}" y1="${y0}" x2="${cx}" y2="${y1}" stroke="${ink}" stroke-width="1.1" stroke-dasharray="1.2 0.9"/>`;}
 });
 const colH=5*pitch+D;
 // side texts
 const side=`<text transform="translate(${cx-R-9} ${top+colH/2}) rotate(-90)" text-anchor="middle" dominant-baseline="middle" font-family="LoraB" font-weight="700" font-size="7.2" letter-spacing="2.6" fill="${ink}">BEJU COFFEE ROASTERS · OSAKA</text>`;
 const chars=[...'産地をたどる、一杯。'];let tag='',ty=top+15;const tx=cx+R+15,fs=16.5;
 for(const ch of chars){const punct='、。'.includes(ch);
  tag+=`<text x="${punct?tx+fs*0.55:tx}" y="${punct?ty-fs*0.62:ty}" text-anchor="middle" font-family="NSJ" font-weight="900" font-size="${fs}" fill="${ink}">${ch}</text>`;
  ty+=punct?fs*0.55:fs*1.06;}
 if(process.env.FRONT){const k=+process.env.FRONT/D, cy0=top+R; return `<svg xmlns="http://www.w3.org/2000/svg" width="3600" height="4800" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs><g transform="translate(${cx} ${cy0}) scale(${k}) translate(${-cx} ${-cy0})"><g mask="url(#${cutId})">${g}</g></g></svg>`;}
 return `<svg xmlns="http://www.w3.org/2000/svg" width="3600" height="4800" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs><g mask="url(#${cutId})">${g}${side}${tag}</g></svg>`;
}
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:3600,height:4800}});
 const css=`@font-face{font-family:LoraB;font-weight:700;src:url(file://${F}/x/fontsource-lora-5.3.0/package/files/lora-latin-700-normal.woff2)}`+fs.readFileSync(F+'/x/fontsource-noto-serif-jp-5.3.1/package/900.css','utf8').replace(/font-family: 'Noto Serif JP'/g,"font-family: 'NSJ'").replace(/url\(\.\/files/g,'url(file://'+F+'/x/fontsource-noto-serif-jp-5.3.1/package/files');
 for(const [name,ink] of [['c2','#2D6A46'],['pink',process.env.PINK||'#E58AA0']]){
  const html=`<html><head><style>${css} body{margin:0;background:transparent}</style></head><body><div style="position:absolute;left:-9999px;font-family:NSJ;font-weight:900">${stamps.map(x=>x[1]).join('')}産地をたどる、一杯。</div><div style="position:absolute;left:-9999px;font-family:LoraB;font-weight:700">ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.·</div>${build(ink,'m'+name)}</body></html>`; const hf=path.join(OUT,'page_'+name+'.html'); fs.writeFileSync(hf,html); await p.goto('file://'+hf);
  await p.evaluate(async()=>{await document.fonts.ready;}); await p.waitForTimeout(1500); await p.evaluate(async()=>{await document.fonts.ready;}); console.log(await p.evaluate(()=>[...document.fonts].filter(f=>f.status==='loaded').length));
  await p.locator('svg').first().screenshot({path:path.join(OUT,`beju-passport-tee_${name}-${process.env.FRONT?'front-stamp':'back'}.png`),omitBackground:true});}
 await b.close();})();
