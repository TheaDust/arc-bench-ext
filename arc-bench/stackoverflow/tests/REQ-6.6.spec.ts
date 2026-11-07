import { expectVisibleText } from './support/public-controls';
import { test, expect, entry, action, region, mainNav, post, visitFeed } from './helpers';
import { body } from './fixtures/data';

// requirement: REQ-6.6

test('REQ-6.6: Follow a python question from tag discovery', async ({ page, browser }, info) => {
  await entry(page); await action(mainNav(page),'Tags').click();
  await action(region(region(page,'Tags'),'Tag python'),'python').click();
  let opened = false;
  await visitFeed(page, async feed => {
    const target = action(feed,'SO Python Unanswered Recent');
    if (await target.isVisible()) {
      await target.click();
      opened = true;
      return true;
    }
  });
  expect(opened, 'Tag discovery must contain the selected question').toBe(true);
  await expect(page.getByRole('heading',{name:'SO Python Unanswered Recent',exact:true})).toBeVisible();
  await expect(post(page)).toContainText(body); await expectVisibleText(post(page), 'python');
  await expect(action(page.getByRole('banner'),'Log in')).toBeVisible();
});
