const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

test('deployment cache follows content, remains stable, and validates inputs before replacing output',async()=>{
 const {buildWeb,assets,root}=await import(pathToFileURL(path.join(__dirname,'../scripts/web-build.mjs')));
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'einsatzfit-build-'));
 try {
  const source=path.join(tmp,'source'),out=path.join(tmp,'_site');await fs.mkdir(source);
  for(const file of [...assets,'sw.js'])await fs.copyFile(path.join(root,file),path.join(source,file));
  const first=await buildWeb(out,source),second=await buildWeb(out,source);assert.equal(first,second);
  await fs.appendFile(path.join(source,'style.css'),'\n/* New UI */');const changed=await buildWeb(out,source);assert.notEqual(changed,first);
  assert.ok((await fs.readFile(path.join(out,'sw.js'),'utf8')).includes(changed));
  await fs.unlink(path.join(source,'training.js'));await assert.rejects(buildWeb(out,source));
  assert.ok((await fs.readFile(path.join(out,'sw.js'),'utf8')).includes(changed));
  await assert.rejects(buildWeb(source,root));
 }finally{await fs.rm(tmp,{recursive:true,force:true});}
});

test('Capacitor bundle is injected before app initialization and PWA remains independent',async()=>{
 const root=path.join(__dirname,'..');
 const source=await fs.readFile(path.join(root,'index.html'),'utf8');assert.ok(!source.includes('native-bridge.js'));
 // Native build is validated by CI before these tests. Pure logic tests can also run without it.
 let html;try{html=await fs.readFile(path.join(root,'www/index.html'),'utf8');}catch(e){if(e.code==='ENOENT')return;throw e;}
 assert.ok(html.indexOf('native-bridge.js')<html.indexOf('src="app.js"'));
 const bundle=await fs.readFile(path.join(root,'www/native-bridge.js'),'utf8');assert.match(bundle,/EinsatzNative/);assert.match(bundle,/Haptics/);assert.match(bundle,/StatusBar/);
});
