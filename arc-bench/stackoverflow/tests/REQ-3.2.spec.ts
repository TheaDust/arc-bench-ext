import { postAction, postAuthor, ownedByPost, expectPresence, expectUtcDate } from './helpers';
import { expectVisibleText } from './support/public-controls';
import { test, expect, login, openQuestion, action, region, post, comment, output, expectNumeric, numeric, ownComments } from './helpers';
import { body, retryTitle } from './fixtures/data';

// requirement: REQ-3.2

test('REQ-3.2: Read a published question', async ({ page, browser }, info) => {
  await login(page,'stack_user');
  await openQuestion(page,retryTitle);
  await expect(page.getByRole('heading',{name:retryTitle,exact:true})).toBeVisible();
  await expect(post(page)).toContainText(body);
  for (const name of ['node.js','http','retry']) await expectVisibleText(post(page), name);
  for (const name of ['Up vote','Down vote','Save','Timeline','Share','Edit','Follow']) await expect((await postAction(page,name))).toBeVisible();
  await expectNumeric(post(page),'Score',7);
  await expectUtcDate(await ownedByPost(post(page),output(post(page),'Asked')), '2026-07-01');
  await expectUtcDate(await ownedByPost(post(page),output(post(page),'Modified')), '2026-07-10');
  expect(await numeric(post(page),'View count')).toBeGreaterThanOrEqual(42);
  const author = (await postAuthor(page));
  await expect(author).toContainText('Helpful User');
  await expectPresence(author.getByRole('img'));
  await expect(output(author,'Reputation')).toHaveText(/^-?\d+$/);
  await expect(author).toContainText(/badge/i);
  await expect(author).toContainText(/2026|Jul/);
  await expect(action(await ownComments(post(page)),'Add a comment')).toBeVisible();
});
