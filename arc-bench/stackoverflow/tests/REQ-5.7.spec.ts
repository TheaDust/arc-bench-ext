import { test, expect, login, openQuestion, post, answer, comment, publishComment, createQuestion, createAnswer, expectTimestamp } from './helpers';
import {  } from './fixtures/data';

// requirement: REQ-5.7

test('REQ-5.7: Publish in the answer thread', async ({ page, browser }, info) => {
  const title=await createQuestion(browser,info,'question_creator','SO Answer Comment Question');
  await createAnswer(browser,title);
  await login(page,'answer_comment_user'); await openQuestion(page,title);
  await publishComment(answer(page));
  await expect(await comment(answer(page))).toContainText('Stack User');
  await expectTimestamp(await comment(answer(page)));
  await expect(await comment(post(page))).toHaveCount(0);
  await page.reload();
  await expect(await comment(answer(page))).toContainText('Stack User');
  await expectTimestamp(await comment(answer(page)));
  await expect(await comment(post(page))).toHaveCount(0);
});
