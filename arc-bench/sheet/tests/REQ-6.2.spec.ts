// requirement: REQ-6.2
import { test, type Page } from '@playwright/test';
import { commitCellThroughFormulaBar, configureNumberValidation } from './support/e2e';
import { cutTo, expectCells, expectNumberRejected, expectRangeRejection, history, openWorksheet, type Cells } from './support/transactional-cut';

function before(a1: number): Cells {
  return {
    A1: String(a1), B1: '7', C1: '90', A2: ['=A1+$E$1', a1 + 10], B2: ['=A2+$B$1', a1 + 17],
    C2: '9', E1: '10', F1: ['=A2+B2+C1', 2 * a1 + 117], G1: ['=F1*2', 4 * a1 + 234],
  };
}

function after(a1: number): Cells {
  return {
    A1: '', A2: '', B1: String(a1), C1: '7', B2: ['=B1+$E$1', a1 + 10], C2: ['=B2+$C$1', a1 + 17],
    E1: '10', F1: ['=B2+C2+C1', 2 * a1 + 34], G1: ['=F1*2', 4 * a1 + 68],
  };
}

async function prepare(page: Page) {
  await openWorksheet(page, ['4\t7\t90\t\t10\t=A2+B2+C1\t=F1*2', '=A1+$E$1\t=A2+$B$1\t9\t\t\t\t'].join('\n'));
  await expectCells(page, before(4));
}

async function roundTrip(page: Page, a1: number) {
  await cutTo(page, 'B1');
  await expectCells(page, after(a1));
  await history(page, 'Undo');
  await expectCells(page, before(a1));
  await history(page, 'Redo');
  await expectCells(page, after(a1));
  await page.reload();
  await expectCells(page, after(a1));
}

test('REQ-6.2: Move an overlapping rectangle without chasing rewritten references', async ({ page }) => {
  await prepare(page);
  await roundTrip(page, 4);
});

test('REQ-6.2: Validate an overlapping move against its calculated final values', async ({ page }) => {
  await prepare(page);
  await configureNumberValidation(page, 'C2', 'C2', '0', '20');
  await cutTo(page, 'B1');
  await expectRangeRejection(page, 20);
  await expectCells(page, before(4));

  await commitCellThroughFormulaBar(page, 'A1', '2');
  await expectCells(page, before(2));
  await roundTrip(page, 2);
  await expectNumberRejected(page, 'C2', 21, 20);
  await expectCells(page, after(2));
});
