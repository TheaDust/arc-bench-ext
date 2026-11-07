import { test, expect } from '@playwright/test';
import { formField, selectChoice, expectSelectedChoice, expectChoiceLabels, expectVisibleText } from './public-controls';
import * as questions from '../arc-bench/stackoverflow/tests/helpers';
import * as travel from '../arc-bench/ctrip/tests/helpers';
import * as store from '../arc-bench/prestashop/tests/helpers';
import { selectChoice as sheetChoice } from '../arc-bench/sheet/tests/support/public-controls';
import { selectChoice as gitChoice } from '../arc-bench/github/tests/support/public-controls';
import { selectChoice as railChoice } from '../arc-bench/12306/tests/support/public-controls';
import { selectChoice as storeChoice } from '../arc-bench/prestashop/tests/support/public-controls';

for (const [name, select] of Object.entries({ sheetChoice, gitChoice, railChoice, storeChoice, selectChoice })) {
  test(`${name}: native select uses labels rather than private values or option text`, async ({ page }) => {
    await page.setContent('<label for="sort">Sort</label><select id="sort"><option label="Newest" value="private-a" aria-hidden="true">&#8288;</option><option label="Active" value="private-b" aria-hidden="true">&#8288;</option></select>');
    const control = page.getByRole('combobox', { name: 'Sort', exact: true });
    await expectChoiceLabels(control, ['Newest', 'Active']);
    await select(control, { label: 'Active' });
    await expectSelectedChoice(control, 'Active');
    await expect(control).toHaveValue('private-b');
  });

  test(`${name}: popup options may be outside the combobox subtree`, async ({ page }) => {
    await page.setContent(`<label id="label">Sort</label>
      <button role="combobox" aria-labelledby="label" aria-controls="options" onclick="document.getElementById('options').hidden=false">Newest</button>
      <div id="options" role="listbox" hidden>
        <button role="option" onclick="document.querySelector('[role=combobox]').textContent='Newest';this.parentElement.hidden=true">Newest</button>
        <button role="option" onclick="document.querySelector('[role=combobox]').textContent='Active';this.parentElement.hidden=true">Active</button>
      </div>`);
    const control = page.getByRole('combobox', { name: 'Sort', exact: true });
    await select(control, { label: 'Active' });
    await expectSelectedChoice(control, 'Active');
  });
}

test('selection rejects a wrong label instead of taking the first option', async ({ page }) => {
  await page.setContent('<select aria-label="Sort"><option>Newest</option><option>Active</option></select>');
  await expect(selectChoice(page.getByRole('combobox'), { label: 'Oldest' })).rejects.toThrow();
});

test('selection preserves duplicate ambiguity', async ({ page }) => {
  await page.setContent('<select aria-label="Sort"><option>Newest</option><option>Newest</option></select>');
  await expect(selectChoice(page.getByRole('combobox'), { label: 'Newest' })).rejects.toThrow();
});

test('selection rejects a textbox with a matching name', async ({ page }) => {
  await page.setContent('<input aria-label="Sort" value="Newest">');
  await expect(selectChoice(page.getByRole('textbox'), { label: 'Newest' })).rejects.toThrow();
});

for (const unavailable of ['hidden', 'disabled']) {
  test(`native selection rejects an ${unavailable} option`, async ({ page }) => {
    await page.setContent(`<select aria-label="Sort"><option>Newest</option><option ${unavailable}>Active</option></select>`);
    await expect(selectChoice(page.getByRole('combobox'), { label: 'Active' })).rejects.toThrow();
  });
}

for (const [name, field] of [['shared', formField], ['questions', questions.field], ['travel', travel.field]] as const) {
  test(`${name}: native masked password keeps an exact accessible label`, async ({ page }) => {
    await page.setContent('<label for="pw">Password<span aria-hidden="true"> *</span></label><input type="password" id="pw">');
    await field(page, 'Password').fill('Password123!');
    await expect(field(page, 'Password')).toHaveAttribute('type', 'password');
    await expect(field(page, 'Password')).toHaveAccessibleName('Password');
  });

  test(`${name}: a password control with a different accessible name is rejected`, async ({ page }) => {
    await page.setContent('<label for="pw">Password</label><input type="password" id="pw" aria-label="Other password">');
    await expect(field(page, 'Password')).toHaveCount(0);
  });
}

test('visible text presence accepts text, links and repeated copies but rejects hidden-only text', async ({ page }) => {
  await page.setContent('<span hidden>node.js</span><span>node.js</span><a href="#tag">node.js</a>');
  await expectVisibleText(page, 'node.js');
  await expect(expectVisibleText(page, 'python')).rejects.toThrow();
});

test('accepting native password controls does not accept an initially unmasked login', async ({ page }) => {
  await page.setContent('<nav aria-label="Global navigation"><button onclick="this.hidden=true">Sign in</button></nav><input aria-label="Email"><input aria-label="Password" type="text"><button>Sign in</button>');
  await expect(store.loginEmail(page, 'customer@example.test', 'ShopPass123!')).rejects.toThrow();
});

for (const nested of [true, false]) {
  test(`post ownership is independent of Answers nesting: ${nested}`, async ({ page }) => {
    const answers = '<section role="region" aria-label="Answers"><section role="region" aria-label="Answer by Helpful User"><output aria-label="Score">9</output><section role="region" aria-label="Comments"><section role="region" aria-label="Comment answer-only">answer-only</section></section></section></section>';
    await page.setContent(`<section role="region" aria-label="Question post"><output aria-label="Score">3</output><section role="region" aria-label="Comments"><section role="region" aria-label="Comment question-only">question-only</section></section>${nested ? answers : ''}</section>${nested ? '' : answers}`);
    await questions.expectNumeric(questions.post(page), 'Score', 3);
    await expect(await questions.comment(questions.post(page), 'question-only')).toBeVisible();
    await expect(await questions.comment(questions.post(page), 'answer-only')).toHaveCount(0);
    await expect(await questions.comment(questions.answer(page), 'answer-only')).toBeVisible();
  });
}

test('owned post outputs still reject genuine duplicate scores', async ({ page }) => {
  await page.setContent('<section role="region" aria-label="Question post"><output aria-label="Score">3</output><output aria-label="Score">4</output></section>');
  await expect(questions.numeric(questions.post(page), 'Score')).rejects.toThrow();
});

test('feed ordering follows later pages after unrelated UI-created records', async ({ page }) => {
  await page.setContent(`<section role="region" aria-label="Question feed"><div id="items"><section role="region" aria-label="Question Runtime">Runtime</section></div><button onclick="document.getElementById('items').innerHTML='<section role=&quot;region&quot; aria-label=&quot;Question Recent&quot;>Recent</section><section role=&quot;region&quot; aria-label=&quot;Question Active&quot;>Active</section>';this.disabled=true">Next page</button></section>`);
  await questions.expectFeedOrder(page, 'Recent', 'Active');
});

test('feed ordering fails if the required identities are reversed', async ({ page }) => {
  await page.setContent('<section role="region" aria-label="Question feed"><section role="region" aria-label="Question Active">Active</section><section role="region" aria-label="Question Recent">Recent</section><button disabled>Next page</button></section>');
  await expect(questions.expectFeedOrder(page, 'Recent', 'Active')).rejects.toThrow();
});

test('business clock keeps timers and performance moving', async ({ page }) => {
  await questions.freezeClock(page, '2026-07-21T12:02:00Z');
  await page.goto('data:text/html,<title>clock</title>');
  const result = await page.evaluate(async () => {
    const start = performance.now();
    await new Promise(resolve => setTimeout(resolve, 25));
    return { at: Date.now(), elapsed: performance.now() - start };
  });
  expect(result.at).toBe(Date.parse('2026-07-21T12:02:00Z'));
  expect(result.elapsed).toBeGreaterThan(0);
});
