import { postAction } from './helpers';
import { test, expect, login, openQuestion, action, region, mainNav, post, createQuestion, confirmDeletion, visitFeed } from './helpers';
import { retryTitle } from './fixtures/data';

// requirement: REQ-3.5

test('REQ-3.5: Confirm own question deletion', async ({ page, browser }, info) => {
  const title = await createQuestion(browser,info,'question_deleter','SO Deletable Question');
  await login(page,'question_deleter');
  await openQuestion(page,title);
  await (await postAction(page,'Delete')).click();
  await confirmDeletion(page);
  await expect(region(page,'Question feed')).toBeVisible();
  await action(mainNav(page),'Questions').click();
  let historicalQuestionSeen = false;
  await visitFeed(page, async feed => {
    historicalQuestionSeen ||= await region(feed, `Question ${retryTitle}`).isVisible();
    await expect(action(feed,title)).toHaveCount(0);
  });
  expect(historicalQuestionSeen, 'The historical question remains in the complete public feed').toBe(true);
  const search=page.getByRole('banner').getByRole('searchbox',{name:'Search',exact:true});
  await search.fill(title); await search.press('Enter');
  await expect(region(page,'Search results')).toHaveCount(1);
  await expect(action(region(page,'Search results'),title)).toHaveCount(0);
});
