import { test, expect } from '@playwright/test';
import { expectCells } from '../arc-bench/sheet/tests/support/transactional-cut';
import { expectApproval, expectOldActionBlocked } from '../arc-bench/github/tests/support/confirmation-guards';

test('Sheet checks raw formula identity even when two expressions calculate the same value', async ({ page }) => {
  await page.setContent(`
    <input aria-label="Formula bar">
    <div role="grid" aria-label="Worksheet grid"><div role="row">
      <div role="gridcell" aria-label="C2" onclick="document.querySelector('input').value='=B2+$C$1'">21.0</div>
    </div></div>
  `);
  await expectCells(page, { C2: ['=B2+$C$1', 21] });
  await expect(expectCells(page, { C2: ['=A2+$B$1', 21] })).rejects.toThrow();
  await expect(expectCells(page, { C2: ['=B2+$C$1', 19] })).rejects.toThrow();
});

test('GitHub approval observation cannot borrow Current from a different commit', async ({ page }) => {
  await page.setContent(`
    <table aria-label="Review history"><tbody>
      <tr><td>pr-reviewer</td><td>old-head</td><td>Approve</td><td>Stale</td></tr>
      <tr><td>pr-reviewer</td><td>new-head</td><td>Approve</td><td>Current</td></tr>
    </tbody></table>
  `);
  await expectApproval(page, 'old-head', 'Stale');
  await expectApproval(page, 'new-head', 'Current');
  await expect(expectApproval(page, 'old-head', 'Current')).rejects.toThrow();
});

test('GitHub observes both submission-time refusal and proactive invalidation', async ({ page }) => {
  await page.setContent(`
    <button onclick="document.getElementById('result').hidden=false; this.disabled=true">Confirm merge</button>
    <div id="result" role="alert" aria-label="Merge blocked" hidden>Merge permission required</div>
  `);
  await expectOldActionBlocked(page, 'Confirm merge', 'Merge permission required');
  await page.setContent('<div role="alert" aria-label="Review blocked">Compare branch changed</div>');
  await expectOldActionBlocked(page, 'Submit review', 'Compare branch changed');
  await expect(expectOldActionBlocked(page, 'Submit review', 'Merge permission required')).rejects.toThrow();
});
