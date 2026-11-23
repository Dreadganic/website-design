// Beju Passport Tee front, v2: crane, ベージュ and コーヒー ロースターズ set vertically, left chest, about 42 x 118 mm.
// Usage: node front.js <outdir> <fontsdir> (fonts as for back.js). Writes beju-passport-tee_{c2,pink}-front.png, 3600 x 4800 px (12 x 16 in at 300 dpi).
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const OUT=process.argv[2],F=process.argv[3];
const logo=fs.readFileSync(path.join(__dirname,'../../../beju-site/images/logo.svg'),'utf8').replace(/viewBox="[^"]*"/,'viewBox="0 0 100 100"');
const MM=3600/304.8, X=232*MM, Y=62*MM, Wd=42*MM; // art box: left edge 232 mm, top 62 mm in the 12 x 16 in print area
const css=fs.readFileSync(F+'/x/fontsource-noto-serif-jp-5.3.1/package/900.css','utf8').replace(/url\(\.\/files/g,'url(file://'+F+'/x/fontsource-noto-serif-jp-5.3.1/package/files');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:3600,height:4800}});
for(const [name,ink] of [['c2','#2D6A46'],['pink',process.argv[4]||'#F2949C']]){
 const html=`<html><head><style>${css}
 body{margin:0;background:transparent;width:3600px;height:4800px;position:relative}
 .v{position:absolute;writing-mode:vertical-rl;font-family:'Noto Serif JP';font-weight:900;color:${ink};line-height:1;font-feature-settings:'vert'}
 </style></head><body>
 <div style="position:absolute;left:${X}px;top:${Y}px;width:${Wd}px;height:${Wd}px">${logo.replace(/#2D6A46/gi,ink).replace('<svg ','<svg width="100%" height="100%" ')}</div>
 <div class="v" style="left:${X+Wd*0.52}px;top:${Y+Wd*1.08}px;font-size:${14.5*MM}px;letter-spacing:${0.6*MM}px">ベージュ</div>
 <div class="v" style="left:${X+Wd*0.10}px;top:${Y+Wd*1.10}px;font-size:${7.4*MM}px;letter-spacing:${0.1*MM}px">コーヒー　ロースターズ</div>
 </body></html>`;
 const hf=path.join(OUT,'front_'+name+'.html');fs.writeFileSync(hf,html);await p.goto('file://'+hf);
 await p.evaluate(async()=>{await document.fonts.ready});await p.waitForTimeout(1500);
 await p.screenshot({path:path.join(OUT,`beju-passport-tee_${name}-front.png`),omitBackground:true,clip:{x:0,y:0,width:3600,height:4800}});}
await b.close();})();
