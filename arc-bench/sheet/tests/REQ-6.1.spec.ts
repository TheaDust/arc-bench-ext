// requirement: REQ-6.1
import { test, type Page } from '@playwright/test';
import { commitCellThroughFormulaBar, configureNumberValidation } from './support/e2e';
import { cutTo, expectCells, expectNumberRejected, expectRangeRejection, history, openWorksheet,
  type Cells } from './support/transactional-cut';

function before(last: string): Cells {
  return {
    A1: '10', B1: '20', A2: ['=A1+B1', 30], B2: last,
    D1: '1', E1: '2', D2: '3', E2: '4', G1: ['=A2+D2', 33], H1: ['=G1+E2', 37],
  };
}

const moved: Cells = {
  A1: '', B1: '', A2: '', B2: '', D1: '10', E1: '20', D2: ['=D1+E1', 30], E2: '60',
  G1: ['=D2+D2', 60], H1: ['=G1+E2', 120], H2: '',
};

async function prepare(page: Page, last: string) {
  await openWorksheet(page, ['10\t20\t\t1\t2\t\t=A2+D2\t=G1+E2', `=A1+B1\t${last}\t\t3\t4\t\t\t`].join('\n'));
  await expectCells(page, before(last));
  await configureNumberValidation(page, 'E2', 'E2', '0', '100');
}

test('REQ-6.1: Refuse a final-cell validation failure without consuming undo', async ({ page }) => {
  await prepare(page, '120');
  await commitCellThroughFormulaBar(page, 'H2', 'History marker');
  await cutTo(page, 'D1');
  await expectRangeRejection(page, 100);
  await expectCells(page, { ...before('120'), H2: 'History marker' });
  await history(page, 'Undo');
  await expectCells(page, { ...before('120'), H2: '' });

  // A refused mutation must also preserve the redo entry created by that Undo.
  await cutTo(page, 'D1');
  await expectRangeRejection(page, 100);
  await expectCells(page, { ...before('120'), H2: '' });
  await history(page, 'Redo');
  await expectCells(page, { ...before('120'), H2: 'History marker' });
  await page.reload();
  await expectCells(page, { ...before('120'), H2: 'History marker' });
  await expectNumberRejected(page, 'E2', 101, 100);
  await expectCells(page, { ...before('120'), H2: 'History marker' });
});

test('REQ-6.1: Undo and redo a validated move with chained external dependencies', async ({ page }) => {
  await prepare(page, '60');
  await cutTo(page, 'D1');
  await expectCells(page, moved);
  await history(page, 'Undo');
  await expectCells(page, { ...before('60'), H2: '' });
  await history(page, 'Redo');
  await expectCells(page, moved);
  await page.reload();
  await expectCells(page, moved);
  await expectNumberRejected(page, 'E2', 101, 100);
  await expectCells(page, moved);
});
