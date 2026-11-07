import { test, expect } from '@playwright/test';
import { postAction, postAuthor } from '../arc-bench/stackoverflow/tests/helpers';
import { expectMultipleColumns } from '../arc-bench/keep/tests/helpers';

test('question controls exclude both answer and comment descendants', async ({ page }) => {
  await page.setContent(`<section aria-label="Question post">
    <button>Up vote</button><section aria-label="Author">Question author</section>
    <section aria-label="Comments"><button>Up vote</button></section>
    <section aria-label="Answers"><section aria-label="Answer by Helpful User">
      <button>Up vote</button><section aria-label="Author">Answer author</section>
    </section></section>
  </section>`);
  const questionVote = await postAction(page, 'Up vote');
  await expect(questionVote).toHaveCount(1);
  await expect(await postAuthor(page)).toHaveText('Question author');
  await questionVote.click();
});

test('duplicate question actions remain ambiguous', async ({ page }) => {
  await page.setContent('<section aria-label="Question post"><button>Up vote</button><button>Up vote</button></section>');
  await expect(postAction(page, 'Up vote')).rejects.toThrow(/Exactly one control/);
});

test('duplicate question authors remain ambiguous', async ({ page }) => {
  await page.setContent('<section aria-label="Question post"><section aria-label="Author">One</section><section aria-label="Author">Two</section></section>');
  await expect(postAuthor(page)).rejects.toThrow(/Exactly one control/);
});

test('grid layout oracle accepts columns and rejects a single column', async ({ page }) => {
  await page.setContent('<div id="layout" style="display:grid;grid-template-columns:100px 100px;gap:10px"><section aria-label="Alpha">Alpha</section><section aria-label="Beta">Beta</section></div>');
  const notes=['Alpha','Beta'].map(name=>page.getByRole('region',{name,exact:true}));
  await expectMultipleColumns(notes);
  await page.locator('#layout').evaluate(element => element.style.gridTemplateColumns = '100px');
  await expect(expectMultipleColumns(notes)).rejects.toThrow();
  await notes[1].evaluate(element => element.style.marginLeft = '10px');
  await expect(expectMultipleColumns(notes)).rejects.toThrow();
});
