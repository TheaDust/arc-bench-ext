// requirement: REQ-5.1
import { test, expect, login, action, mainNav, region, openQuestion, post, ownComments } from './helpers';
import { retryTitle } from './fixtures/data';

test("REQ-5.1: Open a question comment thread", async ({ page }) => {
  await login(page, 'stack_user');
  await openQuestion(page, retryTitle);
  await expect(await ownComments(post(page))).toBeVisible();
  await expect(action(await ownComments(post(page)), 'Add a comment')).toBeVisible();
});
