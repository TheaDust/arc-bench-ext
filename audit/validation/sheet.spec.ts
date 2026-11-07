import { test, expect, type Page } from '@playwright/test';
import { expectText, expectCellText, expectCsvValues, csvCells, expectCalculatedNumber } from '../../arc-bench/sheet/tests/support/observations';
import { commitCellThroughFormulaBar, commitCellThroughGrid, expectBlankWorkbook,
  expectSelectedRange, selectCellRange } from '../../arc-bench/sheet/tests/support/e2e';

test('sheet CSV accepts equivalent quoting, BOM and record separators', () => {
  expectCsvValues('\uFEFF"Name","Count","Blank"\r\n"Alex","007",""\r\n', 'Name,Count,Blank\nAlex,007,');
});

test('sheet CSV decodes escaped quotes and preserves field line breaks', () => {
  expect(csvCells('Name,Note\r\nAlex,"They said ""hello""\r\nnext line"\r\n')).toEqual([
    ['Name', 'Note'], ['Alex', 'They said "hello"\nnext line'],
  ]);
});

test('sheet CSV preserves UTF-8 Chinese text with quote and comma content', () => {
  expectCsvValues('Name,Note,Count\r\n张三,"中文, They said ""hello""",007',
    '"Name","Note","Count"\n"张三","中文, They said ""hello""","007"');
  expect(() => expectCsvValues('张三,English text,007', '张三,English text 中文,007')).toThrow();
});

test('sheet CSV numeric equivalence applies only to known calculated cells', () => {
  expectCsvValues('007,"4.00"', '007,4', [[0, 1]]);
  expect(() => expectCsvValues('7,"4.00"', '007,4', [[0, 1]])).toThrow();
  expect(() => expectCsvValues('007,"5.00"', '007,4', [[0, 1]])).toThrow();
  expect(() => expectCsvValues('007,"4.00"', '007,4')).toThrow();
});

test('sheet calculated numbers permit presentation differences and reject wrong values or units', async ({ page }) => {
  for (const value of ['1800', '1800.00', '1,800', '1.8e3']) {
    await page.setContent(`<div role="gridcell" aria-label="B2">${value}</div>`);
    await expectCalculatedNumber(page.getByRole('gridcell', { name: 'B2', exact: true }), 1800);
  }
  for (const value of ['', '1801', '1,80', '1800 kg']) {
    await page.setContent(`<div role="gridcell" aria-label="B2">${value}</div>`);
    await expect(expectCalculatedNumber(page.getByRole('gridcell', { name: 'B2', exact: true }), 1800)).rejects.toThrow();
  }
});

for (const [name, actual, expected] of [
  ['wrong numeric result', '2,5', '2,4'],
  ['lost leading zero', 'Name,Count\nAlex,7', 'Name,Count\nAlex,007'],
  ['lost empty column', 'a,b', 'a,,b'],
  ['removed hidden source row', 'Region,Sales\nEast,100', 'Region,Sales\nEast,100\nNorth,200'],
  ['flattened quoted newline', '"first next"', '"first\nnext"'],
  ['added empty row', 'a\n\n', 'a\n'],
  ['removed significant space', '"firstnext"', '"first next"'],
] as const) {
  test(`sheet CSV rejects ${name}`, () => expect(() => expectCsvValues(actual, expected)).toThrow());
}

for (const csv of ['a,"unfinished', '"a"unexpected,b', 'a"b,c']) {
  test(`sheet CSV rejects malformed quoting ${JSON.stringify(csv)}`, () => expect(() => csvCells(csv)).toThrow());
}

test('sheet presence permits duplicate visible values while actions stay unique', async ({ page }) => {
  await page.setContent('<h1>Workbook name</h1><span>Workbook name</span><button>Save</button><button>Save</button>');
  await expectText(page, 'Workbook name', { exact: true });
  await expect(page.getByRole('button', { name: 'Save', exact: true }).click()).rejects.toThrow();
});

test('sheet presence excludes hidden-only values', async ({ page }) => {
  await page.setContent('<span hidden>Workbook name</span><p>Another workbook</p>');
  await expect(expectText(page, 'Workbook name', { exact: true })).rejects.toThrow();
});

test('sheet exact cell text keeps meaningful newline and spaces', async ({ page }) => {
  await page.setContent('<div role="gridcell" aria-label="B3">They said"hello"\nnext line</div>');
  await expectCellText(page.getByRole('gridcell', { name: 'B3', exact: true }), 'They said"hello"\nnext line');
  await page.setContent('<div role="gridcell" aria-label="B3">They said"hello" next line</div>');
  await expect(expectCellText(page.getByRole('gridcell', { name: 'B3', exact: true }), 'They said"hello"\nnext line')).rejects.toThrow();
});

async function editingFixture(page: Page, accepted: boolean): Promise<void> {
  await page.setContent(`<table role="grid" aria-label="Worksheet grid"><tbody><tr><td role="gridcell" aria-label="A1">4</td></tr></tbody></table><input aria-label="Formula bar"><script>
    const cell = document.querySelector('[role=gridcell]');
    const bar = document.querySelector('input');
    let raw = '4';
    cell.addEventListener('click', () => { bar.value = raw; });
    bar.addEventListener('keydown', event => {
      if (event.key === 'Enter' && ${accepted}) raw = bar.value;
    });
    cell.addEventListener('dblclick', () => {
      const editor = document.createElement('input');
      editor.setAttribute('aria-label', 'Edit A1'); editor.value = raw; cell.append(editor);
      editor.addEventListener('keydown', event => {
        if (event.key === 'Enter') { if (${accepted}) raw = editor.value; editor.remove(); }
      });
    });
  </script>`);
}

for (const [name, commit] of [['formula bar', commitCellThroughFormulaBar], ['inline grid', commitCellThroughGrid]] as const) {
  test(`sheet ${name} accepts a different formula with the same displayed result`, async ({ page }) => {
    await editingFixture(page, true);
    await commit(page, 'A1', '=2+2');
    await expect(page.getByRole('gridcell', { name: 'A1', exact: true })).toHaveText('4');
    await commit(page, 'A1', '=2+2');
  });
  test(`sheet ${name} still rejects an ignored raw formula change`, async ({ page }) => {
    await editingFixture(page, false);
    await expect(commit(page, 'A1', '=2+2')).rejects.toThrow();
  });
}

const blank = (secondTab = '', secondValue = '', secondSelected = 'false') => `<div role="tab" aria-selected="true">Sheet1</div>${secondTab}<table role="grid" aria-label="Worksheet grid" aria-multiselectable="true"><tbody><tr><td role="gridcell" aria-label="A1" aria-selected="true"></td><td role="gridcell" aria-label="B1" aria-selected="${secondSelected}">${secondValue}</td></tr></tbody></table>`;

test('sheet blank workbook accepts exactly one genuinely blank selected worksheet', async ({ page }) => {
  await page.setContent(blank());
  await expectBlankWorkbook(page);
});

for (const [name, html] of [
  ['extra worksheet', blank('<div role="tab">Sheet2</div>')],
  ['data outside A1', blank('', 'Unwanted data')],
  ['extra selected cell', blank('', '', 'true')],
  ['missing declared negative selected state', blank('', '', '')],
] as const) {
  test(`sheet blank workbook rejects ${name}`, async ({ page }) => {
    await page.setContent(html);
    await expect(expectBlankWorkbook(page)).rejects.toThrow();
  });
}

test('sheet full selection rejects an extra selected cell outside the declared rectangle', async ({ page }) => {
  await page.setContent('<table role="grid" aria-label="Worksheet grid" aria-multiselectable="true"><tbody><tr><td role="gridcell" aria-label="A1" aria-selected="true"></td><td role="gridcell" aria-label="B1" aria-selected="true"></td><td role="gridcell" aria-label="C1" aria-selected="false"></td></tr></tbody></table>');
  await expectSelectedRange(page, 'A1', 'B1');
  await page.getByRole('gridcell', { name: 'C1', exact: true }).evaluate(cell => cell.setAttribute('aria-selected', 'true'));
  await expect(expectSelectedRange(page, 'A1', 'B1')).rejects.toThrow();
});

for (const variant of ['hidden', 'unmounted']) {
  test(`sheet range action accepts a ${variant} filtered middle row`, async ({ page }) => {
    await page.setContent(`<table role="grid" aria-label="Worksheet grid" aria-multiselectable="true"><tbody><tr><td role="gridcell" aria-label="A1" aria-selected="false">Header</td></tr>${variant === 'hidden' ? '<tr hidden><td role="gridcell" aria-label="A2" aria-selected="false">Filtered row</td></tr>' : ''}<tr><td role="gridcell" aria-label="A3" aria-selected="false">Visible row</td></tr></tbody></table><script>document.addEventListener('mouseup',()=>{document.querySelectorAll('[role=gridcell]').forEach(cell=>cell.setAttribute('aria-selected','true'))})</script>`);
    await selectCellRange(page, 'A1', 'A3');
  });
}
