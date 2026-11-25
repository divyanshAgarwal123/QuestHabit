import { chromium } from '/Users/divyanshagarwal/Documents/ChatGPT/randoms/nsoc/.qa-tools/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import { expect } from '/Users/divyanshagarwal/Documents/ChatGPT/randoms/nsoc/.qa-tools/node_modules/playwright/test.mjs';
import assert from 'node:assert/strict';
const out = new URL('.', import.meta.url).pathname;
const [dev, prod] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const cases = [];
try {
  for (const [mode, base] of [['dev', dev], ['production', prod]]) {
    for (const width of [1280, 390]) {
      for (const theme of ['midnight', 'light']) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        const errors = []; const consoleErrors = []; const failedResponses = []; const externalHosts = new Set();
        page.on('pageerror', e => errors.push(String(e)));
        page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push({text:msg.text(),location:msg.location()}); });
        page.on('response', response => { if(response.status()>=400) failedResponses.push({url:response.url(),status:response.status()}); });
        page.on('request', req => { const u = new URL(req.url()); if (!['127.0.0.1','localhost'].includes(u.hostname)) externalHosts.add(u.hostname); });
        page.on('dialog', d => d.accept());
        const quest = { id: 'fixture-quest', title: 'Regression quest', description: 'Synthetic acceptance fixture', icon: '📖', category: 'Learning', difficulty: 'Easy', xp: 20, duration: 37, frequency: 'Daily', weekdays: [], startDate: '2026-01-01', status: 'active', createdAt: '2026-01-01T12:00:00Z' };
        const completion = { id: 'historical-completion', questId: quest.id, date: '2026-01-01', completedAt: '2026-01-01T12:00:00Z', xp: 10 };
        const fixture = { profile: { name: 'Regression Hero', avatar: '🧙', theme, onboarding: true, target: 3, weekStart: 1, reducedMotion: true }, quests: [quest], completions: [completion], unlocked: [] };
        await page.addInitScript(({fixture}) => { if (!localStorage.getItem('nsoc.fixture.initialized')) { localStorage.setItem('questhabit.state', JSON.stringify(fixture)); localStorage.setItem('nsoc.fixture.initialized','true'); } }, {fixture});
        await page.goto(base + '/quests', { waitUntil: 'networkidle' });
        const readState = () => page.evaluate(() => JSON.parse(localStorage.getItem('questhabit.state')));
        const edit = page.getByRole('button', { name: 'Edit "Regression quest"', exact: true });
        await edit.click();
        await expect(page.getByRole('dialog', {name:'Edit Quest'})).toBeVisible();
        await expect(page.getByLabel('Quest title',{exact:true})).toBeFocused();
        await expect(page.getByLabel('Duration (minutes)',{exact:true})).toHaveValue('37');
        await page.getByRole('button',{name:'Close dialog',exact:true}).focus();
        await page.keyboard.press('Shift+Tab');
        await expect(page.getByRole('button',{name:'Save changes',exact:true})).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(page.getByRole('button',{name:'Close dialog',exact:true})).toBeFocused();
        const name = `${mode}-${width}-${theme}`;
        await page.getByRole('dialog').evaluate(d => {d.scrollTop=0;});
        await page.screenshot({ path: out + name + '-edit.png', fullPage: true });
        await page.getByLabel('Quest title',{exact:true}).fill('   ');
        await page.getByLabel('XP reward',{exact:true}).fill('101');
        await page.getByLabel('Duration (minutes)',{exact:true}).fill('-1');
        await expect(page.getByRole('button',{name:'Save changes',exact:true})).toBeDisabled();
        await expect(page.getByLabel('Quest title',{exact:true})).toHaveAttribute('aria-invalid','true');
        await expect(page.getByLabel('XP reward',{exact:true})).toHaveAttribute('aria-describedby','quest-xp-error');
        await expect(page.getByLabel('Duration (minutes)',{exact:true})).toHaveAttribute('aria-describedby','quest-duration-error');
        assert.deepEqual((await readState()).quests, [quest]);
        await page.addScriptTag({path:'/Users/divyanshagarwal/Documents/ChatGPT/randoms/nsoc/questhabit2/node_modules/axe-core/axe.min.js'});
        const axe = await page.evaluate(async () => {
          const r = await window.axe.run(document.querySelector('[role="dialog"]'), {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']}});
          return {violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})),passes:r.passes.length};
        });
        assert.deepEqual(axe.violations, []);
        const overflow = await page.evaluate(() => { const d=document.querySelector('[role="dialog"]');const r=d.getBoundingClientRect();return {document:document.documentElement.scrollWidth>innerWidth,dialog:d.scrollWidth>d.clientWidth,left:r.left,right:r.right,width:innerWidth}; });
        assert.equal(overflow.document,false);assert.equal(overflow.dialog,false);assert(overflow.left>=0 && overflow.right<=width);
        await page.screenshot({path:out+name+'-errors.png',fullPage:true});
        await page.getByRole('button',{name:'Cancel',exact:true}).click();
        await expect(edit).toBeFocused();assert.deepEqual((await readState()).quests,[quest]);
        await edit.click();await expect(page.getByLabel('Duration (minutes)',{exact:true})).toHaveValue('37');
        for (const label of ['XP reward','Duration (minutes)']) {
          await page.getByLabel(label,{exact:true}).fill('');await expect(page.getByRole('button',{name:'Save changes',exact:true})).toBeDisabled();
          await page.getByLabel(label,{exact:true}).fill(label==='XP reward'?'75':'45');
        }
        await page.getByLabel('Quest title',{exact:true}).fill('  Edited regression  ');
        await page.getByLabel('Duration (minutes)',{exact:true}).press('Enter');
        await expect(page.getByRole('dialog')).toHaveCount(0);
        let saved=await readState();assert.deepEqual(saved.completions,[completion]);assert.deepEqual(saved.quests,[{...quest,title:'Edited regression',xp:75,duration:45}]);
        await page.reload({waitUntil:'networkidle'});saved=await readState();assert.deepEqual(saved.completions,[completion]);assert.equal(saved.quests[0].duration,45);
        await page.getByRole('button',{name:'New quest',exact:true}).click();
        await expect(page.getByLabel('Duration (minutes)',{exact:true})).toHaveValue('15');
        await page.getByLabel('Quest title',{exact:true}).fill('Created regression');
        await page.getByLabel('Duration (minutes)',{exact:true}).fill('55');
        await page.getByLabel('Frequency',{exact:true}).selectOption('Custom');
        await expect(page.getByRole('button',{name:'Create quest',exact:true})).toBeDisabled();
        await page.getByRole('button',{name:'Monday',exact:true}).click();
        await page.getByRole('button',{name:'Create quest',exact:true}).click();
        saved=await readState();assert.equal(saved.quests.length,2);assert.equal(saved.quests[1].duration,55);assert.deepEqual(saved.quests[1].weekdays,[1]);assert.deepEqual(saved.completions,[completion]);
        await page.getByRole('button',{name:'Archive "Edited regression"',exact:true}).click();assert.equal((await readState()).quests[0].status,'archived');
        await page.getByRole('button',{name:'Reactivate "Edited regression"',exact:true}).click();assert.equal((await readState()).quests[0].status,'active');
        await page.getByRole('button',{name:'Delete "Edited regression"',exact:true}).click();saved=await readState();assert.equal(saved.quests.length,1);assert.equal(saved.quests[0].title,'Created regression');assert.deepEqual(saved.completions,[completion]);
        assert.deepEqual(errors,[]);assert(failedResponses.every(r=>new URL(r.url).pathname==='/favicon.ico'&&r.status===404),JSON.stringify(failedResponses));assert(consoleErrors.every(e=>e.text.includes('404')&&new URL(e.location.url).pathname==='/favicon.ico'),JSON.stringify(consoleErrors));assert([...externalHosts].every(h=>['fonts.googleapis.com','fonts.gstatic.com'].includes(h)));
        cases.push({mode,width,theme,passed:true,flows:['prefill-duration','keyboard-focus-trap','invalid-fields-inline-errors','blank-numeric-rejection','cancel-no-write','edit-save-enter','preserved-ID-and-completion-XP','reload-persistence','create-duration-custom-schedule','archive-reactivate-delete'],axe,overflow,errors,consoleErrors,failedResponses,externalHosts:[...externalHosts],screenshots:[name+'-edit.png',name+'-errors.png']});
        await context.close();
        await fs.writeFile(out+'quest-browser-report.json',JSON.stringify({cases,allPassed:cases.length===8},null,2));
        console.log('PASS',name);
      }
    }
  }
} finally { await browser.close(); }
