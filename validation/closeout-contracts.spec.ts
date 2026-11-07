import { test, expect } from '@playwright/test';
import { cappedEntry } from '../arc-bench/bookstack/tests/support/list-cap';
import { workbookTimestamp } from '../arc-bench/sheet/tests/support/workbook-record';
import { memberForm, memberRecord } from '../arc-bench/github/tests/support/membership';
import { branchState } from '../arc-bench/github/tests/support/branch-state';

for (const role of ['listitem','row']) {
  for (const limit of [4,5,10]) {
    test(`cap ${limit} counts ${role} records, allowing auxiliary navigation`, async ({ page }) => {
      const names=Array.from({length:limit+1},(_,i)=>'Record '+i);
      const records=(count:number)=>names.slice(0,count).map(name=>`<div role="${role}"><button aria-label="${name}"><span aria-hidden="true">★</span>${name}</button></div>`).join('');
      await page.setContent(`<section aria-label="Collection">${records(limit)}<button>View all</button><a href="#help">Help</a></section>`);
      const collection=page.getByRole('region',{name:'Collection',exact:true});
      const selected=await cappedEntry(collection,names,limit);
      expect(names).toContain(selected.name);
      await selected.target.click();
      await collection.evaluate((node,html)=>node.insertAdjacentHTML('beforeend',html),records(limit+1).split('</div>').slice(-2,-1).join('</div>')+'</div>');
      await expect(cappedEntry(collection,names,limit)).rejects.toThrow();
    });
  }
}
test('duplicate business entries remain invalid inside separate records', async ({page})=>{
  await page.setContent('<section aria-label="Collection"><div role="listitem"><button>A</button></div><div role="listitem"><button>A</button></div></section>');
  await expect(cappedEntry(page.getByRole('region',{name:'Collection'}),['A'],4)).rejects.toThrow();
});
for(const nested of [false,true]){
  test(`workbook timestamp supports ${nested?'nested':'sibling'} link metadata`,async({page})=>{
    await page.setContent(`<div role="group" aria-label="Workbook Alpha"><a href="#alpha" aria-label="Alpha">Alpha${nested?'<span>Last updated: 2026-11-06</span>':''}</a>${nested?'':'<span>Last updated: 2026-11-06</span>'}</div><div role="group" aria-label="Workbook Beta"><a href="#beta">Beta</a><span>Last updated: other time</span></div>`);
    expect(await workbookTimestamp(page,'Alpha')).toBe('Last updated: 2026-11-06');
  });
}
test('workbook timestamp cannot borrow a different record timestamp',async({page})=>{
  await page.setContent('<div role="group" aria-label="Workbook Alpha"><a href="#alpha">Alpha</a></div><div role="group" aria-label="Workbook Beta"><span>Last updated: wrong</span></div>');
  await expect(workbookTimestamp(page,'Alpha')).rejects.toThrow();
});
test('member form submission and role observation ignore surrounding duplicate labels',async({page})=>{
  await page.setContent('<button>Add member</button><div role="group" aria-label="Member existing"><span>existing</span><span>Owner</span></div><div role="group" aria-label="Add member form"><label>Username or email<input></label><button onclick="document.querySelector(\'#result\').textContent=\'saved\'">Add member</button></div><div role="group" aria-label="Member new-member"><span>new-member</span><span>Member</span></div><button>Add member</button><p id="result"></p>');
  await memberForm(page).getByRole('textbox',{name:'Username or email'}).fill('new-member');
  await memberForm(page).getByRole('button',{name:'Add member',exact:true}).click();
  await expect(page.locator('#result')).toHaveText('saved');
  await expect(memberRecord(page,'new-member').getByText('Member',{exact:true})).toBeVisible();
  await expect(memberRecord(page,'existing').getByText('Member',{exact:true})).toHaveCount(0);
});
test('duplicate member forms remain ambiguous',async({page})=>{
  await page.setContent('<div role="group" aria-label="Add member form"><button>Add member</button></div><div role="group" aria-label="Add member form"><button>Add member</button></div>');
  await expect(memberForm(page).getByRole('button',{name:'Add member'}).click()).rejects.toThrow(/strict mode/);
});
test('branch state rejects an orphaned commit parent',async({page})=>{
  await page.setContent('<section aria-label="Branch state"><span role="status" aria-label="Repository owner">owner</span><span role="status" aria-label="Branch name">main</span><span role="status" aria-label="Branch head">head</span></section><table aria-label="Branch files"><tr><th>Path</th><th>Content</th></tr></table><table aria-label="Commit history"><tr><th>Commit</th><th>Parents</th><th>Author</th><th>Message</th></tr><tr><td>head</td><td>missing</td><td>owner</td><td>wrong history</td></tr></table>');
  await expect(branchState(page)).rejects.toThrow();
});
