import { selectChoice } from './support/public-controls';
import { test, expect, entry, openQuestion, region, answer, output, beforeText } from './helpers';
import {  } from './fixtures/data';

// requirement: REQ-4.7

test('REQ-4.7: Switch to latest-modified answers', async ({ page, browser }, info) => {
  await entry(page); await openQuestion(page,'SO Answer Sorting Question');
  const sort=page.getByRole('combobox',{name:'Sorted by',exact:true});
  await selectChoice(sort, {label:'Highest score'});
  await beforeText(region(page,'Answers'),'Highest score answer: use bounded retries.','Recent answer: log each retry attempt.');
  await selectChoice(sort, {label:'Date modified'});
  await beforeText(region(page,'Answers'),'Recent answer: log each retry attempt.','Highest score answer: use bounded retries.');
  await expect(output(page,'Answer count')).toHaveText('2');
  await expect(page.getByRole('heading',{name:'SO Answer Sorting Question',exact:true})).toBeVisible();
});
