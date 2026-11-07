import { postAction, postAuthor } from './helpers';
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
  await expect(output(page,'Asked')).toContainText(/2026-07-01|Jul(?:y)? 1,? 2026/);
  await expect(output(page,'Modified')).toContainText(/2026-07-10|Jul(?:y)? 10,? 2026/);
  expect(await numeric(page,'View count')).toBeGreaterThanOrEqual(42);
  const author = (await postAuthor(page));
  await expect(author).toContainText('Helpful User');
  await expect(author.getByRole('img')).toBeVisible();
  await expect(output(author,'Reputation')).toHaveText(/\d+/);
  await expect(author).toContainText(/badge/i);
  await expect(author).toContainText(/2026|Jul/);
  await expect(action(await ownComments(post(page)),'Add a comment')).toBeVisible();
});
