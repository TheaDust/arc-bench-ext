import { postAction, postAuthor } from './helpers';
import { test, expect, login, openQuestion, action, region, post, numeric, expectNumeric } from './helpers';
import {  } from './fixtures/data';

// requirement: REQ-3.6

test('REQ-3.6: Apply and remove question upvote', async ({ page, browser }, info) => {
  await login(page,'question_upvoter');
  await openQuestion(page,'SO Upvote Question');
  const author=(await postAuthor(page)), reputation=await numeric(author,'Reputation');
  await expectNumeric(post(page),'Score',7);
  await (await postAction(page,'Up vote')).click();
  await expectNumeric(post(page),'Score',8);
  await expect((await postAction(page,'Up vote'))).toHaveAttribute('aria-pressed','true');
  await expectNumeric(author,'Reputation',reputation+10);
  await page.reload();
  await expectNumeric(post(page),'Score',8);
  await expect((await postAction(page,'Up vote'))).toHaveAttribute('aria-pressed','true');
  await expectNumeric((await postAuthor(page)),'Reputation',reputation+10);
  await (await postAction(page,'Up vote')).click();
  await expectNumeric(post(page),'Score',7);
  await expect((await postAction(page,'Up vote'))).toHaveAttribute('aria-pressed','false');
  await expectNumeric((await postAuthor(page)),'Reputation',reputation);
});
