import { expectSelectedChoice, expectVisibleText, selectChoice } from './support/public-controls';
import { test, expect, login, action, field, region, mainNav, output, titleFor, visitFeed } from './helpers';
import { retryTitle } from './fixtures/data';

// requirement: REQ-6.5

test('REQ-6.5: Save and reapply python unanswered criteria', async ({ page, browser }, info) => {
  await login(page,'filter_user'); await action(mainNav(page),'Questions').click();
  await action(page,'Filter').click();
  const panel=region(page,'Filter panel');
  await panel.getByRole('checkbox',{name:'Unanswered',exact:true}).check();
  await selectChoice(panel.getByRole('combobox',{name:'Sort',exact:true}), {label:'Newest'});
  await field(panel,'Tags').fill('python');
  await expect(panel.getByRole('checkbox',{name:'Unanswered',exact:true})).toBeChecked();
  await expectSelectedChoice(panel.getByRole('combobox',{name:'Sort',exact:true}), 'Newest');
  await expect(field(panel,'Tags')).toHaveValue('python');
  await action(panel,'Save custom filter').click();
  const dialog=page.getByRole('dialog',{name:'Save custom filter',exact:true});
  await expect(dialog).toBeVisible();
  const name=titleFor(info,'Python unanswered filter');
  await field(dialog,'Filter title').fill(name); await action(dialog,'Save filter').click();
  const assertResults=async () => {
   let requiredQuestionSeen = false;
   await visitFeed(page, async feed => {
    requiredQuestionSeen ||= await region(feed, 'Question SO Python Unanswered Recent').isVisible();
    for (const title of ['SO Python Answered Active',retryTitle,'How does React state update?']) await expect(action(feed,title)).toHaveCount(0);
    for (const summary of await feed.getByRole('region',{name:/^Question /}).all()) {
     await expectVisibleText(summary, 'python');
     await expect(output(summary,'Answer count')).toHaveText('0');
    }
   });
   expect(requiredQuestionSeen).toBe(true);
  };
  await assertResults();
  await action(mainNav(page),'Home').click(); await page.reload();
  await action(region(page,'Saved filters'),name).click();
  await assertResults();
  await action(page,'Filter').click();
  await expect(panel.getByRole('checkbox',{name:'Unanswered',exact:true})).toBeChecked();
  await expect(field(panel,'Tags')).toHaveValue('python');
  await expectSelectedChoice(panel.getByRole('combobox',{name:'Sort',exact:true}), 'Newest');
});
