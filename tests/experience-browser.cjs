const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto('http://127.0.0.1:8765');for(let i=0;i<4;i++)await page.locator('[data-action="onb-next"]').click();await page.locator('[data-action="onb-finish"]').click();
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('einsatzfit-state-v1')));
 await page.goto('http://127.0.0.1:8765/#/einstellungen');
 await page.locator('#training-focus').selectOption('strength');await page.locator('#training-experience').selectOption('beginner');await page.locator('#winter-prep').selectOption('off');
 await page.reload();assert.equal(await page.locator('#training-focus').inputValue(),'strength');
 await page.goto('http://127.0.0.1:8765/#/');await page.locator('.plan-explanation summary').click();assert.match(await page.locator('.plan-explanation').innerText(),/Ganzkörpereinheit/);
 // Fixture contains genuine prior observations; no current-workout values prefilled.
 await page.evaluate(()=>{const k='einsatzfit-state-v1',s=JSON.parse(localStorage.getItem(k));s.history=[{id:'previous',date:'2026-10-01',type:'KRAFT_A',minutes:35,exercises:[{id:'back_squat',name:'Kniebeuge',targetSets:4,setLog:[{weight:'40',reps:'8',rpe:'8',done:true},{weight:'40',reps:'8',rpe:'8',done:true}]}]}];localStorage.setItem(k,JSON.stringify(s));});
 await page.reload();await page.goto('http://127.0.0.1:8765/#/session/KRAFT_A');
 const first=page.locator('.exercise').filter({has:page.locator('[data-action="copy-last"]')}).first();
 await first.locator('[data-action="copy-last"]').click();assert.equal(await first.locator('[data-field="weight"]').first().inputValue(),'40');assert.equal(await first.locator('[data-field="rpe"]').first().inputValue(),'');assert.equal(await first.locator('.is-done').count(),0);
 await page.locator('[data-action="undo"]').click();assert.equal(await first.locator('[data-field="weight"]').first().inputValue(),'');
 await first.locator('[data-action="copy-last"]').click();await first.locator('[data-field="weight"]').first().fill('42');assert.equal(await page.locator('[data-action="undo"]').count(),0);
 // Alternative chooser restores the exact former entry on undo.
 await first.locator('[data-action="swap"]').click();await page.locator('#swap-dialog').waitFor();assert.equal(await page.locator('#swap-dialog').evaluate(e=>e.open),true);
 if(process.env.SCREENSHOT_DIR)await page.screenshot({path:process.env.SCREENSHOT_DIR+'/alternativen.png'});
 const before=(await read()).currentSession.entries.back_squat;
 await page.locator('[data-action="choose-swap"][data-exercise="bw_squat"]').click();assert.equal((await read()).swaps.back_squat,'bw_squat');
 await page.locator('[data-action="undo"]').click();assert.deepEqual((await read()).currentSession.entries.back_squat,before);
 // Entered last set can be restored after removal.
 const card=page.locator('.exercise').filter({has:page.locator('[data-action="swap"][data-id="back_squat"]')});
 const order=(await read()).currentSession.planned;await card.locator('[data-action="move-later"]').click();assert.equal((await read()).currentSession.planned.at(-1),'back_squat');await page.locator('[data-action="undo"]').click();assert.deepEqual((await read()).currentSession.planned,order);await page.locator('[data-action="next-set"]').click();assert.equal(await page.locator(':focus').getAttribute('data-field'),'reps');
 const initial=await card.locator('.set-row').count();await card.locator('[data-action="remove-set"]').click();assert.equal(await card.locator('.set-row').count(),initial-1);await page.locator('[data-action="undo"]').click();assert.equal(await card.locator('.set-row').count(),initial);
 await card.locator('[data-action="toggle-set"]').first().click();await page.locator('[data-action="finish"]').click();assert.equal((await read()).history.length,2);await page.locator('[data-action="undo"]').click();assert.equal((await read()).history.length,1);await page.locator('[data-action="finish"]').click();assert.equal((await read()).history.length,2);
 await page.goto('http://127.0.0.1:8765/#/verlauf');assert.equal(await page.locator('.activity-weeks > div').count(),8);
 for(const metric of ['reps','weight','volume','oneRM']){await page.locator('#chart-metric').selectOption(metric);assert.ok(await page.locator('#chart').count());}
 await page.locator('[data-action="delete-history"]').first().click();assert.equal((await read()).history.length,1);await page.locator('[data-action="undo"]').click();assert.equal((await read()).history.length,2);
 if(process.env.SCREENSHOT_DIR){fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:process.env.SCREENSHOT_DIR+'/fortschritt.png',fullPage:true});}
 // Restore an import, then restore the pre-import checkpoint.
 await page.goto('http://127.0.0.1:8765/#/einstellungen');const preImport=await read();const backup={...preImport,name:'Imported',history:[]};
 await page.locator('#importFile').setInputFiles({name:'valid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await page.waitForFunction(()=>JSON.parse(localStorage.getItem('einsatzfit-state-v1')).name==='Imported');
 await page.goto('http://127.0.0.1:8765/#/einstellungen');await page.locator('[data-action="restore-checkpoint"]').click();assert.equal((await read()).history.length,2);assert.equal((await read()).name,preImport.name);
 // Reset remains recoverable from onboarding.
 await page.goto('http://127.0.0.1:8765/#/einstellungen');await page.locator('[data-action="reset-all"]').click();await page.locator('[data-action="restore-checkpoint"]').click();assert.equal((await read()).history.length,2);
 for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:844});for(const route of ['verlauf','einstellungen']){await page.goto('http://127.0.0.1:8765/#/'+route);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow ${width} ${route}`);}}
 await page.goto('http://127.0.0.1:8765/#/session/KRAFT_A');await page.locator('[data-action="swap"]').first().click();await page.keyboard.press('Escape');await page.locator('#swap-dialog').waitFor({state:'detached'});assert.equal(await page.locator('#swap-dialog').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: profile persistence, copy/undo, alternative selection/undo, remove-set/undo, trends, delete/undo, import/recovery, reset/recovery, responsive layout, modal Escape.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
