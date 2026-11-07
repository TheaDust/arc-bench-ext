import { test, expect, entry, action, region, mainNav, expectFeedOrder } from './helpers';
import {  } from './fixtures/data';

// requirement: REQ-6.4

test('REQ-6.4: Switch newest and active ordering', async ({ page, browser }, info) => {
  await entry(page); await action(mainNav(page),'Questions').click();
  const feed=region(page,'Question feed');
  await action(feed,'Newest').click();
  await expect(action(feed,'Newest')).toHaveAttribute('aria-pressed','true');
  await expectFeedOrder(page,'SO Python Unanswered Recent','SO Python Answered Active');
  await action(mainNav(page),'Questions').click();
  await action(feed,'Active').click();
  await expect(action(feed,'Active')).toHaveAttribute('aria-pressed','true');
  await expectFeedOrder(page,'SO Python Answered Active','SO Python Unanswered Recent');
});
